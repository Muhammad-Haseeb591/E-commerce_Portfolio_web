import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { IoArrowBack } from "react-icons/io5";
import axios from "axios";
import { formatAmount, getCurrencyForCountry, getAllowedPaymentMethods } from "../utils/formatCurrency";
import { getShippingFee } from "../utils/shipping";
import { getCouponDiscount } from "../utils/coupons";
import { clearCart } from "../assets/components/redux_Toolkit/cartSlice";

const inputClass =
  "w-full bg-white border border-[#333333] rounded-lg px-4 py-3 text-[#333333] placeholder-gray-400 focus:outline-none focus:border-[#333333] focus:ring-1 focus:ring-[#333333] transition text-sm";

const labelClass = "block text-xs font-semibold text-[#333333]/70 uppercase tracking-widest mb-1.5";

const Required = () => <span className="text-red-500">*</span>;

const CITY_OPTIONS = [
  "Lahore", "Faisalabad", "Karachi", "Islamabad", "Rawalpindi",
  "Multan", "Gujranwala", "Sialkot", "Peshawar", "Quetta", "Other city",
];

const ORDERS_API_URL = "http://localhost:3000/orders";

const CustomToast = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-[toastIn_0.25s_ease-out]">
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      <div className="bg-white border border-gray-200 shadow-xl rounded-2xl w-[300px] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white text-xs font-bold"
            style={{ backgroundColor: "#333333" }}
          >
            ✓
          </div>
          <span className="text-[11px] font-bold tracking-widest text-gray-800 uppercase">
            My Store
          </span>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm text-gray-700 font-medium">{toast.message}</p>
        </div>
        <div className="px-4 pb-3">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: "#333333" }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const PRODUCTS = location.state?.items || [];

  // ── Country / currency / payment rules — decided on Cart page,
  // received here. Falls back safely if someone lands here directly.
  const country = location.state?.country || "PK";
  const currency = location.state?.currency || getCurrencyForCountry(country);
  const allowedPaymentMethods = location.state?.allowedPaymentMethods || getAllowedPaymentMethods(country);
  const codAllowed = allowedPaymentMethods.includes("cod");

  const SUBTOTAL = PRODUCTS.reduce(
    (sum, p) => sum + Number(p.price) * (p.quantity || p.qty || 1),
    0
  );

  // ── Same shipping logic/constants as Cart.jsx — imported, not
  // duplicated, so this NEVER shows a different fee than the cart did.
  const SHIPPING = getShippingFee(SUBTOTAL);

  const [paymentMethod, setPaymentMethod] = useState(codAllowed ? "rs" : "us");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", state: "", zip: "", country,
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [toast, setToast] = useState(null);

  // ── Coupon ──
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount, label }
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const result = getCouponDiscount(couponInput, SUBTOTAL);
    if (!result.valid) {
      setCouponError("Invalid or expired coupon code.");
      setAppliedCoupon(null);
      return;
    }
    setCouponError("");
    setAppliedCoupon(result);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const discount = appliedCoupon?.discount || 0;

  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const cityRef = useRef(null);
  const zipRef = useRef(null);
  const fieldRefs = {
    firstName: firstNameRef,
    lastName: lastNameRef,
    email: emailRef,
    phone: phoneRef,
    address: addressRef,
    city: cityRef,
    zip: zipRef,
  };

  // ── No tax — Subtotal - Discount + Shipping ──
  const TOTAL = PRODUCTS.length ? Math.max(0, SUBTOTAL - discount) + SHIPPING : 0;

  const formatPrice = (amountPKR) => formatAmount(amountPKR, currency);

  const formatCard = (val) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.email = "Valid email required";

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!form.phone.trim()) e.phone = "Required";
    else if (phoneDigits.length < 7) e.phone = "Enter a valid phone number";

    if (!form.address.trim()) e.address = "Required";
    if (!form.city) e.city = "Select a city";

    if (!form.zip.trim()) e.zip = "Required";
    else if (!/^\d+$/.test(form.zip.trim())) e.zip = "Numbers only";

    // COD is never valid outside Pakistan — extra safety net even if
    // someone tampers with client state.
    if (paymentMethod === "rs" && !codAllowed) {
      e.payment = "Cash on Delivery is only available in Pakistan.";
    }

    if (paymentMethod === "us") {
      if (cardNumber.replace(/\s/g, "").length < 16) e.cardNumber = "Enter 16-digit card number";
      if (!expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = "MM/YY required";
      if (cvv.length < 3) e.cvv = "3 or 4 digits required";
    }
    return e;
  };

  const focusFirstError = (errs) => {
    const order = ["firstName", "lastName", "email", "phone", "address", "city", "zip"];
    const firstField = order.find((f) => errs[f]);
    const ref = firstField && fieldRefs[firstField];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      ref.current.focus();
    }
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      focusFirstError(e);
      setOrderError(e.payment || "Please fill in the highlighted required fields.");
      return;
    }

    setOrderError("");
    setPlacingOrder(true);

    const orderPayload = {
      email: form.email,
      shippingAddress: {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country,
      },
      items: PRODUCTS.map((p) => ({
        productId: p.productId || p._id,
        name: p.name,
        price: p.price,
        image: p.images?.[0] || p.image || "", // ← FIX: snapshot the image used at purchase time
        color: p.color || "",
        size: p.size ?? null,
        quantity: p.quantity || p.qty || 1,
      })),
      currency,
      paymentMethod,
      subtotal: SUBTOTAL,
      shippingFee: SHIPPING,
      couponCode: appliedCoupon?.code || null,
      discount,
      totalAmount: TOTAL, // always in PKR (base) — backend stores/settles in PKR
    };

    try {
      const res = await axios.post(ORDERS_API_URL, orderPayload, { withCredentials: true });

      // ── Order confirm ho gaya — ab hi cart clear karo (redux + localStorage
      // dono, clearCart reducer ke andar localStorage bhi khud clear kar deta hai) ──
      dispatch(clearCart());

      setToast({ message: "Order placed successfully!" });
      setTimeout(() => {
        navigate("/new", { state: { order: res.data.order } });
      }, 1200);
    } catch (err) {
      setOrderError(
        err.response?.data?.message || "Order place karte waqt masla aaya. Dobara try karein."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const setField = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  const fieldClass = (name) =>
    `${inputClass} ${errors[name] ? "border-red-500 ring-1 ring-red-200" : ""}`;

  const handlePhoneChange = (val) => {
    const cleaned = val.replace(/[^\d+\s-]/g, "");
    setField("phone", cleaned);
  };

  const handleZipChange = (val) => {
    setField("zip", val.replace(/\D/g, ""));
  };

  const ProductMeta = ({ color, size }) => {
    if (!color && !size) return null;
    return (
      <p className="text-gray-500 text-xs">
        {color && <span>{color}</span>}
        {color && size && <span> · </span>}
        {size && <span>Size {size}</span>}
      </p>
    );
  };

  if (!submitted && PRODUCTS.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-4 text-gray-400">
          <p className="text-[#333333] font-medium">Cart khali hai, checkout nahi ho sakta</p>
          <button
            onClick={() => navigate("/cart")}
            className="bg-[#333333] hover:bg-[#1f1f1f] active:scale-[0.98] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all cursor-pointer"
          >
            Cart par jayein
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-[#333333] rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-white">✓</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-3">Order Confirmed!</h2>
          <p className="text-gray-600 mb-2">Thanks, {form.firstName}! Your order has been placed.</p>
          <p className="text-gray-500 text-sm mb-8">
            A confirmation will be sent to{" "}
            <span className="text-[#333333] font-medium break-all">{form.email}</span>.
          </p>
          <div className="bg-white border border-[#333333] rounded-2xl p-5 text-left mb-6">
            <p className="text-gray-500 text-sm mb-1">Payment method</p>
            <p className="text-[#333333] font-semibold capitalize">
              {paymentMethod === "us" ? "💳 Credit / Debit Card" : "💵 Cash on Delivery"}
            </p>
            <p className="text-gray-500 text-sm mt-3 mb-1">Total charged</p>
            <p className="text-[#333333] font-bold text-xl">{formatPrice(TOTAL)}</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-[#333333] text-sm transition underline underline-offset-4 cursor-pointer"
          >
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#333333]">
      <CustomToast toast={toast} onClose={() => setToast(null)} />

      <header className="border-b border-[#333333] px-4 sm:px-6 py-4 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link
            to="/cart"
            className="flex items-center justify-center size-10 shrink-0 text-[#333333] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            aria-label="Back to cart"
          >
            <IoArrowBack className="size-5" />
          </Link>

          <div className="flex justify-center min-w-0 flex-1">
            <img
              className="logo-responsive h-[28px] sm:h-[32px] w-auto object-contain"
              src="//insignia.com.pk/cdn/shop/files/final_logo_insignia-01_2847a8f6-7ff7-4e81-ab09-44d3d3fe386e.png?v=1686553684&width=600"
              alt="Insignia PK"
              srcSet="//insignia.com.pk/cdn/shop/files/final_logo_insignia-01_2847a8f6-7ff7-4e81-ab09-44d3d3fe386e.png?v=1686553684&width=200 200w, //insignia.com.pk/cdn/shop/files/final_logo_insignia-01_2847a8f6-7ff7-4e81-ab09-44d3d3fe386e.png?v=1686553684&width=300 300w"
              loading="eager"
            />
          </div>
        </div>
      </header>

      <div className="lg:hidden border-b border-[#333333] bg-gray-50">
        <button
          onClick={() => setSummaryOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm cursor-pointer"
        >
          <span className="flex items-center gap-2 text-[#333333] font-medium">
            🛒 {summaryOpen ? "Hide" : "Show"} order summary
          </span>
          <span className="flex items-center gap-2 text-[#333333] font-bold">
            {formatPrice(TOTAL)}
            <span className="text-gray-500 text-xs transition-transform" style={{ transform: summaryOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
          </span>
        </button>
        {summaryOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-[#333333] pt-4">
            {PRODUCTS.map((p, i) => (
              <div key={`${p._id || p.productId}-${p.size || "nosize"}-${i}`} className="flex items-center gap-3">
                <img
                  src={p.images?.[0] || p.image || ""}
                  alt={p.name}
                  className="w-10 h-10 bg-gray-100 border border-[#333333] rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#333333] truncate">{p.name}</p>
                  <ProductMeta color={p.color} size={p.size} />
                  <p className="text-gray-500 text-xs">Qty: {p.quantity || p.qty}</p>
                </div>
                <p className="text-sm font-semibold text-[#333333] shrink-0">
                  {formatPrice(p.price * (p.quantity || p.qty))}
                </p>
              </div>
            ))}
            <div className="border-t border-[#333333] pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="text-[#333333]">{formatPrice(SUBTOTAL)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount ({appliedCoupon.code})</span><span>-{formatPrice(discount)}</span></div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={SHIPPING === 0 ? "text-green-600 font-semibold" : "text-[#333333]"}>
                  {SHIPPING === 0 ? "FREE" : formatPrice(SHIPPING)}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1 text-[#333333]"><span>Total</span><span>{formatPrice(TOTAL)}</span></div>
            </div>
          </div>
        )}
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-10 lg:grid lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="space-y-8">

          {orderError && (
            <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl px-4 py-3">
              {orderError}
            </div>
          )}

          <section>
            <h2 className="text-base sm:text-lg font-bold mb-5 flex items-center gap-2 text-[#333333]">
              <span className="w-7 h-7 bg-[#333333] text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">1</span>
              Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name <Required /></label>
                <input
                  ref={firstNameRef}
                  type="text" placeholder="First name" value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  className={fieldClass("firstName")}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className={labelClass}>Last name <Required /></label>
                <input
                  ref={lastNameRef}
                  type="text" placeholder="Last name" value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  className={fieldClass("lastName")}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Email <Required /></label>
                <input
                  ref={emailRef}
                  type="email" placeholder="you@example.com" value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className={fieldClass("email")}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Phone <Required /></label>
                <input
                  ref={phoneRef}
                  type="tel" inputMode="tel" placeholder="+92 300 1234567" value={form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={fieldClass("phone")}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold mb-5 flex items-center gap-2 text-[#333333]">
              <span className="w-7 h-7 bg-[#333333] text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">2</span>
              Shipping Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Street Address <Required /></label>
                <input
                  ref={addressRef}
                  placeholder="House #, street, area" value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  className={fieldClass("address")}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
              <div>
                <label className={labelClass}>City <Required /></label>
                <select
                  ref={cityRef}
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className={`${fieldClass("city")} cursor-pointer`}
                >
                  <option value="">select city</option>
                  {CITY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className={labelClass}>State / Province</label>
                <input
                  placeholder="Punjab" value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>ZIP / Postal Code <Required /></label>
                <input
                  ref={zipRef}
                  inputMode="numeric" placeholder="54000" value={form.zip}
                  onChange={(e) => handleZipChange(e.target.value)}
                  className={fieldClass("zip")}
                />
                {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
              </div>
              <div>
                <label className={labelClass}>Country</label>
                {/* Locked — country was chosen on the Cart page, which
                    already decided your currency + payment options. */}
                <input
                  value={form.country}
                  disabled
                  className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                />
                <p className="text-xs text-gray-400 mt-1">
                  To change country, go back to cart.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mt-4">
              Delivery fee: <span className="font-semibold text-[#333333]">{SHIPPING === 0 ? "FREE" : formatPrice(SHIPPING)}</span>
              {" "}(same as shown in your cart).
            </p>
          </section>

          {/* Coupon */}
          <section>
            <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2 text-[#333333]">
              <span className="w-7 h-7 bg-[#333333] text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">3</span>
              Coupon Code
            </h2>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-green-700">{appliedCoupon.code} applied</p>
                  <p className="text-xs text-green-600">{appliedCoupon.label}</p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                  placeholder="Enter coupon code"
                  className={inputClass}
                />
                <button
                  onClick={handleApplyCoupon}
                  className="shrink-0 bg-[#333333] hover:bg-[#1f1f1f] text-white text-sm font-semibold px-5 rounded-lg transition-all cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
            {couponError && <p className="text-red-500 text-xs mt-1.5">{couponError}</p>}
          </section>

          {/* Payment Method */}
          <section>
            <h2 className="text-base sm:text-lg font-bold mb-5 flex items-center gap-2 text-[#333333]">
              <span className="w-7 h-7 bg-[#333333] text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">4</span>
              Payment Method
            </h2>

            {!codAllowed && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                Cash on Delivery is valid for Pakistan only. Card payment is required for your country.
              </p>
            )}

            <div className={`grid grid-cols-1 ${codAllowed ? "xs:grid-cols-2 sm:grid-cols-2" : ""} gap-3 mb-6`}>
              <button
                onClick={() => setPaymentMethod("us")}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${paymentMethod === "us" ? "border-[#333333] bg-[#333333]/10" : "border-[#333333] bg-white hover:bg-gray-50"}`}
              >
                {paymentMethod === "us" && (
                  <span className="absolute top-3 right-3 w-4 h-4 bg-[#333333] text-white rounded-full flex items-center justify-center text-xs">✓</span>
                )}
                <div className="text-2xl mb-2">💳</div>
                <div className="font-semibold text-sm text-[#333333]">Card Payment ({currency})</div>
                <div className="text-gray-500 text-xs mt-0.5">Visa, Mastercard, Amex</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {["VISA", "MC", "AMEX"].map((b) => (
                    <span key={b} className="text-[9px] bg-gray-100 border border-[#333333] text-[#333333] px-1.5 py-0.5 rounded font-mono">{b}</span>
                  ))}
                </div>
              </button>

              {codAllowed && (
                <button
                  onClick={() => setPaymentMethod("rs")}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${paymentMethod === "rs" ? "border-[#333333] bg-[#333333]/10" : "border-[#333333] bg-white hover:bg-gray-50"}`}
                >
                  {paymentMethod === "rs" && (
                    <span className="absolute top-3 right-3 w-4 h-4 bg-[#333333] text-white rounded-full flex items-center justify-center text-xs">✓</span>
                  )}
                  <div className="text-2xl mb-2">💵</div>
                  <div className="font-semibold text-sm text-[#333333]">Cash on Delivery (PKR)</div>
                  <div className="text-gray-500 text-xs mt-0.5">Pay when you receive</div>
                  <div className="flex gap-1 mt-2">
                    <span className="text-[9px] bg-gray-100 border border-[#333333] text-green-700 px-1.5 py-0.5 rounded font-mono">FREE</span>
                  </div>
                </button>
              )}
            </div>

            {paymentMethod === "us" && (
              <div className="bg-white border border-[#333333] rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-[#333333]">Card Details</span>
                  <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">🔒 256-bit SSL</span>
                </div>
                <div>
                  <label className={labelClass}>Card Number</label>
                  <div className="relative">
                    <input
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => { setCardNumber(formatCard(e.target.value)); setErrors({ ...errors, cardNumber: "" }); }}
                      className={`${inputClass} pr-12 ${errors.cardNumber ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                      {cardNumber.startsWith("4") ? "💳" : cardNumber.startsWith("5") ? "🟡" : "💳"}
                    </span>
                  </div>
                  {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Expiry</label>
                    <input
                      placeholder="MM/YY" value={expiry}
                      onChange={(e) => { setExpiry(formatExpiry(e.target.value)); setErrors({ ...errors, expiry: "" }); }}
                      className={`${inputClass} ${errors.expiry ? "border-red-500" : ""}`}
                    />
                    {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>CVV</label>
                    <input
                      placeholder="•••" type="password" maxLength={4} value={cvv}
                      onChange={(e) => { setCvv(e.target.value.replace(/\D/g, "")); setErrors({ ...errors, cvv: "" }); }}
                      className={`${inputClass} ${errors.cvv ? "border-red-500" : ""}`}
                    />
                    {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "rs" && codAllowed && (
              <div className="bg-white border border-[#333333] rounded-xl p-4 sm:p-5 flex gap-3 items-start">
                <span className="text-2xl shrink-0">📦</span>
                <div>
                  <p className="text-sm font-semibold text-[#333333] mb-1">Cash on Delivery selected</p>
                  <p className="text-gray-600 text-sm">Have the exact amount ready when your delivery arrives. Our courier will collect payment at your door.</p>
                </div>
              </div>
            )}
          </section>

          <div className="lg:hidden">
            <button
              onClick={handleSubmit}
              disabled={placingOrder}
              className="w-full bg-[#333333] hover:bg-[#333333]/90 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {placingOrder
                ? "Placing order..."
                : `${paymentMethod === "us" ? "Pay" : "Place Order"} · ${formatPrice(TOTAL)}`}
            </button>
            <p className="text-gray-500 text-xs text-center mt-3 flex items-center justify-center gap-1">
              <span>🔒</span> Secure &amp; encrypted checkout
            </p>
          </div>
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-8 h-fit">
          <div className="bg-white border border-[#333333] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#333333]">
              <h3 className="font-bold text-base text-[#333333]">Order Summary</h3>
              <p className="text-gray-500 text-xs mt-0.5">{PRODUCTS.length} items</p>
            </div>

            <div className="px-6 py-4 space-y-4 border-b border-[#333333]">
              {PRODUCTS.map((p, i) => (
                <div key={`${p._id || p.productId}-${p.size || "nosize"}-${i}`} className="flex items-center gap-3">
                  <img
                    src={p.images?.[0] || p.image || ""}
                    alt={p.name}
                    className="w-12 h-12 bg-gray-100 border border-[#333333] rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#333333] truncate">{p.name}</p>
                    <ProductMeta color={p.color} size={p.size} />
                    <p className="text-gray-500 text-xs">Qty: {p.quantity || p.qty}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#333333] shrink-0">
                    {formatPrice(p.price * (p.quantity || p.qty))}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 space-y-3 border-b border-[#333333] text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span className="text-[#333333]">{formatPrice(SUBTOTAL)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.code})</span><span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={SHIPPING === 0 ? "text-green-600 font-semibold" : "text-[#333333]"}>
                  {SHIPPING === 0 ? "FREE" : formatPrice(SHIPPING)}
                </span>
              </div>
            </div>
            <div className="px-6 py-4 flex justify-between items-center border-b border-[#333333]">
              <span className="font-bold text-[#333333]">Total</span>
              <span className="text-[#333333] font-bold text-xl">{formatPrice(TOTAL)}</span>
            </div>

            <div className="px-6 py-4">
              <button
                onClick={handleSubmit}
                disabled={placingOrder}
                className="w-full bg-[#333333] hover:bg-[#333333]/90 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {placingOrder
                  ? "Placing order..."
                  : `${paymentMethod === "us" ? "Pay" : "Place Order"} · ${formatPrice(TOTAL)}`}
              </button>
              <p className="text-gray-500 text-xs text-center mt-3 flex items-center justify-center gap-1">
                <span>🔒</span> Secure &amp; encrypted checkout
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
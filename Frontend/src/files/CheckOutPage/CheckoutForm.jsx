
import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

import { formatAmount, getCurrencyForCountry, getAllowedPaymentMethods } from "../../utils/formatCurrency";
import { getShippingFee } from "../../utils/shipping";
import { getCouponDiscount } from "../../utils/coupons";
import { clearCart } from "../../assets/components/redux_Toolkit/cartSlice";
import { API_URL } from "../../config/api";

import { inputClass } from "./Constants.jsx";
import CustomToast from "../CheckOutPage/Customtoast";
import EmptyCart from "../CheckOutPage/Emptycart";
import OrderConfirmation from "./OrderConfirmation";
import CheckoutHeader from "../CheckOutPage/CheckoutHeader";
import MobileOrderSummary from "../CheckOutPage/MobileOrderSummary";
import ContactInfoSection from "./ContactInfoSection.jsx";
import ShippingAddressSection from "../CheckOutPage/ShippingAddressSection";
import CouponSection from "./CouponSection.jsx";
import PaymentMethodSection from "./PaymentMethodSection.jsx";
import OrderSummarySidebar from "./OrderSummarySidebar.jsx";
import SubmitButton from "../CheckOutPage/SubmitButton";

const ORDERS_API_URL = `${API_URL}/orders`;

export default function CheckoutForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();

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
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", state: "", zip: "", country,
  });
  // NOTE: `submitted` is set here but never flipped to true inside
  // handleSubmit (it navigates to "/new" instead) — same as the
  // original file. Left as-is; flag if you want it wired up or removed.
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
      if (!stripe || !elements) e.payment = "Payment is still loading, please wait a moment.";
      else if (!cardComplete) e.card = "Enter complete card details";
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
      setOrderError(e.payment || e.card || "Please fill in the highlighted required fields.");
      return;
    }

    setOrderError("");
    setPlacingOrder(true);

    let paymentMethodId = null;

    try {
      // ── Card payments: tokenize the card via Stripe.js before
      // hitting our own backend. We NEVER send raw card details ──
      if (paymentMethod === "us") {
        const cardElement = elements.getElement(CardElement);
        const { error, paymentMethod: stripePaymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: `${form.firstName} ${form.lastName}`,
            email: form.email,
            phone: form.phone,
            address: {
              line1: form.address,
              city: form.city,
              state: form.state,
              postal_code: form.zip,
              country: form.country,
            },
          },
        });

        if (error) {
          setOrderError(error.message || "Card was declined. Please check the details and try again.");
          setPlacingOrder(false);
          return;
        }
        paymentMethodId = stripePaymentMethod.id;
      }

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
        paymentMethodId, // ← Stripe PaymentMethod id (null for COD) — backend
                         //   uses this to create/confirm a PaymentIntent
        subtotal: SUBTOTAL,
        shippingFee: SHIPPING,
        couponCode: appliedCoupon?.code || null,
        discount,
        totalAmount: TOTAL, // always in PKR (base) — backend stores/settles in PKR
      };

      const res = await axios.post(ORDERS_API_URL, orderPayload, { withCredentials: true });

      // ── If backend requires 3D Secure / additional authentication,
      // it should return a clientSecret so we can confirm it here ──
      if (res.data.requiresAction && res.data.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(res.data.clientSecret);
        if (confirmError) {
          setOrderError(confirmError.message || "Payment authentication failed.");
          setPlacingOrder(false);
          return;
        }
      }

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

  if (!submitted && PRODUCTS.length === 0) {
    return <EmptyCart onBackToCart={() => navigate("/cart")} />;
  }

  if (submitted) {
    return (
      <OrderConfirmation
        firstName={form.firstName}
        email={form.email}
        paymentMethod={paymentMethod}
        formatPrice={formatPrice}
        total={TOTAL}
        onContinueShopping={() => navigate("/")}
      />
    );
  }

  const submitDisabled = placingOrder || (paymentMethod === "us" && !stripe);

  return (
    <div className="min-h-screen bg-white text-[#333333]">
      <CustomToast toast={toast} onClose={() => setToast(null)} />

      <CheckoutHeader />

      <MobileOrderSummary
        summaryOpen={summaryOpen}
        onToggle={() => setSummaryOpen((o) => !o)}
        products={PRODUCTS}
        formatPrice={formatPrice}
        subtotal={SUBTOTAL}
        discount={discount}
        appliedCoupon={appliedCoupon}
        shipping={SHIPPING}
        total={TOTAL}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-10 lg:grid lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="space-y-8">

          {orderError && (
            <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl px-4 py-3">
              {orderError}
            </div>
          )}

          <ContactInfoSection
            form={form}
            setField={setField}
            errors={errors}
            refs={{ firstNameRef, lastNameRef, emailRef, phoneRef }}
            fieldClass={fieldClass}
            onPhoneChange={handlePhoneChange}
          />

          <ShippingAddressSection
            form={form}
            setForm={setForm}
            setField={setField}
            errors={errors}
            refs={{ addressRef, cityRef, zipRef }}
            fieldClass={fieldClass}
            onZipChange={handleZipChange}
            shippingFee={SHIPPING}
            formatPrice={formatPrice}
          />

          <CouponSection
            couponInput={couponInput}
            setCouponInput={setCouponInput}
            appliedCoupon={appliedCoupon}
            couponError={couponError}
            setCouponError={setCouponError}
            onApply={handleApplyCoupon}
            onRemove={handleRemoveCoupon}
          />

          <PaymentMethodSection
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            codAllowed={codAllowed}
            currency={currency}
            errors={errors}
            setErrors={setErrors}
            cardError={cardError}
            setCardError={setCardError}
            setCardComplete={setCardComplete}
          />

          <div className="lg:hidden">
            <SubmitButton
              onClick={handleSubmit}
              disabled={submitDisabled}
              placingOrder={placingOrder}
              paymentMethod={paymentMethod}
              formatPrice={formatPrice}
              total={TOTAL}
              size="mobile"
            />
          </div>
        </div>

        <OrderSummarySidebar
          products={PRODUCTS}
          formatPrice={formatPrice}
          subtotal={SUBTOTAL}
          discount={discount}
          appliedCoupon={appliedCoupon}
          shipping={SHIPPING}
          total={TOTAL}
          onSubmit={handleSubmit}
          placingOrder={placingOrder}
          disabled={submitDisabled}
          paymentMethod={paymentMethod}
        />
      </main>
    </div>
  );
}
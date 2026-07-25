import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  removeFromCart,
  increaseQty,
  decreaseQty,
  clearCart,
} from "../redux_Toolkit/cartSlice";

import { Trash2, ShoppingBag, Plus, Minus, AlertCircle, X, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getShippingFee, getAmountLeftForFreeDelivery } from "../../../utils/shipping";
import { getCurrencyForCountry, getAllowedPaymentMethods, formatAmount } from "../../../utils/formatCurrency";

const getItemId = (item) => item?._id ?? item?.id;
// 🔑 same product ke 2 alag colors ab 2 alag cart LINES hain (redux
// level par) — is liye React `key` aur busy/lookup keys ab sirf
// productId nahi, productId+color hone chahiye — warna dono lines
// collide kar jayengi.
const getLineKey = (item) => `${getItemId(item)}::${item.color || ""}`;

const COUNTRY_OPTIONS = [
  { value: "PK", label: "🇵🇰 Pakistan" },
  { value: "US", label: "🇺🇸 United States" },
  { value: "GB", label: "🇬🇧 United Kingdom" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "AU", label: "🇦🇺 Australia" },
  { value: "IN", label: "🇮🇳 India" },
  { value: "OTHER", label: "🌍 Other" },
];

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, hydrated } = useSelector((state) => state.cart);

  const user = useSelector((state) => state.auth?.user ?? null);
  const authChecked = useSelector((state) => state.auth?.authChecked ?? false);

  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState(null);
  const [clearing, setClearing] = useState(false);

  // ── Delivery country -> decides currency + which payment methods
  // are allowed at checkout. COD is Pakistan-only.
  const [country, setCountry] = useState("PK");
  const prevCountryRef = useRef("PK");

  const hasAlerted = useRef(false);

  useEffect(() => {
    if (authChecked && !user && !hasAlerted.current) {
      hasAlerted.current = true;
      alert("Please log in first to view your cart.");
      navigate("/login", { state: { redirectTo: "/cart" } });
    }
  }, [authChecked, user, navigate]);

  // Alert the moment they pick a non-Pakistan country — COD won't be
  // available for them at checkout, only card payment in USD.
  useEffect(() => {
    if (country !== "PK" && prevCountryRef.current !== country) {
      alert(
        "Cash on Delivery is only available in Pakistan. For your selected country, you'll pay by Card in USD."
      );
    }
    prevCountryRef.current = country;
  }, [country]);

  const currency = getCurrencyForCountry(country);
  const allowedPaymentMethods = getAllowedPaymentMethods(country);
  const formatPrice = (amountPKR) => formatAmount(amountPKR, currency);

  // 🔑 NEW — items ko productId ke hisaab se group kiya, taake same
  // product ke saare colors EK hi card ke andar, alag-alag rows ke tor
  // par dikhein — "Perfume" ke 3 alag cards ki jagah ab ek "Perfume"
  // card hoga jiske andar 3 color-rows honge. Insertion order preserve
  // kiya (jis order mein pehle add hue), taake cart re-render par items
  // idhar-udhar na kudein.
  const groupedItems = useMemo(() => {
    const order = [];
    const map = new Map();

    items.forEach((item) => {
      const pid = getItemId(item);
      if (!map.has(pid)) {
        map.set(pid, []);
        order.push(pid);
      }
      map.get(pid).push(item);
    });

    return order.map((pid) => map.get(pid));
  }, [items]);

  const subtotal = items.reduce(
    (acc, item) =>
      acc +
      (item.sizes || []).reduce(
        (sum, s) => sum + Number(item.price) * (Number(s.quantity) || 0),
        0
      ),
    0
  );

  const totalPieces = items.reduce(
    (acc, item) =>
      acc + (item.sizes || []).reduce((s, z) => s + (Number(z.quantity) || 0), 0),
    0
  );

  const deliveryFee = getShippingFee(subtotal);
  const isFreeDelivery = deliveryFee === 0;
  const amountLeftForFreeDelivery = getAmountLeftForFreeDelivery(subtotal);
  const grandTotal = subtotal + deliveryFee;

  const runCartAction = async (action, busyId = null) => {
    setError("");
    if (busyId) setBusyKey(busyId);

    try {
      const result = dispatch(action);
      if (result?.unwrap) {
        await result.unwrap();
      } else {
        await result;
      }
    } catch (err) {
      setError(
        err?.message || "Something went wrong updating the cart. Please try again."
      );
    } finally {
      if (busyId) setBusyKey(null);
    }
  };

  // 🔑 CHANGED — `color` ab har action ke saath jata hai, taake sirf
  // USI color ki line update ho, doosre color ki nahi.
  const handleIncreaseQty = (id, size, color) =>
    runCartAction(increaseQty({ id, size, color }), `${id}::${color}::${size}`);

  const handleDecreaseQty = (id, size, color) =>
    runCartAction(decreaseQty({ id, size, color }), `${id}::${color}::${size}`);

  const handleRemoveSize = (id, size, color, label) => {
    const confirmed = window.confirm(`Remove "${label}" from your cart?`);
    if (!confirmed) return;
    runCartAction(removeFromCart({ id, size, color }), `${id}::${color}::${size}`);
  };

  const handleClearCart = async () => {
    const confirmed = window.confirm("Remove all items from your cart?");
    if (!confirmed) return;

    setError("");
    setClearing(true);
    try {
      const result = dispatch(clearCart());
      if (result?.unwrap) {
        await result.unwrap();
      } else {
        await result;
      }
    } catch (err) {
      setError(
        err?.message || "Something went wrong clearing the cart. Please try again."
      );
    } finally {
      setClearing(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      setError("You need at least one item in your cart to checkout.");
      return;
    }

    // Everything sent in PKR (base currency) — checkout converts for
    // display only, using the SAME shipping logic (imported from
    // utils/shipping.js) so the fee can never drift between pages.
    //
    // 🔑 CHANGED — `image` ab item.image (jo color-specific single-image
    // snapshot hai, add-to-cart ke waqt save hui thi) se aata hai, na ke
    // purane `item.images?.[0]` se (jo naye schema mein exist hi nahi
    // karta). `color` bhi ab hamesha sahi jayega, kyunki cartSlice ab
    // usay properly store karta hai. Matlab: same product ke 2 colors ho
    // to checkout par 2 ALAG lines jayengi, har ek apni EK image aur apne
    // color ke sath — dono ki images kabhi mix nahi hongi.
    const checkoutItems = items.flatMap((item) =>
      (item.sizes || []).map((s) => {
        const qty = Number(s.quantity) || 0;
        return {
          productId: getItemId(item),
          name: item.name,
          image: item.image || item.images?.[0] || "",
          price: Number(item.price),
          color: item.color || "",
          size: s.size,
          quantity: qty,
          lineTotal: Number(item.price) * qty,
        };
      })
    );

    navigate("/checkout", {
      state: {
        items: checkoutItems,
        subtotal,
        deliveryFee,
        total: grandTotal,
        country,
        currency,
        allowedPaymentMethods,
      },
    });
  };

  if (!authChecked || (authChecked && !user)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        {authChecked && !user && (
          <div className="text-center space-y-4 text-gray-400">
            <LogIn className="w-14 h-14 mx-auto" />
            <p className="text-[#333333] font-medium text-sm sm:text-base">
              Please log in to view your cart
            </p>
            <button
              onClick={() => navigate("/login", { state: { redirectTo: "/cart" } })}
              className="bg-[#333333] hover:bg-[#1f1f1f] active:scale-[0.98] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all cursor-pointer"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!hydrated) {
    return <div className="min-h-screen bg-white" />;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-4 text-gray-400">
          <ShoppingBag className="w-14 h-14 sm:w-16 sm:h-16 mx-auto" />
          <p className="text-[#333333] font-medium text-sm sm:text-base">Cart is empty</p>
          <button
            onClick={() => navigate("/new")}
            className="bg-[#333333] hover:bg-[#1f1f1f] active:scale-[0.98] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all cursor-pointer"
          >
            See all products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 pb-40 lg:pb-6">

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-300 text-red-700 text-xs sm:text-sm rounded-xl px-3 sm:px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
            <button onClick={() => setError("")} className="shrink-0 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#333333]">
            Cart ({totalPieces})
          </h1>

          <button
            onClick={handleClearCart}
            disabled={clearing}
            className="text-xs font-semibold text-[#333333] border border-[#333333] rounded-lg px-2.5 sm:px-3 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {clearing ? "Clearing..." : "Clear All"}
          </button>
        </div>

        {/* ── Delivery country selector — decides currency + COD availability ── */}
        <div className="border border-[#333333] rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
          <label className="text-xs sm:text-sm font-medium text-[#333333] shrink-0">
            Delivery Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border border-[#333333] rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-[#333333] cursor-pointer focus:outline-none"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        {country !== "PK" && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ Cash on Delivery is not available for this country. Payment will be by Card in USD.
          </p>
        )}

        <div
          className={`text-xs sm:text-sm font-medium rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 ${
            isFreeDelivery ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {isFreeDelivery
            ? "🎉 You've unlocked free delivery!"
            : `Add ${formatPrice(amountLeftForFreeDelivery)} more to unlock FREE delivery`}
        </div>

        {/* ── Product cards — ONE div per product, each color as its own
            inner row with its own size/qty controls ── */}
        <div className="space-y-3">
          {groupedItems.map((group) => {
            const first = group[0];
            const pid = getItemId(first);

            return (
              <div key={pid} className="bg-white border border-[#333333] rounded-xl p-3 space-y-3">
                {/* Product-level header — shared across all color rows */}
                <div>
                  <p className="text-sm font-semibold text-[#333333] truncate">{first.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{formatPrice(first.price)}</p>
                </div>

                {group.map((item) => {
                  const itemId = getItemId(item);
                  const lineKey = getLineKey(item);
                  const sizes = item.sizes || [];
                  // 🔑 sirf EK image (color-specific snapshot), purane
                  // `item.images?.[0]` array-based lookup ki jagah.
                  const thumb = item.image || item.images?.[0] || "";

                  return (
                    <div key={lineKey} className="border border-gray-200 rounded-lg p-2.5">
                      <div className="flex gap-3 items-center">
                        <img
                          src={thumb}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
                        />
                        {/* 🔑 color ab dikhta hai — same product ke
                            multiple colors ab isi div ke andar alag rows
                            hain, is label ke bina user ko pata nahi
                            chalega ye kaunsa color hai. Color na ho to
                            "No color" dikhega (legacy items ke liye). */}
                        {item.color ? (
                          <p className="text-xs font-medium text-gray-600">Color: {item.color}</p>
                        ) : (
                          <p className="text-xs font-medium text-gray-400">No color</p>
                        )}
                      </div>

                      <div className="mt-2.5 space-y-2">
                        {sizes.map((s) => {
                          const busyId = `${itemId}::${item.color || ""}::${s.size}`;
                          const isBusy = busyKey === busyId;
                          const qty = Number(s.quantity) || 0;
                          const isLastUnit = qty <= 1;
                          const removeLabel = s.size
                            ? `${item.name}${item.color ? ` (${item.color})` : ""} — Size ${s.size}`
                            : `${item.name}${item.color ? ` (${item.color})` : ""}`;

                          return (
                            <div
                              key={busyId}
                              className={`flex items-center justify-between gap-2 border border-gray-100 rounded-lg px-2.5 py-1.5 transition-opacity ${
                                isBusy ? "opacity-60 pointer-events-none" : ""
                              }`}
                            >
                              {s.size ? (
                                <span className="text-xs font-medium text-gray-600">Size {s.size}</span>
                              ) : (
                                <span className="text-xs font-medium text-gray-400">Quantity</span>
                              )}

                              <div className="flex items-center gap-2 border border-[#333333] rounded-lg px-1">
                                {isLastUnit ? (
                                  <button
                                    onClick={() => handleRemoveSize(itemId, s.size, item.color, removeLabel)}
                                    disabled={isBusy}
                                    aria-label={`Remove ${removeLabel}`}
                                    className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleDecreaseQty(itemId, s.size, item.color)}
                                    disabled={isBusy}
                                    aria-label={`Decrease quantity for ${removeLabel}`}
                                    className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-[#333333] hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                  </button>
                                )}

                                <span className="w-5 text-center text-sm font-medium text-[#333333]">
                                  {qty}
                                </span>

                                <button
                                  onClick={() => handleIncreaseQty(itemId, s.size, item.color)}
                                  disabled={isBusy || qty >= (Number(s.stock) || Infinity)}
                                  aria-label={`Increase quantity for ${removeLabel}`}
                                  className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-[#333333] hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="hidden lg:block bg-white border border-[#333333] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="text-[#333333] font-medium">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Delivery</span>
            <span className={isFreeDelivery ? "text-green-600 font-semibold" : "text-[#333333] font-medium"}>
              {isFreeDelivery ? "FREE" : formatPrice(deliveryFee)}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
            <div className="font-bold text-[#333333] text-lg">
              Total: {formatPrice(grandTotal)}
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="bg-[#333333] hover:bg-[#1f1f1f] active:scale-[0.98] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all whitespace-nowrap cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>

      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-[#333333] px-4 pt-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="space-y-1.5 mb-3 text-sm">
          <div className="flex items-center justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="text-[#333333] font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Delivery</span>
            <span className={isFreeDelivery ? "text-green-600 font-semibold" : "text-[#333333] font-medium"}>
              {isFreeDelivery ? "FREE" : formatPrice(deliveryFee)}
            </span>
          </div>
          <div className="flex items-center justify-between font-bold text-[#333333] pt-1 border-t border-gray-200">
            <span>Total</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
        </div>

        <button
          onClick={handleProceedToCheckout}
          className="w-full bg-[#333333] hover:bg-[#1f1f1f] active:scale-[0.98] text-white text-sm font-semibold py-3.5 rounded-xl transition-all cursor-pointer"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
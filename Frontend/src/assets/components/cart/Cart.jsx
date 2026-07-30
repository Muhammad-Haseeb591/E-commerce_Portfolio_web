import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  removeFromCart,
  increaseQty,
  decreaseQty,
  clearCart,
} from "../store/cartSlice";

import { Trash2, ShoppingBag, Plus, Minus, AlertCircle, X, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getShippingFee, getAmountLeftForFreeDelivery } from "../../../utils/shipping";
import { getCurrencyForCountry, getAllowedPaymentMethods, formatAmount } from "../../../utils/formatCurrency";
import SEO from "../common/SEO";

const getItemId = (item) => item?._id ?? item?.id;
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

const CartSEO = () => (
  <SEO
    title="Your Cart | STORE"
    description="Review the items in your shopping cart before checkout at STORE."
    url="https://e-commerce-portfolio-web.vercel.app/cart"
    noIndex
  />
);

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, hydrated } = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth?.user ?? null);
  const authChecked = useSelector((state) => state.auth?.authChecked ?? false);

  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState(null);
  const [clearing, setClearing] = useState(false);

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
        <CartSEO />
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
    return (
      <div className="min-h-screen bg-white">
        <CartSEO />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <CartSEO />
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
      <CartSEO />
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

        <div className="space-y-3">
          {groupedItems.map((group) => {
            const first = group[0];
            const pid = getItemId(first);

            return (
              <div key={pid} className="bg-white border border-[#333333] rounded-xl p-3 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[#333333] truncate">{first.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{formatPrice(first.price)}</p>
                </div>

                {group.map((item) => {
                  const itemId = getItemId(item);
                  const lineKey = getLineKey(item);
                  const sizes = item.sizes || [];
                  const thumb = item.image || item.images?.[0] || "";

                  return (
                    <div key={lineKey} className="border border-gray-200 rounded-lg p-2.5">
                      <div className="flex gap-3 items-center">
                        <img
                          src={thumb}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
                        />
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
import ProductMeta from "./Productmeta";

export default function MobileOrderSummary({
  summaryOpen, onToggle, products, formatPrice, subtotal, discount, appliedCoupon, shipping, total,
}) {
  return (
    <div className="lg:hidden border-b border-[#333333] bg-gray-50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm cursor-pointer"
      >
        <span className="flex items-center gap-2 text-[#333333] font-medium">
          🛒 {summaryOpen ? "Hide" : "Show"} order summary
        </span>
        <span className="flex items-center gap-2 text-[#333333] font-bold">
          {formatPrice(total)}
          <span
            className="text-gray-500 text-xs transition-transform"
            style={{ transform: summaryOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▾
          </span>
        </span>
      </button>
      {summaryOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#333333] pt-4">
          {products.map((p, i) => (
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
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span className="text-[#333333]">{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedCoupon.code})</span><span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className={shipping === 0 ? "text-green-600 font-semibold" : "text-[#333333]"}>
                {shipping === 0 ? "FREE" : formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-1 text-[#333333]">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
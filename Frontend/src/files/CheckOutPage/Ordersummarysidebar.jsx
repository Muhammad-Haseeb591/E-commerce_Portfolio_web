import ProductMeta from "./ProductMeta";
import SubmitButton from "./SubmitButton";

export default function OrderSummarySidebar({
  products, formatPrice, subtotal, discount, appliedCoupon, shipping, total,
  onSubmit, placingOrder, disabled, paymentMethod,
}) {
  return (
    <aside className="hidden lg:block lg:sticky lg:top-8 h-fit">
      <div className="bg-white border border-[#333333] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#333333]">
          <h3 className="font-bold text-base text-[#333333]">Order Summary</h3>
          <p className="text-gray-500 text-xs mt-0.5">{products.length} items</p>
        </div>

        <div className="px-6 py-4 space-y-4 border-b border-[#333333]">
          {products.map((p, i) => (
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
        </div>
        <div className="px-6 py-4 flex justify-between items-center border-b border-[#333333]">
          <span className="font-bold text-[#333333]">Total</span>
          <span className="text-[#333333] font-bold text-xl">{formatPrice(total)}</span>
        </div>

        <div className="px-6 py-4">
          <SubmitButton
            onClick={onSubmit}
            disabled={disabled}
            placingOrder={placingOrder}
            paymentMethod={paymentMethod}
            formatPrice={formatPrice}
            total={total}
            size="desktop"
          />
        </div>
      </div>
    </aside>
  );
}
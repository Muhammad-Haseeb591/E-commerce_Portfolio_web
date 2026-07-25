import { useMemo } from "react";
import ProductMeta from "./Productmeta";

const getPid = (p) => p._id || p.productId;

export default function MobileOrderSummary({
  summaryOpen, onToggle, products, formatPrice, subtotal, discount, appliedCoupon, shipping, total,
}) {
  // 🔑 NEW — desktop OrderSummarySidebar jaisa hi grouping: same
  // productId ke multiple lines (alag colors/sizes) ab EK image ke
  // neeche group ho kar dikhte hain, na ke har line apni alag image ke
  // sath.
  const groupedProducts = useMemo(() => {
    const order = [];
    const map = new Map();

    products.forEach((p) => {
      const pid = getPid(p);
      if (!map.has(pid)) {
        map.set(pid, []);
        order.push(pid);
      }
      map.get(pid).push(p);
    });

    return order.map((pid) => map.get(pid));
  }, [products]);

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
          {groupedProducts.map((group) => {
            const first = group[0];
            const pid = getPid(first);
            // 🔑 Array ki PEHLI image — hamesha yehi use hoti hai, chahe
            // is group ke andar kitne bhi colors/lines hon.
            const thumb = first.images?.[0] || first.image || "";

            return (
              <div key={pid} className="space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={thumb}
                    alt={first.name}
                    className="w-10 h-10 bg-gray-100 border border-[#333333] rounded-xl object-cover shrink-0"
                  />
                  <p className="text-sm font-medium text-[#333333] truncate flex-1 min-w-0">
                    {first.name}
                  </p>
                </div>

                {/* Har line (color/size combo) apni row — image upar hi
                    ek dafa dikh chuki hai, yahan sirf color/size/qty
                    differ karte hain. */}
                <div className="pl-[52px] space-y-1">
                  {group.map((p, i) => (
                    <div
                      key={`${pid}-${p.color || "nocolor"}-${p.size || "nosize"}-${i}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <ProductMeta color={p.color} size={p.size} />
                        <p className="text-gray-500 text-xs">Qty: {p.quantity || p.qty}</p>
                      </div>
                      <p className="text-sm font-semibold text-[#333333] shrink-0">
                        {formatPrice(p.price * (p.quantity || p.qty))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

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
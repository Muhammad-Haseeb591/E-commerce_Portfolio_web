import { useMemo } from "react";
import ProductMeta from "./Productmeta";
import SubmitButton from "./SubmitButton";

const getPid = (p) => p._id || p.productId;

export default function OrderSummarySidebar({
  products, formatPrice, subtotal, discount, appliedCoupon, shipping, total,
  onSubmit, placingOrder, disabled, paymentMethod,
}) {
  // 🔑 NEW — same productId ke multiple lines (alag colors/sizes) ab
  // group ho kar EK hi image ke sath dikhte hain. Pehle har line apni
  // khud ki image dikhati thi (agar color-specific image thi to wo bhi
  // alag), is liye same product 2 dafa, 2 alag images ke sath dikhta
  // tha. Ab: pehli (array ki [0]) image sirf EK dafa header ke tor par,
  // aur uske neeche har color/size apni row — sirf quantity aur color
  // text me farak, image duplicate nahi hoti.
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
    <aside className="hidden lg:block lg:sticky lg:top-8 h-fit">
      <div className="bg-white border border-[#333333] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#333333]">
          <h3 className="font-bold text-base text-[#333333]">Order Summary</h3>
          <p className="text-gray-500 text-xs mt-0.5">{products.length} items</p>
        </div>

        <div className="px-6 py-4 space-y-4 border-b border-[#333333]">
          {groupedProducts.map((group) => {
            const first = group[0];
            const pid = getPid(first);
            // 🔑 Array ki PEHLI image — hamesha yehi use hoti hai, chahe
            // is group ke andar kitne bhi colors/lines hon.
            const thumb = first.images?.[0] || first.image || "";

            return (
              <div key={pid} className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={thumb}
                    alt={first.name}
                    className="w-12 h-12 bg-gray-100 border border-[#333333] rounded-xl object-cover shrink-0"
                  />
                  <p className="text-sm font-medium text-[#333333] truncate flex-1 min-w-0">
                    {first.name}
                  </p>
                </div>

                {/* Har line (color/size combo) apni row — sirf yahan
                    quantity aur color/size differ karte hain, image
                    upar hi ek dafa dikh chuki hai. */}
                <div className="pl-[60px] space-y-1.5">
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
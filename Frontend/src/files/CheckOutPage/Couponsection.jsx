import { inputClass } from "./constants";

export default function CouponSection({
  couponInput, setCouponInput, appliedCoupon, couponError, setCouponError, onApply, onRemove,
}) {
  return (
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
            onClick={onRemove}
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
            onClick={onApply}
            className="shrink-0 bg-[#333333] hover:bg-[#1f1f1f] text-white text-sm font-semibold px-5 rounded-lg transition-all cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}
      {couponError && <p className="text-red-500 text-xs mt-1.5">{couponError}</p>}
    </section>
  );
}
import Required from "./Required";
import { labelClass, inputClass, CITY_OPTIONS } from "../constants";

export default function ShippingAddressSection({
  form, setForm, setField, errors, refs, fieldClass, onZipChange, shippingFee, formatPrice,
}) {
  return (
    <section>
      <h2 className="text-base sm:text-lg font-bold mb-5 flex items-center gap-2 text-[#333333]">
        <span className="w-7 h-7 bg-[#333333] text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">2</span>
        Shipping Address
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Street Address <Required /></label>
          <input
            ref={refs.addressRef}
            placeholder="House #, street, area" value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            className={fieldClass("address")}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>
        <div>
          <label className={labelClass}>City <Required /></label>
          <select
            ref={refs.cityRef}
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
            ref={refs.zipRef}
            inputMode="numeric" placeholder="54000" value={form.zip}
            onChange={(e) => onZipChange(e.target.value)}
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
        Delivery fee: <span className="font-semibold text-[#333333]">{shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}</span>
        {" "}(same as shown in your cart).
      </p>
    </section>
  );
}
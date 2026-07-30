import { ChevronDown } from "lucide-react";
import { CATEGORY_OPTIONS, TYPE_OPTIONS } from "../forms/Productformhelpers";

const baseInput =
  "w-full px-4 py-2.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:bg-white transition";

const labelClass = "block text-xs font-medium text-gray-500 mb-1.5";
const Required = () => <span className="text-red-500">*</span>;

const BasicInfoFields = ({
  values,
  fieldErrors,
  onChange,
  onCategoryChange,
  onTypeChange,
  refs,
  stockBadge, // optional node — Edit modal passes a live <StockBadge/>, Add form omits it
}) => {
  const fieldClass = (name) =>
    `${baseInput} ${
      fieldErrors[name]
        ? "border-red-300 ring-2 ring-red-100 focus:ring-red-100"
        : "border-gray-200 focus:ring-gray-300 focus:border-gray-300"
    }`;

  return (
    <section className="space-y-4">
      <div>
        <label className={labelClass}>Product Name <Required /></label>
        <input
          ref={refs?.name}
          name="name"
          placeholder="e.g. Classic Leather Jacket"
          value={values.name}
          onChange={onChange}
          className={fieldClass("name")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Price <Required /></label>
          <input
            ref={refs?.price}
            name="price"
            type="number"
            placeholder="0.00"
            value={values.price}
            onChange={onChange}
            className={fieldClass("price")}
          />
        </div>
        <div>
          <label className={labelClass}>Old Price (optional)</label>
          <input
            name="oldPrice"
            type="number"
            placeholder="0.00"
            value={values.oldPrice}
            onChange={onChange}
            className={fieldClass("oldPrice")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Category <Required /></label>
          <div className="relative">
            <select
              ref={refs?.category}
              name="category"
              value={values.category}
              onChange={onCategoryChange}
              className={`${fieldClass("category")} appearance-none pr-9`}
            >
              <option value="">select category</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Type <Required /></label>
          <div className="relative">
            <select
              ref={refs?.type}
              name="type"
              value={values.type}
              onChange={onTypeChange}
              className={`${fieldClass("type")} appearance-none pr-9`}
            >
              <option value="">select type</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Status</label>
          <div className="relative">
            <select
              name="status"
              value={values.status}
              onChange={onChange}
              className={`${fieldClass("status")} appearance-none pr-9`}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="pending">pending</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Discount (optional)</label>
          <input
            name="discount"
            placeholder="e.g. 20%"
            value={values.discount}
            onChange={onChange}
            className={fieldClass("discount")}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          placeholder="Short description of the product"
          value={values.description}
          onChange={onChange}
          className={`${fieldClass("description")} h-24 resize-none`}
        />
      </div>

      {stockBadge && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Stock preview:</span>
          {stockBadge}
        </div>
      )}
    </section>
  );
};

export default BasicInfoFields;
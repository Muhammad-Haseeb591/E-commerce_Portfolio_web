import React from "react";
import { ChevronDown } from "lucide-react";

const BasicInfoFields = ({
  product,
  productId,
  onProductIdChange,
  handleChange,
  handleCategoryChange,
  handleTypeChange,
  fieldClass,
  labelClass,
  Required,
  refs,
  CATEGORY_OPTIONS,
  TYPE_OPTIONS,
}) => {
  return (
    <section className="space-y-4">
      {/* 🔑 Product ID — sits above Name so products can be searched/found
          cleanly by a stable ID instead of relying only on the name. */}
      <div>
        <label className={labelClass}>Product ID <Required /></label>
        <input
          name="productId"
          placeholder="e.g. PRD-M1A2B3-XYZ12"
          value={productId}
          onChange={(e) => onProductIdChange(e.target.value)}
          className={`${fieldClass("productId")} font-mono tracking-tight`}
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Auto-generated — you can edit it if you use your own SKU scheme.
        </p>
      </div>

      <div>
        <label className={labelClass}>Product Name <Required /></label>
        <input
          ref={refs.name}
          name="name"
          placeholder="e.g. Classic Leather Jacket"
          value={product.name}
          onChange={handleChange}
          className={fieldClass("name")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Price <Required /></label>
          <input
            ref={refs.price}
            name="price"
            type="number"
            placeholder="0.00"
            value={product.price}
            onChange={handleChange}
            className={fieldClass("price")}
          />
        </div>
        <div>
          <label className={labelClass}>Old Price (optional)</label>
          <input
            name="oldPrice"
            type="number"
            placeholder="0.00"
            value={product.oldPrice}
            onChange={handleChange}
            className={fieldClass("oldPrice")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Category <Required /></label>
          <div className="relative">
            <select
              ref={refs.category}
              name="category"
              value={product.category}
              onChange={handleCategoryChange}
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
              ref={refs.type}
              name="type"
              value={product.type}
              onChange={handleTypeChange}
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
              value={product.status}
              onChange={handleChange}
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
            value={product.discount}
            onChange={handleChange}
            className={fieldClass("discount")}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          placeholder="Short description of the product"
          value={product.description}
          onChange={handleChange}
          className={`${fieldClass("description")} h-24 resize-none`}
        />
      </div>
    </section>
  );
};

export default BasicInfoFields;
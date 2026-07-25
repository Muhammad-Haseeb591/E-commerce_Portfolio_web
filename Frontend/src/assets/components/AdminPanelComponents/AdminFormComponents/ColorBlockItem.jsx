import React from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import StockAdjuster from "./StockAdjuster";

/**
 * 🔑 BUG FIX: this component is keyed and driven entirely by `block.id`
 * (a stable id created once per color block), never by its position
 * in the array. The old code tracked colors by array *index*. That's
 * fine for simple typing, but the moment an async image upload was in
 * flight for one color and the blocks list changed shape in between
 * (a block added/removed, causing every index after it to shift), the
 * upload's `.then()` callback still wrote to the *old* index — landing
 * the image (or any other index-keyed update) on the wrong color block.
 * That's exactly the "first color's data shows up on the second / vice
 * versa" symptom. Using `id` everywhere removes the race entirely,
 * since the id a callback captured stays valid no matter how the list
 * reshuffles.
 *
 * 🔑 Also: each color now has exactly ONE image (no "add another image
 * for this color" button) per the requested behavior.
 */
const ColorBlockItem = ({
  block,
  hasError,
  canRemove,
  availableOptions,
  sizeOptions,
  blockStock,
  uploading,
  uploadError,
  onColorChange,
  onStockChange,
  onRemove,
  onToggleSize,
  onSetSizeQty,
  onImageChange,
  onFileSelect,
  swatchStyle,
  colorFieldClass,
  baseInput,
}) => {
  const image = block.images?.[0] || "";

  return (
    <div
      className={`border rounded-xl p-3 space-y-3 ${
        hasError ? "border-red-300 bg-red-50/40" : "border-gray-100"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={block.color}
            onChange={(e) => onColorChange(e.target.value)}
            className={colorFieldClass(hasError)}
          >
            <option value="">select color</option>
            {availableOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {block.color && (
          <span
            className="w-9 h-9 rounded-full border border-gray-300 shrink-0"
            style={swatchStyle(block.color)}
            title={block.color}
          />
        )}

        {/* Plain stock — only when there's no size scale. When sizes
            apply, this color's total stock is the sum of the size grid
            below (read-only badge instead). */}
        {sizeOptions ? (
          <span className="w-24 shrink-0 text-xs text-gray-500 text-center px-2 py-2.5 rounded-xl bg-gray-100 border border-gray-200">
            Stock: {blockStock}
          </span>
        ) : (
          <StockAdjuster value={block.stock} onChange={onStockChange} size="md" />
        )}

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 shrink-0"
            aria-label="Remove color"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {hasError && (
        <p className="text-[11px] text-red-500">
          This color is already added above — pick a different one.
        </p>
      )}

      {/* Per-color size toggle-grid — only when the chosen type+category
          has a defined size scale. */}
      {sizeOptions && (
        <div className="pl-1 space-y-2 border-t border-gray-100 pt-3">
          <p className="text-[11px] font-medium text-gray-500">Sizes for this color</p>
          <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 gap-2">
            {sizeOptions.map((size) => {
              const active = size in block.sizes;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onToggleSize(size)}
                  className={`h-10 rounded-lg text-sm font-medium border transition ${
                    active
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>

          {Object.keys(block.sizes).length > 0 && (
            <div className="space-y-2 pt-1">
              {Object.entries(block.sizes)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([size, qty]) => (
                  <div
                    key={size}
                    className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2"
                  >
                    <span className="w-14 shrink-0 text-sm font-medium text-gray-700">
                      Size {size}
                    </span>
                    <StockAdjuster value={qty} onChange={(v) => onSetSizeQty(size, v)} />
                    <button
                      type="button"
                      onClick={() => onToggleSize(size)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 shrink-0 ml-auto"
                      aria-label={`Remove size ${size}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Single image for this color — no add/remove, exactly one slot */}
      <div className="pl-1 space-y-2 border-t border-gray-100 pt-3">
        <p className="text-[11px] font-medium text-gray-500">Image for this color</p>
        <div className="flex items-center gap-2">
          {uploading ? (
            <div className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 shrink-0">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          ) : image ? (
            <img
              src={image}
              alt={`${block.color || "color"}-preview`}
              className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center rounded-lg border border-dashed border-gray-300 text-[9px] text-gray-400 text-center shrink-0">
              No image
            </div>
          )}

          <label className="text-xs text-gray-600 hover:text-gray-900 cursor-pointer bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg shrink-0">
            {image ? "Change" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFileSelect(e.target.files[0])}
            />
          </label>

          <input
            type="text"
            placeholder="...or paste image URL"
            value={image}
            onChange={(e) => onImageChange(e.target.value)}
            className={`${baseInput} flex-1 border-gray-200 focus:ring-gray-900/10 focus:border-gray-300 py-1.5`}
          />
        </div>
        {uploadError && <p className="text-[10px] text-red-500">{uploadError}</p>}
      </div>
    </div>
  );
};

export default ColorBlockItem;
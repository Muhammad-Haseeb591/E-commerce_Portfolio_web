import { X, Loader2, ChevronDown, Plus } from "lucide-react";
import { COLOR_OPTIONS, swatchStyle, colorBlockStock } from "../AdminFormComponents/Productformhelpers";

const baseInput =
  "w-full px-4 py-2.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:bg-white transition border-gray-200 focus:ring-gray-300 focus:border-gray-300";

const ColorsSection = ({
  colorBlocks,
  colorErrors,
  sizeOptions,
  colorImgUploading,
  colorImgErrors,
  colorsUsedElsewhere,
  onUpdateField,
  onRemoveBlock,
  onAddBlock,
  onImageChange,
  onFileSelect,
  onToggleSize,
  onSetSizeQty,
  totalStock,
  showTypeCategoryHint = false,
  accentColor = "#333333",
}) => {
  const colorFieldClass = (colorIndex) =>
    `${baseInput} appearance-none pr-9 ${
      colorErrors[colorIndex] ? "border-red-300 ring-2 ring-red-100 focus:ring-red-100" : ""
    }`;

  return (
    <section>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        Colors <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-gray-400 mb-3">
        Add at least one color. Each color has its own photo, and its own
        {sizeOptions ? " size-wise stock." : " stock count."}
      </p>
      {showTypeCategoryHint && (
        <p className="text-xs text-amber-600 mb-3">
          Pick a Category and Type above first — that decides whether each color
          gets a size grid (shoes) or a plain stock number.
        </p>
      )}

      <div className="space-y-3 sm:space-y-4">
        {colorBlocks.map((block, colorIndex) => {
          const usedElsewhere = colorsUsedElsewhere(colorIndex);
          const availableOptions = COLOR_OPTIONS.filter(
            (c) => c === block.color || !usedElsewhere.has(c)
          );
          const blockStock = colorBlockStock(block, sizeOptions);
          const imgKey = String(colorIndex);

          return (
            <div
              key={colorIndex}
              className={`border rounded-xl p-3 sm:p-4 space-y-3 ${
                colorErrors[colorIndex] ? "border-red-300 bg-red-50/40" : "border-gray-100"
              }`}
            >
              {/* Image — shown first so the color's photo is the first thing
                  seen/edited, ahead of the color picker and size/stock. */}
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-gray-500">Image for this color</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {colorImgUploading[imgKey] ? (
                    <div className="w-14 h-14 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 shrink-0">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  ) : block.image ? (
                    <img
                      src={block.image}
                      alt={`${block.color || "color"}-preview`}
                      className="w-14 h-14 sm:w-12 sm:h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg border border-dashed border-gray-300 text-[9px] text-gray-400 text-center shrink-0">
                      No image
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <label className="text-xs text-gray-600 hover:text-gray-900 cursor-pointer bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg shrink-0">
                      {block.image ? "Change" : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onFileSelect(colorIndex, e.target.files[0])}
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="...or paste image URL"
                      value={block.image || ""}
                      onChange={(e) => onImageChange(colorIndex, e.target.value)}
                      className={`${baseInput} flex-1 py-1.5`}
                    />
                  </div>
                </div>

                {colorImgErrors[imgKey] && (
                  <p className="text-[10px] text-red-500">{colorImgErrors[imgKey]}</p>
                )}
              </div>

              {/* Color + stock row */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center border-t border-gray-100 pt-3">
                <div className="relative w-full sm:flex-1">
                  <select
                    value={block.color}
                    onChange={(e) => onUpdateField(colorIndex, "color", e.target.value)}
                    className={colorFieldClass(colorIndex)}
                  >
                    <option value="">select color</option>
                    {availableOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                <div className="flex items-center gap-2">
                  {block.color && (
                    <span
                      className="w-9 h-9 rounded-full border border-gray-300 shrink-0"
                      style={swatchStyle(block.color)}
                      title={block.color}
                    />
                  )}

                  {sizeOptions ? (
                    <span className="flex-1 sm:flex-none sm:w-28 shrink-0 text-xs text-gray-500 text-center px-2 py-2.5 rounded-xl bg-gray-100 border border-gray-200 whitespace-nowrap">
                      Stock: {blockStock}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      placeholder="Stock"
                      value={block.stock}
                      onChange={(e) => onUpdateField(colorIndex, "stock", e.target.value)}
                      className={`${baseInput} flex-1 sm:flex-none sm:w-28`}
                    />
                  )}

                  {colorBlocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveBlock(colorIndex)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 shrink-0"
                      aria-label="Remove color"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {colorErrors[colorIndex] && (
                <p className="text-[11px] text-red-500">
                  This color is already added above — pick a different one.
                </p>
              )}

              {/* Per-color size toggle-grid — only when type=shoes and the
                  chosen category has a defined size scale. */}
              {sizeOptions && (
                <div className="pl-1 space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-[11px] font-medium text-gray-500">Sizes for this color</p>
                  <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 2xl:grid-cols-10 gap-2">
                    {sizeOptions.map((size) => {
                      const active = size in block.sizes;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => onToggleSize(colorIndex, size)}
                          style={active ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
                          className={`h-10 rounded-lg text-sm font-medium border transition ${
                            active ? "text-white" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
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
                            <span className="w-12 shrink-0 text-sm font-medium text-gray-700">
                              Size {size}
                            </span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Quantity"
                              value={qty}
                              onChange={(e) => onSetSizeQty(colorIndex, size, e.target.value)}
                              className={`${baseInput} flex-1`}
                            />
                            <button
                              type="button"
                              onClick={() => onToggleSize(colorIndex, size)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 shrink-0"
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

            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddBlock}
        disabled={colorBlocks.length >= COLOR_OPTIONS.length}
        className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-800 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
      >
        <Plus className="w-3.5 h-3.5" /> Add Color
      </button>

      <p className="text-xs text-gray-400 mt-3">Total stock: {totalStock}</p>
    </section>
  );
};

export default ColorsSection;
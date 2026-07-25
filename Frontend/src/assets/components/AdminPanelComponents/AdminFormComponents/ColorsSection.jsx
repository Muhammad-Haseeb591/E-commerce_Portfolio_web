import React from "react";
import { Plus } from "lucide-react";
import ColorBlockItem from "./ColorBlockItem";

const ColorsSection = ({
  colorBlocks,
  colorErrors,
  sizeOptions,
  hasCategoryAndType,
  totalStock,
  COLOR_OPTIONS,
  colorBlockStock,
  swatchStyle,
  colorFieldClass,
  baseInput,
  colorImgUploading,
  colorImgErrors,
  onAddColorBlock,
  onUpdateColorField,
  onRemoveColorBlock,
  onToggleSize,
  onSetSizeQty,
  onColorImageChange,
  onColorFileSelect,
}) => {
  const colorsUsedElsewhere = (currentId) =>
    new Set(
      colorBlocks
        .filter((b) => b.id !== currentId)
        .map((b) => b.color)
        .filter(Boolean)
    );

  return (
    <section>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-medium text-gray-500">
          Colors <span className="text-red-500">*</span>
        </label>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Add at least one color. Each color has its own photo, and its own
        {sizeOptions ? " size-wise stock." : " stock count."}
      </p>
      {!hasCategoryAndType ? (
        <p className="text-xs text-amber-600 mb-3">
          Pick a Category and Type above first — that decides whether each color
          gets a size grid (shoes) or a plain stock number.
        </p>
      ) : null}

      <div className="space-y-4">
        {colorBlocks.map((block) => {
          const usedElsewhere = colorsUsedElsewhere(block.id);
          const availableOptions = COLOR_OPTIONS.filter(
            (c) => c === block.color || !usedElsewhere.has(c)
          );
          const blockStock = colorBlockStock(block, sizeOptions);

          return (
            <ColorBlockItem
              key={block.id}
              block={block}
              hasError={!!colorErrors[block.id]}
              canRemove={colorBlocks.length > 1}
              availableOptions={availableOptions}
              sizeOptions={sizeOptions}
              blockStock={blockStock}
              uploading={!!colorImgUploading[block.id]}
              uploadError={colorImgErrors[block.id]}
              onColorChange={(value) => onUpdateColorField(block.id, "color", value)}
              onStockChange={(value) => onUpdateColorField(block.id, "stock", value)}
              onRemove={() => onRemoveColorBlock(block.id)}
              onToggleSize={(size) => onToggleSize(block.id, size)}
              onSetSizeQty={(size, qty) => onSetSizeQty(block.id, size, qty)}
              onImageChange={(value) => onColorImageChange(block.id, value)}
              onFileSelect={(file) => onColorFileSelect(block.id, file)}
              swatchStyle={swatchStyle}
              colorFieldClass={() => colorFieldClass(!!colorErrors[block.id])}
              baseInput={baseInput}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddColorBlock}
        disabled={colorBlocks.length >= COLOR_OPTIONS.length}
        className="mt-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
      >
        <Plus className="w-3.5 h-3.5" /> Add Image
      </button>

      <p className="text-xs text-gray-400 mt-3">Total stock: {totalStock}</p>
    </section>
  );
};

export default ColorsSection;
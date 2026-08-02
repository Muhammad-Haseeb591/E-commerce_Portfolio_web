import { FaHeart, FaRegHeart } from "react-icons/fa";

// Main product image, favourite toggle button, and (when the product has
// multiple colors) the horizontal color-thumbnail strip below it.
const ProductGallery = ({
  mainImage,
  productName,
  imgLoaded,
  onImageLoad,
  isFavourite,
  favouriteLoading,
  onToggleFavourite,
  hasColors,
  colorList,
  selectedColorIndex,
  onSelectColor,
}) => {
  return (
    <div>
      <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[480px] bg-[#ececec] rounded-xl overflow-hidden">
        {mainImage ? (
          <img
            key={mainImage}
            src={mainImage}
            alt={productName}
            onLoad={onImageLoad}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}

        <button
          onClick={onToggleFavourite}
          disabled={favouriteLoading}
          aria-label={isFavourite ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md active:scale-95 transition disabled:opacity-60"
        >
          {isFavourite ? (
            <FaHeart className="text-red-500 text-lg" />
          ) : (
            <FaRegHeart className="text-[#333333] text-lg" />
          )}
        </button>
      </div>

      {hasColors && colorList.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          {colorList.map((c, i) => {
            const outOfStock = c.stock === 0;
            const isSelected = selectedColorIndex === i;
            return (
              <button
                key={c.color}
                type="button"
                disabled={outOfStock}
                onClick={() => onSelectColor(i, c.stock)}
                title={outOfStock ? `${c.color} — Out of stock` : c.color}
                className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden border-2 snap-start bg-[#ececec] transition ${
                  isSelected ? "border-[#333333]" : "border-transparent opacity-70 hover:opacity-100"
                } ${outOfStock ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
              >
                {c.images?.[0] ? (
                  <img src={c.images[0]} alt={c.color} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 px-1 text-center">
                    {c.color}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
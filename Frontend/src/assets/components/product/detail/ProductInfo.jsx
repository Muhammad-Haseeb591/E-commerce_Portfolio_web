import { Link } from "react-router-dom";
import { IoStar, IoStarHalf, IoStarOutline } from "react-icons/io5";

// Star rating row — kept as a small internal helper component rather
// than a separate file.
const StarRow = ({ rating, size = "text-sm" }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<IoStar key={i} className={`${size} text-yellow-500`} />);
    else if (rating >= i - 0.5) stars.push(<IoStarHalf key={i} className={`${size} text-yellow-500`} />);
    else stars.push(<IoStarOutline key={i} className={`${size} text-gray-300`} />);
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
};

// Everything to the right of the gallery: name/rating/price/free-delivery
// banner/color label, the size grid (or plain quantity stepper), and the
// add-to-cart button + mobile sticky bar.
const ProductInfo = ({
  product,
  avgRating,
  reviewsCount,
  isFreeDelivery,
  amountLeftForFreeDelivery,
  hasColors,
  selectedColorData,
  allColorsOutOfStock,

  hasSizes,
  sizeList,
  selectedSizes,
  allSizesOutOfStock,
  pulsingSize,
  onToggleSize,
  onSetSizeQuantity,
  getRemainingStock,
  inStockCount,
  outOfStockCount,

  quantity,
  onDecreaseQty,
  onIncreaseQty,
  productOutOfStock,
  remainingProductStock,
  qtyPulsing,

  onAddToCart,
  addToCartDisabled,
  added,
  totalSelectedQty,
  itemTotal,
}) => {
  return (
    <div>
      {/* ── Name / rating / price / free delivery / color ── */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#333333]">{product.name}</h1>

      <div className="flex items-center gap-2 mt-2">
        <StarRow rating={Number(avgRating)} />
        <span className="text-sm text-gray-500">
          {avgRating} ({reviewsCount} reviews)
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <p className="text-xl font-semibold text-red-700">Rs. {product.price}</p>
        {product.oldPrice ? (
          <del className="text-gray-400">Rs. {product.oldPrice}</del>
        ) : null}
        {product.discount && (
          <span className="bg-[#cc0000] text-white text-xs px-2 py-1 rounded">
            {product.discount}
          </span>
        )}
      </div>

      <div
        className={`mt-3 text-sm font-medium rounded-lg px-3 py-2 inline-block ${
          isFreeDelivery ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}
      >
        {isFreeDelivery
          ? "🎉 You've unlocked free delivery on this quantity!"
          : `Add Rs. ${amountLeftForFreeDelivery.toFixed(0)} more to unlock FREE delivery`}
      </div>

      {hasColors ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#333333]">
            Color:{" "}
            <span className="font-normal text-gray-500">
              {selectedColorData?.color}
            </span>
          </p>
          {allColorsOutOfStock && (
            <span className="text-xs text-red-600 font-medium">Out of stock</span>
          )}
        </div>
      ) : (
        product.color && (
          <p className="text-sm text-gray-500 mt-4">
            Color: <span className="text-[#333333] font-medium">{product.color}</span>
          </p>
        )
      )}

      {/* ── Sizes (grid) ── */}
      {hasSizes && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#333333]">
              Sizes{" "}
              <span className="font-normal text-gray-500">
                (tap to select, choose as many as you like)
              </span>
            </p>
            {allSizesOutOfStock && (
              <span className="text-xs text-red-600 font-medium">Out of stock</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {sizeList.map((s) => {
              const outOfStock = s.stock === 0;
              const isSelected = s.size in selectedSizes;
              return (
                <button
                  key={s.size}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => onToggleSize(s.size, s.stock)}
                  title={outOfStock ? "Out of stock" : `${s.stock} in stock`}
                  className={`min-w-[3rem] px-4 py-2 rounded-lg border text-sm font-medium transition ${
                    isSelected
                      ? "bg-[#333333] text-white border-[#333333]"
                      : "border-gray-300 text-[#333333] hover:border-[#333333]"
                  } ${outOfStock ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                >
                  {s.size}
                </button>
              );
            })}
          </div>

          {Object.keys(selectedSizes).length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(selectedSizes)
                .sort((a, b) => (isNaN(a[0]) || isNaN(b[0]) ? 0 : Number(a[0]) - Number(b[0])))
                .map(([size, qty]) => {
                  const stock = sizeList.find((s) => s.size === size)?.stock ?? 0;
                  const remaining = getRemainingStock(size, stock);
                  const isPulsing = pulsingSize === size;
                  return (
                    <div
                      key={size}
                      className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2"
                    >
                      <span className="w-14 shrink-0 text-sm font-medium text-gray-700">
                        Size {size}
                      </span>
                      <div className="flex items-center border border-gray-300 rounded-lg shrink-0">
                        <button
                          type="button"
                          onClick={() => onSetSizeQuantity(size, qty - 1, stock)}
                          aria-label={`Decrease quantity for size ${size}`}
                          className="w-7 h-7 flex items-center justify-center text-base"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm">{qty}</span>
                        <button
                          type="button"
                          onClick={() => onSetSizeQuantity(size, qty + 1, stock)}
                          aria-label={`Increase quantity for size ${size}`}
                          className="w-7 h-7 flex items-center justify-center text-base"
                        >
                          +
                        </button>
                      </div>
                      <span
                        className={`text-xs font-semibold ml-auto shrink-0 transition-transform duration-300 ease-out inline-block ${
                          isPulsing ? "scale-125" : "scale-100"
                        } ${
                          remaining === 0
                            ? "text-red-500"
                            : remaining <= 5
                            ? "text-orange-500"
                            : "text-green-600"
                        }`}
                      >
                        {remaining} left
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleSize(size, stock)}
                        aria-label={`Remove size ${size}`}
                        className="text-gray-400 hover:text-red-500 text-lg leading-none px-1 shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-600">Stock per size</p>
            </div>
            <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-px bg-gray-100">
              {sizeList.map((s) => {
                const remaining = getRemainingStock(s.size, s.stock);
                const isPulsing = pulsingSize === s.size;
                return (
                  <div key={s.size} className="bg-white px-2 py-2 flex flex-col items-center">
                    <span className="text-sm font-semibold text-[#333333]">{s.size}</span>
                    <span
                      className={`text-xs mt-0.5 inline-block transition-transform duration-300 ease-out ${
                        isPulsing ? "scale-125" : "scale-100"
                      } ${
                        remaining === 0
                          ? "text-red-500"
                          : remaining <= 5
                          ? "text-orange-500"
                          : "text-green-600"
                      }`}
                    >
                      {remaining === 0 ? "Out" : `${remaining} left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            In stock sizes: {inStockCount} · Out of stock: {outOfStockCount}
          </p>
        </div>
      )}

      {/* ── Plain quantity stepper (no-size products) ── */}
      {!hasSizes && (
        <div className="mt-5">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-[#333333]">Quantity</p>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={onDecreaseQty}
                disabled={productOutOfStock}
                aria-label="Decrease quantity"
                className="w-9 h-9 flex items-center justify-center text-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                onClick={onIncreaseQty}
                disabled={productOutOfStock}
                aria-label="Increase quantity"
                className="w-9 h-9 flex items-center justify-center text-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <span
              className={`text-xs font-semibold transition-transform duration-300 ease-out inline-block ${
                qtyPulsing ? "scale-125" : "scale-100"
              } ${
                remainingProductStock === 0
                  ? "text-red-500"
                  : remainingProductStock <= 5
                  ? "text-orange-500"
                  : "text-green-600"
              }`}
            >
              {remainingProductStock === 0 ? "Out of stock" : `${remainingProductStock} left`}
            </span>
          </div>
        </div>
      )}

      {/* ── Add to cart (desktop) + view cart ── */}
      <button
        onClick={onAddToCart}
        disabled={addToCartDisabled}
        className="hidden sm:block w-full mt-6 bg-[#333333] hover:bg-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition"
      >
        {added
          ? "Added to cart ✓"
          : hasSizes && totalSelectedQty > 0
          ? `Add to Cart (${totalSelectedQty})`
          : "Add to Cart"}
      </button>

      <Link
        to="/cart"
        className="block text-center text-sm text-gray-500 hover:text-[#333333] mt-3 underline underline-offset-4"
      >
        View Cart
      </Link>

      {/* ── Fixed bottom action bar — mobile only ── */}
      <div
        className="sm:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 pt-3 flex gap-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={onAddToCart}
          disabled={addToCartDisabled}
          className="flex-1 bg-[#333333] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm"
        >
          {added
            ? "Added ✓"
            : hasSizes && totalSelectedQty > 0
            ? `Add to Cart (${totalSelectedQty}) · Rs. ${itemTotal}`
            : `Add to Cart · Rs. ${product.price}`}
        </button>
      </div>
    </div>
  );
};

export default ProductInfo;
import { useState } from "react"
import { useDispatch } from "react-redux"
import { addToCart } from "../../../assets/components/store/cartSlice"
import { useReveal } from "../hooks/useReveal"
import { useCountUp } from "../hooks/useCountUp"
import { CARD_3D, cx } from "../../../utils/cx"
import { CornerFold } from "./CornerFold"

export function LiveStockRow({ product, index }) {
  const dispatch = useDispatch()
  const [ref, visible] = useReveal()
  const [added, setAdded] = useState(false)
  const unitsLeft = useCountUp(product.unitsLeft, visible, 1200)
  const isLeftImage = index % 2 === 0
  const total = product.unitsLeft + product.unitsSold
  const soldPct = total > 0 ? Math.round((product.unitsSold / total) * 100) : 0
  const isLow = product.unitsLeft <= 8

  const handleAddToCart = () => {
    // Matches the real cart slice's addToCart(payload) shape:
    // { product, size, quantity, stock, color, image }.
    // Live Stock has no size picker, so size stays null — but color is
    // the product's actual default color (see getDefaultColor in
    // LiveStock.jsx), not hardcoded null.
    dispatch(
      addToCart({
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          category: product.category,
        },
        size: null,
        color: product.color,
        quantity: 1,
        stock: product.unitsLeft, // caps quantity at what Live Stock shows as available
        image: product.image,
      }),
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div
      ref={ref}
      className={cx(
        "grid grid-cols-1 items-center gap-5 md:grid-cols-2 md:gap-10",
        "transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        visible ? "opacity-100 translate-x-0" : cx("opacity-0", isLeftImage ? "-translate-x-10" : "translate-x-10"),
      )}
    >
      <div className={cx("group relative", isLeftImage ? "md:order-1" : "md:order-2")}>
        <div className={cx("relative overflow-hidden rounded-2xl bg-white", CARD_3D)}>
          <CornerFold variant="dark" />
          <div className="aspect-[16/10] w-full overflow-hidden">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
        </div>
      </div>

      <div className={cx("px-1", isLeftImage ? "md:order-2" : "md:order-1")}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
            {product.category}
          </p>
          {product.color && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <span
                className="h-3 w-3 rounded-full border border-gray-300"
                style={{ backgroundColor: product.color.toLowerCase() }}
                aria-hidden="true"
              />
              {product.color}
            </span>
          )}
        </div>
        <h3 className="mt-2 text-xl font-bold text-[#333333] sm:text-2xl md:text-3xl">
          {product.name}
        </h3>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-2xl font-bold tabular-nums text-[#333333] sm:text-3xl">
            {unitsLeft}
          </span>
          <span className="text-sm text-gray-500">units left in stock</span>
        </div>

        <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-100">
          <div
            className={cx(
              "h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isLow ? "animate-pulse bg-red-600" : "bg-[#333333]",
            )}
            style={{ width: visible ? `${soldPct}%` : "0%" }}
          />
        </div>
        <p className={cx("mt-2 text-xs font-medium", isLow ? "text-red-600" : "text-gray-500")}>
          {isLow ? "Selling fast — almost gone!" : `${product.unitsSold} sold`}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#333333]">Rs:{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className={cx(
              "w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out active:scale-95 sm:w-auto sm:py-2.5",
              added ? "bg-green-600" : "bg-[#333333] hover:bg-[#333333]/90",
            )}
          >
            {added ? "Added ✓" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  )
}

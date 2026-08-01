import { useMemo } from "react"
import { useCatalog } from "../hooks/useCatalog"
import { useHourBucket } from "../hooks/useHourBucket"
import { mulberry32, seededShuffle, seededInt } from "../../../utils/random"
import { getDisplayPrice, getDefaultColor } from "../../../utils/product"
import { LiveStockRow } from "./LiveStockRow"
import { Reveal } from "./Reveal"

// Field-name assumptions below (product.countInStock, product.images,
// product.category?.name) are based on common MERN product schemas.
// Adjust the destructuring inside `rotatingProducts` to match your
// actual Product model's exact field names.

export function LiveStock() {
  const { catalog, catalogLoading } = useCatalog()
  const hourBucket = useHourBucket()

  // Reshuffles only when the catalog changes OR the hour flips —
  // not on every render, and not differently for every visitor.
  const rotatingProducts = useMemo(() => {
    if (!catalog.length) return []

    const rng = mulberry32(hourBucket)
    const shuffled = seededShuffle(catalog, rng)

    return shuffled.slice(0, 4).map((product) => {
      const defaultColor = getDefaultColor(product)
      const displayPrice = getDisplayPrice(product)
      const originalPrice = Number(product.price) || 0

      // Prefer a real per-color stock count, then real overall stock,
      // then fall back to a seeded placeholder if neither exists.
      const stock =
        Number(defaultColor?.stock) > 0
          ? Number(defaultColor.stock)
          : typeof product.stock === "number"
            ? product.stock
            : seededInt(rng, 3, 40)

      // ⚠️ Simulated urgency number — your schema doesn't show a
      // "units sold" / sales-count field. This is seeded (stable for
      // the hour) but not real analytics. Swap for product.soldCount
      // (or similar) the moment that field exists on your backend.
      const sold = seededInt(rng, stock * 4, stock * 12)

      return {
        _id: product._id,
        name: product.name,
        category:
          typeof product.category === "string"
            ? product.category
            : product.category?.name || "Leyon",
        image:
          defaultColor?.image ||
          product.image ||
          product.images?.[0]?.url ||
          product.images?.[0] ||
          "/placeholder.svg",
        color: defaultColor?.color || defaultColor?.name || null,
        price: displayPrice,
        originalPrice: displayPrice < originalPrice ? originalPrice : null,
        unitsLeft: stock,
        unitsSold: sold,
      }
    })
  }, [catalog, hourBucket])

  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-10 md:py-16">
        <Reveal>
          <div className="mb-10 text-center md:mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Moving Fast
            </p>
            <h2 className="mt-2 text-balance text-2xl font-bold text-[#333333] sm:text-3xl md:text-4xl">
              Live Stock Updates
            </h2>
          </div>
        </Reveal>

        {catalogLoading && rotatingProducts.length === 0 && (
          <div className="flex flex-col gap-16">
            {[0, 1].map((i) => (
              <div key={i} className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-10">
                <div className="aspect-[16/10] w-full animate-pulse rounded-2xl bg-gray-200" />
                <div className="space-y-3">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-2 w-full max-w-md animate-pulse rounded-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!catalogLoading && rotatingProducts.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            No products available right now — check back shortly.
          </p>
        )}

        <div className="flex flex-col gap-12 md:gap-16">
          {rotatingProducts.map((product, i) => (
            <LiveStockRow key={product._id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

import { useMemo } from "react"
import { useCatalog } from "../hooks/useCatalog"
import { categories } from "../data/homeData"
import { CategoryCard } from "./CategoryCard"
import { Reveal } from "./Reveal"

// 🔑 Category name → actual route path mapping. Backend category names
// don't always match the frontend route slugs (e.g. "perfume" category
// lives at /fragrances), so this maps the mismatched ones explicitly.
// Anything not listed here falls back to the auto-derived slug.
const CATEGORY_SLUG_OVERRIDES = {
  perfume: "fragrances",
  // add more overrides here if other categories also mismatch, e.g.:
  // men: "men",
  // kids: "kids",
}

function useDerivedCategories(catalog) {
  return useMemo(() => {
    if (!catalog.length) return []

    const grouped = new Map()

    catalog.forEach((product) => {
      const rawCategory = product.category
      const name = typeof rawCategory === "string" ? rawCategory : rawCategory?.name
      if (!name) return

      const derivedSlug =
        (typeof rawCategory === "object" && rawCategory?.slug) ||
        name.toLowerCase().trim().replace(/\s+/g, "-")

      const slug = CATEGORY_SLUG_OVERRIDES[derivedSlug] || derivedSlug

      if (!grouped.has(slug)) {
        grouped.set(slug, {
          name,
          slug,
          image: product.displayImage || product.colors?.[0]?.image || "/placeholder.svg",
          count: 0,
        })
      }
      grouped.get(slug).count += 1
    })

    return Array.from(grouped.values())
  }, [catalog])
}

export function CategoryGrid() {
  const { catalog, catalogLoading } = useCatalog()
  const derivedCategories = useDerivedCategories(catalog)
  const displayCategories = derivedCategories.length > 0 ? derivedCategories : categories
  const isShowingFallback = derivedCategories.length === 0

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-10 md:py-16">
        <Reveal>
          <div className="mb-8 text-center md:mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Browse The Collection
            </p>
            <h2 className="mt-2 text-balance text-2xl font-bold text-[#333333] sm:text-3xl md:text-4xl">
              Shop By Category
            </h2>
          </div>
        </Reveal>

        {catalogLoading && isShowingFallback ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {displayCategories.map((category, i) => (
              <CategoryCard key={category.slug} category={category} delay={(i % 5) * 90} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
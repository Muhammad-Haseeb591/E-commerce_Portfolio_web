/* ------------------------------------------------------------------ */
/*  Real price + color helpers                                         */
/* ------------------------------------------------------------------ */
// Field names below (discountPrice, colors[].color, colors[].stock)
// are assumptions based on your cartSlice.js (which reads product.sizes,
// product.stock, and treats "color" as a string snapshot). Rename the
// fields inside these two functions to match your actual Product model
// — nothing else needs to change if you do.

export function getDisplayPrice(product) {
  // Prefer a discounted price if one exists and is actually lower.
  const base = Number(product.price) || 0
  const discounted = Number(product.discountPrice)
  if (discounted > 0 && discounted < base) return discounted
  return base
}

export function getDefaultColor(product) {
  if (!Array.isArray(product.colors) || product.colors.length === 0) return null
  // Prefer a color that still has stock; fall back to the first listed.
  const inStock = product.colors.find((c) => (Number(c.stock) || 0) > 0)
  return inStock || product.colors[0]
}

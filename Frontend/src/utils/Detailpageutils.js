// 🔑 Pure helper functions + constants extracted from Detail_Page.jsx —
// no logic changed, just moved so the main component file is smaller.

export const getItemId = (item) => item?._id ?? item?.id;

export const getStockValue = (source) => {
  const raw =
    source?.stock ??
    source?.quantity ??
    source?.qty ??
    source?.available ??
    source?.inStock;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

// Same canonical size ranges used in the admin form
// (Productformhelpers.jsx SHOE_SIZES_BY_CATEGORY). Kept in sync manually
// for now; if you already have a shared /utils/sizeRanges.js, import
// SHOE_SIZES_BY_CATEGORY from there instead of redefining it here so the
// two never drift apart again.
const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, i) => String(start + i));

export const SHOE_SIZES_BY_CATEGORY = {
  kids: range(25, 35),
  men: range(37, 44),
  women: range(36, 42),
};

// Given the product's type/category, returns the canonical ordered size
// list (or null if this product has no defined range, e.g. type "other"
// or category "sales").
export const getCanonicalSizeOrder = (type, category) =>
  type === "shoes" ? SHOE_SIZES_BY_CATEGORY[category] || null : null;

export const normalizeSizes = (rawSizes) => {
  if (!Array.isArray(rawSizes)) return [];

  const expanded = [];
  const seen = new Set();

  rawSizes.forEach((entry) => {
    if (!entry?.size) return;

    const sizeParts = String(entry.size)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const rawStock = entry?.stock ?? entry?.quantity ?? entry?.qty ?? entry?.available;
    const stockParts =
      typeof rawStock === "string" && rawStock.includes(",")
        ? rawStock.split(",").map((s) => Number(s.trim()))
        : null;

    sizeParts.forEach((size, i) => {
      if (seen.has(size)) return;
      seen.add(size);
      const stock = stockParts ? stockParts[i] ?? 0 : getStockValue(entry);
      expanded.push({ size, stock: Number.isFinite(stock) ? stock : 0 });
    });
  });

  return expanded;
};

// Orders (and, when a canonical range is known for this product's
// type+category, filters) the normalized sizes so display is consistent
// and defensive against stray/legacy sizes that don't belong to this
// category. If no canonical range applies (type "other", or a category
// with no shoe scale), falls back to a plain numeric sort so non-numeric
// or free-form sizes still render in a sane order.
export const orderSizesByCategory = (sizes, type, category) => {
  const canonicalOrder = getCanonicalSizeOrder(type, category);

  if (!canonicalOrder) {
    return [...sizes].sort((a, b) =>
      isNaN(a.size) || isNaN(b.size) ? 0 : Number(a.size) - Number(b.size)
    );
  }

  const bySize = new Map(sizes.map((s) => [s.size, s]));
  return canonicalOrder
    .filter((size) => bySize.has(size))
    .map((size) => bySize.get(size));
};

export const normalizeColors = (rawColors) => {
  if (!Array.isArray(rawColors)) return [];

  const seen = new Set();
  const expanded = [];

  rawColors.forEach((entry) => {
    const colorName =
      typeof entry === "string" ? entry : entry?.color ?? entry?.name ?? entry?.title;
    if (!colorName || seen.has(colorName)) return;
    seen.add(colorName);

    let imgs = entry?.images ?? entry?.image ?? entry?.img ?? [];
    if (!Array.isArray(imgs)) imgs = imgs ? [imgs] : [];
    imgs = imgs.filter(Boolean);

    expanded.push({
      color: colorName,
      images: imgs,
      stock: getStockValue(entry),
      sizes: Array.isArray(entry?.sizes) ? entry.sizes : null,
    });
  });

  return expanded;
};

const FAKE_NAMES = [
  "Ayesha K.", "Bilal R.", "Sana M.", "Hamza A.", "Zainab T.",
  "Usman F.", "Mahnoor S.", "Ali H.", "Fatima N.", "Talha Q.",
];
const FAKE_COMMENTS = [
  "Great quality, exceeded my expectations.",
  "Perfect fit, and delivery was on time.",
  "Good product, worth the price.",
  "Color was exactly as shown in the picture.",
  "Packaging was solid, product arrived in perfect condition.",
  "Runs a bit small, but otherwise everything is fine.",
  "Will definitely order again, great service.",
  "Good quality material, very comfortable too.",
];

export const generateFakeReviews = (seedId) => {
  let seed = 0;
  for (let i = 0; i < String(seedId).length; i++) seed += String(seedId).charCodeAt(i);

  const count = 4 + (seed % 4);
  const reviews = [];
  for (let i = 0; i < count; i++) {
    const nameIdx = (seed + i * 3) % FAKE_NAMES.length;
    const commentIdx = (seed + i * 5) % FAKE_COMMENTS.length;
    const rating = 3 + ((seed + i) % 3);
    reviews.push({
      id: `${seedId}-${i}`,
      name: FAKE_NAMES[nameIdx],
      rating,
      comment: FAKE_COMMENTS[commentIdx],
      daysAgo: 2 + ((seed + i * 7) % 40),
    });
  }
  return reviews;
};
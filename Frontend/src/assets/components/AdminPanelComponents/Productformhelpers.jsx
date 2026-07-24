import { API_URL } from "../../../config/api";
export const uploadToCloudinary = async (file) => {
  const uploadData = new window.FormData();
  uploadData.append("file", file);


  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    credentials: "include",
    body: uploadData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Upload failed (status ${res.status})`);
  }

  return data.url; // req.file.path (Cloudinary secure URL) from backend
};

// --- Fixed lookup lists -----------------------------------------------
// Fixed lists (instead of free text) keep the backend's exact-match
// filters (?category=kids, ?color=black) reliable — no typos, no casing mismatches.

export const CATEGORY_OPTIONS = [
  "men",
  "women",
  "sales",
  "perfume",
  "accessories",
  "getinspired",
  "kids",
];

export const TYPE_OPTIONS = ["shoes", "other"];

export const COLOR_OPTIONS = [
  "Black", "White", "Grey", "Navy", "Blue", "Red",
  "Green", "Yellow", "Pink", "Brown", "Beige", "Multicolor",
];

export const COLOR_SWATCH = {
  Black: "#000000", White: "#ffffff", Grey: "#9ca3af", Navy: "#1e3a5f",
  Blue: "#2563eb", Red: "#dc2626", Green: "#16a34a", Yellow: "#eab308",
  Pink: "#ec4899", Brown: "#78350f", Beige: "#e8dcc8", Multicolor:
    "linear-gradient(135deg, red, orange, yellow, green, blue, violet)",
};

// Shoe size ranges, per category. Sizes only ever apply when Type = "shoes"
// AND the category has a defined scale below — everything else (type =
// "other", or a category with no shoe scale) just uses a plain stock number.
const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, i) => String(start + i));

export const SHOE_SIZES_BY_CATEGORY = {
  kids: range(25, 36),
  men: range(38, 46),
  women: range(37, 42),
};

export const sizeOptionsFor = (type, category) =>
  type === "shoes" ? SHOE_SIZES_BY_CATEGORY[category] || null : null;

export const swatchStyle = (color) => {
  const value = COLOR_SWATCH[color];
  if (!value) return { background: "#e5e7eb" };
  return value.startsWith("linear") ? { background: value } : { backgroundColor: value };
};

// Converts a stored `sizes: [{ size, stock }]` array back into the toggle-box
// shape the forms use internally: { "40": 5, "42": 2, ... }
export const sizesArrayToStocks = (sizes = []) =>
  sizes.reduce((acc, { size, stock }) => {
    if (size && size !== "One Size") acc[size] = stock;
    return acc;
  }, {});
export const stocksToSizesArray = (sizeStocks, sizeOptions, plainStock) =>
  sizeOptions
    ? Object.entries(sizeStocks).map(([size, stock]) => ({
        size,
        stock: Number(stock) || 0,
      }))
    : [{ size: "One Size", stock: Number(plainStock) || 0 }];

// ── Colors ──────────────────────────────────────────────────────────────
// Mirrors the sizes helpers above, but for the per-color images+stock
// blocks used in the Colors section of both the Add and Edit forms.

// Empty block seed — used for the initial state and every "Add Color" click.
export const emptyColorBlock = () => ({ color: "", images: [""], stock: "" });

// Converts a saved product into the block-shape the forms use internally:
// [{ color, images: [...], stock }, ...]
//
// 🔑 Handles BOTH shapes a product can currently have in the DB:
//   - new products: `product.colors = [{ color, hex, images, stock }]`
//   - old/legacy products (migrated or not yet migrated): a single
//     `product.color` string, with the product's general `images`/`stock`
//     used as that one color's images/stock — so editing an old product
//     doesn't just show a blank Colors section.
export const colorsArrayToBlocks = (product) => {
  if (Array.isArray(product?.colors) && product.colors.length > 0) {
    return product.colors.map((c) => ({
      color: c.color || "",
      images: c.images?.length ? c.images : [""],
      stock: c.stock ?? "",
    }));
  }

  if (product?.color) {
    return [
      {
        color: product.color,
        images: product.images?.length ? product.images : [""],
        stock: product.stock ?? "",
      },
    ];
  }

  return [emptyColorBlock()];
};

// Converts the block-shape back into the `colors: [{ color, hex, images, stock }]`
// array that actually gets saved. Blocks left fully empty (no color picked)
// are dropped rather than causing a validation error.
export const blocksToColorsArray = (colorBlocks = []) =>
  colorBlocks
    .filter((c) => c.color && c.color.trim() !== "")
    .map((c) => ({
      color: c.color,
      hex:
        COLOR_SWATCH[c.color] && !COLOR_SWATCH[c.color].startsWith("linear")
          ? COLOR_SWATCH[c.color]
          : "",
      images: c.images.filter((img) => img.trim() !== ""),
      stock: Number(c.stock) || 0,
    }));

// Total stock derived from color blocks — same "sum it up" idea as
// stocksToSizesArray's total, used when a product has colors but no sizes.
export const colorBlocksTotalStock = (colorBlocks = []) =>
  blocksToColorsArray(colorBlocks).reduce((sum, c) => sum + (Number(c.stock) || 0), 0);
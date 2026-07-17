// Backend already handles Cloudinary upload (signed, via multer-storage-cloudinary)
// so we hit OUR server route, not Cloudinary directly — no upload_preset needed.
export const uploadToCloudinary = async (file) => {
  const uploadData = new window.FormData();
  uploadData.append("file", file);
  import { API_URL } from "../config/api";


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
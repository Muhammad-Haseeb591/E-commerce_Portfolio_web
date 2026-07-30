import { API_URL } from "../../../../config/api";
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
// "other", or a category with no shoe scale) just uses a plain per-color
// stock number instead of a size grid.
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
let colorBlockIdCounter = 0;
export const makeColorBlockId = () => `color-${Date.now()}-${colorBlockIdCounter++}`;

export const emptyColorBlock = () => ({
  id: makeColorBlockId(),
  color: "",
  image: "",
  stock: "",
  sizes: {},
});

// Effective stock for ONE color block, given whether a size scale applies.
export const colorBlockStock = (block, sizeOptions) =>
  sizeOptions
    ? Object.values(block.sizes || {}).reduce((sum, q) => sum + (Number(q) || 0), 0)
    : Number(block.stock) || 0;

// Total product stock = sum of every color block's effective stock.
export const colorBlocksTotalStock = (colorBlocks = [], sizeOptions) =>
  colorBlocks.reduce((sum, c) => sum + colorBlockStock(c, sizeOptions), 0);

export const colorsArrayToBlocks = (product) => {
  const legacySizesMap = (sizes = []) =>
    sizes.reduce((acc, { size, stock }) => {
      if (size && size !== "One Size") acc[size] = stock;
      return acc;
    }, {});

  const toBlock = (c) => {
    const sizesMap = legacySizesMap(c.sizes);
    const hasSizes = Object.keys(sizesMap).length > 0;
    return {
      id: makeColorBlockId(),
      color: c.color || "",
      // 🔑 supports both the new single `image` string AND the old
      // `images: [...]` array shape (pre-migration documents), so
      // editing an older product still shows its picture.
      image: c.image || c.images?.[0] || "",
      stock: hasSizes ? "" : String(c.stock ?? ""),
      sizes: sizesMap,
    };
  };

  if (Array.isArray(product?.colors) && product.colors.length > 0) {
    return product.colors.map(toBlock);
  }

  if (product?.color) {
    return [
      toBlock({
        color: product.color,
        image: product.image,
        images: product.images,
        stock: product.stock,
        sizes: product.sizes,
      }),
    ];
  }

  return [emptyColorBlock()];
};

// Converts the block-shape back into the `colors: [{ color, hex, images,
// sizes, stock }]` array that actually gets saved. Blocks left fully empty
// (no color picked) are dropped rather than causing a validation error.
// `sizeOptions` tells us whether this product currently has a size scale,
// so we know whether to read stock from `sizes` or from the plain `stock`
// number. The internal-only `id` is never included in the saved payload.
export const blocksToColorsArray = (colorBlocks = [], sizeOptions) =>
  colorBlocks
    .filter((c) => c.color && c.color.trim() !== "")
    .map((c) => {
      const sizesArr = sizeOptions
        ? Object.entries(c.sizes || {}).map(([size, stock]) => ({
            size,
            stock: Number(stock) || 0,
          }))
        : [];

      return {
        color: c.color,
        hex:
          COLOR_SWATCH[c.color] && !COLOR_SWATCH[c.color].startsWith("linear")
            ? COLOR_SWATCH[c.color]
            : "",
        image: (c.image || "").trim(),
        sizes: sizesArr,
        stock: sizeOptions
          ? sizesArr.reduce((sum, s) => sum + s.stock, 0)
          : Number(c.stock) || 0,
      };
    });
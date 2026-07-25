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

// 🔑 Stable id generator for color blocks. Both the Add form and the Edit
// form build their color blocks through this file (emptyColorBlock /
// colorsArrayToBlocks), so the id is generated right here — every block
// that ever exists in either form gets a permanent id at creation time.
// The forms then track/update blocks by this id instead of by array
// position, which is what prevents one color's data (image, stock,
// sizes) from ever landing on a different color block after an add/
// remove/reorder or a slow image upload resolving late.
let colorBlockIdCounter = 0;
export const makeColorBlockId = () => `color-${Date.now()}-${colorBlockIdCounter++}`;

// ── Colors ──────────────────────────────────────────────────────────────
// 🔑 SIZES ARE NOW PER-COLOR, not a separate top-level thing. Each color
// block looks like:
//   { id: "...", color: "Red", image: "...", stock: "12", sizes: { "40": 5, "41": 7 } }
//
// - `id` is internal-only (form state tracking), never sent to the backend
//   — blocksToColorsArray() below strips it back out.
// - `image` is a SINGLE image string (matches the schema's `colorSchema.image`
//   — no array, no "add another image for this color").
// - `sizes` is a toggle-box map (size -> quantity), only meaningful when
//   sizeOptionsFor(type, category) returns a non-null size scale (i.e.
//   type = "shoes" and the category has a defined range above).
// - `stock` is a plain manual number, only meaningful when there's NO size
//   scale (non-shoe products, or shoe categories without a defined range).
// A color's own effective stock is whichever of the two actually applies —
// see colorBlockStock() below. Never both at once.

// Empty block seed — used for the initial state and every "Add Color" click.
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

// Converts a saved product into the block-shape the forms use internally:
// [{ id, color, image, stock, sizes: {...} }, ...]
//
// 🔑 Handles BOTH shapes a product can currently have in the DB:
//   - current products: `product.colors = [{ color, hex, image, stock, sizes: [{size,stock}] }]`
//   - very old/pre-migration products that predate the `colors[]` array
//     entirely: a single `product.color` string with the product's own
//     (now-retired) top-level `image`/`images`/`stock`/`sizes` fields.
//     There is NO general/product-level image anymore going forward —
//     this branch exists only so opening an ancient, never-migrated
//     document doesn't show a blank Colors section.
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
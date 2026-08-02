const mongoose = require("mongoose");

// 🔑 productId auto-generation lives in product.controller.js's
// getAddProducts (plain function, called before the document is even
// constructed) — NOT here, and NOT as a Mongoose lifecycle hook. This is
// intentional: a pre("validate") hook on this schema was the root cause
// of the recurring "next is not a function" bug, since it fired on every
// .save() (including Update, which never touches productId). With no
// hook on this schema, that failure mode cannot happen regardless of
// Mongoose version.
//
// The field is still unique+sparse below, so duplicate productIds are
// still rejected at the DB level — this schema just doesn't manufacture
// one for you.

// ── Size ranges per (category, type) combo ──────────────────────────
// 🔑 Single source of truth on the backend for what sizes are valid.
// Mirrors the frontend's sizeOptionsFor() so a bug or bypassed client
// can never save a size outside the real range.
const range = (start, end) => {
  const out = [];
  for (let i = start; i <= end; i++) out.push(String(i));
  return out;
};

const SIZE_RANGES = {
  kids: range(25, 35),
  men: range(37, 44),
  women: range(36, 42),
};

// 🔑 CORRECTED — `type` is "shoes"/"other" (decides IF sizes apply),
// `category` is "men"/"women"/"kids"/etc (decides WHICH range). This
// matches CATEGORY_OPTIONS / TYPE_OPTIONS in Productformhelpers.jsx —
// do not swap the two params.
function getValidSizesFor(type, category) {
  if (type !== "shoes") return null; // "other" type -> no size grid at all
  return SIZE_RANGES[category] || null; // shoes but category has no defined range (e.g. "sales") -> no sizes
}

// 🔑 Size is per-color — har color ki apni size-wise stock hoti hai.
const sizeSchema = new mongoose.Schema(
  {
    size: { type: String, required: true }, // e.g. "40" (shoes) — validated further in colorSchema below
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

// 🔑 Colors — har color ki apni EK image + apni sizes + apna stock.
// Koi product-level "general image" nahi hai — image sirf color ke andar.
//
// `color` yahi exact string honi chahiye jo ProductForm.jsx ke
// COLOR_OPTIONS aur Filter.jsx ke color list me hai (casing match),
// warna filter query (?color=Black) kabhi match nahi karegi.
const colorSchema = new mongoose.Schema({
  color: { type: String, required: true },
  hex: { type: String, default: "" }, // optional, swatch dot ke liye
  image: { type: String, default: "" }, // is color ki apni image
  sizes: { type: [sizeSchema], default: [] }, // is color ke sizes + unka stock
  stock: { type: Number, default: 0, min: 0 }, // sizes diye ho to auto-sum hoga, warna manual value
});

// Duplicate sizes check — per-color (same color ke andar size repeat na ho)
colorSchema.path("sizes").validate(function (sizes) {
  const sizeList = sizes.map((s) => s.size);
  return sizeList.length === new Set(sizeList).size;
}, "Duplicate sizes are not allowed within the same color");

// Har color ka apna stock — agar sizes di gayi hon to unka sum.
colorSchema.pre("validate", function () {
  if (this.sizes && this.sizes.length > 0) {
    this.stock = this.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
  }
});

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, trim: true, unique: true, sparse: true },
    name: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    price: { type: Number, default: 0 },
    oldPrice: { type: Number, default: null },
    stock: { type: Number, default: 0 }, // total stock — colors[].stock ka sum (auto-calculated)
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "pending"],
    },
    isActive: { type: Boolean, default: true },

    // 🔑 REVERTED to match TYPE_OPTIONS = ["shoes", "other"] exactly.
    // type decides whether this product uses the size-grid at all.
    type: {
      type: String,
      default: "other",
      enum: ["shoes", "other"],
    },

    // 🔑 category decides WHICH size range applies when type === "shoes".
    // Matches CATEGORY_OPTIONS exactly — "sales"/"perfume"/"accessories"/
    // "getinspired" are valid categories too, they just have no size range
    // (getValidSizesFor returns null for them, same as before).
    category: {
      type: String,
      default: "",
      enum: ["men", "women", "sales", "perfume", "accessories", "getinspired", "kids"],
    },

    colors: { type: [colorSchema], default: [] },
    bg: { type: String, default: "" },
    discount: { type: String, default: "" },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Duplicate colors check
productSchema.path("colors").validate(function (colors) {
  const colorList = colors.map((c) => c.color);
  return colorList.length === new Set(colorList).size;
}, "Duplicate colors are not allowed");

// 🔑 FIXED — was `function (next) { ... next(); }` (callback-style),
// which is exactly the pattern that caused the earlier "next is not a
// function" bug on productId (see the note at the top of this file).
// This project's Mongoose/kareem version does not reliably support
// callback-style pre("validate") hooks. Switched to the SAME sync-throw
// style that colorSchema's stock-rollup hook above already uses safely —
// no `next` param anywhere, throwing an Error inside a plain sync
// function is what rejects the validation.
productSchema.pre("validate", function () {
  const validSizes = getValidSizesFor(this.type, this.category);

  // Only enforce when this product is type "shoes" with a recognized
  // category. "other" type products never carry sizes.
  if (this.type === "shoes" && validSizes) {
    const allowed = new Set(validSizes);
    for (const c of this.colors || []) {
      for (const s of c.sizes || []) {
        if (!allowed.has(s.size)) {
          throw new Error(
            `Invalid size "${s.size}" for category "${this.category}" — allowed sizes are ${validSizes.join(", ")}`
          );
        }
      }
    }
  }
});

// Auto-calculate total product stock = sum of all colors' stock
productSchema.pre("save", function () {
  if (this.colors && this.colors.length > 0) {
    this.stock = this.colors.reduce((sum, c) => {
      const colorStock =
        c.sizes && c.sizes.length > 0
          ? c.sizes.reduce((s, sz) => s + (Number(sz.stock) || 0), 0)
          : Number(c.stock) || 0;
      return sum + colorStock;
    }, 0);
  }
});

module.exports = mongoose.model("Product", productSchema);
module.exports.getValidSizesFor = getValidSizesFor; // reused by the controller 
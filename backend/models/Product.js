const mongoose = require("mongoose");

// 🔑 CHANGED — productId auto-generation moved OUT of this model entirely
// (per explicit request: the model should not generate it on its own).
// It's now generated in product.controller.js's getAddProducts instead,
// as a plain function call before the document is even constructed — no
// Mongoose lifecycle hook involved. This also permanently removes the
// class of bug that kept causing "next is not a function": that error
// came from a pre("validate") hook living HERE, which fired on every
// single .save() including Update — even though Update never touches
// productId. With no hook on this schema at all, that failure mode is
// gone regardless of which Mongoose version is installed.
//
// The field itself is still unique+sparse below, so it still protects
// against two products ending up with the same productId — it just no
// longer manufactures one for you.

// 🔑 Size ab per-color hai — har color ke andar apni size-wise stock hogi.
const sizeSchema = new mongoose.Schema(
  {
    size: { type: String, required: true }, // "40", "L", "XL" sab chalega
    stock: { type: Number, default: 0 },
  },
  { _id: false }
);

// 🔑 Colors — har color ki apni EK image + apni sizes + apna stock.
// Koi product-level "general image" ab nahi hai — image sirf color ke
// andar hoti hai (khali bhi ho sakti hai agar seller ne skip kar diya).
//
// `color` yahi wahi string honi chahiye jo ProductForm.jsx ke
// COLOR_OPTIONS aur Filter.jsx ke color list me hai (casing match),
// warna filter query (?color=Black) kabhi match nahi karegi.
//
// Structure example:
//   colors: [
//     { color: "Red",  image: "https://...", sizes: [{size:"M",stock:5},{size:"L",stock:3}] },
//     { color: "Blue", image: "https://...", sizes: [{size:"M",stock:2}] },
//   ]
const colorSchema = new mongoose.Schema({
  color: { type: String, required: true },
  hex: { type: String, default: "" }, // optional, swatch dot ke liye (Detail_Page/Filter me use ho sakta)
  image: { type: String, default: "" }, // is color ki apni image
  sizes: { type: [sizeSchema], default: [] }, // is color ke sizes + unka stock
  stock: { type: Number, default: 0 }, // sizes diye ho to auto-sum hoga (pre-validate), warna manual value use hogi
});

// Duplicate sizes check — per-color chalta hai (same color ke andar size repeat na ho,
// alag colors me same size name chal sakta hai, koi issue nahi).
colorSchema.path("sizes").validate(function (sizes) {
  const sizeList = sizes.map((s) => s.size);
  return sizeList.length === new Set(sizeList).size;
}, "Duplicate sizes are not allowed within the same color");

// Har color ka apna stock — agar us color ke andar sizes di gayi hon to unka sum.
colorSchema.pre("validate", function () {
  if (this.sizes && this.sizes.length > 0) {
    this.stock = this.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
  }
});

const productSchema = new mongoose.Schema(
  {
    // Clean-searching ke liye — ProductForm.jsx ab har product ke
    // sath ek stable productId bhi bhejta hai. `unique` + `sparse` so
    // purane/legacy products (jo is field se pehle bane thay aur is
    // field ko poori tarah miss karte hain) is index ko break na karein.
    // Generated in the controller (getAddProducts), not here — see the
    // note at the top of this file.
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
    type: { type: String, default: "other", enum: ["shoes", "other"] },
    colors: { type: [colorSchema], default: [] },
    bg: { type: String, default: "" },
    discount: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    category: { type: String, default: "" },
  },
  { timestamps: true } // createdAt + updatedAt dono auto-handle ho jayenge
);

// Duplicate colors check
productSchema.path("colors").validate(function (colors) {
  const colorList = colors.map((c) => c.color);
  return colorList.length === new Set(colorList).size;
}, "Duplicate colors are not allowed");

// Auto-calculate total product stock = sum of all colors' stock
// (jo khud sizes ka sum hota hai agar sizes di gayi hon, warna manual color.stock)
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
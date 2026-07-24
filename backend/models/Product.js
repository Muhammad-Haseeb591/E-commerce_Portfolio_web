const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true }, // "40", "L", "XL" sab chalega
  stock: { type: Number, default: 0 },
});

// 🔑 Colors — har color ki apni images + apna stock.
// `color` yahi wahi string honi chahiye jo ProductForm.jsx ke COLOR_OPTIONS
// aur Filter.jsx ke color list me hai (casing match), warna filter query
// (?color=Black) kabhi match nahi karegi.
const colorSchema = new mongoose.Schema({
  color: { type: String, required: true },
  hex: { type: String, default: "" }, // optional, swatch dot ke liye (Detail_Page/Filter me use ho sakta)
  images: { type: [String], default: [] }, // is color ki apni images; empty ho to Detail_Page product.images pe fallback karega
  stock: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    images: { type: [String], default: [] }, // general/fallback images (jab kisi color ki apni image na ho)
    price: { type: Number, default: 0 },
    oldPrice: { type: Number, default: null },
    stock: { type: Number, default: 0 },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "pending"],
    },
    isActive: { type: Boolean, default: true },
    // 🔑 Purana single `color` field hata diya — ab colors[] array hi
    // source of truth hai. (Neeche note dekhein: Filter.jsx aur GET
    // products route ko is field ki jagah `colors.color` pe query karni
    // hogi.)
    colors: { type: [colorSchema], default: [] },
    bg: { type: String, default: "" },
    discount: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    sizes: { type: [sizeSchema], default: [] },
    category: { type: String, default: "" },
  },
  { timestamps: true } // createdAt + updatedAt dono auto-handle ho jayenge
);

// Duplicate sizes check
productSchema.path("sizes").validate(function (sizes) {
  const sizeList = sizes.map((s) => s.size);
  return sizeList.length === new Set(sizeList).size;
}, "Duplicate sizes are not allowed");

// 🔑 Duplicate colors check — same idea as sizes above.
productSchema.path("colors").validate(function (colors) {
  const colorList = colors.map((c) => c.color);
  return colorList.length === new Set(colorList).size;
}, "Duplicate colors are not allowed");

// Auto-calculate total stock.
// 🔑 Priority: sizes > colors > manual `stock` field.
//   - sizes diye gaye hon (shoes wagera)      → stock = sum(sizes.stock)
//   - warna agar colors diye gaye hon         → stock = sum(colors.stock)
//   - warna jo manually `stock` field me diya gaya wahi rehta hai
// Note: agar ek hi product me sizes AND colors dono diye jayen (e.g. shoes
// jinke multiple colors bhi hon), total stock abhi sirf sizes se calculate
// hoga — color+size ka combined stock-matrix is schema me support nahi
// hai. Agar wo chahiye to har size-entry ke andar per-color break-up
// (nested array) chahiye hoga, jo alag change hai.
productSchema.pre("save", function () {
  if (this.sizes && this.sizes.length > 0) {
    this.stock = this.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
  } else if (this.colors && this.colors.length > 0) {
    this.stock = this.colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0);
  }
});

module.exports = mongoose.model("Product", productSchema);
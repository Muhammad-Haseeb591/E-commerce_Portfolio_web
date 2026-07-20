const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true }, // "40", "L", "XL" sab chalega
  stock: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    price: { type: Number, default: 0 },
    oldPrice: { type: Number, default: null },
    stock: { type: Number, default: 0 },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "pending"],
    },
    isActive: { type: Boolean, default: true },
    color: { type: String, default: "" },
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

// Auto-calculate total stock from sizes (agar sizes diye gaye hon)
productSchema.pre("save", function () {
  if (this.sizes && this.sizes.length > 0) {
    this.stock = this.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
  }
});

module.exports = mongoose.model("Product", productSchema);
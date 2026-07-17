const express = require("express");
const productController = require("../controllers/product.controller");
const { productRouter } = require("./product.routes");
const { protect, authorize } = require("../middleware/auth.Middleware");

const adminRoute = express.Router();

// ── Write operations — sirf admin kar sakta hai ──
adminRoute.post(
  "/addproducts",
  protect,
  authorize("admin"),
  productController.getAddProducts
);

adminRoute.delete(
  "/deleteproduct/:id",
  protect,
  authorize("admin"),
  productController.deleteProduct
);

adminRoute.put(
  "/updateproduct/:id",
  protect,
  authorize("admin"),
  productController.updateProduct
);

// ⚠️ FIX: yahan se protect aur authorize HATA diya.
// productRouter sirf GET (read) routes hai — public hona chahiye,
// koi bhi visitor products dekh sake bina login kiye.
adminRoute.use("/products", productRouter);

module.exports = adminRoute;
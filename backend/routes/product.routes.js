const express = require("express")
const productController = require("../controllers/product.controller");
const productRouter = express.Router();

// Public read-only routes — koi bhi visitor access kar sakta hai, login zaroori nahi
productRouter.get("/getproducts", productController.fetchAllProducts)
productRouter.get("/getproducts/:id", productController.fetchProductDetailsById)

exports.productRouter = productRouter;
const express = require("express");
const router = express.Router();

const {
  createReview,
  getFeaturedReviews,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
} = require("../controllers/review.controller");

const { protect } = require("../middleware/auth.middleware");

// Adjust this import to wherever your multer-storage-cloudinary instance
// lives (the same one used for product images) — it must expose `.array()`.
const upload = require("../middleware/upload");

// Public — homepage "what our customers say" widget (top-rated, all products)
router.get("/featured", getFeaturedReviews);

// Public — anyone can read a product's reviews
router.get("/product/:productId", getProductReviews);

// Logged-in user routes
router.get("/mine", protect, getMyReviews);
router.post("/", protect, upload.array("images", 5), createReview);
router.put("/:id", protect, upload.array("images", 5), updateReview);
router.delete("/:id", protect, deleteReview);

module.exports = router;
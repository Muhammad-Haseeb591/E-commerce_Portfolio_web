const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product"); // adjust path to your actual Product model

// ==========================
// Helper — recompute a product's average rating + review count
// Called any time a review is created, updated (rating changed), or deleted,
// so Product.rating always reflects the current review set.
// ==========================
const recalcProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  const rating = stats.length ? Number(stats[0].avgRating.toFixed(1)) : 0;
  const numReviews = stats.length ? stats[0].numReviews : 0;

  await Product.findByIdAndUpdate(productId, { rating, numReviews });
};

// ==========================
// Create Review
// One review per user per product — the schema's unique index enforces
// this at the DB level, we just turn that into a clean 409 response.
// ==========================
exports.createReview = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { productId, rating, title, comment } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(productId).select("_id");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const images = req.files?.length ? req.files.map((f) => f.path || f.secure_url) : [];

    const review = await Review.create({
      productId,
      userId: req.userId,
      rating: numericRating,
      title: title?.trim() || "",
      comment: comment?.trim() || "",
      images,
    });

    await recalcProductRating(productId);

    return res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key from the unique (productId, userId) index
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }
    console.error("Create Review Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================
// Get Reviews for a Product (public — paginated)
// ==========================
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [reviews, totalCount, ratingStats] = await Promise.all([
      Review.find({ productId })
        .populate("userId", "fullName avatar") 
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ productId }),
      Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId) } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ]),
    ]);

    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach((r) => { ratingBreakdown[r._id] = r.count; });

    const average = totalCount
      ? Number(
          (Object.entries(ratingBreakdown).reduce(
            (sum, [star, count]) => sum + Number(star) * count, 0
          ) / totalCount).toFixed(1)
        )
      : 0;

    return res.status(200).json({
      success: true,
      reviews,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      page,
      average,
      ratingBreakdown,
    });
  } catch (error) {
    console.error("Get Product Reviews Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================
// Get Logged-in User's Own Reviews
// ==========================
exports.getMyReviews = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const reviews = await Review.find({ userId: req.userId })
      .populate("productId", "name images")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("Get My Reviews Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================
// Update Own Review
// ==========================
exports.updateReview = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid review id" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    if (String(review.userId) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own reviews.",
      });
    }

    const { rating, title, comment } = req.body;
    let ratingChanged = false;

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (!numericRating || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
      }
      ratingChanged = numericRating !== review.rating;
      review.rating = numericRating;
    }

    if (title !== undefined) {
      review.title = title.trim();
    }

    if (comment !== undefined) {
      review.comment = comment.trim();
    }

    // New set of images replaces the old ones
    if (req.files?.length) {
      review.images = req.files.map((f) => f.path || f.secure_url);
    }

    await review.save();

    if (ratingChanged) {
      await recalcProductRating(review.productId);
    }

    return res.status(200).json({ success: true, review });
  } catch (error) {
    console.error("Update Review Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================
// Delete Own Review
// ==========================
exports.deleteReview = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid review id" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    if (String(review.userId) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews.",
      });
    }

    await review.deleteOne();
    await recalcProductRating(review.productId);

    return res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("Delete Review Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
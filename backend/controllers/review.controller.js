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
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Please log in to leave a review.",
      });
    }

    const { productId, rating, title, comment } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PRODUCT_ID",
        message: "This product ID doesn't look right.",
      });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        code: "INVALID_RATING",
        message: "Please give a rating between 1 and 5.",
      });
    }

    const product = await Product.findById(productId).select("_id");
    if (!product) {
      return res.status(404).json({
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "We couldn't find this product.",
      });
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

    return res.status(201).json({
      success: true,
      code: "REVIEW_CREATED",
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key from the unique (productId, userId) index
      return res.status(409).json({
        success: false,
        code: "REVIEW_ALREADY_EXISTS",
        message: "You've already reviewed this product.",
      });
    }
    console.error("[CreateReview] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Couldn't submit your review. Please try again.",
    });
  }
};

// ==========================
// Get Featured Reviews (public — homepage "what our customers say")
// Top-rated reviews across ALL products, not scoped to one productId.
// Only reviews with a comment (or title) are eligible, so the homepage
// never shows a bare star rating with no text. Sorted by rating desc,
// then most recent, capped at a small count since this is a homepage
// widget, not a paginated list.
// ==========================
exports.getFeaturedReviews = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 8, 20);

    const reviews = await Review.find({
      rating: { $gte: 4 },
      $or: [
        { comment: { $exists: true, $ne: "" } },
        { title: { $exists: true, $ne: "" } },
      ],
    })
      .populate("userId", "fullName avatar")
      .populate("productId", "name images")
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit);

    return res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("[GetFeaturedReviews] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Couldn't load featured reviews. Please try again.",
    });
  }
};

// ==========================
// Get Reviews for a Product (public — paginated)
// ==========================
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PRODUCT_ID",
        message: "This product ID doesn't look right.",
      });
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
    console.error("[GetProductReviews] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Couldn't load reviews. Please try again.",
    });
  }
};

// ==========================
// Get Logged-in User's Own Reviews
// ==========================
exports.getMyReviews = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Please log in to view your reviews.",
      });
    }

    const reviews = await Review.find({ userId: req.userId })
      .populate("productId", "name images")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("[GetMyReviews] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Couldn't load your reviews. Please try again.",
    });
  }
};

// ==========================
// Update Own Review
// ==========================
exports.updateReview = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Please log in to update a review.",
      });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_REVIEW_ID",
        message: "This review ID doesn't look right.",
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        code: "REVIEW_NOT_FOUND",
        message: "We couldn't find this review.",
      });
    }

    if (String(review.userId) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "You can only update your own reviews.",
      });
    }

    const { rating, title, comment } = req.body;
    let ratingChanged = false;

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (!numericRating || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          success: false,
          code: "INVALID_RATING",
          message: "Please give a rating between 1 and 5.",
        });
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

    return res.status(200).json({
      success: true,
      code: "REVIEW_UPDATED",
      review,
    });
  } catch (error) {
    console.error("[UpdateReview] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Couldn't update your review. Please try again.",
    });
  }
};

// ==========================
// Delete Own Review
// ==========================
exports.deleteReview = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Please log in to delete a review.",
      });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_REVIEW_ID",
        message: "This review ID doesn't look right.",
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        code: "REVIEW_NOT_FOUND",
        message: "We couldn't find this review.",
      });
    }

    if (String(review.userId) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "You can only delete your own reviews.",
      });
    }

    await review.deleteOne();
    await recalcProductRating(review.productId);

    return res.status(200).json({
      success: true,
      code: "REVIEW_DELETED",
      message: "Your review has been deleted.",
    });
  } catch (error) {
    console.error("[DeleteReview] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Couldn't delete your review. Please try again.",
    });
  }
};
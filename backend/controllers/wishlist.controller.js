const mongoose = require('mongoose');
const User = require("../models/User");
const Product = require('../models/Product');


/**
 * POST /favourites/:productId
 * Adds a product to the logged-in user's favourites list.
 */
const addToFavourite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId; // protect middleware sets req.userId directly (not req.user.id)

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PRODUCT_ID",
        message: "This product ID doesn't look right.",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "We couldn't find this product.",
      });
    }

    const user = await User.findById(userId)
      .populate("favourites");
    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "We couldn't find your account.",
      });
    }

    const alreadyFavourite = user.favourites.some(
      (favId) => favId.toString() === productId
    );

    if (alreadyFavourite) {
      return res.status(400).json({
        success: false,
        code: "ALREADY_FAVOURITED",
        message: "This is already in your favourites.",
      });
    }

    user.favourites.push(productId);
    await user.save();

    return res.status(200).json({
      success: true,
      code: "FAVOURITE_ADDED",
      message: "Added to your favourites!",
      favourites: user.favourites,
    });
  } catch (error) {
    console.error("[AddToFavourite] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
};


/**
 * DELETE /favourites/:productId
 * Removes a product from the logged-in user's favourites list.
 */
const removeFromFavourite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId; // protect middleware sets req.userId directly (not req.user.id)

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PRODUCT_ID",
        message: "This product ID doesn't look right.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "We couldn't find your account.",
      });
    }

    const isFavourite = user.favourites.some(
      (favId) => favId.toString() === productId
    );

    if (!isFavourite) {
      return res.status(400).json({
        success: false,
        code: "NOT_FAVOURITED",
        message: "This isn't in your favourites.",
      });
    }

    user.favourites = user.favourites.filter(
      (favId) => favId.toString() !== productId
    );

    await user.save();

    return res.status(200).json({
      success: true,
      code: "FAVOURITE_REMOVED",
      message: "Removed from your favourites.",
      favourites: user.favourites,
    });
  } catch (error) {
    console.error("[RemoveFromFavourite] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
};


/**
 * PUT /favourites/:productId/toggle
 * Toggles a product's favourite status for the logged-in user.
 */
const toggleFavourite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId; // protect middleware sets req.userId directly (not req.user.id)

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PRODUCT_ID",
        message: "This product ID doesn't look right.",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "We couldn't find this product.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "We couldn't find your account.",
      });
    }

    const index = user.favourites.findIndex(
      (favId) => favId.toString() === productId
    );

    let isFavourite;

    if (index > -1) {
      user.favourites.splice(index, 1);
      isFavourite = false;
    } else {
      user.favourites.push(productId);
      isFavourite = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      code: isFavourite ? "FAVOURITE_ADDED" : "FAVOURITE_REMOVED",
      message: isFavourite ? "Added to your favourites!" : "Removed from your favourites.",
      isFavourite,
      favourites: user.favourites,
    });
  } catch (error) {
    console.error("[ToggleFavourite] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
};


/**
 * GET /favourites
 * Returns the logged-in user's full favourites list (populated with product data).
 */
const getFavourites = async (req, res) => {
  try {
    const userId = req.userId; // protect middleware sets req.userId directly (not req.user.id)

    const user = await User.findById(userId).populate('favourites');
    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "We couldn't find your account.",
      });
    }

    return res.status(200).json({
      success: true,
      count: user.favourites.length,
      favourites: user.favourites,
    });
  } catch (error) {
    console.error("[GetFavourites] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
};


module.exports = {
  addToFavourite,
  removeFromFavourite,
  toggleFavourite,
  getFavourites,
};
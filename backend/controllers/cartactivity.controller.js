const CartActivity = require("../models/CartActivitySchema");


exports.syncCartActivity = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Please log in to sync your cart.",
      });
    }

    const itemCount = Number(req.body.itemCount) || 0;

    if (itemCount === 0) {
      await CartActivity.deleteOne({ user: userId });

      return res.status(200).json({
        success: true,
        code: "CART_ACTIVITY_CLEARED",
        cleared: true,
      });
    }

    await CartActivity.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        itemCount,
        lastUpdatedAt: new Date(),
        reminderSentAt: null,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      code: "CART_ACTIVITY_SYNCED",
    });

  } catch (error) {
    console.error("[SyncCartActivity] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Couldn't sync your cart. Please try again.",
    });
  }
};
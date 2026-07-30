const CartActivity = require("../models/CartActivitySchema");

// ── Sync cart activity ───────────────────────────
// POST /api/cart/activity   body: { itemCount: number }
// Called by CartSync.jsx (debounced) every time the cart's contents
// change. Assumes an auth middleware upstream sets req.user (adjust the
// `req.user._id` / `req.user.id` line below to match your existing
// auth middleware's shape).
exports.syncCartActivity = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const itemCount = Number(req.body.itemCount) || 0;

    // 🔑 Cart khali ho gaya (checkout complete ya Clear All) — record
    // hata do taake koi purana/stale reminder na chala jaye.
    if (itemCount === 0) {
      await CartActivity.deleteOne({ user: userId });
      return res.status(200).json({ success: true, cleared: true });
    }

    // 🔑 Naya activity aayi — lastUpdatedAt refresh, aur reminderSentAt
    // wapis null (agla 1hr-idle window dobara "unreminded" gina jayega).
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

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Cart activity sync error:", error);
    // Best-effort feature — cart itself already works via localStorage,
    // so a failure here shouldn't surface as a user-facing cart error.
    res.status(500).json({ success: false, message: "Failed to sync cart activity" });
  }
};
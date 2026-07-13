// ─────────────────────────────────────────────────────────
// PASTE THIS into your existing order.controller.js and add
// `cancelOrder` to the module.exports (or exports.cancelOrder = ...)
// Adjust `Order` (model import) and the field names below
// (userId / status) if your schema names them differently.
// ─────────────────────────────────────────────────────────

const CANCELLABLE_STATUSES = ["pending", "placed", "processing"];

exports.cancelOrder = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Customers can only cancel their own orders — this is what stops
    // someone from cancelling another user's order by guessing an id.
    if (String(order.userId) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own orders.",
      });
    }

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `This order can no longer be cancelled (current status: ${order.status}).`,
      });
    }

    order.status = "cancelled";
    await order.save();

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
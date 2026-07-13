const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

// Wraps a route handler so any thrown/rejected error automatically gets a
// clean 500 response instead of crashing the process or hanging the
// request. Individual handlers can still use their own try/catch for
// cases that need a specific status code or message (e.g. rollback logic).
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`${req.method} ${req.originalUrl} —`, error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  });
};

// ==========================
// Stock helpers
// ==========================
const decrementStockForItem = async ({ productId, size, quantity }) => {
  if (size) {
    return Product.findOneAndUpdate(
      {
        _id: productId,
        sizes: { $elemMatch: { size, stock: { $gte: quantity } } },
      },
      {
        $inc: {
          "sizes.$[elem].stock": -quantity,
          // findOneAndUpdate skips the pre-save hook that recalculates the
          // total, so the top-level stock is kept in sync manually here.
          stock: -quantity,
        },
      },
      { arrayFilters: [{ "elem.size": size }], new: true }
    );
  }

  return Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true }
  );
};

// If the order fails partway through (out-of-stock item / DB error), undo
// every decrement that already happened so stock is never left wrong.
const rollbackDecrements = async (decremented) => {
  await Promise.all(
    decremented.map(async ({ productId, size, quantity }) => {
      try {
        if (size) {
          await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { "sizes.$[elem].stock": quantity, stock: quantity } },
            { arrayFilters: [{ "elem.size": size }] }
          );
        } else {
          await Product.findOneAndUpdate({ _id: productId }, { $inc: { stock: quantity } });
        }
      } catch (err) {
        // Rollback itself failing shouldn't hide the original error —
        // just log it, don't throw.
        console.error("Stock rollback failed for", productId, size, err.message);
      }
    })
  );
};

// Statuses a customer is still allowed to self-cancel from. Once an order
// leaves this list (shipped/delivered/cancelled), cancellation must go
// through a return/refund flow instead — see cancelOrder below.
// NOTE: must match CANCELLABLE_STATUSES in the frontend order slice/component,
// and must include "pending" since that's the Order schema's default status.
const CANCELLABLE_STATUSES = ["pending", "placed", "processing"];

// ==========================
// Create Order
// ==========================
exports.createOrder = asyncHandler(async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: "login first to place an order",
    });
  }

  const { items, totalAmount, shippingAddress, email } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "No items in the order." });
  }
  if (!totalAmount || !shippingAddress || !email) {
    return res.status(400).json({
      success: false,
      message: "totalAmount, shippingAddress and email are required.",
    });
  }

  // Duplicate-request guard (double click / network retry) — stock was
  // already decremented on the original request, so don't touch it again.
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
  const existingOrder = await Order.findOne({
    email,
    totalAmount,
    items: { $size: items.length },
    createdAt: { $gte: thirtySecondsAgo },
  }).sort({ createdAt: -1 });

  if (existingOrder) {
    return res.status(200).json({ success: true, order: existingOrder, duplicate: true });
  }

  // Stock is decremented BEFORE Order.create() so a short-on-stock item
  // blocks order creation entirely, with earlier decrements rolled back.
  const decremented = [];

  for (const item of items) {
    const { productId, size, quantity } = item;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      await rollbackDecrements(decremented);
      return res.status(400).json({ success: false, message: `Invalid product id: ${productId}` });
    }

    const updated = await decrementStockForItem({ productId, size, quantity });

    if (!updated) {
      // Either the product/size wasn't found, or stock ran out.
      await rollbackDecrements(decremented);
      return res.status(409).json({
        success: false,
        message: `"${item.name || productId}"${size ? ` (size ${size})` : ""} is out of stock.`,
      });
    }

    decremented.push({ productId, size, quantity });
  }

  let order;
  try {
    // Items are saved as-is — color/size/quantity/price all come straight
    // from the frontend, so the Order model's items sub-schema needs to
    // accept these fields or Mongoose will silently strip them.
    order = await Order.create({ userId: req.userId, email, items, totalAmount, shippingAddress });
  } catch (orderErr) {
    await rollbackDecrements(decremented);
    throw orderErr; // caught by asyncHandler -> clean 500
  }

  return res.status(201).json({ success: true, order });
});

// ==========================
// Get logged-in user's own orders
// ==========================
exports.getOrders = asyncHandler(async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, orders });
});

// ==========================
// Get ALL orders — admin panel
// ==========================
exports.getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("userId", "fullName email")
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, orders });
});

// ==========================
// Update order — admin edit modal
// ==========================
exports.updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order nahi mila" });
  }

  const {
    status,
    totalAmount,
    email,
    shippingAddress,
    items,
    trackingNumber,
    carrier,
    estimatedDelivery,
    note, // optional note attached to this status change (e.g. "Left warehouse")
  } = req.body;

  // Only fields actually sent get updated — undefined fields are skipped.
  if (status !== undefined) order.status = status;
  if (totalAmount !== undefined) order.totalAmount = totalAmount;
  if (email !== undefined) order.email = email;
  if (shippingAddress !== undefined) order.shippingAddress = shippingAddress;
  if (items !== undefined) order.items = items;
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  if (carrier !== undefined) order.carrier = carrier;
  if (estimatedDelivery !== undefined) order.estimatedDelivery = estimatedDelivery;

  // If the status actually changed and a note was sent, attach it to the
  // newest statusHistory entry that the pre-save hook is about to push.
  const willAddNote = note !== undefined && status !== undefined && status !== order.status;

  const updatedOrder = await order.save();

  if (willAddNote && updatedOrder.statusHistory.length) {
    updatedOrder.statusHistory[updatedOrder.statusHistory.length - 1].note = note;
    await updatedOrder.save();
  }

  return res.status(200).json({ success: true, message: "Order successfully updated", order: updatedOrder });
});

// ==========================
// Delete order — admin trash button
// ==========================
exports.deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  const order = await Order.findByIdAndDelete(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order nahi mila" });
  }

  return res.status(200).json({ success: true, message: "Order successfully deleted", id });
});

// ==========================
// Get single order by ID — admin edit modal, fresh data
// ==========================
exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order nahi mila" });
  }

  return res.status(200).json({ success: true, order });
});

// ==========================
// Track order — customer-facing (order number based, no Mongo _id needed)
// Works for:
//   - Guests: GET /orders/track/1043?email=someone@example.com
//   - Logged-in users: GET /orders/track/1043 (matched against req.userId)
// ==========================
exports.trackOrder = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const { email } = req.query;

  const numericOrderNumber = Number(orderNumber);
  if (!orderNumber || Number.isNaN(numericOrderNumber)) {
    return res.status(400).json({ success: false, message: "Valid order number is required." });
  }

  const query = { orderNumber: numericOrderNumber };

  if (req.userId) {
    query.userId = req.userId; // logged-in — only their own orders, no email needed
  } else if (email) {
    query.email = email; // guest — must match the order's email
  } else {
    return res.status(400).json({ success: false, message: "Email is required to track a guest order." });
  }

  const order = await Order.findOne(query).select(
    "orderNumber status paymentStatus statusHistory trackingNumber carrier estimatedDelivery items totalAmount shippingAddress createdAt"
  );

  if (!order) {
    return res.status(404).json({ success: false, message: "Order nahi mila. Order number aur email check karein." });
  }

  return res.status(200).json({ success: true, order });
});

// ==========================
// Cancel order — customer-facing self-cancel
// Route: PUT /orders/:id/cancel  (must match orderSlice.cancelOrder thunk)
// Only the order's own owner can cancel it, and only while it's still in
// an early enough status (see CANCELLABLE_STATUSES above).
// ==========================
exports.cancelOrder = asyncHandler(async (req, res) => {
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
});
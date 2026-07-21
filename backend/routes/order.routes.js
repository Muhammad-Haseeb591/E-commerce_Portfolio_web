const express = require("express");

const paymentRouter = express.Router();
const orderRouter = express.Router();

const {
  createCheckoutSession,
  verifySession,
  createPaymentIntent,
} = require("../controllers/payment.controller");

const {
  createOrder,
  getOrders,
  getAllOrders,
  getDashboardStats,
  getOrderById,
  updateOrder,
  deleteOrder,
  trackOrder,
  cancelOrder,
} = require("../controllers/order.controller");

const { protect, authorize } = require("../middleware/auth.Middleware");

// ================= PAYMENT ROUTES =================

// Create checkout session (requires login)
paymentRouter.post("/create-checkout-session", protect, createCheckoutSession);

// Verify session for success page (requires login)
paymentRouter.get("/verify-session/:sessionId", protect, verifySession);

// Create payment intent for inline form
paymentRouter.post("/create-payment-intent", protect, createPaymentIntent);

// 🔁 Alias route — kept for backward compatibility with clients
// still calling "/create-intent" (same controller as above).
paymentRouter.post("/create-intent", protect, createPaymentIntent);

// ================= ORDER ROUTES =================

// Customer routes — must be logged in
orderRouter.post("/", protect, createOrder);
orderRouter.get("/", protect, getOrders); // logged-in user's own orders
orderRouter.put("/:id/cancel", protect, cancelOrder);

// Admin routes — logged in AND role === "admin"
orderRouter.get("/all", protect, authorize("admin"), getAllOrders);

// 🔑 Must come BEFORE "/:id" — otherwise Express matches "dashboard-stats"
// as an :id param and getOrderById runs instead (Invalid order ID error).
orderRouter.get("/dashboard-stats", protect, authorize("admin"), getDashboardStats);

orderRouter.get("/:id", protect, authorize("admin"), getOrderById);
orderRouter.put("/:id", protect, authorize("admin"), updateOrder);
orderRouter.delete("/:id", protect, authorize("admin"), deleteOrder);

orderRouter.get("/track/:orderNumber", trackOrder);

module.exports = { paymentRouter, orderRouter };
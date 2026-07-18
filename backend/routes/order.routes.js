const express = require("express");
const router = express.Router();

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

// Customer routes — must be logged in
router.post("/", protect, createOrder);
router.get("/", protect, getOrders); // logged-in user's own orders

router.put("/:id/cancel", protect, cancelOrder);

// Admin routes — logged in AND role === "admin"
router.get("/all", protect, authorize("admin"), getAllOrders);

// 🔑 Must come BEFORE "/:id" — otherwise Express matches "dashboard-stats"
// as an :id param and getOrderById runs instead (Invalid order ID error).
router.get("/dashboard-stats", protect, authorize("admin"), getDashboardStats);

router.get("/:id", protect, authorize("admin"), getOrderById);
router.put("/:id", protect, authorize("admin"), updateOrder);
router.delete("/:id", protect, authorize("admin"), deleteOrder);

router.get("/track/:orderNumber", trackOrder);

module.exports = router;
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

const { generateInvoice } = require("../controllers/invoice.controller");
const {
  generateBulkInvoice,
  exportOrdersExcel,
  exportOrdersCsv,
} = require("../controllers/orderexport.controller");

const {
  getSalesReport,
  exportSalesReportExcel,
} = require("../controllers/salesreport.controller");

// ================= PAYMENT ROUTES =================

paymentRouter.post("/create-checkout-session", protect, createCheckoutSession);
paymentRouter.get("/verify-session/:sessionId", protect, verifySession);
paymentRouter.post("/create-payment-intent", protect, createPaymentIntent);
paymentRouter.post("/create-intent", protect, createPaymentIntent); // alias, backward compat

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

// ── Invoices ──
// Single invoice: any logged-in user (ownership itself is checked inside
// the controller — order.userId must match req.user._id, or be an admin).
orderRouter.get("/:orderId/invoice", protect, generateInvoice);

// Bulk invoice: admin-only. Previously this only had `protect`, which meant
// any logged-in customer could bulk-generate invoices for arbitrary order
// ids — locked down here.
orderRouter.post("/invoices/bulk", protect, authorize("admin"), generateBulkInvoice);

// ── Admin exports (new) ──
// GET /orders/export/excel?from=&to=&status=&paymentStatus=
orderRouter.get("/export/excel", protect, authorize("admin"), exportOrdersExcel);
// GET /orders/export/csv?from=&to=&status=&paymentStatus=
orderRouter.get("/export/csv", protect, authorize("admin"), exportOrdersCsv);

// ── Admin sales reports (new) ──
// GET /orders/reports/sales?from=&to=&groupBy=day|month
orderRouter.get("/reports/sales", protect, authorize("admin"), getSalesReport);
// GET /orders/reports/sales/export?from=&to=&groupBy=day|month
orderRouter.get("/reports/sales/export", protect, authorize("admin"), exportSalesReportExcel);

module.exports = { paymentRouter, orderRouter };
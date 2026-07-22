// controllers/invoice.controller.js
//
// Customer-facing: GET /api/orders/:orderId/invoice

const PDFDocument = require("pdfkit");
const Order = require("../models/Order");
const User = require("../models/User");
const { renderFullInvoice } = require("../services/pdf/invoicerenderer");

exports.generateInvoice = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const order = await Order.findById(req.params.orderId).populate("userId");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // ── Ownership check ──
    // A raw order id is guessable/enumerable, so without this any logged-in
    // user could download anyone else's invoice by URL. Matches the
    // req.userId pattern used everywhere else in order.controller.js
    // (protect middleware sets req.userId directly, not req.user).
    const isOwner = order.userId && String(order.userId._id) === String(req.userId);

    let isAdmin = false;
    if (!isOwner) {
      const requester = await User.findById(req.userId).select("role");
      isAdmin = requester?.role === "admin";
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to view this invoice" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.orderNumber || order._id}.pdf`
    );

    doc.pipe(res);
    renderFullInvoice(doc, order);
    doc.end();

  } catch (error) {
    console.error("Invoice generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to generate invoice" });
    }
  }
};
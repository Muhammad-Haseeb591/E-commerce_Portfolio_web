// controllers/invoice.controller.js
const PDFDocument = require("pdfkit");
const Order = require("../models/Order");

const PRIMARY_COLOR = "#1f2937";
const GRAY_COLOR = "#6b7280";
const PAGE_BOTTOM_LIMIT = 700; // is se neeche jaane par naya page

// ─────────────────────────────────────────────────────────────
// SINGLE ORDER INVOICE — multi-page support ke sath
// ─────────────────────────────────────────────────────────────
exports.generateInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.orderNumber || order._id}.pdf`
    );

    doc.pipe(res);

    buildInvoice(doc, order);

    doc.end();

  } catch (error) {
    console.error("Invoice generation error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate invoice" });
  }
};

function buildInvoice(doc, order) {
  // ── Header ──
  doc.fontSize(20).fillColor(PRIMARY_COLOR).text("INVOICE", 50, 50, { align: "left" });

  doc
    .fontSize(10)
    .fillColor(GRAY_COLOR)
    .text(`Order #${order.orderNumber || order._id}`, 50, 80)
    .text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}`, 50, 95);

  // ── Customer info (right side) ──
  doc
    .fontSize(10)
    .fillColor(PRIMARY_COLOR)
    .text(order.user?.fullName || "Customer", 350, 50, { align: "right", width: 200 })
    .fillColor(GRAY_COLOR)
    .text(order.user?.email || "", 350, 65, { align: "right", width: 200 });

  doc.moveTo(50, 130).lineTo(550, 130).strokeColor("#e5e7eb").stroke();

  let y = 150;

  const drawTableHeader = () => {
    doc.fontSize(10).fillColor(PRIMARY_COLOR);
    doc.text("Product", 50, y);
    doc.text("Qty", 300, y);
    doc.text("Price", 370, y);
    doc.text("Total", 470, y);
    y += 20;
    doc.moveTo(50, y).lineTo(550, y).strokeColor("#e5e7eb").stroke();
    y += 10;
  };

  drawTableHeader();

  // ── Table rows — page break check + safe fallback values ──
  const items = Array.isArray(order.items) ? order.items : [];

  items.forEach((item) => {
    if (y > PAGE_BOTTOM_LIMIT) {
      doc.addPage();
      y = 50;
      drawTableHeader(); // har naye page pe table header repeat
    }

    const name = item.product?.name || item.name || "Product";
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const total = price * qty;

    doc.fontSize(9).fillColor(PRIMARY_COLOR);
    doc.text(name, 50, y, { width: 230 });
    doc.text(String(qty), 300, y);
    doc.text(`Rs. ${price.toLocaleString()}`, 370, y);
    doc.text(`Rs. ${total.toLocaleString()}`, 470, y);

    y += 25;
  });

  // Grand total ke liye bhi check
  if (y > PAGE_BOTTOM_LIMIT - 30) {
    doc.addPage();
    y = 50;
  }

  doc.moveTo(50, y).lineTo(550, y).strokeColor("#e5e7eb").stroke();
  y += 15;

  const grandTotal = Number(order.totalAmount) || 0;

  doc
    .fontSize(11)
    .fillColor(PRIMARY_COLOR)
    .text("Grand Total", 370, y)
    .text(`Rs. ${grandTotal.toLocaleString()}`, 470, y);

  // ── Footer ──
  doc
    .fontSize(8)
    .fillColor(GRAY_COLOR)
    .text("Thank you for your order!", 50, 750, { align: "center", width: 500 });
}

// ─────────────────────────────────────────────────────────────
// BULK INVOICE — 2 orders per A4 page
// ─────────────────────────────────────────────────────────────
exports.generateBulkInvoice = async (req, res) => {
  try {
    const { orderIds } = req.body; // ["id1", "id2", "id3", "id4"]

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: "orderIds array is required" });
    }

    const orders = await Order.find({ _id: { $in: orderIds } })
      .populate("user")
      .populate("items.product");

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoices-bulk.pdf`);
    doc.pipe(res);

    const PAGE_HEIGHT = 842; // A4 height in points
    const HALF_HEIGHT = PAGE_HEIGHT / 2;

    orders.forEach((order, index) => {
      const isTopHalf = index % 2 === 0;

      if (isTopHalf && index !== 0) {
        doc.addPage();
      }

      const offsetY = isTopHalf ? 30 : HALF_HEIGHT + 30;

      buildHalfInvoice(doc, order, offsetY);

      if (isTopHalf) {
        doc
          .moveTo(0, HALF_HEIGHT)
          .lineTo(595, HALF_HEIGHT)
          .dash(3, { space: 3 })
          .strokeColor("#9ca3af")
          .stroke()
          .undash();
      }
    });

    doc.end();

  } catch (error) {
    console.error("Bulk invoice generation error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate invoices" });
  }
};

function buildHalfInvoice(doc, order, offsetY) {
  doc.fontSize(14).fillColor(PRIMARY_COLOR).text("INVOICE", 50, offsetY);
  doc
    .fontSize(8)
    .fillColor(GRAY_COLOR)
    .text(`Order #${order.orderNumber || order._id}`, 50, offsetY + 20)
    .text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}`, 50, offsetY + 32);

  doc
    .fontSize(8)
    .fillColor(PRIMARY_COLOR)
    .text(order.user?.fullName || "Customer", 350, offsetY, { align: "right", width: 200 })
    .fillColor(GRAY_COLOR)
    .text(order.user?.email || "", 350, offsetY + 12, { align: "right", width: 200 });

  let y = offsetY + 55;

  const items = Array.isArray(order.items) ? order.items : [];

  items.slice(0, 6).forEach((item) => { // half-page mein max ~6 items fit
    const name = item.product?.name || item.name || "Product";
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const total = price * qty;

    doc.fontSize(8).fillColor(PRIMARY_COLOR);
    doc.text(`${name} x${qty}`, 50, y, { width: 300 });
    doc.text(`Rs. ${total.toLocaleString()}`, 470, y);
    y += 15;
  });

  const grandTotal = Number(order.totalAmount) || 0;

  doc
    .fontSize(9)
    .fillColor(PRIMARY_COLOR)
    .text("Total:", 400, y + 5)
    .text(`Rs. ${grandTotal.toLocaleString()}`, 470, y + 5);
}
// controllers/invoice.controller.js
const PDFDocument = require("pdfkit");
const Order = require("../models/Order");

exports.generateInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // ── Headers — response ko PDF stream ke tor pe bhejna hai ──
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.orderNumber || order._id}.pdf`
    );

    doc.pipe(res); // seedha response mein stream ho raha hai — buffer mein store nahi karna

    buildInvoice(doc, order);

    doc.end();

  } catch (error) {
    console.error("Invoice generation error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate invoice" });
  }
};

// ─────────────────────────────────────────────────────────────
// PDF content banane wala function
// ─────────────────────────────────────────────────────────────
function buildInvoice(doc, order) {
  const primaryColor = "#1f2937";
  const grayColor = "#6b7280";

  // ── Header ──
  doc
    .fontSize(20)
    .fillColor(primaryColor)
    .text("INVOICE", 50, 50, { align: "left" });

  doc
    .fontSize(10)
    .fillColor(grayColor)
    .text(`Order #${order.orderNumber || order._id}`, 50, 80)
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 95);

  // ── Customer info (right side) ──
  doc
    .fontSize(10)
    .fillColor(primaryColor)
    .text(order.user?.fullName || "Customer", 350, 50, { align: "right", width: 200 })
    .fillColor(grayColor)
    .text(order.user?.email || "", 350, 65, { align: "right", width: 200 });

  // ── Divider line ──
  doc.moveTo(50, 130).lineTo(550, 130).strokeColor("#e5e7eb").stroke();

  // ── Table header ──
  let y = 150;
  doc.fontSize(10).fillColor(primaryColor);
  doc.text("Product", 50, y);
  doc.text("Qty", 300, y);
  doc.text("Price", 370, y);
  doc.text("Total", 470, y);

  y += 20;
  doc.moveTo(50, y).lineTo(550, y).strokeColor("#e5e7eb").stroke();
  y += 10;

  // ── Table rows ──
  order.items.forEach((item) => {
    const name = item.product?.name || "Product";
    const qty = item.quantity;
    const price = item.price;
    const total = price * qty;

    doc.fontSize(9).fillColor(primaryColor);
    doc.text(name, 50, y, { width: 230 });
    doc.text(String(qty), 300, y);
    doc.text(`Rs. ${price.toLocaleString()}`, 370, y);
    doc.text(`Rs. ${total.toLocaleString()}`, 470, y);

    y += 25;
  });

  // ── Divider before total ──
  doc.moveTo(50, y).lineTo(550, y).strokeColor("#e5e7eb").stroke();
  y += 15;

  // ── Grand total ──
  doc
    .fontSize(11)
    .fillColor(primaryColor)
    .text("Grand Total", 370, y)
    .text(`Rs. ${Number(order.totalAmount).toLocaleString()}`, 470, y);

  // ── Footer ──
  doc
    .fontSize(8)
    .fillColor(grayColor)
    .text("Thank you for your order!", 50, 750, { align: "center", width: 500 });
}
// controllers/invoice.controller.js
exports.generateBulkInvoice = async (req, res) => {
  try {
    const { orderIds } = req.body; // ["id1", "id2", "id3", "id4"] — frontend se array

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
        doc.addPage(); // har naye pair se pehle naya page (pehle wale ke alawa)
      }

      const offsetY = isTopHalf ? 30 : HALF_HEIGHT + 30;

      buildHalfInvoice(doc, order, offsetY);

      // Beech mein cutting/fold line
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

// Compact half-page invoice
function buildHalfInvoice(doc, order, offsetY) {
  const primaryColor = "#1f2937";
  const grayColor = "#6b7280";

  doc.fontSize(14).fillColor(primaryColor).text("INVOICE", 50, offsetY);
  doc
    .fontSize(8)
    .fillColor(grayColor)
    .text(`Order #${order.orderNumber || order._id}`, 50, offsetY + 20)
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, offsetY + 32);

  doc
    .fontSize(8)
    .fillColor(primaryColor)
    .text(order.user?.fullName || "Customer", 350, offsetY, { align: "right", width: 200 })
    .fillColor(grayColor)
    .text(order.user?.email || "", 350, offsetY + 12, { align: "right", width: 200 });

  let y = offsetY + 55;

  order.items.slice(0, 6).forEach((item) => { // half-page mein max ~6 items fit hote hain
    doc.fontSize(8).fillColor(primaryColor);
    doc.text(`${item.product?.name || "Product"} x${item.quantity}`, 50, y, { width: 300 });
    doc.text(`Rs. ${(item.price * item.quantity).toLocaleString()}`, 470, y);
    y += 15;
  });

  doc
    .fontSize(9)
    .fillColor(primaryColor)
    .text("Total:", 400, y + 5)
    .text(`Rs. ${Number(order.totalAmount).toLocaleString()}`, 470, y + 5);
}

module.exports.buildInvoice = buildInvoice; // agar kahin aur reuse karna ho
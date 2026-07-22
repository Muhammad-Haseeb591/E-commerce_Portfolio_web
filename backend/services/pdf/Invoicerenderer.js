// services/pdf/invoiceRenderer.js
//
// Single source of truth for drawing an invoice onto a PDFKit doc.
// Both the single-order invoice controller and the admin bulk-export
// controller import from here — no more duplicated drawing code.

const PRIMARY_COLOR = "#1f2937";
const GRAY_COLOR = "#6b7280";
const PAGE_BOTTOM_LIMIT = 700; // y-position past which we start a new page

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : "—";
}

function formatCurrency(amount) {
  return `Rs. ${(Number(amount) || 0).toLocaleString()}`;
}

// Normalizes an order's items into a flat, safe-to-read shape regardless of
// whether `product` was populated, or the item stores its own name/price
// snapshot (which is what your schema-less `items: []` array likely does).
function normalizeItems(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  return items.map((item) => ({
    name: item.product?.name || item.name || "Product",
    qty: Number(item.quantity) || 0,
    price: Number(item.price) || 0,
    get total() {
      return this.price * this.qty;
    },
  }));
}

function customerName(order) {
  return order.userId?.fullName || order.customerName || "Customer";
}

function customerEmail(order) {
  return order.userId?.email || order.email || "";
}

// ─────────────────────────────────────────────────────────────
// FULL PAGE INVOICE — used for single-order download
// ─────────────────────────────────────────────────────────────
function renderFullInvoice(doc, order) {
  doc.fontSize(20).fillColor(PRIMARY_COLOR).text("INVOICE", 50, 50, { align: "left" });

  doc
    .fontSize(10)
    .fillColor(GRAY_COLOR)
    .text(`Order #${order.orderNumber || order._id}`, 50, 80)
    .text(`Date: ${formatDate(order.createdAt)}`, 50, 95);

  doc
    .fontSize(10)
    .fillColor(PRIMARY_COLOR)
    .text(customerName(order), 350, 50, { align: "right", width: 200 })
    .fillColor(GRAY_COLOR)
    .text(customerEmail(order), 350, 65, { align: "right", width: 200 });

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

  const items = normalizeItems(order);

  items.forEach((item) => {
    if (y > PAGE_BOTTOM_LIMIT) {
      doc.addPage();
      y = 50;
      drawTableHeader();
    }

    doc.fontSize(9).fillColor(PRIMARY_COLOR);
    doc.text(item.name, 50, y, { width: 230 });
    doc.text(String(item.qty), 300, y);
    doc.text(formatCurrency(item.price), 370, y);
    doc.text(formatCurrency(item.total), 470, y);

    y += 25;
  });

  if (y > PAGE_BOTTOM_LIMIT - 30) {
    doc.addPage();
    y = 50;
  }

  doc.moveTo(50, y).lineTo(550, y).strokeColor("#e5e7eb").stroke();
  y += 15;

  doc
    .fontSize(11)
    .fillColor(PRIMARY_COLOR)
    .text("Grand Total", 370, y)
    .text(formatCurrency(order.totalAmount), 470, y);

  doc
    .fontSize(8)
    .fillColor(GRAY_COLOR)
    .text("Thank you for your order!", 50, 750, { align: "center", width: 500 });
}

// ─────────────────────────────────────────────────────────────
// HALF-PAGE INVOICE — 2 per A4 page, used for bulk export
// ─────────────────────────────────────────────────────────────
function renderHalfInvoice(doc, order, offsetY) {
  doc.fontSize(14).fillColor(PRIMARY_COLOR).text("INVOICE", 50, offsetY);
  doc
    .fontSize(8)
    .fillColor(GRAY_COLOR)
    .text(`Order #${order.orderNumber || order._id}`, 50, offsetY + 20)
    .text(`Date: ${formatDate(order.createdAt)}`, 50, offsetY + 32);

  doc
    .fontSize(8)
    .fillColor(PRIMARY_COLOR)
    .text(customerName(order), 350, offsetY, { align: "right", width: 200 })
    .fillColor(GRAY_COLOR)
    .text(customerEmail(order), 350, offsetY + 12, { align: "right", width: 200 });

  let y = offsetY + 55;

  const items = normalizeItems(order).slice(0, 6); // half-page fits ~6 rows

  items.forEach((item) => {
    doc.fontSize(8).fillColor(PRIMARY_COLOR);
    doc.text(`${item.name} x${item.qty}`, 50, y, { width: 300 });
    doc.text(formatCurrency(item.total), 470, y);
    y += 15;
  });

  doc
    .fontSize(9)
    .fillColor(PRIMARY_COLOR)
    .text("Total:", 400, y + 5)
    .text(formatCurrency(order.totalAmount), 470, y + 5);
}

module.exports = {
  renderFullInvoice,
  renderHalfInvoice,
  normalizeItems,
  formatDate,
  formatCurrency,
  customerName,
  customerEmail,
};
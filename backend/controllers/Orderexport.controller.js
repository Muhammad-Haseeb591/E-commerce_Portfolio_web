// controllers/admin/orderExport.controller.js
//
// Admin: bulk invoice PDF, and Excel/CSV export of order data.
// Routes: see routes/admin/orderExport.routes.js

const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const Order = require("../models/Order");
const {
  renderHalfInvoice,
  normalizeItems,
  formatDate,
  customerName,
  customerEmail,
} = require("../services/pdf/Invoicerenderer");

// Shared query-filter builder so PDF/Excel/CSV all respect the same
// ?from=&to=&status= filters from the admin UI.
function buildOrderFilter(query) {
  const filter = {};

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

  return filter;
}

// ─────────────────────────────────────────────────────────────
// BULK INVOICE PDF — 2 orders per A4 page
// Accepts either explicit orderIds in the body, or filters in the query
// (so "export all matching current filters" works from the admin table).
// ─────────────────────────────────────────────────────────────
exports.generateBulkInvoice = async (req, res) => {
  try {
    const { orderIds } = req.body;

    const filter = Array.isArray(orderIds) && orderIds.length
      ? { _id: { $in: orderIds } }
      : buildOrderFilter(req.query);

    const orders = await Order.find(filter).populate("userId").sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoices-bulk.pdf");
    doc.pipe(res);

    const PAGE_HEIGHT = 842; // A4 height in points
    const HALF_HEIGHT = PAGE_HEIGHT / 2;

    orders.forEach((order, index) => {
      const isTopHalf = index % 2 === 0;

      if (isTopHalf && index !== 0) {
        doc.addPage();
      }

      const offsetY = isTopHalf ? 30 : HALF_HEIGHT + 30;
      renderHalfInvoice(doc, order, offsetY);

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
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to generate invoices" });
    }
  }
};

// Builds the worksheet shared by both Excel and CSV export, so the two
// formats never drift out of sync with each other.
async function buildOrdersWorksheet(orders) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Orders");

  sheet.columns = [
    { header: "Order #", key: "orderNumber", width: 12 },
    { header: "Date", key: "date", width: 14 },
    { header: "Customer", key: "customer", width: 24 },
    { header: "Email", key: "email", width: 28 },
    { header: "Items", key: "items", width: 40 },
    { header: "Qty", key: "qty", width: 8 },
    { header: "Total (Rs.)", key: "total", width: 14 },
    { header: "Payment Method", key: "paymentMethod", width: 16 },
    { header: "Payment Status", key: "paymentStatus", width: 16 },
    { header: "Order Status", key: "status", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  orders.forEach((order) => {
    const items = normalizeItems(order);
    sheet.addRow({
      orderNumber: order.orderNumber || String(order._id),
      date: formatDate(order.createdAt),
      customer: customerName(order),
      email: customerEmail(order),
      items: items.map((i) => `${i.name} x${i.qty}`).join(", "),
      qty: items.reduce((sum, i) => sum + i.qty, 0),
      total: Number(order.totalAmount) || 0,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
    });
  });

  return workbook;
}

// ─────────────────────────────────────────────────────────────
// EXCEL EXPORT — GET /api/admin/orders/export/excel?from=&to=&status=
// ─────────────────────────────────────────────────────────────
exports.exportOrdersExcel = async (req, res) => {
  try {
    const orders = await Order.find(buildOrderFilter(req.query))
      .populate("userId")
      .sort({ createdAt: -1 });

    const workbook = await buildOrdersWorksheet(orders);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=orders-export.xlsx");

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Excel export error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to export orders" });
    }
  }
};

// ─────────────────────────────────────────────────────────────
// CSV EXPORT — GET /api/admin/orders/export/csv?from=&to=&status=
// ─────────────────────────────────────────────────────────────
exports.exportOrdersCsv = async (req, res) => {
  try {
    const orders = await Order.find(buildOrderFilter(req.query))
      .populate("userId")
      .sort({ createdAt: -1 });

    const workbook = await buildOrdersWorksheet(orders);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=orders-export.csv");

    // exceljs exposes CSV writing on the workbook (not the worksheet) —
    // sheetName picks which sheet to serialize.
    await workbook.csv.write(res, { sheetName: "Orders" });
    res.end();

  } catch (error) {
    console.error("CSV export error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to export orders" });
    }
  }
};
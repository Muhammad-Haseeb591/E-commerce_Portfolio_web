const ExcelJS = require("exceljs");
const Order = require("../models/Order");

// Counts an order as a "sale" if either:
//  - it was paid (card payments), or
//  - it was COD and has actually been delivered
// COD orders that are still pending/processing are NOT counted yet,
// since the customer hasn't paid and the sale isn't confirmed.
function buildDateMatch(query) {
  const match = {
    $or: [
      { paymentStatus: "paid" },
      { paymentMethod: "cod", status: "delivered" },
    ],
  };

  if (query.from || query.to) {
    match.createdAt = {};
    if (query.from) match.createdAt.$gte = new Date(query.from);
    if (query.to) match.createdAt.$lte = new Date(query.to);
  }

  return match;
}

async function computeSalesReport(query) {
  const match = buildDateMatch(query);
  const groupBy = query.groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";

  const [summaryAgg, timeline, topProducts] = await Promise.all([
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]),

    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: groupBy, date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // NOTE: assumes each item in the schema-less `items` array has `name`,
    // `price`, `quantity` fields directly on it (same assumption the
    // invoice fallback logic already makes). If items only store a
    // product ObjectId reference instead, this needs a $lookup against
    // Product first.
    Order.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          qty: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const totalRevenue = summaryAgg[0]?.totalRevenue || 0;
  const totalOrders = summaryAgg[0]?.totalOrders || 0;

  return {
    summary: {
      totalRevenue,
      totalOrders,
      avgOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
    },
    timeline: timeline.map((t) => ({ date: t._id, revenue: t.revenue, orders: t.orders })),
    topProducts: topProducts.map((p) => ({ name: p._id || "Unknown", qty: p.qty, revenue: p.revenue })),
  };
}

// ─────────────────────────────────────────────────────────────
// GET /api/admin/reports/sales?from=&to=&groupBy=day|month
// ─────────────────────────────────────────────────────────────
exports.getSalesReport = async (req, res) => {
  try {
    const report = await computeSalesReport(req.query);
    return res.json({ success: true, ...report });
  } catch (error) {
    console.error("[GetSalesReport] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Couldn't load the sales report. Please try again.",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/reports/sales/export?from=&to=&groupBy=day|month
// ─────────────────────────────────────────────────────────────
exports.exportSalesReportExcel = async (req, res) => {
  try {
    const report = await computeSalesReport(req.query);
    const workbook = new ExcelJS.Workbook();

    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 24 },
      { header: "Value", key: "value", width: 18 },
    ];
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.addRow({ metric: "Total Revenue (Rs.)", value: report.summary.totalRevenue });
    summarySheet.addRow({ metric: "Total Orders", value: report.summary.totalOrders });
    summarySheet.addRow({ metric: "Avg Order Value (Rs.)", value: Math.round(report.summary.avgOrderValue) });

    const timelineSheet = workbook.addWorksheet("Revenue Timeline");
    timelineSheet.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Revenue (Rs.)", key: "revenue", width: 16 },
      { header: "Orders", key: "orders", width: 10 },
    ];
    timelineSheet.getRow(1).font = { bold: true };
    report.timeline.forEach((row) => timelineSheet.addRow(row));

    const productsSheet = workbook.addWorksheet("Top Products");
    productsSheet.columns = [
      { header: "Product", key: "name", width: 30 },
      { header: "Qty Sold", key: "qty", width: 12 },
      { header: "Revenue (Rs.)", key: "revenue", width: 16 },
    ];
    productsSheet.getRow(1).font = { bold: true };
    report.topProducts.forEach((row) => productsSheet.addRow(row));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("[ExportSalesReportExcel] Unexpected error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        code: "SERVER_ERROR",
        message: "Couldn't export the sales report. Please try again.",
      });
    }
  }
};
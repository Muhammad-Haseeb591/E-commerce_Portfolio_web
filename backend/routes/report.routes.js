// routes/admin/report.routes.js
const router = require("express").Router();

// ⚠️ Adjust this import to match your actual auth middleware location/names.
const { protect, isAdmin } = require("../../middlewares/auth.middleware");

const {
  getSalesReport,
  exportSalesReportExcel,
} = require("../../controllers/admin/salesReport.controller");

router.use(protect, isAdmin);

// GET /api/admin/reports/sales?from=&to=&groupBy=day|month
router.get("/reports/sales", getSalesReport);

// GET /api/admin/reports/sales/export?from=&to=&groupBy=day|month
router.get("/reports/sales/export", exportSalesReportExcel);

module.exports = router;
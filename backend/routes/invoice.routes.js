// routes/invoice.routes.js
const router = require("express").Router();

// ⚠️ Adjust this import to match your actual auth middleware location/names.
const { protect } = require("../middlewares/auth.middleware");

const { generateInvoice } = require("../controllers/invoice.controller");

// GET /api/orders/:id/invoice
router.get("/orders/:id/invoice", protect, generateInvoice);

module.exports = router;
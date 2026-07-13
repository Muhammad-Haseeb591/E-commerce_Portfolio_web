const router = require("express").Router();
const { createCheckoutSession, verifySession } = require("../controllers/payment.controller.js");
const { protect } = require("../middleware/auth.Middleware");

router.post("/create-checkout-session", protect, createCheckoutSession);
router.get("/verify-session/:sessionId", protect, verifySession);

module.exports = router;
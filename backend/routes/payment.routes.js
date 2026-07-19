const express = require("express");
const router = express.Router();

const {
  createCheckoutSession,
  verifySession,
} = require("../controllers/payment.controller.js");

const { protect } = require("../middleware/auth.Middleware");

// ── Checkout session banane ke liye — login required ──
router.post("/create-checkout-session", protect, createCheckoutSession);

// ── NOTE: Stripe webhook (/api/payments/webhook) yahan register NAHI hota.
// Ye server.js mein direct app.post() se register hota hai (express.json() se PEHLE),
// taake Stripe signature verification ke liye raw body guaranteed mile.
// Isliye stripeWebhook yahan import/register nahi kiya — duplicate route avoid karne ke liye.

// ── Success page pe session verify karne ke liye — login required ──
router.get("/verify-session/:sessionId", protect, verifySession);

module.exports = router;
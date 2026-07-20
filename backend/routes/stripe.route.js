const express = require("express");
const router = express.Router();
const stripe = require("../config/stripe");

router.get("/config", (req, res) => {
  res.json({
    publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY,
  });
});

module.exports = router;

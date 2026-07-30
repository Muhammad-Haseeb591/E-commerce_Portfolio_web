const express = require("express");
const router = express.Router();
const { syncCartActivity } = require("../controllers/cartactivity.controller");

// 🔑 Adjust this import to whatever your existing auth middleware is
// called/located at — it just needs to set req.user before this runs.
const { protect } = require("../middleware/auth.middleware");

router.post("/activity", protect, syncCartActivity);

module.exports = router;

// In your main app/server file, mount this alongside your other routes:
//   const cartActivityRoutes = require("./routes/cartActivityRoutes");
//   app.use("/api/cart", cartActivityRoutes);
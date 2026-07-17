require("dotenv").config();
require("./config/passport");

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const adminRoute  = require("./routes/admin.route");
const favouriteRoutes = require("./routes/wishlist.routes");
const cartRoutes = require("./routes/cart.routes.js");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const uploadRoutes = require("./routes/upload");
const { stripeWebhook } = require("./controllers/payment.controller");
const reviewRoutes = require("./routes/review.routes");
const app = express();

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/api/payments", paymentRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoute);
app.use("/favourites", favouriteRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/api", uploadRoutes);
app.use("/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server error:", err);
  }
};

startServer();
require("dotenv").config();
require("./config/passport");

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const adminRoute = require("./routes/admin.route");
const favouriteRoutes = require("./routes/wishlist.routes");
const cartRoutes = require("./routes/cart.routes.js");
const { paymentRouter, orderRouter } = require("./routes/order.routes.js");
const uploadRoutes = require("./routes/upload");
const { stripeWebhook } = require("./controllers/payment.controller");
const reviewRoutes = require("./routes/review.routes");

const app = express();

// ── Stripe webhook — express.json() se PEHLE, RAW body chahiye signature verify karne ke liye ──
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// ── CORS: allow multiple known frontend origins ──
const allowedOrigins = [
  "https://e-commerce-portfolio-web.vercel.app", // ✅ actual production frontend
  "https://e-commerce-portfolio-ashen.vercel.app", // keep if this is still in use
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    // allow whitelisted origins + any Vercel preview deployment of this project
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/e-commerce-portfolio-web.*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }

    console.log("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// ✅ Explicitly handle preflight OPTIONS requests for all routes
app.options("*", cors(corsOptions));

console.log("Allowed origins:", allowedOrigins);
console.log("NODE_ENV:", process.env.NODE_ENV);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/api/payments", paymentRouter); // create-checkout-session, verify-session (webhook already registered above)
app.use("/auth", authRoutes);
app.use("/admin", adminRoute);
app.use("/favourites", favouriteRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRouter); // ⚠️ original me /orders tha, /api/orders nahi — path same rakha
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
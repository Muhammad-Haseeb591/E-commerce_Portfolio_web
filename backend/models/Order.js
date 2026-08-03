const mongoose = require("mongoose");

// Shape matches EditOrderModal.jsx exactly: firstName, lastName, phone,
// line1, city, state, zip, country. Every place that builds
// shippingAddress (checkout controller, admin edit modal, invoice
// renderer) MUST use these exact field names, or Mongoose will silently
// strip unknown fields on save.
const shippingAddressSchema = new mongoose.Schema(
  {
    firstName: { type: String, default: "N/A" },
    lastName: { type: String, default: "N/A" },
    phone: { type: String, default: "N/A" },
    line1: { type: String, default: "N/A" },
    city: { type: String, default: "N/A" },
    state: { type: String, default: "" }, // optional field in the modal
    zip: { type: String, default: "N/A" },
    country: { type: String, default: "PK" }, // modal defaults to "PK"
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: String,
    items: [],
    totalAmount: Number,

    // Currency the order was actually placed/charged in. Set explicitly
    // in the checkout controller — never re-derive it later from
    // geolocation or IP.
    currency: {
      type: String,
      enum: ["PKR", "USD", "EUR", "GBP"],
      default: "PKR",
    },

    shippingAddress: { type: shippingAddressSchema, default: () => ({}) },
    status: { type: String, default: "pending" },

    // ── Order Tracking ──
    // Every time status changes, an entry is pushed here automatically
    // (via the pre-save hook below) — so the "order timeline"
    // (Placed → Processing → Shipped → Delivered) can be shown on the
    // frontend without any controller having to push to it manually.
    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String, default: null },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    trackingNumber: { type: String, default: null },
    carrier: { type: String, default: null }, // e.g. "TCS", "Leopard Courier", "DHL"
    estimatedDelivery: { type: Date, default: null },

    // ── Stripe payment fields ──
    // `required: true` is deliberately NOT set here — any older call site
    // (or a future COD path) that doesn't send paymentMethod won't crash
    // Order.create()/save() with a validation error. Default is "cod"
    // since the previous schema created COD orders without this field too.
    paymentMethod: {
      type: String,
      enum: ["cod", "card"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed"],
      default: "unpaid",
    },

    // Checkout Session flow (redirect-based) — used by
    // payment.controller.stripeWebhook / verifySession.
    stripeSessionId: { type: String, default: null },

    // PaymentIntent flow (inline card element / createPaymentMethod).
    // Kept as a separate field because both flows (session id vs intent
    // id) can exist side by side if both paths are ever used.
    stripePaymentIntentId: { type: String, default: null, index: true },

    paidAt: { type: Date, default: null },

    // ── Refund fields ──
    refundId: { type: String, default: null },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "succeeded", "failed"],
      default: "none",
    },
  },
  { timestamps: true }
);

// Speeds up dashboard aggregations (monthly/daily revenue grouping,
// recent-orders sort) and the createOrder duplicate-request guard —
// both filter/sort on createdAt.
orderSchema.index({ createdAt: -1 });

// Speeds up the unique-customer count in dashboard stats and any
// per-customer order lookups.
orderSchema.index({ email: 1 });

// Mongoose 7+ async middleware doesn't take a `next` callback — the
// async function resolves/rejects via its own Promise. Calling `next`
// here (when it isn't passed in) would throw, so it's intentionally
// left out.
orderSchema.pre("validate", async function () {
  if (!this.orderNumber) {
    const lastOrder = await this.constructor
      .findOne({ orderNumber: { $exists: true } })
      .sort({ orderNumber: -1 });

    this.orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1001;
  }
});

// Whenever status is set for the first time or changed (on create or
// update), automatically push it into statusHistory — so no matter
// where order.status gets updated (updateOrder controller, admin panel,
// webhook, etc.), the timeline builds itself instead of needing a
// manual push at every call site.
orderSchema.pre("save", async function () {
  if (this.isNew || this.isModified("status")) {
    this.statusHistory.push({ status: this.status });
  }
});

module.exports = mongoose.model("Order", orderSchema);
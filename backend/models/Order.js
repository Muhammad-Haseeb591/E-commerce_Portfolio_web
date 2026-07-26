const mongoose = require("mongoose");

// 🔑 UPDATED SHAPE — matches EditOrderModal.jsx exactly:
// firstName, lastName, phone, line1, city, state, zip, country.
// Every place that builds shippingAddress (checkout controller, admin
// edit modal, invoice renderer) MUST use these exact field names, or
// Mongoose will silently strip unknown fields on save.
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

    // 🔑 Currency the order was actually placed/charged in. Set explicitly
    // in the checkout controller — never re-derive it later from geolocation.
    currency: {
      type: String,
      enum: ["PKR", "USD", "EUR", "GBP"],
      default: "PKR",
    },

    shippingAddress: { type: shippingAddressSchema, default: () => ({}) },
    status: { type: String, default: "pending" },

    // ── Order Tracking ──
    // Har baar status change ho, ek entry yahan add ho jati hai (pre-save hook se) —
    // isse "order timeline" (Placed → Processing → Shipped → Delivered) frontend
    // par dikhai ja sakti hai.
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
    // NOTE: `required: true` yahan jaan-boojh kar nahi lagaya — koi bhi
    // purana call-site (ya future COD path) jo paymentMethod na bheje, uska
    // Order.create()/save() validation error se crash NAHI hoga. Default
    // "cod" isliye rakha hai kyunki purana schema is field ke bina hi COD
    // orders bhi bana raha tha.
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

    // Checkout Session flow (redirect-based) — already used in
    // payment.controller.stripeWebhook / verifySession. Kept as-is.
    stripeSessionId: { type: String, default: null },

    // PaymentIntent flow (inline card element / createPaymentMethod).
    // Alag field isliye kyunki dono flows (session id vs intent id) ek
    // saath maujood ho sakte hain agar dono paths kabhi use ho rahay hon.
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

// 🔑 Speeds up dashboard aggregations (monthly/daily revenue grouping,
// recent-orders sort) and the createOrder duplicate-request guard, which
// both filter/sort on createdAt.
orderSchema.index({ createdAt: -1 });

// 🔑 Speeds up the unique-customer count in dashboard stats and any
// per-customer order lookups.
orderSchema.index({ email: 1 });

// Mongoose 7+ async middleware ko `next` callback nahi deta — async function
// khud Promise resolve/reject se hi kaam chala leta hai. `next` use karna
// (jab available hi nahi) crash karta hai, isliye yahan bilkul nahi liya.
orderSchema.pre("validate", async function () {
  if (!this.orderNumber) {
    const lastOrder = await this.constructor
      .findOne({ orderNumber: { $exists: true } })
      .sort({ orderNumber: -1 });

    this.orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1001;
  }
});

// Status naya ho ya change ho (create ya update dono par), automatically
// statusHistory mein push kar do — taake koi bhi jagah se order.status update
// ho (updateOrder controller, admin panel, webhook, etc.), timeline khud-ba-khud
// ban jaye, alag se har jagah manually push karne ki zaroorat na pade.
orderSchema.pre("save", async function () {
  if (this.isNew || this.isModified("status")) {
    this.statusHistory.push({ status: this.status });
  }
});

module.exports = mongoose.model("Order", orderSchema);
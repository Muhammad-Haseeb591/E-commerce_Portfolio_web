const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: String,
    items: [],
    totalAmount: Number,
    shippingAddress: Object,
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
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed"],
      default: "unpaid",
    },
    stripeSessionId: { type: String, default: null },
    paidAt: { type: Date, default: null },
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
const mongoose = require("mongoose");

// 🔑 Ye poora cart mirror NAHI karta — jaan-boojh kar sirf itemCount +
// timestamps rakhe hain. Asal cart data hamesha localStorage me hi
// rehta hai (CartSync.jsx). Ye model sirf ek sawaal ka jawab deta hai:
// "kis user ka cart kitni der se untouched pada hai, aur kya usay
// reminder bheja ja chuka hai?"
const cartActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ek user ka ek hi activity record
    },
    itemCount: { type: Number, default: 0 },
    // Cart me aakhri baar kuch add/remove/qty-change hua tab ka time.
    lastUpdatedAt: { type: Date, default: Date.now },
    // null = abhi tak is "abandonment window" ke liye reminder nahi gaya.
    // Naya activity aane par (lastUpdatedAt update hote hi) ye wapis null
    // ho jata hai, taake agli baar cart phir se 1hr idle rahe to dobara
    // email chali jaye.
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CartActivity", cartActivitySchema);
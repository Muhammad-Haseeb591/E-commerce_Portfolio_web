const cron = require("node-cron"); // npm install node-cron (agar already installed nahi)
const CartActivity = require("../models/CartActivitySchema");
const User = require("../models/User"); // 🔑 apne actual User model path se match kar lena
const { sendAbandonedCartEmail } = require("../utils/sendEmail"); // 🔑 apne actual mailer.js path se match kar lena

const ONE_HOUR_MS = 60 * 60 * 1000;
const CART_URL = `${process.env.FRONTEND_URL || "https://e-commerce-portfolio-web.vercel.app"}/cart`;

// Runs the actual scan + send. Exported separately so it can also be
// called/tested manually without waiting for the cron schedule.
const runAbandonedCartCheck = async () => {
  const cutoff = new Date(Date.now() - ONE_HOUR_MS);

  // Idle for 1hr+, AND no reminder sent yet for this idle window.
  const staleActivities = await CartActivity.find({
    lastUpdatedAt: { $lte: cutoff },
    reminderSentAt: null,
  }).populate("user", "email");

  for (const activity of staleActivities) {
    const email = activity.user?.email;
    if (!email) continue;

    try {
      await sendAbandonedCartEmail(email, {
        itemCount: activity.itemCount,
        cartUrl: CART_URL,
      });
      activity.reminderSentAt = new Date();
      await activity.save();
    } catch (err) {
      // 🔑 Ek email fail hone se baqi users ka reminder nahi rukna
      // chahiye — log karke agle par chale jao, ye record reminderSentAt
      // null hi rahega so agli run me phir try hoga.
      console.error(`Abandoned-cart email failed for ${email}:`, err.message);
    }
  }

  return staleActivities.length;
};

// Call this once from your server's startup file (e.g. server.js):
//   require("./jobs/abandonedCartReminder").start();
const start = () => {
  // Har 15 minute pe check — 1hr ka threshold khud query me hai, is liye
  // schedule ko itna tight rakhna zaroori nahi, bas reasonably fresh.
  cron.schedule("*/15 * * * *", () => {
    runAbandonedCartCheck().catch((err) =>
      console.error("Abandoned-cart reminder job failed:", err)
    );
  });

  console.log("Abandoned-cart reminder job scheduled (every 15 min).");
};

module.exports = { start, runAbandonedCartCheck };
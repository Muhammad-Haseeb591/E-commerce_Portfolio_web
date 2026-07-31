const cron = require("node-cron");
const CartActivity = require("../models/CartActivitySchema");
const User = require("../models/User"); 
const { sendAbandonedCartEmail } = require("../services/sendemail.services");

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

const start = () => {
  cron.schedule("*/15 * * * *", () => {
    runAbandonedCartCheck().catch((err) =>
      console.error("Abandoned-cart reminder job failed:", err)
    );
  });
};

module.exports = { start, runAbandonedCartCheck };
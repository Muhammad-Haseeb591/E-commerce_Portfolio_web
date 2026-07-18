const Stripe = require("stripe");
const Order = require("../models/Order");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ==========================
// Create Stripe Checkout Session
// (Order abhi nahi banta — pehle payment confirm hone do)
// ==========================
exports.createCheckoutSession = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "login required to create order.",
      });
    }

    const { items, totalAmount, shippingAddress, email } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items provided for checkout.",
      });
    }

    // ── Stripe line items banao (har item Rs. ko paisa/cents mein convert hota hai — smallest currency unit) ──
    const line_items = items.map((item) => ({
      price_data: {
        currency: "usd", 
        product_data: {
          name: item.name || "Product",
        },
        unit_amount: Math.round(Number(item.price || 0) * 100), // Rs. → paisa
      },
      quantity: item.quantity || 1,
    }));

    // ── Order details ko metadata mein store karo — webhook mein yahan se order banayenge ──
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      customer_email: email,
      success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/order-cancelled`,
      metadata: {
        userId: req.userId,
        email,
        totalAmount: String(totalAmount),
        items: JSON.stringify(items),
        shippingAddress: JSON.stringify(shippingAddress),
      },
    });

    return res.status(200).json({
      success: true,
      url: session.url, // ← frontend isi URL pe redirect karega
    });
  } catch (error) {
    console.error("Create Checkout Session Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Payment session create nahi ho saka.",
      error: error.message,
    });
  }
};

// ==========================
// Stripe Webhook — payment confirm hone par YAHAN order create hota hai
// ==========================
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // req.body yahan RAW buffer honi chahiye (server.js mein express.raw() zaroori hai is route ke liye)
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const metadata = session.metadata;

      // ── Duplicate order na banay — agar isi sessionId ka order pehle se hai to skip karo ──
      const existingOrder = await Order.findOne({ stripeSessionId: session.id });
      if (existingOrder) {
        return res.status(200).json({ received: true, duplicate: true });
      }

      await Order.create({
        userId: metadata.userId,
        email: metadata.email,
        items: JSON.parse(metadata.items),
        totalAmount: Number(metadata.totalAmount),
        shippingAddress: JSON.parse(metadata.shippingAddress),
        status: "processing",
        paymentStatus: "paid",
        stripeSessionId: session.id,
        paidAt: new Date(),
      });

      console.log("✅ Order created after successful payment:", session.id);
    } catch (err) {
      console.error("Order creation after payment failed:", err.message);
      // 500 return karo taake Stripe retry kare
      return res.status(500).json({ error: "Order creation failed" });
    }
  }

  return res.status(200).json({ received: true });
};

// ==========================
// Verify session (success page pe order confirm karne ke liye)
// ==========================
exports.verifySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(200).json({ success: true, paid: false });
    }

    const order = await Order.findOne({ stripeSessionId: sessionId });

    return res.status(200).json({
      success: true,
      paid: true,
      order: order || null, // webhook thodi der late aa sakta hai, isliye null bhi handle karo
    });
  } catch (error) {
    console.error("Verify Session Error:", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
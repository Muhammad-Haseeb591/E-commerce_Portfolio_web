const stripe = require("../config/stripe");
const Order = require("../models/Order");

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
          images: item.image ? [item.image] : [],
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
      sessionId: session.id,
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
// Stripe Webhook — single entry point for ALL Stripe events.
// Handles:
//   - checkout.session.completed  → order create karo (Checkout Session flow)
//   - charge.refunded             → order.refundStatus sync karo (cancelOrder
//                                    flow se trigger hone wale refund ka
//                                    final confirmation yahin aata hai)
//   - payment_intent.payment_failed → order.paymentStatus = "failed"
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

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
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
        // session.payment_intent hota hai jab mode:"payment" ho — store karo
        // taake cancelOrder ka refund flow (jo stripePaymentIntentId use
        // karta hai) Checkout-Session orders ke liye bhi kaam kare.
        stripePaymentIntentId: session.payment_intent || undefined,
        paidAt: new Date(),
      });

      console.log("✅ Order created after successful payment:", session.id);
    }

    // ── Refund confirm hua — cancelOrder controller me refund turant
    // "pending" set karta hai, final "succeeded"/partial-refund state
    // sirf yahan se, Stripe ki taraf se, confirm hoti hai. ──
    if (event.type === "charge.refunded") {
      const charge = event.data.object;

      await Order.findOneAndUpdate(
        { stripePaymentIntentId: charge.payment_intent },
        { refundStatus: charge.refunded ? "succeeded" : "pending" }
      );
    }

    // ── Payment fail hua (card decline, insufficient funds, etc). Note:
    // agar order abhi tak create hi nahi hua tha (createOrder ka card-flow
    // sirf "succeeded" ke baad Order.create karta hai), to
    // findOneAndUpdate ko koi match nahi milega — ye harmless no-op hai,
    // koi error nahi throw hoga. ──
    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;

      await Order.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { paymentStatus: "failed" }
      );
    }
  } catch (err) {
    console.error(`Webhook handler failed for event ${event.type}:`, err.message);
    // 500 return karo taake Stripe automatically retry kare
    return res.status(500).json({ error: "Webhook handler failed" });
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

// ==========================
// Create Payment Intent (inline card form ke liye — checkout session
// redirect wale flow ke bajaye direct on-page card element)
// ==========================
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = "usd" } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: { enabled: true },
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Create PaymentIntent Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
    });
  }
};
const stripe = require("../config/stripe");
const Order = require("../models/Order");

// ==========================
// Create Stripe Checkout Session
// (The order is not created yet — payment must be confirmed first, via webhook)
// ==========================
exports.createCheckoutSession = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Please log in to place an order.",
      });
    }

    const { items, totalAmount, shippingAddress, email } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        code: "EMPTY_ORDER",
        message: "Your cart is empty.",
      });
    }

    // ── Build Stripe line items (each price is converted to the smallest
    // currency unit — cents) ──
    const line_items = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name || "Product",
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(Number(item.price || 0) * 100), // price → cents
      },
      quantity: item.quantity || 1,
    }));

    // ── Store order details in metadata — the webhook will create the
    // actual order from this once payment is confirmed ──
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
      url: session.url, // the frontend redirects the user to this URL
      sessionId: session.id,
    });
  } catch (error) {
    console.error("[CreateCheckoutSession] Unexpected error:", error.message);

    return res.status(500).json({
      success: false,
      code: "CHECKOUT_SESSION_FAILED",
      message: "Couldn't start the checkout process. Please try again.",
      error: error.message,
    });
  }
};

// ==========================
// Stripe Webhook — single entry point for ALL Stripe events.
// Handles:
//   - checkout.session.completed     → creates the order (Checkout Session flow)
//   - charge.refunded                → syncs order.refundStatus (this is where
//                                       the final confirmation lands for a refund
//                                       initiated by the cancelOrder flow)
//   - payment_intent.payment_failed  → sets order.paymentStatus = "failed"
// ==========================
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // req.body must be the RAW buffer here (express.raw() is required for
    // this route in server.js)
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[StripeWebhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata;

      // ── Prevent duplicate orders — skip if an order for this sessionId
      // already exists ──
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
        // session.payment_intent is present when mode:"payment" — stored
        // so the cancelOrder refund flow (which relies on
        // stripePaymentIntentId) also works for Checkout-Session orders.
        stripePaymentIntentId: session.payment_intent || undefined,
        paidAt: new Date(),
      });

      console.log("[StripeWebhook] Order created after successful payment:", session.id);
    }

    // ── Refund confirmed — cancelOrder sets refundStatus to "pending"
    // immediately; the final "succeeded"/partial-refund state is only
    // confirmed here, from Stripe itself. ──
    if (event.type === "charge.refunded") {
      const charge = event.data.object;

      await Order.findOneAndUpdate(
        { stripePaymentIntentId: charge.payment_intent },
        { refundStatus: charge.refunded ? "succeeded" : "pending" }
      );
    }

    // ── Payment failed (card decline, insufficient funds, etc). Note:
    // if the order was never created in the first place (createOrder's
    // card flow only calls Order.create after "succeeded"), this
    // findOneAndUpdate simply matches nothing — a harmless no-op, no
    // error is thrown. ──
    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;

      await Order.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { paymentStatus: "failed" }
      );
    }
  } catch (err) {
    console.error(`[StripeWebhook] Handler failed for event ${event.type}:`, err.message);
    // Return 500 so Stripe automatically retries delivery
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  return res.status(200).json({ received: true });
};

// ==========================
// Verify session (used on the success page to confirm the order)
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
      order: order || null, // the webhook may arrive slightly late, so null is a valid state here
    });
  } catch (error) {
    console.error("[VerifySession] Unexpected error:", error.message);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Couldn't verify your payment. Please try again.",
    });
  }
};

// ==========================
// Create Payment Intent (for an inline card form — direct on-page card
// element, as an alternative to the Checkout Session redirect flow)
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
    console.error("[CreatePaymentIntent] Unexpected error:", error.message);

    return res.status(500).json({
      success: false,
      code: "PAYMENT_INTENT_FAILED",
      message: "Couldn't set up the payment. Please try again.",
    });
  }
};
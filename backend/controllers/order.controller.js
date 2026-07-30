const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const stripe = require("../config/stripe");
const { sendOrderConfirmationEmail } = require("../services/sendemail.services");
const { formatCurrency } = require("../services/Invoicerenderer"); // 🔑 verify this path matches your actual file location

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`${req.method} ${req.originalUrl} —`, error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  });
};

// 🔑 /account/orders requires login (AccountActivity.jsx), and createOrder
// itself is a `protect`-only route with its own req.userId guard — so
// every order made through this controller IS a logged-in user's order.
// Track link is therefore always safe to include.
const ACCOUNT_ORDERS_URL = `${
  process.env.FRONTEND_URL || "https://e-commerce-portfolio-web.vercel.app"
}/account/orders`;

// 🔑 CRITICAL: your store's prices are in PKR, but Stripe is charging in
// "usd" — meaning `totalAmount` (a PKR number) was being sent to Stripe
// as if it were dollars. A PKR 2000 order was charging $2000 USD.
//
// This rate is a STOPGAP, not a production-safe solution. A hardcoded
// rate drifts from the real market rate over time, which either
// overcharges or undercharges every card customer. Before this goes live
// with real money, replace this with a live exchange-rate API call
// (e.g. exchangerate-api.com, Open Exchange Rates) cached for a short
// TTL (e.g. 1 hour), not a constant.
const PKR_TO_USD_RATE = 1 / 278; // TODO: replace with live FX rate lookup
const STRIPE_CHARGE_CURRENCY = "usd"; // change to "pkr" instead IF your Stripe account supports PKR settlement — verify in Stripe Dashboard → Settings → Payouts first

// Fire-and-forget: the order itself already succeeded (COD confirmed /
// payment captured) by the time this is called, so an email hiccup must
// never turn into a 500 for the customer or delay the response. Errors
// are just logged.
const notifyOrderConfirmed = (order, email) => {
  sendOrderConfirmationEmail(email, {
    orderId: order.orderNumber,
    // 🔑 FIX: was hardcoded `$${...}` — now uses the order's actual
    // currency (PKR by default) via the same formatter the invoice uses,
    // so the email and the PDF invoice always agree.
    total: formatCurrency(order.totalAmount, order.currency || "PKR"),
    isLoggedIn: true,
    trackUrl: ACCOUNT_ORDERS_URL,
  }).catch((err) => console.error("Order confirmation email failed:", err.message));
};

// ==========================
// Shipping / Coupon calculation
// ==========================
// TODO (STRICT): Ye dono functions abhi placeholder hain. Frontend ke
// utils/currency.js me jo getShippingFee() aur getCouponDiscount() logic
// hai, wahi EXACT logic yahan port karo — warna frontend aur backend ka
// totalAmount mismatch ho jayega aur customer ko wrong amount charge hoga.
// Jab tak port nahi karte, shippingFee = 0 aur discount = 0 rahega
// (safe fallback — order create hoga, lekin shipping fee customer se
// nahi liya jayega).
function calculateShippingFee(subtotal) {
  // TODO: implement real shipping logic (matching frontend)
  return 0;
}

async function validateCoupon(couponCode, subtotal) {
  // TODO: DB se coupon validate karo (expiry, min order amount, usage limit)
  // Abhi ke liye koi discount nahi milega — coupon silently ignore hoga.
  return { discount: 0 };
}

// ==========================
// Stock helpers (color + size-aware, with rollback)
// ==========================
// 🔑 FIXED — Product schema no longer has a top-level `sizes` array;
// sizes now live inside colors[i].sizes, and each color also has its own
// colors[i].stock (used when that color has no size scale). Both branches
// below now locate the right color via `color` first (arrayFilters "c"),
// then the right size within it (arrayFilters "s") when one applies —
// and keep colors[i].stock + the top-level stock in sync manually, since
// findOneAndUpdate skips the pre-save rollup hooks.
const decrementStockForItem = async ({ productId, color, size, quantity }) => {
  if (size) {
    return Product.findOneAndUpdate(
      {
        _id: productId,
        colors: {
          $elemMatch: {
            color,
            sizes: { $elemMatch: { size, stock: { $gte: quantity } } },
          },
        },
      },
      {
        $inc: {
          "colors.$[c].sizes.$[s].stock": -quantity,
          "colors.$[c].stock": -quantity,
          stock: -quantity,
        },
      },
      { arrayFilters: [{ "c.color": color }, { "s.size": size }], new: true }
    );
  }

  return Product.findOneAndUpdate(
    {
      _id: productId,
      colors: { $elemMatch: { color, stock: { $gte: quantity } } },
    },
    {
      $inc: {
        "colors.$[c].stock": -quantity,
        stock: -quantity,
      },
    },
    { arrayFilters: [{ "c.color": color }], new: true }
  );
};

// If the order fails partway through (out-of-stock item / DB error / payment
// error), undo every decrement that already happened so stock is never left
// wrong.
const rollbackDecrements = async (decremented) => {
  await Promise.all(
    decremented.map(async ({ productId, color, size, quantity }) => {
      try {
        if (size) {
          await Product.findOneAndUpdate(
            { _id: productId },
            {
              $inc: {
                "colors.$[c].sizes.$[s].stock": quantity,
                "colors.$[c].stock": quantity,
                stock: quantity,
              },
            },
            { arrayFilters: [{ "c.color": color }, { "s.size": size }] }
          );
        } else {
          await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { "colors.$[c].stock": quantity, stock: quantity } },
            { arrayFilters: [{ "c.color": color }] }
          );
        }
      } catch (err) {
        // Rollback itself failing shouldn't hide the original error —
        // just log it, don't throw.
        console.error("Stock rollback failed for", productId, color, size, err.message);
      }
    })
  );
};

// Small helper so refund failures never crash the request (payment already
// failed/stock ran out — we still want to return a response to the client).
const safeRefund = async (paymentIntentId) => {
  try {
    await stripe.refunds.create({ payment_intent: paymentIntentId });
  } catch (err) {
    console.error("Refund failed for payment_intent", paymentIntentId, err.message);
  }
};

// Statuses a customer is still allowed to self-cancel from. Once an order
// leaves this list (shipped/delivered/cancelled), cancellation must go
// through a return/refund flow instead — see cancelOrder below.
// NOTE: must match CANCELLABLE_STATUSES in the frontend order slice/component,
// and must include "pending" since that's the Order schema's default status.
const CANCELLABLE_STATUSES = ["pending", "placed", "processing"];

// ==========================
// Create Order
// Supports:
//  - COD ("cod" / "rs")
//  - Card via Stripe PaymentIntent, including 3D Secure (requires_action)
// Price/subtotal/shipping/discount/totalAmount are ALWAYS computed
// server-side from the DB — never trust values sent from the frontend.
// All prices/totals stored on the Order are in PKR (store currency).
// Stripe charges are converted to USD only at the moment of charging —
// see PKR_TO_USD_RATE above.
// ==========================
exports.createOrder = asyncHandler(async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: "login first to place an order",
    });
  }

  const { items, shippingAddress, email, paymentMethod, paymentMethodId, couponCode } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "No items in the order." });
  }
  if (!shippingAddress || !email) {
    return res.status(400).json({ success: false, message: "shippingAddress and email are required." });
  }

  // ── 1. Product ids validate + price/product DB se dobara nikalo —
  // frontend se aaya price/totalAmount kabhi trust na karo ──
  for (const item of items) {
    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      return res.status(400).json({ success: false, message: `Invalid product id: ${item.productId}` });
    }
  }

  const dbProducts = await Product.find({ _id: { $in: items.map((i) => i.productId) } });
  const productMap = new Map(dbProducts.map((p) => [String(p._id), p]));

  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const dbProduct = productMap.get(String(item.productId));
    if (!dbProduct) {
      return res.status(400).json({ success: false, message: `Invalid product: ${item.productId}` });
    }
    const quantity = Number(item.quantity) || 1;
    const price = dbProduct.price; // ← DB se, frontend se nahi (PKR)

    subtotal += price * quantity;

    // 🔑 No top-level product.images anymore — image lives on the
    // specific color the customer picked (colors[].image).
    const matchedColor = dbProduct.colors?.find((c) => c.color === item.color);

    verifiedItems.push({
      productId: dbProduct._id,
      name: dbProduct.name,
      price,
      image: matchedColor?.image || "",
      color: item.color || "",
      size: item.size ?? null,
      quantity,
    });
  }

  // ── 2. Shipping/coupon backend se calculate karo (see TODOs above) ──
  const shippingFee = calculateShippingFee(subtotal);
  const { discount } = couponCode
    ? await validateCoupon(couponCode, subtotal)
    : { discount: 0 };

  const totalAmount = Math.max(0, subtotal - discount) + shippingFee; // PKR

  // ── 3. Duplicate-request guard (double click / network retry) — agar
  // pichle 30 second me isi email + totalAmount + same item-count wala
  // order ban chuka hai to usi ko wapas bhej do, dobara stock mat kaato ──
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
  const existingOrder = await Order.findOne({
    email,
    totalAmount,
    items: { $size: verifiedItems.length },
    createdAt: { $gte: thirtySecondsAgo },
  }).sort({ createdAt: -1 });

  if (existingOrder) {
    return res.status(200).json({ success: true, order: existingOrder, duplicate: true });
  }

  // ── 4a. COD ── stock pehle decrement karo (order create se pehle), taake
  // out-of-stock item pura order hi block kar de, aur pichle decrements
  // rollback ho jayein.
  if (paymentMethod === "cod" || paymentMethod === "rs") {
    const decremented = [];

    for (const item of verifiedItems) {
      const updated = await decrementStockForItem({
        productId: item.productId,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
      });

      if (!updated) {
        await rollbackDecrements(decremented);
        return res.status(409).json({
          success: false,
          message: `"${item.name}"${item.size ? ` (size ${item.size})` : ""} is out of stock.`,
        });
      }

      decremented.push({ productId: item.productId, color: item.color, size: item.size, quantity: item.quantity });
    }

    let order;
    try {
      order = await Order.create({
        userId: req.userId,
        email,
        items: verifiedItems,
        shippingAddress,
        subtotal,
        shippingFee,
        discount,
        totalAmount,
        currency: "PKR", // 🔑 was missing here — now explicit on both payment paths
        paymentMethod: "cod",
        paymentStatus: "unpaid",
        status: "pending",
      });
    } catch (orderErr) {
      await rollbackDecrements(decremented);
      throw orderErr; // caught by asyncHandler -> clean 500
    }

    // 🔑 Order confirmed (COD) — let the customer know it went through.
    notifyOrderConfirmed(order, email);

    return res.status(201).json({ success: true, order });
  }

  // ── 4b. Card — PaymentIntent create + confirm (paymentMethodId frontend
  // se tokenized aaya hota hai) ──
  if (!paymentMethodId) {
    return res.status(400).json({ success: false, message: "paymentMethodId is required for card payment." });
  }

  // 🔑 THE FIX: convert PKR totalAmount to USD before charging Stripe.
  // Previously `totalAmount` (a PKR number) was sent to Stripe labeled as
  // "usd" — meaning a PKR 2000 order charged the card $2000 USD instead
  // of the correct ~$7.19 USD equivalent.
  const amountInUsd = totalAmount * PKR_TO_USD_RATE;

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountInUsd * 100), // Stripe wants the smallest unit (cents)
      currency: STRIPE_CHARGE_CURRENCY,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      receipt_email: email,
      metadata: {
        userId: String(req.userId),
        // 🔑 store the PKR amount too, for reconciliation — Stripe's
        // dashboard alone won't show what the customer saw at checkout.
        pkrTotalAmount: String(totalAmount),
      },
    });
  } catch (err) {
    return res.status(402).json({ success: false, message: err.message || "Payment failed." });
  }

  // 3D Secure chahiye — order abhi mat banao, na hi stock kaato. Frontend
  // confirmCardPayment() karega aur ye endpoint (ya /orders/confirm)
  // dobara call hoga jab tak status "succeeded" na aa jaye.
  if (paymentIntent.status === "requires_action") {
    return res.status(200).json({
      success: true,
      requiresAction: true,
      clientSecret: paymentIntent.client_secret,
    });
  }

  if (paymentIntent.status !== "succeeded") {
    return res.status(402).json({ success: false, message: "Payment could not be completed." });
  }

  // ── 5. Payment confirm ho gaya — SIRF ab stock decrement + order create.
  // Agar stock kam nikla, paisay wapas (refund) turant. ──
  const decremented = [];

  for (const item of verifiedItems) {
    const updated = await decrementStockForItem({
      productId: item.productId,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
    });

    if (!updated) {
      await rollbackDecrements(decremented);
      await safeRefund(paymentIntent.id);
      return res.status(409).json({
        success: false,
        message: `"${item.name}"${item.size ? ` (size ${item.size})` : ""} is out of stock. Payment automatically refunded.`,
      });
    }

    decremented.push({ productId: item.productId, color: item.color, size: item.size, quantity: item.quantity });
  }
  let order;
  try {
    order = await Order.create({
      userId: req.userId,
      email,
      items: verifiedItems,
      shippingAddress,
      subtotal,
      shippingFee,
      discount,
      totalAmount, // PKR — what the customer saw and agreed to
      currency: "PKR",
      paymentMethod: "card",
      paymentStatus: "paid",
      status: "processing",
      stripePaymentIntentId: paymentIntent.id,
      paidAt: new Date(),
    });
  } catch (orderErr) {
    // Order DB me save nahi hua lekin paisay kat gaye aur stock kam ho gaya
    // — dono wapas karo.
    await rollbackDecrements(decremented);
    await safeRefund(paymentIntent.id);
    throw orderErr;
  }

  // 🔑 Order confirmed (card, payment captured) — let the customer know.
  notifyOrderConfirmed(order, email);

  return res.status(201).json({ success: true, order });
});
// ==========================
// Get logged-in user's own orders
// ==========================
exports.getOrders = asyncHandler(async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, orders });
});

// ==========================
// Get ALL orders — admin panel
// Supports server-side search (order number / email), status filter,
// and pagination — so the client never has to download the entire
// orders collection just to show one page of a table.
// Query params: ?page=1&limit=20&search=abc&status=shipped
// ==========================
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
  const { search, status } = req.query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    const orConditions = [{ email: { $regex: search, $options: "i" } }];
    // orderNumber is a Number field — only add a numeric match if the
    // search term actually parses as one, otherwise $eq with NaN errors.
    const numericSearch = Number(search);
    if (!Number.isNaN(numericSearch)) {
      orConditions.push({ orderNumber: numericSearch });
    }
    filter.$or = orConditions;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// ==========================
// Dashboard Stats — admin only
// Computed entirely on the DB side via aggregation, so the client never
// downloads and loops over the full orders collection. Matches the actual
// schema: totalAmount (Number), email (String), items (array of objects
// with a `name` field), createdAt (from timestamps), status (String).
// ==========================
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  const sixMonthsAgoStart = new Date(currentYear, currentMonth - 5, 1);
  const sevenDaysAgoStart = new Date();
  sevenDaysAgoStart.setDate(sevenDaysAgoStart.getDate() - 6);
  sevenDaysAgoStart.setHours(0, 0, 0, 0);

  const [monthly, daily, facetResult, recentOrders] = await Promise.all([
    // Monthly revenue, last 6 months
    Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgoStart } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Daily revenue, last 7 days
    Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgoStart } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),

    // All-time totals, current vs previous month, unique customers/products
    Order.aggregate([
      {
        $facet: {
          allTime: [
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalOrders: { $sum: 1 } } },
          ],
          uniqueCustomers: [{ $group: { _id: "$email" } }, { $count: "count" }],
          uniqueProducts: [
            { $unwind: "$items" },
            { $group: { _id: { $toLower: "$items.name" } } },
            { $count: "count" },
          ],
          currentMonth: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $year: "$createdAt" }, currentYear] },
                    { $eq: [{ $month: "$createdAt" }, currentMonth + 1] },
                  ],
                },
              },
            },
            { $group: { _id: null, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
          ],
          previousMonth: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $year: "$createdAt" }, currentMonth === 0 ? currentYear - 1 : currentYear] },
                    { $eq: [{ $month: "$createdAt" }, currentMonth === 0 ? 12 : currentMonth] },
                  ],
                },
              },
            },
            { $group: { _id: null, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
          ],
        },
      },
    ]),

    // 5 most recent orders — already sorted + limited in the DB
    Order.find().sort({ createdAt: -1 }).limit(5).select(
      "orderNumber email totalAmount status createdAt"
    ),
  ]);

  const facet = facetResult[0];
  const allTime = facet.allTime[0] || { totalRevenue: 0, totalOrders: 0 };
  const curr = facet.currentMonth[0] || { revenue: 0, orders: 0 };
  const prev = facet.previousMonth[0] || { revenue: 0, orders: 0 };

  const pctChange = (current, previous) => {
    if (!previous) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  return res.status(200).json({
    success: true,
    stats: {
      totalRevenue: allTime.totalRevenue,
      totalOrders: allTime.totalOrders,
      totalCustomers: facet.uniqueCustomers[0]?.count || 0,
      totalProducts: facet.uniqueProducts[0]?.count || 0,
      revenueChange: pctChange(curr.revenue, prev.revenue),
      ordersChange: pctChange(curr.orders, prev.orders),
      salesData: monthly.map((m) => ({
        month: m._id.month, // 1-indexed
        year: m._id.year,
        sales: Math.round(m.revenue),
      })),
      revenueData: daily.map((d) => ({
        day: d._id.day,
        month: d._id.month, // 1-indexed
        year: d._id.year,
        revenue: Math.round(d.revenue),
      })),
      recentOrders,
    },
  });
});

// ==========================
// Update order — admin edit modal
// ==========================
exports.updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order nahi mila" });
  }

  const {
    status,
    totalAmount,
    email,
    shippingAddress,
    items,
    trackingNumber,
    carrier,
    estimatedDelivery,
    paymentMethod,
    paymentStatus,
    note, // optional note attached to this status change (e.g. "Left warehouse")
  } = req.body;

  // Only fields actually sent get updated — undefined fields are skipped.
  if (status !== undefined) order.status = status;
  if (totalAmount !== undefined) order.totalAmount = totalAmount;
  if (email !== undefined) order.email = email;
  if (shippingAddress !== undefined) order.shippingAddress = shippingAddress;
  if (items !== undefined) order.items = items;
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  if (carrier !== undefined) order.carrier = carrier;
  if (estimatedDelivery !== undefined) order.estimatedDelivery = estimatedDelivery;
  if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;
  if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;

  // If the status actually changed and a note was sent, attach it to the
  // newest statusHistory entry that the pre-save hook is about to push.
  const willAddNote = note !== undefined && status !== undefined && status !== order.status;

  const updatedOrder = await order.save();

  if (willAddNote && updatedOrder.statusHistory.length) {
    updatedOrder.statusHistory[updatedOrder.statusHistory.length - 1].note = note;
    await updatedOrder.save();
  }

  return res.status(200).json({ success: true, message: "Order successfully updated", order: updatedOrder });
});

// ==========================
// Delete order — admin trash button
// ==========================
exports.deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  const order = await Order.findByIdAndDelete(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order nahi mila" });
  }

  return res.status(200).json({ success: true, message: "Order successfully deleted", id });
});

// ==========================
// Get single order by ID — admin edit modal, fresh data
// ==========================
exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order nahi mila" });
  }

  return res.status(200).json({ success: true, order });
});

// ==========================
// Track order — customer-facing (order number based, no Mongo _id needed)
// Works for:
//   - Guests: GET /orders/track/1043?email=someone@example.com
//   - Logged-in users: GET /orders/track/1043 (matched against req.userId)
// ==========================
exports.trackOrder = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const { email } = req.query;

  const numericOrderNumber = Number(orderNumber);
  if (!orderNumber || Number.isNaN(numericOrderNumber)) {
    return res.status(400).json({ success: false, message: "Valid order number is required." });
  }

  const query = { orderNumber: numericOrderNumber };

  if (req.userId) {
    query.userId = req.userId; // logged-in — only their own orders, no email needed
  } else if (email) {
    query.email = email; // guest — must match the order's email
  } else {
    return res.status(400).json({ success: false, message: "Email is required to track a guest order." });
  }

  const order = await Order.findOne(query).select(
    "orderNumber status paymentStatus statusHistory trackingNumber carrier estimatedDelivery items totalAmount shippingAddress createdAt"
  );

  if (!order) {
    return res.status(404).json({ success: false, message: "Order nahi mila. Order number aur email check karein." });
  }

  return res.status(200).json({ success: true, order });
});

// ==========================
// Cancel order — customer-facing self-cancel
// Route: PUT /orders/:id/cancel  (must match orderSlice.cancelOrder thunk)
// Only the order's own owner can cancel it, and only while it's still in
// an early enough status (see CANCELLABLE_STATUSES above).
// ==========================
exports.cancelOrder = asyncHandler(async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid order id" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  // Customers can only cancel their own orders — this is what stops
  // someone from cancelling another user's order by guessing an id.
  if (String(order.userId) !== String(req.userId)) {
    return res.status(403).json({
      success: false,
      message: "You can only cancel your own orders.",
    });
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: `This order can no longer be cancelled (current status: ${order.status}).`,
    });
  }

  // ── Refund — sirf jab actually paid ho (COD/unpaid pe refund nahi hoga).
  // Refund status abhi "pending" set hoga — final "succeeded" confirmation
  // Stripe ke "charge.refunded" webhook se aana chahiye, is response se nahi. ──
  if (order.paymentStatus === "paid" && order.stripePaymentIntentId) {
    try {
      const refund = await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
      order.refundId = refund.id;
      order.refundStatus = refund.status; // 'pending' — webhook se 'succeeded' confirm hoga
    } catch (err) {
      console.error("Refund failed:", err.message);
      return res.status(502).json({ success: false, message: "Refund process nahi ho saka, dobara try karein." });
    }
  }

  // ── Stock wapis add karo — same local rollbackDecrements jo createOrder
  // me bhi use hota hai, taake size-array aur top-level stock dono sync
  // rahein (ek se zyada alag rollback implementations mix karna bug ki
  // sabse badi wajah hai) ──
  await rollbackDecrements(
    order.items.map((i) => ({ productId: i.productId, color: i.color, size: i.size, quantity: i.quantity }))
  );

  order.status = "cancelled";
  await order.save();

  return res.status(200).json({ success: true, order });
});
const Cart    = require("../models/Cart");
const Product = require("../models/Product");

/**
 * GET /cart
 * Returns the logged-in user's cart. Returns an empty cart shape if none exists.
 * Note: protect middleware already blocks unauthenticated requests before this
 * runs, but the req.userId check is kept as a defensive fallback in case that ever changes.
 */
exports.getCart = async (req, res) => {
  try {
    if (!req.userId) {
      return res.json({ items: [] });
    }

    const cart = await Cart.findOne({ userId: req.userId });

    return res.json(cart || { items: [] });

  } catch (error) {
    console.error("[GetCart] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Couldn't load your cart. Please try again.",
    });
  }
};


exports.saveCart = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Please log in to save your cart.",
      });
    }

    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_ITEMS_FORMAT",
        message: "Something's wrong with your cart data.",
      });
    }

    const productIds = items.map((i) => i._id).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const safeItems = [];
    for (const i of items) {
      const product = productMap.get(i._id?.toString());
      if (!product) continue; // product deleted/invalid — drop it silently

      const quantity = Math.max(1, Math.min(Number(i.quantity) || 1, product.stock));

      safeItems.push({
        _id:      product._id,
        name:     product.name,
        price:    product.price,
        stock:    product.stock,
        images:   product.images,
        quantity,
      });
    }

    let cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      cart = await Cart.create({ userId: req.userId, items: safeItems });
    } else {
      cart.items = safeItems;
      await cart.save();
    }

    return res.json(cart);

  } catch (error) {
    console.error("[SaveCart] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Couldn't save your cart. Please try again.",
    });
  }
};
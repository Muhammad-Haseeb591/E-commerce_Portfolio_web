const Cart    = require("../models/Cart");
const Product = require("../models/Product");

exports.getCart = async (req, res) => {
  // protect middleware already blocks unauthenticated requests before this
  // runs, but kept as a defensive fallback in case that ever changes
  if (!req.userId) return res.json({ items: [] });

  const cart = await Cart.findOne({ userId: req.userId });
  res.json(cart || { items: [] });
};

exports.saveCart = async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Login required" });
  }

  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ message: "items must be an array" });
  }

  // Never trust price/stock the client sends — re-derive from the
  // real Product record. Prevents a client from POSTing a fake price.
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

  res.json(cart);
};
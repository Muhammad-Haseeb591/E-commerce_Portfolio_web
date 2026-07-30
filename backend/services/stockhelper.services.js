const Product = require("../models/Product");
const decrementStockForItem = async ({ productId, size, quantity }) => {
  if (size) {
    return Product.findOneAndUpdate(
      {
        _id: productId,
        sizes: { $elemMatch: { size, stock: { $gte: quantity } } },
      },
      {
        $inc: {
          "sizes.$[elem].stock": -quantity,
          stock: -quantity,
        },
      },
      { arrayFilters: [{ "elem.size": size }], new: true }
    );
  }

  return Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true }
  );
};

// If the order fails partway through (out-of-stock item / DB error), undo
// every decrement that already happened so stock is never left wrong.
const rollbackDecrements = async (decremented) => {
  await Promise.all(
    decremented.map(async ({ productId, size, quantity }) => {
      try {
        if (size) {
          await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { "sizes.$[elem].stock": quantity, stock: quantity } },
            { arrayFilters: [{ "elem.size": size }] }
          );
        } else {
          await Product.findOneAndUpdate({ _id: productId }, { $inc: { stock: quantity } });
        }
      } catch (err) {
        console.error("Stock rollback failed for", productId, size, err.message);
      }
    })
  );
};

// Attempts to decrement stock for every item. Returns { ok: true } on
// success, or { ok: false, message } with any partial decrements already
// rolled back — caller doesn't need to do its own rollback bookkeeping.
const decrementStockForItems = async (items) => {
  const decremented = [];

  for (const item of items) {
    const { productId, size, quantity, name } = item;

    const updated = await decrementStockForItem({ productId, size, quantity });

    if (!updated) {
      await rollbackDecrements(decremented);
      return {
        ok: false,
        message: `"${name || productId}"${size ? ` (size ${size})` : ""} is out of stock.`,
      };
    }

    decremented.push({ productId, size, quantity });
  }

  return { ok: true };
};

module.exports = { decrementStockForItem, rollbackDecrements, decrementStockForItems };
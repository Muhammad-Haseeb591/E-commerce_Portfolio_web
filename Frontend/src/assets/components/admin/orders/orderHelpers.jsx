// ── Shared constants + formatting helpers for the Orders admin section ──

export const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

export const STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatMoney = (n) => (typeof n === "number" ? `Rs. ${n.toFixed(2)}` : "—");

// Best-effort CSS color for a color name/hex coming from product data.
// Falls back to a neutral swatch if the browser can't resolve it.
export const swatchStyle = (color) => {
  if (!color) return { backgroundColor: "#e5e7eb" };
  return { backgroundColor: color };
};

// ── Normalizes one order "line item" into a product with its color variants.
// Handles two possible backend shapes so the UI never crashes either way:
//   1) item.colors = [{ color, quantity, image }, ...]   (single item, multi-color)
//   2) separate item entries per color, same product id/name, each with its
//      own item.color + item.quantity
// Groups everything by product so "2 colors of the same product" renders as
// ONE product card with a color+quantity breakdown, not duplicate rows.
export const groupOrderItemsByProduct = (items = []) => {
  const map = new Map();

  items.forEach((item) => {
    const key = item.productId || item.product?._id || item.product || item.name || Math.random();

    if (!map.has(key)) {
      map.set(key, {
        key,
        name: item.name || item.product?.name || "—",
        price: item.price,
        image: item.image || item.product?.image || null,
        variants: [],
      });
    }

    const entry = map.get(key);
    if (!entry.image && (item.image || item.product?.image)) {
      entry.image = item.image || item.product?.image;
    }

    if (Array.isArray(item.colors) && item.colors.length > 0) {
      item.colors.forEach((c) => {
        entry.variants.push({
          color: c.color || c.name || null,
          quantity: c.quantity ?? c.qty ?? 1,
          image: c.image || entry.image,
        });
        if (!entry.image && c.image) entry.image = c.image;
      });
    } else {
      entry.variants.push({
        color: item.color || null,
        quantity: item.quantity ?? 1,
        image: item.image || entry.image,
      });
    }
  });

  return Array.from(map.values()).map((entry) => ({
    ...entry,
    totalQuantity: entry.variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0),
    // Show the picture of whichever variant has one, else the product-level image.
    displayImage: entry.variants.find((v) => v.image)?.image || entry.image || null,
  }));
};
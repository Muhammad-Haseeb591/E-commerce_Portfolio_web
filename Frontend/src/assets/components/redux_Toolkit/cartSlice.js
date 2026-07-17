import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../config/api";


const getItemId = (item) => item?._id ?? item?.id;

// ← apna actual backend cart endpoint confirm kar lena
const CART_API_URL = `${API_URL}/cart`;

// ─────────────────────────────────────────────────────
// 🔑 CART ITEM SHAPE (this is the important part of this file)
//
// Every cart item is now grouped BY PRODUCT — one entry per product _id,
// no matter how many sizes of it are in the cart:
//
//   {
//     _id: "64f...",              // product id
//     name, price, oldPrice, images, color, category, stock, ...  // full product data
//     sizes: [
//       { size: "38", quantity: 2, stock: 5 },   // stock = available stock for THIS size
//       { size: "42", quantity: 1, stock: 8 },
//     ],
//   }
//
// Products that DON'T have sizes (type "other") still use this exact same
// shape, just with a single sizes entry where size is `null`:
//
//   sizes: [{ size: null, quantity: 3, stock: 20 }]
//
// Keeping this shape uniform means Cart.jsx, CartSync.jsx, and the checkout
// page never need an "if it has sizes vs not" branch — they just loop over
// `item.sizes` either way.
// ─────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────
// 🔧 sanitizeCartSizes — defensive normalization for whatever the backend
// hands back.
//
// This exists because cart lines can be OLDER than a bugfix (e.g. a line
// saved back when a product's size field was a combined string like
// "40,41,42,43,44" with no per-line quantity). Without this, a stale line
// like that comes back from the backend forever and renders as one glitchy
// row with `quantity: NaN`.
//
// Rules applied per raw size entry:
//   - "40,41,42,43,44"  -> split into separate "40" / "41" / ... entries
//   - quantity missing/NaN -> defaults to 1 (never lets NaN through)
//   - stock missing/NaN    -> defaults to Infinity (don't block a valid
//                              quantity just because stock wasn't recorded)
// ─────────────────────────────────────────────────────
const sanitizeCartSizes = (rawSizes) => {
  if (!Array.isArray(rawSizes) || rawSizes.length === 0) {
    return [{ size: null, quantity: 1 }];
  }

  const cleaned = [];
  const seen = new Set();

  rawSizes.forEach((entry) => {
    if (!entry) return;

    // size:null (no-size product) stays as-is, single line.
    if (entry.size === null || entry.size === undefined) {
      const key = "null";
      if (seen.has(key)) return;
      seen.add(key);
      cleaned.push({
        size: null,
        quantity: Number(entry.quantity) || 1,
        stock: Number(entry.stock) || Infinity,
      });
      return;
    }

    // Split combined "40,41,42" strings into individual sizes. A normal
    // single size like "40" or "L" just becomes a 1-item array here.
    const sizeParts = String(entry.size)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    sizeParts.forEach((size) => {
      if (seen.has(size)) return;
      seen.add(size);
      cleaned.push({
        size,
        // A combined line never had a real per-size quantity, so falling
        // back to 1 here is the safest guess instead of propagating NaN.
        quantity: Number(entry.quantity) || 1,
        stock: Number(entry.stock) || Infinity,
      });
    });
  });

  return cleaned.length > 0 ? cleaned : [{ size: null, quantity: 1 }];
};

// ─────────────────────────────────────────────────────
// fetchCart: backend se cart laata hai aur usko redux mein already-loaded
// product catalog (state.FetchPrducts.products) ke saath merge karke
// poora product data (name/price/images) attach karta hai.
// ─────────────────────────────────────────────────────
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await axios.get(CART_API_URL, { withCredentials: true });

      // ← backend response shape adjust kar lena agar different hai
      // e.g. { items: [{ productId, sizes: [{size, quantity}] }] }
      const rawItems = res.data.items || res.data.cart?.items || [];

      const { products } = getState().FetchPrducts; // ← already-fetched product catalog

      const enriched = rawItems.map((raw) => {
        const productId = raw.productId || getItemId(raw);
        const fullProduct = products.find((p) => getItemId(p) === productId);

        // 🔑 Backward compatible + defensive: handles the old flat
        // { quantity } shape (no sizes array) AND stale combined-size /
        // missing-quantity lines from before the size-splitting fix.
        const sizesSource =
          raw.sizes && raw.sizes.length > 0
            ? raw.sizes
            : [{ size: null, quantity: raw.quantity || raw.qty || 1 }];

        return {
          ...fullProduct, // name, price, images, stock, etc.
          _id: productId,
          sizes: sanitizeCartSizes(sizesSource),
        };
      });

      return enriched;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Cart fetch karte waqt masla aaya"
      );
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    hydrated: false,
    loading: false,
    error: null,
  },
  reducers: {
    setCart: (state, action) => {
      state.items = action.payload || [];
    },

    setHydrated: (state, action) => {
      state.hydrated = action.payload;
    },

    // payload: { product, size, quantity, stock? }
    // - product:  full product object (from catalog / Detail Page)
    // - size:     the size string being added, or null for a no-size product
    // - quantity: how many pieces of THIS size to add
    // - stock:    (optional) the caller already knows the correct stock for
    //             this exact size (e.g. Detail_Page's normalized sizeList) —
    //             pass it in directly. If omitted, we fall back to looking
    //             it up on product.sizes ourselves.
    //
    // No matter how many times this is dispatched — same size, different
    // size, 100 times — each (productId, size) combo only ever has ONE
    // line inside item.sizes; every call just adds to that line's quantity
    // (capped at that size's stock) instead of creating a duplicate.
    addToCart: (state, action) => {
      const { product, size = null, quantity = 1, stock } = action.payload || {};
      const productId = getItemId(product);
      if (!productId) return;

      // Prefer an explicit stock passed in by the caller (it already knows
      // the true per-size stock after splitting combined size strings).
      // Only fall back to deriving it from product.sizes when not given —
      // and even then, guard against a combined "40,41,42" entry not
      // matching an exact size string.
      let sizeStock = stock;
      if (sizeStock === undefined) {
        sizeStock = size
          ? (product.sizes || []).find((s) => String(s.size) === String(size))
              ?.stock ?? Infinity
          : Number(product.stock) || Infinity;
      }
      sizeStock = Number(sizeStock) || Infinity;

      const safeQuantity = Number(quantity) || 1;

      let item = state.items.find((i) => getItemId(i) === productId);

      if (!item) {
        item = { ...product, _id: productId, sizes: [] };
        state.items.push(item);
      }

      const sizeEntry = item.sizes.find((s) => s.size === size);

      if (sizeEntry) {
        sizeEntry.quantity = Math.min(
          (Number(sizeEntry.quantity) || 0) + safeQuantity,
          sizeStock
        );
        sizeEntry.stock = sizeStock; // keep stock snapshot fresh
      } else {
        item.sizes.push({
          size,
          quantity: Math.min(safeQuantity, sizeStock),
          stock: sizeStock,
        });
      }
    },

    // payload: { id, size }  — removes ONLY that size's line.
    // If it was the product's last remaining size, the whole product card
    // disappears from the cart too (no empty card left behind).
    removeFromCart: (state, action) => {
      const { id, size = null } = action.payload || {};
      const item = state.items.find((i) => getItemId(i) === id);
      if (!item) return;

      item.sizes = (item.sizes || []).filter((s) => s.size !== size);

      if (item.sizes.length === 0) {
        state.items = state.items.filter((i) => getItemId(i) !== id);
      }
    },

    // Removes an entire product card — every size of it — in one go.
    removeProductFromCart: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((i) => getItemId(i) !== id);
    },

    // payload: { id, size } — bumps up ONLY that size's quantity,
    // respecting that size's own stock ceiling.
    increaseQty: (state, action) => {
      const { id, size = null } = action.payload || {};
      const item = state.items.find((i) => getItemId(i) === id);
      if (!item) return;

      const sizeEntry = item.sizes.find((s) => s.size === size);
      if (!sizeEntry) return;

      const stockLimit = Number(sizeEntry.stock) || Infinity;
      const currentQty = Number(sizeEntry.quantity) || 0;
      if (currentQty < stockLimit) {
        sizeEntry.quantity = currentQty + 1;
      }
    },

    // payload: { id, size } — decreases ONLY that size's quantity.
    // Hitting 1 → 0 removes that size's line (and the whole product if it
    // was the last size left), matching the old "trash icon at qty 1" feel.
    decreaseQty: (state, action) => {
      const { id, size = null } = action.payload || {};
      const item = state.items.find((i) => getItemId(i) === id);
      if (!item) return;

      const sizeEntry = item.sizes.find((s) => s.size === size);
      if (!sizeEntry) return;

      const currentQty = Number(sizeEntry.quantity) || 0;
      if (currentQty <= 1) {
        item.sizes = item.sizes.filter((s) => s.size !== size);
        if (item.sizes.length === 0) {
          state.items = state.items.filter((i) => getItemId(i) !== id);
        }
      } else {
        sizeEntry.quantity = currentQty - 1;
      }
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.hydrated = true; // ← fetch complete hote hi hydrated true
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Cart load nahi ho saka";
        state.hydrated = true; // ← fail hone pe bhi loading screen hamesha ke liye na atke
      });
  },
});

export const {
  setCart,
  setHydrated,
  addToCart,
  removeFromCart,
  removeProductFromCart,
  increaseQty,
  decreaseQty,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
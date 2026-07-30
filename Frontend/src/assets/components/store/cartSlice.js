import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../../../config/api";


const getItemId = (item) => item?._id ?? item?.id;

// 🔑 NEW — normalize color for comparisons ("" and null/undefined all
// mean "no color"). Used everywhere a cart line is looked up, so a
// no-color product always matches consistently.
const normColor = (c) => c || null;

// 🔑 NEW — jab tak sirf `productId` se cart line dhoondi jati thi,
// same product ke 2 ALAG colors ek hi line mein merge ho jate thay
// (dono ka `sizes[]` mix ho jata, pata nahi chalta kaunsa size kis
// color ka tha). Ab har cart line `productId + color` ke combo se
// unique hai — Red aur Blue ki same product do ALAG lines banengi,
// har ek apni khud ki `color`, `image`, aur `sizes[]` ke sath.
const matchesLine = (item, productId, color) =>
  getItemId(item) === productId && normColor(item.color) === normColor(color);

// ← apna actual backend cart endpoint confirm kar lena
const CART_API_URL = `${API_URL}/cart`;
const sanitizeCartSizes = (rawSizes) => {
  if (!Array.isArray(rawSizes) || rawSizes.length === 0) {
    return [{ size: null, quantity: 1 }];
  }

  const cleaned = [];
  const seen = new Set();

  rawSizes.forEach((entry) => {
    if (!entry) return;
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
    const sizeParts = String(entry.size)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    sizeParts.forEach((size) => {
      if (seen.has(size)) return;
      seen.add(size);
      cleaned.push({
        size,
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
      // e.g. { items: [{ productId, color, image, sizes: [{size, quantity}] }] }
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
          ...fullProduct, // name, price, etc.
          _id: productId,
          // 🔑 color/image are a SNAPSHOT of what the user actually picked
          // at add-to-cart time — never re-derived from fullProduct.colors,
          // since that array can change (colors renamed/removed) after the
          // item was added.
          color: raw.color || null,
          image: raw.image || null,
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

    addToCart: (state, action) => {
      const { product, size = null, quantity = 1, stock, color = null, image = null } =
        action.payload || {};
      const productId = getItemId(product);
      if (!productId) return;

      
      let sizeStock = stock;
      if (sizeStock === undefined) {
        sizeStock = size
          ? (product.sizes || []).find((s) => String(s.size) === String(size))
              ?.stock ?? Infinity
          : Number(product.stock) || Infinity;
      }
      sizeStock = Number(sizeStock) || Infinity;

      const safeQuantity = Number(quantity) || 1;

      let item = state.items.find((i) => matchesLine(i, productId, color));

      if (!item) {
        item = {
          ...product,
          _id: productId,
          color: normColor(color),
          image: image || null,
          sizes: [],
        };
        state.items.push(item);
      } else if (image && !item.image) {
        // keep the first snapshot image, but fill it in if it was missing
        item.image = image;
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

    // payload: { id, size, color? }  — removes ONLY that size's line, for
    // that SPECIFIC color's cart item.
    // If it was the product's last remaining size, the whole product/color
    // card disappears from the cart too (no empty card left behind).
    removeFromCart: (state, action) => {
      const { id, size = null, color = null } = action.payload || {};
      const item = state.items.find((i) => matchesLine(i, id, color));
      if (!item) return;

      item.sizes = (item.sizes || []).filter((s) => s.size !== size);

      if (item.sizes.length === 0) {
        state.items = state.items.filter((i) => !matchesLine(i, id, color));
      }
    },

    // Removes an entire product+color card — every size of it — in one go.
    removeProductFromCart: (state, action) => {
      const { id, color = null } =
        typeof action.payload === "object" ? action.payload : { id: action.payload };
      state.items = state.items.filter((i) => !matchesLine(i, id, color));
    },

    // payload: { id, size, color? } — bumps up ONLY that size's quantity,
    // for that SPECIFIC color's line, respecting that size's own stock
    // ceiling.
    increaseQty: (state, action) => {
      const { id, size = null, color = null } = action.payload || {};
      const item = state.items.find((i) => matchesLine(i, id, color));
      if (!item) return;

      const sizeEntry = item.sizes.find((s) => s.size === size);
      if (!sizeEntry) return;

      const stockLimit = Number(sizeEntry.stock) || Infinity;
      const currentQty = Number(sizeEntry.quantity) || 0;
      if (currentQty < stockLimit) {
        sizeEntry.quantity = currentQty + 1;
      }
    },

    // payload: { id, size, color? } — decreases ONLY that size's quantity,
    // for that SPECIFIC color's line.
    // Hitting 1 → 0 removes that size's line (and the whole card if it
    // was the last size left), matching the old "trash icon at qty 1" feel.
    decreaseQty: (state, action) => {
      const { id, size = null, color = null } = action.payload || {};
      const item = state.items.find((i) => matchesLine(i, id, color));
      if (!item) return;

      const sizeEntry = item.sizes.find((s) => s.size === size);
      if (!sizeEntry) return;

      const currentQty = Number(sizeEntry.quantity) || 0;
      if (currentQty <= 1) {
        item.sizes = item.sizes.filter((s) => s.size !== size);
        if (item.sizes.length === 0) {
          state.items = state.items.filter((i) => !matchesLine(i, id, color));
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
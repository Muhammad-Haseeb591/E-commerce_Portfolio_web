import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import { API_URL } from "../../../config/api";

// 🔑 API_URL ke end mein trailing slash ho ya na ho, dono cases mein
// URL sahi banega (double slash ya missing slash nahi hoga).
const BASE_URL = `${API_URL.replace(/\/+$/, "")}/orders`;

const config = {
  withCredentials: true,
};

// ==========================
// Fetch Orders (logged-in user's own orders — customer-facing)
// ==========================
export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (_, thunkAPI) => {
    try {
      const res = await axios.get(BASE_URL, config);
      return res.data.orders;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Orders fetch failed."
      );
    }
  }
);

// ==========================
// Fetch ALL Orders (Admin panel — every customer's orders)
// Accepts { page, limit, search, status } — all optional. Server does the
// filtering/pagination, so the client only ever downloads one page.
// ==========================
export const fetchAllOrders = createAsyncThunk(
  "orders/fetchAllOrders",
  async (params = {}, thunkAPI) => {
    try {
      const res = await axios.get(`${BASE_URL}/all`, { ...config, params });
      return res.data; // { orders, pagination }
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Orders fetch failed."
      );
    }
  }
);

// ==========================
// Fetch Single Order by ID (admin edit modal opens with fresh data)
// ==========================
export const fetchOrderById = createAsyncThunk(
  "orders/fetchOrderById",
  async (id, thunkAPI) => {
    try {
      const res = await axios.get(`${BASE_URL}/${id}`, config);
      return res.data.order;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Order details fetch failed."
      );
    }
  }
);

// ==========================
// Update Order (admin only)
// ==========================
export const updateOrder = createAsyncThunk(
  "orders/updateOrder",
  async ({ id, ...updates }, thunkAPI) => {
    try {
      const res = await axios.put(`${BASE_URL}/${id}`, updates, config);
      return res.data.order;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Order update failed."
      );
    }
  }
);

// ==========================
// Delete Order (admin only)
// ==========================
export const deleteOrder = createAsyncThunk(
  "orders/deleteOrder",
  async (id, thunkAPI) => {
    try {
      await axios.delete(`${BASE_URL}/${id}`, config);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Order delete failed."
      );
    }
  }
);

// ==========================
// Cancel Order (customer — their own order only, while cancellable)
// ==========================
export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async (id, thunkAPI) => {
    try {
      const res = await axios.put(`${BASE_URL}/${id}/cancel`, {}, config);
      return res.data.order;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Order cancellation failed."
      );
    }
  }
);

// ==========================
// Fetch Dashboard Stats (admin) — server-computed, cheap payload.
// Skips the request entirely if we already fetched within CACHE_MS,
// so switching tabs / re-mounting the Dashboard doesn't hammer the API.
// ==========================
const CACHE_MS = 60 * 1000; // 60 seconds

export const fetchDashboardStats = createAsyncThunk(
  "orders/fetchDashboardStats",
  async (_, thunkAPI) => {
    try {
      const res = await axios.get(`${BASE_URL}/dashboard-stats`, config);
      return res.data.stats;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Dashboard stats fetch failed."
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { lastFetchedAt } = getState().orders;
      if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_MS) {
        return false; // bail out — cached data is still fresh
      }
      return true;
    },
  }
);

const orderSlice = createSlice({
  name: "orders",

  initialState: {
    // ---- customer-facing (fetchOrders / cancelOrder) — UNCHANGED ----
    orders: [],
    loading: false,
    error: null,
    cancelling: false,

    // ---- admin-facing (fetchAllOrders / fetchOrderById / updateOrder / deleteOrder) — NEW ----
    allOrders: [],
    allOrdersLoading: false,
    allOrdersError: null,
    allOrdersPagination: { page: 1, limit: 20, total: 0, pages: 0 },
    detailsLoading: false,
    updating: false,
    deleting: false,

    // ---- dashboard stats (server-aggregated) ----
    dashboardStats: null,
    dashboardLoading: false,
    dashboardError: null,
    lastFetchedAt: null,
  },

  reducers: {
    clearOrderError: (state) => {
      state.error = null;
      state.allOrdersError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ---- fetchOrders (own / customer) — UNCHANGED ----
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---- fetchAllOrders (admin) — now writes to allOrders ----
      .addCase(fetchAllOrders.pending, (state) => {
        state.allOrdersLoading = true;
        state.allOrdersError = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.allOrdersLoading = false;
        state.allOrders = action.payload.orders;
        state.allOrdersPagination = action.payload.pagination;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.allOrdersLoading = false;
        state.allOrdersError = action.payload;
      })

      // ---- fetchOrderById (admin) — updates allOrders ----
      .addCase(fetchOrderById.pending, (state) => {
        state.detailsLoading = true;
        state.allOrdersError = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        const index = state.allOrders.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.allOrders[index] = action.payload;
        }
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.allOrdersError = action.payload;
      })

      // ---- updateOrder (admin) — updates allOrders ----
      .addCase(updateOrder.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.allOrders.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.allOrders[index] = action.payload;
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.updating = false;
        state.allOrdersError = action.payload;
      })

      // ---- deleteOrder (admin) — removes from allOrders ----
      .addCase(deleteOrder.pending, (state) => {
        state.deleting = true;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.deleting = false;
        state.allOrders = state.allOrders.filter((o) => o._id !== action.payload);
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.deleting = false;
        state.allOrdersError = action.payload;
      })

      // ---- fetchDashboardStats (admin) ----
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardStats = action.payload;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        // `undefined` payload means the request was skipped by the cache guard —
        // not a real error, so don't surface it.
        if (action.payload) {
          state.dashboardError = action.payload;
        }
      })

      // ---- cancelOrder (customer) — UNCHANGED, still touches `orders` ----
      .addCase(cancelOrder.pending, (state) => {
        state.cancelling = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.cancelling = false;
        const index = state.orders.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.cancelling = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;
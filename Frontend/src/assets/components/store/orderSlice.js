import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import { API_URL } from "../../../config/api";

// 🔑 Compute the base URL lazily (inside a function), NOT at module top level.
// Computing it at import time (`const BASE_URL = ...API_URL...`) can crash
// with "Cannot access 'X' before initialization" if there is ANY circular
// import chain that causes this module to be evaluated before API_URL is
// initialized. A function defers the read until it's actually called,
// which is always safe.
const getBaseUrl = () => `${API_URL.replace(/\/+$/, "")}/orders`;

const config = {
  withCredentials: true,
};

// ==========================
// Fetch Orders (logged-in user's own orders — customer-facing)
// 🔑 MOUNT GUARD: if we already have data (and no error), skip the request.
// This means switching tabs / remounting the component that dispatches
// this (e.g. an AccountActivity tab) won't refetch — only a full page
// refresh (which resets the Redux store) triggers a real fetch again.
// Pass { force: true } to bypass the guard when you explicitly need
// fresh data (e.g. after placing a new order).
// ==========================
export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (params = {}, thunkAPI) => {
    try {
      const res = await axios.get(getBaseUrl(), config);
      return res.data.orders;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Orders fetch failed."
      );
    }
  },
  {
    condition: (params = {}, { getState }) => {
      if (params?.force) return true;
      const { ordersFetched, error } = getState().orders;
      if (ordersFetched && !error) return false; // already have data — skip
      return true;
    },
  }
);

// ==========================
// Fetch ALL Orders (Admin panel — every customer's orders)
// Accepts { page, limit, search, status, force }. Server does the
// filtering/pagination, so the client only ever downloads one page.
// 🔑 MOUNT GUARD: skips the request if we already fetched this exact
// page/search/status combo and there's no error — so remounting the
// Orders admin page (tab switch) doesn't refetch page 1 with empty
// filters just because the component's local state reset. Pass
// { force: true } (used after delete/update) to always bypass this.
// ==========================
export const fetchAllOrders = createAsyncThunk(
  "orders/fetchAllOrders",
  async (params = {}, thunkAPI) => {
    try {
      const { force, ...queryParams } = params;
      const res = await axios.get(`${getBaseUrl()}/all`, { ...config, params: queryParams });
      return res.data; // { orders, pagination }
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Orders fetch failed."
      );
    }
  },
  {
    condition: (params = {}, { getState }) => {
      if (params?.force) return true;
      const { allOrdersFetched, allOrdersLastKey, allOrdersError } = getState().orders;
      const { force, ...queryParams } = params;
      const key = JSON.stringify(queryParams);
      if (allOrdersFetched && !allOrdersError && allOrdersLastKey === key) {
        return false; // same page/search/status already loaded — skip
      }
      return true;
    },
  }
);

// ==========================
// Fetch Single Order by ID (admin edit modal opens with fresh data)
// Always fetches fresh — this is an explicit "open details" action, not
// a mount-triggered list load, so no cache guard here.
// ==========================
export const fetchOrderById = createAsyncThunk(
  "orders/fetchOrderById",
  async (id, thunkAPI) => {
    try {
      const res = await axios.get(`${getBaseUrl()}/${id}`, config);
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
      const res = await axios.put(`${getBaseUrl()}/${id}`, updates, config);
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
      await axios.delete(`${getBaseUrl()}/${id}`, config);
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
      const res = await axios.put(`${getBaseUrl()}/${id}/cancel`, {}, config);
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
// 🔑 MOUNT GUARD: skips the request if we already have stats and no
// error — so switching tabs / re-mounting the Dashboard doesn't refetch.
// Pass { force: true } to bypass (e.g. a manual "Refresh" button).
// ==========================
export const fetchDashboardStats = createAsyncThunk(
  "orders/fetchDashboardStats",
  async (params = {}, thunkAPI) => {
    try {
      const res = await axios.get(`${getBaseUrl()}/dashboard-stats`, config);
      return res.data.stats;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Dashboard stats fetch failed."
      );
    }
  },
  {
    condition: (params = {}, { getState }) => {
      if (params?.force) return true;
      const { dashboardStats, dashboardError } = getState().orders;
      if (dashboardStats && !dashboardError) return false; // already loaded — skip
      return true;
    },
  }
);

const orderSlice = createSlice({
  name: "orders",

  initialState: {
    // ---- customer-facing (fetchOrders / cancelOrder) ----
    orders: [],
    loading: false,
    error: null,
    cancelling: false,
    ordersFetched: false, // 🔑 mount-guard flag

    // ---- admin-facing (fetchAllOrders / fetchOrderById / updateOrder / deleteOrder) ----
    allOrders: [],
    allOrdersLoading: false,
    allOrdersError: null,
    allOrdersPagination: { page: 1, limit: 20, total: 0, pages: 0 },
    allOrdersFetched: false, // 🔑 mount-guard flag
    allOrdersLastKey: null,  // 🔑 last page/search/status combo fetched
    detailsLoading: false,
    updating: false,
    deleting: false,

    // ---- dashboard stats (server-aggregated) ----
    dashboardStats: null,
    dashboardLoading: false,
    dashboardError: null,
  },

  reducers: {
    clearOrderError: (state) => {
      state.error = null;
      state.allOrdersError = null;
    },
    // Optional manual escape hatch — call this (e.g. on logout, or a
    // "Refresh" button) to force the next fetch to actually hit the API.
    resetOrdersCache: (state) => {
      state.ordersFetched = false;
      state.allOrdersFetched = false;
      state.allOrdersLastKey = null;
      state.dashboardStats = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ---- fetchOrders (own / customer) ----
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.ordersFetched = true;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        // `undefined` payload means the mount guard skipped this request —
        // not a real error, so don't surface it.
        if (action.payload) {
          state.error = action.payload;
        }
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
        state.allOrdersFetched = true;
        state.allOrdersLastKey = JSON.stringify(action.meta.arg || {});
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.allOrdersLoading = false;
        if (action.payload) {
          state.allOrdersError = action.payload;
        }
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
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        // `undefined` payload means the mount guard skipped this request —
        // not a real error, so don't surface it.
        if (action.payload) {
          state.dashboardError = action.payload;
        }
      })

      // ---- cancelOrder (customer) — still touches `orders` directly, no refetch needed ----
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

export const { clearOrderError, resetOrdersCache } = orderSlice.actions;
export default orderSlice.reducer;
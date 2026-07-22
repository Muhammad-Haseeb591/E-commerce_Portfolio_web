// features/reports/reportSlice.js
//
// Sales report state — unlike the download endpoints, this one is a good
// fit for Redux: the same fetched data (summary/timeline/topProducts) and
// filters (from/to/groupBy) are likely read by multiple pieces of the
// admin dashboard (chart, summary cards, filter bar) and should stay in sync.
//
// ⚠️ Adjust the import below to match your actual axios instance.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../config/api";

// GET /orders/reports/sales?from=&to=&groupBy=day|month
export const fetchSalesReport = createAsyncThunk(
  "report/fetchSalesReport",
  async (filters, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/orders/reports/sales", { params: filters });
      return data; // { success, summary, timeline, topProducts }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load sales report");
    }
  }
);

const initialState = {
  filters: {
    from: null,
    to: null,
    groupBy: "day", // "day" | "month"
  },
  summary: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
  timeline: [],
  topProducts: [],
  status: "idle", // "idle" | "loading" | "succeeded" | "failed"
  error: null,
};

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    setReportFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetReportFilters(state) {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesReport.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.summary = action.payload.summary;
        state.timeline = action.payload.timeline;
        state.topProducts = action.payload.topProducts;
      })
      .addCase(fetchSalesReport.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setReportFilters, resetReportFilters } = reportSlice.actions;
export default reportSlice.reducer;s
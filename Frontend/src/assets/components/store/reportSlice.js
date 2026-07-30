import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../../../config/api";

const BASE_URL = `${API_URL.replace(/\/+$/, "")}/orders`;
const config = { withCredentials: true };

// null / undefined / "" params ko strip kar dete hain — clean query string,
// warna axios "from=null&to=null" jaisi cheez server ko bhej sakta hai.
const cleanParams = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== "")
  );

// GET /orders/reports/sales?from=&to=&groupBy=day|month
export const fetchSalesReport = createAsyncThunk(
  "report/fetchSalesReport",
  async (filters, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/reports/sales`, {
        ...config,
        params: cleanParams(filters),
      });
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
  summary: null,        // 🔑 null = abhi tak koi data nahi aaya (real "no data yet" state)
  timeline: [],
  topProducts: [],
  status: "idle",        // "idle" | "loading" | "succeeded" | "failed"
  error: null,
  hasFetchedOnce: false, // 🔑 pehli successful load ho chuki hai ya nahi (skeleton logic ke liye)

  // 🔑 RACE-CONDITION GUARD: agar user jaldi jaldi day/month toggle kare, to
  // purana (slow) response naye data ko overwrite nahi karega — sirf sabse
  // latest request ka result state mein apply hoga.
  currentRequestId: null,
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
      .addCase(fetchSalesReport.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        state.currentRequestId = action.meta.requestId; // is request ko "latest" mark karo
      })
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return; // stale response, ignore
        state.status = "succeeded";
        state.summary = action.payload.summary;
        state.timeline = action.payload.timeline;
        state.topProducts = action.payload.topProducts;
        state.hasFetchedOnce = true;
      })
      .addCase(fetchSalesReport.rejected, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return; // stale response, ignore
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setReportFilters, resetReportFilters } = reportSlice.actions;
export default reportSlice.reducer;
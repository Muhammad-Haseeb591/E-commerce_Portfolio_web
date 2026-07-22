import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../../../config/api";

const BASE_URL = `${API_URL.replace(/\/+$/, "")}/orders`;
const config = { withCredentials: true };

export const fetchSalesReport = createAsyncThunk(
  "report/fetchSalesReport",
  async (filters, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/reports/sales`, {
        ...config,
        params: filters,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load sales report");
    }
  }
);

// ... baaki slice same rahega (initialState, reducers, extraReducers)
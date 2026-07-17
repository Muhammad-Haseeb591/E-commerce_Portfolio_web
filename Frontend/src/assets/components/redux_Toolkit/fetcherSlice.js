import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_URL } from "../config/api";


const BASE_URL = `${API_URL}/admin`;

// ─────────────────────────────────────────────
// 1. Fetch Products (category, color, price, search, sort, pagination)
// ─────────────────────────────────────────────
export const fetchData = createAsyncThunk(
  "products/fetchData",
  async (params = {}, thunkAPI) => {
    try {
      const query = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
      ).toString();

      const url = query
        ? `${BASE_URL}/products/getproducts?${query}`
        : `${BASE_URL}/products/getproducts`;

      const response = await fetch(url, {
        credentials: "include", // send auth cookie
      });

      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();

      // Backend returns { success, count, totalCount, totalPages, currentPage, products }
      if (Array.isArray(data)) {
        return {
          products: data,
          totalCount: data.length,
          totalPages: 1,
          currentPage: 1,
        };
      }

      return {
        products: data.products || [],
        totalCount: data.totalCount ?? data.products?.length ?? 0,
        totalPages: data.totalPages ?? 1,
        currentPage: data.currentPage ?? 1,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// ─────────────────────────────────────────────
// 1b. Fetch FULL Catalog (internal use — e.g. cart enrichment)
// Does not touch browsing filters (category/sort/search), so it
// never overwrites a filtered product list on category pages.
// ─────────────────────────────────────────────
export const fetchCatalog = createAsyncThunk(
  "products/fetchCatalog",
  async (_, thunkAPI) => {
    try {
      const response = await fetch(`${BASE_URL}/products/getproducts`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch catalog");
      const data = await response.json();
      return Array.isArray(data) ? data : data.products || [];
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// ─────────────────────────────────────────────
// 2. Delete Product
// ─────────────────────────────────────────────
export const deleteProductAsync = createAsyncThunk(
  "products/delete",
  async (id, thunkAPI) => {
    try {
      const res = await fetch(`${BASE_URL}/deleteproduct/${id}`, {
        method: "DELETE",
        credentials: "include", // required — sends the auth cookie to the protected route
      });

      if (!res.ok) throw new Error("Failed to delete product");
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// ─────────────────────────────────────────────
// 3. Edit Product
// ─────────────────────────────────────────────
export const editProductAsync = createAsyncThunk(
  "products/edit",
  async ({ id, updatedData }, thunkAPI) => {
    try {
      const res = await fetch(`${BASE_URL}/updateproduct/${id}`, {
        method: "PUT",
        credentials: "include", // required — sends the auth cookie to the protected route
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error("Failed to update product");
      const data = await res.json();
      return data.product;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// ─────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────
const initialFilters = {
  category: "",
  search: "",
  color: "",
  minPrice: "",
  maxPrice: "",
  sizes: "",
  sortBy: "createdAt", // price | name | rating | discount | createdAt
  order: "desc", // asc | desc
  page: 1,
  size: 20,
};

const fetcherSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    loading: false,
    error: null,
    deleteLoading: false,
    editLoading: false,

    // Pagination info from backend
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,

    // Only the latest fetchData call's result is accepted into state.
    // On reload, an "empty filters" request may fire and then be
    // immediately followed by the "correct filters" request — this
    // guards against the stale one overwriting the fresh one.
    currentRequestId: null,

    // Full product catalog — internal use only (e.g. cart enrichment).
    // Completely separate from the filtered "products" list used by
    // browsing pages (Women/Men/etc), so it never overwrites them.
    catalog: [],
    catalogLoading: false,

    filters: { ...initialFilters },
  },
  reducers: {
    // Update a single filter field, e.g.
    // dispatch(setFilter({ key: "category", value: "women" }))
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;

      // Any filter change except pagination resets back to page 1
      if (key !== "page") {
        state.filters.page = 1;
      }
    },
    // Update multiple filters at once, e.g. sort change (sortBy + order)
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    resetFilters: (state) => {
      state.filters = { ...initialFilters };
    },
    setPage: (state, action) => {
      state.filters.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---- fetchData ----
      .addCase(fetchData.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return; // ignore stale response

        state.loading = false;
        state.products = action.payload.products;
        state.totalCount = action.payload.totalCount;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchData.rejected, (state, action) => {
        if (action.meta.requestId !== state.currentRequestId) return;

        state.loading = false;
        state.error = action.payload;
      })

      // ---- fetchCatalog ----
      .addCase(fetchCatalog.pending, (state) => {
        state.catalogLoading = true;
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        state.catalogLoading = false;
        state.catalog = action.payload;
      })
      .addCase(fetchCatalog.rejected, (state) => {
        state.catalogLoading = false;
      })

      // ---- deleteProductAsync ----
      .addCase(deleteProductAsync.pending, (state) => {
        state.deleteLoading = true;
      })
      .addCase(deleteProductAsync.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.products = state.products.filter((p) => p._id !== action.payload);
      })
      .addCase(deleteProductAsync.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })

      // ---- editProductAsync ----
      .addCase(editProductAsync.pending, (state) => {
        state.editLoading = true;
      })
      .addCase(editProductAsync.fulfilled, (state, action) => {
        state.editLoading = false;
        const index = state.products.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(editProductAsync.rejected, (state, action) => {
        state.editLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilter, setFilters, resetFilters, setPage } = fetcherSlice.actions;
export default fetcherSlice.reducer;
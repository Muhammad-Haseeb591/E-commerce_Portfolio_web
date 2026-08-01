import { createAsyncThunk, createSlice, createSelector } from "@reduxjs/toolkit";
import { API_URL } from "../../../config/api";

const BASE_URL = `${API_URL}/admin`;

// ─────────────────────────────────────────────
// 1. Fetch Products (category, color, price, search, sort, pagination)
//    — server-side filtered/paginated list (used by admin table etc.)
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

      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();

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
// 1b. Fetch FULL Catalog (storefront pages — New/Women/Men/etc.
//     filter this client-side via selectFilteredCatalog below)
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
  },
  {
    // Prevents duplicate/parallel fetches — e.g. New.jsx, Women.jsx and
    // Men.jsx all mount around the same time and each would otherwise
    // fire its own full 1000-product fetch if catalog was still empty.
    condition: (_, { getState }) => {
      const { catalogLoading, catalog } = getState().FetchPrducts;
      if (catalogLoading) return false;
      if (catalog && catalog.length > 0) return false;
      return true;
    },
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
        credentials: "include",
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to update product");
      }
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
  order: "desc",       // asc | desc
  page: 1,
  size: 20,
};

const initialState = {
  products: [],
  loading: false,
  error: null,

  deleteLoading: false,
  editLoading: false,
  editError: null,
  deleteError: null,

  // Server-side pagination info (fetchData)
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,

  // Guards against a stale fetchData response overwriting a fresher one
  currentRequestId: null,

  // Full catalog — used by storefront pages for client-side filtering
  catalog: [],
  catalogLoading: false,

  filters: { ...initialFilters },
};

const fetcherSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
      if (key !== "page") state.filters.page = 1;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    resetFilters: (state) => {
      state.filters = { ...initialFilters };
    },
    setPage: (state, action) => {
      state.filters.page = action.payload;
    },
    setTotalCount: (state, action) => {
      state.totalCount = action.payload;
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
        if (action.meta.requestId !== state.currentRequestId) return;
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
        state.deleteError = null;
      })
      .addCase(deleteProductAsync.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.products = state.products.filter((p) => p._id !== action.payload);
        state.catalog = state.catalog.filter((p) => p._id !== action.payload);
      })
      .addCase(deleteProductAsync.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })

      // ---- editProductAsync ----
      .addCase(editProductAsync.pending, (state) => {
        state.editLoading = true;
        state.editError = null;
      })
      .addCase(editProductAsync.fulfilled, (state, action) => {
        state.editLoading = false;

        const productIndex = state.products.findIndex((p) => p._id === action.payload._id);
        if (productIndex !== -1) state.products[productIndex] = action.payload;

        const catalogIndex = state.catalog.findIndex((p) => p._id === action.payload._id);
        if (catalogIndex !== -1) state.catalog[catalogIndex] = action.payload;
      })
      .addCase(editProductAsync.rejected, (state, action) => {
        state.editLoading = false;
        state.editError = action.payload;
      });
  },
});

export const { setFilter, setFilters, resetFilters, setPage, setTotalCount } = fetcherSlice.actions;
export default fetcherSlice.reducer;

// ─────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────
const selectCatalog = (state) => state.FetchPrducts.catalog;
const selectFilters = (state) => state.FetchPrducts.filters;

// Memoized — only recomputes when `catalog` or `filters` actually change.
// This is what keeps 1000-product filtering fast: unrelated re-renders
// (page navigation elsewhere, unrelated dispatches) reuse the cached
// result instead of re-filtering the whole array every time.
export const selectFilteredCatalog = createSelector(
  [selectCatalog, selectFilters],
  (catalog, filters) => {
    let result = catalog;

    if (filters.category) {
      const category = filters.category.toLowerCase();
      result = result.filter((p) => p.category?.toLowerCase() === category);
    }

    if (filters.color) {
      result = result.filter((p) =>
        Array.isArray(p.colors)
          ? p.colors.some((c) => (c.color || c.name || c) === filters.color)
          : p.color === filters.color
      );
    }

    if (filters.sizes) {
      result = result.filter((p) => p.sizes?.includes(filters.sizes));
    }

    if (filters.minPrice) {
      const min = Number(filters.minPrice);
      result = result.filter((p) => Number(p.price) >= min);
    }

    if (filters.maxPrice) {
      const max = Number(filters.maxPrice);
      result = result.filter((p) => Number(p.price) <= max);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter((p) => p.name?.toLowerCase().includes(query));
    }

    return result;
  }
);
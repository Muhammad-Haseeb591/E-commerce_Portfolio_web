import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_URL } from "../../../config/api";


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

      // 🔑 FIXED — this used to throw a hardcoded "Failed to update
      // product" on any non-ok response WITHOUT ever reading the body.
      // The backend's actual message/error (e.g. "Each color must have
      // an image", a validation message, a real stack-trace-derived
      // reason) was sitting right there in the response and got thrown
      // away. Now the body is parsed first, and its `message`/`error` is
      // what flows into rejectWithValue → editError → the Edit modal.
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

    // 🔑 NEW — edit/delete failures used to overwrite this SAME `error`
    // field that fetchData.rejected uses to show the full-page
    // ErrorState. That meant one failed Edit Product save replaced the
    // ENTIRE list (which was still perfectly valid) with a red error
    // screen, hiding all products until a manual refresh. Now edit/delete
    // failures get their own fields, surfaced inline (e.g. inside the
    // Edit modal) instead of blowing away the whole page.
    editError: null,
    deleteError: null,

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
    // 🔑 NEW — for pages that filter/paginate CLIENT-SIDE (e.g. New.jsx,
    // which loads the full catalog via fetchCatalog and filters it
    // locally with useFilteredProducts, instead of calling fetchData).
    // Those pages never trigger fetchData.fulfilled, so totalCount would
    // otherwise stay stuck at whatever the last server-fetch page left it
    // at (or 0, after a refresh). Call this whenever the client-side
    // filtered product count changes, so Main.jsx's "{totalCount}
    // products" display always matches what's actually on screen.
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
        state.deleteError = null;
      })
      .addCase(deleteProductAsync.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.products = state.products.filter((p) => p._id !== action.payload);
        // 🔑 FIXED — `catalog` (what New/Women/Men actually render via
        // useFilteredProducts) was never touched here. A product deleted
        // in admin kept showing on the storefront until a full app
        // reload re-ran fetchCatalog (which only fires when catalog is
        // still empty). Keep catalog in sync too, same as `products`.
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
        const index = state.products.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        // 🔑 FIXED — same gap as delete: editing a product's colors/images/
        // price in admin updated `products` (admin table) but never
        // `catalog` (storefront). That's why a fix made in Edit Product
        // wouldn't show up on /new, /women, /men etc. until a hard
        // refresh forced fetchCatalog to run again. Now both stay in sync
        // immediately after a successful save.
        const catalogIndex = state.catalog.findIndex((p) => p._id === action.payload._id);
        if (catalogIndex !== -1) {
          state.catalog[catalogIndex] = action.payload;
        }
      })
      .addCase(editProductAsync.rejected, (state, action) => {
        state.editLoading = false;
        state.editError = action.payload;
      });
  },
});

export const { setFilter, setFilters, resetFilters, setPage, setTotalCount } = fetcherSlice.actions;
export default fetcherSlice.reducer;
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../../../config/api";

const BASE_URL = `${API_URL}/reviews`; // ✅ matches ReviewSection.jsx now

const config = {
  withCredentials: true,
};

const buildReviewFormData = ({ productId, rating, title, comment, images }) => {
  const formData = new FormData();
  if (productId) formData.append("productId", productId);
  if (rating !== undefined) formData.append("rating", rating);
  if (title !== undefined) formData.append("title", title);
  if (comment !== undefined) formData.append("comment", comment);
  (images || []).forEach((file) => formData.append("images", file));
  return formData;
};

// ==========================
// Fetch Featured Reviews (homepage "what our customers say")
// GET /reviews/featured — top-rated reviews across ALL products.
// 🔑 Guard: skip refetching if we already have data and no error, same
// pattern as the other "widget" fetches in this app (dashboard stats,
// etc.) — a homepage remount shouldn't re-hit the network every time.
// ==========================
export const fetchFeaturedReviews = createAsyncThunk(
  "reviews/fetchFeaturedReviews",
  async (params = {}, thunkAPI) => {
    try {
      const { limit } = params;
      const res = await axios.get(`${BASE_URL}/featured`, {
        ...config,
        params: limit ? { limit } : undefined,
      });
      return res.data.reviews;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load featured reviews."
      );
    }
  },
  {
    condition: (params = {}, { getState }) => {
      if (params?.force) return true;
      const { featuredReviews, featuredError } = getState().reviews;
      if (featuredReviews.length > 0 && !featuredError) return false;
      return true;
    },
  }
);

export const fetchProductReviews = createAsyncThunk(
  "reviews/fetchProductReviews",
  async ({ productId, page = 1, limit = 10 }, thunkAPI) => {
    try {
      const res = await axios.get(`${BASE_URL}/product/${productId}`, {
        ...config,
        params: { page, limit },
      });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load reviews."
      );
    }
  }
);

export const fetchMyReviews = createAsyncThunk(
  "reviews/fetchMyReviews",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState();
    // guard: don't refetch if we already have data and it's not stale
    if (state.reviews.myReviews.length > 0 && !state.reviews.myReviewsStale) {
      return thunkAPI.fulfillWithValue(state.reviews.myReviews);
    }
    try {
      const res = await axios.get(`${BASE_URL}/mine`, config);
      return res.data.reviews;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load your reviews."
      );
    }
  }
);

export const createReview = createAsyncThunk(
  "reviews/createReview",
  async (reviewData, thunkAPI) => {
    try {
      const formData = buildReviewFormData(reviewData);
      const res = await axios.post(BASE_URL, formData, config);
      return res.data.review;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to submit review."
      );
    }
  }
);

export const updateReview = createAsyncThunk(
  "reviews/updateReview",
  async ({ id, ...updates }, thunkAPI) => {
    try {
      const formData = buildReviewFormData(updates);
      const res = await axios.put(`${BASE_URL}/${id}`, formData, config);
      return res.data.review;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update review."
      );
    }
  }
);

export const deleteReview = createAsyncThunk(
  "reviews/deleteReview",
  async (id, thunkAPI) => {
    try {
      await axios.delete(`${BASE_URL}/${id}`, config);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete review."
      );
    }
  }
);

const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    // ---- featured reviews (homepage widget) ----
    featuredReviews: [],
    featuredLoading: false,
    featuredError: null,

    productReviews: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    loading: false,

    myReviews: [],
    myReviewsLoading: false,
    myReviewsStale: true, // ✅ controls whether fetchMyReviews should hit the network

    submitting: false,
    deleting: false,
    error: null,
  },

  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },
    resetProductReviews: (state) => {
      state.productReviews = [];
      state.totalCount = 0;
      state.totalPages = 1;
      state.currentPage = 1;
    },
    markMyReviewsStale: (state) => {
      state.myReviewsStale = true;
    },
  },

  extraReducers: (builder) => {
    builder
      // ---- fetchFeaturedReviews (homepage) ----
      .addCase(fetchFeaturedReviews.pending, (state) => {
        state.featuredLoading = true;
        state.featuredError = null;
      })
      .addCase(fetchFeaturedReviews.fulfilled, (state, action) => {
        state.featuredLoading = false;
        state.featuredReviews = action.payload;
      })
      .addCase(fetchFeaturedReviews.rejected, (state, action) => {
        state.featuredLoading = false;
        // undefined payload means the mount guard skipped this — not a real error
        if (action.payload) {
          state.featuredError = action.payload;
        }
      })

      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.productReviews = action.payload.reviews;
        state.totalCount = action.payload.totalCount;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchMyReviews.pending, (state) => {
        state.myReviewsLoading = true;
        state.error = null;
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.myReviewsLoading = false;
        state.myReviews = action.payload;
        state.myReviewsStale = false; // ✅ mark fresh, no refetch until invalidated
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.myReviewsLoading = false;
        state.error = action.payload;
      })

      .addCase(createReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.submitting = false;
        state.productReviews.unshift(action.payload);
        state.totalCount += 1;
        state.myReviews.unshift(action.payload); // ✅ keep "my reviews" in sync too
      })
      .addCase(createReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      .addCase(updateReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.submitting = false;
        const updateInList = (list) => {
          const index = list.findIndex((r) => r._id === action.payload._id);
          if (index !== -1) list[index] = action.payload;
        };
        updateInList(state.productReviews);
        updateInList(state.myReviews);
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      .addCase(deleteReview.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.deleting = false;
        state.productReviews = state.productReviews.filter((r) => r._id !== action.payload);
        state.myReviews = state.myReviews.filter((r) => r._id !== action.payload);
        state.totalCount = Math.max(state.totalCount - 1, 0);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  },
});

export const { clearReviewError, resetProductReviews, markMyReviewsStale } = reviewSlice.actions;
export default reviewSlice.reducer;
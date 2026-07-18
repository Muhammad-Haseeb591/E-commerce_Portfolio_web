import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../../../config/api";

const BASE_URL = `${API_URL}/reviews`;

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

export const fetchProductReviews = createAsyncThunk(
  "reviews/fetchProductReviews",
  async ({ productId, page = 1, limit = 10 }, thunkAPI) => {
    const state = thunkAPI.getState();
    const cache = state.reviews.productReviewsCache[productId];

    // ✅ Agar same product + same page pehle se fresh cached hai, network call skip
    if (cache && cache.page === page && !cache.stale) {
      return thunkAPI.fulfillWithValue(cache.data);
    }

    try {
      const res = await axios.get(`${BASE_URL}/product/${productId}`, {
        ...config,
        params: { page, limit },
      });
      return { ...res.data, productId, page };
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
    productReviews: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    loading: false,

    // ✅ productId ke against cache: { data, page, stale }
    productReviewsCache: {},
    currentProductId: null,

    myReviews: [],
    myReviewsLoading: false,
    myReviewsStale: true,

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
    markProductReviewsStale: (state, action) => {
      const productId = action.payload;
      if (state.productReviewsCache[productId]) {
        state.productReviewsCache[productId].stale = true;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchProductReviews.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentProductId = action.meta.arg.productId;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;

        // Cached response ka shape "data" wala hai (already {reviews, totalCount,...})
        const payload = action.payload.productId ? action.payload : action.payload;
        const productId = payload.productId ?? action.meta.arg.productId;
        const page = payload.page ?? action.meta.arg.page ?? 1;

        state.productReviews = payload.reviews;
        state.totalCount = payload.totalCount;
        state.totalPages = payload.totalPages;
        state.currentPage = payload.currentPage;

        // ✅ Cache save — agli baar same tab/product pe dobara fetch nahi hoga
        state.productReviewsCache[productId] = {
          data: payload,
          page,
          stale: false,
        };
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
        state.myReviewsStale = false;
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
        state.myReviews.unshift(action.payload);

        // ✅ Naya review add hua — is product ka cache invalidate karo
        const pid = action.payload.productId ?? action.payload.product;
        if (pid && state.productReviewsCache[pid]) {
          state.productReviewsCache[pid].stale = true;
        }
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

        const pid = action.payload.productId ?? action.payload.product;
        if (pid && state.productReviewsCache[pid]) {
          state.productReviewsCache[pid].stale = true;
        }
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

        // ✅ Delete ke baad related product cache bhi stale mark karo (safe fallback: sab clear)
        Object.keys(state.productReviewsCache).forEach((pid) => {
          state.productReviewsCache[pid].stale = true;
        });
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearReviewError,
  resetProductReviews,
  markMyReviewsStale,
  markProductReviewsStale,
} = reviewSlice.actions;

export default reviewSlice.reducer;
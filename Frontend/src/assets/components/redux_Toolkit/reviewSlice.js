import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = "http://localhost:3000/reviews";

const config = {
  withCredentials: true, // sends the auth cookie on every request
};

// Builds a multipart FormData payload for create/update — needed because
// reviews can include image files alongside plain text fields.
const buildReviewFormData = ({ productId, rating, title, comment, images }) => {
  const formData = new FormData();
  if (productId) formData.append("productId", productId);
  if (rating !== undefined) formData.append("rating", rating);
  if (title !== undefined) formData.append("title", title);
  if (comment !== undefined) formData.append("comment", comment);

  // `images` here is expected to be an array of File objects
  (images || []).forEach((file) => formData.append("images", file));

  return formData;
};

// ==========================
// Fetch Reviews for a single product (public, paginated)
// ==========================
export const fetchProductReviews = createAsyncThunk(
  "reviews/fetchProductReviews",
  async ({ productId, page = 1, limit = 10 }, thunkAPI) => {
    try {
      const res = await axios.get(`${BASE_URL}/product/${productId}`, {
        ...config,
        params: { page, limit },
      });
      return res.data; // { reviews, totalCount, totalPages, currentPage }
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load reviews."
      );
    }
  }
);

// ==========================
// Fetch Logged-in User's Own Reviews
// ==========================
export const fetchMyReviews = createAsyncThunk(
  "reviews/fetchMyReviews",
  async (_, thunkAPI) => {
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

// ==========================
// Create Review
// ==========================
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

// ==========================
// Update Own Review
// ==========================
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

// ==========================
// Delete Own Review
// ==========================
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
    // Reviews for whichever product page is currently open
    productReviews: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    loading: false,

    // The logged-in user's own reviews (e.g. "My Reviews" page)
    myReviews: [],
    myReviewsLoading: false,

    submitting: false, // create/update in-flight
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
  },

  extraReducers: (builder) => {
    builder
      // ---- fetchProductReviews ----
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

      // ---- fetchMyReviews ----
      .addCase(fetchMyReviews.pending, (state) => {
        state.myReviewsLoading = true;
        state.error = null;
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.myReviewsLoading = false;
        state.myReviews = action.payload;
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.myReviewsLoading = false;
        state.error = action.payload;
      })

      // ---- createReview ----
      .addCase(createReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.submitting = false;
        // New review goes to the top of the current product's list
        state.productReviews.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(createReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // ---- updateReview ----
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

      // ---- deleteReview ----
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

export const { clearReviewError, resetProductReviews } = reviewSlice.actions;
export default reviewSlice.reducer;
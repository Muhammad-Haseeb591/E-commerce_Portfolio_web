import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/favourites';

const getConfig = () => ({
  withCredentials: true,
});

export const fetchFavourites = createAsyncThunk(
  "favourite/getAll",
  async (_, thunkAPI) => {
    try {
      const res = await axios.get(`${BASE_URL}/`, getConfig());

      console.log(res.data);               // pura response
      console.log(res.data.favourites);    // favourites

      return res.data.favourites;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Favourites fetch nahi hue."
      );
    }
  }
);

export const toggleFavourite = createAsyncThunk(
  'favourite/toggle',
  async (productId, thunkAPI) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/toggle/${productId}`,
        {},
        getConfig()
      );

      // Refresh the full list (with populated product data) after toggling
      await thunkAPI.dispatch(fetchFavourites());

      return { productId, isFavourite: res.data.isFavourite };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Toggle nahi hua.'
      );
    }
  }
);

export const addToFavourite = createAsyncThunk(
  'favourite/add',
  async (productId, thunkAPI) => {
    try {
      const res = await axios.post(`${BASE_URL}/${productId}`, {}, getConfig());
      await thunkAPI.dispatch(fetchFavourites());
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Favourite add nahi hua.'
      );
    }
  }
);

export const removeFromFavourite = createAsyncThunk(
  'favourite/remove',
  async (productId, thunkAPI) => {
    try {
      const res = await axios.delete(`${BASE_URL}/${productId}`, getConfig());
      return { productId, ...res.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Favourite remove nahi hua.'
      );
    }
  }
);

// ─────────────────────────────────────────
// Slice
// ─────────────────────────────────────────
const favouriteSlice = createSlice({
  name: 'favourite',
  initialState: {
    items: [],
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearFavouriteMessage: (state) => {
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {

    // fetchFavourites
    builder
      .addCase(fetchFavourites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavourites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFavourites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // toggleFavourite — state.items itself is no longer patched here;
    // the fetchFavourites() dispatched inside the thunk above already
    // keeps state.items correct after every toggle, in both directions.
    builder
      .addCase(toggleFavourite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleFavourite.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(toggleFavourite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // addToFavourite
    builder
      .addCase(addToFavourite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToFavourite.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(addToFavourite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // removeFromFavourite
    builder
      .addCase(removeFromFavourite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromFavourite.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.items = state.items.filter(
          (item) => item._id !== action.payload.productId
        );
      })
      .addCase(removeFromFavourite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFavouriteMessage } = favouriteSlice.actions;
export default favouriteSlice.reducer;
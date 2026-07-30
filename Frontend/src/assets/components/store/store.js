import { configureStore } from "@reduxjs/toolkit";
import FetchPrducts from "./fetcherSlice";
import cartReducer from "./cartSlice";
import favouriteReducer from "./favouriteslice";
import authReducer from "./authSlice";
import orderReducer from "./orderSlice";
import reviewReducer from "./reviewSlice"
import reportReducer from "./reportSlice"

export const store = configureStore({
  reducer: {
    FetchPrducts,
    cart: cartReducer,
    favourites: favouriteReducer,
    auth: authReducer,
    orders: orderReducer,
    reviews: reviewReducer,
    report: reportReducer,
  },
});
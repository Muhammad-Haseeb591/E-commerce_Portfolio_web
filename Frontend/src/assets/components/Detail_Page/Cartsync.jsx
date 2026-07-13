import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState, useCallback } from "react";
import { setCart, setHydrated } from "../redux_Toolkit/cartSlice";
import { checkAuth } from "../redux_Toolkit/authSlice";
import { fetchCatalog } from "../redux_Toolkit/fetcherSlice";

const getItemId = (item) => item?._id ?? item?.id;
const CART_STORAGE_KEY = "cart";

const CartSync = () => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const hydrated = useSelector((state) => state.cart.hydrated);

  const allProducts = useSelector((state) => state.FetchPrducts.catalog || []);

  const user = useSelector((state) => state.auth?.user ?? null);
  const authChecked = useSelector((state) => state.auth?.authChecked ?? false);

  const [syncError, setSyncError] = useState("");

  const hasHydrated = useRef(false);
  const skipNextSave = useRef(true);
  const saveTimer = useRef(null);

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const productsRef = useRef(allProducts);
  useEffect(() => {
    productsRef.current = allProducts;
  }, [allProducts]);

  useEffect(() => {
    if (!authChecked) dispatch(checkAuth());
  }, [authChecked, dispatch]);

  const enrichItems = (rawItems, products) => {
    return rawItems.map((raw) => {
      const rawId = raw.productId || getItemId(raw);
      const fullProduct = products.find((p) => getItemId(p) === rawId);

      if (!fullProduct) {
        console.warn(
          `CartSync: product ${rawId} not found in catalog while hydrating cart.`
        );
      }

      return {
        ...fullProduct,
        _id: rawId,
        sizes:
          raw.sizes && raw.sizes.length > 0
            ? raw.sizes
            : [{ size: null, quantity: raw.quantity || raw.qty || 1 }],
      };
    });
  };

  // 🛒 HYDRATE — once, when auth status is known.
  // 🔑 Backend cart storage is NOT in use — cart is always persisted in
  // localStorage regardless of login status, so this always reads from
  // localStorage (no axios/backend call here anymore).
  useEffect(() => {
    if (!authChecked || hasHydrated.current) return;
    hasHydrated.current = true;

    const hydrate = async () => {
      let products = productsRef.current;
      if (!products || products.length === 0) {
        try {
          products = await dispatch(fetchCatalog()).unwrap();
        } catch {
          products = productsRef.current;
        }
      }

      let fetched = [];
      try {
        fetched = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
      } catch (err) {
        console.error("CartSync: corrupted localStorage cart data:", err);
        fetched = [];
      }

      const enrichedFetched = enrichItems(fetched, products || []);

      skipNextSave.current = true;
      dispatch(setCart(enrichedFetched));
      dispatch(setHydrated(true));
    };

    hydrate();
  }, [authChecked, dispatch]);

  // Builds the exact payload we persist, shared by debounced save + flush.
  const buildPersistable = useCallback((rawItems) => {
    return rawItems.map((item) => ({
      productId: getItemId(item),
      sizes: item.sizes || [],
    }));
  }, []);

  // Saves to localStorage only — backend cart storage is not used.
  const performSave = useCallback((persistable) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persistable));
      setSyncError("");
    } catch (err) {
      console.error("Cart sync (localStorage) failed:", err);
      setSyncError("Couldn't save your cart changes on this device.");
    }
  }, []);

  // 💾 AUTO-SYNC — runs on every cart change, app-wide, debounced.
  useEffect(() => {
    if (!hydrated) return;

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      const persistable = buildPersistable(items);
      performSave(persistable);
    }, 500);

    return () => clearTimeout(saveTimer.current);
  }, [items, hydrated, buildPersistable, performSave]);

  // 🚨 FLUSH ON RELOAD/CLOSE
  // Without this, a change made inside the 500ms debounce window gets
  // wiped out by reload: the pending save never fires, so on the next
  // load the hydrate step above pulls the OLD localStorage data and that
  // becomes the new "truth", silently dropping the user's last action.
  // localStorage writes are synchronous, so this always completes even
  // as the page unloads.
  useEffect(() => {
    const flush = () => {
      if (!saveTimer.current) return; // nothing pending
      clearTimeout(saveTimer.current);
      saveTimer.current = null;

      const persistable = buildPersistable(itemsRef.current);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persistable));
    };

    // pagehide covers mobile/back-forward-cache cases beforeunload misses.
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);

    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      flush(); // also flush on route-level unmount, just in case
    };
  }, [buildPersistable]);

  if (!syncError) return null;

  return (
    <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:w-80 z-[9999] bg-red-50 border border-red-300 text-red-700 text-xs sm:text-sm rounded-xl px-3 py-2.5 shadow-lg flex items-start gap-2">
      <span className="flex-1">{syncError}</span>
      <button
        onClick={() => setSyncError("")}
        className="shrink-0 font-bold cursor-pointer"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
};

export default CartSync;
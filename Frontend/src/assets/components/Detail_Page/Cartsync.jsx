import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState, useCallback } from "react";
import { setCart, setHydrated } from "../redux_Toolkit/cartSlice";
import { checkAuth } from "../redux_Toolkit/authSlice";
import { fetchCatalog } from "../redux_Toolkit/fetcherSlice";
import { API_URL } from "../../../config/api";

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

  // 🔑 user ko bhi ref me rakha hai taake flush-on-unload (jo effect ke
  // bahar/cleanup me chalta hai) ke waqt latest login-status pata ho,
  // stale closure na ho.
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!authChecked) dispatch(checkAuth());
  }, [authChecked, dispatch]);

  // 🔑 CHANGED — raw.color / raw.image ab enrich ke baad bhi zinda rehte
  // hain. Pehle sirf `...fullProduct` spread hota tha, is liye jo color
  // user ne select kiya tha wo hydration ke baad hamesha kho jata tha
  // (line dobara "no color" ban jati thi). Ye dono ab explicitly
  // fullProduct ke UPAR override hote hain — kyunki ye ek SNAPSHOT hain
  // (add-to-cart ke waqt ka), fullProduct.colors[] se dobara derive nahi
  // karne (wo array baad mein badal sakta hai).
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
        color: raw.color || null,
        image: raw.image || null,
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
  // 🔑 CHANGED — `color` aur `image` ab persist hote hain. Pehle sirf
  // { productId, sizes } save hota tha, is liye reload ke baad selected
  // color/image ka snapshot ghayab ho jata tha aur do-alag-color lines
  // bhi apni pehchaan kho deti thin.
  const buildPersistable = useCallback((rawItems) => {
    return rawItems.map((item) => ({
      productId: getItemId(item),
      color: item.color || null,
      image: item.image || null,
      sizes: item.sizes || [],
    }));
  }, []);

  // 🔑 NEW — total piece count (sum of all sizes' quantities), used only
  // to tell the backend "roughly how much is in this cart right now" for
  // the abandoned-cart reminder email. Not the full cart contents.
  const countItems = useCallback((rawItems) => {
    return rawItems.reduce(
      (acc, item) =>
        acc + (item.sizes || []).reduce((s, z) => s + (Number(z.quantity) || 0), 0),
      0
    );
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

  // 🔑 NEW — best-effort ping to the backend so it knows "this user's
  // cart changed just now, with N items" — that's the ONLY data behind
  // the abandoned-cart reminder job. Never blocks or errors out the
  // actual cart UX: failures here just mean the reminder email might be
  // late/missed, nothing user-facing breaks.
  const syncActivityToBackend = useCallback(async (itemCount) => {
    if (!userRef.current) return; // reminder only makes sense for logged-in users
    try {
      await fetch(`${API_URL}/api/cart/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemCount }),
      });
    } catch (err) {
      console.error("Cart activity sync (backend) failed:", err);
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
      syncActivityToBackend(countItems(items));
    }, 500);

    return () => clearTimeout(saveTimer.current);
  }, [items, hydrated, buildPersistable, performSave, syncActivityToBackend, countItems]);

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
      // 🔑 Backend ping best-effort hi rehta hai yahan bhi — agar page
      // unload ho raha ho to fetch beacon-jaisa guaranteed nahi hoga,
      // lekin agla cart change hone par (ya agli visit pe) ye normal
      // debounce se sync ho hi jayega, so koi hard dependency nahi is par.
      if (userRef.current) {
        syncActivityToBackend(countItems(itemsRef.current));
      }
    };

    // pagehide covers mobile/back-forward-cache cases beforeunload misses.
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);

    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      flush(); // also flush on route-level unmount, just in case
    };
  }, [buildPersistable, syncActivityToBackend, countItems]);

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
import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import { fetchOrders, cancelOrder } from "../redux_Toolkit/orderSlice";
import { fetchMyReviews, updateReview, deleteReview } from "../redux_Toolkit/reviewSlice";

import { FontImports, ImageLightbox, GLASS } from "./activityShared";
import OrderTracking from "./OrderTracking";
import ReviewHistory from "./ReviewHistory";

/**
 * AccountActivity
 * ----------------
 * "My Activity" — parent component for a signed-in customer of Insignia.
 * Owns all Redux wiring, tab/route state, and the shared image lightbox,
 * then delegates rendering of each tab to its own child:
 *   - OrderTracking  → order history + tracking timeline
 *   - ReviewHistory  → review list + edit/delete
 *
 * Design language: full frosted glass over a white canvas, graphite
 * (#333333) + brushed-brass accent. Mobile-first throughout.
 */

const VALID_TABS = ["orders", "reviews"];

export default function AccountActivity() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tab: tabParam } = useParams();
  const user = useSelector((state) => state.auth?.user);

  const { orders, loading: ordersLoading, error: ordersError, cancelling } = useSelector((state) => state.orders);

  const {
    myReviews: reviews,
    myReviewsLoading: reviewsLoading,
    error: reviewsError,
    submitting: savingReview,
    deleting: deletingReview,
  } = useSelector((state) => state.reviews);

  const initialTab = VALID_TABS.includes(tabParam) ? tabParam : "orders";

  const [tab, setTab] = useState(initialTab);
  const [ordersFetched, setOrdersFetched] = useState(false);
  const [reviewsFetched, setReviewsFetched] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { src, alt } | null

  useEffect(() => {
    if (VALID_TABS.includes(tabParam) && tabParam !== tab) {
      setTab(tabParam);
    } else if (!tabParam) {
      navigate("/account/orders", { replace: true });
    }
  }, [tabParam]);

  useEffect(() => {
    if (!user) return;
    if (tab === "orders" && !ordersFetched) {
      dispatch(fetchOrders());
      setOrdersFetched(true);
    }
    if (tab === "reviews" && !reviewsFetched) {
      dispatch(fetchMyReviews());
      setReviewsFetched(true);
    }
  }, [tab, user, ordersFetched, reviewsFetched, dispatch]);

  const handleTabChange = useCallback(
    (key) => {
      setTab(key);
      navigate(`/account/${key}`, { replace: true });
    },
    [navigate]
  );

  const handleCancelOrder = useCallback(
    (orderId) => {
      if (window.confirm("Cancel this order?")) dispatch(cancelOrder(orderId));
    },
    [dispatch]
  );

  const handleUpdateReview = useCallback(
    async (updates) => {
      const result = await dispatch(updateReview(updates));
      if (updateReview.rejected.match(result)) {
        return { error: result.payload || "Couldn't save changes. Try again." };
      }
      return { error: null };
    },
    [dispatch]
  );

  const handleDeleteReview = useCallback(
    (id) => {
      dispatch(deleteReview(id));
    },
    [dispatch]
  );

  const handleView = useCallback((src, alt) => setLightbox({ src, alt }), []);

  const tabs = useMemo(
    () => [
      { key: "orders", label: "Orders", count: orders?.length },
      { key: "reviews", label: "Reviews", count: reviews?.length },
    ],
    [orders?.length, reviews?.length]
  );
  const activeTabIndex = tabs.findIndex((t) => t.key === tab);

  if (!user) {
    return (
      <section className="ia-body flex min-h-[40vh] items-center justify-center bg-white px-4 text-center text-sm text-gray-500">
        <FontImports />
        Log in to see your order history and reviews.
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-white px-3 py-6 text-gray-900 sm:px-6 sm:py-10">
      <FontImports />

      {/* Several large, softly blurred glows behind the glass — this is
          what makes the frosted panels actually read as glass rather than
          flat translucent gray. Kept monochrome (graphite + a whisper of
          brass) so the effect stays quiet rather than decorative. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-24 h-96 w-96 rounded-full bg-[#33333322] blur-3xl" />
        <div className="absolute -right-28 top-1/4 h-[26rem] w-[26rem] rounded-full bg-[#B8935A2e] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#3333331a] blur-3xl" />
        <div className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-[#B8935A22] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="ia-display flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/40 text-sm text-[#333333] backdrop-blur-sm">
            IA
          </span>
          <div>
            <h2 className="ia-display text-xl font-medium tracking-tight text-gray-900 sm:text-2xl">My Activity</h2>
            <p className="ia-body text-xs text-gray-500">Track orders and manage the reviews you've left</p>
          </div>
        </div>

        {/* Sliding-pill tab switcher */}
        <div className={`${GLASS} relative mt-5 grid grid-cols-2 rounded-full p-1 sm:mt-6 sm:inline-grid sm:w-72`} role="tablist">
          <div
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#333333] shadow-[0_4px_14px_rgba(51,51,51,0.35)] transition-transform duration-200 ease-out"
            style={{ transform: `translateX(${activeTabIndex * 100}%)` }}
            aria-hidden="true"
          />
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => handleTabChange(t.key)}
              className={`ia-body relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
                tab === t.key ? "text-white" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                    tab === t.key ? "bg-white/20 text-white" : "bg-gray-200/80 text-gray-500"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {tab === "orders" && (
          <div className="mt-5 sm:mt-6" role="tabpanel" aria-live="polite">
            <OrderTracking
              orders={orders}
              loading={ordersLoading}
              error={ordersError}
              cancelling={cancelling}
              onCancel={handleCancelOrder}
              onView={handleView}
            />
          </div>
        )}

        {/* Reviews tab */}
        {tab === "reviews" && (
          <div className="mt-5 sm:mt-6" role="tabpanel" aria-live="polite">
            <ReviewHistory
              reviews={reviews}
              loading={reviewsLoading}
              error={reviewsError}
              saving={savingReview}
              deleting={deletingReview}
              onUpdate={handleUpdateReview}
              onDelete={handleDeleteReview}
              onView={handleView}
            />
          </div>
        )}
      </div>

      {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    </section>
  );
}
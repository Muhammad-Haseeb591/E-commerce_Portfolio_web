import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  Star,
  Pencil,
  Trash2,
  MapPin,
  ImagePlus,
  ClipboardList,
  MessageSquareText,
  AlertTriangle,
} from "lucide-react";

import { fetchOrders, cancelOrder } from "../redux_Toolkit/orderSlice";
import { fetchMyReviews, updateReview, deleteReview } from "../redux_Toolkit/reviewSlice";

/**
 * AccountActivity
 * ----------------
 * "My Activity" page: lets a signed-in user review their order history
 * (with live tracking + cancellation) and manage the reviews they've left.
 *
 * Visual language: soft glass panels (translucent white over a warm gray
 * canvas, blurred) rather than hard-edged cards. Built mobile-first —
 * every class is the small-screen layout by default, widened with sm:/md:
 * breakpoints, never the other way around.
 *
 * Data loading strategy: each tab fetches its own data lazily, the first
 * time it's opened, rather than both fetching on mount. That keeps the
 * initial page load light for the common case of a user only checking one
 * of the two tabs, and it means switching tabs after the first visit is
 * instant (no refetch).
 */

const STATUS_STEPS = [
  { key: "placed", label: "Placed", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const STATUS_STYLES = {
  pending: "bg-gray-200/70 text-gray-700",
  placed: "bg-gray-200/70 text-gray-700",
  processing: "bg-sky-100/70 text-sky-700",
  shipped: "bg-indigo-100/70 text-indigo-700",
  out_for_delivery: "bg-amber-100/70 text-amber-700",
  delivered: "bg-emerald-100/70 text-emerald-700",
  cancelled: "bg-red-100/70 text-red-700",
};

// Must match CANCELLABLE_STATUSES in the backend order.controller.js —
// "pending" is included because that's the Order schema's default status,
// and orders sit there immediately after checkout, before any admin has
// touched them.
const CANCELLABLE_STATUSES = ["pending", "placed", "processing"];
const VALID_TABS = ["orders", "reviews"];

// Shared glass surface classes — one source of truth so every panel reads
// as part of the same material. The inset highlight fakes a light catching
// the top edge of the glass; the outer shadow keeps it lifted off the page.
const GLASS =
  "bg-white/45 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(15,23,42,0.08),inset_0_1px_0_0_rgba(255,255,255,0.6)]";

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatMoney = (n) => (typeof n === "number" ? `$${n.toFixed(2)}` : "—");

/* -------------------------------------------------------------------- */
/*  Small presentational helpers                                         */
/* -------------------------------------------------------------------- */

const StatusBadge = memo(({ status }) => (
  <span
    className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${
      STATUS_STYLES[status] || "bg-gray-200/70 text-gray-700"
    }`}
  >
    {status?.replace(/_/g, " ") || "Unknown"}
  </span>
));

const StarRow = ({ value, size = 14 }) => (
  <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        strokeWidth={1.5}
        className={n <= Math.round(value) ? "fill-slate-600 text-slate-600" : "text-gray-300"}
      />
    ))}
  </div>
);

const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={n === value}
        onClick={() => onChange(n)}
        className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
      >
        <Star
          size={22}
          strokeWidth={1.5}
          className={n <= value ? "fill-slate-600 text-slate-600" : "text-gray-300"}
        />
      </button>
    ))}
  </div>
);

/** Generic empty/error state so a tab never leaves the user staring at a
 *  blank panel. */
const StatePanel = ({ icon: Icon, title, description, tone = "neutral" }) => (
  <div
    className={`flex flex-col items-center gap-2 rounded-2xl border border-dashed py-14 text-center backdrop-blur-sm ${
      tone === "error" ? "border-red-200/80 bg-red-50/30" : "border-white/70 bg-white/25"
    }`}
  >
    <Icon size={22} className={tone === "error" ? "text-red-500" : "text-gray-400"} strokeWidth={1.5} />
    <p className={`text-sm font-medium ${tone === "error" ? "text-red-600" : "text-gray-700"}`}>{title}</p>
    {description && <p className="max-w-xs px-6 text-xs text-gray-500">{description}</p>}
  </div>
);

/** Skeleton rows shown while a tab's data is loading, so the layout doesn't
 *  jump once real content arrives. Pure CSS pulse — no JS animation cost. */
const SkeletonRows = ({ count = 3 }) => (
  <div className="space-y-3" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`${GLASS} animate-pulse rounded-2xl p-4`}>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-gray-200/70" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-gray-200/70" />
            <div className="h-2.5 w-1/4 rounded bg-gray-200/70" />
          </div>
          <div className="h-6 w-14 flex-shrink-0 rounded-full bg-gray-200/70" />
        </div>
      </div>
    ))}
  </div>
);

/* ---------------------------- Order tracking ---------------------------- */

const TrackingTimeline = memo(({ order }) => {
  if (order.status === "cancelled") {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50/60 px-3 py-2 text-xs font-medium text-red-600">
        <XCircle size={14} className="flex-shrink-0" strokeWidth={2} />
        Order cancelled
      </div>
    );
  }

  // "pending" is the schema's default status and maps to the same first
  // step as "placed" on the visual timeline.
  const effectiveStatus = order.status === "pending" ? "placed" : order.status;
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === effectiveStatus);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="mt-5">
      <div className="flex items-start">
        {STATUS_STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i <= activeIndex;
          const historyEntry = order.trackingHistory?.find((h) => h.status === step.key);

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <div className={`h-px flex-1 ${i === 0 ? "opacity-0" : done ? "bg-slate-500" : "bg-gray-200"}`} />
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-colors sm:h-8 sm:w-8 ${
                    done
                      ? "border-slate-600 bg-slate-600 text-white"
                      : "border-gray-200 bg-white/70 text-gray-300"
                  }`}
                >
                  <Icon size={13} className="sm:hidden" />
                  <Icon size={15} className="hidden sm:block" />
                </div>
                <div
                  className={`h-px flex-1 ${
                    i === STATUS_STEPS.length - 1 ? "opacity-0" : done ? "bg-slate-500" : "bg-gray-200"
                  }`}
                />
              </div>
              <span className={`mt-2 text-[10px] font-medium sm:text-xs ${done ? "text-gray-800" : "text-gray-400"}`}>
                {step.label}
              </span>
              {historyEntry?.date && (
                <span className="hidden text-[11px] text-gray-400 sm:block">{formatDate(historyEntry.date)}</span>
              )}
            </div>
          );
        })}
      </div>

      {order.shippingAddress && (
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-gray-100/60 px-4 py-3 text-sm text-gray-600">
          <MapPin size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
          <span>
            {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.zip}
          </span>
        </div>
      )}
    </div>
  );
});

const OrderCard = memo(({ order, onCancel, cancelling }) => {
  const [expanded, setExpanded] = useState(false);
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const panelId = `order-panel-${order._id}`;

  return (
    <div className={`${GLASS} overflow-hidden rounded-2xl`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 p-4 text-left focus:outline-none"
      >
        <div className="flex -space-x-3">
          {(order.items || []).slice(0, 3).map((item, i) => (
            <img
              key={item._id || i}
              src={item.image}
              alt={item.name}
              className="h-11 w-11 flex-shrink-0 rounded-xl border-2 border-white object-cover ring-1 ring-gray-100 sm:h-12 sm:w-12"
            />
          ))}
          {(order.items?.length || 0) > 3 && (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white bg-gray-100 text-xs font-medium text-gray-500 ring-1 ring-gray-100 sm:h-12 sm:w-12">
              +{order.items.length - 3}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">Order #{order.orderNumber}</p>
          <p className="text-xs text-gray-500">
            {formatDate(order.createdAt)} · {order.items?.length || 0} item
            {order.items?.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-sm font-semibold text-gray-900">{formatMoney(order.total)}</span>
          <StatusBadge status={order.status} />
        </div>

        <ChevronDown
          size={16}
          className={`ml-1 flex-shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div id={panelId} className="border-t border-white/70 px-4 pb-5 pt-1">
            <TrackingTimeline order={order} />
            {canCancel && (
              <button
                onClick={() => onCancel(order._id)}
                disabled={cancelling}
                className="mt-4 rounded text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {cancelling ? "Cancelling..." : "Cancel order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ------------------------------ My reviews ------------------------------ */

const ReviewEditForm = ({ review, onCancel, onSaved, saving }) => {
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title || "");
  const [comment, setComment] = useState(review.comment || "");
  const [images, setImages] = useState([]);
  const [localError, setLocalError] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    if (!rating || !title.trim()) return;
    setLocalError("");

    const result = await onSaved({ id: review._id, rating, title, comment, images });
    if (result?.error) {
      setLocalError(result.error);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="mt-3 space-y-3 rounded-xl border border-white/60 bg-white/40 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-sm"
    >
      <StarPicker value={rating} onChange={setRating} />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="Title"
        aria-label="Review title"
        className="w-full rounded-lg border border-white/70 bg-white/60 p-2.5 text-sm text-gray-900 outline-none backdrop-blur-sm placeholder:text-gray-400 focus:border-slate-400 focus:bg-white/80"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Your review"
        aria-label="Review comment"
        className="w-full resize-none rounded-lg border border-white/70 bg-white/60 p-2.5 text-sm text-gray-900 outline-none backdrop-blur-sm placeholder:text-gray-400 focus:border-slate-400 focus:bg-white/80"
      />
      <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800">
        <ImagePlus size={15} strokeWidth={1.5} />
        Replace photos ({images.length}/5)
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => setImages(Array.from(e.target.files).slice(0, 5))}
        />
      </label>

      {localError && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertTriangle size={13} /> {localError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!rating || !title.trim() || saving}
          className="rounded-lg bg-gray-900/80 px-4 py-1.5 text-xs font-medium text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-sm transition-opacity hover:bg-gray-900/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded text-xs font-medium text-gray-500 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const ReviewRow = memo(({ review, onUpdate, onDelete, saving, deleting }) => {
  const [editing, setEditing] = useState(false);
  const product = review.productId || {};

  const handleDelete = () => {
    if (window.confirm("Delete this review?")) onDelete(review._id);
  };

  return (
    <div className={`${GLASS} rounded-2xl p-4`}>
      <div className="flex items-start gap-3">
        <img
          src={product.image}
          alt={product.name}
          className="h-11 w-11 flex-shrink-0 rounded-xl object-cover ring-1 ring-gray-200 sm:h-12 sm:w-12"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{product.name || "Product"}</p>
              <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
            </div>

            {!editing && (
              <div className="flex flex-shrink-0 items-center gap-3">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded text-gray-400 hover:text-gray-800"
                  aria-label="Edit review"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded text-gray-400 hover:text-red-600 disabled:opacity-40"
                  aria-label="Delete review"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <div className="mt-2">
              <StarRow value={review.rating} />
              {review.title && <p className="mt-1.5 text-sm font-medium text-gray-900">{review.title}</p>}
              {review.comment && (
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{review.comment}</p>
              )}
              {review.images?.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {review.images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`review-${i}`}
                      className="h-14 w-14 flex-shrink-0 rounded-lg object-cover ring-1 ring-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <ReviewEditForm
              review={review}
              saving={saving}
              onCancel={() => setEditing(false)}
              onSaved={async (updates) => {
                const result = await onUpdate(updates);
                if (!result?.error) setEditing(false);
                return result;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
});

/* --------------------------------- Root --------------------------------- */

export default function AccountActivity() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tab: tabParam } = useParams();
  const user = useSelector((state) => state.auth?.user);

  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    cancelling,
  } = useSelector((state) => state.orders);

  const {
    myReviews: reviews,
    myReviewsLoading: reviewsLoading,
    error: reviewsError,
    submitting: savingReview,
    deleting: deletingReview,
  } = useSelector((state) => state.reviews);

  // Derive initial tab from the URL, falling back to "orders"
  const initialTab = VALID_TABS.includes(tabParam) ? tabParam : "orders";

  const [tab, setTab] = useState(initialTab);
  const [ordersFetched, setOrdersFetched] = useState(false);
  const [reviewsFetched, setReviewsFetched] = useState(false);

  // Keep local tab state in sync if the URL param changes
  // (e.g. user navigates via browser back/forward or a direct link)
  useEffect(() => {
    if (VALID_TABS.includes(tabParam) && tabParam !== tab) {
      setTab(tabParam);
    } else if (!tabParam) {
      // /account with no sub-path — normalize URL to /account/orders
      navigate("/account/orders", { replace: true });
    }
  }, [tabParam]);

  // Fetch lazily, only the first time each tab is opened.
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

  const tabs = useMemo(
    () => [
      { key: "orders", label: "Orders", count: orders?.length },
      { key: "reviews", label: "Reviews", count: reviews?.length },
    ],
    [orders?.length, reviews?.length]
  );

  if (!user) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200/60 px-4 text-center text-sm text-gray-500">
        Log in to see your order history and reviews.
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-200 via-gray-100 to-gray-300/80 px-3 py-5 text-gray-900 sm:px-6 sm:py-8">
      {/* Soft, fixed background shapes — purely decorative. This is what the
          glass panels actually blur; without something behind them, a
          backdrop-blur surface just looks like flat gray. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-slate-300/50 blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-gray-400/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-slate-200/60 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">My Activity</h2>

        {/* Tab switcher — a single glass pill containing two segments,
            full width on mobile so both targets stay thumb-sized. */}
        <div
          className={`${GLASS} mt-4 grid grid-cols-2 gap-1 rounded-full p-1 sm:mt-5 sm:inline-grid sm:w-auto`}
          role="tablist"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all focus:outline-none sm:px-5 ${
                tab === t.key
                  ? "bg-white/70 text-gray-900 shadow-[0_2px_10px_rgba(15,23,42,0.10),inset_0_1px_0_0_rgba(255,255,255,0.8)] backdrop-blur-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                    tab === t.key ? "bg-gray-800/10 text-gray-700" : "bg-gray-200/80 text-gray-500"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders */}
        {tab === "orders" && (
          <div className="mt-4 sm:mt-6" role="tabpanel" aria-live="polite">
            {ordersLoading && <SkeletonRows />}

            {!ordersLoading && ordersError && (
              <StatePanel
                icon={AlertTriangle}
                tone="error"
                title="Couldn't load your orders"
                description="Something went wrong on our end. Please try again in a moment."
              />
            )}

            {!ordersLoading && !ordersError && orders.length === 0 && (
              <StatePanel
                icon={ClipboardList}
                title="No orders yet"
                description="Once you place an order, you'll be able to track it here."
              />
            )}

            {!ordersLoading && !ordersError && orders.length > 0 && (
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onCancel={handleCancelOrder}
                    cancelling={cancelling}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My reviews */}
        {tab === "reviews" && (
          <div className="mt-4 sm:mt-6" role="tabpanel" aria-live="polite">
            {reviewsLoading && <SkeletonRows />}

            {!reviewsLoading && reviewsError && (
              <StatePanel
                icon={AlertTriangle}
                tone="error"
                title="Couldn't load your reviews"
                description="Something went wrong on our end. Please try again in a moment."
              />
            )}

            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
              <StatePanel
                icon={MessageSquareText}
                title="No reviews yet"
                description="Reviews you leave on products you've bought will show up here."
              />
            )}

            {!reviewsLoading && !reviewsError && reviews.length > 0 && (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <ReviewRow
                    key={review._id}
                    review={review}
                    onUpdate={handleUpdateReview}
                    onDelete={handleDeleteReview}
                    saving={savingReview}
                    deleting={deletingReview}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
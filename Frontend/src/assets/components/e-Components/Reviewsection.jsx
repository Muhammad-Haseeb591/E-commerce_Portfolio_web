import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Star, ImagePlus, Pencil, Trash2, BadgeCheck } from "lucide-react";
import { API_URL } from "../../../config/api";

const API_BASE = `${API_URL}/reviews`;

// ✅ Module-level cache — survives component unmount/remount (e.g. tab
// switches on the product page). Keyed by `${productId}:${page}`.
// This means switching away from the Reviews tab and back no longer
// re-fetches or re-shows the loading spinner unless the cache is
// explicitly invalidated (after create/update/delete).
const reviewsCache = new Map();

const cacheKey = (productId, page) => `${productId}:${page}`;

const StarRow = ({ value, size = 16 }) => (
  <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        strokeWidth={1.5}
        className={n <= Math.round(value) ? "fill-[#333333] text-[#333333]" : "text-gray-300"}
      />
    ))}
  </div>
);

const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="p-0.5 transition-transform hover:scale-110"
        aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
      >
        <Star
          size={26}
          strokeWidth={1.5}
          className={n <= value ? "fill-[#333333] text-[#333333]" : "text-gray-300"}
        />
      </button>
    ))}
  </div>
);

const RatingBar = ({ label, count, total }) => {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-3 text-[#333333]/70">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#333333] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-[#333333]/50">{count}</span>
    </div>
  );
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

axios.defaults.withCredentials = true;

export default function ReviewSection({ productId }) {
  const user = useSelector((state) => state.auth?.user);

  // ✅ Hydrate initial state synchronously from cache if we have it —
  // avoids the "Loading reviews..." flash on remount entirely.
  const cached = reviewsCache.get(cacheKey(productId, 1));

  const [reviews, setReviews] = useState(cached?.reviews || []);
  const [total, setTotal] = useState(cached?.total || 0);
  const [page, setPage] = useState(cached?.page || 1);
  const [pages, setPages] = useState(cached?.pages || 1);
  const [average, setAverage] = useState(cached?.average || 0);
  const [ratingBreakdown, setRatingBreakdown] = useState(cached?.ratingBreakdown || {});
  const [status, setStatus] = useState(cached ? "succeeded" : "idle");

  // form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");

  // Track which productId we last hydrated from cache for, so switching
  // to a *different* product (not just remounting the same one) still
  // fetches fresh data.
  const lastProductId = useRef(productId);

  const fetchReviews = useCallback(
    async (pageNum = 1, { force = false } = {}) => {
      if (!productId) return;

      const key = cacheKey(productId, pageNum);
      const hit = reviewsCache.get(key);

      // ✅ Serve from cache, skip the network call entirely
      if (hit && !force) {
        setReviews(hit.reviews);
        setTotal(hit.total);
        setPage(hit.page);
        setPages(hit.pages);
        setAverage(hit.average);
        setRatingBreakdown(hit.ratingBreakdown);
        setStatus("succeeded");
        return;
      }

      setStatus("loading");
      try {
        const { data } = await axios.get(`${API_BASE}/product/${productId}`, {
          params: { page: pageNum },
        });

        const result = {
          reviews: data.reviews || [],
          total: data.total || 0,
          page: data.page || pageNum,
          pages: data.pages || 1,
          average: data.average || 0,
          ratingBreakdown: data.ratingBreakdown || {},
        };

        reviewsCache.set(key, result);

        setReviews(result.reviews);
        setTotal(result.total);
        setPage(result.page);
        setPages(result.pages);
        setAverage(result.average);
        setRatingBreakdown(result.ratingBreakdown);
        setStatus("succeeded");
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        setStatus("failed");
      }
    },
    [productId]
  );

  useEffect(() => {
    const productChanged = lastProductId.current !== productId;
    lastProductId.current = productId;

    const key = cacheKey(productId, 1);
    const hit = reviewsCache.get(key);

    if (hit && !productChanged) {
      // Same product, remounted (e.g. tab switch) — cache already
      // hydrated state above, nothing to do.
      return;
    }

    fetchReviews(1);
  }, [productId, fetchReviews]);

  // Invalidate the whole cache for this product (all pages) — called
  // after any write (create/update/delete) so the next read is fresh.
  const invalidateProductCache = useCallback(() => {
    [...reviewsCache.keys()]
      .filter((k) => k.startsWith(`${productId}:`))
      .forEach((k) => reviewsCache.delete(k));
  }, [productId]);

  const myReview = reviews.find(
    (r) => r.userId?._id === user?._id || r.userId === user?._id
  );

  const openWriteForm = () => {
    setEditingId(null);
    setRating(0);
    setTitle("");
    setComment("");
    setImages([]);
    setSubmitError("");
    setFormOpen(true);
  };

  const openEditForm = (review) => {
    setEditingId(review._id);
    setRating(review.rating);
    setTitle(review.title || "");
    setComment(review.comment || "");
    setImages([]);
    setSubmitError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSubmitError("");
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("productId", productId);
    fd.append("rating", rating);
    fd.append("title", title);
    fd.append("comment", comment);
    images.forEach((file) => fd.append("images", file));
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !title.trim()) return;

    setSubmitStatus("loading");
    setSubmitError("");

    try {
      const formData = buildFormData();

      if (editingId) {
        await axios.put(`${API_BASE}/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`${API_BASE}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSubmitStatus("idle");
      closeForm();
      invalidateProductCache();
      fetchReviews(1, { force: true });
    } catch (err) {
      console.error("Failed to submit review:", err);
      setSubmitStatus("idle");
      setSubmitError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      invalidateProductCache();
      fetchReviews(page, { force: true });
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  const goToPage = (p) => {
    if (p < 1 || p > pages) return;
    fetchReviews(p);
  };

  return (
    <section className="bg-white text-[#333333]">
      <h2 className="text-xl font-semibold tracking-tight">Customer Reviews</h2>

      {/* Summary */}
      <div className="mt-6 flex flex-col gap-8 border-b border-gray-100 pb-8 sm:flex-row">
        <div className="flex flex-shrink-0 flex-col items-center justify-center sm:w-40">
          <span className="text-5xl font-semibold leading-none">{average || "—"}</span>
          <div className="mt-2">
            <StarRow value={average} size={18} />
          </div>
          <span className="mt-1 text-xs text-[#333333]/50">
            {total} {total === 1 ? "review" : "reviews"}
          </span>
        </div>

        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((n) => (
            <RatingBar
              key={n}
              label={n}
              count={ratingBreakdown?.[n] || 0}
              total={total}
            />
          ))}
        </div>
      </div>

      {/* Write / edit review CTA */}
      <div className="mt-6">
        {!formOpen && user && (
          <button
            onClick={myReview ? () => openEditForm(myReview) : openWriteForm}
            className="rounded-md border border-[#333333] px-5 py-2 text-sm font-medium transition-colors hover:bg-[#333333] hover:text-white"
          >
            {myReview ? "Edit your review" : "Write a review"}
          </button>
        )}
        {!user && (
          <p className="text-sm text-[#333333]/60">Log in to leave a review.</p>
        )}
      </div>

      {/* Form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-lg border border-gray-200 p-5"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Your rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label htmlFor="review-title" className="mb-1.5 block text-sm font-medium">
              Title
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Sum up your review in a few words"
              className="w-full rounded-md border border-gray-200 p-3 text-sm outline-none focus:border-[#333333]"
            />
          </div>

          <div>
            <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium">
              Your review
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="What did you like or dislike?"
              className="w-full resize-none rounded-md border border-gray-200 p-3 text-sm outline-none focus:border-[#333333]"
            />
          </div>

          <div>
            <label className="mb-1.5 flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-[#333333]/70 hover:text-[#333333]">
              <ImagePlus size={18} strokeWidth={1.5} />
              Add photos ({images.length}/5)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={(e) =>
                  setImages(Array.from(e.target.files).slice(0, 5))
                }
              />
            </label>
            {images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {images.map((file, i) => (
                  <span key={i} className="rounded bg-gray-100 px-2 py-1 text-xs text-[#333333]/70">
                    {file.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={!rating || !title.trim() || submitStatus === "loading"}
              className="rounded-md bg-[#333333] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitStatus === "loading" ? "Submitting..." : "Submit review"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="text-sm text-[#333333]/60 hover:text-[#333333]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="mt-8 divide-y divide-gray-100">
        {status === "loading" && (
          <p className="py-8 text-center text-sm text-[#333333]/50">Loading reviews...</p>
        )}

        {status === "succeeded" && reviews.length === 0 && (
          <p className="py-8 text-center text-sm text-[#333333]/50">
            No reviews yet — be the first to share your thoughts.
          </p>
        )}

        {reviews.map((review) => {
          const isMine =
            review.userId?._id === user?._id || review.userId === user?._id;
          const authorName = review.userId?.fullName || "Anonymous";
          return (
            <div key={review._id} className="py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#333333] text-sm font-medium text-white">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{authorName}</span>
                      {review.verifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <BadgeCheck size={13} /> Verified purchase
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#333333]/40">
                      {timeAgo(review.createdAt)}
                    </span>
                  </div>
                </div>

                {isMine && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEditForm(review)}
                      className="text-[#333333]/40 hover:text-[#333333]"
                      aria-label="Edit review"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="text-[#333333]/40 hover:text-red-600"
                      aria-label="Delete review"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-2 pl-12">
                <StarRow value={review.rating} />
                {review.title && (
                  <p className="mt-1.5 text-sm font-medium">{review.title}</p>
                )}
                {review.comment && (
                  <p className="mt-1 text-sm leading-relaxed text-[#333333]/80">
                    {review.comment}
                  </p>
                )}
                {review.images?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {review.images.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                        <img
                          src={src}
                          alt={`Review photo ${i + 1}`}
                          className="h-16 w-16 rounded-md object-cover ring-1 ring-gray-200"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`h-8 w-8 rounded-md text-sm transition-colors ${
                p === page
                  ? "bg-[#333333] text-white"
                  : "text-[#333333]/60 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
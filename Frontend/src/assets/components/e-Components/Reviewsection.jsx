import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductReviews,
  fetchMyReviews,
  createReview,
  updateReview,
  deleteReview,
  clearReviewError,
  resetProductReviews,
} from "../redux_Toolkit/reviewSlice"; // 🔧 adjust path to match your project

const StarRow = ({ value, onChange, size = "text-xl" }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex gap-1">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange && onChange(s)}
          className={`${size} leading-none ${onChange ? "cursor-pointer" : "cursor-default"}`}
          style={{ color: s <= value ? "#333333" : "#D9D9D9" }}
          aria-label={`${s} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const emptyForm = { rating: 5, title: "", comment: "", images: [] };

export default function ReviewSection({ productId, currentUserId }) {
  // No productId → "my reviews" mode: list everything the signed-in user
  // has written, across products, with edit/delete only (no product to
  // attach a new review to, so the write-review form stays hidden).
  const isMyReviewsMode = !productId;

  const dispatch = useDispatch();
  const {
    productReviews,
    totalCount,
    totalPages,
    currentPage,
    loading,
    myReviews,
    myReviewsLoading,
    submitting,
    deleting,
    error,
  } = useSelector((state) => state.reviews);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isMyReviewsMode) {
      dispatch(fetchMyReviews());
      return;
    }
    dispatch(fetchProductReviews({ productId, page: 1 }));
    dispatch(fetchMyReviews());
    return () => {
      dispatch(resetProductReviews());
    };
  }, [dispatch, productId, isMyReviewsMode]);

  const displayedReviews = isMyReviewsMode ? myReviews : productReviews;
  const isLoading = isMyReviewsMode ? myReviewsLoading : loading;
  const listCount = isMyReviewsMode ? myReviews.length : totalCount;

  const myReviewForProduct = myReviews.find(
    (r) => r.productId === productId || r.product === productId
  );

  const handlePageChange = (page) => {
    dispatch(fetchProductReviews({ productId, page }));
  };

  const openNewForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (review) => {
    setEditingId(review._id);
    setForm({
      rating: review.rating,
      title: review.title || "",
      comment: review.comment || "",
      images: [],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    setForm((f) => ({ ...f, images: Array.from(e.target.files || []) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearReviewError());

    if (editingId) {
      const result = await dispatch(updateReview({ id: editingId, ...form }));
      if (updateReview.fulfilled.match(result)) closeForm();
    } else {
      const result = await dispatch(createReview({ productId, ...form }));
      if (createReview.fulfilled.match(result)) closeForm();
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this review?")) {
      dispatch(deleteReview(id));
    }
  };

  return (
    <section className="w-full bg-white text-[#333333]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">{isMyReviewsMode ? "Your Reviews" : "Reviews"}</h2>
          <p className="text-sm text-[#777777]">{listCount} review{listCount === 1 ? "" : "s"}</p>
        </div>
        {!isMyReviewsMode && !myReviewForProduct && (
          <button
            onClick={openNewForm}
            className="rounded-full bg-[#333333] px-4 py-2 text-sm font-medium text-white active:opacity-80"
          >
            Write a review
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 rounded-md border border-[#333333] bg-[#f5f5f5] px-3 py-2 text-sm sm:mx-6">
          {error}
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mx-4 mt-4 space-y-4 rounded-lg border border-[#e5e5e5] p-4 sm:mx-6"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Your rating</label>
            <StarRow
              value={form.rating}
              onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
              size="text-2xl"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="review-title">
              Title
            </label>
            <input
              id="review-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Sum it up in a few words"
              className="w-full rounded-md border border-[#cccccc] px-3 py-2 text-sm focus:border-[#333333] focus:outline-none"
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="review-comment">
              Comment
            </label>
            <textarea
              id="review-comment"
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="What did you like or dislike?"
              rows={4}
              className="w-full resize-none rounded-md border border-[#cccccc] px-3 py-2 text-sm focus:border-[#333333] focus:outline-none"
              maxLength={1000}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="review-images">
              Photos (optional)
            </label>
            <input
              id="review-images"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#333333] file:px-3 file:py-1.5 file:text-white"
            />
            {form.images.length > 0 && (
              <p className="mt-1 text-xs text-[#777777]">{form.images.length} file(s) selected</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-full bg-[#333333] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingId ? "Update review" : "Submit review"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full border border-[#333333] px-4 py-2 text-sm font-medium text-[#333333]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="divide-y divide-[#e5e5e5] px-4 sm:px-6">
        {isLoading && displayedReviews.length === 0 && (
          <p className="py-6 text-sm text-[#777777]">Loading reviews...</p>
        )}

        {!isLoading && displayedReviews.length === 0 && (
          <p className="py-6 text-sm text-[#777777]">
            {isMyReviewsMode ? "You haven't written any reviews yet." : "No reviews yet. Be the first to write one."}
          </p>
        )}

        {displayedReviews.map((review) => {
          const isMine =
            isMyReviewsMode ||
            (currentUserId && (review.user === currentUserId || review.user?._id === currentUserId));
          return (
            <div key={review._id} className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {isMyReviewsMode && review.product?.name && (
                    <p className="mb-1 text-xs font-medium text-[#999999]">{review.product.name}</p>
                  )}
                  <StarRow value={review.rating} />
                  {review.title && <h3 className="mt-1 text-sm font-semibold">{review.title}</h3>}
                </div>
                <span className="shrink-0 text-xs text-[#999999]">
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                </span>
              </div>

              {review.comment && (
                <p className="mt-2 text-sm leading-relaxed text-[#4d4d4d]">{review.comment}</p>
              )}

              {Array.isArray(review.images) && review.images.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {review.images.map((img, i) => (
                    <img
                      key={i}
                      src={typeof img === "string" ? img : img.url}
                      alt={`review-${i}`}
                      className="h-16 w-16 shrink-0 rounded-md object-cover"
                    />
                  ))}
                </div>
              )}

              {isMine && (
                <div className="mt-3 flex gap-4 text-xs font-medium">
                  <button onClick={() => openEditForm(review)} className="text-[#333333] underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(review._id)}
                    disabled={deleting}
                    className="text-[#333333] underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {!isMyReviewsMode && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-6 sm:px-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`h-8 w-8 rounded-full text-sm font-medium ${
                page === currentPage
                  ? "bg-[#333333] text-white"
                  : "border border-[#cccccc] text-[#333333]"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
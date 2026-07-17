import { useState, memo } from "react";
import { Pencil, Trash2, ImagePlus, MessageSquareText, AlertTriangle } from "lucide-react";

import {
  GLASS,
  formatDate,
  getProductThumb,
  StarRow,
  StarPicker,
  StatePanel,
  SkeletonRows,
  ViewableThumb,
} from "./Activityshared";

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
    if (result?.error) setLocalError(result.error);
  };

  return (
    <form
      onSubmit={handleSave}
      className="ia-body mt-3 space-y-3 rounded-2xl border border-white/60 bg-white/35 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-xl"
    >
      <StarPicker value={rating} onChange={setRating} />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="Title"
        aria-label="Review title"
        className="w-full rounded-xl border border-white/70 bg-white/60 p-2.5 text-sm text-gray-900 outline-none backdrop-blur-sm placeholder:text-gray-400 focus:border-[#333333]"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Your review"
        aria-label="Review comment"
        className="w-full resize-none rounded-xl border border-white/70 bg-white/60 p-2.5 text-sm text-gray-900 outline-none backdrop-blur-sm placeholder:text-gray-400 focus:border-[#333333]"
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
          className="rounded-xl bg-[#333333] px-4 py-1.5 text-xs font-medium text-white shadow-[0_4px_14px_rgba(51,51,51,0.35)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="rounded text-xs font-medium text-gray-500 hover:text-gray-800">
          Cancel
        </button>
      </div>
    </form>
  );
};

const ReviewRow = memo(({ review, onUpdate, onDelete, saving, deleting, onView }) => {
  const [editing, setEditing] = useState(false);
  const product = review.productId || {};

  const handleDelete = () => {
    if (window.confirm("Delete this review?")) onDelete(review._id);
  };

  return (
    <div className={`${GLASS} rounded-[22px] p-4`}>
      <div className="flex items-start gap-3">
        <ViewableThumb
          src={getProductThumb(product)}
          alt={product.name || "Product"}
          onView={onView}
          className="-mt-1 h-11 w-11 flex-shrink-0 rounded-2xl ring-1 ring-black/5 sm:h-12 sm:w-12"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="ia-display truncate text-[15px] font-medium tracking-tight text-gray-900">
                {product.name || "Product"}
              </p>
              <span className="ia-body text-xs text-gray-400">{formatDate(review.createdAt)}</span>
            </div>

            {!editing && (
              <div className="flex flex-shrink-0 items-center gap-3">
                <button onClick={() => setEditing(true)} className="rounded text-gray-400 hover:text-[#333333]" aria-label="Edit review">
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
            <div className="ia-body mt-2">
              <StarRow value={review.rating} />
              {review.title && <p className="mt-1.5 text-sm font-medium text-gray-900">{review.title}</p>}
              {review.comment && <p className="mt-1 text-sm leading-relaxed text-gray-600">{review.comment}</p>}
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

export default function ReviewHistory({ reviews, loading, error, saving, deleting, onUpdate, onDelete, onView }) {
  if (loading) return <SkeletonRows />;

  if (error) {
    return (
      <StatePanel
        icon={AlertTriangle}
        tone="error"
        title="Couldn't load your reviews"
        description="Something went wrong on our end. Please try again in a moment."
      />
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <StatePanel
        icon={MessageSquareText}
        title="No reviews yet"
        description="Reviews you leave on products you've bought will show up here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewRow
          key={review._id}
          review={review}
          onUpdate={onUpdate}
          onDelete={onDelete}
          saving={saving}
          deleting={deleting}
          onView={onView}
        />
      ))}
    </div>
  );
}
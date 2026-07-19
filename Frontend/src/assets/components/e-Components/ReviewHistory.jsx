import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReviewHistory from "./ReviewHistory";
import { fetchMyReviews, updateReview, deleteReview } from "../redux_Toolkit/reviewSlice";

export default function ReviewHistoryContainer() {
  const dispatch = useDispatch();
  const { myReviews, myReviewsLoading, myReviewsStale, submitting, deleting, error } =
    useSelector((state) => state.reviews);

  useEffect(() => {
    if (myReviewsStale) {
      dispatch(fetchMyReviews()); // ✅ sirf stale hone par fetch — tab switch pe nahi
    }
  }, [myReviewsStale, dispatch]);

  const handleUpdate = useCallback(
    async (updates) => {
      const result = await dispatch(updateReview(updates));
      if (updateReview.rejected.match(result)) {
        return { error: result.payload };
      }
      return { error: null };
    },
    [dispatch]
  );

  const handleDelete = useCallback((id) => dispatch(deleteReview(id)), [dispatch]);

  return (
    <ReviewHistory
      reviews={myReviews}
      loading={myReviewsLoading}
      error={error}
      saving={submitting}
      deleting={deleting}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
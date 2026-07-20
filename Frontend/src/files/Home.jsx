import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeaturedReviews } from "../assets/components/redux_Toolkit/reviewSlice"; // ← confirm this is the actual path/filename of your review slice

const categories = [
  { name: "New", slug: "new", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600" },
  { name: "Women", slug: "women", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600" },
  { name: "Men", slug: "men", image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600" },
  { name: "Kids", slug: "kids", image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600" },
  { name: "Fragrances", slug: "fragrances", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600" },
  { name: "Accessories", slug: "accessories", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600" },
  { name: "Sales", slug: "sales", image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600" },
];

// images for the full-screen banner slideshow
const bannerImages = [
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200",
  "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1200",
  "https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200",
];

function RevealCard({ cat, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      to={`/${cat.slug}`}
      className={`
        group shrink-0 block border border-[#333333] bg-white
        w-[100px] xs:w-[120px] sm:w-40 md:w-48 lg:w-56 xl:w-64 2xl:w-72
        transition-all duration-700 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
      style={{ transitionDelay: visible ? `${(index % 5) * 80}ms` : "0ms" }}
    >
      <div className="w-full aspect-square overflow-hidden border-b border-[#333333]">
        <img
          src={cat.image}
          alt={cat.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-hover:opacity-80"
        />
      </div>
      <div className="px-2 py-2 sm:px-3 sm:py-3">
        <span className="text-xs sm:text-sm md:text-base font-medium">
          {cat.name}
        </span>
      </div>
    </Link>
  );
}

// Real review shape from GET /reviews/featured:
//   { _id, rating, title, comment, userId: { fullName, avatar }, productId: { name, images }, createdAt }
// Falls back gracefully if userId/avatar didn't populate for any reason.
function ReviewCard({ review, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const reviewerName = review.userId?.fullName || "Verified Buyer";
  const reviewerAvatar =
    review.userId?.avatar ||
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200";
  const reviewText = review.comment?.trim() || review.title?.trim() || "";

  return (
    <div
      ref={ref}
      className={`
        border border-[#333333] bg-white p-4 sm:p-5 flex flex-col gap-3
        transition-all duration-700 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
      style={{ transitionDelay: visible ? `${index * 100}ms` : "0ms" }}
    >
      <div className="flex items-center gap-3">
        <img
          src={reviewerAvatar}
          alt={reviewerName}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-[#333333]"
        />
        <div>
          <p className="text-sm sm:text-base font-medium">{reviewerName}</p>
          <div className="text-xs sm:text-sm">
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)}
          </div>
        </div>
      </div>
      <p className="text-xs sm:text-sm md:text-base leading-relaxed">
        {reviewText}
      </p>
      {review.productId?.name && (
        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">
          {review.productId.name}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const dispatch = useDispatch();
  const { featuredReviews, featuredLoading } = useSelector((state) => state.reviews);

  useEffect(() => {
    dispatch(fetchFeaturedReviews());
  }, [dispatch]);

  // duplicate categories so the auto-scroll marquee loops seamlessly
  const marqueeCategories = [...categories, ...categories];

  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full min-h-screen bg-white text-[#333333]">
      {/* keyframes + scrollbar styling, scoped to this component */}
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 30s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header */}
      <header className="w-full border-b border-[#333333] px-4 py-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-wide">
          STORE
        </h1>
      </header>

      {/* Full height banner slideshow, changes every 1 minute */}
      <section className="w-full h-[80vh] overflow-hidden border-b border-[#333333] relative">
        <div
          className="flex h-full transition-transform duration-1000 ease-in-out"
          style={{
            width: `${bannerImages.length * 100}vw`,
            transform: `translateX(-${slideIndex * 100}vw)`,
          }}
        >
          {bannerImages.map((src, i) => (
            <div key={i} className="h-full w-[100vw] shrink-0">
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2">
          {bannerImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-[#333333] transition-colors duration-300 ${
                slideIndex === i ? "bg-[#333333]" : "bg-white"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Auto-scrolling category links */}
      <main className="px-4 py-6 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        <div className="overflow-hidden">
          <div className="marquee-track flex gap-4 w-max">
            {marqueeCategories.map((cat, index) => (
              <RevealCard key={`${cat.slug}-${index}`} cat={cat} index={index} />
            ))}
          </div>
        </div>
      </main>

      {/* Reviews — real data from GET /reviews/featured via fetchFeaturedReviews */}
      {(featuredLoading || featuredReviews.length > 0) && (
        <section className="px-4 py-8 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 border-t border-[#333333]">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-5">
            What our customers say
          </h2>

          {featuredLoading ? (
            <p className="text-sm text-gray-400">Loading reviews...</p>
          ) : (
            <div
              className="
                grid gap-4
                grid-cols-1
                xs:grid-cols-2
                sm:grid-cols-2
                md:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
                2xl:grid-cols-4
              "
            >
              {featuredReviews.map((review, index) => (
                <ReviewCard key={review._id} review={review} index={index} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
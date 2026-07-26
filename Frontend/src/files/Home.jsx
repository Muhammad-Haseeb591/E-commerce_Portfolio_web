import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SEO from "../assets/components/SEO/SEO"

const categories = [
  {
    name: "New",
    slug: "new",
    image:
      "https://plus.unsplash.com/premium_photo-1664202526744-516d0dd22932?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "Women",
    slug: "women",
    image:
      "https://images.unsplash.com/photo-1585129351701-304867c8f2e8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  { name: "Men", slug: "men", image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600" },
  {
    name: "Kids",
    slug: "kids",
    image:
      "https://images.unsplash.com/photo-1742390671765-c87aaed67ad8?q=80&w=1025&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "Fragrances",
    slug: "fragrances",
    image:
      "https://images.unsplash.com/photo-1672848700906-2b8ca62639e4?q=80&w=1203&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  { name: "Accessories", slug: "accessories", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600" },
  { name: "Sales", slug: "sales", image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600" },
];

const bannerSlides = [
  {
    image:
      "https://plus.unsplash.com/premium_photo-1664202526744-516d0dd22932?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    slug: "new",
  },
  {
    image:
      "https://images.unsplash.com/photo-1585129351701-304867c8f2e8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    slug: "women",
  },
  {
    image:
      "https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    slug: "men",
  },
  {
    image:
      "https://images.unsplash.com/photo-1672848700906-2b8ca62639e4?q=80&w=1203&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    slug: "fragrances",
  },
];

const featuredReviews = [
  {
    _id: "1",
    rating: 5,
    comment: "Amazing quality and fast shipping. The fabric feels premium and fits perfectly.",
    userId: { fullName: "Sarah Johnson", avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200" },
    productId: { name: "Cotton Overshirt" },
  },
  {
    _id: "2",
    rating: 4,
    comment: "Really happy with my purchase. Colors are exactly as shown on the site.",
    userId: { fullName: "Michael Lee", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200" },
    productId: { name: "Classic Sneakers" },
  },
  {
    _id: "3",
    rating: 5,
    comment: "My go-to store now. Great selection and the customer service is excellent.",
    userId: { fullName: "Emma Wilson", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
    productId: { name: "Leather Tote" },
  },
  {
    _id: "4",
    rating: 5,
    comment: "The fragrance lasts all day and the packaging is beautiful. Highly recommend.",
    userId: { fullName: "David Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
    productId: { name: "Signature Eau de Parfum" },
  },
];

// 🔑 `selected` = category jo user ne click/select kiya hai — permanently
// highlighted (dark) rehta hai, hover ki tarah sirf mouse ke waqt nahi.
function RevealCard({ cat, index, open, selected }) {
  return (
    <>
        <Link
      to={`/${cat.slug}`}
      aria-current={selected ? "true" : undefined}
      className={`
        group block w-full border border-[#333333] bg-white
        transition-all duration-500 ease-out
        ${open ? "opacity-100 translate-y-0 translate-x-0" : "opacity-0 translate-y-6 -translate-x-4"}
        ${selected ? "bg-[#333333] border-[#333333]" : "hover:bg-[#333333] hover:border-[#333333]"}
      `}
      style={{ transitionDelay: open ? `${index * 90}ms` : "0ms" }}
    >
      <div className="w-full aspect-square overflow-hidden border-b border-[#333333]">
        <img
          src={cat.image || "/placeholder.svg"}
          alt={cat.name}
          className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 group-hover:opacity-80 group-hover:brightness-75"
        />
      </div>
      <div
        className={`px-2 py-2 sm:px-3 sm:py-3 transition-colors duration-500 ease-out ${
          selected ? "text-white" : "group-hover:text-white"
        }`}
      >
        <span className="text-xs sm:text-sm md:text-base font-medium">{cat.name}</span>
      </div>
    </Link>
    </>
  );
}

function ReviewCard({ review }) {
  const reviewerName = review.userId?.fullName || "Verified Buyer";
  const reviewerAvatar = review.userId?.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200";
  const reviewText = review.comment?.trim() || review.title?.trim() || "";

  return (
    <div
      className="
        group h-full border border-[#333333] bg-white p-4 sm:p-5 flex flex-col gap-3
        transition-colors duration-300 ease-out hover:bg-[#333333] hover:border-[#333333]
      "
    >
      <div className="flex items-center gap-3 transition-colors duration-300 group-hover:text-white">
        <img
          src={reviewerAvatar || "/placeholder.svg"}
          alt={reviewerName}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-[#333333] transition-colors duration-300 group-hover:border-white"
        />
        <div>
          <p className="text-sm sm:text-base font-medium transition-colors duration-300 group-hover:text-white">
            {reviewerName}
          </p>
          <div className="text-xs sm:text-sm transition-colors duration-300 group-hover:text-white">
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)}
          </div>
        </div>
      </div>
      <p className="text-xs sm:text-sm md:text-base leading-relaxed transition-colors duration-300 group-hover:text-white">
        {reviewText}
      </p>
      {review.productId?.name && (
        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide transition-colors duration-300 group-hover:text-gray-300">
          {review.productId.name}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const marqueeReviews = [...featuredReviews, ...featuredReviews];

  // 🔑 Category section ab click-toggle se open/close (wrap) nahi hoti —
  // hamesha "on" (open/visible) rehti hai, kabhi collapse nahi hoti.
  const categoriesRevealed = true;

  // 🔑 Selection ab click-state se track nahi hoti (wo navigation ke saath
  // race karti thi — Link turant page badal deta tha, isliye highlight kabhi
  // dikhta hi nahi tha). Ab current URL se hi decide hota hai ke kaunsi
  // category "selected" hai — jab /men par ho to "Men" hamesha highlighted
  // rahega, chahe wahan kaise bhi pahunche ho (click, back button, reload).
  const location = useLocation();
  const selectedSlug = location.pathname.replace(/^\/+/, "");

  const [slideIndex, setSlideIndex] = useState(0);
  const bannerRef = useRef(null);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isDragging.current) return;
      const node = bannerRef.current;
      if (!node) return;
      const nextIndex = (slideIndex + 1) % bannerSlides.length;
      node.scrollTo({ left: nextIndex * node.clientWidth, behavior: "smooth" });
      setSlideIndex(nextIndex);
    }, 5000);
    return () => clearInterval(timer);
  }, [slideIndex]);

  const handleBannerScroll = () => {
    const node = bannerRef.current;
    if (!node) return;
    const index = Math.round(node.scrollLeft / node.clientWidth);
    if (index !== slideIndex) setSlideIndex(index);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const node = bannerRef.current;
    if (!node) return;
    const walk = e.pageX - dragStartX.current;
    if (Math.abs(walk) > 5) didDrag.current = true;
    node.scrollLeft = dragStartScroll.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = (e) => {
    const node = bannerRef.current;
    if (!node) return;
    isDragging.current = true;
    didDrag.current = false;
    dragStartX.current = e.pageX;
    dragStartScroll.current = node.scrollLeft;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const goToSlide = (i) => {
    const node = bannerRef.current;
    if (!node) return;
    node.scrollTo({ left: i * node.clientWidth, behavior: "smooth" });
    setSlideIndex(i);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full min-h-screen bg-white text-[#333333]">
      <SEO>
      title="Shop Men, Women, Kids, Fragrances & Accessories"
  description="Discover the latest collections for Men, Women, Kids, Fragrances, and Accessories. Shop new arrivals and exclusive sales at STORE."
  keywords="fashion, clothing, men, women, kids, fragrances, accessories, sales, new arrivals"
  path="/"
      </SEO>

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
        .banner-scroll::-webkit-scrollbar { display: none; }
        .fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <header className="w-full border-b border-[#333333] px-4 py-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-wide">STORE</h1>
      </header>

      {/* Banner */}
      <section className="w-full h-[50vh] md:h-[80vh] overflow-hidden border-b border-[#333333] relative">
        <div
          ref={bannerRef}
          onScroll={handleBannerScroll}
          onMouseDown={handleMouseDown}
          className="banner-scroll flex h-full w-full overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none"
          style={{ scrollbarWidth: "none" }}
        >
          {bannerSlides.map((slide, i) => (
            <Link
              key={i}
              to={`/${slide.slug}`}
              draggable={false}
              onClickCapture={(e) => {
                if (didDrag.current) e.preventDefault();
              }}
              className="h-full w-full shrink-0 snap-center block relative group"
            >
              <img
                src={slide.image || "/placeholder.svg"}
                alt={slide.slug}
                draggable={false}
                className="w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            </Link>
          ))}
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2">
          {bannerSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-[#333333] transition-all duration-300 ${
                slideIndex === i ? "bg-[#333333] scale-110" : "bg-white hover:bg-[#333333] hover:scale-110"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Categories — always visible, and selectable (click keeps a category highlighted) */}
      <main className="px-4 py-6 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        <div
          className="
            grid gap-4
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
            xl:grid-cols-6
            2xl:grid-cols-7
          "
        >
          {categories.map((cat, index) => (
            <RevealCard
              key={cat.slug}
              cat={cat}
              index={index}
              open={categoriesRevealed}
              selected={selectedSlug === cat.slug}
            />
          ))}
        </div>
      </main>

      {/* Reviews Marquee (scrolling) */}
      {featuredReviews.length > 0 && (
        <section className="py-8 border-t border-[#333333] bg-white">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-5 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 fade-in">
            What our customers say
          </h2>

          <div className="overflow-hidden">
            <div className="marquee-track flex gap-4 w-max">
              {marqueeReviews.map((review, index) => (
                <div
                  key={`${review._id}-${index}`}
                  className="shrink-0 w-[280px] sm:w-[320px] md:w-[360px]"
                >
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
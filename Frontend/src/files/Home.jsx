import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SEO from "../assets/components/SEO/SEO";

/* ------------------------------------------------------------------ data */

const categories = [
  {
    name: "New",
    slug: "new",
    image:
      "https://plus.unsplash.com/premium_photo-1664202526744-516d0dd22932?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    stock: 512,
  },
  {
    name: "Women",
    slug: "women",
    image:
      "https://images.unsplash.com/photo-1585129351701-304867c8f2e8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    stock: 2140,
  },
  { name: "Men", slug: "men", image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600", stock: 1284 },
  {
    name: "Kids",
    slug: "kids",
    image:
      "https://images.unsplash.com/photo-1742390671765-c87aaed67ad8?q=80&w=1025&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    stock: 763,
  },
  {
    name: "Fragrances",
    slug: "fragrances",
    image:
      "https://images.unsplash.com/photo-1672848700906-2b8ca62639e4?q=80&w=1203&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    stock: 340,
  },
  { name: "Accessories", slug: "accessories", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600", stock: 458 },
  { name: "Sales", slug: "sales", image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600", stock: 189 },
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

const promiseStrip = [
  { value: "01", label: "Free shipping over $75" },
  { value: "02", label: "30-day easy returns" },
  { value: "03", label: "Made with certified fabrics" },
];

const trustStats = [
  { id: "customers", to: 128450, suffix: "+", label: "Happy customers served" },
  { id: "satisfaction", to: 98, suffix: "%", label: "Customer satisfaction rate" },
  { id: "stock", to: 4645, suffix: "", label: "Items currently in stock" },
  { id: "countries", to: 42, suffix: "", label: "Countries we ship to" },
];

const liveStock = [
  { id: "l1", name: "Merino Crew Knit", left: 7, sold: 1432, price: "$118" },
  { id: "l2", name: "Relaxed Oxford Shirt", left: 23, sold: 986, price: "$84" },
  { id: "l3", name: "Structured Tote", left: 4, sold: 2211, price: "$196" },
  { id: "l4", name: "Cotton Tee 3-Pack", left: 51, sold: 5307, price: "$62" },
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

const WHATSAPP_NUMBER = "15551234567";
const WHATSAPP_MESSAGE = "Hi STORE! I have a question about an order.";

/* ----------------------------------------------------------------- utils */

const cx = (...parts) => parts.filter(Boolean).join(" ");

// Shared "lifted card" shadow language used everywhere for the 3D feel —
// two stacked shadows (soft ambient + tight contact) that grow on hover/press.
const CARD_3D =
  "shadow-[0_1px_2px_rgba(0,0,0,0.06),0_10px_18px_-10px_rgba(0,0,0,0.28)] " +
  "transition-[transform,box-shadow] duration-500 ease-out will-change-transform " +
  "hover:shadow-[0_1px_2px_rgba(0,0,0,0.08),0_22px_34px_-14px_rgba(0,0,0,0.4)] " +
  "hover:-translate-y-1.5 active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_8px_-2px_rgba(0,0,0,0.3)] active:duration-100";

/* ----------------------------------------------------------------- hooks */

function useReveal({ threshold = 0.15, once = true } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once]);

  return { ref, visible };
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setY(window.scrollY));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return y;
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return progress;
}

function useCountUp(to, active, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, active, duration]);
  return value;
}

/* ------------------------------------------------------------ primitives */

function Reveal({ children, delay = 0, direction = "up", className }) {
  const { ref, visible } = useReveal();
  const hidden = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "-translate-x-10",
    right: "translate-x-10",
    none: "",
  }[direction];

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cx(
        "transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none",
        visible ? "translate-x-0 translate-y-0 opacity-100 scale-100" : cx("opacity-0 scale-95", hidden),
        className,
      )}
    >
      {children}
    </div>
  );
}

// Dog-ear / folded-corner decoration. Sits absolutely in a `relative` + `group`
// parent. The triangle "lifts" and its shadow deepens on hover for a paper-fold feel.
function CornerFold({ size = "h-6 w-6 sm:h-7 sm:w-7", dark = false }) {
  return (
    <div
      aria-hidden
      className={cx("pointer-events-none absolute right-0 top-0 z-10 overflow-visible", size)}
    >
      <div
        className={cx(
          "absolute inset-0 origin-top-right transition-all duration-500 ease-out",
          "group-hover:-rotate-6 group-hover:scale-125 group-hover:-translate-x-0.5 group-hover:translate-y-0.5",
          "[filter:drop-shadow(-3px_3px_4px_rgba(0,0,0,0.25))] group-hover:[filter:drop-shadow(-6px_6px_9px_rgba(0,0,0,0.35))]",
          dark
            ? "bg-gradient-to-br from-[#4a4a4a] via-[#333333] to-[#1c1c1c]"
            : "bg-gradient-to-br from-white via-gray-100 to-gray-300",
        )}
        style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
      />
    </div>
  );
}

/* ---------------------------------------------------------- trust stats */

function StatCard({ stat, active }) {
  const value = useCountUp(stat.to, active);
  return (
    <div
      className={cx(
        "group relative overflow-hidden rounded-sm border border-[#333333]/80 bg-white p-4 text-center sm:p-6",
        "[transform-style:preserve-3d] [perspective:800px]",
        CARD_3D,
      )}
    >
      <CornerFold size="h-5 w-5 sm:h-6 sm:w-6" />
      <p className="text-xl font-semibold sm:text-2xl md:text-3xl">
        {value.toLocaleString()}
        {stat.suffix}
      </p>
      <p className="mt-2 text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">{stat.label}</p>
    </div>
  );
}

function TrustStats({ stats }) {
  const { ref, visible } = useReveal({ threshold: 0.25 });
  return (
    <section
      ref={ref}
      className="w-full border-y border-[#333333] bg-gray-50 px-4 py-10 sm:px-6 sm:py-16 md:px-8 lg:px-10 xl:px-12 2xl:px-16"
    >
      <Reveal>
        <h2 className="mb-5 text-base font-semibold sm:mb-6 sm:text-lg md:text-xl">Trusted by shoppers worldwide</h2>
      </Reveal>
      <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <li key={stat.id}>
            <Reveal delay={i * 110}>
              <StatCard stat={stat} active={visible} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------- live stock */

function LiveStock({ items }) {
  return (
    <section className="w-full px-4 py-8 sm:px-6 sm:py-14 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
      <Reveal>
        <h2 className="text-base font-semibold sm:text-lg md:text-xl">Live stock levels</h2>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">Updated every few minutes as orders come in.</p>
      </Reveal>

      <ul className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
        {items.map((item, i) => {
          const pct = Math.max(6, Math.min(100, item.left));
          const low = item.left <= 10;
          return (
            <li key={item.id}>
              <Reveal delay={i * 90} direction={i % 2 === 0 ? "left" : "right"}>
                <div
                  className={cx(
                    "group relative overflow-hidden rounded-sm border border-[#333333]/80 bg-white p-4 sm:p-5",
                    CARD_3D,
                  )}
                >
                  <CornerFold />
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-sm font-medium sm:text-base">{item.name}</p>
                    <span className="text-base font-semibold sm:text-lg">{item.price}</span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner">
                    <span
                      style={{ width: `${pct}%` }}
                      className={cx(
                        "block h-full rounded-full transition-[width] duration-1000 ease-out",
                        low ? "animate-pulse bg-red-600" : "bg-[#333333]",
                      )}
                    />
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                    {low ? `Only ${item.left} left` : `${item.left} in stock`} · {item.sold.toLocaleString()} sold
                  </p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------------------------------------------------------- category card */

const MAX_TILT_DEG = 8;

function CategoryCard({ cat, index, selected }) {
  const { ref: revealRef, visible } = useReveal({ threshold: 0.1 });
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const setRefs = useCallback(
    (node) => {
      cardRef.current = node;
      revealRef.current = node;
    },
    [revealRef],
  );

  const handleMove = (e) => {
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * MAX_TILT_DEG * 2, y: px * MAX_TILT_DEG * 2 });
  };

  return (
    <div
      style={{ transitionDelay: visible ? `${index * 90}ms` : "0ms" }}
      className={cx(
        "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none motion-reduce:transform-none",
        visible ? "translate-y-0 translate-x-0 opacity-100" : "-translate-x-4 translate-y-6 opacity-0",
      )}
    >
    <Link
      to={`/${cat.slug}`}
      ref={setRefs}
      aria-current={selected ? "true" : undefined}
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${
          selected ? "translateZ(4px)" : ""
        }`,
      }}
      className={cx(
        "group relative block w-full overflow-hidden rounded-sm border border-[#333333] bg-white will-change-transform",
        "[transform-style:preserve-3d] transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out motion-reduce:transform-none",
        "shadow-[0_2px_4px_rgba(0,0,0,0.08),0_14px_24px_-14px_rgba(0,0,0,0.35)]",
        "hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_26px_40px_-16px_rgba(0,0,0,0.45)]",
        "active:scale-[0.98] active:duration-100",
        selected ? "border-[#333333] bg-[#333333]" : "hover:border-[#333333] hover:bg-[#333333]",
      )}
    >
      <CornerFold dark />
      <div className="relative aspect-square w-full overflow-hidden border-b border-[#333333]">
        <img
          src={cat.image || "/placeholder.svg"}
          alt={cat.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {typeof cat.stock === "number" && (
          <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[9px] uppercase tracking-widest text-[#333333] shadow-sm backdrop-blur-sm">
            {cat.stock.toLocaleString()} in stock
          </span>
        )}
      </div>
      <div
        className={cx(
          "px-2 py-2 transition-colors duration-500 ease-out sm:px-3 sm:py-3",
          selected ? "text-white" : "group-hover:text-white",
        )}
      >
        <span className="text-xs font-medium sm:text-sm md:text-base">{cat.name}</span>
      </div>
    </Link>
    </div>
  );
}

/* ---------------------------------------------------------------- reviews */

function ReviewCard({ review }) {
  const reviewerName = review.userId?.fullName || "Verified Buyer";
  const reviewerAvatar = review.userId?.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200";
  const reviewText = review.comment?.trim() || review.title?.trim() || "";

  return (
    <div
      className={cx(
        "group relative flex h-full flex-col gap-3 overflow-hidden rounded-sm border border-[#333333] bg-white p-4 sm:p-5",
        "transition-colors duration-300 ease-out hover:bg-[#333333] hover:border-[#333333]",
        CARD_3D,
      )}
    >
      <CornerFold />
      <div className="flex items-center gap-3 transition-colors duration-300 group-hover:text-white">
        <img
          src={reviewerAvatar || "/placeholder.svg"}
          alt={reviewerName}
          className="h-10 w-10 rounded-full border border-[#333333] object-cover shadow-md transition-colors duration-300 group-hover:border-white sm:h-12 sm:w-12"
        />
        <div>
          <p className="text-sm font-medium transition-colors duration-300 group-hover:text-white sm:text-base">
            {reviewerName}
          </p>
          <div className="text-xs transition-colors duration-300 group-hover:text-white sm:text-sm">
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)}
          </div>
        </div>
      </div>
      <p className="text-xs leading-relaxed transition-colors duration-300 group-hover:text-white sm:text-sm md:text-base">
        {reviewText}
      </p>
      {review.productId?.name && (
        <p className="text-[10px] uppercase tracking-wide text-gray-400 transition-colors duration-300 group-hover:text-gray-300 sm:text-xs">
          {review.productId.name}
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- whatsapp button */

function WhatsAppButton() {
  const [expanded, setExpanded] = useState(false);
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  useEffect(() => {
    const timer = setTimeout(() => setExpanded(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onMouseEnter={() => setExpanded(true)}
      className="fixed bottom-5 right-5 z-40 flex animate-[float_3s_ease-in-out_infinite] items-center gap-2 rounded-full bg-[#25D366] px-3.5 py-3.5 text-white shadow-[0_4px_10px_rgba(0,0,0,0.2),0_12px_24px_-8px_rgba(37,211,102,0.6)] transition-transform duration-300 hover:scale-110 hover:shadow-[0_6px_14px_rgba(0,0,0,0.25),0_18px_30px_-8px_rgba(37,211,102,0.7)] active:scale-95"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-40" aria-hidden />
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-6 shrink-0" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
      </svg>
      <span
        className={cx(
          "overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-500",
          expanded ? "max-w-40 pr-1 opacity-100" : "max-w-0 opacity-0",
        )}
      >
        Chat with us
      </span>
    </a>
  );
}

/* ---------------------------------------------------------------- page */

export default function Home() {
  const marqueeReviews = [...featuredReviews, ...featuredReviews];

  const location = useLocation();
  const selectedSlug = location.pathname.replace(/^\/+/, "");

  const [slideIndex, setSlideIndex] = useState(0);
  const bannerRef = useRef(null);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  const progress = useScrollProgress();
  const scrollY = useScrollY();
  const condensed = scrollY > 40;

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

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const node = bannerRef.current;
    if (!node) return;
    const walk = e.pageX - dragStartX.current;
    if (Math.abs(walk) > 5) didDrag.current = true;
    node.scrollLeft = dragStartScroll.current - walk;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

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
      <SEO
        title="Shop Men, Women, Kids, Fragrances & Accessories"
        description="Discover the latest collections for Men, Women, Kids, Fragrances, and Accessories. Shop new arrivals and exclusive sales at STORE."
        keywords="fashion, clothing, men, women, kids, fragrances, accessories, sales, new arrivals"
        path="/"
      />

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
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes logoDrop {
          from { opacity: 0; transform: translateY(-12px) rotateX(40deg); }
          to { opacity: 1; transform: translateY(0) rotateX(0deg); }
        }
        .logo-drop {
          animation: logoDrop 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-style: preserve-3d;
        }
        @keyframes storeLineDraw {
          from { width: 0; }
        }
        .store-line {
          animation: storeLineDraw 0.6s 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      {/* top scroll-progress bar, with a slight 3D glow */}
      <div
        aria-hidden
        style={{ transform: `scaleX(${progress})` }}
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-[#333333] shadow-[0_0_6px_rgba(0,0,0,0.4)] transition-transform duration-150 ease-out"
      />

      {/* Header — sticky, condenses on scroll, gains depth via shadow once condensed */}
      <header
        className={cx(
          "sticky top-0 z-30 w-full border-b border-[#333333] bg-white/90 backdrop-blur transition-all duration-500",
          condensed ? "py-2 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.25)]" : "py-4 shadow-none",
          "px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16",
        )}
      >
        <h1
          className={cx(
            "logo-drop group inline-block w-fit font-semibold tracking-wide transition-all duration-500",
            condensed ? "text-base sm:text-lg" : "text-lg sm:text-xl md:text-2xl",
          )}
        >
          {/* thin top line above the wordmark: draws out on load, extends + thickens on hover */}
          <span
            aria-hidden
            className="store-line mb-1 block h-[2px] w-8 bg-[#333333] transition-all duration-300 ease-out group-hover:w-12 group-hover:h-[3px]"
          />
          STORE
        </h1>
      </header>

      {/* Banner — mobile-first height, static images (no hover/parallax translate) */}
      <section className="relative h-[42vh] w-full overflow-hidden border-b border-[#333333] sm:h-[55vh] md:h-[80vh]">
        <div
          ref={bannerRef}
          onScroll={handleBannerScroll}
          onMouseDown={handleMouseDown}
          className="banner-scroll flex h-full w-full cursor-grab select-none snap-x snap-mandatory overflow-x-auto scroll-smooth active:cursor-grabbing"
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
              className="group relative block h-full w-full shrink-0 snap-center"
            >
              <img
                src={slide.image || "/placeholder.svg"}
                alt={slide.slug}
                draggable={false}
                className="pointer-events-none h-full w-full object-cover shadow-[inset_0_-40px_60px_-20px_rgba(0,0,0,0.35)]"
              />
            </Link>
          ))}
        </div>

        {/* Dots — pop with a small 3D bounce on activation */}
        <div className="absolute bottom-3 left-0 flex w-full justify-center gap-2 sm:bottom-4">
          {bannerSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cx(
                "h-2.5 w-2.5 rounded-full border border-[#333333] shadow-sm transition-all duration-300 sm:h-3.5 sm:w-3.5",
                slideIndex === i
                  ? "scale-125 bg-[#333333] shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
                  : "bg-white hover:scale-110 hover:bg-[#333333]",
              )}
            />
          ))}
        </div>
      </section>

      {/* Promise strip — mobile-first single column, staggered reveal */}
      <section className="grid w-full grid-cols-1 gap-5 px-4 py-8 sm:grid-cols-3 sm:gap-6 sm:px-6 sm:py-10 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        {promiseStrip.map((item, i) => (
          <Reveal key={item.value} delay={i * 120} direction={i === 0 ? "left" : i === 2 ? "right" : "up"}>
            <div className="border-t border-[#333333] pt-3 transition-transform duration-300 hover:-translate-y-0.5">
              <span className="text-xl font-semibold text-gray-400">{item.value}</span>
              <p className="mt-1 text-sm">{item.label}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <TrustStats stats={trustStats} />

      {/* Categories — mobile-first 2-col grid, each card reveals itself with its own stagger */}
      <main className="px-4 py-6 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {categories.map((cat, index) => (
            <CategoryCard key={cat.slug} cat={cat} index={index} selected={selectedSlug === cat.slug} />
          ))}
        </div>
      </main>

      <LiveStock items={liveStock} />

      {/* Reviews marquee */}
      {featuredReviews.length > 0 && (
        <section className="border-t border-[#333333] bg-white py-8">
          <h2 className="fade-in mb-5 px-4 text-base font-semibold sm:px-6 sm:text-lg md:px-8 md:text-xl lg:px-10 xl:px-12 2xl:px-16">
            What our customers say
          </h2>

          <div className="overflow-hidden">
            <div className="marquee-track flex w-max gap-4">
              {marqueeReviews.map((review, index) => (
                <div key={`${review._id}-${index}`} className="w-[260px] shrink-0 sm:w-[320px] md:w-[360px]">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <WhatsAppButton />
    </div>
  );
}
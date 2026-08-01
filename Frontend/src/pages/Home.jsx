import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

// Conditionally join tailwind classes
function cx(...classes) {
  return classes.filter(Boolean).join(" ")
}

// Shared 3D card style: layered soft shadow + hover lift + active press-down
const CARD_3D =
  "transition-all duration-300 ease-out " +
  "shadow-[0_1px_2px_rgba(51,51,51,0.06),0_8px_24px_-8px_rgba(51,51,51,0.18)] " +
  "hover:-translate-y-1.5 hover:shadow-[0_2px_4px_rgba(51,51,51,0.08),0_20px_40px_-12px_rgba(51,51,51,0.28)] " +
  "active:translate-y-0 active:shadow-[0_1px_2px_rgba(51,51,51,0.10)] " +
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0"

/* ------------------------------------------------------------------ */
/*  Mock content (brand: bags / shoes / fragrances)                    */
/* ------------------------------------------------------------------ */

const categories = [
  {
    name: "Ladies Bags",
    slug: "women",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    stock: 128,
  },
  {
    name: "Ladies Shoes",
    slug: "women",
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
    stock: 96,
  },
  {
    name: "Men's Shoes",
    slug: "men",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    stock: 142,
  },
  {
    name: "Kids Shoes",
    slug: "kids",
    image:
      "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80",
    stock: 74,
  },
  {
    name: "Fragrances",
    slug: "fragrances",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    stock: 210,
  },
  {
    name: "Sale",
    slug: "sale",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80",
    stock: 58,
  },
]

const bannerSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1600&q=80",
    slug: "women",
    title: "Bags That Make an Entrance",
    subtitle: "Handcrafted leather totes, crossbodies & clutches",
    cta: "Shop Ladies Bags",
  },
  {
    image:
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1600&q=80",
    slug: "men",
    title: "Step Up Your Everyday",
    subtitle: "Sneakers, loafers & boots built to last",
    cta: "Shop Men's Shoes",
  },
  {
    image:
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=1600&q=80",
    slug: "fragrances",
    title: "Scent Is a Signature",
    subtitle: "Long-lasting eau de parfum for every mood",
    cta: "Shop Fragrances",
  },
  {
    image:
      "https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?auto=format&fit=crop&w=1600&q=80",
    slug: "women",
    title: "Heels, Flats & Everything In Between",
    subtitle: "Comfort-first styles for day into night",
    cta: "Shop Ladies Shoes",
  },
]

const promiseStrip = [
  {
    num: "01",
    title: "Free Shipping",
    text: "Complimentary delivery on every order over $75, nationwide.",
  },
  {
    num: "02",
    title: "Easy 30-Day Returns",
    text: "Changed your mind? Send it back within 30 days, no questions asked.",
  },
  {
    num: "03",
    title: "100% Authentic",
    text: "Every bag, shoe & fragrance is sourced direct and guaranteed genuine.",
  },
]

const trustStats = [
  { label: "Happy Customers Served", value: 48200, suffix: "+" },
  { label: "Customer Satisfaction", value: 98, suffix: "%" },
  { label: "Items In Stock", value: 12500, suffix: "+" },
  { label: "Countries Shipped To", value: 32, suffix: "" },
]

const liveStock = [
  {
    name: "Milano Leather Tote Bag",
    category: "women",
    image:
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80",
    unitsLeft: 6,
    unitsSold: 194,
    price: 149,
  },
  {
    name: "Aurora Stiletto Heels",
    category: "women",
    image:
      "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=800&q=80",
    unitsLeft: 3,
    unitsSold: 121,
    price: 119,
  },
  {
    name: "Trailrunner Low Sneakers",
    category: "men",
    image:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80",
    unitsLeft: 21,
    unitsSold: 356,
    price: 99,
  },
  {
    name: "Noir Intense Eau de Parfum",
    category: "fragrances",
    image:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
    unitsLeft: 9,
    unitsSold: 278,
    price: 89,
  },
]

const featuredReviews = [
  {
    rating: 5,
    comment:
      "The Milano tote is even more beautiful in person — the leather is buttery soft and it fits my laptop perfectly.",
    name: "Amara Okafor",
    avatar: "https://i.pravatar.cc/120?img=47",
    product: "Milano Leather Tote Bag",
  },
  {
    rating: 5,
    comment:
      "Finally heels I can wear all day without wincing. Elegant and shockingly comfortable.",
    name: "Priya Sharma",
    avatar: "https://i.pravatar.cc/120?img=32",
    product: "Aurora Stiletto Heels",
  },
  {
    rating: 4,
    comment:
      "Great everyday sneakers. True to size and the grip is solid on wet pavement.",
    name: "Daniel Reyes",
    avatar: "https://i.pravatar.cc/120?img=12",
    product: "Trailrunner Low Sneakers",
  },
  {
    rating: 5,
    comment:
      "Noir Intense lasts the entire workday and gets me compliments every single time.",
    name: "Sofia Bianchi",
    avatar: "https://i.pravatar.cc/120?img=45",
    product: "Noir Intense Eau de Parfum",
  },
  {
    rating: 5,
    comment:
      "Ordered kids shoes for my son — arrived in two days and the quality is fantastic for the price.",
    name: "Marcus Bennett",
    avatar: "https://i.pravatar.cc/120?img=15",
    product: "Kids Shoes",
  },
]

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

// IntersectionObserver-based reveal-on-scroll (fires once)
function useReveal(options = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Respect reduced motion — reveal immediately.
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px", ...options },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, visible]
}

// Count-up number, starts when `active` becomes true
function useCountUp(target, active, duration = 1600) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return

    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target)
      return
    }

    let raf
    let start
    const step = (ts) => {
      if (start === undefined) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])

  return value
}

/* ------------------------------------------------------------------ */
/*  Reusable presentational components                                 */
/* ------------------------------------------------------------------ */

const DIRECTION_MAP = {
  up: "translate-y-8",
  down: "-translate-y-8",
  left: "translate-x-8",
  right: "-translate-x-8",
}

// Generic reveal wrapper — fade + slide in, staggered via delay (ms)
function Reveal({ children, delay = 0, direction = "up", className = "" }) {
  const [ref, visible] = useReveal()

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cx(
        "transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none",
        visible ? "opacity-100 translate-x-0 translate-y-0" : cx("opacity-0", DIRECTION_MAP[direction]),
        className,
      )}
    >
      {children}
    </div>
  )
}

// Decorative folded corner (top-right of cards), animates on hover
function CornerFold({ variant = "dark" }) {
  const isDark = variant === "dark"
  return (
    <span
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute right-0 top-0 z-10 h-0 w-0 origin-top-right",
        "transition-all duration-300 ease-out",
        "border-l-transparent",
        "group-hover:scale-125 group-hover:-rotate-3",
        isDark
          ? "border-t-[#333333] border-l-[28px] border-t-[28px]"
          : "border-t-white border-l-[28px] border-t-[28px]",
        "drop-shadow-[0_2px_3px_rgba(51,51,51,0.25)]",
      )}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Section: Hero banner (auto-sliding, transform-based track)         */
/* ------------------------------------------------------------------ */

function HeroBanner() {
  const [index, setIndex] = useState(0)
  const count = bannerSlides.length

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, 8000)
    return () => clearInterval(id)
  }, [count])

  return (
    <section className="relative overflow-hidden bg-[#333333]" aria-label="Featured collections">
      <div
        className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {bannerSlides.map((slide, i) => (
          <div key={i} className="relative min-w-full">
            <div className="relative h-[62vh] min-h-[380px] w-full md:h-[78vh]">
              <img
                src={slide.image || "/placeholder.svg"}
                alt={slide.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#333333]/85 via-[#333333]/40 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
                  <div className="max-w-xl">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                      New Season
                    </p>
                    <h2 className="text-balance text-4xl font-bold leading-tight text-white md:text-6xl">
                      {slide.title}
                    </h2>
                    <p className="mt-4 text-pretty text-base text-white/80 md:text-lg">
                      {slide.subtitle}
                    </p>
                    <Link
                      to={`/${slide.slug}`}
                      className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#333333] transition-all duration-300 ease-out hover:gap-3 hover:bg-white/90"
                    >
                      {slide.cta}
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dot navigation */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
        {bannerSlides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={cx(
              "h-2.5 rounded-full transition-all duration-300 ease-out",
              i === index ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80",
            )}
          />
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section: Scroll progress bar                                       */
/* ------------------------------------------------------------------ */

function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const height = document.documentElement.scrollHeight - window.innerHeight
      setProgress(height > 0 ? (scrollTop / height) * 100 : 0)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent" aria-hidden="true">
      <div
        className="h-full bg-[#333333] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section: Promise strip                                             */
/* ------------------------------------------------------------------ */

function PromiseStrip() {
  const directions = ["left", "up", "right"]
  return (
    <section className="border-b border-gray-100 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-14 md:grid-cols-3 md:px-10">
        {promiseStrip.map((item, i) => (
          <Reveal key={item.num} direction={directions[i]} delay={i * 120}>
            <div className="flex items-start gap-4">
              <span className="text-3xl font-bold tabular-nums text-gray-200">{item.num}</span>
              <div>
                <h3 className="text-lg font-semibold text-[#333333]">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section: Trust stats (count-up)                                    */
/* ------------------------------------------------------------------ */

function StatCard({ stat, active, delay }) {
  const value = useCountUp(stat.value, active)
  return (
    <Reveal delay={delay}>
      <div
        className={cx(
          "group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 text-center",
          CARD_3D,
        )}
      >
        <CornerFold variant="dark" />
        <p className="text-3xl font-bold tabular-nums text-[#333333] md:text-4xl">
          {value.toLocaleString()}
          {stat.suffix}
        </p>
        <p className="mt-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          {stat.label}
        </p>
      </div>
    </Reveal>
  )
}

function TrustStats() {
  const [ref, visible] = useReveal()
  return (
    <section ref={ref} className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {trustStats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} active={visible} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section: Category grid (with mouse-move tilt)                      */
/* ------------------------------------------------------------------ */

function CategoryCard({ category, delay }) {
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMove = (e) => {
    const node = cardRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -8, y: px * 8 })
  }

  const reset = () => setTilt({ x: 0, y: 0 })

  return (
    <Reveal delay={delay}>
      <div style={{ perspective: "1000px" }}>
        <Link
          to={`/${category.slug}`}
          ref={cardRef}
          onMouseMove={handleMove}
          onMouseLeave={reset}
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
          className={cx(
            "group relative block overflow-hidden rounded-2xl bg-white transition-transform duration-200 ease-out",
            CARD_3D,
          )}
        >
          <CornerFold variant="light" />
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <img
              src={category.image || "/placeholder.svg"}
              alt={category.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            {/* Overlay that inverts to #333333 on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#333333]/70 to-transparent transition-colors duration-500 ease-out group-hover:bg-[#333333]/85" />

            {/* Stock badge */}
            <span
              className={cx(
                "absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur",
                category.stock <= 60
                  ? "bg-red-600/90 text-white"
                  : "bg-white/85 text-[#333333]",
              )}
            >
              {category.stock <= 60 ? `Only ${category.stock} left` : `${category.stock} in stock`}
            </span>

            {/* Name overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="text-lg font-semibold text-white transition-transform duration-500 ease-out group-hover:-translate-y-0.5">
                {category.name}
              </h3>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-white/0 transition-all duration-500 ease-out group-hover:text-white/90">
                Shop now <span aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </div>
        </Link>
      </div>
    </Reveal>
  )
}

function CategoryGrid() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Browse The Collection
            </p>
            <h2 className="mt-2 text-balance text-3xl font-bold text-[#333333] md:text-4xl">
              Shop By Category
            </h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category, i) => (
            <CategoryCard key={category.slug} category={category} delay={(i % 5) * 90} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section: Live stock (alternating rows + count-up + urgency bar)    */
/* ------------------------------------------------------------------ */

function LiveStockRow({ product, index }) {
  const [ref, visible] = useReveal()
  const unitsLeft = useCountUp(product.unitsLeft, visible, 1200)
  const isLeftImage = index % 2 === 0
  const total = product.unitsLeft + product.unitsSold
  const soldPct = Math.round((product.unitsSold / total) * 100)
  const isLow = product.unitsLeft <= 8

  return (
    <div
      ref={ref}
      className={cx(
        "grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10",
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        visible ? "opacity-100 translate-x-0" : cx("opacity-0", isLeftImage ? "-translate-x-10" : "translate-x-10"),
      )}
    >
      {/* Image */}
      <div className={cx("group relative", isLeftImage ? "md:order-1" : "md:order-2")}>
        <div className={cx("relative overflow-hidden rounded-2xl bg-white", CARD_3D)}>
          <CornerFold variant="dark" />
          <div className="aspect-[16/10] w-full overflow-hidden">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className={cx(isLeftImage ? "md:order-2" : "md:order-1")}>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
          {product.category}
        </p>
        <h3 className="mt-2 text-2xl font-bold text-[#333333] md:text-3xl">{product.name}</h3>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold tabular-nums text-[#333333]">
            {unitsLeft}
          </span>
          <span className="text-sm text-gray-500">units left in stock</span>
        </div>

        {/* Urgency progress bar */}
        <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-100">
          <div
            className={cx(
              "h-full rounded-full transition-[width] duration-1000 ease-out",
              isLow ? "animate-pulse bg-red-600" : "bg-[#333333]",
            )}
            style={{ width: visible ? `${soldPct}%` : "0%" }}
          />
        </div>
        <p className={cx("mt-2 text-xs font-medium", isLow ? "text-red-600" : "text-gray-500")}>
          {isLow ? "Selling fast — almost gone!" : `${product.unitsSold} sold`}
        </p>

        <div className="mt-6 flex items-center gap-4">
          <span className="text-xl font-bold text-[#333333]">${product.price}</span>
          <button
            type="button"
            className="rounded-full bg-[#333333] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-out hover:bg-[#333333]/90 active:scale-95"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

function LiveStock() {
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <Reveal>
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Moving Fast
            </p>
            <h2 className="mt-2 text-balance text-3xl font-bold text-[#333333] md:text-4xl">
              Live Stock Updates
            </h2>
          </div>
        </Reveal>
        <div className="flex flex-col gap-16">
          {liveStock.map((product, i) => (
            <LiveStockRow key={product.name} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section: Reviews marquee                                           */
/* ------------------------------------------------------------------ */

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 20 20"
          className={cx("h-4 w-4", n <= rating ? "fill-[#333333]" : "fill-gray-200")}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15.9 4.8 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <div
      className={cx(
        "group relative w-80 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white p-6",
        CARD_3D,
      )}
    >
      <CornerFold variant="dark" />
      <Stars rating={review.rating} />
      <p className="mt-4 text-sm leading-relaxed text-gray-600">&ldquo;{review.comment}&rdquo;</p>
      <div className="mt-6 flex items-center gap-3">
        <img
          src={review.avatar || "/placeholder.svg"}
          alt={review.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-semibold text-[#333333]">{review.name}</p>
          <p className="text-xs text-gray-400">{review.product}</p>
        </div>
      </div>
    </div>
  )
}

function ReviewsMarquee() {
  const loop = [...featuredReviews, ...featuredReviews]
  return (
    <section className="overflow-hidden bg-white py-16">
      <Reveal>
        <div className="mx-auto mb-12 max-w-7xl px-6 text-center md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Loved By Thousands
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold text-[#333333] md:text-4xl">
            What Our Customers Say
          </h2>
        </div>
      </Reveal>

      <div className="group relative">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

        <div className="flex w-max gap-6 px-6 [animation:marquee_40s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:[animation:none]">
          {loop.map((review, i) => (
            <ReviewCard key={i} review={review} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <main className="bg-white text-[#333333] relative top-[15px]">
      <ScrollProgress />
      <HeroBanner />
      <PromiseStrip />
      <TrustStats />
      <CategoryGrid />
      <LiveStock />
      <ReviewsMarquee />
    </main>
  )
}
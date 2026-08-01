import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { CARD_3D, cx } from "../../../utils/cx"
import { CornerFold } from "./CornerFold"
import { Reveal } from "./Reveal"

// A self-contained inline placeholder (grey tile + "No Image" text) as a
// data URI. Unlike "/placeholder.svg" this can never 404 — it's not a
// network request at all — so the broken-image icon can never reappear
// even if the project has no placeholder file in /public.
const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
      <rect width="400" height="500" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="20">No Image</text>
    </svg>`,
  )

export function CategoryCard({ category, delay }) {
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  // Tilt is a mouse-move effect only — harmless no-op on touch devices
  // since they never fire mousemove, so no extra guard needed.
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
            "group relative block overflow-hidden rounded-2xl bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            CARD_3D,
          )}
        >
          <CornerFold variant="light" />
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <img
              src={category.image || FALLBACK_IMAGE}
              alt={category.name}
              onError={(e) => {
                // Broken/inaccessible image URL from the catalog — swap to
                // the inline fallback, which can never itself fail to load.
                if (e.currentTarget.src !== FALLBACK_IMAGE) {
                  e.currentTarget.src = FALLBACK_IMAGE
                }
              }}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#333333]/70 to-transparent transition-colors duration-500 ease-out group-hover:bg-[#333333]/85" />

            {typeof category.count === "number" && (
              <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-[#333333] backdrop-blur">
                {category.count} {category.count === 1 ? "product" : "products"}
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
              <h3 className="text-base font-semibold text-white transition-transform duration-500 ease-out group-hover:-translate-y-0.5 sm:text-lg">
                {category.name}
              </h3>
              {/*
                 Mobile-first fix: this used to be opacity-0 until
                group-hover, which never fires on touch devices — mobile
                users never saw the "Shop now" cue at all. Now it's
                visible by default and only goes hover-gated at md+.
              */}
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-white/90 transition-all duration-500 ease-out md:text-white/0 md:group-hover:text-white/90">
                Shop now <span aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </div>
        </Link>
      </div>
    </Reveal>
  )
}
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { bannerSlides } from "../data/homeData"
import { cx } from "../../../utils/cx"

export function HeroBanner() {
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
        className="flex transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {bannerSlides.map((slide, i) => (
          <div key={i} className="relative min-w-full">
            {/* Mobile-first: shorter banner on small screens, taller on desktop */}
            <div className="relative h-[56vh] min-h-[380px] w-full md:h-[78vh]">
              <img
                src={slide.image || "/placeholder.svg"}
                alt={slide.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#333333]/85 via-[#333333]/40 to-transparent md:bg-gradient-to-r" />
              <div className="absolute inset-0 flex items-end pb-10 md:items-center md:pb-0">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-10">
                  <div className="max-w-xl">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
                      New Season
                    </p>
                    <h2 className="text-balance text-3xl font-bold leading-tight text-white sm:text-4xl md:text-6xl">
                      {slide.title}
                    </h2>
                    <p className="mt-3 text-pretty text-sm text-white/80 sm:mt-4 sm:text-base md:text-lg">
                      {slide.subtitle}
                    </p>
                    <Link
                      to={`/${slide.slug}`}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#333333] transition-all duration-300 ease-out hover:gap-3 hover:bg-white/90 sm:mt-8 sm:w-auto"
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

      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 md:bottom-6">
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

import { featuredReviews } from "../data/homeData"
import { Reveal } from "./Reveal"
import { ReviewCard } from "./ReviewCard"

export function ReviewsMarquee() {
  const loop = [...featuredReviews, ...featuredReviews]
  return (
    <section className="overflow-hidden bg-white py-12 md:py-16">
      <Reveal>
        <div className="mx-auto mb-8 max-w-7xl px-4 text-center sm:px-6 md:mb-12 md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Loved By Thousands
          </p>
          <h2 className="mt-2 text-balance text-2xl font-bold text-[#333333] sm:text-3xl md:text-4xl">
            What Our Customers Say
          </h2>
        </div>
      </Reveal>

      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:w-16" />

        {/* Slightly slower (50s vs 40s) so it drifts rather than scrolls */}
        <div className="flex w-max gap-4 px-4 sm:gap-6 sm:px-6 [animation:marquee_50s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:[animation:none]">
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

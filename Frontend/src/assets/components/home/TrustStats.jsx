import { useReveal } from "../hooks/useReveal"
import { trustStats } from "../data/homeData"
import { StatCard } from "./StatCard"

export function TrustStats() {
  const [ref, visible] = useReveal()
  return (
    <section ref={ref} className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-10 md:py-16">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
          {trustStats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} active={visible} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  )
}

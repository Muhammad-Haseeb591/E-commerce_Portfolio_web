import { useCountUp } from "../hooks/useCountUp"
import { CARD_3D } from "../../../utils/cx"
import { CornerFold } from "./CornerFold"
import { Reveal } from "./Reveal"

export function StatCard({ stat, active, delay }) {
  const value = useCountUp(stat.value, active)
  return (
    <Reveal delay={delay}>
      <div
        className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 text-center sm:p-6 ${CARD_3D}`}
      >
        <CornerFold variant="dark" />
        <p className="text-2xl font-bold tabular-nums text-[#333333] sm:text-3xl md:text-4xl">
          {value.toLocaleString()}
          {stat.suffix}
        </p>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-gray-500 sm:text-xs">
          {stat.label}
        </p>
      </div>
    </Reveal>
  )
}

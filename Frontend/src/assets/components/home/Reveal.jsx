import { useReveal } from "../hooks/useReveal"
import { cx } from "../../../utils/cx"

const DIRECTION_MAP = {
  up: "translate-y-8",
  down: "-translate-y-8",
  left: "translate-x-8",
  right: "-translate-x-8",
}

// "Smoothed" version: longer duration + an ease-out-expo style cubic-bezier
// instead of the default tailwind ease-out, so reveals glide to rest
// instead of stopping abruptly.
export function Reveal({ children, delay = 0, direction = "up", className = "" }) {
  const [ref, visible] = useReveal()

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cx(
        "transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform motion-reduce:transition-none",
        visible ? "opacity-100 translate-x-0 translate-y-0" : cx("opacity-0", DIRECTION_MAP[direction]),
        className,
      )}
    >
      {children}
    </div>
  )
}

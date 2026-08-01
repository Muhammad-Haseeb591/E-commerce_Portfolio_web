import { cx } from "../../../utils/cx"

export function CornerFold({ variant = "dark" }) {
  const isDark = variant === "dark"
  return (
    <span
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute right-0 top-0 z-10 h-0 w-0 origin-top-right",
        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
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

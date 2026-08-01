// Conditionally join tailwind classes
export function cx(...classes) {
  return classes.filter(Boolean).join(" ")
}

// Shared 3D card style: layered soft shadow + hover lift + active press-down
export const CARD_3D =
  "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "shadow-[0_1px_2px_rgba(51,51,51,0.06),0_8px_24px_-8px_rgba(51,51,51,0.18)] " +
  "hover:-translate-y-1.5 hover:shadow-[0_2px_4px_rgba(51,51,51,0.08),0_20px_40px_-12px_rgba(51,51,51,0.28)] " +
  "active:translate-y-0 active:duration-150 active:shadow-[0_1px_2px_rgba(51,51,51,0.10)] " +
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0"

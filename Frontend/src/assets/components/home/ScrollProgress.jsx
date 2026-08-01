import { useEffect, useRef, useState } from "react"

export function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  const ticking = useRef(false)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const height = document.documentElement.scrollHeight - window.innerHeight
      setProgress(height > 0 ? (scrollTop / height) * 100 : 0)
      ticking.current = false
    }

    // rAF-throttled: only recompute once per animation frame instead of
    // once per scroll event, so the bar glides instead of jittering.
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent" aria-hidden="true">
      <div
        className="h-full bg-[#333333] transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

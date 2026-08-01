import { promiseStrip } from "../data/homeData"
import { Reveal } from "./Reveal"

export function PromiseStrip() {
  const directions = ["left", "up", "right"]
  return (
    <section className="border-b border-gray-100 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 md:px-10 md:py-14">
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

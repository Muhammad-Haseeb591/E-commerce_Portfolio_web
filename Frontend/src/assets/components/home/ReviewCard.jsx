import { CARD_3D } from "../../../utils/cx"
import { CornerFold } from "./CornerFold"
import { Stars } from "./Stars"

export function ReviewCard({ review }) {
  return (
    <div
      className={`group relative w-72 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 sm:w-80 sm:p-6 ${CARD_3D}`}
    >
      <CornerFold variant="dark" />
      <Stars rating={review.rating} />
      <p className="mt-4 text-sm leading-relaxed text-gray-600">&ldquo;{review.comment}&rdquo;</p>
      <div className="mt-6 flex items-center gap-3">
        <img
          src={review.avatar || "/placeholder.svg"}
          alt={review.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-semibold text-[#333333]">{review.name}</p>
          <p className="text-xs text-gray-400">{review.product}</p>
        </div>
      </div>
    </div>
  )
}

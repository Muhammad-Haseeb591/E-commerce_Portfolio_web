import { Eye, Pencil, Trash2 } from "lucide-react";
import { StatusBadge, PaymentBadge } from "./StatusBadges";
import { InvoiceButton } from "./InvoiceControls";
import { formatMoney } from "./orderHelpers";

export const OrderCard = ({ order, selected, onToggleSelect, onView, onEdit, onDelete }) => (
  <div className="flex items-start gap-3 p-3 border-b border-gray-100 last:border-0">
    <input
      type="checkbox"
      checked={selected}
      onChange={() => onToggleSelect(order._id)}
      className="mt-1.5 w-4 h-4 rounded border-gray-300 shrink-0"
      aria-label="Select order"
    />

    <div className="min-w-0 flex-1">
      <p className="font-medium text-gray-900 truncate">#{order.orderNumber || order._id}</p>
      <p className="text-xs text-gray-400 truncate">{order.email || "—"}</p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="text-sm text-gray-700 font-semibold">
          {formatMoney(order.totalAmount)}
        </span>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-1">
        <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
      </div>
    </div>

    <div className="flex flex-col gap-1.5 shrink-0">
      <button
        onClick={() => onView(order)}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label="View order"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => onEdit(order)}
        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
        aria-label="Edit order"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <InvoiceButton orderId={order._id} />
      <button
        onClick={() => onDelete(order._id)}
        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
        aria-label="Delete order"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default OrderCard;
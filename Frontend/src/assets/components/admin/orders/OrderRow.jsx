import { Eye, Pencil, Trash2 } from "lucide-react";
import { StatusBadge, PaymentBadge } from "../AdminOrders/StatusBadges";
import { InvoiceButton } from "../AdminOrders/InvoiceControls";
import { formatDate, formatMoney } from "../AdminOrders/orderHelpers";

export const OrderRow = ({ order, selected, onToggleSelect, onView, onEdit, onDelete }) => (
  <tr className="border-t border-gray-100 hover:bg-blue-50 transition-colors">
    <td className="px-4 py-4">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(order._id)}
        className="w-4 h-4 rounded border-gray-300"
        aria-label="Select order"
      />
    </td>
    <td className="px-6 py-4 font-medium text-gray-900">#{order.orderNumber || order._id}</td>
    <td className="px-6 py-4 text-gray-500">{order.email || "—"}</td>
    <td className="px-6 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
    <td className="px-6 py-4 text-gray-700">{formatMoney(order.totalAmount)}</td>
    <td className="px-6 py-4">
      <StatusBadge status={order.status} />
    </td>
    <td className="px-6 py-4">
      <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(order)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(order)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <InvoiceButton orderId={order._id} />
        <button
          onClick={() => onDelete(order._id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
);

export default OrderRow;
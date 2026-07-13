import { useState, useEffect } from "react";
import { Search, AlertCircle, PackageX, X, Pencil, Trash2, Eye, ChevronDown } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllOrders, updateOrder, deleteOrder } from "../redux_Toolkit/orderSlice";

// ── Shared state blocks (same pattern as Products.jsx) ──
const StateBlock = ({ children }) => (
  <div className="py-14 flex flex-col items-center gap-3 text-center px-4">{children}</div>
);

const LoadingState = () => (
  <StateBlock>
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
    <span className="text-sm text-gray-400">Loading orders...</span>
  </StateBlock>
);

const ErrorState = ({ message, onRetry }) => (
  <StateBlock>
    <AlertCircle className="w-8 h-8 text-red-400" />
    <span className="text-sm font-medium text-red-400">Error: {message}</span>
    <button
      type="button"
      onClick={onRetry}
      className="text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
    >
      Retry
    </button>
  </StateBlock>
);

const EmptyState = () => (
  <StateBlock>
    <PackageX className="w-8 h-8 text-gray-400" />
    <span className="text-sm text-gray-400">No orders found</span>
  </StateBlock>
);

// ── Status options + badge styling ──
const STATUS_OPTIONS = ["placed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_STYLES = {
  placed: "bg-gray-100 text-gray-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

const StatusBadge = ({ status }) => (
  <span
    className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${
      STATUS_STYLES[status] || "bg-gray-100 text-gray-700"
    }`}
  >
    {status || "—"}
  </span>
);

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMoney = (n) => (typeof n === "number" ? `Rs. ${n.toFixed(2)}` : "—");

// ── Order Details Modal (read-only view of items/shipping) ──
const DetailsModal = ({ order, onClose }) => {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 py-6" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber || order._id}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Placed on</span>
            <span className="text-gray-900">{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Customer email</span>
            <span className="text-gray-900">{order.email || "—"}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Total</span>
            <span className="text-gray-900 font-medium">{formatMoney(order.totalAmount ?? order.total)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Status</span>
            <StatusBadge status={order.status} />
          </div>

          {order.shippingAddress && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-400 mb-1">Shipping Address</p>
              <p className="text-gray-800">
                {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zip}
              </p>
            </div>
          )}

          {order.items?.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-400 mb-2">Items ({order.items.length})</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={item._id || i} className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-900 truncate">{item.name || "—"}</p>
                      <p className="text-xs text-gray-400">Qty: {item.qty ?? 1}</p>
                    </div>
                    <span className="text-gray-700 font-medium">{formatMoney(item.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Edit (status update) Modal ──
const EditStatusModal = ({ order, onClose, onSave, saving }) => {
  const [status, setStatus] = useState(order.status || "placed");

  const handleSave = () => onSave(status);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl p-4 sm:p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-4">Order #{order.orderNumber || order._id}</p>

        <div className="space-y-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setStatus(opt)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium capitalize transition ${
                status === opt
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {opt}
              <StatusBadge status={opt} />
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Order Card (mobile) ──
const OrderCard = ({ order, onView, onEdit, onDelete }) => (
  <div className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0">
    <div className="min-w-0 flex-1">
      <p className="font-medium text-gray-900 truncate">#{order.orderNumber || order._id}</p>
      <p className="text-xs text-gray-400 truncate">{order.email || "—"}</p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="text-sm text-gray-700 font-semibold">
          {formatMoney(order.totalAmount ?? order.total)}
        </span>
        <StatusBadge status={order.status} />
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
        aria-label="Edit order status"
      >
        <Pencil className="w-4 h-4" />
      </button>
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

// ── Order Row (desktop) ──
const OrderRow = ({ order, onView, onEdit, onDelete }) => (
  <tr className="border-t border-gray-100 hover:bg-blue-50 transition-colors">
    <td className="px-6 py-4 font-medium text-gray-900">#{order.orderNumber || order._id}</td>
    <td className="px-6 py-4 text-gray-500">{order.email || "—"}</td>
    <td className="px-6 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
    <td className="px-6 py-4 text-gray-700">{formatMoney(order.totalAmount ?? order.total)}</td>
    <td className="px-6 py-4">
      <StatusBadge status={order.status} />
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

// ── Main Orders Component (admin) ──
const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  const dispatch = useDispatch();
  const {
    allOrders = [],
    allOrdersLoading,
    allOrdersError,
    updating,
    deleting,
  } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  const filteredOrders = allOrders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      o.orderNumber?.toString().toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id) => {
    if (window.confirm("Delete this order? This cannot be undone.")) {
      dispatch(deleteOrder(id));
    }
  };

  const handleSaveStatus = (status) => {
    dispatch(updateOrder({ id: editingOrder._id, status }));
    setEditingOrder(null);
  };

  const renderContent = () => {
    if (allOrdersLoading) return <LoadingState />;
    if (allOrdersError) {
      return <ErrorState message={allOrdersError} onRetry={() => dispatch(fetchAllOrders())} />;
    }
    if (filteredOrders.length === 0) return <EmptyState />;
    return null;
  };

  const emptyOrStateContent = renderContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6 overflow-x-hidden">

      <DetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} />

      {editingOrder && (
        <EditStatusModal
          order={editingOrder}
          saving={updating}
          onClose={() => setEditingOrder(null)}
          onSave={handleSaveStatus}
        />
      )}

      <div className="space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
        </div>

        {/* Search + filter — stacked on mobile, side by side from sm up */}
        <div className="p-3 bg-white rounded-xl border border-gray-100 flex flex-col gap-3 sm:flex-row sm:p-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order # or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:py-3 sm:text-base"
            />
          </div>

          <div className="relative w-full sm:w-48 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 pr-9 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white capitalize sm:py-3 sm:text-base"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Mobile: card list */}
        <div className="sm:hidden bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {emptyOrStateContent || filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onView={setViewingOrder}
              onEdit={setEditingOrder}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Order", "Email", "Date", "Total", "Status", "Actions"].map((col) => (
                  <th key={col} className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allOrdersLoading || allOrdersError || filteredOrders.length === 0 ? (
                <tr><td colSpan={6}>{emptyOrStateContent}</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    onView={setViewingOrder}
                    onEdit={setEditingOrder}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {deleting && (
          <p className="text-center text-xs text-gray-400">Deleting order...</p>
        )}
      </div>
    </div>
  );
};

export default Orders;
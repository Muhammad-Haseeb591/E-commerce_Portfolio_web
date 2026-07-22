import { useState, useEffect } from "react";
import {
  Search, AlertCircle, PackageX, X, Pencil, Trash2, Eye,
  ChevronDown, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet, FileText,
  CreditCard, Banknote, CheckCircle2, XCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllOrders, updateOrder, deleteOrder } from "../redux_Toolkit/OrderSlice";
import { downloadGetFile, downloadPostFile } from "../../../utils/downloadFile";

// ── Invoice / export controls ──

const InvoiceButton = ({ orderId }) => {
  const [downloading, setDownloading] = useState(false);
  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadGetFile(`/${orderId}/invoice`, `invoice-${orderId}.pdf`);
    } catch (err) {
      console.error("Invoice download failed:", err);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
      aria-label="Download invoice"
      title="Download invoice"
    >
      <FileDown className="w-4 h-4" />
    </button>
  );
};

const BulkInvoiceButton = ({ selectedOrderIds }) => {
  const [downloading, setDownloading] = useState(false);
  const handleBulkDownload = async () => {
    setDownloading(true);
    try {
      await downloadPostFile("/invoices/bulk", "invoices-bulk.pdf", {
        orderIds: selectedOrderIds,
      });
    } catch (err) {
      console.error("Bulk invoice download failed:", err);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <button
      onClick={handleBulkDownload}
      disabled={!selectedOrderIds.length || downloading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <FileDown className="w-4 h-4" />
      {downloading ? "Downloading..." : `Invoices (${selectedOrderIds.length})`}
    </button>
  );
};

const ExportButtons = ({ currentFilters }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => downloadGetFile("/export/excel", "orders.xlsx", currentFilters)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
    >
      <FileSpreadsheet className="w-4 h-4" />
      Excel
    </button>
    <button
      onClick={() => downloadGetFile("/export/csv", "orders.csv", currentFilters)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
    >
      <FileText className="w-4 h-4" />
      CSV
    </button>
  </div>
);

// ── Shared state blocks ──
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
const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-700",
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

// ── Payment badge — matches schema enums exactly: cod|card, unpaid|paid|failed ──
const PaymentBadge = ({ method, status }) => {
  const isCod = (method || "").toLowerCase() === "cod";
  const isPaid = (status || "").toLowerCase() === "paid";
  const isFailed = (status || "").toLowerCase() === "failed";

  if (isCod) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 whitespace-nowrap">
        <Banknote className="w-3 h-3" />
        Cash on Delivery
      </span>
    );
  }

  if (isFailed) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 whitespace-nowrap">
        <XCircle className="w-3 h-3" />
        Card · Failed
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
        isPaid ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700"
      }`}
    >
      {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
      {isPaid ? "Paid (Card)" : "Card · Unpaid"}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMoney = (n) => (typeof n === "number" ? `Rs. ${n.toFixed(2)}` : "—");

// ── Order Details Modal (read-only quick view) ──
const DetailsModal = ({ order, onClose }) => {
  if (!order) return null;
  const addr = order.shippingAddress || {};
  const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(" ");

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
            <span>Customer</span>
            <span className="text-gray-900 text-right">{fullName || "—"}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Email</span>
            <span className="text-gray-900">{order.email || "—"}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Phone</span>
            <span className="text-gray-900">{addr.phone || "—"}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Total</span>
            <span className="text-gray-900 font-medium">{formatMoney(order.totalAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Status</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Payment</span>
            <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-400 mb-1">Shipping Address</p>
            <p className="text-gray-800">
              {addr.line1 || "—"}, {addr.city || "—"}, {addr.state || "—"} {addr.zip || ""}
              <br />
              {addr.country || "—"}
            </p>
          </div>

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
                      <p className="text-xs text-gray-400">Qty: {item.quantity ?? 1}</p>
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

// ── Field helpers for the edit form (mobile-first) ──
const FieldLabel = ({ children, required }) => (
  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const TextField = ({ label, required, ...props }) => (
  <div>
    <FieldLabel required={required}>{label}</FieldLabel>
    <input
      {...props}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

// ── Edit Order Modal — status + contact + address + payment, all editable ──
const EditOrderModal = ({ order, onClose, onSave, saving }) => {
  const addr = order.shippingAddress || {};

  const [form, setForm] = useState({
    status: order.status || "pending",
    firstName: addr.firstName || "",
    lastName: addr.lastName || "",
    email: order.email || "",
    phone: addr.phone || "",
    line1: addr.line1 || "",
    city: addr.city || "",
    state: addr.state || "",
    zip: addr.zip || "",
    country: addr.country || "PK",
    paymentMethod: order.paymentMethod || "cod",     // enum: cod | card
    paymentStatus: order.paymentStatus || "unpaid",  // enum: unpaid | paid | failed
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = () => {
    onSave({
      status: form.status,
      email: form.email,
      paymentMethod: form.paymentMethod,
      // COD ko admin se advance "paid" mark nahi karna — cash delivery pe li jati hai.
      paymentStatus: form.paymentMethod === "cod" ? "unpaid" : form.paymentStatus,
      shippingAddress: {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        line1: form.line1,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Edit Order</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-5">Order #{order.orderNumber || order._id}</p>

        <div className="space-y-6">

          {/* ── Order Status ── */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order Status</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: opt }))}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium capitalize transition ${
                    form.status === opt
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* ── Contact Information ── */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="First Name" required value={form.firstName} onChange={update("firstName")} placeholder="First name" />
              <TextField label="Last Name" required value={form.lastName} onChange={update("lastName")} placeholder="Last name" />
              <div className="sm:col-span-2">
                <TextField label="Email" required type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" />
              </div>
              <div className="sm:col-span-2">
                <TextField label="Phone" required value={form.phone} onChange={update("phone")} placeholder="+92 300 1234567" />
              </div>
            </div>
          </section>

          {/* ── Shipping Address ── */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shipping Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <TextField label="Street Address" required value={form.line1} onChange={update("line1")} placeholder="House #, street, area" />
              </div>
              <TextField label="City" required value={form.city} onChange={update("city")} placeholder="City" />
              <TextField label="State / Province" value={form.state} onChange={update("state")} placeholder="Punjab" />
              <TextField label="Zip / Postal Code" required value={form.zip} onChange={update("zip")} placeholder="54000" />
              <TextField label="Country" value={form.country} onChange={update("country")} placeholder="PK" />
            </div>
          </section>

          {/* ── Payment Method ── */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, paymentMethod: "cod" }))}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                  form.paymentMethod === "cod"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                <Banknote className="w-4 h-4" />
                Cash on Delivery
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, paymentMethod: "card" }))}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                  form.paymentMethod === "card"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Card
              </button>
            </div>

            {form.paymentMethod === "cod" ? (
              <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                Cash on Delivery — payment collected at delivery, not marked paid in advance.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.paymentStatus === "paid"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, paymentStatus: e.target.checked ? "paid" : "unpaid" }))
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Mark as Paid
                </label>
                <label className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.paymentStatus === "failed"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, paymentStatus: e.target.checked ? "failed" : "unpaid" }))
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Mark as Failed
                </label>
              </div>
            )}
          </section>
        </div>

        <div className="flex gap-3 mt-6 sticky bottom-0 bg-white pt-3">
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Order Card (mobile) ──
const OrderCard = ({ order, selected, onToggleSelect, onView, onEdit, onDelete }) => (
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

// ── Order Row (desktop) ──
const OrderRow = ({ order, selected, onToggleSelect, onView, onEdit, onDelete }) => (
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

// ── Pagination bar ──
const PaginationBar = ({ page, pages, total, onPageChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
      <span className="text-xs text-gray-400">
        Page {page} of {pages} · {total} orders
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ── Main Orders Component (admin) ──
const Orders = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const dispatch = useDispatch();
  const {
    allOrders = [],
    allOrdersLoading,
    allOrdersError,
    allOrdersPagination,
    updating,
    deleting,
  } = useSelector((state) => state.orders);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    dispatch(fetchAllOrders({ page, limit: 20, search: searchQuery, status: statusFilter }));
  }, [dispatch, page, searchQuery, statusFilter]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, searchQuery, statusFilter]);

  const handleDelete = (id) => {
    if (window.confirm("Delete this order? This cannot be undone.")) {
      dispatch(deleteOrder(id)).then(() => {
        setSelectedIds((prev) => prev.filter((sid) => sid !== id));
        dispatch(fetchAllOrders({ page, limit: 20, search: searchQuery, status: statusFilter }));
      });
    }
  };

  const handleSaveOrder = (updates) => {
    dispatch(updateOrder({ id: editingOrder._id, ...updates })).then(() => {
      dispatch(fetchAllOrders({ page, limit: 20, search: searchQuery, status: statusFilter }));
    });
    setEditingOrder(null);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.length === allOrders.length ? [] : allOrders.map((o) => o._id)));
  };

  const currentFilters = { search: searchQuery, status: statusFilter };

  const renderContent = () => {
    if (allOrdersLoading) return <LoadingState />;
    if (allOrdersError) {
      return (
        <ErrorState
          message={allOrdersError}
          onRetry={() => dispatch(fetchAllOrders({ page, limit: 20, search: searchQuery, status: statusFilter }))}
        />
      );
    }
    if (allOrders.length === 0) return <EmptyState />;
    return null;
  };

  const emptyOrStateContent = renderContent();
  const { page: currentPage = 1, pages = 0, total = 0 } = allOrdersPagination || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6 overflow-x-hidden">

      <DetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} />

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          saving={updating}
          onClose={() => setEditingOrder(null)}
          onSave={handleSaveOrder}
        />
      )}

      <div className="space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ExportButtons currentFilters={currentFilters} />
            <BulkInvoiceButton selectedOrderIds={selectedIds} />
          </div>
        </div>

        {/* Search + filter */}
        <div className="p-3 bg-white rounded-xl border border-gray-100 flex flex-col gap-3 sm:flex-row sm:p-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order # or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
          {!emptyOrStateContent && allOrders.length > 0 && (
            <label className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={selectedIds.length === allOrders.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              Select all on page
            </label>
          )}
          {emptyOrStateContent || allOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              selected={selectedIds.includes(order._id)}
              onToggleSelect={toggleSelect}
              onView={setViewingOrder}
              onEdit={setEditingOrder}
              onDelete={handleDelete}
            />
          ))}
          {!emptyOrStateContent && (
            <PaginationBar page={currentPage} pages={pages} total={total} onPageChange={setPage} />
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={allOrders.length > 0 && selectedIds.length === allOrders.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300"
                    aria-label="Select all orders on page"
                  />
                </th>
                {["Order", "Email", "Date", "Total", "Status", "Payment", "Actions"].map((col) => (
                  <th key={col} className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allOrdersLoading || allOrdersError || allOrders.length === 0 ? (
                <tr><td colSpan={8}>{emptyOrStateContent}</td></tr>
              ) : (
                allOrders.map((order) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    selected={selectedIds.includes(order._id)}
                    onToggleSelect={toggleSelect}
                    onView={setViewingOrder}
                    onEdit={setEditingOrder}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
          {!emptyOrStateContent && (
            <PaginationBar page={currentPage} pages={pages} total={total} onPageChange={setPage} />
          )}
        </div>

        {deleting && (
          <p className="text-center text-xs text-gray-400">Deleting order...</p>
        )}
      </div>
    </div>
  );
};

export default Orders;
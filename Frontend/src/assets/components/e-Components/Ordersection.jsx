import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrders,
  cancelOrder,
  clearOrderError,
} from "../redux_Toolkit/OrderSlice"; // 🔧 adjust path to match your project

const CANCELLABLE_STATUSES = ["pending", "processing"];

const statusStyle = (status) => {
  switch ((status || "").toLowerCase()) {
    case "delivered":
      return "bg-[#333333] text-white";
    case "cancelled":
      return "border border-[#333333] text-[#333333]";
    default:
      return "bg-[#f0f0f0] text-[#333333]";
  }
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");

const formatCurrency = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

export default function OrderSection() {
  const dispatch = useDispatch();
  const { orders, loading, error, cancelling } = useSelector((state) => state.orders);
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    setCancellingId(id);
    dispatch(clearOrderError());
    await dispatch(cancelOrder(id));
    setCancellingId(null);
  };

  const handleRefresh = () => {
    dispatch(fetchOrders({ force: true }));
  };

  return (
    <section className="w-full bg-white text-[#333333]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">Your Orders</h2>
          <p className="text-sm text-[#777777]">{orders.length} order{orders.length === 1 ? "" : "s"}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="rounded-full border border-[#333333] px-4 py-2 text-sm font-medium text-[#333333] active:opacity-70"
        >
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 rounded-md border border-[#333333] bg-[#f5f5f5] px-3 py-2 text-sm sm:mx-6">
          {error}
        </div>
      )}

      {/* Loading / empty */}
      {loading && orders.length === 0 && (
        <p className="px-4 py-6 text-sm text-[#777777] sm:px-6">Loading orders...</p>
      )}

      {!loading && orders.length === 0 && (
        <div className="px-4 py-10 text-center sm:px-6">
          <p className="text-sm text-[#777777]">You haven't placed any orders yet.</p>
        </div>
      )}

      {/* Orders list */}
      <div className="divide-y divide-[#e5e5e5] px-4 sm:px-6">
        {orders.map((order) => {
          const isExpanded = expandedId === order._id;
          const canCancel = CANCELLABLE_STATUSES.includes((order.status || "").toLowerCase());
          const items = order.items || order.orderItems || [];

          return (
            <div key={order._id} className="py-4">
              <button
                onClick={() => toggleExpand(order._id)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    Order #{order._id?.slice(-8)?.toUpperCase()}
                  </p>
                  <p className="text-xs text-[#999999]">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyle(order.status)}`}>
                    {order.status || "unknown"}
                  </span>
                  <span className="text-sm text-[#777777]">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </button>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-[#4d4d4d]">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
                <p className="text-sm font-semibold">{formatCurrency(order.totalAmount ?? order.total)}</p>
              </div>

              {isExpanded && (
                <div className="mt-3 space-y-3 rounded-lg border border-[#e5e5e5] p-3">
                  {items.map((item, i) => (
                    <div key={item._id || i} className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name || "product"}
                          className="h-12 w-12 shrink-0 rounded-md object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name || item.product?.name}</p>
                        <p className="text-xs text-[#999999]">
                          Qty {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium">
                        {formatCurrency((item.price || 0) * (item.quantity || 1))}
                      </p>
                    </div>
                  ))}

                  {order.shippingAddress && (
                    <div className="border-t border-[#e5e5e5] pt-3 text-xs text-[#4d4d4d]">
                      <p className="mb-1 font-medium text-[#333333]">Shipping address</p>
                      <p>
                        {[
                          order.shippingAddress.street,
                          order.shippingAddress.city,
                          order.shippingAddress.state,
                          order.shippingAddress.zip || order.shippingAddress.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(order._id)}
                      disabled={cancelling && cancellingId === order._id}
                      className="mt-2 w-full rounded-full border border-[#333333] py-2 text-sm font-medium text-[#333333] disabled:opacity-50"
                    >
                      {cancelling && cancellingId === order._id ? "Cancelling..." : "Cancel order"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
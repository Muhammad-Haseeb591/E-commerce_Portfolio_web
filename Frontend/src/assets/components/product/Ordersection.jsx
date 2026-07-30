import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrders,
  cancelOrder,
  clearOrderError,
} from "../store/orderSlice"; // 🔧 adjust path to match your project
import { API_URL } from "../../../config/api";

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

const getStatusColor = (status) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    placed: "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

const formatCurrency = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

export default function OrderSection() {
  const dispatch = useDispatch();
  const { orders, loading, error, cancelling } = useSelector((state) => state.orders);
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // ── Track-an-order (guest/public) states — kept separate from Redux state above ──
  const [showTracker, setShowTracker] = useState(false);
  const [trackOrderNumber, setTrackOrderNumber] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

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

  const handleTrack = async (e) => {
    e.preventDefault();
    setTrackLoading(true);
    setTrackError("");
    setTrackedOrder(null);

    try {
      const res = await fetch(
        `${API_URL}/api/orders/track/${trackOrderNumber}?email=${encodeURIComponent(
          trackEmail
        )}`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (data.success) {
        setTrackedOrder(data.order);
      } else {
        setTrackError(data.message || "Order not found");
      }
    } catch {
      setTrackError("Failed to fetch order details");
    } finally {
      setTrackLoading(false);
    }
  };

  return (
    <section className="w-full bg-white text-[#333333]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">Your Orders</h2>
          <p className="text-sm text-[#777777]">
            {orders.length} order{orders.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTracker((prev) => !prev)}
            className="rounded-full border border-[#333333] px-4 py-2 text-sm font-medium text-[#333333] active:opacity-70"
          >
            {showTracker ? "Hide Tracker" : "Track an Order"}
          </button>
          <button
            onClick={handleRefresh}
            className="rounded-full border border-[#333333] px-4 py-2 text-sm font-medium text-[#333333] active:opacity-70"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ── Track an order (guest lookup) — untouched logic from OrderTracking ── */}
      {showTracker && (
        <div className="border-b border-[#e5e5e5] px-4 py-6 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-[#e5e5e5]">
              <form onSubmit={handleTrack} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Number
                  </label>
                  <input
                    type="text"
                    value={trackOrderNumber}
                    onChange={(e) => setTrackOrderNumber(e.target.value)}
                    placeholder="e.g., 1043"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[#333333] focus:ring-1 focus:ring-[#333333]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={trackEmail}
                    onChange={(e) => setTrackEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[#333333] focus:ring-1 focus:ring-[#333333]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="w-full bg-[#333333] text-white font-bold py-3 rounded-xl hover:bg-[#1f1f1f] transition disabled:opacity-50"
                >
                  {trackLoading ? "Tracking..." : "Track Order"}
                </button>
              </form>

              {trackError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4">
                  {trackError}
                </div>
              )}
            </div>

            {/* Tracked order details */}
            {trackedOrder && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#e5e5e5]">
                <div className="bg-[#333333] text-white p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm opacity-80">Order Number</p>
                      <p className="text-2xl font-bold">#{trackedOrder.orderNumber}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        trackedOrder.status
                      )}`}
                    >
                      {trackedOrder.status.charAt(0).toUpperCase() +
                        trackedOrder.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm opacity-80 mt-2">
                    Placed on {new Date(trackedOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="p-6 border-b">
                  <h3 className="font-semibold text-[#333333] mb-4">Items</h3>
                  <div className="space-y-3">
                    {trackedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} × ${item.price?.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${trackedOrder.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-b">
                  <h3 className="font-semibold text-[#333333] mb-2">Shipping Address</h3>
                  <p className="text-gray-600">
                    {trackedOrder.shippingAddress?.address}
                    <br />
                    {trackedOrder.shippingAddress?.city},{" "}
                    {trackedOrder.shippingAddress?.state}{" "}
                    {trackedOrder.shippingAddress?.zip}
                  </p>
                </div>

                {trackedOrder.trackingNumber && (
                  <div className="p-6 bg-gray-50">
                    <h3 className="font-semibold text-[#333333] mb-2">
                      Tracking Information
                    </h3>
                    <p className="text-gray-600">
                      <span className="font-medium">Carrier:</span> {trackedOrder.carrier}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Tracking Number:</span>{" "}
                      {trackedOrder.trackingNumber}
                    </p>
                    {trackedOrder.estimatedDelivery && (
                      <p className="text-gray-600">
                        <span className="font-medium">Estimated Delivery:</span>{" "}
                        {new Date(trackedOrder.estimatedDelivery).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="p-6">
                  <h3 className="font-semibold text-[#333333] mb-4">Order Timeline</h3>
                  <div className="space-y-4">
                    {trackedOrder.statusHistory
                      ?.slice()
                      .reverse()
                      .map((history, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                index === 0 ? "bg-[#333333]" : "bg-gray-300"
                              }`}
                            ></div>
                            {index < (trackedOrder.statusHistory?.length || 0) - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                            )}
                          </div>
                          <div>
                            <p
                              className={`font-medium ${
                                index === 0 ? "text-[#333333]" : "text-gray-500"
                              }`}
                            >
                              {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                            </p>
                            <p className="text-sm text-gray-400">
                              {new Date(history.updatedAt).toLocaleString()}
                            </p>
                            {history.note && (
                              <p className="text-sm text-gray-500 mt-1">{history.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error banner (Redux orders) */}
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
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyle(
                      order.status
                    )}`}
                  >
                    {order.status || "unknown"}
                  </span>
                  <span className="text-sm text-[#777777]">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </button>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-[#4d4d4d]">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
                <p className="text-sm font-semibold">
                  {formatCurrency(order.totalAmount ?? order.total)}
                </p>
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
                        <p className="truncate text-sm font-medium">
                          {item.name || item.product?.name}
                        </p>
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
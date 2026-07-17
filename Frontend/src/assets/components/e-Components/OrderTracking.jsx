import { useState, memo } from "react";
import { Package, Truck, CheckCircle2, Clock, XCircle, ChevronDown, MapPin, ClipboardList, AlertTriangle } from "lucide-react";

import {
  GLASS,
  formatDate,
  formatMoney,
  getProductThumb,
  StatusBadge,
  StatePanel,
  SkeletonRows,
  ViewableThumb,
} from "./Activityshared";

/**
 * OrderTracking.jsx
 * -----------------
 * Child component of AccountActivity. Renders the "Orders" tab: order
 * history list, each card expandable to show a stitched-thread tracking
 * timeline, shipping address, and a cancel action for cancellable orders.
 *
 * Props:
 *  - orders: array of order objects
 *  - loading: bool
 *  - error: string | null
 *  - cancelling: bool (true while a cancel request is in flight)
 *  - onCancel: (orderId) => void
 *  - onView: (src, alt) => void   // opens the shared image lightbox
 */

const STATUS_STEPS = [
  { key: "placed", label: "Placed", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const CANCELLABLE_STATUSES = ["pending", "placed", "processing"];

const TrackingTimeline = memo(({ order }) => {
  if (order.status === "cancelled") {
    return (
      <div className="ia-body mt-3 flex items-center gap-2 rounded-lg bg-red-50/60 px-3 py-2 text-xs font-medium text-red-600">
        <XCircle size={14} className="flex-shrink-0" strokeWidth={2} />
        Order cancelled
      </div>
    );
  }

  const effectiveStatus = order.status === "pending" ? "placed" : order.status;
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === effectiveStatus);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="mt-5">
      <div className="flex items-start">
        {STATUS_STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i <= activeIndex;
          const historyEntry = order.trackingHistory?.find((h) => h.status === step.key);

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <div
                  className={`h-px flex-1 ${i === 0 ? "opacity-0" : ""} ${
                    done ? "bg-[#333333]" : "border-t border-dashed border-gray-300 bg-transparent"
                  }`}
                />
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-colors sm:h-8 sm:w-8 ${
                    done
                      ? "border-[#333333] bg-[#333333] text-white shadow-[0_2px_8px_rgba(51,51,51,0.35)]"
                      : "border-white/70 bg-white/50 text-gray-300 backdrop-blur-sm"
                  }`}
                >
                  <Icon size={13} className="sm:hidden" />
                  <Icon size={15} className="hidden sm:block" />
                </div>
                <div
                  className={`h-px flex-1 ${i === STATUS_STEPS.length - 1 ? "opacity-0" : ""} ${
                    done ? "bg-[#333333]" : "border-t border-dashed border-gray-300 bg-transparent"
                  }`}
                />
              </div>
              <span className={`ia-body mt-2 text-[10px] font-medium sm:text-xs ${done ? "text-gray-900" : "text-gray-400"}`}>
                {step.label}
              </span>
              {historyEntry?.date && (
                <span className="ia-body hidden text-[11px] text-gray-400 sm:block">{formatDate(historyEntry.date)}</span>
              )}
            </div>
          );
        })}
      </div>

      {order.shippingAddress && (
        <div className="ia-body mt-5 flex items-start gap-2 rounded-xl bg-white/40 px-4 py-3 text-sm text-gray-600 backdrop-blur-sm">
          <MapPin size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
          <span>
            {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.zip}
          </span>
        </div>
      )}
    </div>
  );
});

const OrderCard = memo(({ order, onCancel, cancelling, onView }) => {
  const [expanded, setExpanded] = useState(false);
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const panelId = `order-panel-${order._id}`;

  return (
    <div className={`${GLASS} relative overflow-hidden rounded-[22px]`}>
      <div className="flex w-full items-center gap-3 p-4">
        <div className="flex -space-x-3">
          {(order.items || []).slice(0, 3).map((item, i) => (
            <ViewableThumb
              key={item._id || i}
              src={getProductThumb(item)}
              alt={item.name}
              onView={onView}
              className="h-11 w-11 rounded-2xl border-2 border-white ring-1 ring-black/5 sm:h-12 sm:w-12"
            />
          ))}
          {(order.items?.length || 0) > 3 && (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-white bg-gray-100 text-xs font-medium text-gray-500 ring-1 ring-black/5 sm:h-12 sm:w-12">
              +{order.items.length - 3}
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="ia-body flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none"
        >
          <div className="min-w-0 flex-1">
            <p className="ia-display truncate text-[15px] font-medium tracking-tight text-gray-900">
              Order #{order.orderNumber}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(order.createdAt)} · {order.items?.length || 0} item
              {order.items?.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex flex-shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm font-semibold text-gray-900">{formatMoney(order.total)}</span>
            <StatusBadge status={order.status} />
          </div>

          <ChevronDown
            size={16}
            className={`ml-1 flex-shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <div className="relative" aria-hidden="true">
        <span className="absolute -left-2.5 top-0 h-5 w-5 -translate-y-1/2 rounded-full bg-[#f4f3f0]" />
        <span className="absolute -right-2.5 top-0 h-5 w-5 -translate-y-1/2 rounded-full bg-[#f4f3f0]" />
        <div className="mx-4 border-t border-dashed border-gray-300/80" />
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div id={panelId} className="px-4 pb-5 pt-3">
            <TrackingTimeline order={order} />
            {canCancel && (
              <button
                onClick={() => onCancel(order._id)}
                disabled={cancelling}
                className="ia-body mt-4 rounded text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {cancelling ? "Cancelling…" : "Cancel order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default function OrderTracking({ orders, loading, error, cancelling, onCancel, onView }) {
  if (loading) return <SkeletonRows />;

  if (error) {
    return (
      <StatePanel
        icon={AlertTriangle}
        tone="error"
        title="Couldn't load your orders"
        description="Something went wrong on our end. Please try again in a moment."
      />
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <StatePanel
        icon={ClipboardList}
        title="No orders yet"
        description="Once you place an order, you'll be able to track it here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order._id} order={order} onCancel={onCancel} cancelling={cancelling} onView={onView} />
      ))}
    </div>
  );
}
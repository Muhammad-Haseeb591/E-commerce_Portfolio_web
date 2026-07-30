import { X, User, MapPin, Phone, Mail, Package } from "lucide-react";
import { StatusBadge, PaymentBadge } from "../AdminOrders/StatusBadges";
import { formatDate, formatMoney, swatchStyle, groupOrderItemsByProduct } from "../AdminOrders/orderHelpers";

// One row inside the "customer info" card — icon + label + value.
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-[11px] text-gray-400 leading-tight">{label}</p>
      <p className="text-sm text-gray-900 break-words">{value || "—"}</p>
    </div>
  </div>
);

// One product line: picture (first available), name, and a color+quantity
// breakdown — if the same product was ordered in 2+ colors they all show
// here together instead of as separate rows.
const ProductLine = ({ product }) => (
  <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
    {product.displayImage ? (
      <img
        src={product.displayImage}
        alt={product.name}
        className="w-14 h-14 object-cover rounded-lg border border-gray-200 shrink-0"
      />
    ) : (
      <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0" />
    )}

    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
        <span className="text-sm text-gray-700 font-semibold shrink-0">
          {formatMoney(product.price)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {product.variants.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-600"
          >
            {v.color ? (
              <>
                <span
                  className="w-3 h-3 rounded-full border border-gray-300 shrink-0"
                  style={swatchStyle(v.color)}
                />
                {v.color}
              </>
            ) : (
              "Qty"
            )}
            <span className="font-medium text-gray-800">× {v.quantity}</span>
          </span>
        ))}
      </div>

      {product.variants.length > 1 && (
        <p className="text-[11px] text-gray-400 mt-1">Total qty: {product.totalQuantity}</p>
      )}
    </div>
  </div>
);

export const DetailsModal = ({ order, onClose }) => {
  if (!order) return null;
  const addr = order.shippingAddress || {};
  const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(" ");
  const location = [addr.line1, addr.city, addr.state, addr.zip].filter(Boolean).join(", ");
  const products = groupOrderItemsByProduct(order.items);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.orderNumber || order._id}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 shrink-0">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Status + payment, front and center */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
          </div>

          {/* Customer info card — name, contact, location */}
          <div className="bg-gray-50 rounded-xl p-3.5 space-y-3">
            <InfoRow icon={User} label="Name" value={fullName} />
            <InfoRow icon={Mail} label="Email" value={order.email} />
            <InfoRow icon={Phone} label="Contact" value={addr.phone} />
            <InfoRow
              icon={MapPin}
              label="Location"
              value={location ? `${location}${addr.country ? `, ${addr.country}` : ""}` : null}
            />
          </div>

          {/* Total */}
          <div className="flex justify-between items-center px-1">
            <span className="text-sm text-gray-500">Order Total</span>
            <span className="text-base font-semibold text-gray-900">
              {formatMoney(order.totalAmount)}
            </span>
          </div>

          {/* Products — grouped by product, colors + quantity shown together */}
          {products.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <Package className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                  Items ({products.length})
                </p>
              </div>
              <div className="border border-gray-100 rounded-xl px-3">
                {products.map((product) => (
                  <ProductLine key={product.key} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
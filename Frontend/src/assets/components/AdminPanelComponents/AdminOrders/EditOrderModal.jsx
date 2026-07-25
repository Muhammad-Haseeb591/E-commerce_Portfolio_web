import { useState } from "react";
import { X, CreditCard, Banknote } from "lucide-react";
import { STATUS_OPTIONS } from "./orderHelpers";

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

export const EditOrderModal = ({ order, onClose, onSave, saving }) => {
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
    paymentMethod: order.paymentMethod || "cod", // enum: cod | card
    paymentStatus: order.paymentStatus || "unpaid", // enum: unpaid | paid | failed
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

export default EditOrderModal;
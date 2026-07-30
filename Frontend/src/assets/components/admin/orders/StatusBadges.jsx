import { CreditCard, Banknote, CheckCircle2, XCircle } from "lucide-react";
import { STATUS_STYLES } from "./orderHelpers";

export const StatusBadge = ({ status }) => (
  <span
    className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${
      STATUS_STYLES[status] || "bg-gray-100 text-gray-700"
    }`}
  >
    {status || "—"}
  </span>
);

// Matches schema enums exactly: cod|card, unpaid|paid|failed
export const PaymentBadge = ({ method, status }) => {
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
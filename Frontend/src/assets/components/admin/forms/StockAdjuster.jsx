import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

/**
 * 🔑 StockAdjuster
 * Pehlay stock field me direct final number type karna parta tha
 * (jis se ghalti se purana stock overwrite ho jata tha). Ab yahan
 * sirf ek "amount" likho aur + ya - button se current stock me
 * add/subtract ho jata hai — current value hamesha bayen taraf
 * badge me dikhti rehti hai.
 */
const StockAdjuster = ({ value, onChange, size = "sm" }) => {
  const [delta, setDelta] = useState("");
  const current = Number(value) || 0;

  const apply = (sign) => {
    const amount = Number(delta);
    if (!delta || Number.isNaN(amount) || amount <= 0) return;
    const next = Math.max(0, current + sign * amount);
    onChange(String(next));
    setDelta("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      apply(1);
    }
  };

  const badgeClass =
    size === "sm"
      ? "min-w-[2.75rem] px-2 py-2 text-xs"
      : "min-w-[3.25rem] px-2.5 py-2.5 text-sm";

  return (
    <div className="flex items-center gap-1">
      <span
        className={`shrink-0 text-center rounded-lg bg-gray-100 border border-gray-200 text-gray-700 font-medium ${badgeClass}`}
        title="Current stock"
      >
        {current}
      </span>
      <input
        type="number"
        min="0"
        placeholder="Qty"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-16 px-2 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
      />
      <button
        type="button"
        onClick={() => apply(1)}
        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 shrink-0"
        aria-label="Add to stock"
        title="Add to stock"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => apply(-1)}
        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 shrink-0"
        aria-label="Subtract from stock"
        title="Subtract from stock"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default StockAdjuster;
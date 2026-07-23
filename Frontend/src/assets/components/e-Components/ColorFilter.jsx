import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setFilter } from '../redux_Toolkit/fetcherSlice' // 🔑 apna actual path confirm kar lena

// 🔑 EXACTLY ProductForm.jsx ke COLOR_OPTIONS jaisi list (same strings) —
// taake yahan se select kiya gaya color, product.color se hamesha match ho.
// Screenshot mein sirf 8 swatches thay (Navy, Yellow, Pink, Multicolor
// missing) — ab poori 12-color list hai.
const COLORS = [
  { value: "Black", hex: "#000000" },
  { value: "White", hex: "#ffffff" },
  { value: "Red", hex: "#dc2626" },
  { value: "Navy", hex: "#1e3a5f" },
  { value: "Blue", hex: "#2563eb" },
  { value: "Grey", hex: "#9ca3af" },
  { value: "Brown", hex: "#78350f" },
  { value: "Beige", hex: "#e8dcc8" },
  { value: "Green", hex: "#16a34a" },
  { value: "Yellow", hex: "#eab308" },
  { value: "Pink", hex: "#ec4899" },
  {
    value: "Multicolor",
    hex: "linear-gradient(135deg, red, orange, yellow, green, blue, violet)",
  },
];

const swatchStyle = (hex) =>
  hex.startsWith("linear") ? { background: hex } : { backgroundColor: hex };

const ColorFilter = () => {
  const dispatch = useDispatch();
  // 🔑 Data seedha fetcherSlice se — koi local/dummy state nahi.
  const { filters } = useSelector((state) => state.FetchPrducts);

  // 🔑 filters.color single string hai (multi-select nahi) — same color
  // dobara click = clear, naya color click = us par switch.
  const toggleColor = (value) => {
    const next = filters.color?.toLowerCase() === value.toLowerCase() ? "" : value;
    dispatch(setFilter({ key: "color", value: next }));
  };

  return (
    <div className="w-full max-w-[300px] border border-gray-100 rounded-[10px] px-4 sm:px-5 py-3 sm:py-4 m-1 hover:border-gray-200 transition-colors">
      <details open>
        <summary className="list-none cursor-pointer">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-sm font-bold uppercase tracking-wide text-gray-900">Color</span>
            <svg className="w-2.5 h-1.5 text-gray-400" aria-hidden="true" focusable="false" viewBox="0 0 10 6">
              <path fillRule="evenodd" clipRule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor" />
            </svg>
          </div>
        </summary>

        {/* 🔑 Compact swatch grid — koi checkbox/text nahi, sirf circles
            (screenshot jaisa), flex-wrap se khud multiple rows ban jate hain */}
        <div className="flex flex-wrap gap-3 mt-4">
          {COLORS.map((c) => {
            const isActive = filters.color?.toLowerCase() === c.value.toLowerCase();
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleColor(c.value)}
                title={c.value}
                aria-label={c.value}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "ring-2 ring-black ring-offset-2"
                    : "ring-1 ring-gray-200 ring-offset-1 hover:ring-gray-400"
                }`}
                style={swatchStyle(c.hex)}
              >
                {isActive && (
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke={c.value === "White" ? "black" : "white"}
                    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </details>
    </div>
  )
}

export default ColorFilter
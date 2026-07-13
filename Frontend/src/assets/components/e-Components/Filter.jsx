import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setFilter, setFilters } from '../redux_Toolkit/fetcherSlice'
import { useFilteredProducts } from '../hooks/useFilteredProducts'

// 🔑 Category hata di gayi hai, is liye sab sizes ek hi combined list mein
// dikhaye ja rahe hain (women + men + kids ka union, duplicates hataye
// gaye hain). Agar tum chahte ho ke sizes category-specific hi rahein
// (bina category selector ke), to batao — is case mein hum size ko khud
// "type" bhi assign kar sakte hain product data ke through.
const ALL_SIZES = Array.from(
  new Set([
    "28", "29", "30", "31", "32", "33", "34", "35",
    "36", "37", "38", "39", "40", "41", "42", "43",
    "44", "45", "46",
  ])
).sort((a, b) => Number(a) - Number(b));

// 🔑 Common shoe colors — swatch hex + backend value
const COLORS = [
  { value: "black", hex: "#000000" },
  { value: "white", hex: "#ffffff" },
  { value: "red", hex: "#cc0000" },
  { value: "blue", hex: "#1e3a8a" },
  { value: "grey", hex: "#9ca3af" },
  { value: "brown", hex: "#78350f" },
  { value: "beige", hex: "#e7d8c9" },
  { value: "green", hex: "#166534" },
];

const Filter = ({ onClose }) => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state.FetchPrducts);

  // 🔑 Same catalog + filters state se live count nikalta hai —
  // "Apply Filters" button ab batayega abhi kitne products match ho rahe hain,
  // real-time (color/size click karte hi update ho jayega).
  const filteredProducts = useFilteredProducts();

  // 🔑 Price sirf local state mein rakha hai — "Apply" tak fetch nahi chalega.
  // Color, Size turant Redux mein jaate hain (click-to-filter UX) — isi
  // liye ye dono cumulative / point-by-point mehsoos hote hain: jaise hi
  // ek filter set hota hai, filteredProducts turant us pe filter ho jata
  // hai, aur agla filter usi list ke upar aur filter karta hai (AND logic
  // useFilteredProducts hook ke andar honi chahiye).
  const [minPrice, setMinPrice] = useState(filters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || "");

  const selectedSizes = filters.sizes ? filters.sizes.split(",").filter(Boolean) : [];

  const toggleSize = (size) => {
    const isSelected = selectedSizes.includes(size);
    const updated = isSelected
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    dispatch(setFilter({ key: "sizes", value: updated.join(",") }));
  };

  // 🔑 Color ko trim + lowercase kar ke bhejo taake case/whitespace
  // mismatch se filter "chup ke" fail na ho (agar hook mein comparison
  // case-sensitive hai to ye extra safety hai).
  const handleColor = (color) => {
    const next = filters.color === color ? "" : color;
    dispatch(setFilter({ key: "color", value: next }));
  };

  const handleApplyPrice = () => {
    dispatch(
      setFilters({
        minPrice: minPrice === "" ? "" : Number(minPrice),
        maxPrice: maxPrice === "" ? "" : Number(maxPrice),
      })
    );
  };

  const handleClearAll = () => {
    setMinPrice("");
    setMaxPrice("");
    dispatch(setFilters({ color: "", minPrice: "", maxPrice: "", sizes: "" }));
  };

  const activeCount =
    (filters.color ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    selectedSizes.length;

  return (
    <div className="w-[300px] min-h-screen font-sans bg-white flex flex-col shadow-[0_0_24px_rgba(0,0,0,0.06)]">

      {/* Header */}
      <div className="flex items-center justify-between px-[22px] py-[20px] border-b border-gray-100">
        <div className="flex items-center gap-[10px]">
          <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 20 20" fill="none">
  <path
    fillRule="evenodd"
    d="M4.833 6.5a1.667 1.667 0 1 1 3.334 0 1.667 1.667 0 0 1-3.334 0ZM4.05 7H2.5a.5.5 0 0 1 0-1h1.55a2.5 2.5 0 0 1 4.9 0h8.55a.5.5 0 0 1 0 1H8.95a2.5 2.5 0 0 1-4.9 0Zm11.117 6.5a1.667 1.667 0 1 0-3.334 0 1.667 1.667 0 0 0 3.334 0ZM13.5 11a2.5 2.5 0 0 1 2.45 2h1.55a.5.5 0 0 1 0 1h-1.55a2.5 2.5 0 0 1-4.9 0H2.5a.5.5 0 0 1 0-1h8.55a2.5 2.5 0 0 1 2.45-2Z"
    fill="black"
  />
</svg>      
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[2px] leading-none">Filters</p>
            {activeCount > 0 && (
              <p className="text-[11px] text-gray-400 mt-[3px]">{activeCount} active</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-[16px] py-[14px] flex flex-col gap-[10px]">

        {/* ── Price ───────────────────────────────── */}
        <div className="border border-gray-100 rounded-[10px] px-[16px] py-[14px] hover:border-gray-200 transition-colors">
          <details open>
            <summary className="list-none cursor-pointer">
              <div className="flex justify-between items-center pb-[10px] border-b border-gray-100">
                <span className="text-[13px] font-semibold uppercase tracking-[1px]">Price</span>
                <svg className="w-[10px] h-[6px] text-gray-400" viewBox="0 0 10 6">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor"/>
                </svg>
              </div>
            </summary>

            <p className="text-[11px] text-gray-400 mt-[12px] mb-[10px]">Highest price is PKR 29,950</p>

            <div className="flex items-center gap-[8px]">
              <div className="flex-1 relative">
                <input
                  className="w-full border border-gray-200 rounded-[8px] px-[10px] pt-[19px] pb-[7px] text-[13px] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  type="number" placeholder="0" min="0" max="29950"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onBlur={handleApplyPrice}
                />
                <label className="absolute top-[6px] left-[10px] text-[10px] text-gray-400">From (Rs)</label>
              </div>
              <span className="text-gray-300 mt-[8px]">—</span>
              <div className="flex-1 relative">
                <input
                  className="w-full border border-gray-200 rounded-[8px] px-[10px] pt-[19px] pb-[7px] text-[13px] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  type="number" placeholder="29950" min="0" max="29950"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onBlur={handleApplyPrice}
                />
                <label className="absolute top-[6px] left-[10px] text-[10px] text-gray-400">To (Rs)</label>
              </div>
            </div>
          </details>
        </div>

        {/* ── Color ───────────────────────────────── */}
        <div className="border border-gray-100 rounded-[10px] px-[16px] py-[14px] hover:border-gray-200 transition-colors">
          <details open>
            <summary className="list-none cursor-pointer">
              <div className="flex justify-between items-center pb-[10px] border-b border-gray-100">
                <span className="text-[13px] font-semibold uppercase tracking-[1px]">Color</span>
                <svg className="w-[10px] h-[6px] text-gray-400" viewBox="0 0 10 6">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor"/>
                </svg>
              </div>
            </summary>

            {filters.color && (
              <p className="text-[11px] text-gray-400 mt-[12px] mb-[6px]">
                Selected: <span className="text-black font-medium capitalize">{filters.color}</span>
              </p>
            )}

            <div className="mt-[14px] flex flex-wrap gap-[12px]">
              {COLORS.map((c) => {
                const isActive = filters.color === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => handleColor(c.value)}
                    title={c.value}
                    className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isActive ? "ring-2 ring-black ring-offset-2" : "ring-1 ring-gray-200 ring-offset-1 hover:ring-gray-400"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isActive && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.value === "white" ? "black" : "white"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </details>
        </div>

        {/* ── Size ─────────────────────────────────── */}
        <div className="border border-gray-100 rounded-[10px] px-[16px] py-[14px] hover:border-gray-200 transition-colors">
          <details open>
            <summary className="list-none cursor-pointer">
              <div className="flex justify-between items-center pb-[10px] border-b border-gray-100">
                <span className="text-[13px] font-semibold uppercase tracking-[1px]">Size</span>
                <svg className="w-[10px] h-[6px] text-gray-400" viewBox="0 0 10 6">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor"/>
                </svg>
              </div>
            </summary>

            {/* 🔑 "Info" line — cumulative selection ka status yahan dikhta hai */}
            <p className="text-[11px] text-gray-400 mt-[12px] mb-[10px]">
              {selectedSizes.length > 0
                ? `${selectedSizes.length} size${selectedSizes.length > 1 ? "s" : ""} selected: ${selectedSizes.join(", ")}`
                : "Select one or more sizes"}
            </p>

            <div className="grid grid-cols-4 gap-[8px]">
              {ALL_SIZES.map((size) => {
                const isActive = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`h-[38px] rounded-[8px] text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-black text-white shadow-sm"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </details>
        </div>

      </div>

      {/* Footer */}
      <div className="px-[16px] py-[16px] border-t border-gray-100 flex flex-col gap-[8px]">
        <button
          onClick={() => { handleApplyPrice(); onClose(); }}
          className="w-full bg-black text-white text-[13px] font-bold uppercase tracking-[2px] py-[13px] rounded-[8px] hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
        >
          Apply Filters ({filteredProducts.length})
        </button>
        <button
          onClick={handleClearAll}
          className="w-full bg-white text-gray-500 text-[12px] font-medium uppercase tracking-[1px] py-[10px] rounded-[8px] border border-gray-200 hover:bg-gray-50 hover:text-black transition-colors duration-200 cursor-pointer"
        >
          Clear All Filters
        </button>
      </div>

    </div>
  )
}

export default Filter
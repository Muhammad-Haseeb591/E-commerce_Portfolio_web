import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import '../../components/scrollbar.css'
import { setFilter } from '../redux_Toolkit/fetcherSlice' // 🔑 apna actual path confirm kar lena

// 🔑 EXACTLY ProductForm.jsx ke COLOR_OPTIONS jaisi list (same strings) —
// taake yahan se select kiya gaya color, product.color se hamesha match ho.
const COLORS = [
  { value: "Black", hex: "#000000" },
  { value: "White", hex: "#ffffff" },
  { value: "Grey", hex: "#9ca3af" },
  { value: "Navy", hex: "#1e3a5f" },
  { value: "Blue", hex: "#2563eb" },
  { value: "Red", hex: "#dc2626" },
  { value: "Green", hex: "#16a34a" },
  { value: "Yellow", hex: "#eab308" },
  { value: "Pink", hex: "#ec4899" },
  { value: "Brown", hex: "#78350f" },
  { value: "Beige", hex: "#e8dcc8" },
  {
    value: "Multicolor",
    hex: "linear-gradient(135deg, red, orange, yellow, green, blue, violet)",
  },
];

const swatchStyle = (hex) =>
  hex.startsWith("linear") ? { background: hex } : { backgroundColor: hex };

const ColorFilter = () => {
  const dispatch = useDispatch();
  // 🔑 Yehi jagah hai jahan data seedha fetcherSlice se aata hai —
  // "catalog" poora product list hai (fetchCatalog se), "filters" abhi
  // ka selected state hai. Koi local/dummy data nahi.
  const { catalog, filters } = useSelector((state) => state.FetchPrducts);

  // 🔑 Har color ke saamne live count — catalog mein us color ke kitne
  // products hain (case-insensitive match, jaisa useFilteredProducts
  // mein bhi hai). Sirf wahi colors dikhaye jate hain jinka count > 0.
  const colorsWithCount = useMemo(() => {
    return COLORS.map((c) => {
      const count = (catalog || []).filter(
        (p) => (p.color || "").toLowerCase() === c.value.toLowerCase()
      ).length;
      return { ...c, count };
    }).filter((c) => c.count > 0);
  }, [catalog]);

  // 🔑 Redux mein filters.color ek single string hai (multi-select nahi) —
  // is liye checkbox radio jaisa behave karta hai: same color dobara
  // click = clear, naya color click = us par switch.
  const toggleColor = (value) => {
    const next = filters.color?.toLowerCase() === value.toLowerCase() ? "" : value;
    dispatch(setFilter({ key: "color", value: next }));
  };

  return (
    <div className='w-[248.667px] py-[20px] font-sans'>
      <div className='flex box-border w-[250px] max:h-[198.33px] py-[10px] border-[1px] rounded-[5px] m-[5px] border-gray-200'>
        <details className='box-border max-h-[326.667px] py-[10px] w-[248.667px] px-[20px]' open>
          <summary className='list-none pt-[15px] pb-[5px] pr-[17.5px]'>
            <div className='flex border-b-[1px] border-gray-200'>
              <span className='w-[191.17px] h-[29px] flex justify-between item-center'>
                Color ({colorsWithCount.length})
                <svg className='rotate-180 w-[20px] h-[6px] mt-[9px]' aria-hidden="true" focusable="false" viewBox="0 0 10 6">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor" />
                </svg>
              </span>
            </div>
          </summary>

          <div className='overflow-y-auto overflow-hidden scroll-smooth w-[208px] h-[265px] pb-[15px]'>
            {colorsWithCount.map((c) => {
              const isChecked = filters.color?.toLowerCase() === c.value.toLowerCase();
              return (
                <div key={c.value}>
                  <div className='flex justify-between relative mt-[8px] items-center'>
                    <input
                      type="checkbox"
                      className='w-[16px] h-[16px]'
                      checked={isChecked}
                      onChange={() => toggleColor(c.value)}
                    />
                    <div
                      className='left-[-36px] rounded-[50%] outline outline-offset-2 outline-gray-300 w-[20px] h-[20px] relative'
                      style={swatchStyle(c.hex)}
                    />
                    <span className='relative left-[-74px]'>
                      {c.value} ({c.count})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      </div>
    </div>
  )
}

export default ColorFilter
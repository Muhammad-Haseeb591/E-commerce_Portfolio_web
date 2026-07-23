import Filter from './Filter.jsx'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setFilters } from '../redux_Toolkit/fetcherSlice' // 🔑 apna actual path confirm kar lena

// 🔑 Dropdown label ko backend ke sortBy/order values se map karta hai
const SORT_OPTIONS = [
  { label: "Date, new to old", sortBy: "createdAt", order: "desc" },
  { label: "Price, low to high", sortBy: "price", order: "asc" },
  { label: "Price, high to low", sortBy: "price", order: "desc" },
  { label: "Name, A-Z", sortBy: "name", order: "asc" },
  { label: "Name, Z-A", sortBy: "name", order: "desc" },
];

const Main = ({ children }) => {
  const [filter, setFilter] = useState(false);
  const toggleFilter = () => {
    setFilter(!filter);
  };

  const dispatch = useDispatch();
  const { totalCount, filters } = useSelector((state) => state.FetchPrducts);

  // 🔑 Safe fallback — jab tak fetchData ka pehla response nahi aata,
  // totalCount redux mein 0 hi hota hai (initialFilters se), is liye
  // "undefined products" jaisa koi bug/flash nahi aata kisi bhi render par.
  const productCount = totalCount ?? 0;

  const currentSortLabel =
    SORT_OPTIONS.find(
      (opt) => opt.sortBy === filters.sortBy && opt.order === filters.order
    )?.label || SORT_OPTIONS[0].label;

  const handleSortChange = (e) => {
    const selected = SORT_OPTIONS.find((opt) => opt.label === e.target.value);
    if (selected) {
      dispatch(setFilters({ sortBy: selected.sortBy, order: selected.order }));
    }
  };

  return (
    <div className='mx-auto w-full py-[36px] relative md:top-[-43px] lg:top-[2px]'>

      {/* Toolbar */}
      <div className='flex justify-between w-full min-h-[58px] items-center py-[10px] px-[12px] sm:px-[20px] outline-1 outline-gray-300'>

        {/* Filter Button */}
        <div className={`transition-all duration-300 ${filter ? 'md:ml-[280px]' : 'ml-[0px]'}`}>
          <button onClick={toggleFilter} className='px-[12px] sm:px-[20px] rounded-[5px] border border-black/30 md:border-0 py-[5px] flex items-center cursor-pointer'>
            <span className='flex items-center'>
              <svg className="md:hidden size-[20px] sm:size-[25px] icon icon-filter pr-[5px]" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
                <path fillRule="evenodd" d="M4.833 6.5a1.667 1.667 0 1 1 3.334 0 1.667 1.667 0 0 1-3.334 0ZM4.05 7H2.5a.5.5 0 0 1 0-1h1.55a2.5 2.5 0 0 1 4.9 0h8.55a.5.5 0 0 1 0 1H8.95a2.5 2.5 0 0 1-4.9 0Zm11.117 6.5a1.667 1.667 0 1 0-3.334 0 1.667 1.667 0 0 0 3.334 0ZM13.5 11a2.5 2.5 0 0 1 2.45 2h1.55a.5.5 0 0 1 0 1h-1.55a2.5 2.5 0 0 1-4.9 0H2.5a.5.5 0 0 1 0-1h8.55a2.5 2.5 0 0 1 2.45-2Z" fill="currentColor"/>
              </svg>
              <span className='md:tracking-[2px] font-normal md:font-bold md:uppercase text-[14px] sm:text-[17px] md:text-[12px]'>
                Filter
              </span>
            </span>
          </button>
        </div>

        {/* Product Count — ab har width par dikhta hai (pehle "hidden
            md:block" tha, mobile par bilkul ghayab ho jata tha). UI/design
            wahi hai, sirf ab kam width par text overflow/hide karne ke
            bajaye wrap ho jata hai. */}
        <div className='flex-1 min-w-0 px-2 text-center'>
          <p className='text-black/70 font-normal text-[11px] sm:text-sm md:text-base leading-tight whitespace-normal break-words'>
            {productCount} {productCount === 1 ? "product" : "products"}
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={currentSortLabel}
              onChange={handleSortChange}
              className="appearance-none hover:shadow-md hover:shadow-gray-300 cursor-pointer bg-white border-transparent focus:outline-2 focus:outline-black rounded-md px-3 sm:px-4 py-2 pr-7 sm:pr-8 text-xs sm:text-sm max-w-[130px] sm:max-w-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.label}>
                  {opt.label}
                </option>
              ))}
            </select>
            <svg className='w-[10px] h-[6px] inline-block relative top-[0px] left-[-22px] sm:left-[-26px]' aria-hidden="true" focusable="false" viewBox="0 0 10 6">
              <path fillRule="evenodd" clipRule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor" />
            </svg>
          </div>
        </div>

      </div>

      {/* Filter + Products — side by side */}
      <div className='flex w-full relative'>

        {/* Mobile overlay — filter open hone par background dim ho */}
        {filter && (
          <div className='fixed inset-0 z-40 md:hidden backdrop-blur-sm bg-white/10' />
        )}

        <div className={`
          fixed top-0 right-0 h-full z-50 bg-white shadow-lg overflow-y-auto
          transition-[width] duration-200
          md:relative md:static md:top-auto md:right-auto md:h-auto md:shadow-none md:z-auto md:overflow-hidden
          ${filter ? 'w-[85vw] max-w-[300px] sm:w-[280px]' : 'w-0 overflow-hidden'}
        `}>
          <Filter onClose={toggleFilter} />
        </div>

        {/* Products — baaki sara space */}
        <div className='flex-1 min-w-0'>
          {React.cloneElement(children, { filterOpen: filter })}
        </div>

      </div>

    </div>
  )
}

export default Main
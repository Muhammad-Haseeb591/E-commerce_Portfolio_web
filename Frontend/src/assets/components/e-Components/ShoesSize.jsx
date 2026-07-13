import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import '../../components/scrollbar.css'
import { setFilter } from '../redux_Toolkit/fetcherSlice' // 🔑 apna actual path confirm kar lena

// 🔑 Category ke hisaab se numeric shoe sizes — XL/2XL type letter sizing nahi
const SIZE_SETS = {
  women: ["35", "36", "37", "38", "39", "40", "41"],
  men:   ["39", "40", "41", "42", "43", "44", "45", "46"],
  kids:  ["28", "29", "30", "31", "32", "33", "34", "35"],
};

const ShoesSize = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state.FetchPrducts);
  const category = (filters.category || "").toLowerCase();
  const sizeOptions = SIZE_SETS[category] || [];
  if (sizeOptions.length === 0) return null;

  const selectedSizes = filters.sizes
    ? filters.sizes.split(",").filter(Boolean)
    : [];

  const toggleSize = (size) => {
    const isSelected = selectedSizes.includes(size);
    const updated = isSelected
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];

    dispatch(setFilter({ key: "sizes", value: updated.join(",") }));
  };

  return (
    <div className='w-[248.667px] font-sans'>
      <div className='flex box-border w-[250px] max:h-[198.33px] py-[10px] border-[1px] rounded-[5px] m-[5px] border-gray-200'>
        <details className='box-border max-h-[326.667px] py-[10px] w-[248.667px] px-[20px]' open>
          <summary className='list-none pt-[15px] pb-[5px] pr-[17.5px]'>
            <div className='flex border-b-[1px] border-gray-200'>
              <span className='w-[191.17px] h-[29px] flex justify-between item-center'>
                Size
                <svg className='rotate-180 w-[20px] h-[6px] mt-[9px]' aria-hidden="true" focusable="false" viewBox="0 0 10 6">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor" />
                </svg>
              </span>
            </div>
          </summary>

          <div className='overflow-y-auto overflow-hidden w-[208px] h-[265px] pb-[15px]'>
            {sizeOptions.map((size) => {
              const isChecked = selectedSizes.includes(size);
              return (
                <div key={size}>
                  <div className='flex justify-between relative mt-[8px] items-center'>
                    <input
                      type="checkbox"
                      className='w-[16px] h-[16px]'
                      checked={isChecked}
                      onChange={() => toggleSize(size)}
                    />
                    <span className='relative left-[-74px]'>Size {size}</span>
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

export default ShoesSize
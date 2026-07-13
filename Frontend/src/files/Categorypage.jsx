// import { Link } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { useEffect } from "react";
// import { fetchData, setFilters } from "../redux_Toolkit/fetcherSlice"; // 🔑 apna actual path confirm kar lena

// // 🔑 Ek hi generic component — "category" prop se decide karta hai konsi
// // category dikhani hai. Women/Men/Kids/Accessories/Fragrances/Sales/New
// // sab isi component ko reuse karenge, alag alag "category" value ke sath
// // ("" pass karo agar sab products dikhane hain, jaise /new page).
// //
// // Ye component KHUD apna data fetch karta hai (Women.jsx wala hi pattern) —
// // Main.jsx se koi products/loading prop nahi leta, isliye Main.jsx ko
// // bilkul touch nahi karna padta.
// const CategoryPage = ({ category = "" }) => {
//   const dispatch = useDispatch();
//   const { products, loading, error, filters, totalPages, currentPage } =
//     useSelector((state) => state.FetchPrducts);

//   // 🔑 Mount hote hi (ya category prop badalne par) sirf category set karo,
//   // baaki filters (color/size/price) reset kar do — purani category ke
//   // filters is category ke liye invalid ho sakte hain.
//   useEffect(() => {
//     dispatch(setFilters({
//       category,
//       color: "",
//       sizes: "",
//       minPrice: "",
//       maxPrice: "",
//     }));
//   }, [dispatch, category]);

//   // 🔑 Filters (category, color, size, price, sort, page — sab) change
//   // hote hi fetch karo.
//   useEffect(() => {
//     dispatch(fetchData(filters));
//   }, [dispatch, filters]);

//   if (loading) return <p className="text-center py-10">Loading...</p>;
//   if (error) return <p className="text-center py-10 text-red-600">Error: {error}</p>;

//   return (
//     <div className='max-lg:w-full min-h-[1000px] mt-[16px] lg:px-[30px] font-sans px-[12px] md:px-[24px] max-w-[1280px] min-[1350px]:max-w-[1800px] mx-auto'>

//       {!loading && !error && products.length === 0 && (
//         <p className="text-center text-gray-500 py-[40px]">No products found.</p>
//       )}

//       <ul className='w-full min-h-[1000px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-[10px] xl:gap-[6px] 2xl:gap-[4px]'>
//         {products.map((product) => (
//           <li
//             key={product._id}
//             className="w-full h-auto relative cursor-pointer group border border-transparent hover:border-gray-200 rounded-[4px] overflow-hidden transition-colors"
//           >
//             <div className="bg-[#ececec] flex justify-center items-start w-full h-auto min-h-[190px] sm:min-h-[372.862px] relative overflow-hidden">
//               {product.discount && (
//                 <p className="bg-[#cc0000] text-center text-white text-[13px] font-medium w-[84.13px] h-[24.33px] absolute z-40 top-[10px] left-[6px] rounded-[5px] pt-[1px] shadow-sm">
//                   {product.discount}
//                 </p>
//               )}
//               <Link to={`/products/${product._id}`} className="overflow-hidden w-full h-full block">
//                 <img
//                   className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
//                   src={product.images?.[0]}
//                   alt={product.name}
//                   loading="lazy"
//                   onError={(e) => (e.target.src = "/placeholder.png")}
//                 />
//               </Link>
//             </div>

//             <div className="w-full h-[82.9px] px-[6px] pt-[8px]">
//               <h3 className="w-full text-[14px] text-gray-800 truncate">{product.name}</h3>
//               <span className="flex items-center w-full mt-[4px]">
//                 <p className="mr-[10px] text-red-700 font-semibold text-[14px]">Rs. {product.price}</p>
//                 {product.oldPrice && <del className="text-gray-400 text-[13px]">Rs. {product.oldPrice}</del>}
//               </span>
//             </div>

//             {product.bg && (
//               <div className={`${product.bg} size-[20px] rounded-[50%] outline outline-black outline-offset-1 m-[6px] absolute bottom-0 right-0`} />
//             )}
//           </li>
//         ))}
//       </ul>

//       {totalPages > 1 && (
//         <div className="flex justify-center items-center gap-[8px] mt-[24px] mb-[24px]">
//           {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//             <button
//               key={page}
//               onClick={() => dispatch(setFilters({ page }))}
//               className={`w-[32px] h-[32px] rounded-[4px] text-[13px] ${
//                 currentPage === page ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//               }`}
//             >
//               {page}
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default CategoryPage;
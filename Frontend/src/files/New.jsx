import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchCatalog, setFilter, setFilters } from "../assets/components/redux_Toolkit/fetcherSlice";
import { useFilteredProducts } from "../assets/components/hooks/useFilteredProducts";
import { getColorHex } from "../utils/Colormap";

const New = () => {
  const dispatch = useDispatch();
  const { filters, catalog, catalogLoading } = useSelector((state) => state.FetchPrducts);

  // ── Category ko lock kar do "women" pe jab ye page mount ho ──
  useEffect(() => {
    dispatch(setFilters({
      category: "",
      color: "",
      sizes: "",
      minPrice: "",
      maxPrice: "",
    }));
  }, [dispatch]);

  // ── Catalog sirf ek baar load karo agar abhi tak nahi aaya ──
  useEffect(() => {
    if (!catalog || catalog.length === 0) {
      dispatch(fetchCatalog());
    }
  }, [dispatch, catalog]);

  // 🔑 Yehi asal fix hai — client-side filtering (color/size/price/search/
  // sort sab yahin se hoti hai), backend query params ke upar depend nahi
  // karte. Isi hook ka count Filter.jsx ke "Apply Filters" button mein
  // bhi dikhta hai, isliye ab dono hamesha match karenge.
  const filteredProducts = useFilteredProducts();

  // ── Client-side pagination ──
  const pageSize = Number(filters.size) || 20;
  const currentPage = Number(filters.page) || 1;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const products = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page) => {
    dispatch(setFilter({ key: "page", value: page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (catalogLoading) return <p className="text-center py-10">Loading...</p>;

  return (
    <div className="max-lg:w-full min-h-[80px] mt-[16px] lg:px-[30px] font-sans px-[12px] md:px-[24px] max-w-[1280px] min-[1350px]:max-w-[1800px] mx-auto">

    {/* Loading / Empty states */}
    {catalogLoading && (
      <p className="text-center text-gray-500 py-[40px]">Loading products...</p>
    )}
    {!catalogLoading && products.length === 0 && (
      <p className="text-center text-gray-500 py-[40px]">No products found.</p>
    )}

    {/* ── Product Grid ─────────────────────────────
        sm: 1 col | md: 2 col | lg: 4 col | xl/2xl: 4 col edge-to-edge */}
    {!catalogLoading && products.length > 0 && (
      <ul className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-[10px] xl:gap-[6px] 2xl:gap-[4px]">
        {products.map((product) => (
          <li
            key={product._id}
            className="w-full h-auto relative cursor-pointer group border border-transparent rounded-[4px] overflow-hidden transition-colors"
          >
            <div className="bg-[#f2f2f2] flex justify-center items-start w-full h-auto min-h-[190px] sm:min-h-[372.862px] relative overflow-hidden">
              {product.discount && (
                <p className="bg-[#cc0000] text-center text-white text-[13px] font-medium w-[84.13px] h-[24.33px] absolute z-40 top-[10px] left-[6px] rounded-[5px] pt-[1px] shadow-sm">
                  {product.discount}
                </p>
              )}
              <Link to={`/products/${product._id}`} className="overflow-hidden w-full h-full block">
                <img
                  className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                  src={product.images?.[0]}
                  alt={product.name}
                  loading="lazy"
                  onError={(e) => (e.target.src = "/placeholder.png")}
                />
              </Link>
            </div>

            <div className="w-full h-[82.9px] px-[6px] pt-[8px]">
              <h3 className="w-full text-[14px] text-gray-800 truncate">{product.name}</h3>
              <span className="flex items-center w-full mt-[4px]">
                <p className="mr-[10px] text-red-700 font-semibold text-[14px]">
                  Rs. {product.price}
                </p>
                {product.oldPrice && (
                  <del className="text-gray-400 text-[13px]">Rs. {product.oldPrice}</del>
                )}
              </span>
            </div>

            {/* 🔑 Backend ke "color" field se seedha hex nikal ke inline
                style se render — Filter.jsx ke swatches ke sath consistent. */}
            {product.color && (
              <div
                title={product.color}
                style={{ backgroundColor: getColorHex(product.color) }}
                className="size-[20px] rounded-[50%] outline outline-black outline-offset-1 m-[6px] absolute bottom-0 right-0"
              />
            )}
          </li>
        ))}
      </ul>
    )}

    {/* ── Pagination ───────────────────────────── */}
    {totalPages > 1 && (
      <div className="flex justify-center items-center gap-[8px] mt-[24px] mb-[24px]">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`w-[32px] h-[32px] rounded-[4px] text-[13px] ${
              currentPage === page
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {page}
          </button>
        ))}
      </div>
    )}
  </div>
  );
};

export default New;
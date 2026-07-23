import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchCatalog, setFilter, setFilters, setTotalCount } from "../assets/components/redux_Toolkit/fetcherSlice";
import { useFilteredProducts } from "../assets/components/hooks/useFilteredProducts";
import { getColorHex } from "../utils/Colormap";

const Sales = () => {
  const dispatch = useDispatch();
  const { filters, catalog, catalogLoading } = useSelector((state) => state.FetchPrducts);
  const [pageChanging, setPageChanging] = useState(false);

  // ── Filters reset jab ye page mount ho ──
  useEffect(() => {
    dispatch(setFilters({
      category: "sales",
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

  const filteredProducts = useFilteredProducts();

  // 🔑 FIX — Main.jsx ka product-count header sirf Redux ke `totalCount`
  // se aata hai, jo sirf `fetchData` (server-side pagination) update
  // karta hai. Ye page fetchData KABHI call nahi karta — sirf poora
  // catalog uthata hai aur khud client-side filter/paginate karta hai
  // (useFilteredProducts). Is wajah se totalCount kabhi sync hi nahi hota
  // tha, aur refresh ke baad hamesha 0 (ya kisi purani page ka stale
  // number) atka reh jata tha. Ab jab bhi client-side filtered count
  // badalta hai (catalog load hone par, ya filters change hone par),
  // Redux ka totalCount usi ke barabar set kar dete hain.
  useEffect(() => {
    dispatch(setTotalCount(filteredProducts.length));
  }, [dispatch, filteredProducts.length]);

  // ── Client-side pagination ──
  const pageSize = Number(filters.size) || 20;
  const currentPage = Number(filters.page) || 1;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const products = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page) => {
    setPageChanging(true);
    dispatch(setFilter({ key: "page", value: page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setPageChanging(false), 400); // slice instant hai, sirf visual feedback ke liye
  };

  // Real loading (pehli fetch) YA page-change ka fake flash
  const showNewIn = catalogLoading || pageChanging;

  return (
    <div className="max-lg:w-full min-h-[80px] mt-[16px] lg:px-[30px] font-sans px-[12px] md:px-[24px] max-w-[1280px] min-[1350px]:max-w-[1800px] mx-auto">

      {/* ── "New In" loader ─────────────────────────────
          Pehli catalog fetch ke waqt (real) YA page-change
          button click hone par (fake, sirf UX feedback ke liye) dikhega */}
      {showNewIn && (
        <div className='h-[102px] w-full px-[20px] max-[380px]:px-[12px] flex items-center justify-center outline-none backdrop-blur-sm'>
          <h1 className='text-[38px] max-sm:text-[28px] max-[380px]:text-[22px] font-semibold leading-[1.0px] tracking-[1.6px]'>New In</h1>
        </div>
      )}

      {!catalogLoading && products.length === 0 && (
        <p className="text-center text-gray-500 py-[40px]">No products found.</p>
      )}

      {/* ── Product Grid ─────────────────────────────
          default/sm: 2 col | md: 3 col | lg/xl/2xl: 4 col */}
    {!catalogLoading && products.length > 0 && (
  <ul className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-[10px] xl:gap-[6px] 2xl:gap-[4px]">
    {products.map((product) => (
      <li
        key={product._id}
        className="w-full h-auto relative cursor-pointer group border border-transparent rounded-[4px] overflow-hidden transition-colors"
      >
        {/* 🔑 Fixed min-h ki jagah aspect-ratio use kiya —
            ab image container width ke sath proportionally
            shrink/grow hoga (filter open/close, grid columns
            change hone par bhi ratio maintain rahega, blank
            gray space nahi banega) */}
        <div className="bg-[#f2f2f2] w-full aspect-[3/4] relative overflow-hidden">
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

        <div className="w-full h-auto px-[6px] pt-[8px] pb-[8px]">
          <h3 className="w-full text-[14px] text-gray-800 truncate">{product.name}</h3>

          {product.article && (
            <p className="w-full text-[12px] text-gray-400 truncate">
              Art. {product.article}
            </p>
          )}

          <span className="flex items-center w-full mt-[4px]">
            <p className="mr-[10px] text-red-700 font-semibold text-[14px]">
              Rs. {product.price}
            </p>
            {product.oldPrice && (
              <del className="text-gray-400 text-[13px]">Rs. {product.oldPrice}</del>
            )}
          </span>
        </div>

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

export default Sales;
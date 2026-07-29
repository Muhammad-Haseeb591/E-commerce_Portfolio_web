import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchCatalog, setFilter, setFilters, setTotalCount } from "../assets/components/redux_Toolkit/fetcherSlice";
import { useFilteredProducts } from "../assets/components/hooks/useFilteredProducts";
import { getColorHex } from "../utils/Colormap";
import { SaveOff } from "lucide-react";
import SEO from "../assets/components/SEO/SEO"


const Men = () => {
  const dispatch = useDispatch();
  const { filters, catalog, catalogLoading } = useSelector((state) => state.FetchPrducts);
  const [pageChanging, setPageChanging] = useState(false);

  // ── Filters reset jab ye page mount ho ──
  useEffect(() => {
    dispatch(setFilters({
      category: "men",
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
    setTimeout(() => setPageChanging(false), 400);
  };

  const showNewIn = catalogLoading || pageChanging;

  const getProductColors = (product) => {
    const normalize = (c) => {
      if (typeof c === "string") return { name: c, stock: null };
      if (c && typeof c === "object") {
        return {
          name: c.color || c.name || c.value || "",
          stock: c.stock != null ? Number(c.stock) : null,
        };
      }
      return { name: "", stock: null };
    };

    if (Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors.map(normalize).filter((c) => c.name);
    }
    return product.color ? [normalize(product.color)] : [];
  };

  return (
    <div className="max-lg:w-full min-h-[80px] mt-[16px] lg:px-[30px] font-sans px-[12px] md:px-[24px] max-w-[1280px] min-[1350px]:max-w-[1800px] mx-auto">
<SEO
title="Men's Collection"
  description="Shop the latest men's fashion at STORE. Stylish outfits, accessories, and more for every occasion."
  keywords="men fashion, men clothing, men's wear, menswear"
  image="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600"
  path="/men"
  />
      {showNewIn && (
        <div className='h-[102px] w-full px-[20px] max-[380px]:px-[12px] flex items-center justify-center outline-none backdrop-blur-sm'>
          <h1 className='text-[38px] max-sm:text-[28px] max-[380px]:text-[22px] font-semibold leading-[1.0px] tracking-[1.6px]'>New In</h1>
        </div>
      )}

      {!catalogLoading && products.length === 0 && (
        <p className="text-center text-gray-500 py-[40px]">No products found.</p>
      )}

      {!catalogLoading && products.length > 0 && (
        <ul className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-[10px] xl:gap-[6px] 2xl:gap-[4px]">
          {products.map((product) => {
            const productColors = getProductColors(product);
            return (
              <li
                key={product._id}
                className="w-full h-auto relative cursor-pointer group border border-transparent rounded-[4px] overflow-hidden transition-colors"
              >
                <div className="bg-[#f2f2f2] w-full aspect-[3/4] relative overflow-hidden">
                  {product.discount && (
                    <p className="bg-[#cc0000] text-center text-white text-[13px] font-medium w-[84.13px] h-[24.33px] absolute z-40 top-[10px] left-[6px] rounded-[5px] pt-[1px] shadow-sm">
                      {product.discount}
                    </p>
                  )}
                  <Link to={`/products/${product._id}`} className="overflow-hidden w-full h-full block">
                    <img
                      className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                      src={product.displayImage || product.colors?.[0]?.image}
                      alt={product.name}
                      loading="lazy"
                      onError={(e) => (e.target.src = "/placeholder.png")}
                    />
                  </Link>
                </div>

                <div className="w-full h-auto px-[6px] pt-[8px] pb-[8px]">
                  {/* 🔑 ADDED — SKU name ke upar. Agar aapke schema mein
                      field ka naam `sku` nahi hai (e.g. `productCode`,
                      `styleCode`), yahan sirf `product.productId` ko us naam se
                      replace kar dena. Agar field missing/undefined ho to
                      ye line render hi nahi hogi (blank space nahi banega). */}
                  {product.productId && (
                    <p className="w-full text-[11px] text-gray-400 tracking-wide truncate">
                      {product.productId}
                    </p>
                  )}

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

                {/* CHANGED — jis color ka stock hai wo dot full-opacity
                    dikhta hai, jis color ka stock khatam (0) hai wo dot
                    dimmed/grayscale ho jata hai (hidden nahi — user ko pata
                    chalna chahiye ke color exist karta hai, bas abhi
                    available nahi). Stock unknown (null) hone par bhi
                    normal dikhaya jata hai, kyunke hum confirm nahi kar
                    sakte ke out of stock hai ya nahi. */}
                {productColors.length > 0 && (
                  <div className="flex items-center absolute bottom-[6px] right-[6px]">
                    {productColors.map((c, idx) => {
                      const outOfStock = c.stock != null && c.stock <= 0;
                      return (
                        <div
                          key={`${product._id}-${c.name}-${idx}`}
                          title={outOfStock ? `${c.name} — Out of stock` : c.name}
                          style={{ backgroundColor: getColorHex(c.name) }}
                          className={`size-[14px] rounded-full outline outline-1 outline-black outline-offset-1 bg-white transition-opacity ${
                            idx > 0 ? "-ml-[6px]" : ""
                          } ${outOfStock ? "opacity-30 grayscale" : ""}`}
                        />
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

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

export default Men;
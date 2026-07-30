import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";

const MAX_RESULTS = 6;

// product-level `images[]` ab schema mein nahi hai — image sirf colors[]
// ke andar hoti hai. images[0] sirf legacy fallback ke liye rakha hai.
const getProductThumb = (p) => p.colors?.[0]?.image || p.images?.[0] || "/placeholder.png";

const SearchBar = () => {
  const navigate = useNavigate();
  const { catalog } = useSelector((state) => state.FetchPrducts);

  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedQuery = query.trim().toLowerCase();
  const results = trimmedQuery
    ? (catalog || [])
        .filter((p) => (p.productId || "").toLowerCase().includes(trimmedQuery))
        .sort((a, b) => {
          const aId = (a.productId || "").toLowerCase();
          const bId = (b.productId || "").toLowerCase();
          const rank = (id) => {
            if (id === trimmedQuery) return 0; // exact match
            if (id.startsWith(trimmedQuery)) return 1; // starts with
            return 2; // contains
          };
          return rank(aId) - rank(bId);
        })
        .slice(0, MAX_RESULTS)
    : [];

  // Submit hone par (Enter dabane par) seedha best-matching product ki
  // detail page par redirect karta hai. Koi match na ho to kuch nahi hota.
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trimmedQuery || results.length === 0) return;
    const bestMatch = results[0];
    setShowDropdown(false);
    setQuery("");
    navigate(`/products/${bestMatch._id}`);
  };

  const handleResultClick = () => {
    setShowDropdown(false);
    setQuery("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      ref={wrapperRef}
      className='sx:w-full lg:w-[160px ] lg:h-[33px] mb-[10px] sx:mx-auto md:hidden lg:block lg:relative'
    >
      <div className='relative sx:w-full'>
        <input
          className='bg-[#eeeeee] sx:w-full h-[47px] px-5 pr-12 lg:outline-1 outline-gray-300 border-gray-300 rounded-[5px] text-[13px] text-black/100 border-[1px] absolute outline-1 lg:text-[13px] lg:w-[157.33px] lg:h-[30px] lg:p-[5px] max:md:relative'
          type="search"
          placeholder='Search by Product ID...'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            if (trimmedQuery) setShowDropdown(true);
          }}
          autoComplete="off"
        />
        <div className='lg:inline-block lg:relative lg:top-[4px] lg:right-[-130px] sx:absolute sx:right-3 sx:top-[13px]'>
          <button
            type="submit"
            className='cursor-pointer'
            aria-label="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 40 40"
              width="25px"
              height="28px"
              className="text-black/60"
            >
              <path
                fill="currentColor"
                d="M 13 3 C 7.4889971 3 3 7.4889971 3 13 C 3 18.511003 7.4889971 23 13 23 C 15.396508 23 17.597385 22.148986 19.322266 20.736328 L 25.292969 26.707031 A 1.0001 1.0001 0 1 0 26.707031 25.292969 L 20.736328 19.322266 C 22.148986 17.597385 23 15.396508 23 13 C 23 7.4889971 18.511003 3 13 3 z M 13 5 C 17.430123 5 21 8.5698774 21 13 C 21 17.430123 17.430123 21 13 21 C 8.5698774 21 5 17.430123 5 13 C 5 8.5698774 8.5698774 5 13 5 z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Live Search Dropdown ── */}
      {showDropdown && trimmedQuery && (
        <div className="absolute top-[52px] lg:top-[36px] left-0 lg:left-auto lg:right-0 w-full lg:w-[320px] bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 max-h-[420px] overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-center text-gray-400 text-[13px] py-6 px-4">
              No product found for ID "{query}"
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {results.map((product) => (
                <li key={product._id}>
                  <Link
                    to={`/products/${product._id}`}
                    onClick={handleResultClick}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={getProductThumb(product)}
                      alt={product.name}
                      className="w-[44px] h-[44px] object-cover rounded-[6px] bg-gray-100 border border-gray-200 shrink-0"
                      onError={(e) => (e.target.src = "/placeholder.png")}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-gray-800 truncate">
                        {product.productId}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{product.name}</p>
                    </div>
                    <p className="text-[12px] font-semibold text-red-700 shrink-0">
                      Rs. {product.price}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
};

export default SearchBar;
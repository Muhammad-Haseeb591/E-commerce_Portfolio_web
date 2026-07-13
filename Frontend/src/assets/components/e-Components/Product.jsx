import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Product = ({ filterOpen }) => {
  const { products = [], loading, error } = useSelector((state) => state.FetchPrducts);

  if (loading) return (
    <div className="flex justify-center mt-20">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <p className="text-center text-red-500 mt-10">Error: {error}</p>
  );
  

  return (
    <div className="w-full min-h-[1000px] mt-[16px] px-[12px] md:px-[24px] lg:px-[30px] font-sans">
      <ul
        className="w-full min-h-[1000px] grid gap-[8px] transition-all duration-300"
        style={{
          gridTemplateColumns: filterOpen
            ? 'repeat(auto-fill, minmax(100px, 1fr))'
            : 'repeat(auto-fill, minmax(200px, 1fr))'
        }}
      >
        {products.map((product) => (
          <li key={product._id} className="w-full h-auto relative cursor-pointer">

            {/* Product Image */}
            <div className={`bg-[#ececec] relative w-full overflow-hidden transition-all duration-300 ${filterOpen ? 'min-h-[133px] sm:min-h-[260px]' : 'min-h-[400px] sm:min-h-[372px]'}`}>
              {product.discount && (
                <p className="bg-[#cc0000] text-center text-white text-[14px] w-[84px] h-[24px] absolute z-40 top-[10px] left-[6px] rounded-[5px] pt-[1px]">
                  {product.discount}
                </p>
              )}
              {/* ✅ Sirf image wrap kiya Link mein */}
              <Link to={`/product/${product._id}`} className="w-full h-full block">
                <img
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  src={product.image}
                  alt={product.name}
                />
              </Link>
            </div>

            {/* Product Info */}
            <div className="w-full mt-2">
              <h3 className="font-medium">{product.name}</h3>
              <div className="flex gap-2 items-center">
                <p className="text-red-700 font-semibold">Rs. {product.price}</p>
                {product.oldPrice && (
                  <del className="text-gray-500">Rs. {product.oldPrice}</del>
                )}
              </div>

             
            </div>

            {/* Color Swatch */}
            {product.bg && (
              <div className={`${product.bg} size-[20px] rounded-full outline outline-black outline-offset-1 m-[2px]`} />
            )}

          </li>
        ))}
      </ul>
    </div>
  );
};

export default Product;
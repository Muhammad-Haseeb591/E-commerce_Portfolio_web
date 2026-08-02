import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchFavourites } from "../assets/components/store/favouriteslice"; // ← apna actual path check karna
import SEO from "../assets/components/common/SEO";

const Wishlist = () => {
  const dispatch = useDispatch();

  const { items: products, loading, error } = useSelector((state) => state.favourites);

  useEffect(() => {
    dispatch(fetchFavourites());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center text-gray-400 text-sm">
        <SEO
          title="Your Favourites | Personal Site"
          description="View and manage your favourite products at Personal Site."
          url="https://e-commerce-portfolio-web.vercel.app/favourites"
          noIndex
        />
        Loading favourites...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center text-red-500 text-sm">
        <SEO
          title="Your Favourites | Personal Site"
          description="View and manage your favourite products at Personal Site."
          url="https://e-commerce-portfolio-web.vercel.app/favourites"
          noIndex
        />
        {error}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-2 text-gray-400">
        <SEO
          title="Your Favourites | Personal Site"
          description="You haven't added any favourite products yet. Browse Personal Site to find items you love."
          url="https://e-commerce-portfolio-web.vercel.app/favourites"
          noIndex
        />
        <p className="text-sm font-medium">No favourite products found</p>
        <Link to="/new" className="text-xs text-[#333333] hover:underline">
          see all products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-lg:w-full min-h-[1000px] mt-[16px] lg:px-[30px] font-sans px-[12px] md:px-[24px] max-w-[1280px] min-[1350px]:max-w-[1800px] mx-auto">
      <SEO
        title="Your Favourites | Personal Site"
        description="View and manage your favourite products at Personal Site."
        url="https://e-commerce-portfolio-web.vercel.app/favourites"
        noIndex
      />
      <ul className="w-full min-h-[1000px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[1350px]:grid-cols-5 gap-[8px] justify-items-center">
        {products.map((product) => (
          <li key={product._id} className="w-full max-w-[297.693px] h-auto relative cursor-pointer">

            <div className="bg-[#ececec] flex justify-center items-start w-full h-auto min-h-[190px] sm:min-h-[372.862px] relative">
              {product.discount && (
                <p className="bg-[#cc0000] text-center text-white text-[14px] w-[84.13px] h-[24.33px] absolute z-40 top-[10px] left-[6px] rounded-[5px] pt-[1px]">
                  {product.discount}
                </p>
              )}
              <Link to={`/products/${product._id}`} className="overflow-hidden w-full h-full block">
                <img
                  className="w-full h-full object-cover transition-all duration-600 ease-in-out hover:scale-105"
                  src={product.colors?.[0]?.image}
                  alt={product.name}
                  onError={(e) => console.log("Image broken:", e.target.src)}
                />
              </Link>
            </div>

            <div className="inline-block w-full h-[82.9px]">
              <h3 className="w-full">{product.name}</h3>
              <span className="flex w-full">
                <p className="mr-[10px] text-red-700">Rs. {product.price}</p>
                <del>{product.oldPrice}</del>
              </span>
              <div className="mt-[7px] flex items-center">
              </div>
            </div>

            {product.bg && (
              <div className={`${product.bg} size-[20px] rounded-[50%] outline outline-black outline-offset-1 m-[2px]`} />
            )}

          </li>
        ))}
      </ul>
    </div>
  );
};

export default Wishlist;
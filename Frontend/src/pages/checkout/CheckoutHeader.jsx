import { Link } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

export default function CheckoutHeader() {
  return (
    <header className="border-b border-[#333333] px-4 sm:px-6 py-4 bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <Link
          to="/cart"
          className="flex items-center justify-center size-10 shrink-0 text-[#333333] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          aria-label="Back to cart"
        >
          <IoArrowBack className="size-5" />
        </Link>

        <div className="flex justify-center min-w-0 flex-1">
          <img
            className="logo-responsive h-[28px] sm:h-[32px] w-auto object-contain"
            src="//insignia.com.pk/cdn/shop/files/final_logo_insignia-01_2847a8f6-7ff7-4e81-ab09-44d3d3fe386e.png?v=1686553684&width=600"
            alt="Insignia PK"
            srcSet="//insignia.com.pk/cdn/shop/files/final_logo_insignia-01_2847a8f6-7ff7-4e81-ab09-44d3d3fe386e.png?v=1686553684&width=200 200w, //insignia.com.pk/cdn/shop/files/final_logo_insignia-01_2847a8f6-7ff7-4e81-ab09-44d3d3fe386e.png?v=1686553684&width=300 300w"
            loading="eager"
          />
        </div>
      </div>
    </header>
  );
}
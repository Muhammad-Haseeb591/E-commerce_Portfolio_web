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
            className="logo-responsive relative md:left-[45px] lg:left-[30px] w-full h-auto object-contain"
      src="https://res.cloudinary.com/dxqs4sg8j/image/upload/e_trim/w_600/v1784673289/Gemini_Generated_Image_42k8yv42k8yv42k8_qlrij0.png"
      alt="Portfolio_web PK"
      sizes="160px"
      loading="eager"
          />
        </div>
      </div>
    </header>
  );
}
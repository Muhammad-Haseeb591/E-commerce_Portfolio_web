export default function EmptyCart({ onBackToCart }) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-4 text-gray-400">
          <p className="text-[#333333] font-medium">Cart khali hai, checkout nahi ho sakta</p>
          <button
            onClick={onBackToCart}
            className="bg-[#333333] hover:bg-[#1f1f1f] active:scale-[0.98] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all cursor-pointer"
          >
            Cart par jayein
          </button>
        </div>
      </div>
    );
  }

//this is tested for commit


export default function PaymentFailed({ message, onRetry, onBackToCart }) {
    return (S
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full bg-white border border-[#333333] rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-amber-600 mb-2">
            Payment could not be completed
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {message || "Your card was not charged. You can try again with the same or a different card."}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="w-full bg-[#333333] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1f1f1f] transition cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={onBackToCart}
              className="text-gray-500 hover:text-[#333333] text-sm underline underline-offset-4 cursor-pointer"
            >
              Return to cart
            </button>
          </div>
        </div>
      </div>
    );
  }
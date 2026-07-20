export default function OrderConfirmation({
    firstName, email, paymentMethod, formatPrice, total, onContinueShopping,
  }) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-[#333333] rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-white">✓</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-3">Order Confirmed!</h2>
          <p className="text-gray-600 mb-2">Thanks, {firstName}! Your order has been placed.</p>
          <p className="text-gray-500 text-sm mb-8">
            A confirmation will be sent to{" "}
            <span className="text-[#333333] font-medium break-all">{email}</span>.
          </p>
          <div className="bg-white border border-[#333333] rounded-2xl p-5 text-left mb-6">
            <p className="text-gray-500 text-sm mb-1">Payment method</p>
            <p className="text-[#333333] font-semibold capitalize">
              {paymentMethod === "us" ? "💳 Credit / Debit Card" : "💵 Cash on Delivery"}
            </p>
            <p className="text-gray-500 text-sm mt-3 mb-1">Total charged</p>
            <p className="text-[#333333] font-bold text-xl">{formatPrice(total)}</p>
          </div>
          <button
            onClick={onContinueShopping}
            className="text-gray-500 hover:text-[#333333] text-sm transition underline underline-offset-4 cursor-pointer"
          >
            Continue shopping
          </button>
        </div>
      </div>
    );
  }
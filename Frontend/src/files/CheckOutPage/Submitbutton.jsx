export default function SubmitButton({
    onClick, disabled, placingOrder, paymentMethod, formatPrice, total, size = "desktop",
  }) {
    return (
      <>
        <button
          onClick={onClick}
          disabled={disabled}
          className={`w-full bg-[#333333] hover:bg-[#333333]/90 active:scale-[0.98] text-white font-bold ${size === "mobile" ? "py-4" : "py-3.5"} rounded-xl transition-all text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer`}
        >
          {placingOrder
            ? "Placing order..."
            : `${paymentMethod === "us" ? "Pay" : "Place Order"} · ${formatPrice(total)}`}
        </button>
        <p className="text-gray-500 text-xs text-center mt-3 flex items-center justify-center gap-1">
          <span>🔒</span> Secure &amp; encrypted checkout
        </p>
      </>
    );
  }
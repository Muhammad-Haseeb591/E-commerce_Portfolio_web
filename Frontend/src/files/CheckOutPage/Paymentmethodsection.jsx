import { CardElement } from "@stripe/react-stripe-js";
import { inputClass, labelClass, cardElementOptions } from "./Constants";

export default function PaymentMethodSection({
  paymentMethod, setPaymentMethod, codAllowed, currency,
  errors, setErrors, cardError, setCardError, setCardComplete,
}) {
  return (
    <section>
      <h2 className="text-base sm:text-lg font-bold mb-5 flex items-center gap-2 text-[#333333]">
        <span className="w-7 h-7 bg-[#333333] text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">4</span>
        Payment Method
      </h2>

      {!codAllowed && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          Cash on Delivery is valid for Pakistan only. Card payment is required for your country.
        </p>
      )}

      <div className={`grid grid-cols-1 ${codAllowed ? "xs:grid-cols-2 sm:grid-cols-2" : ""} gap-3 mb-6`}>
        <button
          onClick={() => setPaymentMethod("us")}
          className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${paymentMethod === "us" ? "border-[#333333] bg-[#333333]/10" : "border-[#333333] bg-white hover:bg-gray-50"}`}
        >
          {paymentMethod === "us" && (
            <span className="absolute top-3 right-3 w-4 h-4 bg-[#333333] text-white rounded-full flex items-center justify-center text-xs">✓</span>
          )}
          <div className="text-2xl mb-2">💳</div>
          <div className="font-semibold text-sm text-[#333333]">Card Payment ({currency})</div>
          <div className="text-gray-500 text-xs mt-0.5">Visa, Mastercard, Amex</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {["VISA", "MC", "AMEX"].map((b) => (
              <span key={b} className="text-[9px] bg-gray-100 border border-[#333333] text-[#333333] px-1.5 py-0.5 rounded font-mono">{b}</span>
            ))}
          </div>
        </button>

        {codAllowed && (
          <button
            onClick={() => setPaymentMethod("rs")}
            className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${paymentMethod === "rs" ? "border-[#333333] bg-[#333333]/10" : "border-[#333333] bg-white hover:bg-gray-50"}`}
          >
            {paymentMethod === "rs" && (
              <span className="absolute top-3 right-3 w-4 h-4 bg-[#333333] text-white rounded-full flex items-center justify-center text-xs">✓</span>
            )}
            <div className="text-2xl mb-2">💵</div>
            <div className="font-semibold text-sm text-[#333333]">Cash on Delivery (PKR)</div>
            <div className="text-gray-500 text-xs mt-0.5">Pay when you receive</div>
            <div className="flex gap-1 mt-2">
              <span className="text-[9px] bg-gray-100 border border-[#333333] text-green-700 px-1.5 py-0.5 rounded font-mono">FREE</span>
            </div>
          </button>
        )}
      </div>

      {paymentMethod === "us" && (
        <div className="bg-white border border-[#333333] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-[#333333]">Card Details</span>
            <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">🔒 Powered by Stripe</span>
          </div>
          <div>
            <label className={labelClass}>Card Information</label>
            <div className={`${inputClass} ${errors.card ? "border-red-500 ring-1 ring-red-200" : ""}`}>
              <CardElement
                options={cardElementOptions}
                onChange={(e) => {
                  setCardComplete(e.complete);
                  setCardError(e.error ? e.error.message : "");
                  setErrors((er) => ({ ...er, card: "" }));
                }}
              />
            </div>
            {(errors.card || cardError) && (
              <p className="text-red-500 text-xs mt-1">{cardError || errors.card}</p>
            )}
          </div>
        </div>
      )}

      {paymentMethod === "rs" && codAllowed && (
        <div className="bg-white border border-[#333333] rounded-xl p-4 sm:p-5 flex gap-3 items-start">
          <span className="text-2xl shrink-0">📦</span>
          <div>
            <p className="text-sm font-semibold text-[#333333] mb-1">Cash on Delivery selected</p>
            <p className="text-gray-600 text-sm">Have the exact amount ready when your delivery arrives. Our courier will collect payment at your door.</p>
          </div>
        </div>
      )}
    </section>
  );
}
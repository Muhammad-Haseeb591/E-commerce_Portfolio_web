// pages/OrderCancelled.jsx
import { Link } from "react-router-dom";

export default function OrderCancelled() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-amber-600 mb-2">
          Payment cancelled
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          No charge was made. You can try again anytime.
        </p>
        <Link
          to="/cart"
          className="inline-block bg-[#333333] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1f1f1f] transition"
        >
          Return to cart
        </Link>
      </div>
    </div>
  );
}
// pages/OrderCancelled.jsx
import { Link } from "react-router-dom";

export default function OrderCancelled() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h2 className="text-xl font-semibold text-amber-600">Payment cancelled</h2>
      <p className="mt-2 text-sm text-gray-500">No charge was made. You can try again anytime.</p>
      <Link
        to="/cart"
        className="mt-6 inline-block rounded-md bg-[#333333] px-5 py-2 text-sm text-white"
      >
        Return to cart
      </Link>
    </div>
  );
}
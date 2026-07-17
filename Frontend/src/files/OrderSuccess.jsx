import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";


const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("checking"); // checking | paid | pending | error

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/payments/verify-session/${sessionId}`,
          { withCredentials: true }
        );

        if (res.data.paid && res.data.order) {
          setStatus("paid");
        } else if (res.data.paid) {
          // payment ho gayi lekin webhook abhi order nahi bana saka (thodi der lagegi)
          setStatus("pending");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    verify();
  }, [sessionId]);

  if (status === "checking") return <p className="text-center py-10">Verifying payment...</p>;

  if (status === "paid") {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful 🎉</h2>
        <p className="text-gray-500 mb-4">Your order has been placed.</p>
        <Link to="/" className="text-blue-600 underline">Go back to home</Link>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-700">Payment received — confirming your order...</h2>
        <p className="text-gray-400 text-sm mt-2">Please wait a moment, or check "My Orders" shortly.</p>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <h2 className="text-xl font-semibold text-red-500">Something went wrong verifying your payment.</h2>
    </div>
  );
};

export default OrderSuccess;
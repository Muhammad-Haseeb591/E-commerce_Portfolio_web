import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import getStripe from "../lib/stripe";
import CheckoutForm from "./CheckoutForm";

const PaymentPage = ({ cartTotal, items, shippingAddress }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/payments/create-payment-intent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ amount: cartTotal }),
          }
        );
        const data = await res.json();

        if (data.success) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.message || "Failed to initialize payment");
        }
      } catch (err) {
        setError("Failed to connect to payment server");
      } finally {
        setLoading(false);
      }
    };

    if (cartTotal > 0) {
      createPaymentIntent();
    }
  }, [cartTotal]);

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#333333",
        borderRadius: "12px",
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#333333] mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing secure checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#333333] text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#333333] mb-8 text-center">
          Secure Checkout
        </h1>
        {clientSecret && (
          <Elements options={options} stripe={getStripe()}>
            <CheckoutForm
              cartTotal={cartTotal}
              items={items}
              shippingAddress={shippingAddress}
            />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
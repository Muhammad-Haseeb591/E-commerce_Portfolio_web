import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import { API_URL } from "../config/api";

const cardElementOptions = {
  style: {
    base: {
      fontSize: "14px",
      color: "#333333",
      fontFamily: "inherit",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#ef4444" },
  },
};

const CheckoutForm = ({ cartTotal, items, shippingAddress }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError("");

    const cardElement = elements.getElement(CardElement);

    // Create payment method
    const { error: paymentMethodError, paymentMethod } =
      await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: shippingAddress?.fullName,
          email: shippingAddress?.email,
          address: {
            line1: shippingAddress?.address,
            city: shippingAddress?.city,
            state: shippingAddress?.state,
            postal_code: shippingAddress?.zip,
            country: shippingAddress?.country || "US",
          },
        },
      });

    if (paymentMethodError) {
      setError(paymentMethodError.message);
      setLoading(false);
      return;
    }

    try {
      // Create order with payment method
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items,
          totalAmount: cartTotal,
          shippingAddress,
          email: shippingAddress?.email,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create order");
      }

      // If 3D Secure is required
      if (data.requiresAction && data.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          data.clientSecret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      // Order successful
      navigate("/order-success", {
        state: { order: data.order },
      });
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <h2 className="text-lg font-bold text-[#333333] mb-6">
        Card Information
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">Order Summary</p>
          <div className="space-y-2">
            {items?.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.name} × {item.quantity || 1}
                </span>
                <span className="font-medium">
                  ${(item.price * (item.quantity || 1)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3">
            <div className="flex justify-between font-bold text-[#333333]">
              <span>Total</span>
              <span>${cartTotal?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Stripe Card Element */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="border border-gray-300 rounded-xl p-4 focus-within:border-[#333333] focus-within:ring-1 focus-within:ring-[#333333]">
            <CardElement
              options={cardElementOptions}
              onChange={(e) => {
                setCardComplete(e.complete);
                if (e.error) {
                  setError(e.error.message);
                } else {
                  setError("");
                }
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            🔒 Powered by Stripe — Your card details are secure
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || loading || !cardComplete}
          className="w-full bg-[#333333] text-white font-bold py-4 rounded-xl hover:bg-[#1f1f1f] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </span>
          ) : (
            `Pay $${cartTotal?.toFixed(2)}`
          )}
        </button>

        {/* Security Badge */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            🔒 Secure & encrypted checkout
          </p>
        </div>
      </form>
    </div>
  );
};

export default CheckoutForm;

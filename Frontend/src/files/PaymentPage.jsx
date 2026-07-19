import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';
import CheckoutForm from './CheckoutForm';
import OrderSummary from './OrderSummary';

export default function PaymentPage({ cartTotal }) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/payment/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: cartTotal * 100 }), // convert to cents
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, [cartTotal]);

  const options = { clientSecret, appearance: { theme: 'stripe' } };

  return (
    <div className="max-w-2xl mx-auto p-6 grid gap-6 md:grid-cols-2">
      <OrderSummary total={cartTotal} />
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
}
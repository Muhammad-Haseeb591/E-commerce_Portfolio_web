import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import SEO from "../../assets/components/common/SEO"
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
       
      <SEO
        title="Checkout | STORE"
        description="Complete your purchase securely at STORE."
        url="https://e-commerce-portfolio-web.vercel.app/checkout"
        noIndex
      />
      <CheckoutForm />
    </Elements>
  );
}
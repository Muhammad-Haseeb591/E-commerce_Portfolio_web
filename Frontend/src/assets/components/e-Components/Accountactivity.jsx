import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import OrderSection from "./Ordersection";
import ReviewSection from "./Reviewsection";
import SEO from "../SEO/SEO";

const VALID_TABS = ["orders", "reviews"];

export default function AccountActivity() {
  const navigate = useNavigate();
  const { tab: tabParam } = useParams();
  const user = useSelector((state) => state.auth?.user);

  const [tab, setTab] = useState(VALID_TABS.includes(tabParam) ? tabParam : "orders");

  const tabTitles = {
    reviews: "My Reviews",
    orders: "My Orders",
  };

  const pageTitle = tabTitles[tab] || "My Account";

  useEffect(() => {
    if (!tabParam) {
      navigate("/account/orders", { replace: true });
    } else if (VALID_TABS.includes(tabParam) && tabParam !== tab) {
      setTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (key) => {
    setTab(key);
    navigate(`/account/${key}`, { replace: true });
  };

  if (!user) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center bg-white px-4 text-center text-sm text-[#777777]">
        Log in to see your order history and reviews.
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-white px-3 py-6 text-[#333333] sm:px-6 sm:py-10">
      <SEO
        title={`${pageTitle} | STORE`}
        description={`Manage your ${pageTitle.toLowerCase()} on STORE. View and track your account activity.`}
        url={`https://e-commerce-portfolio-web.vercel.app/account/${tab || ""}`}
        noIndex
      />
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-xl font-semibold sm:text-2xl">My Activity</h1>
        <p className="mt-1 text-sm text-[#777777]">Track orders and manage the reviews you've left</p>

        {/* Tab switcher */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:inline-flex sm:w-auto">
          {VALID_TABS.map((key) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === key ? "bg-[#333333] text-white" : "border border-[#cccccc] text-[#333333]"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Both stay mounted, only visibility toggles — preserves each
            section's own internal UI state (expanded cards, forms) when
            switching tabs. */}
        <div className={`mt-5 sm:mt-6 ${tab === "orders" ? "block" : "hidden"}`}>
          <OrderSection />
        </div>

        <div className={`mt-5 sm:mt-6 ${tab === "reviews" ? "block" : "hidden"}`}>
          <ReviewSection />
        </div>
      </div>
    </section>
  );
}
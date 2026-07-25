import { useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, Users, Menu, X, Home } from "lucide-react";
import { Link } from "react-router-dom";
import Dashboard from "./Dashboard";
import Orders from "../AdminPanelComponents/AdminOrders/Orders";
import Products from "../AdminPanelComponents/AdminProducts/Products";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products",  label: "Products",  icon: Package },
  { id: "orders",    label: "Orders",    icon: ShoppingCart },
  { id: "customers", label: "Customers", icon: Users },
];

const AdminPanel = () => {
  const [activeTab,   setActiveTab]   = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // 🔑 Logo image load hone tak dummy/skeleton UI dikhane ke liye —
  // pehle load ke doran alt-text/cropped image dikh raha tha ("PORT-_Site...")
  const [logoLoaded, setLogoLoaded] = useState(false);

  const handleTab = (id) => {
    setActiveTab(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:static z-30 h-full flex flex-col
          ${sidebarOpen ? "w-60" : "w-0"}
          bg-white border-r border-gray-200
          transition-all duration-300 overflow-hidden shrink-0
        `}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col items-start gap-1.5 shrink-0 w-full">
          <div className="relative w-full h-16 shrink-0">
            {/* 🔑 Dummy/skeleton placeholder — image load hote hi fade out */}
            {!logoLoaded && (
              <div className="absolute inset-0 bg-gray-100 rounded-lg animate-pulse" />
            )}
            <img
              className={`
                w-full h-full object-contain object-left
                transition-opacity duration-300
                ${logoLoaded ? "opacity-100" : "opacity-0"}
              `}
              src="https://res.cloudinary.com/dxqs4sg8j/image/upload/v1784673289/Gemini_Generated_Image_42k8yv42k8yv42k8_qlrij0.png"
              alt="Portfolio Site"
              loading="eager"
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(true)}
            />
          </div>
          <p className="text-xs text-gray-400 truncate w-full">Manage your store</p>
        </div>

        {/* 🔑 Nav ab flex-1 + overflow-y-auto hai — content zyada hone par
            khud scroll karega, baaki sidebar (logo, footer) fixed rahenge */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTab(id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150
                ${activeTab === id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        {/* 🔑 Pehle ye absolute bottom-5 tha, jo scroll hone par nav content
            ke upar overlap kar sakta tha. Ab normal flex flow mein hai —
            hamesha bottom par pinned rahega, kabhi overlap nahi karega. */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-300 text-center">v1.0.0</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen
                ? <X    className="w-5 h-5 text-gray-500" />
                : <Menu className="w-5 h-5 text-gray-500" />}
            </button>
            <span className="text-sm font-semibold text-gray-800 capitalize">{activeTab}</span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "products"  && <Products />}
          {activeTab === "orders"    && <Orders />}
          {activeTab === "customers" && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700">Customers</h3>
              <p className="text-sm text-gray-400 mt-1">Coming soon</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
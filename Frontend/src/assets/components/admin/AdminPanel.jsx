import { useState, useEffect } from "react";
import { LayoutDashboard, Package, ShoppingCart, Users, Menu, X, Home } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "products",  label: "Products",  icon: Package,        path: "/admin/products" },
  { id: "orders",    label: "Orders",    icon: ShoppingCart,   path: "/admin/orders" },
  { id: "customers", label: "Customers", icon: Users,          path: "/admin/customers" },
];

const AdminPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );
  const [logoLoaded, setLogoLoaded] = useState(false);
  const location = useLocation();

  // Route change hote hi mobile/tablet pe sidebar guaranteed close hoga
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Resize hone par bhi sahi default state maintain rahega
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeLabel =
    NAV_ITEMS.find((n) => location.pathname.startsWith(n.path))?.label ?? "Dashboard";

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
          ${sidebarOpen
            ? "w-60 sm:w-64 md:w-60 lg:w-64"
            : "w-0 sm:w-10 md:w-14 lg:w-16"}
          bg-white border-r border-gray-200
          transition-[width] duration-300 ease-in-out
          overflow-hidden shrink-0
        `}
      >
        <div
          className={`
            border-b border-gray-100 flex flex-col items-start gap-1.5 shrink-0 w-full
            ${sidebarOpen ? "px-4 sm:px-5 py-4" : "px-1 sm:px-2 md:px-3 py-4"}
          `}
        >
          <div className="relative w-full h-8 sm:h-9 md:h-10 shrink-0 flex items-center justify-start">
            {!logoLoaded && (
              <div className="absolute inset-0 bg-gray-100 rounded-lg animate-pulse" />
            )}
            <img
              className={`max-w-full max-h-full object-contain object-left transition-opacity duration-300 ${logoLoaded ? "opacity-100" : "opacity-0"}`}
              src="https://res.cloudinary.com/dxqs4sg8j/image/upload/v1784673289/Gemini_Generated_Image_42k8yv42k8yv42k8_qlrij0.png"
              alt="Portfolio Site"
              loading="eager"
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(true)}
            />
          </div>
          {sidebarOpen && (
            <p className="text-xs text-gray-400 truncate w-full relative left-[9px]">Manage your store</p>
          )}
        </div>

        <nav
          className={`
            flex-1 overflow-y-auto py-4 space-y-0.5
            ${sidebarOpen ? "px-3" : "px-1 sm:px-1.5 md:px-2"}
          `}
        >
          {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) => `
                w-full flex items-center gap-3 rounded-xl text-sm font-medium
                transition-colors duration-150
                ${sidebarOpen ? "px-3 py-2.5" : "justify-center px-2 py-2.5"}
                ${isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="px-5 py-3 border-t border-gray-100 shrink-0">
            <p className="text-xs text-gray-300 text-center">v1.0.0</p>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen
                ? <X className="w-5 h-5 text-gray-500" />
                : <Menu className="w-5 h-5 text-gray-500" />}
            </button>
            <span className="text-sm font-semibold text-gray-800 capitalize">{activeLabel}</span>
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
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
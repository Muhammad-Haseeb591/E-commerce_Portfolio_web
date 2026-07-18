import {
  Bar, BarChart, Line, LineChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { DollarSign, ShoppingCart, Package, Users, Home } from "lucide-react";
import { fetchAllOrders } from "../redux_Toolkit/OrderSlice";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS = {
  delivered:  "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  shipped:    "bg-gray-800 text-white",
  pending:    "bg-yellow-100 text-yellow-700",
  cancelled:  "bg-red-100 text-red-600",
};

const StatusBadge = ({ status }) => (
  <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize shrink-0 ${STATUS[status] ?? "bg-gray-100 text-gray-600"}`}>
    {status || "pending"}
  </span>
);

// ─── Simple stat card ──────────────────────────────────────────────────────────

const StatBox = ({ icon: Icon, label, value, change }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-3">
    <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
    {change ? (
      <p className={`text-xs mt-0.5 font-medium ${change.startsWith("-") ? "text-red-500" : "text-green-600"}`}>
        {change} vs last month
      </p>
    ) : null}
  </div>
);

// ─── Chart card ────────────────────────────────────────────────────────────────

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
      {title}
    </h3>
    {children}
  </div>
);

const tooltipStyle = {
  contentStyle: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 12,
  },
  cursor: { fill: "#f3f4f6" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pctChange = (current, previous) => {
  if (!previous) return current > 0 ? "+100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
};

// ─── Main component ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const dispatch = useDispatch();

  // 🔑 fetchAllOrders() writes into `allOrders` / `allOrdersLoading` / `allOrdersError`
  // in orderSlice.js — not `orders` / `loading` / `error` (those belong to the
  // customer-facing fetchOrders thunk). Reading the wrong keys meant this
  // dashboard always saw an empty array, no matter what the API returned.
  const {
    allOrders: orders = [],
    allOrdersLoading: loading,
    allOrdersError: error,
  } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);

    let totalRevenue = 0;
    let currentMonthRevenue = 0;
    let prevMonthRevenue = 0;
    let currentMonthOrders = 0;
    let prevMonthOrders = 0;

    const emailSet = new Set();
    const productSet = new Set();

    const monthMap = new Map();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      monthMap.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
    }

    const dayMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, 0);
    }

    orders.forEach((order) => {
      const amount = Number(order.totalAmount || 0);
      const createdAt = order.createdAt ? new Date(order.createdAt) : null;

      totalRevenue += amount;

      if (order.email) emailSet.add(order.email.toLowerCase());
      (order.items || []).forEach((item) => {
        if (item.name) productSet.add(item.name.toLowerCase());
      });

      if (createdAt) {
        const orderMonth = createdAt.getMonth();
        const orderYear = createdAt.getFullYear();

        if (orderMonth === currentMonth && orderYear === currentYear) {
          currentMonthRevenue += amount;
          currentMonthOrders += 1;
        } else if (orderMonth === prevMonthDate.getMonth() && orderYear === prevMonthDate.getFullYear()) {
          prevMonthRevenue += amount;
          prevMonthOrders += 1;
        }

        const monthKey = `${orderYear}-${orderMonth}`;
        if (monthMap.has(monthKey)) {
          monthMap.set(monthKey, monthMap.get(monthKey) + amount);
        }

        const dayKey = `${orderYear}-${orderMonth}-${createdAt.getDate()}`;
        if (dayMap.has(dayKey)) {
          dayMap.set(dayKey, dayMap.get(dayKey) + amount);
        }
      }
    });

    const salesData = Array.from(monthMap.entries()).map(([key, revenue]) => {
      const [, month] = key.split("-").map(Number);
      return { month: MONTH_LABELS[month], sales: Math.round(revenue) };
    });

    const revenueData = Array.from(dayMap.keys()).map((key) => {
      const [year, month, date] = key.split("-").map(Number);
      const d = new Date(year, month, date);
      return { day: DAY_LABELS[d.getDay()], revenue: Math.round(dayMap.get(key)) };
    });

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: emailSet.size,
      totalProducts: productSet.size,
      revenueChange: pctChange(currentMonthRevenue, prevMonthRevenue),
      ordersChange: pctChange(currentMonthOrders, prevMonthOrders),
      salesData,
      revenueData,
      recentOrders,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-sm font-medium text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-sm font-medium text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 space-y-4 max-w-3xl mx-auto">
      {/* ── Stats — 2 cols on mobile, 4 on desktop ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatBox icon={DollarSign} label="Revenue" value={`Rs. ${stats.totalRevenue.toLocaleString()}`} change={stats.revenueChange} />
        <StatBox icon={ShoppingCart} label="Orders" value={stats.totalOrders} change={stats.ordersChange} />
        <StatBox icon={Package} label="Products" value={stats.totalProducts} />
        <StatBox icon={Users} label="Customers" value={stats.totalCustomers} />
      </div>

      {/* ── Charts — full width, stacked ── */}
      <ChartCard title="Sales (Last 6 Months)">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={stats.salesData}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip {...tooltipStyle} />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#1f2937"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#1f2937" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Revenue (Last 7 Days)">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.revenueData} barSize={20}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="revenue" fill="#1f2937" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Recent Orders — card list (mobile-friendly, no table scroll) ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent Orders
        </h3>

        <div className="space-y-3">
          {stats.recentOrders.map((order) => (
            <div key={order._id} className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                </p>
                <p className="text-xs text-gray-400 truncate">{order.email || "—"}</p>
                <p className="text-xs text-gray-400">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <p className="text-sm font-bold text-gray-900">
                  Rs. {Number(order.totalAmount || 0).toLocaleString()}
                </p>
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}

          {stats.recentOrders.length === 0 && (
            <p className="text-center py-4 text-sm text-gray-400">No orders found</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
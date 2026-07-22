import {
  Bar, BarChart, Line, LineChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import { fetchDashboardStats } from "../redux_Toolkit/OrderSlice";

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

// ─── Skeleton: stat card ────────────────────────────────────────────────────────

const StatBoxSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-3 animate-pulse">
    <div className="flex items-center gap-1.5 mb-1.5">
      <div className="w-3.5 h-3.5 bg-gray-200 rounded" />
      <div className="h-2.5 w-14 bg-gray-200 rounded" />
    </div>
    <div className="h-5 w-20 bg-gray-200 rounded mb-1.5" />
    <div className="h-2.5 w-16 bg-gray-100 rounded" />
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

// ─── Skeleton: chart card ───────────────────────────────────────────────────────

const ChartCardSkeleton = ({ title }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
      {title}
    </h3>
    <div className="h-[180px] w-full bg-gray-100 rounded-lg flex items-end gap-2 p-3">
      {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-200 rounded-t"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
);

// ─── Skeleton: recent order row ─────────────────────────────────────────────────

const OrderRowSkeleton = () => (
  <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0 animate-pulse">
    <div className="min-w-0 space-y-1.5 flex-1">
      <div className="h-3.5 w-24 bg-gray-200 rounded" />
      <div className="h-2.5 w-32 bg-gray-100 rounded" />
      <div className="h-2.5 w-16 bg-gray-100 rounded" />
    </div>
    <div className="flex flex-col items-end gap-1.5 shrink-0">
      <div className="h-3.5 w-16 bg-gray-200 rounded" />
      <div className="h-5 w-14 bg-gray-100 rounded-full" />
    </div>
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

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Main component ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const dispatch = useDispatch();

  const {
    dashboardStats: stats,
    dashboardLoading: loading,
    dashboardError: error,
  } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (error) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-sm font-medium text-red-500">{error}</p>
      </div>
    );
  }

  // stats abhi tak nahi aya — sirf tab tak skeletons dikhao
  const isLoading = loading || !stats;

  const salesData = stats
    ? stats.salesData.map((m) => ({ month: MONTH_LABELS[m.month - 1], sales: m.sales }))
    : [];
  const revenueData = stats
    ? stats.revenueData.map((d) => ({
        day: DAY_LABELS[new Date(d.year, d.month - 1, d.day).getDay()],
        revenue: d.revenue,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 space-y-4 max-w-3xl mx-auto">
      {/* ── Stats — 2 cols on mobile, 4 on desktop ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {isLoading ? (
          <>
            <StatBoxSkeleton />
            <StatBoxSkeleton />
            <StatBoxSkeleton />
            <StatBoxSkeleton />
          </>
        ) : (
          <>
            <StatBox icon={DollarSign} label="Revenue" value={`Rs. ${stats.totalRevenue.toLocaleString()}`} change={stats.revenueChange} />
            <StatBox icon={ShoppingCart} label="Orders" value={stats.totalOrders} change={stats.ordersChange} />
            <StatBox icon={Package} label="Products" value={stats.totalProducts} />
            <StatBox icon={Users} label="Customers" value={stats.totalCustomers} />
          </>
        )}
      </div>

      {/* ── Charts — full width, stacked ── */}
      {isLoading ? (
        <ChartCardSkeleton title="Sales (Last 6 Months)" />
      ) : (
        <ChartCard title="Sales (Last 6 Months)">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={salesData}>
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
      )}

      {isLoading ? (
        <ChartCardSkeleton title="Revenue (Last 7 Days)" />
      ) : (
        <ChartCard title="Revenue (Last 7 Days)">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData} barSize={20}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="revenue" fill="#1f2937" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Recent Orders — card list (mobile-friendly, no table scroll) ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent Orders
        </h3>

        <div className="space-y-3">
          {isLoading ? (
            <>
              <OrderRowSkeleton />
              <OrderRowSkeleton />
              <OrderRowSkeleton />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
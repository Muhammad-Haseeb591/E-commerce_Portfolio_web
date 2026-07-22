// SalesReportPage.jsx
import {
  Line, LineChart, Bar, BarChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSalesReport, setReportFilters } from "../redux_Toolkit/reportSlice";

const tooltipStyle = {
  contentStyle: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 },
  cursor: { fill: "#f3f4f6" },
};

const StatBox = ({ label, value }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-3">
    <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
    <p className="text-lg font-bold text-gray-900 leading-tight mt-1">{value}</p>
  </div>
);

const StatBoxSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-3 animate-pulse">
    <div className="h-2.5 w-16 bg-gray-200 rounded mb-2" />
    <div className="h-5 w-20 bg-gray-200 rounded" />
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
    {children}
  </div>
);

const ChartCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
    <div className="h-[200px] w-full bg-gray-100 rounded-lg" />
  </div>
);

const GroupByToggle = ({ active, onChange }) => (
  <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
    {["day", "month"].map((g) => (
      <button
        key={g}
        onClick={() => onChange(g)}
        className={`px-3 py-1.5 text-xs font-medium capitalize ${
          active === g ? "bg-gray-800 text-white" : "bg-white text-gray-600"
        }`}
      >
        {g}
      </button>
    ))}
  </div>
);

function SalesReportPage() {
  const dispatch = useDispatch();
  const { filters, summary, timeline, topProducts, status } = useSelector((s) => s.report);

  useEffect(() => {
    dispatch(fetchSalesReport(filters));
  }, [dispatch, filters]);

  const isLoading = status === "loading" || !summary;

  const handleGroupByChange = (groupBy) => {
    dispatch(setReportFilters({ groupBy }));
  };

  const chartData = (timeline || []).map((t) => ({
    label: filters?.groupBy === "month" ? t.month : t.day,
    revenue: t.revenue,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Sales Report</h2>
        <GroupByToggle active={filters?.groupBy || "day"} onChange={handleGroupByChange} />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {isLoading ? (
          <>
            <StatBoxSkeleton />
            <StatBoxSkeleton />
          </>
        ) : (
          <>
            <StatBox label="Total Revenue" value={`Rs. ${summary.totalRevenue.toLocaleString()}`} />
            <StatBox label="Total Orders" value={summary.totalOrders} />
          </>
        )}
      </div>

      {isLoading ? (
        <ChartCardSkeleton />
      ) : (
        <ChartCard title={`Revenue by ${filters?.groupBy || "day"}`}>
          <ResponsiveContainer width="100%" height={200}>
            {filters?.groupBy === "month" ? (
              <BarChart data={chartData} barSize={20}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="revenue" fill="#1f2937" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="revenue" stroke="#1f2937" strokeWidth={2} dot={{ r: 2.5, fill: "#1f2937" }} isAnimationActive={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top Products</h3>
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium text-right">Units Sold</th>
                <th className="pb-2 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(topProducts || []).map((p) => (
                <tr key={p._id || p.productId} className="border-t border-gray-100">
                  <td className="py-2 text-gray-800 truncate max-w-[160px]">{p.name}</td>
                  <td className="py-2 text-right text-gray-600">{p.unitsSold}</td>
                  <td className="py-2 text-right font-semibold text-gray-900">
                    Rs. {Number(p.revenue || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!topProducts || topProducts.length === 0) && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default SalesReportPage;
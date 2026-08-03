// SalesReportPage.jsx
import {
  Line, LineChart, Bar, BarChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSalesReport, setReportFilters } from "../store/reportSlice";
import SEO from "../common/SEO";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// ---- formatting helpers ----
const formatRs = (value) => `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;

// compact axis labels: 15000 -> 15k, 1200000 -> 1.2M
const formatCompact = (value) => {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
};

// ---- custom tooltip (fixes the raw "revenue : 213993" default look) ----
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const revenue = payload[0]?.value;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[11px] font-medium text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{formatRs(revenue)}</p>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <Card>
      <CardContent className="p-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <p className="text-base sm:text-lg font-bold text-foreground leading-tight mt-1">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function StatBoxSkeleton() {
  return (
    <Card>
      <CardContent className="p-3">
        <Skeleton className="h-2.5 w-16 mb-2" />
        <Skeleton className="h-5 w-20" />
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }) {
  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 pb-0">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-3">{children}</CardContent>
    </Card>
  );
}

function ChartCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-[160px] sm:h-[200px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function ChartEmptyState() {
  return (
    <div className="h-[160px] sm:h-[200px] w-full flex items-center justify-center">
      <p className="text-xs text-gray-400">Is period ke liye koi data nahi hai</p>
    </div>
  );
}

function GroupByToggle({ active, onChange, disabled }) {
  return (
    <ToggleGroup
      type="single"
      value={active}
      onValueChange={(val) => {
        // ToggleGroup fires onValueChange with "" when re-clicking the active item —
        // ignore that so we never clear the selection.
        if (val) onChange(val);
      }}
      disabled={disabled}
      className="inline-flex rounded-lg border border-border overflow-hidden"
    >
      <ToggleGroupItem
        value="day"
        className="px-3 py-1.5 text-xs font-medium capitalize rounded-none data-[state=on]:bg-gray-800 data-[state=on]:text-white"
      >
        Day
      </ToggleGroupItem>
      <ToggleGroupItem
        value="month"
        className="px-3 py-1.5 text-xs font-medium capitalize rounded-none data-[state=on]:bg-gray-800 data-[state=on]:text-white"
      >
        Month
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function SalesReportPage() {
  const dispatch = useDispatch();
  // 🔑 real reportSlice shape: filters, summary, timeline, topProducts, status, error, hasFetchedOnce
  const { filters, summary, timeline, topProducts, status, error, hasFetchedOnce } =
    useSelector((s) => s.report);

  useEffect(() => {
    dispatch(fetchSalesReport(filters));
  }, [dispatch, filters]);

  const isFetching = status === "loading";
  const showFullSkeleton = isFetching && !hasFetchedOnce;

  const handleGroupByChange = (groupBy) => {
    if (groupBy === filters?.groupBy || isFetching) return;
    dispatch(setReportFilters({ groupBy }));
  };

  // Number-safe mapping — if the API ever sends revenue as a string/undefined
  // (e.g. Mongo Decimal128 not serialized properly), bars/line won't silently vanish.
  // NOTE: backend always returns { date, revenue, orders } regardless of groupBy —
  // groupBy only changes the date *format* ("2024-05-01" vs "2024-05"), not the key name.
  const chartData = (timeline || [])
    .map((t) => ({
      label: t.date,
      revenue: Number(t.revenue) || 0,
    }))
    .filter((d) => d.label);

  const hasChartData = chartData.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 space-y-4 max-w-3xl mx-auto">
      <SEO
        title="Admin Dashboard | STORE"
        description="Admin dashboard for managing STORE's products, orders, and reports."
        noIndex
      />

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-700">Sales Report</h2>
        <GroupByToggle
          active={filters?.groupBy || "day"}
          onChange={handleGroupByChange}
          disabled={isFetching}
        />
      </div>

      {/* background refetch indicator — old data stays on screen while a new page loads */}
      {isFetching && hasFetchedOnce && (
        <div className="h-0.5 w-full bg-gray-200 rounded overflow-hidden">
          <div className="h-full w-1/3 bg-gray-800 animate-pulse" />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="py-2 px-3 text-xs">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {showFullSkeleton ? (
          <>
            <StatBoxSkeleton />
            <StatBoxSkeleton />
          </>
        ) : (
          <>
            <StatBox
              label="Total Revenue"
              value={formatRs(summary?.totalRevenue)}
            />
            <StatBox label="Total Orders" value={summary?.totalOrders || 0} />
          </>
        )}
      </div>

      {showFullSkeleton ? (
        <ChartCardSkeleton />
      ) : (
        <ChartCard title={`Revenue by ${filters?.groupBy || "day"}`}>
          {!hasChartData ? (
            <ChartEmptyState />
          ) : (
            <div className="h-[160px] sm:h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {filters?.groupBy === "month" ? (
                  <BarChart data={chartData} barSize={20} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis
                      width={36}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatCompact}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
                    <Bar dataKey="revenue" fill="#1f2937" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis
                      width={36}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatCompact}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }} />
                    <Line type="monotone" dataKey="revenue" stroke="#1f2937" strokeWidth={2} dot={{ r: 2.5, fill: "#1f2937" }} isAnimationActive={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      )}

      <Card>
        <CardHeader className="p-3 sm:p-4 pb-0">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Top Products
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-3">
          {showFullSkeleton ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
              <Table className="min-w-[420px] sm:min-w-0">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs uppercase tracking-wide">Product</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-right">Units Sold</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* backend groups by "$items.name" with no product id, so we key
                      on name+index — name alone could collide if two products share it */}
                  {(topProducts || []).map((p, i) => (
                    <TableRow key={`${p.name}-${i}`}>
                      <TableCell className="text-gray-800 truncate max-w-[160px]">{p.name}</TableCell>
                      <TableCell className="text-right text-gray-600">{p.qty}</TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatRs(p.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!topProducts || topProducts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-4 text-center text-gray-400">
                        No data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SalesReportPage;
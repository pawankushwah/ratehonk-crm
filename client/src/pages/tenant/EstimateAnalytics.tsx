import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import {
  BarChart3,
  Clock,
  FileText,
  CheckCircle,
  Receipt,
  ReceiptText,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useAllEstimates } from "@/hooks/useDashboardData";
import { useMemo, useState } from "react";
import { DateFilter } from "@/components/ui/date-filter";

const EstimateAnalytics = () => {
  const STATUS_TEXT_COLORS: Record<string, string> = {
    "text-gray-800": "#1F2937",
    "text-blue-800": "#1E40AF",
    "text-yellow-800": "#B45309",
    "text-green-800": "#166534",
    "text-red-800": "#991B1B",
  };

  const [dateFilter, setDateFilter] = useState("this_quarter");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const { data: estimates = [], isLoading } = useAllEstimates(
    dateFilter,
    customDateFrom,
    customDateTo
  );

  const analytics = useMemo(() => {
    const totalValue = estimates.reduce(
      (sum, est) => sum + parseFloat(est.totalAmount?.toString() || "0"),
      0
    );
    const acceptedValue = estimates
      .filter((est) => est.status === "accepted")
      .reduce(
        (sum, est) => sum + parseFloat(est.totalAmount?.toString() || "0"),
        0
      );
    const pendingValue = estimates
      .filter((est) => ["draft", "sent", "viewed"].includes(est.status || ""))
      .reduce(
        (sum, est) => sum + parseFloat(est.totalAmount?.toString() || "0"),
        0
      );
    const conversionRate =
      estimates.length > 0
        ? (estimates.filter((est) => est.status === "accepted").length /
            estimates.length) *
          100
        : 0;

    return {
      totalEstimates: estimates.length,
      totalValue,
      acceptedValue,
      pendingValue,
      conversionRate,
    };
  }, [estimates]);

  const estimateStatuses = [
    { value: "all", label: "All Status" },
    { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
    { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-800" },
    {
      value: "viewed",
      label: "Viewed",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "accepted",
      label: "Accepted",
      color: "bg-green-100 text-green-800",
    },
    { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
    { value: "expired", label: "Expired", color: "bg-gray-100 text-gray-800" },
  ];

  const chartData = useMemo(() => {
    // Status distribution for pie chart
    const statusData = estimateStatuses
      .map((status) => ({
        name: status.label,
        value: estimates.filter((est) => est.status === status.value).length,
        color:
          status.value === "draft"
            ? "#9CA3AF"
            : status.value === "sent"
              ? "#3B82F6"
              : status.value === "viewed"
                ? "#F59E0B"
                : status.value === "accepted"
                  ? "#10B981"
                  : status.value === "rejected"
                    ? "#EF4444"
                    : "#6B7280",
      }))
      .filter((item) => item.value > 0);

    // Monthly value trends for bar chart
    const monthlyData = estimates.reduce(
      (acc, est) => {
        const month = new Date(est.createdAt).toLocaleDateString("en", {
          month: "short",
          year: "numeric",
        });
        const existing = acc.find((item) => item.month === month);
        if (existing) {
          existing.value += parseFloat(est.totalAmount?.toString() || "0");
          existing.count += 1;
        } else {
          acc.push({
            month,
            value: parseFloat(est.totalAmount?.toString() || "0"),
            count: 1,
          });
        }
        return acc;
      },
      [] as Array<{ month: string; value: number; count: number }>
    );

    return { statusData, monthlyData };
  }, [estimates, estimateStatuses]);

  const rawStatusData = estimateStatuses
    .filter((st) => st.value !== "all")
    .map((status) => {
      const count = estimates.filter(
        (est) => est.status === status.value
      ).length;

      const textClass = status.color
        ?.split(" ")
        .find((cls) => cls.startsWith("text-"));

      return {
        label: status.label,
        value: count,
        textColor: STATUS_TEXT_COLORS[textClass || "text-gray-800"],
      };
    });

  const maxValue = Math.max(...rawStatusData.map((d) => d.value), 0);

  const statusChartData = rawStatusData.map((row) => ({
    ...row,
    remainder: maxValue - row.value,
  }));

  return (
    <div className="space-y-6">
      <DateFilter
        className="flex justify-end  mr-15"
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        customDateFrom={customDateFrom}
        setCustomDateFrom={setCustomDateFrom}
        customDateTo={customDateTo}
        setCustomDateTo={setCustomDateTo}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-800">
                {analytics.totalEstimates}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ReceiptText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Accepted</p>
              <p className="text-2xl font-bold text-gray-800">
                ${analytics.acceptedValue.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-gray-800">
                ${analytics.totalValue.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Conv. Rate</p>
              <p className="text-2xl font-bold text-gray-800">
                {analytics.conversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {chartData.statusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
            <CardDescription>Breakdown of estimates by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Value Trends</CardTitle>
            <CardDescription>Estimate values by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value).toLocaleString()}`,
                      "Value",
                    ]}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Breakdown</CardTitle>
          <CardDescription>Total estimates by status</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={statusChartData}
                margin={{ left: 70, right: 50 }}
                barCategoryGap={10}
              >
                <YAxis
                  dataKey="label"
                  type="category"
                  width={80}
                  axisLine={false}
                  tickLine={false}
                  tick={({ x, y, payload }) => {
                    const row = statusChartData.find(
                      (s) => s.label === payload.value
                    );
                    return (
                      <text
                        x={x}
                        y={y}
                        dy={5}
                        fontSize={15}
                        fill={row?.textColor || "#000"}
                        textAnchor="end"
                      >
                        {payload.value}
                      </text>
                    );
                  }}
                />

                <XAxis type="number" hide domain={[0, maxValue]} />

               
                <Bar
                  dataKey="value"
                  stackId="status"
                  fill="#1E40AF"
                  barSize={28}
                />

                
                <Bar
                  dataKey="remainder"
                  stackId="status"
                  fill="#D1D5DB"
                  barSize={28}
                >
                  
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(v) => String(v)} 
                    style={{ fill: "black", fontSize: 14, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstimateAnalytics;


import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users, Calendar, X } from "lucide-react";
import { DateFilter } from "@/components/ui/date-filter";
import { buildDateFilters } from "@/lib/date-filter-helpers";
import { directCustomersApi } from "@/lib/direct-customers-api";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import type { Customer } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomersForGraph } from "@/hooks/useDashboardData";

interface CustomerAnalyticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusFilters = [
  { value: "new", label: "New" },
  { value: "pending", label: "Pending" },
  { value: "previous", label: "Previous" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "closed-won", label: "Closed Won" },
];

const statusColors = [
  "#003A6B",
  "#1B5886",
  "#3776A1",
  "#5293BB",
  "#6EB1D6",
  "#89CFF1",
  "#697FBD",
];

export function CustomerAnalyticsPanel({
  isOpen,
  onClose,
}: CustomerAnalyticsPanelProps) {
  const { tenant } = useAuth();

  // Independent date filters
  const [dateFilter, setDateFilter] = useState("this_quarter");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onEnter = (_: any, index: number) => setActiveIndex(index);
  const onLeave = () => setActiveIndex(null);

  const { data: customers = [], isLoading } = useCustomersForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );

  const totalCustomers = customers.length;

  const previousMonthCount = customers.filter((c) => {
    const date = new Date(c.createdAt || c.created_at || "");
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return date >= lastMonth && date < thisMonth;
  }).length;

  const currentMonthCount = customers.filter((c) => {
    const date = new Date(c.createdAt || c.created_at || "");
    const thisMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    return date >= thisMonth;
  }).length;
  function formatDateLocal(date: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");

    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      " " +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds())
    );
  }

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));

    const monthStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      1,
      0,
      0,
      0
    );
    const monthEnd = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const count = customers.filter((c) => {
      const created = c.createdAt || c.created_at;
      if (!created) return false;

      const customerDate = new Date(created);
      return customerDate >= monthStart && customerDate <= monthEnd;
    }).length;

    return {
      month: date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      start: formatDateLocal(monthStart),
      end: formatDateLocal(monthEnd),
      customers: count,
    };
  });

  console.log("🚀 ~ CustomerAnalyticsPanel ~ monthlyData:", monthlyData);

  // Status Distribution
  const statusDistribution = statusFilters
    .map((filter, index) => {
      const count = customers.filter(
        (c) =>
          (c.crm_status || c.status || "").toLowerCase() ===
          filter.value.toLowerCase()
      ).length;

      return {
        status: filter.label,
        count,
        color: statusColors[index % statusColors.length],
      };
    })
    .filter((item) => item.count > 0);

  const pieDataWithPercentage = statusFilters
    .map((filter) => {
      const count = customers.filter(
        (c) =>
          (c.crm_status || c.status || "").toLowerCase() ===
          filter.value.toLowerCase()
      ).length;
      const percentage =
        totalCustomers > 0 ? Math.round((count / totalCustomers) * 100) : 0;
      return { name: filter.label, value: count, percentage };
    })
    .filter((d) => d.value > 0);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full sm:w-[700px] md:w-[850px] lg:w-[1000px] bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            Customer Analytics
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b">
          <DateFilter
            className="flex justify-end"
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            customDateFrom={customDateFrom}
            setCustomDateFrom={setCustomDateFrom}
            customDateTo={customDateTo}
            setCustomDateTo={setCustomDateTo}
          />
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">Loading analytics...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 ">
                    <CardTitle className="text-sm font-medium">
                      Total Customers
                    </CardTitle>
                    <Users className="h-10 w-10 opacity-90" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{totalCustomers}</div>
                    <p className="text-xs text-muted-foreground">
                      Based on filter
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 ">
                    <CardTitle className="text-sm font-medium">
                      Current Month
                    </CardTitle>
                    <Calendar className="h-10 w-10 opacity-90" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">
                      {currentMonthCount}
                    </div>
                    <p className="text-xs text-muted-foreground">This Month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="space-y-6">
                {/* Monthly Growth */}
                <div className="bg-white rounded-xl p-6 shadow-lg border">
                  <h3 className="text-lg font-semibold mb-6">
                    Monthly Growth (Last 12 Months)
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={monthlyData}>
                      <defs>
                        <linearGradient
                          id="smokeFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#000000"
                            stopOpacity={0.6}
                          />
                          <stop
                            offset="50%"
                            stopColor="#4b4b4b"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="#bfbfbf"
                            stopOpacity={0.05}
                          />
                        </linearGradient>

                        <linearGradient
                          id="smokeStroke"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop offset="0%" stopColor="#000000" />
                          <stop offset="100%" stopColor="#7d7d7d" />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="customers"
                        stroke="url(#smokeStroke)"
                        fill="url(#smokeFill)"
                        strokeWidth={3}
                      />

                      <Line
                        type="monotone"
                        dataKey="customers"
                        stroke="url(#smokeStroke)"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  {/* Donut Chart */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border">
                    <h3 className="text-lg font-semibold mb-6">
                      Status Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          dataKey="count"
                          nameKey="status"
                          onMouseEnter={onEnter}
                          onMouseLeave={onLeave}
                          paddingAngle={3}
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.color}
                              style={{
                                filter:
                                  activeIndex === index
                                    ? "brightness(1.15)"
                                    : "brightness(1)",
                                transition: "0.3s",
                                cursor: "pointer",
                              }}
                            />
                          ))}
                        </Pie>

                     
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const { status, count } = payload[0].payload;
                            return (
                              <div className="bg-white shadow-lg rounded-md p-2 text-sm border">
                                <p className="font-semibold">{status}</p>
                                <p className="text-gray-600">Count: {count}</p>
                              </div>
                            );
                          }}
                        />

                       
                        <Legend
                          verticalAlign="bottom"
                          align="center"
                          iconType="circle"
                          formatter={(value) => (
                            <span className="text-gray-700 text-sm">
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Percentage Pie */}
                  {/* <div className="bg-white rounded-xl p-6 shadow-lg border">
                    <h3 className="text-lg font-semibold mb-6">
                      Status Breakdown (%)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieDataWithPercentage}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) =>
                            `${name}: ${percentage}%`
                          }
                          outerRadius={90}
                          dataKey="value"
                        >
                          {pieDataWithPercentage.map((_, i) => (
                            <Cell
                              key={i}
                              fill={
                                [
                                  "#3b82f6",
                                  "#10b981",
                                  "#f59e0b",
                                  "#ef4444",
                                  "#8b5cf6",
                                  "#6366f1",
                                ][i % 6]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div> */}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
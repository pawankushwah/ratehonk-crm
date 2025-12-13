import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  LabelList,
  Cell,
  Area,
} from "recharts";

import {
  BarChart3,
  CheckCircle,
  Clock,
  Receipt,
  TrendingUp,
  IndianRupee,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInvoicesForGraph } from "@/hooks/useDashboardData";
import { useAuth } from "@/components/auth/auth-provider";
import { useState } from "react";
import { DateFilter } from "@/components/ui/date-filter";

const COLORS = [
  "#023e8a",
  "#0077b6",
  "#0096c7",
  "#00b4d8",
  "#48cae4",
  "#90e0ef",
  "#a2d2ff",
];

const invoiceStatuses = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
  {
    value: "partial",
    label: "Partially Paid",
    color: "bg-blue-100 text-blue-800",
  },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-800" },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800",
  },
  {
    value: "void",
    label: "Void",
    color: "bg-purple-100 text-purple-800",
  },
];

export default function InvoiceAnalyticsSheet({
  isAnalyticsOpen,
  setIsAnalyticsOpen,
}) {
  const [dateFilter, setDateFilter] = useState("this_quarter");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);
  const { tenant } = useAuth();

  const [activeIndex, setActiveIndex] = useState(null);
  const { data: invoices = [], isLoading } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );

  console.log("🚀 ~ InvoiceAnalyticsSheet ~ invoiceGraphData:", invoices);

  function toNum(v: any) {
    return Number(v || 0);
  }

  const totalInvoices = invoices.length;

  const totalAmount = invoices.reduce(
    (sum, inv) => sum + toNum(inv.totalAmount),
    0
  );

  let paidAmount = 0;
  let pendingAmount = 0;

  invoices.forEach((inv) => {
    const total = toNum(inv.totalAmount);
    const paid = toNum(inv.paidAmount);

    if (inv.status === "paid") {
      paidAmount += total;
    } else if (inv.status === "partially_paid") {
      paidAmount += paid;
      pendingAmount += Math.max(0, total - paid);
    } else {
      pendingAmount += total;
    }
  });

  const collectionRate =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const statusData = invoiceStatuses.map((status) => ({
    name: status.label,
    count: invoices.filter((inv) => inv.status === status.value).length,
    color:
      status.value === "paid"
        ? "#10b981"
        : status.value === "pending"
          ? "#f59e0b"
          : status.value === "overdue"
            ? "#ef4444"
            : "#6b7280",
  }));

  const monthlyData = invoices
    .reduce((acc: any[], inv) => {
      const date = new Date(inv.issueDate || Date.now());

      const year = date.getFullYear();
      const monthNum = date.getMonth() + 1;
      const monthPadded = monthNum.toString().padStart(2, "0");

      const key = Number(`${year}${monthPadded}`);
      const monthLabel = date.toLocaleString("default", {
        month: "short",
      });

      const amount = Number(inv.totalAmount || 0);
      const paidField = Number((inv as any).paidAmount || 0);

      let paid = 0;
      let pending = 0;

      if (inv.status === "paid") {
        paid = amount;
        pending = 0;
      } else if (inv.status === "partially_paid") {
        paid = paidField;
        pending = Math.max(0, amount - paidField);
      } else {
        paid = 0;
        pending = amount;
      }

      const existing = acc.find((item) => item.key === key);

      if (existing) {
        existing.total += amount;
        existing.paid += paid;
        existing.pending += pending;
      } else {
        acc.push({
          key,
          month: monthLabel,
          total: amount,
          paid,
          pending,
        });
      }

      return acc;
    }, [])

    .sort((a, b) => a.key - b.key);

  console.log("🚀 ~ InvoiceAnalyticsSheet ~ monthlyData:", monthlyData);

  return (
    <Sheet open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" data-testid="button-analytics">
          <BarChart3 className="mr-2 h-4 w-4" />
          Analytics
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[700px] sm:max-w-[800px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Invoice Analytics</SheetTitle>
          <SheetDescription>
            Overview of your invoice metrics and trends
          </SheetDescription>
        </SheetHeader>

        <DateFilter
          className="flex justify-end"
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          customDateFrom={customDateFrom}
          setCustomDateFrom={setCustomDateFrom}
          customDateTo={customDateTo}
          setCustomDateTo={setCustomDateTo}
        />

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Total Invoices
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {totalInvoices}
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
                  <p className="text-sm text-gray-500 font-medium">
                    Total Amount
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    ${totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Paid Amount
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    ${paidAmount.toLocaleString()}
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
                  <p className="text-sm text-gray-500 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {pendingAmount.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                Collection Rate
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-5xl font-extrabold text-gray-700 tracking-tight">
                {collectionRate}%
              </div>

              <div className="relative w-full h-5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-400 to-gray-600 transition-all duration-500"
                  style={{ width: `${collectionRate}%` }}
                />

                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-100">
                  {collectionRate}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Tooltip />

                  <Pie
                    data={statusData}
                    dataKey="count"
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={55}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    onMouseEnter={(_, idx) => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`inner-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{
                          transition: "0.3s ease",
                          cursor: "pointer",
                          stroke: activeIndex === index ? "#00000020" : "none",
                          strokeWidth: activeIndex === index ? 6 : 0,
                        }}
                      />
                    ))}
                  </Pie>

                  <Pie
                    data={statusData}
                    dataKey="count"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                    stroke="none"
                    onMouseEnter={(_, idx) => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`outer-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{
                          transition: "0.3s ease",
                          cursor: "pointer",
                          stroke: activeIndex === index ? "#00000030" : "none",
                          strokeWidth: activeIndex === index ? 6 : 0,
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-2">
                {statusData?.map((s, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {s.name}
                      </span>
                    </div>
                    <Badge className="bg-slate-500">{s.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {monthlyData?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#0077b6" name="Total Amount" />
                    <Bar dataKey="paid" fill="#023e8a" name="Paid Amount" />
                    <Bar
                      dataKey="pending"
                      fill="#0096c7"
                      name="Pending Amount"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {monthlyData?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Payment Timeline
                </CardTitle>
              </CardHeader>

              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={monthlyData}
                    margin={{ left: 30, right: 20, top: 10 }}
                  >
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#666", fontSize: 12 }}
                    />

                    <YAxis
                      axisLine={{ stroke: "#999", strokeWidth: 1 }}
                      tickLine={false}
                      tick={{ fill: "#666", fontSize: 12 }}
                      domain={[0, "auto"]}
                    />

                    <Tooltip cursor={false} />

                    <defs>
                      <linearGradient
                        id="blackSmokeLine"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="#000000"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="50%"
                          stopColor="#333333"
                          stopOpacity={0.7}
                        />
                        <stop
                          offset="100%"
                          stopColor="#666666"
                          stopOpacity={0.4}
                        />
                      </linearGradient>

                      <linearGradient
                        id="blueSmokeLine"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3B82F6"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="50%"
                          stopColor="#60A5FA"
                          stopOpacity={0.7}
                        />
                        <stop
                          offset="100%"
                          stopColor="#93C5FD"
                          stopOpacity={0.4}
                        />
                      </linearGradient>

                      <linearGradient
                        id="blackSmokeArea"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#000000"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="60%"
                          stopColor="#333333"
                          stopOpacity={0.07}
                        />
                        <stop
                          offset="100%"
                          stopColor="#666666"
                          stopOpacity={0.04}
                        />
                      </linearGradient>
                    </defs>

                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="none"
                      fill="url(#blackSmokeArea)"
                      fillOpacity={1}
                      animationDuration={900}
                    />

                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="url(#blackSmokeLine)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      dot={false}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                        stroke: "#fff",
                        fill: "#000",
                      }}
                      animationDuration={1000}
                    />

                    <Line
                      type="monotone"
                      dataKey="paid"
                      stroke="url(#blueSmokeLine)"
                      strokeWidth={2.5}
                      strokeDasharray="5 3"
                      strokeLinecap="round"
                      dot={false}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                        stroke: "#fff",
                        fill: "#3B82F6",
                      }}
                      animationDuration={1200}
                    />

                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: "#666", fontSize: "12px" }}>
                          {value === "total" ? "Total Amount" : "Paid Amount"}
                        </span>
                      )}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

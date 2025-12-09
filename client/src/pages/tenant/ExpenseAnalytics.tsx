

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  LabelList,
  Cell,
} from "recharts";

import {
  BarChart3,
  DollarSign,
  Clock,
  CheckCircle,
  Receipt,
  ReceiptText,
} from "lucide-react";
import { useExpenses } from "@/hooks/useDashboardData";
import { useState } from "react";
import { DateFilter } from "@/components/ui/date-filter";

interface Props {
  show: boolean;
  setShow: (open: boolean) => void;
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  reimbursableAmount: number;
  expenses: any[];
  EXPENSE_CATEGORIES: any[];
  formatCurrency: (val: string) => string;
}

export default function ExpenseAnalytics({ show, setShow }: Props) {
  const EXPENSE_CATEGORIES = [
    {
      value: "travel",
      label: "Travel & Transportation",
      icon: "🚗",
      color: "#3B82F6",
    },
    { value: "office", label: "Office Supplies", icon: "🏢", color: "#6B7280" }, // gray
    {
      value: "marketing",
      label: "Marketing & Advertising",
      icon: "📢",
      color: "#22C55E",
    }, 
    {
      value: "software",
      label: "Software & Tools",
      icon: "💻",
      color: "#8B5CF6",
    }, 
    {
      value: "meals",
      label: "Meals & Entertainment",
      icon: "🍽️",
      color: "#F97316",
    },
    {
      value: "training",
      label: "Training & Education",
      icon: "📚",
      color: "#6366F1",
    },
    {
      value: "equipment",
      label: "Equipment & Hardware",
      icon: "⚙️",
      color: "#EF4444",
    }, 
    {
      value: "communication",
      label: "Communication",
      icon: "📞",
      color: "#06B6D4",
    }, 
    { value: "utilities", label: "Utilities", icon: "⚡", color: "#EAB308" }, 
    { value: "other", label: "Other", icon: "📦", color: "#94A3B8" }, 
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const [dateFilter, setDateFilter] = useState("this_year");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const { data: expensesData = [], isLoading } = useExpenses(
    dateFilter,
    customDateFrom,
    customDateTo
  );
  console.log("🚀 ~ ExpenseAnalytics ~ expensesData:", expensesData);

  const STATUS_COLORS: Record<string, string> = {
    pending: "#EAB308",
    approved: "#22C55E",
    rejected: "#EF4444",
    paid: "#3B82F6",
  };


  const baseStatuses = ["pending", "approved", "rejected", "paid"];

 
  const counts: Record<string, number> = {};

  expensesData.forEach((exp) => {
    const status = exp.status.toLowerCase();
    counts[status] = (counts[status] || 0) + 1;
  });

  
  const data = baseStatuses.map((status) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    value: counts[status] || 0,
    color: STATUS_COLORS[status],
  }));
  const totalAmount = expensesData.reduce(
    (sum, exp) => sum + parseFloat(exp.amount),
    0
  );
  const reimbursableAmount = expensesData
    .filter((exp) => exp.isReimbursable)
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const pendingCount = expensesData.filter(
    (exp) => exp.status === "pending"
  ).length;
  const approvedCount = expensesData.filter(
    (exp) => exp.status === "approved"
  ).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalExpenses = expensesData.length;

  const finalCategoryData = EXPENSE_CATEGORIES.map((cat) => {
    const count = expensesData.filter((e) => e.category === cat.value).length;
    const percentage = totalExpenses
      ? Number(((count / totalExpenses) * 100).toFixed(2))
      : 0;

    return count > 0
      ? {
          name: cat.label,
          value: count,
          percentage,
          color: cat.color,
        }
      : null;
  }).filter(Boolean);
  console.log("🚀 ~ ExpenseAnalytics ~ finalCategoryData:", finalCategoryData)

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const item = payload[0].payload;

    return (
      <div className="bg-white shadow-md rounded-md p-2 border text-sm">
        <p className="font-medium">{item.name}</p>
        <p>
          {item.value} expenses —{" "}
          <span className="font-semibold">{item.percentage}%</span>
        </p>
      </div>
    );
  };

  return (
    <Sheet open={show} onOpenChange={setShow}>
      <SheetTrigger asChild>
        <button className="border px-4 py-2 rounded-lg flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="!w-1/2 !max-w-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Expense Analytics
          </SheetTitle>
          <SheetDescription>
            Comprehensive overview of your expense performance and metrics
          </SheetDescription>
        </SheetHeader>

        <DateFilter className="flex justify-end"
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          customDateFrom={customDateFrom}
          setCustomDateFrom={setCustomDateFrom}
          customDateTo={customDateTo}
          setCustomDateTo={setCustomDateTo}
        />

        <div className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white shadow-sm border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Expense
                </p>

                <div className="flex items-end gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>

              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ReceiptText className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white shadow-sm border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending</p>

                <div className="flex items-end gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-800">
                    {pendingCount}
                  </p>
                </div>
              </div>

              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            {/* Approved */}
            <div className="bg-white shadow-sm border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Approved</p>

                <div className="flex items-end gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-800">
                    {approvedCount}
                  </p>
                </div>
              </div>

              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>

            {/* Reimbursable */}
            <div className="bg-white shadow-sm border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Reimbursable
                </p>

                <div className="flex items-end gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(reimbursableAmount)}
                  </p>
                </div>
              </div>

              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Status Pie Chart */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
  layout="vertical"
  data={data}
  margin={{ left: 70, right: 50 }}
  barCategoryGap={20}
>
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={80}
                    axisLine={false}
                    tickLine={false}
                    tick={({ x, y, payload }) => {
                      const status = payload.value.toLowerCase();
                      return (
                        <text
                          x={x}
                          y={y}
                          dy={5}
                          fontSize={15}
                          fill={STATUS_COLORS[status]}
                          textAnchor="end"
                        >
                          {payload.value}
                        </text>
                      );
                    }}
                  />

                  <XAxis type="number" hide />

                  <Bar dataKey="value" fill="#1E40AF" radius={0}>
  <LabelList
    dataKey="value"
    position="right"
    offset={10}
    allowOverflow={true}
    style={{ fill: "black", fontSize: 15, fontWeight: 600 }}
  />
</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Bar Chart */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
             
              <div className="relative w-full h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />

                   
                    <Pie
                      data={finalCategoryData}
                      dataKey="percentage"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={0} 
                      outerRadius={65}
                      startAngle={90}
                      endAngle={450}
                      stroke="none"
                      onMouseEnter={(_, idx) => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {finalCategoryData.map((entry, index) => (
                        <Cell
                          key={`inner-${index}`}
                          fill={entry.color}
                          style={{
                            transition: "0.3s",
                            transform:
                              activeIndex === index
                                ? "scale(1.05)"
                                : "scale(1)",
                            filter:
                              activeIndex === index
                                ? "drop-shadow(0px 0px 6px rgba(0,0,0,0.3))"
                                : "none",
                            transformOrigin: "center",
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </Pie>

                   
                    <Pie
                      data={finalCategoryData}
                      dataKey="percentage"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={100}
                      
                      startAngle={90}
                      endAngle={450}
                      stroke="none"
                      onMouseEnter={(_, idx) => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {finalCategoryData.map((entry, index) => (
                        <Cell
                          key={`outer-${index}`}
                          fill={entry.color}
                          style={{
                            transition: "0.3s",
                            transform:
                              activeIndex === index
                                ? "scale(1.05)"
                                : "scale(1)",
                            filter:
                              activeIndex === index
                                ? "drop-shadow(0px 0px 6px rgba(0,0,0,0.3))"
                                : "none",
                            transformOrigin: "center",
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              
              <div className="space-y-3 text-xs w-full sm:w-1/3">
                {finalCategoryData.map((item, idx) => (
                  <div className="flex items-center gap-3" key={idx}>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />

                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-gray-500 text-[11px]">
                        {item.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

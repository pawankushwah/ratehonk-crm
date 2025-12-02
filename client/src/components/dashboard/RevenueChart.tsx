import { useRef, useState, useMemo } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

import { useProfitLossData } from "@/hooks/useDashboardData";
import { DateFilter } from "../ui/date-filter";

function formatYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function padDay(n: number): string {
  return String(n).padStart(2, "0");
}

function getRange(filter: string, customFrom: Date | null, customTo: Date | null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = today.getFullYear();
  const month = today.getMonth();

  if (filter === "custom" && customFrom && customTo) {
    const start = new Date(customFrom);
    const end = new Date(customTo);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  switch (filter) {
    case "today":
      return { start: today, end: today };

    case "this_week": {
      const start = new Date(today);
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(today.getDate() - diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case "this_month":
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0, 23, 59, 59, 999),
      };

    case "this_year":
      return {
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31, 23, 59, 59, 999),
      };

    default:
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0, 23, 59, 59, 999),
      };
  }
}

function buildChartData(
  profitMap: Record<string, number>,
  filter: string,
  customFrom: Date | null,
  customTo: Date | null
) {
  const { start, end } = getRange(filter, customFrom, customTo);
  const daysDiff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isMonthlyView =
    filter === "this_year" || (filter === "custom" && daysDiff > 60);

  
  if (isMonthlyView) {
    const result = [];

    const startYear = start.getFullYear();
    const startMonth = filter === "this_year" ? 0 : start.getMonth();

    const endYear = end.getFullYear();
    const endMonth = filter === "this_year" ? 11 : end.getMonth();

    const totalMonths =
      (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

    for (let i = 0; i < totalMonths; i++) {
      const monthIndex = startMonth + i;
      const year = startYear + Math.floor(monthIndex / 12);
      const month = monthIndex % 12;

      const key = `${year}-${String(month + 1).padStart(2, "0")}`;

      result.push({
        label: new Date(year, month, 1).toLocaleString("default", {
          month: "short",
        }),
        date: key,
        value: profitMap[key] || 0,
      });
    }

    return result;
  }


  const result = [];
  let curr = new Date(start);

  while (curr <= end) {
    const key = formatYMD(curr);
    const value = profitMap[key] || 0;

    result.push({
      label:
        filter === "today"
          ? "Today"
          : filter === "this_week"
          ? curr.toLocaleDateString("en-US", { weekday: "short" })
          : padDay(curr.getDate()),
      current: value,
      previous: 0,
      date: key,
    });

    curr.setDate(curr.getDate() + 1);
  }

  return result;
}

export function RevenueChart() {
  const [dateFilter, setDateFilter] = useState("this_month");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);
  const { tenant } = useAuth();

  const { data: profitLossData = {}, isLoading } = useProfitLossData(
    dateFilter,
    customDateFrom,
    customDateTo
  );


 
  const profitMap = useMemo(() => {
    const map: Record<string, number> = {};

  
    profitLossData.daily?.forEach((r: any) => {
      map[r.date] = r.profit || 0;
    });

   
    profitLossData.monthly?.forEach((r: any) => {
      map[r.month] = r.profit || 0;
    });

    return map;
  }, [profitLossData]);

  const chartData = useMemo(
    () => buildChartData(profitMap, dateFilter, customDateFrom, customDateTo),
    [profitMap, dateFilter, customDateFrom, customDateTo]
  );

  const totals = useMemo(() => {
    const current = chartData.reduce(
      (sum, d: any) => sum + (d.current ?? d.value ?? 0),
      0
    );

    if (dateFilter === "this_month") {
      const prev = chartData.reduce((s, d: any) => s + (d.previous || 0), 0);
      const growth = prev === 0 ? 0 : ((current - prev) / prev) * 100;
      return { current, previous: prev, growth, showComparison: true };
    }

    return { current, previous: 0, growth: 0, showComparison: false };
  }, [chartData, dateFilter]);

  const formatNumberShort = (num: number) => {
    if (!num) return "0";
    if (num >= 1_000_000_000) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1_000_000) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1e3).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const getPeriodLabel = () => {
    switch (dateFilter) {
      case "today":
        return "Today's Revenue";
      case "this_week":
        return "This Week";
      case "this_month":
        return "This Month vs Previous Month";
      case "this_year":
        return "This Year (Monthly)";
      case "custom":
        return "Custom Period";
      default:
        return "Revenue";
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, width, height);
    pdf.save("revenue-report.pdf");
  };

  return (
    <Card className="lg:col-span-7 bg-white rounded-xl shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#000000] text-lg font-semibold">
            Revenue
          </CardTitle>

          <div className="flex gap-2">
            <DateFilter
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              customDateFrom={customDateFrom}
              setCustomDateFrom={setCustomDateFrom}
              customDateTo={customDateTo}
              setCustomDateTo={setCustomDateTo}
            />

            <Button variant="outline" size="icon" onClick={handleDownloadPDF}>
              <Download size={16} />
            </Button>
          </div>
        </div>

        <p className="text-2xl sm:text-3xl font-semibold text-[#000000] mt-4">
          USD {formatNumberShort(totals.current)}
        </p>

        {totals.showComparison ? (
          <p
            className={`text-sm font-medium mt-1 ${
              totals.growth >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {totals.growth >= 0 ? "Up" : "Down"}{" "}
            {Math.abs(totals.growth).toFixed(1)}% vs last month
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">{getPeriodLabel()}</p>
        )}

        <CardDescription className="mt-3 text-xs text-gray-500">
          {getPeriodLabel()}
        </CardDescription>
      </CardHeader>

      <CardContent ref={pdfRef} className="pt-6">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Loading...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available for selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value: number) => `USD ${value.toLocaleString()}`}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />

              {totals.showComparison ? (
                <>
                  <Bar dataKey="current" fill="#0A64A0" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="previous" fill="#7695C5" radius={[8, 8, 0, 0]} />
                </>
              ) : (
                <Bar
                  dataKey={
                    chartData[0]?.value !== undefined ? "value" : "current"
                  }
                  fill="#0A64A0"
                  radius={[8, 8, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}

        {totals.showComparison && (
          <div className="flex justify-center gap-8 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#0A64A0]" />
              <span>Current Month</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#7695C5]" />
              <span>Previous Month</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

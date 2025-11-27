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
import { useInvoicesForGraph } from "@/hooks/useDashboardData";

const dummyData = [
  { day: "01", last6Days: 80, lastWeek: 50 },
  { day: "02", last6Days: 85, lastWeek: 40 },
  { day: "03", last6Days: 90, lastWeek: 55 },
  { day: "04", last6Days: 100, lastWeek: 60 },
  { day: "05", last6Days: 110, lastWeek: 70 },
  { day: "06", last6Days: 120, lastWeek: 80 },
  { day: "07", last6Days: 95, lastWeek: 60 },
  { day: "08", last6Days: 85, lastWeek: 55 },
  { day: "09", last6Days: 90, lastWeek: 60 },
  { day: "10", last6Days: 88, lastWeek: 58 },
];

function transformToComparison(chartData: any[]) {
  if (!chartData.length) return [];

  const mid = Math.floor(chartData.length / 2);
  const current = chartData.slice(mid);
  const previous = chartData.slice(0, mid);

  return current.map((item: any, index: number) => ({
    day: item.day,
    last6Days: Number(item.revenue) || 0,
    lastWeek: Number(previous[index]?.revenue) || 0,
  }));
}

export function RevenueChart() {
  const [dateFilter, setDateFilter] = useState("this_week");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);
  const { tenant } = useAuth();

 
  const { data: invoices = [], isLoading } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );


  const dailyMap: any = {};

  invoices.forEach((inv: any) => {
    if (!inv.createdAt) return;

    const d = new Date(inv.createdAt);
    const day = d.getDate().toString().padStart(2, "0");

    if (!dailyMap[day]) dailyMap[day] = 0;
    dailyMap[day] += Number(inv.totalAmount || 0);
  });

  const graphData = Object.entries(dailyMap).map(([day, revenue]) => ({
    day,
    revenue,
  }));

  const comparisonData = transformToComparison(graphData);

 
  const finalData = comparisonData.length > 0 ? comparisonData : dummyData;




 
  const totalCurrent = finalData.reduce(
    (sum, x) => sum + (x.last6Days || 0),
    0
  );

  const totalPrevious = finalData.reduce(
    (sum, x) => sum + (x.lastWeek || 0),
    0
  );

  const growth =
    totalPrevious === 0
      ? 0
      : ((totalCurrent - totalPrevious) / totalPrevious) * 100;

  const dateRangeText = useMemo(() => {
    if (!finalData.length) return "No date range";
    const days = finalData.map((d) => d.day);
    return `Sales from ${days[0]}–${days[days.length - 1]}`;
  }, [finalData]);

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save("revenue-report.pdf");
  };


  return (
    <Card className="lg:col-span-7 h-fit bg-white rounded-xl shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#000000] text-lg font-semibold">
            Revenue
          </CardTitle>

          <Button
            variant="outline"
            size="icon"
            onClick={handleDownloadPDF}
            className="rounded-full"
          >
            <Download size={16} />
          </Button>
        </div>

        
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant={dateFilter === "this_week" ? "default" : "outline"}
            onClick={() => setDateFilter("this_week")}
          >
            This Week
          </Button>
          <Button
            size="sm"
            variant={dateFilter === "last_week" ? "default" : "outline"}
            onClick={() => setDateFilter("last_week")}
          >
            Last Week
          </Button>
          <Button
            size="sm"
            variant={dateFilter === "last_month" ? "default" : "outline"}
            onClick={() => setDateFilter("last_month")}
          >
            Last Month
          </Button>
        </div>

     
        <p className="text-2xl sm:text-3xl font-semibold text-[#000000] mt-3">
          USD {totalCurrent.toLocaleString()}
        </p>

     
        <p
          className={`text-xs font-medium mt-1 ${
            growth >= 0 ? "text-green-600" : "text-red-500"
          }`}
        >
          {growth >= 0 ? "↑" : "↓"} {Math.abs(growth).toFixed(1)}% vs last week
        </p>

        <CardDescription className="mt-3 text-xs text-gray-500">
          {finalData === dummyData ? "Showing dummy data" : dateRangeText}
        </CardDescription>
      </CardHeader>

      <CardContent ref={pdfRef} className="p-4">
        <div className="mt-2 h-40">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finalData}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip />

                <Bar dataKey="last6Days" fill="#0A64A0" barSize={8} />
                <Bar dataKey="lastWeek" fill="#7695C5" barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        
        <div className="flex gap-4 mt-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#0A64A0]"></span> Last 6 days
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#7695C5]"></span> Last Week
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
import { DateFilter } from "../ui/date-filter";

function formatYMD(d: Date) {
  return d.toISOString().split("T")[0];
}

function padDay(n: number) {
  return String(n).padStart(2, "0");
}

function getMonthInfo(base: Date) {
  const year = base.getFullYear();
  const month = base.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const daysInMonth = end.getDate();

  return { year, month, start, end, daysInMonth };
}

function groupInvoicesByDate(invoices: any[]) {
  const map: Record<string, number> = {};

  invoices.forEach((inv) => {
    const rawDate = inv.issueDate || inv.createdAt;
    if (!rawDate) return;

    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return;

    const key = formatYMD(d);
    map[key] = (map[key] || 0) + Number(inv.totalAmount || 0);
  });

  return map;
}

function buildMonthComparison(
  invoiceMap: Record<string, number>,
  baseDate: Date
) {
  const { year, month, start, daysInMonth } = getMonthInfo(baseDate);

  // Previous month info
  const prev = new Date(year, month - 1, 1);
  const prevInfo = getMonthInfo(prev);

  const rows = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month, d);
    const prevDate = new Date(prevInfo.year, prevInfo.month, d);

    const dayString = padDay(d);

    rows.push({
      day: dayString,
      current: invoiceMap[formatYMD(currentDate)] || 0,
      previous: invoiceMap[formatYMD(prevDate)] || 0,
      currentIso: formatYMD(currentDate),
      prevIso: formatYMD(prevDate),
    });
  }

  return rows;
}

export function RevenueChart() {
  const [dateFilter, setDateFilter] = useState("this_month");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const [page, setPage] = useState(1);
  const DAYS_PER_PAGE = 15;

  const pdfRef = useRef<HTMLDivElement>(null);
  const { tenant } = useAuth();

  const { data: invoices = [], isLoading } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );
  console.log("🚀 ~ RevenueChart ~ invoices===================:", invoices);

  const invoiceMap = useMemo(() => groupInvoicesByDate(invoices), [invoices]);

  const baseMonthDate = customDateTo ?? new Date();

  const chartData = useMemo(
    () => buildMonthComparison(invoiceMap, baseMonthDate),
    [invoiceMap, baseMonthDate]
  );
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * DAYS_PER_PAGE;
    const endIndex = startIndex + DAYS_PER_PAGE;
    return chartData.slice(startIndex, endIndex);
  }, [chartData, page]);

  const totalCurrent = useMemo(
    () => chartData.reduce((s, x) => s + x.current, 0),
    [chartData]
  );

  const totalPrevious = useMemo(
    () => chartData.reduce((s, x) => s + x.previous, 0),
    [chartData]
  );

  const growth =
    totalPrevious === 0
      ? 0
      : ((totalCurrent - totalPrevious) / totalPrevious) * 100;

  const monthName = baseMonthDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

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
  const formatNumberShort = (num: number) => {
    if (num === null || num === undefined) return "0";

    if (num >= 1_000_000_000_000)
      return (num / 1_000_000_000_000).toFixed(1) + "T";
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";

    return num.toString();
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

        <p className="text-2xl sm:text-3xl font-semibold text-[#000000] mt-3">
          USD {formatNumberShort(totalCurrent)}
        </p>

        <p
          className={`text-xs font-medium mt-1 ${
            growth >= 0 ? "text-green-600" : "text-red-500"
          }`}
        >
          {growth >= 0 ? "↑" : "↓"} {Math.abs(growth).toFixed(1)}% vs last month
        </p>

        <CardDescription className="mt-3 text-xs text-gray-500">
          Showing month: {monthName}
        </CardDescription>
      </CardHeader>

      <CardContent ref={pdfRef} className="p-4">
        <div className="mt-2 h-44">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paginatedData}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value: any) =>
                    `USD ${Number(value).toLocaleString()}`
                  }
                  labelFormatter={(_, payload: any) => {
                    if (!payload?.length) return "";

                    const row = payload[0].payload;
                    const selectedMonth = baseMonthDate
                      .toISOString()
                      .slice(0, 7);

                    return `${selectedMonth}-${row.day}`;
                  }}
                />

                <Bar dataKey="current" fill="#0A64A0" barSize={7} />

                <Bar dataKey="previous" fill="#7695C5" barSize={7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex gap-4 mt-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#0A64A0]"></span> Current Month
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#7695C5]"></span> Previous
            Month
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>

          <Button
            variant="outline"
            disabled={page * DAYS_PER_PAGE >= chartData.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
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
  Legend,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useInvoicesForGraph } from "@/hooks/useDashboardData";
import { DateFilter } from "../ui/date-filter";
import { useQuery } from "@tanstack/react-query";

// Helper function to get currency symbol
const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    JPY: "¥",
    CNY: "¥",
    SGD: "S$",
    HKD: "HK$",
    NZD: "NZ$",
  };
  return symbols[currencyCode] || currencyCode;
};



function formatYMDLocal(d: Date) {
  // Use UTC methods to ensure consistent date formatting across timezones
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInvoiceDate(raw: any) {
  if (!raw) return null;
  const iso = new Date(raw);
  if (!isNaN(iso.getTime())) return iso;

  const alt = new Date(String(raw).replace(" ", "T"));
  if (!isNaN(alt.getTime())) return alt;

  return null;
}

const formatShort = (num: number) => {
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(1) + "T";
  if (abs >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toFixed(2);
};

function groupInvoicesByDate(invoices: any[]) {
  const map: Record<string, number> = {};
  invoices.forEach((inv) => {
    // Check for both snake_case (raw SQL) and camelCase (mapped) property names
    const rawDate = inv.issue_date ?? inv.issueDate ?? inv.created_at ?? inv.createdAt;
    const d = parseInvoiceDate(rawDate);
    if (!d) return;

    const key = formatYMDLocal(d);
    // Sum invoice paid amount (collected) for the selected period.
    const totalAmount = Number(inv.paid_amount ?? inv.paidAmount ?? 0);
    map[key] = (map[key] || 0) + totalAmount;
  });
  return map;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}




function getRange(filter: string, customFrom: Date | null, customTo: Date | null) {
  // Use UTC dates to ensure consistent calculations across timezones
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  today.setUTCHours(0, 0, 0, 0);
  
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();

  
  if (filter === "custom" && customFrom && customTo) {
    return { start: startOfDay(customFrom), end: endOfDay(customTo) };
  }

  switch (filter) {
    case "today":
      return { start: today, end: today };

    case "this_week": {
      const day = today.getUTCDay();
      const diff = day === 0 ? 6 : day - 1;
      const start = new Date(today);
      start.setUTCDate(today.getUTCDate() - diff);
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
      return { start, end };
    }

    case "this_month":
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month + 1, 0)),
      };

    case "this_year":
      return {
        start: new Date(Date.UTC(year, 0, 1)),
        end: new Date(Date.UTC(year, 11, 31)),
      };

 
    case "this_quarter": {
      // Calculate quarter based on UTC month to ensure consistency
      const q = Math.floor(month / 3); // 0,1,2,3
      const qStartMonth = q * 3;
      const qEndMonth = qStartMonth + 2;

      return {
        start: new Date(Date.UTC(year, qStartMonth, 1)),
        end: new Date(Date.UTC(year, qEndMonth + 1, 0)),
      };
    }

    default:
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month + 1, 0)),
      };
  }
}





function buildChartDataFromInvoiceMap(
  invoiceMap: Record<string, number>,
  filter: string,
  customFrom: Date | null,
  customTo: Date | null
) {
  const { start, end } = getRange(filter, customFrom, customTo);

  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / 86400000);


  const isMonthlyView =
    filter === "this_year" ||
    filter === "this_quarter" ||
    (filter === "custom" && daysDiff > 60);

  if (isMonthlyView) {
    const rows: any[] = [];

    // Use UTC methods to avoid timezone issues
    const startYear = start.getUTCFullYear();
    const startMonth = start.getUTCMonth();
    const endYear = end.getUTCFullYear();
    const endMonth = end.getUTCMonth();

    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

    // Month names array to avoid timezone conversion issues
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < totalMonths; i++) {
      const index = startMonth + i;
      const y = startYear + Math.floor(index / 12);
      const m = index % 12;

      const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;

      let value = 0;
      Object.keys(invoiceMap).forEach((dateKey) => {
        if (dateKey.startsWith(monthKey)) value += invoiceMap[dateKey] || 0;
      });

      rows.push({
        label: monthNames[m] || `${m + 1}`, // Use month names array instead of Date conversion
        fullDate: monthKey,
        value,
      });
    }

    return rows;
  }


  const rows: any[] = [];
  const cursor = new Date(start);

  // Day names for weekday display
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  while (cursor <= end) {
    const key = formatYMDLocal(cursor);
    let label = "";
    if (filter === "today") {
      label = "Today";
    } else if (filter === "this_week") {
      // Use UTC day to avoid timezone issues
      const dayIndex = cursor.getUTCDay();
      label = dayNames[dayIndex] || "Unknown";
    } else {
      // Use UTC date to avoid timezone issues
      label = String(cursor.getUTCDate()).padStart(2, "0");
    }
    
    rows.push({
      label,
      fullDate: key,
      current: invoiceMap[key] || 0,
      previous: 0,
    });

    // Increment using UTC to avoid timezone issues
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

 
  if (filter === "this_month") {
    // Use UTC methods to ensure consistency
    const today = customTo ? new Date(customTo) : new Date();
    const y = today.getUTCFullYear();
    const m = today.getUTCMonth();

    const prev = new Date(Date.UTC(y, m - 1, 1));
    const py = prev.getUTCFullYear();
    const pm = prev.getUTCMonth();

    rows.forEach((r) => {
      const dd = Number(r.label);
      // Use UTC to create the previous month date
      const prevKey = formatYMDLocal(new Date(Date.UTC(py, pm, dd)));
      r.previous = invoiceMap[prevKey] || 0;
    });
  }

  return rows;
}




// CustomTooltip will be defined inside the component to access currencySymbol



export function RevenueChart() {
  const [dateFilter, setDateFilter] = useState("this_quarter");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);
  const { tenant } = useAuth();

  const { data: invoices = [], isLoading: invoicesLoading } = useInvoicesForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );
  const isLoading = invoicesLoading;

  // Fetch invoice settings to get currency
  const { data: invoiceSettings } = useQuery({
    queryKey: ["/api/invoice-settings", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(
        `/api/invoice-settings/${tenant.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) return { data: { defaultCurrency: "USD" } };
      return await response.json();
    },
    enabled: !!tenant?.id,
  });

  const invoiceSettingsData = invoiceSettings?.data || invoiceSettings;
  const currentCurrency = invoiceSettingsData?.defaultCurrency || "USD";
  const currencySymbol = getCurrencySymbol(currentCurrency);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const row = payload[0].payload;
    const value = Number(payload[0].value ?? 0);

    // Parse the date string to avoid timezone conversion issues
    let formattedDate = "";
    if (row.fullDate && row.fullDate.includes("-")) {
      // If it's a month string (YYYY-MM), format it directly
      if (row.fullDate.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = row.fullDate.split("-").map(Number);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        formattedDate = `${monthNames[month - 1]} ${year}`;
      } else {
        // For date strings, parse and format using UTC
        const dateParts = row.fullDate.split("-");
        if (dateParts.length === 3) {
          const [year, month, day] = dateParts.map(Number);
          const date = new Date(Date.UTC(year, month - 1, day));
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          formattedDate = `${dayNames[date.getUTCDay()]}, ${monthNames[month - 1]} ${day}, ${year}`;
        } else {
          formattedDate = row.fullDate;
        }
      }
    } else {
      formattedDate = row.fullDate || "";
    }

    return (
      <div
        style={{
          background: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <strong>{formattedDate}</strong>
        </div>
        <div>{currencySymbol} {value.toLocaleString()}</div>
        <div style={{ color: "#6B7280", fontSize: 12 }}>{formatShort(value)}</div>
      </div>
    );
  };

  const revenueMap = useMemo(() => groupInvoicesByDate(invoices), [invoices]);

  const chartData = useMemo(
    () =>
      buildChartDataFromInvoiceMap(
        revenueMap,
        dateFilter,
        customDateFrom,
        customDateTo
      ),
    [revenueMap, dateFilter, customDateFrom, customDateTo]
  );

  const totalCurrent = chartData.reduce(
    (s, x) => s + Number(x.current ?? x.value ?? 0),
    0
  );

  const totalPrevious =
    dateFilter === "this_month"
      ? chartData.reduce((s, x) => s + (x.previous || 0), 0)
      : 0;

  const growth =
    dateFilter === "this_month" && totalPrevious !== 0
      ? ((totalCurrent - totalPrevious) / totalPrevious) * 100
      : 0;

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const W = pdf.internal.pageSize.getWidth();
    const H = (canvas.height * W) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, W, H);
    pdf.save("revenue-report.pdf");
  };




const usingDummy = chartData.length === 0;

const dummyData = [
  { label: "Day 1", value: 40, fullDate: "0000-00-00" },
  { label: "Day 2", value: 55, fullDate: "0000-00-00" },
  { label: "Day 3", value: 30, fullDate: "0000-00-00" },
  { label: "Day 4", value: 70, fullDate: "0000-00-00" },
  { label: "Day 5", value: 45, fullDate: "0000-00-00" },
];

const displayData = usingDummy ? dummyData : chartData;

const barColor = usingDummy ? "#D1D5DB" : "#0A64A0"; 


  return (
    <Card className="lg:col-span-7 bg-white rounded-xl shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-black">
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

        <p className="text-2xl sm:text-3xl font-semibold mt-3 text-black">
          {currencySymbol} {formatShort(totalCurrent)}
        </p>

        {dateFilter === "this_month" && (
          <p
            className={`text-xs font-medium mt-1 ${
              growth >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {growth >= 0 ? "↑" : "↓"} {Math.abs(growth).toFixed(1)}% vs last
            month
          </p>
        )}

        <CardDescription className="mt-3 text-xs text-gray-500">
          {dateFilter === "today"
            ? "Today's Revenue"
            : dateFilter === "this_week"
            ? "This Week"
            : dateFilter === "this_month"
            ? "This Month vs Previous Month"
            : dateFilter === "this_year"
            ? "This Year (Monthly)"
            : dateFilter === "this_quarter"
            ? "This Quarter (Monthly)"
            : dateFilter === "custom"
            ? "Custom Period"
            : "Revenue"}
        </CardDescription>
      </CardHeader>

      <CardContent ref={pdfRef} className="p-4">
        <div className="mt-2 h-60">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Loading...
            </div>
          ) :  (
            <ResponsiveContainer width="100%" height="100%">
  <BarChart data={displayData}>
    <XAxis
      dataKey="label"
      tick={{ fontSize: 10, fill: "#9CA3AF" }}
      axisLine={false}
      tickLine={false}
    />

    <YAxis hide />
    <Tooltip content={<CustomTooltip />} />

    <Legend
      align="center"
      verticalAlign="bottom"
      formatter={(value) => {
        if (usingDummy) return "Sample";
        if (value === "current") return "Current";
        if (value === "previous") return "Previous";
        if (value === "value") return "Revenue";
        return value;
      }}
    />

    
    {displayData[0]?.value !== undefined ? (
      <Bar
        dataKey="value"
        fill={barColor}
        barSize={7}
        isAnimationActive={true}
        animationDuration={1100}
        animationEasing="ease-out"
      />
    ) : (
      <>
        <Bar
          dataKey="current"
          fill={barColor}
          barSize={7}
          isAnimationActive={true}
          animationDuration={1100}
          animationEasing="ease-out"
        />
        {!usingDummy && dateFilter === "this_month" && (
          <Bar
            dataKey="previous"
            fill="#7695C5"
            barSize={7}
            isAnimationActive={true}
            animationDuration={1100}
            animationEasing="ease-out"
          />
        )}
      </>
    )}
  </BarChart>
</ResponsiveContainer>

          )}
        </div>
      </CardContent>
    </Card>
  );
}

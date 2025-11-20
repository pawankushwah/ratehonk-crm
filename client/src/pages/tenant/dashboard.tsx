import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardCustomizationDialog } from "@/components/dashboard-customization-dialog";
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  BookOpen,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  CalendarIcon,
  Filter,
  FileText,
  Receipt,
  Send,
  BarChart3,
  CalendarDays,
  Download,
  Settings,
  HelpCircle,
  Bell,
  ChevronRight,
  X,
} from "lucide-react";
import { Calendar } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import type { DashboardData } from "@/lib/types";
import type { Estimate, Expense, EmailCampaign } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ZAxis,
  ScatterChart,
  Scatter,
} from "recharts";
import { DateFilter } from "@/components/ui/date-filter";
import { buildDateFilters } from "@/lib/date-filter-helpers";

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  previousMonth,
  currentMonth,
  isPositive,
  link,
  bgColor,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend: string;
  previousMonth: number;
  currentMonth: number;
  isPositive: boolean;
  link?: string;
  bgColor?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const cardStyle = {
    backgroundColor: bgColor || "#FFFFFF",
  };

  const content = (
    <Card
      className="relative w-[210px] h-[112px] rounded-2xl  p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={cardStyle}
    >
      <CardContent className="p-0 relative z-10">
        <div>
          <p className="text-md font-medium text-[#000000]">{title}</p>

          <div className="flex items-center justify-between gap-2 mt-2">
            <p className="text-4xl font-bold text-gray-900">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <div
              className={`flex items-center text-sm font-semibold ${
                isPositive ? "text-[#000000]" : "text-[#000000"
              }`}
            >
              <span className="mr-1">
                {isPositive ? `+${trend}%` : `${trend}%`}
              </span>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
            </div>
          </div>
        </div>

        {isHovered && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-lg p-3 z-20 mt-2">
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  Previous Month:
                </span>
                <span className="font-bold text-gray-900">
                  {previousMonth.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  Current Month:
                </span>
                <span className="font-bold text-gray-900">
                  {currentMonth.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                <span className="text-gray-600 font-medium">Change:</span>
                <span
                  className={`font-bold text-sm ${
                    currentMonth >= previousMonth
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {currentMonth >= previousMonth ? "+" : ""}
                  {(
                    ((currentMonth - previousMonth) / (previousMonth || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return content;
}

const COLORS = [
  "#a0bcea", // Light blue
  "#68e7d4", // Turquoise
  "#000000",
  "#7bbcfd",
  "#b999ec",
  "#70dc8d",
];

const EXPENSE_CATEGORIES = [
  { value: "travel", label: "Travel & Transportation" },
  { value: "office", label: "Office Supplies" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "software", label: "Software & Tools" },
  { value: "meals", label: "Meals & Entertainment" },
  { value: "utilities", label: "Utilities" },
  { value: "other", label: "Other" },
];

const chartGradients = {
  primary: "url(#primaryGradient)",
  secondary: "url(#secondaryGradient)",
  accent: "url(#accentGradient)",
};

export default function Tenantdashboard() {
  const [profitPage, setProfitPage] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ref.current &&
        event.target &&
        ref.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const outerData = [
    { name: "Sales", value: 40, color: "#3E85C5" },
    { name: "Marketing", value: 32, color: "#FE4502" },
    { name: "Advertising", value: 28, color: "#FCAE75" },
  ];

  const middleData = [
    { name: "Sales", value: 40, color: "#3E85C5" },
    { name: "Marketing", value: 32, color: "#FE4502" },
    { name: "Advertising", value: 28, color: "#FCAE75" },
  ];

  const innerData = [
    { name: "Sales", value: 40, color: "#3E85C5" },
    { name: "Marketing", value: 32, color: "#FE4502" },
    { name: "Advertising", value: 28, color: "#FCAE75" },
  ];

  const bookingData = [
    { service: "Flight", value: 20, x: 50, y: 60, color: "#0A64A0" },
    { service: "Hotel", value: 25, x: 20, y: 80, color: "#6DA9DB" },
    { service: "Car", value: 15, x: 80, y: 80, color: "#3E85C5" },
    { service: "Event", value: 15, x: 80, y: 40, color: "#5487B6" },
    { service: "Package", value: 25, x: 20, y: 40, color: "#6DA9DB" },
  ];

  const CustomBubble = (props: any) => {
    const { cx, cy, payload } = props;

    const radius =
      payload.service === "Flight"
        ? 65
        : payload.service === "Hotel"
          ? 55
          : payload.service === "Car"
            ? 45
            : payload.service === "Event"
              ? 45
              : 50; // Package

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={payload.color}
          stroke="#CFE4FB"
          strokeWidth={6}
        />

        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          fill="#ffffff"
          style={{ fontSize: 18, fontWeight: "bold" }}
        >
          {payload.value}%
        </text>

        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fill="#ffffff"
          style={{ fontSize: 14 }}
        >
          {payload.service}
        </text>
      </g>
    );
  };

  const { user, tenant } = useAuth();

  const [dateFilter, setDateFilter] = useState<{
    period: string;
    startDate?: Date;
    endDate?: Date;
  }>({
    period: "month",
  });

  const [graphFilter, setGraphFilter] = useState<{
    period: string;
    startDate?: Date;
    endDate?: Date;
  }>({
    period: "month",
  });

  const [businessMetricsDateFilter, setBusinessMetricsDateFilter] =
    useState("this_month");
  const [businessMetricsCustomFrom, setBusinessMetricsCustomFrom] =
    useState<Date | null>(null);
  const [businessMetricsCustomTo, setBusinessMetricsCustomTo] =
    useState<Date | null>(null);

  const [leadTypesDateFilter, setLeadTypesDateFilter] = useState("this_month");
  const [leadTypesCustomFrom, setLeadTypesCustomFrom] = useState<Date | null>(
    null
  );
  const [leadTypesCustomTo, setLeadTypesCustomTo] = useState<Date | null>(null);

  const [revenueLeadTypeDateFilter, setRevenueLeadTypeDateFilter] =
    useState("this_month");
  const [revenueLeadTypeCustomFrom, setRevenueLeadTypeCustomFrom] =
    useState<Date | null>(null);
  const [revenueLeadTypeCustomTo, setRevenueLeadTypeCustomTo] =
    useState<Date | null>(null);

  const [bookingsVendorDateFilter, setBookingsVendorDateFilter] =
    useState("this_month");
  const [bookingsVendorCustomFrom, setBookingsVendorCustomFrom] =
    useState<Date | null>(null);
  const [bookingsVendorCustomTo, setBookingsVendorCustomTo] =
    useState<Date | null>(null);

  const [estimatesDateFilter, setEstimatesDateFilter] = useState("this_month");
  const [estimatesCustomFrom, setEstimatesCustomFrom] = useState<Date | null>(
    null
  );
  const [estimatesCustomTo, setEstimatesCustomTo] = useState<Date | null>(null);

  const [expensesDateFilter, setExpensesDateFilter] = useState("this_month");
  const [expensesCustomFrom, setExpensesCustomFrom] = useState<Date | null>(
    null
  );
  const [expensesCustomTo, setExpensesCustomTo] = useState<Date | null>(null);

  const [emailCampaignsDateFilter, setEmailCampaignsDateFilter] =
    useState("this_month");
  const [emailCampaignsCustomFrom, setEmailCampaignsCustomFrom] =
    useState<Date | null>(null);
  const [emailCampaignsCustomTo, setEmailCampaignsCustomTo] =
    useState<Date | null>(null);

  const [profitLossDateFilter, setProfitLossDateFilter] = useState("this_year");
  const [profitLossCustomFrom, setProfitLossCustomFrom] = useState<Date | null>(
    null
  );
  const [profitLossCustomTo, setProfitLossCustomTo] = useState<Date | null>(
    null
  );

  const [invoiceDateFilter, setInvoiceDateFilter] = useState("this_year");
  const [invoiceCustomFrom, setInvoiceCustomFrom] = useState<Date | null>(null);
  const [invoiceCustomTo, setInvoiceCustomTo] = useState<Date | null>(null);

  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  const getQueryParams = () => {
    const params: any = {};

    if (dateFilter.period && dateFilter.period !== "custom") {
      params.period = dateFilter.period;
    } else if (dateFilter.startDate && dateFilter.endDate) {
      params.startDate = format(dateFilter.startDate, "yyyy-MM-dd");
      params.endDate = format(dateFilter.endDate, "yyyy-MM-dd");
    }

    return params;
  };

  const queryParams = getQueryParams();

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: [`/api/reports/dashboard`, queryParams],
    enabled: !!tenant?.id,
    refetchInterval: 30000,
  });

  const getGraphQueryParams = () => {
    const params: any = {};

    if (graphFilter.period && graphFilter.period !== "custom") {
      params.period = graphFilter.period;
    } else if (graphFilter.startDate && graphFilter.endDate) {
      params.startDate = format(graphFilter.startDate, "yyyy-MM-dd");
      params.endDate = format(graphFilter.endDate, "yyyy-MM-dd");
    }

    return params;
  };

  const graphQueryParams = getGraphQueryParams();

  const buildFilterParamsFromDateFilter = (
    dateFilter: string,
    customFrom: Date | null,
    customTo: Date | null
  ) => {
    const dateFilters = buildDateFilters(dateFilter, customFrom, customTo);

    if (dateFilters) {
      return {
        startDate: dateFilters.startDate,
        endDate: dateFilters.endDate,
        period: dateFilters.filterType,
      };
    }

    return {};
  };

  const businessMetricsQueryParams = buildFilterParamsFromDateFilter(
    businessMetricsDateFilter,
    businessMetricsCustomFrom,
    businessMetricsCustomTo
  );
  const leadTypesQueryParams = buildFilterParamsFromDateFilter(
    leadTypesDateFilter,
    leadTypesCustomFrom,
    leadTypesCustomTo
  );
  const revenueByLeadTypeQueryParams = buildFilterParamsFromDateFilter(
    revenueLeadTypeDateFilter,
    revenueLeadTypeCustomFrom,
    revenueLeadTypeCustomTo
  );
  const bookingsByVendorQueryParams = buildFilterParamsFromDateFilter(
    bookingsVendorDateFilter,
    bookingsVendorCustomFrom,
    bookingsVendorCustomTo
  );
  const estimatesQueryParams = buildFilterParamsFromDateFilter(
    estimatesDateFilter,
    estimatesCustomFrom,
    estimatesCustomTo
  );
  const expensesQueryParams = buildFilterParamsFromDateFilter(
    expensesDateFilter,
    expensesCustomFrom,
    expensesCustomTo
  );
  const emailCampaignsQueryParams = buildFilterParamsFromDateFilter(
    emailCampaignsDateFilter,
    emailCampaignsCustomFrom,
    emailCampaignsCustomTo
  );
  const profitLossQueryParams = buildFilterParamsFromDateFilter(
    profitLossDateFilter,
    profitLossCustomFrom,
    profitLossCustomTo
  );

  const invoiceQueryParams = buildFilterParamsFromDateFilter(
    invoiceDateFilter,
    invoiceCustomFrom,
    invoiceCustomTo
  );

  const { data: topLeads } = useQuery({
    queryKey: [`/api/leads`, { limit: 10, sort: "score", ...queryParams }],
    enabled: !!tenant?.id,
  });

  const { data: topBookings } = useQuery({
    queryKey: [
      `/api/bookings`,
      { limit: 10, sort: "totalAmount", ...queryParams },
    ],
    enabled: !!tenant?.id,
  });

  const { data: topCustomers } = useQuery({
    queryKey: [
      `/api/customers`,
      { limit: 10, sort: "totalSpent", ...queryParams },
    ],
    enabled: !!tenant?.id,
  });

  const { data: leadTypesData } = useQuery({
    queryKey: [`/api/reports/lead-types`, leadTypesQueryParams],
    queryFn: async () => {
      const params = new URLSearchParams(
        leadTypesQueryParams as any
      ).toString();
      const url = `/api/reports/lead-types${params ? `?${params}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch lead types data");
      return res.json();
    },
    enabled: !!tenant?.id,
  });

  const { data: revenueByLeadTypeData } = useQuery({
    queryKey: [
      `/api/reports/revenue-by-lead-type`,
      revenueByLeadTypeQueryParams,
    ],
    queryFn: async () => {
      const params = new URLSearchParams(
        revenueByLeadTypeQueryParams as any
      ).toString();
      const url = `/api/reports/revenue-by-lead-type${params ? `?${params}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch revenue by lead type data");
      return res.json();
    },
    enabled: !!tenant?.id,
  });

  const { data: bookingsByVendorData } = useQuery({
    queryKey: [`/api/reports/bookings-by-vendor`, bookingsByVendorQueryParams],
    queryFn: async () => {
      const params = new URLSearchParams(
        bookingsByVendorQueryParams as any
      ).toString();
      const url = `/api/reports/bookings-by-vendor${params ? `?${params}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch bookings by vendor data");
      return res.json();
    },
    enabled: !!tenant?.id,
  });

  const { data: estimatesData, isLoading: estimatesLoading } = useQuery<
    Estimate[]
  >({
    queryKey: [`/api/estimates`, estimatesQueryParams],
    queryFn: async () => {
      const params = new URLSearchParams(
        estimatesQueryParams as any
      ).toString();
      const url = `/api/estimates${params ? `?${params}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch estimates data");
      return res.json();
    },
    enabled: !!tenant?.id,
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery<
    Expense[]
  >({
    queryKey: [`/api/expenses`, expensesQueryParams],
    queryFn: async () => {
      const params = new URLSearchParams(expensesQueryParams as any).toString();
      const url = `/api/expenses${params ? `?${params}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch expenses data");
      return res.json();
    },
    enabled: !!tenant?.id,
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const { data: emailCampaignsData, isLoading: emailCampaignsLoading } =
    useQuery<EmailCampaign[]>({
      queryKey: [`/api/email-campaigns`, emailCampaignsQueryParams],
      queryFn: async () => {
        const params = new URLSearchParams(
          emailCampaignsQueryParams as any
        ).toString();
        const url = `/api/email-campaigns${params ? `?${params}` : ""}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch email campaigns");
        return res.json();
      },
      enabled: !!tenant?.id,
      refetchInterval: 30000,
      staleTime: 25000,
    });

  const { data: profitLossData, isLoading: profitLossLoading } = useQuery<
    Array<{ month: string; expenses: number; revenue: number; profit: number }>
  >({
    queryKey: [`/api/dashboard/profit-loss`, profitLossQueryParams],
    queryFn: async () => {
      const params = new URLSearchParams(
        profitLossQueryParams as any
      ).toString();
      const url = `/api/dashboard/profit-loss${params ? `?${params}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch profit/loss data");
      return res.json();
    },
    enabled: !!tenant?.id,
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const { data: invoicesForGraph, isLoading: invoicesGraphLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/invoices`, invoiceQueryParams],
    queryFn: async () => {
      const params = new URLSearchParams(invoiceQueryParams as any).toString();
      const url = `/api/tenants/${tenant?.id}/invoices${params ? `?${params}` : ""}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });

      if (!res.ok) return [];

      const result = await res.json();
      return Array.isArray(result) ? result : result.invoices || [];
    },
    enabled: !!tenant?.id,
    refetchInterval: 30000,
  });

  const metrics = dashboardData?.metrics || {
    revenue: 0,
    activeBookings: 0,
    customers: 0,
    leads: 0,
  };

  const { data: chartDataResponse, isLoading: chartLoading } = useQuery({
    queryKey: [`/api/dashboard/chart-data`, businessMetricsQueryParams],
    queryFn: async () => {
      const params = new URLSearchParams(
        businessMetricsQueryParams as any
      ).toString();
      const url = `/api/dashboard/chart-data${params ? `?${params}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch chart data");
      return res.json();
    },
    enabled: !!tenant?.id,
  });

  const chartData = useMemo(() => {
    if (
      chartDataResponse &&
      Array.isArray(chartDataResponse) &&
      chartDataResponse.length > 0
    ) {
      return chartDataResponse;
    }

    const now = new Date();
    const period = businessMetricsDateFilter;
    let dataPoints: any[] = [];

    if (period === "this_week" || period === "week") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

        dataPoints.push({
          month: dayName,
          bookings: Math.floor(Math.random() * 5) + 2,
          leads: Math.floor(Math.random() * 10) + 8,
          revenue: Math.floor(Math.random() * 8000) + 3000,
          profit: Math.floor(Math.random() * 3000) + 1000,
          loss: Math.floor(Math.random() * 500),
          expense: Math.floor(Math.random() * 4000) + 2000,
        });
      }
    } else if (period === "this_year" || period === "year") {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString("en-US", { month: "short" });

        dataPoints.push({
          month: monthName,
          bookings: Math.floor(Math.random() * 25) + 15,
          leads: Math.floor(Math.random() * 50) + 30,
          revenue: Math.floor(Math.random() * 40000) + 25000,
          profit: Math.floor(Math.random() * 15000) + 8000,
          loss: Math.floor(Math.random() * 3000),
          expense: Math.floor(Math.random() * 25000) + 18000,
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString("en-US", { month: "short" });

        dataPoints.push({
          month: monthName,
          bookings: Math.floor(Math.random() * 20) + 10,
          leads: Math.floor(Math.random() * 40) + 25,
          revenue: Math.floor(Math.random() * 30000) + 20000,
          profit: Math.floor(Math.random() * 12000) + 6000,
          loss: Math.floor(Math.random() * 2000),
          expense: Math.floor(Math.random() * 20000) + 15000,
        });
      }
    }

    return dataPoints;
  }, [chartDataResponse, businessMetricsDateFilter]);

  const invoiceMetrics = useMemo(() => {
    if (!invoicesForGraph || invoicesForGraph.length === 0) {
      return {
        total: 0,
        paid: 0,
        partialPaid: 0,
        pending: 0,
        overdue: 0,
        paidPercentage: 0,
        partialPercentage: 0,
        pendingPercentage: 0,
        overduePercentage: 0,
      };
    }

    const total = invoicesForGraph.length;

    const paid = invoicesForGraph.filter(
      (inv: any) => inv.status === "paid"
    ).length;
    const partialPaid = invoicesForGraph.filter(
      (inv: any) => inv.status === "partial"
    ).length;
    const pending = invoicesForGraph.filter(
      (inv: any) => inv.status === "pending"
    ).length;
    const overdue = invoicesForGraph.filter(
      (inv: any) => inv.status === "overdue"
    ).length;

    return {
      total,
      paid,
      partialPaid,
      pending,
      overdue,
      paidPercentage: total > 0 ? (paid / total) * 100 : 0,
      partialPercentage: total > 0 ? (partialPaid / total) * 100 : 0,
      pendingPercentage: total > 0 ? (pending / total) * 100 : 0,
      overduePercentage: total > 0 ? (overdue / total) * 100 : 0,
    };
  }, [invoicesForGraph]);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 h-80 bg-gray-200 rounded"></div>
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const monthlyData = {
    revenue: {
      current: metrics.revenue || 0,
      previous: (metrics.revenue || 0) * 0.85,
    },
    bookings: {
      current: metrics.activeBookings || 0,
      previous: (metrics.activeBookings || 0) * 0.9,
    },
    customers: {
      current: metrics.customers || 0,
      previous: (metrics.customers || 0) * 0.95,
    },
    leads: {
      current: metrics.leads || 0,
      previous: (metrics.leads || 0) * 0.8,
    },
  };

  const leadTypesChart = Array.isArray(leadTypesData)
    ? leadTypesData
    : [
        { name: "Corporate Travel", value: 30, bookings: 15 },
        { name: "Leisure Travel", value: 25, bookings: 20 },
        { name: "Group Tours", value: 20, bookings: 8 },
        { name: "Adventure", value: 15, bookings: 12 },
        { name: "Honeymoon", value: 10, bookings: 18 },
      ];

  const topLeadsArray = Array.isArray(topLeads) ? topLeads : [];
  const topBookingsArray = Array.isArray(topBookings) ? topBookings : [];
  const topCustomersArray = Array.isArray(topCustomers) ? topCustomers : [];

  const revenueByLeadTypeArray = Array.isArray(revenueByLeadTypeData)
    ? revenueByLeadTypeData
    : [];
  const bookingsByVendorArray = Array.isArray(bookingsByVendorData)
    ? bookingsByVendorData
    : [];

  const safeParseNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return isNaN(value) ? 0 : value;
    if (typeof value === "string") {
      const cleanValue = value.replace("%", "");
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const estimatesArray = Array.isArray(estimatesData) ? estimatesData : [];
  const expensesArray = Array.isArray(expensesData) ? expensesData : [];
  const emailCampaignsArray = Array.isArray(emailCampaignsData)
    ? emailCampaignsData
    : [];

  const estimatesMetrics = {
    total: estimatesArray.length,
    totalRevenue: estimatesArray.reduce(
      (sum, est) => sum + safeParseNumber(est?.totalAmount),
      0
    ),
    pending: estimatesArray.filter(
      (est) => est?.status === "draft" || est?.status === "sent"
    ).length,
    accepted: estimatesArray.filter((est) => est?.status === "accepted").length,
    rejected: estimatesArray.filter((est) => est?.status === "rejected").length,
  };

  const estimatesStatusData = [
    { name: "Draft/Sent", value: estimatesMetrics.pending, fill: "#F59E0B" },
    { name: "Accepted", value: estimatesMetrics.accepted, fill: "#10B981" },
    { name: "Rejected", value: estimatesMetrics.rejected, fill: "#EF4444" },
  ].filter((item) => item.value > 0);

  // Expenses Analytics Processing with safe numeric handling
  const expensesMetrics = {
    total: expensesArray.length,
    totalAmount: expensesArray.reduce(
      (sum, exp) => sum + safeParseNumber(exp?.amount),
      0
    ),
    pending: expensesArray.filter((exp) => exp?.status === "pending").length,
    approved: expensesArray.filter((exp) => exp?.status === "approved").length,
    paid: expensesArray.filter((exp) => exp?.status === "paid").length,
  };

  const expensesByCategory = expensesArray.reduce(
    (acc, exp) => {
      const category = exp?.category || "other";
      if (!acc[category]) {
        acc[category] = { name: category, value: 0, count: 0 };
      }
      acc[category].value += safeParseNumber(exp?.amount);
      acc[category].count += 1;
      return acc;
    },
    {} as Record<string, { name: string; value: number; count: number }>
  );

  const expensesCategoryData = EXPENSE_CATEGORIES.map((category, index) => {
    const categoryData = expensesByCategory[category.value];
    return {
      name: category.label,
      value: categoryData?.value || 0,
      count: categoryData?.count || 0,
      fill: COLORS[index % COLORS.length],
    };
  });

  const emailMetrics = {
    total: emailCampaignsArray.length,
    sent: emailCampaignsArray.filter((camp) => camp?.status === "sent").length,
    scheduled: emailCampaignsArray.filter(
      (camp) => camp?.status === "scheduled"
    ).length,
    avgOpenRate:
      emailCampaignsArray.length > 0
        ? emailCampaignsArray.reduce(
            (sum, camp) => sum + safeParseNumber(camp?.openRate),
            0
          ) / emailCampaignsArray.length
        : 0,
    avgClickRate:
      emailCampaignsArray.length > 0
        ? emailCampaignsArray.reduce(
            (sum, camp) => sum + safeParseNumber(camp?.clickRate),
            0
          ) / emailCampaignsArray.length
        : 0,
  };

  const expensePieData = [
    { name: "Paid", value: expensesMetrics.paid, fill: "#0A64A0" },
    { name: "Approved", value: expensesMetrics.approved, fill: "#3E85C5" },
    { name: "Pending", value: expensesMetrics.pending, fill: "#6DA9DB" },
  ].filter((item) => item.value > 0);

  const invoiceBarData = [
    {
      name: "Invoices",
      Paid: invoiceMetrics.paid,
      Overdue: invoiceMetrics.overdue,
      Partial: invoiceMetrics.partialPaid,
      Pending: invoiceMetrics.pending,
    },
  ];

  const followUpsArray = topLeadsArray ?? [];
  const customersArray = topCustomersArray ?? [];
  const activitiesArray = topBookingsArray ?? [];
  const contactsArray = topCustomersArray ?? [];

  function ProfitLossList({ profitLossData, profitPage, setProfitPage }) {
    const monthOrder = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];

    const sortedProfitLossData = Array.isArray(profitLossData)
      ? [...profitLossData].sort((a, b) => {
          const monthA = monthOrder.indexOf(
            new Date(a.month)
              .toLocaleDateString("en-US", { month: "short" })
              .toLowerCase()
          );
          const monthB = monthOrder.indexOf(
            new Date(b.month)
              .toLocaleDateString("en-US", { month: "short" })
              .toLowerCase()
          );
          return monthA - monthB;
        })
      : [];

    const maxValue =
      sortedProfitLossData.length > 0
        ? Math.max(
            ...sortedProfitLossData.map((d) =>
              Math.abs((d.revenue ?? 0) - (d.expenses ?? 0))
            ),
            1
          )
        : 1;

    return (
      <div className="space-y-3 sm:space-y-4">
        {sortedProfitLossData
          .slice(profitPage * 6, profitPage * 6 + 6)
          .map((item, i) => {
            const revenue = item.revenue ?? 0;
            const expenses = item.expenses ?? 0;
            const profit = revenue - expenses;
            const isLoss = profit < 0;

            const displayValue =
              Math.abs(profit) >= 1000
                ? `${profit < 0 ? "-" : ""}$${Math.abs(profit / 1000)}k`
                : `$${profit}`;

            const widthPercentage = (Math.abs(profit) / maxValue) * 100;

            return (
              <div
                key={i}
                className="flex items-center justify-between text-xs sm:text-sm"
              >
                <span className="text-gray-500 w-6 sm:w-8">
                  {new Date(item.month).toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </span>

                <div className="flex-1 bg-gray-200 h-2.5 sm:h-3 rounded overflow-hidden mx-2">
                  <div
                    className={`${isLoss ? "bg-[#FE4F02]" : "bg-[#0A64A0]"} h-2.5 sm:h-3`}
                    style={{ width: `${widthPercentage}%` }}
                  />
                </div>

                <span className="text-[#202939] w-12 sm:w-14 text-right">
                  {displayValue}
                </span>
              </div>
            );
          })}

        <div className="flex justify-center pt-2 gap-4">
          {profitPage > 0 && (
            <button
              onClick={() => setProfitPage(0)}
              className="text-[#02101a] text-sm font-semibold hover:underline"
            >
              ← Prev
            </button>
          )}

          {sortedProfitLossData.length > 6 && profitPage === 0 && (
            <button
              onClick={() => setProfitPage(1)}
              className="text-[#02101a] text-sm font-semibold hover:underline"
            >
              Next →
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 pt-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#0A64A0]"></span> Profit
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#FE4F02]"></span> Loss
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#0BBCD6]/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>
        <div className="relative z-10 p-3 sm:p-5 w-full">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="w-full bg-white rounded-2xl shadow-sm relative z-10">
                <div className="w-full h-auto sm:h-[72px] flex flex-wrap sm:flex-nowrap items-center bg-white px-4 sm:px-[18px] py-4 rounded-t-xl border-b border-[#E3E8EF] shadow-[0px_1px_6px_0px_rgba(0,0,0,0.05)]">
                  <h1 className="font-inter font-medium text-lg sm:text-[20px] leading-[24px] text-black">
                    Dashboard
                  </h1>

                  <div className="flex gap-2 sm:gap-3 ml-auto mt-3 sm:mt-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                      <Link href="/dynamic-fields">
                        <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                      </Link>
                    </div>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                      <Link href="/support">
                        <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                      </Link>
                    </div>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6 mb-8">
            <div>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
                data-testid="metric-cards-container"
              >
                <div data-testid="metric-card-revenue">
                  <MetricCard
                    title="Total Revenue"
                    value={`$${metrics.revenue.toLocaleString()}`}
                    icon={DollarSign}
                    trend={`${(
                      ((monthlyData.revenue.current -
                        monthlyData.revenue.previous) /
                        (monthlyData.revenue.previous || 1)) *
                      100
                    ).toFixed(1)}%`}
                    previousMonth={monthlyData.revenue.previous}
                    currentMonth={monthlyData.revenue.current}
                    isPositive={
                      monthlyData.revenue.current >=
                      monthlyData.revenue.previous
                    }
                    bgColor="#E6F1FD"
                  />
                </div>

                <div data-testid="metric-card-bookings">
                  <Link href={`/bookings`}>
                    <MetricCard
                      title="Total Bookings"
                      value={metrics.activeBookings}
                      icon={BookOpen}
                      trend={`${(
                        ((monthlyData.bookings.current -
                          monthlyData.bookings.previous) /
                          (monthlyData.bookings.previous || 1)) *
                        100
                      ).toFixed(1)}%`}
                      previousMonth={monthlyData.bookings.previous}
                      currentMonth={monthlyData.bookings.current}
                      isPositive={
                        monthlyData.bookings.current >=
                        monthlyData.bookings.previous
                      }
                      bgColor="#EDEEFC"
                    />
                  </Link>
                </div>

                <div data-testid="metric-card-customers">
                  <Link href={`/customers`}>
                    <MetricCard
                      title="Total Customers"
                      value={metrics.customers}
                      icon={Users}
                      trend={`${(
                        ((monthlyData.customers.current -
                          monthlyData.customers.previous) /
                          (monthlyData.customers.previous || 1)) *
                        100
                      ).toFixed(1)}%`}
                      previousMonth={monthlyData.customers.previous}
                      currentMonth={monthlyData.customers.current}
                      isPositive={
                        monthlyData.customers.current >=
                        monthlyData.customers.previous
                      }
                      bgColor="#E6F1FD"
                    />
                  </Link>
                </div>

                <div data-testid="metric-card-leads">
                  <Link href={`/leads`}>
                    <MetricCard
                      title="Total Leads"
                      value={metrics.leads}
                      icon={UserCheck}
                      trend={`${(
                        ((monthlyData.leads.current -
                          monthlyData.leads.previous) /
                          (monthlyData.leads.previous || 1)) *
                        100
                      ).toFixed(1)}%`}
                      previousMonth={monthlyData.leads.previous}
                      currentMonth={monthlyData.leads.current}
                      isPositive={
                        monthlyData.leads.current >= monthlyData.leads.previous
                      }
                      bgColor="#EDEEFC"
                    />
                  </Link>
                </div>
              </div>

              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-fit mt-6 lg:mt-10"
                data-testid="dashboard-main-content"
              >
                <Card className="lg:col-span-7 h-fit">
                <CardHeader className="flex flex-col gap-2 mt-2">
  {/* Row 1 — Title + Date Filter */}
  <div className="flex items-center justify-between">
    <CardTitle className="text-[#000000] text-base sm:text-lg font-medium">
      Revenue
    </CardTitle>

    <DateFilter
      dateFilter={revenueLeadTypeDateFilter}
      setDateFilter={setRevenueLeadTypeDateFilter}
      customDateFrom={revenueLeadTypeCustomFrom}
      setCustomDateFrom={setRevenueLeadTypeCustomFrom}
      customDateTo={revenueLeadTypeCustomTo}
      setCustomDateTo={setRevenueLeadTypeCustomTo}
    />
  </div>

  {/* Row 2 — Revenue value + description */}
  <div>
    <p className="text-xl sm:text-2xl font-semibold text-[#000000]">
      USD 7.852.000
    </p>

    <CardDescription className="text-green-500 mt-1 text-xs sm:text-sm">
      ↑ 2.1% vs last week
    </CardDescription>
  </div>
</CardHeader>


                  <CardContent>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2">
                      Sales from 1–12 Dec, 2020
                    </p>

                    <div className="mt-4 h-32 sm:h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
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
                          ]}
                          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 10, fill: "#9CA3AF" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis hide />
                          <Tooltip contentStyle={{ display: "none" }} />
                          <Bar
                            dataKey="last6Days"
                            fill="#0A64A0"
                            radius={[0, 0, 0, 0]}
                            barSize={8}
                          />
                          <Bar
                            dataKey="lastWeek"
                            fill="#7695C5"
                            radius={[0, 0, 0, 0]}
                            barSize={8}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex flex-wrap justify-start gap-3 sm:gap-4 mt-6 text-xs sm:text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#0A64A0] rounded" />
                        <span className="text-[#121212]">Last 6 days</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#7695C5] rounded" />
                        <span className="text-[#121212]">Last Week</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-5 h-fit">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-[#000000] text-base sm:text-lg font-semibold">
                      Profit & Loss
                    </CardTitle>

                    <DateFilter
                      dateFilter={profitLossDateFilter}
                      setDateFilter={setProfitLossDateFilter}
                      customDateFrom={profitLossCustomFrom}
                      setCustomDateFrom={setProfitLossCustomFrom}
                      customDateTo={profitLossCustomTo}
                      setCustomDateTo={setProfitLossCustomTo}
                    />
                  </CardHeader>

                  <CardContent className="min-h-[320px]">
                    <ProfitLossList
                      profitLossData={profitLossData}
                      profitPage={profitPage}
                      setProfitPage={setProfitPage}
                    />
                  </CardContent>
                </Card>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 mt-6 sm:mt-10"
                data-testid="dashboard-main-content"
              >
                <Card
                  data-testid="chart-expenses-overview"
                  className="col-span-12 md:col-span-6 bg-white shadow-md rounded-xl  h-[450px] "
                >
                  <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 p-4">
                    <div>
                      <CardTitle className="text-[#000000] font-medium text-base sm:text-lg">
                        Expense
                      </CardTitle>

                      <p className="text-xl sm:text-2xl font-semibold text-[#000000] mt-1">
                        USD {(expensesMetrics.totalAmount / 1000).toFixed(1)}k
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <DateFilter
                        dateFilter={expensesDateFilter}
                        setDateFilter={setExpensesDateFilter}
                        customDateFrom={expensesCustomFrom}
                        setCustomDateFrom={setExpensesCustomFrom}
                        customDateTo={expensesCustomTo}
                        setCustomDateTo={setExpensesCustomTo}
                      />

                      <Button
                        variant="outline"
                        className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50"
                      >
                        <Download size={16} className="text-[#202939]" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    {expensesLoading ? (
                      <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center items-center">
                          <div className="relative w-36 h-36 sm:w-52 sm:h-52 mb-10">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={expensePieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius="60%"
                                  outerRadius="80%"
                                  startAngle={90}
                                  endAngle={-270}
                                  dataKey="value"
                                >
                                  {expensePieData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.fill}
                                    />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-around pt-6 text-xs sm:text-sm text-gray-600 gap-3 sm:gap-0 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <span className="w-2.5 h-2.5 bg-[#0A64A0] rounded-full"></span>
                            Paid {expensesMetrics.paid}
                          </div>

                          <div className="flex items-center gap-2 justify-center">
                            <span className="w-2.5 h-2.5 bg-[#3E85C5] rounded-full"></span>
                            Approved {expensesMetrics.approved}
                          </div>

                          <div className="flex items-center gap-2 justify-center">
                            <span className="w-2.5 h-2.5 bg-[#6DA9DB] rounded-full"></span>
                            Pending {expensesMetrics.pending}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="col-span-12 md:col-span-6 bg-white shadow-md rounded-xl h-[450px]">
                  <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 p-4">
                    <div>
                      <CardTitle className="text-[#000000] font-medium text-base sm:text-lg">
                        Service Booking
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-xs sm:text-sm">
                        Lorem ipsum dolor sit amet, consectetur
                      </CardDescription>
                    </div>

                    <DateFilter
                      dateFilter={leadTypesDateFilter}
                      setDateFilter={setLeadTypesDateFilter}
                      customDateFrom={leadTypesCustomFrom}
                      setCustomDateFrom={setLeadTypesCustomFrom}
                      customDateTo={leadTypesCustomTo}
                      setCustomDateTo={setLeadTypesCustomTo}
                    />
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="relative flex justify-center items-center h-[350px] sm:h-[380px] w-full max-w-[500px] mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <XAxis
                            type="number"
                            dataKey="x"
                            domain={[0, 100]}
                            hide
                          />
                          <YAxis
                            type="number"
                            dataKey="y"
                            domain={[0, 100]}
                            hide
                          />

                          <Scatter
                            data={bookingData}
                            shape={<CustomBubble />}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mt-6 sm:mt-10"
                data-testid="dashboard-main-content"
              >
                <Card className="col-span-12 lg:col-span-6 shadow-md rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0">
                      <CardTitle className="text-[#000000] font-medium text-base sm:text-lg">
                        Service Provider
                      </CardTitle>

                      <DateFilter
                        dateFilter={profitLossDateFilter}
                        setDateFilter={setProfitLossDateFilter}
                        customDateFrom={profitLossCustomFrom}
                        setCustomDateFrom={setProfitLossCustomFrom}
                        customDateTo={profitLossCustomTo}
                        setCustomDateTo={setProfitLossCustomTo}
                      />
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6 sm:gap-4">
                      <div className="relative w-36 h-36 sm:w-52 sm:h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Sales", value: 40, fill: "#787EDA" },
                                {
                                  name: "Marketing",
                                  value: 32,
                                  fill: "#C1C5FF",
                                },
                                {
                                  name: "Advertising",
                                  value: 28,
                                  fill: "#E2E4FF",
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius="60%"
                              outerRadius="80%"
                              startAngle={90}
                              endAngle={-270}
                              dataKey="value"
                            >
                              {[
                                { fill: "#787EDA" },
                                { fill: "#C1C5FF" },
                                { fill: "#E2E4FF" },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#787EDA]" />
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Sales
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-gray-900">
                              40%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#C1C5FF]" />
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Marketing
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-gray-900">
                              32%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#E2E4FF]" />
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Advertising
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-gray-900">
                              28%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-12 lg:col-span-6 shadow-md rounded-xl p-4">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0">
                      <CardTitle className="text-[#000000] font-medium text-base sm:text-lg">
                        Consolidated Booking
                      </CardTitle>

                      <DateFilter
                        dateFilter={profitLossDateFilter}
                        setDateFilter={setProfitLossDateFilter}
                        customDateFrom={profitLossCustomFrom}
                        setCustomDateFrom={setProfitLossCustomFrom}
                        customDateTo={profitLossCustomTo}
                        setCustomDateTo={setProfitLossCustomTo}
                      />
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6">
                      <div className="relative w-[130px] h-[130px] sm:w-[180px] sm:h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={outerData}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={60}
                              startAngle={90}
                              endAngle={450}
                              paddingAngle={3}
                              cornerRadius={50}
                              stroke="none"
                            >
                              {outerData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>

                        <div className="absolute inset-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={innerData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                outerRadius={40}
                                startAngle={90}
                                endAngle={450}
                                paddingAngle={3}
                                stroke="none"
                              >
                                {innerData.map((entry, idx) => (
                                  <Cell key={idx} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#1E63EE]" />
                          <div className="text-xs">
                            <p className="font-medium text-gray-900 mb-0.5">
                              Sales
                            </p>
                            <p className="text-gray-500 text-[10px] sm:text-[11px]">
                              40%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FF7A00]" />
                          <div className="text-xs">
                            <p className="font-medium text-gray-900 mb-0.5">
                              Marketing
                            </p>
                            <p className="text-gray-500 text-[10px] sm:text-[11px]">
                              32%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FFD0A6]" />
                          <div className="text-xs">
                            <p className="font-medium text-gray-900 mb-0.5">
                              Advertising
                            </p>
                            <p className="text-gray-500 text-[10px] sm:text-[11px]">
                              28%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="relative">
              {!isOpen && (
                <button
                  onClick={() => setIsOpen(true)}
                  className="lg:hidden fixed top-0 right-0 z-50 text-black py-5 px-1"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <div
                className={`fixed top-0 right-0 z-40 w-64 bg-white border-l border-gray-200 p-4 space-y-6 h-screen overflow-y-auto transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:block ${
                  isOpen ? "translate-x-0" : "translate-x-full"
                }`}
              >
                <button
                  onClick={() => setIsOpen(false)}
                  className="lg:hidden absolute top-4 left-4 text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mt-10 lg:mt-0">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Follow Ups
                  </h3>

                  <div className="space-y-2">
                    {followUpsArray.length > 0 ? (
                      followUpsArray.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {item.firstName
                              ? item.firstName.charAt(0).toUpperCase()
                              : item.name?.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              {item.firstName
                                ? `${item.firstName} ${item.lastName}`
                                : item.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {item.email}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No Leads</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Customers
                  </h3>

                  <div className="space-y-2">
                    {customersArray.length > 0 ? (
                      customersArray.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {item.firstName
                              ? item.firstName.charAt(0).toUpperCase()
                              : item.name?.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              {item.firstName
                                ? `${item.firstName} ${item.lastName}`
                                : item.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {item.email}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No customers</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Bookings
                  </h3>

                  <div className="space-y-2">
                    {activitiesArray.length > 0 ? (
                      activitiesArray.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {item.customerName
                              ? item.customerName.charAt(0).toUpperCase()
                              : "U"}
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              {item.customerName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              ₹{item.totalAmount?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No activities</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Contacts
                  </h3>

                  <div className="space-y-2">
                    {contactsArray.length > 0 ? (
                      contactsArray.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {item.firstName
                              ? item.firstName.charAt(0).toUpperCase()
                              : item.name?.charAt(0).toUpperCase()}
                          </div>

                          <p className="text-xs font-medium text-gray-700">
                            {item.firstName
                              ? `${item.firstName} ${item.lastName}`
                              : item.name}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No contacts</p>
                    )}
                  </div>
                </div>
              </div>

              {isOpen && (
                <div
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm lg:hidden z-30"
                  onClick={() => setIsOpen(false)}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6 mb-8">
            <div>
              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-fit mt-6 lg:mt-10"
                data-testid="dashboard-main-content"
              >
                <Card className="lg:col-span-6 bg-white shadow-md rounded-xl">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <CardTitle className="text-[#000000] text-base sm:text-lg">
                        Invoice
                      </CardTitle>

                      <DateFilter
                        dateFilter={invoiceDateFilter}
                        setDateFilter={setInvoiceDateFilter}
                        customDateFrom={invoiceCustomFrom}
                        setCustomDateFrom={setInvoiceCustomFrom}
                        customDateTo={invoiceCustomTo}
                        setCustomDateTo={setInvoiceCustomTo}
                      />
                    </div>

                    <CardDescription className="text-lg sm:text-2xl font-semibold text-[#000000] mt-4">
                      {invoicesGraphLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        `${invoiceMetrics.total} Total Invoices`
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {/* Bar Chart */}
                    {invoicesGraphLoading ? (
                      <div className="flex h-8 sm:h-12 overflow-hidden bg-gray-200 animate-pulse mt-12 rounded"></div>
                    ) : invoiceMetrics.total === 0 ? (
                      <div className="flex h-8 sm:h-12 overflow-hidden bg-gray-100 mt-12 rounded items-center justify-center">
                        <span className="text-sm text-gray-500">
                          No invoices found
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-8 sm:h-12 overflow-hidden text-white text-sm sm:text-base font-medium mt-12 rounded">
                        {invoiceMetrics.paid > 0 && (
                          <div
                            className="bg-[#2374A9] flex items-center justify-center text-[#FFFFFF]"
                            style={{
                              width: `${invoiceMetrics.paidPercentage}%`,
                            }}
                          >
                            {invoiceMetrics.paid}
                          </div>
                        )}

                        {invoiceMetrics.overdue > 0 && (
                          <div
                            className="bg-[#fe1f02] flex items-center justify-center text-[#FFFFFF]"
                            style={{
                              width: `${invoiceMetrics.overduePercentage}%`,
                            }}
                          >
                            {invoiceMetrics.overdue}
                          </div>
                        )}

                        {invoiceMetrics.partialPaid > 0 && (
                          <div
                            className="bg-[#787EDA] flex items-center justify-center text-[#FFFFFF]"
                            style={{
                              width: `${invoiceMetrics.partialPercentage}%`,
                            }}
                          >
                            {invoiceMetrics.partialPaid}
                          </div>
                        )}

                        {invoiceMetrics.pending > 0 && (
                          <div
                            className="bg-[#FE4F02] flex items-center justify-center text-[#FFFFFF]"
                            style={{
                              width: `${invoiceMetrics.pendingPercentage}%`,
                            }}
                          >
                            {invoiceMetrics.pending}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6 text-xs sm:text-sm mt-20 ">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#2374A9]"></div>
                        <span className="text-gray-600">
                          Paid {invoiceMetrics.paid}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#787EDA]"></div>
                        <span className="text-gray-600">
                          Partial Paid {invoiceMetrics.partialPaid}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#FE4F02]"></div>
                        <span className="text-gray-600">
                          Pending {invoiceMetrics.pending}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#fe1f02]"></div>
                        <span className="text-gray-600">
                          Overdue {invoiceMetrics.overdue}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-6 bg-white shadow-md rounded-xl">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <CardTitle className="text-[#000000] text-base sm:text-lg">
                        Consolidated Booking
                      </CardTitle>

                      <DateFilter
                        dateFilter={profitLossDateFilter}
                        setDateFilter={setProfitLossDateFilter}
                        customDateFrom={profitLossCustomFrom}
                        setCustomDateFrom={setProfitLossCustomFrom}
                        customDateTo={profitLossCustomTo}
                        setCustomDateTo={setProfitLossCustomTo}
                      />
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6">
                      <div className="relative w-full h-64">
                        <div className="absolute inset-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={outerData}
                                dataKey="value"
                                cx="50%"
                                cy="60%"
                                innerRadius={60}
                                outerRadius={80}
                                startAngle={200}
                                endAngle={-20}
                                stroke="none"
                              >
                                {outerData.map((entry, index) => (
                                  <Cell key={index} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="absolute inset-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={middleData}
                                dataKey="value"
                                cx="50%"
                                cy="60%"
                                innerRadius={40}
                                outerRadius={55}
                                startAngle={200}
                                endAngle={-20}
                                stroke="none"
                              >
                                {middleData.map((entry, index) => (
                                  <Cell key={index} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="absolute inset-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={innerData}
                                dataKey="value"
                                cx="50%"
                                cy="60%"
                                innerRadius={20}
                                outerRadius={35}
                                startAngle={200}
                                endAngle={-20}
                                stroke="none"
                              >
                                {innerData.map((entry, index) => (
                                  <Cell key={index} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs text-center sm:text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#2F80ED]"></div>
                          <div>
                            <p className="font-medium text-gray-900">Sales</p>
                            <p className="text-gray-500 text-[11px]">40%</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#F2994A]"></div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Marketing
                            </p>
                            <p className="text-gray-500 text-[11px]">32%</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]"></div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Advertising
                            </p>
                            <p className="text-gray-500 text-[11px]">28%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6 mb-8">
            <div>
              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-fit mt-6 lg:mt-10"
                data-testid="dashboard-main-content"
              >
                <Card className="lg:col-span-12 bg-white shadow-md rounded-xl">
                  <CardContent className="p-4 sm:p-6">
                    <h2 className="text-[#000000] font-medium mb-3 text-base sm:text-lg md:text-xl">
                      Marketing & SEO
                    </h2>

                    <div className="relative h-40 sm:h-48 md:h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { month: "Jan", value: 80 },
                            { month: "Feb", value: 120 },
                            { month: "Mar", value: 95 },
                            { month: "Apr", value: 125 },
                            { month: "May", value: 60 },
                            { month: "Jun", value: 110 },
                            { month: "Jul", value: 85 },
                            { month: "Aug", value: 120 },
                            { month: "Sep", value: 100 },
                            { month: "Oct", value: 130 },
                            { month: "Nov", value: 60 },
                            { month: "Dec", value: 105 },
                          ]}
                          margin={{ top: 0, right: 0, left: 0, bottom: 20 }}
                        >
                          <YAxis
                            domain={[0, "dataMax + 20"]}
                            tickFormatter={(t) => `${t}K`}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6B7280", fontSize: 10 }}
                          />

                          <Tooltip cursor={{ fill: "transparent" }} />

                          <Bar
                            dataKey="value"
                            radius={[6, 6, 0, 0]}
                            barSize={28}
                            fill="#008080"
                            className="transition-all hover:fill-[#007070]"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DashboardCustomizationDialog
        open={isCustomizationOpen}
        onOpenChange={setIsCustomizationOpen}
      />
    </Layout>
  );
}
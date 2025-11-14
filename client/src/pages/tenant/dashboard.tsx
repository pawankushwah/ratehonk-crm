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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardCustomizationDialog } from "@/components/dashboard-customization-dialog";
import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
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
} from "recharts";
import { DateFilter } from "@/components/ui/date-filter";
import { buildDateFilters } from "@/lib/date-filter-helpers";

// Enhanced Metric Card Component with Hover Details
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  previousMonth,
  currentMonth,
  isPositive,
  link,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend: string;
  previousMonth: number;
  currentMonth: number;
  isPositive: boolean;
  link?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const content = (
    <Card
      className="relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-l-4 border-l-[#0BBCD6] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative background pattern */}
      {/*from-[#0BBCD6]/10  */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br to-transparent rounded-full transform translate-x-16 -translate-y-16" />
      <CardContent className="p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <div
              className={`flex items-center text-xs mt-1 font-medium ${
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {trend}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-[#0BBCD6]/20 rounded-full blur-xl" />
            <Icon className="h-8 w-8 text-[#0BBCD6] relative z-10" />
          </div>
        </div>

        {/* Enhanced Hover Details */}
        {isHovered && (
          <div className="absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-2xl p-3 z-20 mt-2">
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Previous Month:
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {previousMonth.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Current Month:
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {currentMonth.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Change:
                </span>
                <span
                  className={`font-bold text-sm ${
                    currentMonth >= previousMonth
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
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

// Enhanced modern color palette inspired by RateHonk branding
const COLORS = [
  "#a0bcea", // Light blue
  "#68e7d4", // Turquoise
  "#000000", // Black
  "#7bbcfd", // Sky blue
  "#b999ec", // Lavender
  "#70dc8d", // Light green
];

// Predefined expense categories
const EXPENSE_CATEGORIES = [
  { value: "travel", label: "Travel & Transportation" },
  { value: "office", label: "Office Supplies" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "software", label: "Software & Tools" },
  { value: "meals", label: "Meals & Entertainment" },
  { value: "utilities", label: "Utilities" },
  { value: "other", label: "Other" },
];

// Chart gradient definitions
const chartGradients = {
  primary: "url(#primaryGradient)",
  secondary: "url(#secondaryGradient)",
  accent: "url(#accentGradient)",
};

export default function TenantDashboard() {
  const { user, tenant } = useAuth();

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{
    period: string;
    startDate?: Date;
    endDate?: Date;
  }>({
    period: "month", // default to month
  });

  // Individual filter states for each analytics block
  const [graphFilter, setGraphFilter] = useState<{
    period: string;
    startDate?: Date;
    endDate?: Date;
  }>({
    period: "month", // default to month for booking/leads trends
  });

  // Business Metrics Trends filters (separate from leadTypes)
  const [businessMetricsDateFilter, setBusinessMetricsDateFilter] =
    useState("this_month");
  const [businessMetricsCustomFrom, setBusinessMetricsCustomFrom] =
    useState<Date | null>(null);
  const [businessMetricsCustomTo, setBusinessMetricsCustomTo] =
    useState<Date | null>(null);

  // Lead Types filters
  const [leadTypesDateFilter, setLeadTypesDateFilter] = useState("this_month");
  const [leadTypesCustomFrom, setLeadTypesCustomFrom] = useState<Date | null>(
    null,
  );
  const [leadTypesCustomTo, setLeadTypesCustomTo] = useState<Date | null>(null);

  // Revenue by Lead Type filters
  const [revenueLeadTypeDateFilter, setRevenueLeadTypeDateFilter] =
    useState("this_month");
  const [revenueLeadTypeCustomFrom, setRevenueLeadTypeCustomFrom] =
    useState<Date | null>(null);
  const [revenueLeadTypeCustomTo, setRevenueLeadTypeCustomTo] =
    useState<Date | null>(null);

  // Bookings by Vendor filters
  const [bookingsVendorDateFilter, setBookingsVendorDateFilter] =
    useState("this_month");
  const [bookingsVendorCustomFrom, setBookingsVendorCustomFrom] =
    useState<Date | null>(null);
  const [bookingsVendorCustomTo, setBookingsVendorCustomTo] =
    useState<Date | null>(null);

  // Estimates filters
  const [estimatesDateFilter, setEstimatesDateFilter] = useState("this_month");
  const [estimatesCustomFrom, setEstimatesCustomFrom] = useState<Date | null>(
    null,
  );
  const [estimatesCustomTo, setEstimatesCustomTo] = useState<Date | null>(null);

  // Expenses filters
  const [expensesDateFilter, setExpensesDateFilter] = useState("this_month");
  const [expensesCustomFrom, setExpensesCustomFrom] = useState<Date | null>(
    null,
  );
  const [expensesCustomTo, setExpensesCustomTo] = useState<Date | null>(null);

  // Email Campaigns filters
  const [emailCampaignsDateFilter, setEmailCampaignsDateFilter] =
    useState("this_month");
  const [emailCampaignsCustomFrom, setEmailCampaignsCustomFrom] =
    useState<Date | null>(null);
  const [emailCampaignsCustomTo, setEmailCampaignsCustomTo] =
    useState<Date | null>(null);

  // Profit & Loss filters
  const [profitLossDateFilter, setProfitLossDateFilter] = useState("this_year");
  const [profitLossCustomFrom, setProfitLossCustomFrom] = useState<Date | null>(
    null,
  );
  const [profitLossCustomTo, setProfitLossCustomTo] = useState<Date | null>(
    null,
  );

  // Dashboard customization dialog state
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  // Build query parameters
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

  // Fetch dashboard data with filters
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: [`/api/reports/dashboard`, queryParams],
    enabled: !!tenant?.id,
    refetchInterval: 30000,
  });

  // Build graph query parameters (separate from main filters)
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

  // Helper function to build filter params from date filter state
  const buildFilterParamsFromDateFilter = (
    dateFilter: string,
    customFrom: Date | null,
    customTo: Date | null,
  ) => {
    const dateFilters = buildDateFilters(dateFilter, customFrom, customTo);

    // buildDateFilters returns an object with startDate, endDate, filterType or undefined
    if (dateFilters) {
      return {
        startDate: dateFilters.startDate,
        endDate: dateFilters.endDate,
        period: dateFilters.filterType, // Include period so backend knows how to group data
      };
    }

    return {};
  };

  // Build individual query params for each block
  const businessMetricsQueryParams = buildFilterParamsFromDateFilter(
    businessMetricsDateFilter,
    businessMetricsCustomFrom,
    businessMetricsCustomTo,
  );
  const leadTypesQueryParams = buildFilterParamsFromDateFilter(
    leadTypesDateFilter,
    leadTypesCustomFrom,
    leadTypesCustomTo,
  );
  const revenueByLeadTypeQueryParams = buildFilterParamsFromDateFilter(
    revenueLeadTypeDateFilter,
    revenueLeadTypeCustomFrom,
    revenueLeadTypeCustomTo,
  );
  const bookingsByVendorQueryParams = buildFilterParamsFromDateFilter(
    bookingsVendorDateFilter,
    bookingsVendorCustomFrom,
    bookingsVendorCustomTo,
  );
  const estimatesQueryParams = buildFilterParamsFromDateFilter(
    estimatesDateFilter,
    estimatesCustomFrom,
    estimatesCustomTo,
  );
  const expensesQueryParams = buildFilterParamsFromDateFilter(
    expensesDateFilter,
    expensesCustomFrom,
    expensesCustomTo,
  );
  const emailCampaignsQueryParams = buildFilterParamsFromDateFilter(
    emailCampaignsDateFilter,
    emailCampaignsCustomFrom,
    emailCampaignsCustomTo,
  );
  const profitLossQueryParams = buildFilterParamsFromDateFilter(
    profitLossDateFilter,
    profitLossCustomFrom,
    profitLossCustomTo,
  );

  // Fetch top lists data with filters
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
        leadTypesQueryParams as any,
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

  // Fetch Revenue by Lead Type data with individual filter
  const { data: revenueByLeadTypeData } = useQuery({
    queryKey: [
      `/api/reports/revenue-by-lead-type`,
      revenueByLeadTypeQueryParams,
    ],
    queryFn: async () => {
      const params = new URLSearchParams(
        revenueByLeadTypeQueryParams as any,
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

  // Fetch Bookings by Vendor data with individual filter
  const { data: bookingsByVendorData } = useQuery({
    queryKey: [`/api/reports/bookings-by-vendor`, bookingsByVendorQueryParams],
    queryFn: async () => {
      const params = new URLSearchParams(
        bookingsByVendorQueryParams as any,
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

  // Fetch Estimates Analytics data with individual filter
  const { data: estimatesData, isLoading: estimatesLoading } = useQuery<
    Estimate[]
  >({
    queryKey: [`/api/estimates`, estimatesQueryParams],
    queryFn: async () => {
      const params = new URLSearchParams(
        estimatesQueryParams as any,
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

  // Fetch Expenses Analytics data with individual filter
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

  // Fetch Email Campaigns Analytics data with individual filter
  const { data: emailCampaignsData, isLoading: emailCampaignsLoading } =
    useQuery<EmailCampaign[]>({
      queryKey: [`/api/email-campaigns`, emailCampaignsQueryParams],
      queryFn: async () => {
        const params = new URLSearchParams(
          emailCampaignsQueryParams as any,
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

  // Fetch Profit & Loss data with individual filter
  const { data: profitLossData, isLoading: profitLossLoading } = useQuery<
    Array<{ month: string; expenses: number; revenue: number; profit: number }>
  >({
    queryKey: [`/api/dashboard/profit-loss`, profitLossQueryParams],
    queryFn: async () => {
      const params = new URLSearchParams(
        profitLossQueryParams as any,
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

  // Extract real metrics from API data (moved before early return)
  const metrics = dashboardData?.metrics || {
    revenue: 0,
    activeBookings: 0,
    customers: 0,
    leads: 0,
  };

  // Fetch chart-specific data with business metrics filter parameters
  const { data: chartDataResponse, isLoading: chartLoading } = useQuery({
    queryKey: [`/api/dashboard/chart-data`, businessMetricsQueryParams],
    queryFn: async () => {
      const params = new URLSearchParams(
        businessMetricsQueryParams as any,
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

  // Enhanced chart data processing using real backend data
  const chartData = useMemo(() => {
    // Use the chart data response from the backend when available
    if (
      chartDataResponse &&
      Array.isArray(chartDataResponse) &&
      chartDataResponse.length > 0
    ) {
      console.log("📊 Using real chart data from backend:", chartDataResponse);
      return chartDataResponse;
    }

    // Fallback to consistent demo data only when no real data is available
    const now = new Date();
    const period = businessMetricsDateFilter;
    let dataPoints: any[] = [];
    console.log("📊 chartDataResponse", period, chartDataResponse);

    // Generate period-appropriate fallback data
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
      // Default month view - last 6 months with consistent values
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

    console.log("📊 Using fallback chart data for period:", period, dataPoints);
    return dataPoints;
  }, [chartDataResponse, businessMetricsDateFilter]);

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

  // Mock monthly data for hover functionality (replace with real API data)
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

  // Ensure arrays for top lists data
  const topLeadsArray = Array.isArray(topLeads) ? topLeads : [];
  const topBookingsArray = Array.isArray(topBookings) ? topBookings : [];
  const topCustomersArray = Array.isArray(topCustomers) ? topCustomers : [];

  // Ensure arrays for chart data
  const revenueByLeadTypeArray = Array.isArray(revenueByLeadTypeData)
    ? revenueByLeadTypeData
    : [];
  const bookingsByVendorArray = Array.isArray(bookingsByVendorData)
    ? bookingsByVendorData
    : [];

  // Helper function to safely parse numeric values
  const safeParseNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return isNaN(value) ? 0 : value;
    if (typeof value === "string") {
      // Handle percentage strings like "23%" by removing the % symbol
      const cleanValue = value.replace("%", "");
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Process analytics data for new charts with defensive programming
  const estimatesArray = Array.isArray(estimatesData) ? estimatesData : [];
  const expensesArray = Array.isArray(expensesData) ? expensesData : [];
  const emailCampaignsArray = Array.isArray(emailCampaignsData)
    ? emailCampaignsData
    : [];

  // Estimates Analytics Processing with safe numeric handling
  const estimatesMetrics = {
    total: estimatesArray.length,
    totalRevenue: estimatesArray.reduce(
      (sum, est) => sum + safeParseNumber(est?.totalAmount),
      0,
    ),
    pending: estimatesArray.filter(
      (est) => est?.status === "draft" || est?.status === "sent",
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
      0,
    ),
    pending: expensesArray.filter((exp) => exp?.status === "pending").length,
    approved: expensesArray.filter((exp) => exp?.status === "approved").length,
    paid: expensesArray.filter((exp) => exp?.status === "paid").length,
  };

  // Group expenses by category with safe numeric handling
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
    {} as Record<string, { name: string; value: number; count: number }>,
  );

  // Show all predefined categories even with 0 data
  const expensesCategoryData = EXPENSE_CATEGORIES.map((category, index) => {
    // Match by category slug value (what's stored in DB)
    const categoryData = expensesByCategory[category.value];
    return {
      name: category.label,
      value: categoryData?.value || 0,
      count: categoryData?.count || 0,
      fill: COLORS[index % COLORS.length],
    };
  });

  // Email Campaigns Analytics Processing with safe numeric handling
  const emailMetrics = {
    total: emailCampaignsArray.length,
    sent: emailCampaignsArray.filter((camp) => camp?.status === "sent").length,
    scheduled: emailCampaignsArray.filter(
      (camp) => camp?.status === "scheduled",
    ).length,
    avgOpenRate:
      emailCampaignsArray.length > 0
        ? emailCampaignsArray.reduce(
            (sum, camp) => sum + safeParseNumber(camp?.openRate),
            0,
          ) / emailCampaignsArray.length
        : 0,
    avgClickRate:
      emailCampaignsArray.length > 0
        ? emailCampaignsArray.reduce(
            (sum, camp) => sum + safeParseNumber(camp?.clickRate),
            0,
          ) / emailCampaignsArray.length
        : 0,
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#0BBCD6]/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>
        <div className="relative z-10 p-8 w-full">
          {/* Dashboard Header with Date Filters */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-[#0BBCD6] to-purple-600 dark:from-white dark:via-[#0BBCD6] dark:to-purple-400 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-gray-700 dark:text-gray-300 mt-2 text-lg font-medium">
                  Welcome back! Here's what's happening with your travel
                  business.
                </p>
              </div>

              {/* Date Filter Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCustomizationOpen(true)}
                  className="p-2 h-8 w-8 hover:bg-[#0BBCD6]/10"
                  data-testid="button-dashboard-customization"
                >
                  <Filter className="h-5 w-5 text-muted-foreground hover:text-[#0BBCD6] transition-colors" />
                </Button>
                <Select
                  value={dateFilter.period}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setDateFilter({
                        period: value,
                        startDate: undefined,
                        endDate: undefined,
                      });
                    } else {
                      setDateFilter({ period: value });
                    }
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                {/* Custom Date Range Picker */}
                {dateFilter.period === "custom" && (
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateFilter.startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFilter.startDate
                            ? format(dateFilter.startDate, "MMM dd, yyyy")
                            : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFilter.startDate}
                          onSelect={(date) =>
                            setDateFilter({ ...dateFilter, startDate: date })
                          }
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <span className="text-muted-foreground">to</span>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateFilter.endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFilter.endDate
                            ? format(dateFilter.endDate, "MMM dd, yyyy")
                            : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFilter.endDate}
                          onSelect={(date) =>
                            setDateFilter({ ...dateFilter, endDate: date })
                          }
                          disabled={(date) =>
                            date > new Date() ||
                            (dateFilter.startDate
                              ? date < dateFilter.startDate
                              : false)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top 4 Metric Cards with Hover Details */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            data-testid="metric-cards-container"
          >
            <div data-testid="metric-card-revenue">
              <MetricCard
                title="Total Revenue"
                value={`$${metrics.revenue.toLocaleString()}`}
                icon={DollarSign}
                trend={`${(((monthlyData.revenue.current - monthlyData.revenue.previous) / (monthlyData.revenue.previous || 1)) * 100).toFixed(1)}%`}
                previousMonth={monthlyData.revenue.previous}
                currentMonth={monthlyData.revenue.current}
                isPositive={
                  monthlyData.revenue.current >= monthlyData.revenue.previous
                }
              />
            </div>

            <div data-testid="metric-card-bookings">
              <Link href={`/bookings`}>
                <MetricCard
                  title="Total Bookings"
                  value={metrics.activeBookings}
                  icon={BookOpen}
                  trend={`${(((monthlyData.bookings.current - monthlyData.bookings.previous) / (monthlyData.bookings.previous || 1)) * 100).toFixed(1)}%`}
                  previousMonth={monthlyData.bookings.previous}
                  currentMonth={monthlyData.bookings.current}
                  isPositive={
                    monthlyData.bookings.current >=
                    monthlyData.bookings.previous
                  }
                />
              </Link>
            </div>

            <div data-testid="metric-card-customers">
              <Link href={`/customers`}>
                <MetricCard
                  title="Total Customers"
                  value={metrics.customers}
                  icon={Users}
                  trend={`${(((monthlyData.customers.current - monthlyData.customers.previous) / (monthlyData.customers.previous || 1)) * 100).toFixed(1)}%`}
                  previousMonth={monthlyData.customers.previous}
                  currentMonth={monthlyData.customers.current}
                  isPositive={
                    monthlyData.customers.current >=
                    monthlyData.customers.previous
                  }
                />
              </Link>
            </div>

            <div data-testid="metric-card-leads">
              <Link href={`/leads`}>
                <MetricCard
                  title="Total Leads"
                  value={metrics.leads}
                  icon={UserCheck}
                  trend={`${(((monthlyData.leads.current - monthlyData.leads.previous) / (monthlyData.leads.previous || 1)) * 100).toFixed(1)}%`}
                  previousMonth={monthlyData.leads.previous}
                  currentMonth={monthlyData.leads.current}
                  isPositive={
                    monthlyData.leads.current >= monthlyData.leads.previous
                  }
                />
              </Link>
            </div>
          </div>

          {/* Main Content Grid - Charts on Left, Top Lists on Right */}
          <div
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            data-testid="dashboard-main-content"
          >
            {/* Charts Section - Left Side (3/4 width) */}
            <div
              className="lg:col-span-3 space-y-6"
              data-testid="charts-section"
            >
              {/* Row 1: Profit & Loss Analysis (70%) and Estimates Overview (30%) */}
              <div className="grid grid-cols-10 gap-6">
                {/* Profit & Loss Chart - 70% width (7/10) */}
                <Card
                  data-testid="chart-profit-loss"
                  className="col-span-7 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                >
                  <CardHeader className="bg-gradient-to-r to-red-500/10 rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          Profit & Loss Analysis
                        </span>
                      </div>
                      <DateFilter
                        dateFilter={profitLossDateFilter}
                        setDateFilter={setProfitLossDateFilter}
                        customDateFrom={profitLossCustomFrom}
                        setCustomDateFrom={setProfitLossCustomFrom}
                        customDateTo={profitLossCustomTo}
                        setCustomDateTo={setProfitLossCustomTo}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {profitLossLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <div className="text-gray-500">
                          Loading profit & loss data...
                        </div>
                      </div>
                    ) : profitLossData && profitLossData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={profitLossData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="month"
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              tick={{
                                fill: "#6B7280",
                                fontSize: 11,
                                fontWeight: 500,
                              }}
                              tickFormatter={(value) => {
                                const [year, month] = value.split("-");
                                const date = new Date(
                                  parseInt(year),
                                  parseInt(month) - 1,
                                );
                                return date.toLocaleDateString("en-US", {
                                  month: "short",
                                  year: "numeric",
                                });
                              }}
                            />
                            <YAxis
                              tickFormatter={(value) =>
                                `$${value.toLocaleString()}`
                              }
                            />
                            <Tooltip
                              formatter={(value: any) =>
                                `$${value.toLocaleString()}`
                              }
                              contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                              }}
                            />
                            <Bar
                              dataKey="expenses"
                              fill="#a0bcea"
                              name="Expenses"
                              barSize={10}
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="revenue"
                              fill="#68e7d4"
                              name="Revenue"
                              barSize={10}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center">
                        <div className="text-gray-500">
                          No profit & loss data available
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Estimates Overview - 30% width (3/10) */}
                <Card
                  data-testid="chart-estimates-overview"
                  className="col-span-3 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                >
                  <CardHeader className="bg-gradient-to-r rounded-t-lg pb-3">
                    <CardTitle className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-[#0BBCD6] to-blue-600 rounded-lg">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          Estimates
                        </span>
                      </div>
                      <DateFilter
                        dateFilter={estimatesDateFilter}
                        setDateFilter={setEstimatesDateFilter}
                        customDateFrom={estimatesCustomFrom}
                        setCustomDateFrom={setEstimatesCustomFrom}
                        customDateTo={estimatesCustomTo}
                        setCustomDateTo={estimatesCustomTo}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {estimatesLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0BBCD6]"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p
                            className="text-3xl font-bold text-gray-900 dark:text-white"
                            data-testid="expenses-total-count"
                          >
                            {estimatesMetrics.total}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Total
                          </p>
                        </div>
                        <div className="text-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p
                            className="text-3xl font-bold text-gray-900 dark:text-white"
                            data-testid="expenses-total-count"
                          >
                            ${(estimatesMetrics.totalRevenue / 1000).toFixed(1)}
                            k
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Revenue
                          </p>
                        </div>
                        <div className="space-y-2">
                          {estimatesStatusData.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 rounded-lg border"
                              style={{
                                borderColor: `${item.fill}40`,
                                backgroundColor: `${item.fill}10`,
                              }}
                            >
                              <span
                                className="text-xs font-medium"
                                style={{ color: item.fill }}
                              >
                                {item.name}
                              </span>
                              <span
                                className="text-sm font-bold"
                                style={{ color: item.fill }}
                              >
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Business Metrics Trends (70%) and Expenses Overview (30%) */}
              <div className="grid grid-cols-10 gap-6">
                {/* Business Metrics Trends Chart - 70% width (7/10) */}
                <Card
                  data-testid="chart-booking-leads-trends"
                  className="col-span-7 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                >
                  <CardHeader className="bg-gradient-to-r  rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-[#0BBCD6] to-blue-600 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          Business Metrics Trends
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <div
                          className="flex items-center gap-1"
                          data-testid="legend-bookings"
                        >
                          <div className="w-3 h-3 rounded-full bg-[#a0bcea]"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Bookings
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1"
                          data-testid="legend-leads"
                        >
                          <div className="w-3 h-3 rounded-full bg-[#68e7d4]"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Leads
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1"
                          data-testid="legend-profit"
                        >
                          <div className="w-3 h-3 rounded-full bg-[#7bbcfd]"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Profit
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1"
                          data-testid="legend-loss"
                        >
                          <div className="w-3 h-3 rounded-full bg-[#b999ec]"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Loss
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1"
                          data-testid="legend-expense"
                        >
                          <div className="w-3 h-3 rounded-full bg-[#70dc8d]"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Expense
                          </span>
                        </div>
                        <DateFilter
                          dateFilter={businessMetricsDateFilter}
                          setDateFilter={setBusinessMetricsDateFilter}
                          customDateFrom={businessMetricsCustomFrom}
                          setCustomDateFrom={setBusinessMetricsCustomFrom}
                          customDateTo={businessMetricsCustomTo}
                          setCustomDateTo={setBusinessMetricsCustomTo}
                        />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {chartData && chartData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 20,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id="bookingsGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#a0bcea"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#a0bcea"
                                  stopOpacity={0.0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="leadsGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#68e7d4"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#68e7d4"
                                  stopOpacity={0.0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="profitGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#7bbcfd"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#7bbcfd"
                                  stopOpacity={0.0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="lossGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#b999ec"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#b999ec"
                                  stopOpacity={0.0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="expenseGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#70dc8d"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#70dc8d"
                                  stopOpacity={0.0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#E5E7EB"
                              opacity={0.3}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="month"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: "#6B7280",
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                              tickMargin={10}
                            />
                            <YAxis
                              axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }}
                              tickLine={false}
                              tick={{
                                fill: "#6B7280",
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                              tickMargin={10}
                              width={60}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.98)",
                                border: "1px solid #E5E7EB",
                                borderRadius: "12px",
                                boxShadow:
                                  "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                                backdropFilter: "blur(10px)",
                                fontSize: "14px",
                              }}
                              labelStyle={{
                                color: "#374151",
                                fontWeight: 600,
                                marginBottom: "4px",
                              }}
                              formatter={(value, name) => {
                                const labels: Record<string, string> = {
                                  bookings: "Bookings",
                                  leads: "Leads",
                                  profit: "Profit",
                                  loss: "Loss",
                                  expense: "Expense",
                                };
                                return [
                                  typeof value === "number" &&
                                  (name === "profit" ||
                                    name === "loss" ||
                                    name === "expense")
                                    ? `$${value.toLocaleString()}`
                                    : value,
                                  labels[name as string] || name,
                                ];
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="bookings"
                              stroke="#a0bcea"
                              strokeWidth={4}
                              fill="url(#bookingsGradient)"
                              name="bookings"
                              dot={{
                                fill: "#a0bcea",
                                strokeWidth: 2,
                                r: 6,
                                stroke: "#fff",
                              }}
                              activeDot={{
                                r: 8,
                                fill: "#a0bcea",
                                stroke: "#fff",
                                strokeWidth: 3,
                              }}
                              connectNulls={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="leads"
                              stroke="#68e7d4"
                              strokeWidth={4}
                              fill="url(#leadsGradient)"
                              name="leads"
                              dot={{
                                fill: "#68e7d4",
                                strokeWidth: 2,
                                r: 6,
                                stroke: "#fff",
                              }}
                              activeDot={{
                                r: 8,
                                fill: "#68e7d4",
                                stroke: "#fff",
                                strokeWidth: 3,
                              }}
                              connectNulls={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="profit"
                              stroke="#7bbcfd"
                              strokeWidth={3}
                              fill="url(#profitGradient)"
                              name="profit"
                              dot={{
                                fill: "#7bbcfd",
                                strokeWidth: 2,
                                r: 4,
                                stroke: "#fff",
                              }}
                              activeDot={{
                                r: 7,
                                fill: "#7bbcfd",
                                stroke: "#fff",
                                strokeWidth: 2,
                              }}
                              connectNulls={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="loss"
                              stroke="#b999ec"
                              strokeWidth={3}
                              fill="url(#lossGradient)"
                              name="loss"
                              dot={{
                                fill: "#b999ec",
                                strokeWidth: 2,
                                r: 4,
                                stroke: "#fff",
                              }}
                              activeDot={{
                                r: 7,
                                fill: "#b999ec",
                                stroke: "#fff",
                                strokeWidth: 2,
                              }}
                              connectNulls={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="expense"
                              stroke="#70dc8d"
                              strokeWidth={3}
                              fill="url(#expenseGradient)"
                              name="expense"
                              dot={{
                                fill: "#70dc8d",
                                strokeWidth: 2,
                                r: 4,
                                stroke: "#fff",
                              }}
                              activeDot={{
                                r: 7,
                                fill: "#70dc8d",
                                stroke: "#fff",
                                strokeWidth: 2,
                              }}
                              connectNulls={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No Data Available
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Start creating bookings and leads to see trends here
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Expenses Overview - 30% width (3/10) */}
                <Card
                  data-testid="chart-expenses-overview"
                  className="col-span-3 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                >
                  <CardHeader className="bg-gradient-to-r to-violet-500/10 rounded-t-lg pb-3">
                    <CardTitle className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                          <Receipt className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          Expenses
                        </span>
                      </div>
                      <DateFilter
                        dateFilter={expensesDateFilter}
                        setDateFilter={setExpensesDateFilter}
                        customDateFrom={expensesCustomFrom}
                        setCustomDateFrom={setExpensesCustomFrom}
                        customDateTo={expensesCustomTo}
                        setCustomDateTo={setExpensesCustomTo}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {expensesLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p
                            className="text-3xl font-bold text-gray-900 dark:text-white"
                            data-testid="expenses-total-count"
                          >
                            {expensesMetrics.total}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Total
                          </p>
                        </div>
                        <div className="text-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p
                            className="text-3xl font-bold text-gray-900 dark:text-white"
                            data-testid="expenses-total-amount"
                          >
                            ${(expensesMetrics.totalAmount / 1000).toFixed(1)}k
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Amount
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2  rounded border">
                            <span className="text-xs font-medium">Pending</span>
                            <span
                              className="text-sm font-bold"
                              data-testid="expenses-pending-count"
                            >
                              {expensesMetrics.pending}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded border">
                            <span className="text-xs font-medium">
                              Approved
                            </span>
                            <span
                              className="text-sm font-bold"
                              data-testid="expenses-approved-count"
                            >
                              {expensesMetrics.approved}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded border">
                            <span className="text-xs font-medium">Paid</span>
                            <span
                              className="text-sm font-bold"
                              data-testid="expenses-paid-count"
                            >
                              {expensesMetrics.paid}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Graph Filter Controls */}
              {/* <Card
                className="mb-6 bg-gradient-to-r from-[#0BBCD6]/5 to-purple-500/5 border-l-4 border-l-[#0BBCD6] shadow-lg"
                data-testid="graph-filters"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-[#0BBCD6] to-blue-600 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Chart Analytics
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={graphFilter.period}
                        onValueChange={(value) => {
                          if (value === "custom") {
                            setGraphFilter({
                              period: value,
                              startDate: undefined,
                              endDate: undefined,
                            });
                          } else {
                            setGraphFilter({ period: value });
                          }
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Chart Period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="month">Month</SelectItem>
                          <SelectItem value="year">Year</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>

                      {graphFilter.period === "custom" && (
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "justify-start text-left font-normal",
                                  !graphFilter.startDate &&
                                    "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {graphFilter.startDate
                                  ? format(
                                      graphFilter.startDate,
                                      "MMM dd, yyyy",
                                    )
                                  : "Start"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={graphFilter.startDate}
                                onSelect={(date) =>
                                  setGraphFilter({
                                    ...graphFilter,
                                    startDate: date,
                                  })
                                }
                                disabled={(date) => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>

                          <span className="text-muted-foreground text-sm">
                            to
                          </span>

                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "justify-start text-left font-normal",
                                  !graphFilter.endDate &&
                                    "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {graphFilter.endDate
                                  ? format(graphFilter.endDate, "MMM dd, yyyy")
                                  : "End"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={graphFilter.endDate}
                                onSelect={(date) =>
                                  setGraphFilter({
                                    ...graphFilter,
                                    endDate: date,
                                  })
                                }
                                disabled={(date) =>
                                  date > new Date() ||
                                  (graphFilter.startDate
                                    ? date < graphFilter.startDate
                                    : false)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card> */}

              <div
                className="grid grid-cols-1 gap-6 mb-12"
                data-testid="lead-types-charts"
              >
                {/* <Card
                  data-testid="chart-leads-by-type"
                  className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                >
                  <CardHeader className="bg-gradient-to-r from-[#0BBCD6]/10 to-green-500/10 rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-[#0BBCD6] to-green-600 rounded-lg">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          Leads by Type
                        </span>
                      </div>
                      <DateFilter
                        dateFilter={leadTypesDateFilter}
                        setDateFilter={setLeadTypesDateFilter}
                        customDateFrom={leadTypesCustomFrom}
                        setCustomDateFrom={setLeadTypesCustomFrom}
                        customDateTo={leadTypesCustomTo}
                        setCustomDateTo={setLeadTypesCustomTo}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            {COLORS.map((color, index) => (
                              <linearGradient
                                key={`gradient-${index}`}
                                id={`pieGradient-${index}`}
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor={color}
                                  stopOpacity={1}
                                />
                                <stop
                                  offset="100%"
                                  stopColor={color}
                                  stopOpacity={0.7}
                                />
                              </linearGradient>
                            ))}
                          </defs>
                          <Pie
                            data={leadTypesChart}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {Array.isArray(leadTypesChart) &&
                              leadTypesChart.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={`url(#pieGradient-${index % COLORS.length})`}
                                  stroke={COLORS[index % COLORS.length]}
                                  strokeWidth={2}
                                />
                              ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              border: "none",
                              borderRadius: "12px",
                              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                              backdropFilter: "blur(10px)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card> */}

                {/* Row 3: Services Bookings (70%) and Email Campaigns (30%) */}
                <div className="grid grid-cols-10 gap-6">
                  {/* Services Bookings - 70% width (7/10) */}
                  <Card
                    data-testid="chart-bookings-by-lead-type"
                    className="col-span-7 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Services Bookings</CardTitle>
                          <CardDescription>
                            Number of bookings by lead type
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
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="bar" className="w-full">
                        <TabsList className="grid w-full max-w-[240px] grid-cols-2 mb-4">
                          <TabsTrigger
                            value="bar"
                            data-testid="tab-services-bookings-bar"
                          >
                            Bar Chart
                          </TabsTrigger>
                          <TabsTrigger
                            value="pie"
                            data-testid="tab-services-bookings-pie"
                          >
                            Pie Chart
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="bar" className="mt-0">
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={leadTypesChart}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="name"
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  tick={{
                                    fill: "#6B7280",
                                    fontSize: 11,
                                    fontWeight: 500,
                                  }}
                                />
                                <YAxis />
                                <Tooltip />
                                <Bar
                                  dataKey="bookings"
                                  barSize={10}
                                  radius={[4, 4, 0, 0]}
                                >
                                  {leadTypesChart.map(
                                    (entry: any, index: number) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                      />
                                    ),
                                  )}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </TabsContent>
                        <TabsContent value="pie" className="mt-0">
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={leadTypesChart}
                                  cx="35%"
                                  cy="50%"
                                  labelLine={false}
                                  innerRadius={50}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="bookings"
                                >
                                  {leadTypesChart.map(
                                    (entry: any, index: number) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                      />
                                    ),
                                  )}
                                </Pie>
                                <Tooltip />
                                <Legend
                                  layout="vertical"
                                  align="right"
                                  verticalAlign="middle"
                                  formatter={(value, entry: any) =>
                                    `${entry.payload.name}: ${entry.payload.bookings}`
                                  }
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {/* Email Campaigns - 30% width (3/10) */}
                  <Card
                    data-testid="chart-email-campaigns-overview"
                    className="col-span-3 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                  >
                    <CardHeader className="bg-gradient-to-r rounded-t-lg pb-3">
                      <CardTitle className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg">
                            <Send className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            Email Campaigns
                          </span>
                        </div>
                        <DateFilter
                          dateFilter={emailCampaignsDateFilter}
                          setDateFilter={setEmailCampaignsDateFilter}
                          customDateFrom={emailCampaignsCustomFrom}
                          setCustomDateFrom={setEmailCampaignsCustomFrom}
                          customDateTo={emailCampaignsCustomTo}
                          setCustomDateTo={setEmailCampaignsCustomTo}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {emailCampaignsLoading ? (
                        <div className="flex items-center justify-center h-48">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p
                              className="text-3xl font-bold text-gray-900 dark:text-white"
                              data-testid="email-campaigns-total-count"
                            >
                              {emailMetrics.total}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Total
                            </p>
                          </div>
                          <div className="text-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p
                              className="text-3xl font-bold text-gray-900 dark:text-white"
                              data-testid="email-campaigns-sent-count"
                            >
                              {emailMetrics.sent}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Sent
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 rounded-lg border">
                              <span className="text-xs font-medium">
                                Open Rate
                              </span>
                              <span
                                className="text-sm font-bold"
                                data-testid="email-avg-open-rate"
                              >
                                {emailMetrics.avgOpenRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded-lg border">
                              <span className="text-xs font-medium">
                                Click Rate
                              </span>
                              <span
                                className="text-sm font-bold"
                                data-testid="email-avg-click-rate"
                              >
                                {emailMetrics.avgClickRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded-lg border">
                              <span className="text-xs font-medium">
                                Scheduled
                              </span>
                              <span
                                className="text-sm font-bold"
                                data-testid="email-scheduled-count"
                              >
                                {emailMetrics.scheduled}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* NEW: Revenue & Vendor Analytics Charts */}
              <div
                className="grid grid-cols-1 gap-12"
                data-testid="revenue-vendor-charts"
              >
                {/* Revenue by Lead Type */}
                <Card data-testid="chart-revenue-by-lead-type">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Services Revenue</CardTitle>
                        <CardDescription>
                          Total revenue generated from each lead source
                        </CardDescription>
                      </div>
                      <DateFilter
                        dateFilter={revenueLeadTypeDateFilter}
                        setDateFilter={setRevenueLeadTypeDateFilter}
                        customDateFrom={revenueLeadTypeCustomFrom}
                        setCustomDateFrom={setRevenueLeadTypeCustomFrom}
                        customDateTo={revenueLeadTypeCustomTo}
                        setCustomDateTo={setRevenueLeadTypeCustomTo}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="bar" className="w-full">
                      <TabsList className="grid w-full max-w-[240px] grid-cols-2 mb-4">
                        <TabsTrigger
                          value="bar"
                          data-testid="tab-services-revenue-bar"
                        >
                          Bar Chart
                        </TabsTrigger>
                        <TabsTrigger
                          value="pie"
                          data-testid="tab-services-revenue-pie"
                        >
                          Pie Chart
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="bar" className="mt-0">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueByLeadTypeArray}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{
                                  fill: "#6B7280",
                                  fontSize: 11,
                                  fontWeight: 500,
                                }}
                              />
                              <YAxis
                                tickFormatter={(value) =>
                                  `$${value.toLocaleString()}`
                                }
                              />
                              <Tooltip
                                formatter={(value: any, name: string) => [
                                  name === "revenue"
                                    ? `$${value.toLocaleString()}`
                                    : value,
                                  name === "revenue" ? "Revenue" : "Bookings",
                                ]}
                              />
                              <Bar
                                dataKey="revenue"
                                name="Revenue"
                                barSize={10}
                                radius={[4, 4, 0, 0]}
                              >
                                {revenueByLeadTypeArray.map(
                                  (entry: any, index: number) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ),
                                )}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                      <TabsContent value="pie" className="mt-0">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={revenueByLeadTypeArray}
                                cx="35%"
                                cy="50%"
                                labelLine={false}
                                innerRadius={50}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="revenue"
                              >
                                {revenueByLeadTypeArray.map(
                                  (entry: any, index: number) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ),
                                )}
                              </Pie>
                              <Tooltip
                                formatter={(value: any) => [
                                  `$${value.toLocaleString()}`,
                                  "Revenue",
                                ]}
                              />
                              <Legend
                                layout="vertical"
                                align="right"
                                verticalAlign="middle"
                                formatter={(value, entry: any) =>
                                  `${entry.payload.name}: $${entry.payload.revenue?.toLocaleString() || 0}`
                                }
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Bookings by Vendor */}
              <div
                className="grid grid-cols-1 gap-12"
                data-testid="revenue-vendor-charts"
              >
                <Card data-testid="chart-bookings-by-vendor">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Supplier Bookings</CardTitle>
                        <CardDescription>
                          Number of bookings per vendor partner
                        </CardDescription>
                      </div>
                      <DateFilter
                        dateFilter={bookingsVendorDateFilter}
                        setDateFilter={setBookingsVendorDateFilter}
                        customDateFrom={bookingsVendorCustomFrom}
                        setCustomDateFrom={setBookingsVendorCustomFrom}
                        customDateTo={bookingsVendorCustomTo}
                        setCustomDateTo={setBookingsVendorCustomTo}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="bar" className="w-full">
                      <TabsList className="grid w-full max-w-[240px] grid-cols-2 mb-4">
                        <TabsTrigger
                          value="bar"
                          data-testid="tab-supplier-bookings-bar"
                        >
                          Bar Chart
                        </TabsTrigger>
                        <TabsTrigger
                          value="pie"
                          data-testid="tab-supplier-bookings-pie"
                        >
                          Pie Chart
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="bar" className="mt-0">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bookingsByVendorArray}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="vendorName"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{
                                  fill: "#6B7280",
                                  fontSize: 11,
                                  fontWeight: 500,
                                }}
                              />
                              <YAxis />
                              <Tooltip
                                formatter={(value: any, name: string) => [
                                  name === "totalRevenue"
                                    ? `$${value.toLocaleString()}`
                                    : value,
                                  name === "totalBookings"
                                    ? "Bookings"
                                    : name === "totalRevenue"
                                      ? "Revenue"
                                      : "Avg Value",
                                ]}
                              />
                              <Bar
                                dataKey="totalBookings"
                                name="Total Bookings"
                                barSize={10}
                                radius={[4, 4, 0, 0]}
                              >
                                {bookingsByVendorArray.map(
                                  (entry: any, index: number) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ),
                                )}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                      <TabsContent value="pie" className="mt-0">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={bookingsByVendorArray}
                                cx="35%"
                                cy="50%"
                                labelLine={false}
                                innerRadius={50}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="totalBookings"
                              >
                                {bookingsByVendorArray.map(
                                  (entry: any, index: number) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ),
                                )}
                              </Pie>
                              <Tooltip />
                              <Legend
                                layout="vertical"
                                align="right"
                                verticalAlign="middle"
                                formatter={(value, entry: any) =>
                                  `${entry.payload.vendorName}: ${entry.payload.totalBookings || 0}`
                                }
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* NEW: Estimates Analytics Section */}
              <div
                className="grid grid-cols-1 gap-6 mb-12"
                data-testid="estimates-analytics-charts"
              >
                {/* Estimates Overview */}
                {/* <Card
                  data-testid="chart-estimates-overview"
                  className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                >
                  <CardHeader className="bg-gradient-to-r from-[#0BBCD6]/10 to-blue-500/10 rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-[#0BBCD6] to-blue-600 rounded-lg">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          Estimates Overview
                        </span>
                      </div>
                      <DateFilter
                        dateFilter={estimatesDateFilter}
                        setDateFilter={setEstimatesDateFilter}
                        customDateFrom={estimatesCustomFrom}
                        setCustomDateFrom={setEstimatesCustomFrom}
                        customDateTo={estimatesCustomTo}
                        setCustomDateTo={setEstimatesCustomTo}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {estimatesLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0BBCD6]"></div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-4 bg-gradient-to-br from-[#0BBCD6]/5 to-blue-500/5 rounded-lg border border-[#0BBCD6]/20">
                            <p
                              className="text-2xl font-bold text-[#0BBCD6]"
                              data-testid="estimates-total-count"
                            >
                              {estimatesMetrics.total}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Total Estimates
                            </p>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg border border-green-500/20">
                            <p
                              className="text-2xl font-bold text-green-600"
                              data-testid="estimates-total-revenue"
                            >
                              ${estimatesMetrics.totalRevenue.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Total Revenue
                            </p>
                          </div>
                        </div>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={estimatesStatusData}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) =>
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                              >
                                {estimatesStatusData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.fill}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card> */}

                {/* Estimates Status Distribution */}
                {/* <Card
                  data-testid="chart-estimates-status"
                  className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                >
                  <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Estimates Status
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {estimatesLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <span className="font-medium text-amber-800 dark:text-amber-200">
                            Pending (Draft/Sent)
                          </span>
                          <span
                            className="text-xl font-bold text-amber-600"
                            data-testid="estimates-pending-count"
                          >
                            {estimatesMetrics.pending}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Accepted
                          </span>
                          <span
                            className="text-xl font-bold text-green-600"
                            data-testid="estimates-accepted-count"
                          >
                            {estimatesMetrics.accepted}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <span className="font-medium text-red-800 dark:text-red-200">
                            Rejected
                          </span>
                          <span
                            className="text-xl font-bold text-red-600"
                            data-testid="estimates-rejected-count"
                          >
                            {estimatesMetrics.rejected}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card> */}
              </div>

              {/* NEW: Expenses Analytics Section */}
              <div
                className="grid grid-cols-1 gap-6 mb-12"
                data-testid="expenses-analytics-charts"
              >
                {/* Expenses Overview */}

                {/* Expenses by Category */}
                <Card
                  data-testid="chart-expenses-categories"
                  className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                >
                  <CardHeader className="bg-gradient-to-r rounded-t-lg">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Expenses by Category
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {expensesLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                      </div>
                    ) : (
                      <Tabs defaultValue="bar" className="w-full">
                        <TabsList className="grid w-full max-w-[240px] grid-cols-2 mb-4">
                          <TabsTrigger
                            value="bar"
                            data-testid="tab-expenses-category-bar"
                          >
                            Bar Chart
                          </TabsTrigger>
                          <TabsTrigger
                            value="pie"
                            data-testid="tab-expenses-category-pie"
                          >
                            Pie Chart
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="bar" className="mt-0">
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={expensesCategoryData}>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#E5E7EB"
                                  opacity={0.5}
                                />
                                <XAxis
                                  dataKey="name"
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  tick={{
                                    fill: "#6B7280",
                                    fontSize: 11,
                                    fontWeight: 500,
                                  }}
                                />
                                <YAxis
                                  tickFormatter={(value) =>
                                    `$${value.toLocaleString()}`
                                  }
                                  tick={{
                                    fill: "#6B7280",
                                    fontSize: 11,
                                    fontWeight: 500,
                                  }}
                                />
                                <Tooltip
                                  formatter={(value: any, name: string) => [
                                    name === "value"
                                      ? `$${value.toLocaleString()}`
                                      : value,
                                    name === "value" ? "Amount" : name,
                                  ]}
                                  contentStyle={{
                                    backgroundColor:
                                      "rgba(255, 255, 255, 0.95)",
                                    border: "none",
                                    borderRadius: "12px",
                                    boxShadow:
                                      "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                                    backdropFilter: "blur(10px)",
                                  }}
                                />
                                <Bar
                                  dataKey="value"
                                  radius={[4, 4, 0, 0]}
                                  barSize={10}
                                >
                                  {expensesCategoryData.map(
                                    (entry: any, index: number) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                      />
                                    ),
                                  )}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </TabsContent>
                        <TabsContent value="pie" className="mt-0">
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={expensesCategoryData}
                                  cx="35%"
                                  cy="50%"
                                  labelLine={false}
                                  innerRadius={50}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {expensesCategoryData.map(
                                    (entry: any, index: number) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                      />
                                    ),
                                  )}
                                </Pie>
                                <Tooltip
                                  formatter={(value: any) => [
                                    `$${value.toLocaleString()}`,
                                    "Amount",
                                  ]}
                                />
                                <Legend
                                  layout="vertical"
                                  align="right"
                                  verticalAlign="middle"
                                  formatter={(value, entry: any) =>
                                    `${entry.payload.name}: $${entry.payload.value?.toLocaleString() || 0}`
                                  }
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* NEW: Email Campaigns Analytics Section */}
              <div
                className="grid grid-cols-1 gap-6 mb-12"
                data-testid="email-campaigns-analytics-charts"
              >
                {/* Email Campaigns Overview */}
                {/* <Card
                  data-testid="chart-email-campaigns-overview"
                  className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                >
                  <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg">
                          <Send className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          Email Campaigns
                        </span>
                      </div>
                      <DateFilter
                        dateFilter={emailCampaignsDateFilter}
                        setDateFilter={setEmailCampaignsDateFilter}
                        customDateFrom={emailCampaignsCustomFrom}
                        setCustomDateFrom={setEmailCampaignsCustomFrom}
                        customDateTo={emailCampaignsCustomTo}
                        setCustomDateTo={setEmailCampaignsCustomTo}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {emailCampaignsLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-4 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-lg border border-indigo-500/20">
                            <p
                              className="text-2xl font-bold text-indigo-600"
                              data-testid="email-campaigns-total-count"
                            >
                              {emailMetrics.total}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Total Campaigns
                            </p>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg border border-green-500/20">
                            <p
                              className="text-2xl font-bold text-green-600"
                              data-testid="email-campaigns-sent-count"
                            >
                              {emailMetrics.sent}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Sent Campaigns
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <span className="font-medium text-blue-800 dark:text-blue-200">
                              Avg Open Rate
                            </span>
                            <span
                              className="text-lg font-bold text-blue-600"
                              data-testid="email-avg-open-rate"
                            >
                              {emailMetrics.avgOpenRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <span className="font-medium text-green-800 dark:text-green-200">
                              Avg Click Rate
                            </span>
                            <span
                              className="text-lg font-bold text-green-600"
                              data-testid="email-avg-click-rate"
                            >
                              {emailMetrics.avgClickRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <span className="font-medium text-amber-800 dark:text-amber-200">
                              Scheduled
                            </span>
                            <span
                              className="text-lg font-bold text-amber-600"
                              data-testid="email-scheduled-count"
                            >
                              {emailMetrics.scheduled}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card> */}

                {/* Email Performance Placeholder */}
                {/* <Card
                  data-testid="chart-email-performance"
                  className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-xl"
                >
                  <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Campaign Performance
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-64 flex items-center justify-center">
                      {emailCampaignsArray.length === 0 ? (
                        <div className="text-center">
                          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">
                            No email campaigns yet
                          </p>
                          <p className="text-sm text-gray-400">
                            Create your first campaign to see performance
                            metrics
                          </p>
                        </div>
                      ) : (
                        <div className="w-full">
                          <div className="grid grid-cols-1 gap-4">
                            {emailCampaignsArray
                              .slice(0, 3)
                              .map((campaign: any, index) => (
                                <div
                                  key={campaign.id}
                                  className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg border border-teal-200 dark:border-teal-800"
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium text-teal-800 dark:text-teal-200">
                                        {campaign.name}
                                      </p>
                                      <p className="text-xs text-teal-600 dark:text-teal-400">
                                        {campaign.status}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-teal-700 dark:text-teal-300">
                                        {campaign.openRate || 0}% open
                                      </p>
                                      <p className="text-sm font-bold text-teal-700 dark:text-teal-300">
                                        {campaign.clickRate || 0}% click
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card> */}
              </div>
            </div>

            {/* Right Sidebar - Top 10 Lists */}
            <div className="space-y-6" data-testid="top-lists-sidebar">
              {/* Top 10 Leads */}
              <Card data-testid="top-leads-card">
                <CardHeader>
                  <CardTitle className="text-lg">Top 10 Leads</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topLeadsArray.slice(0, 10).map((lead: any, index) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      data-testid={`lead-item-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {lead.firstName?.[0] || lead.name?.[0] || "L"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/leads`}>
                            <p className="text-sm font-medium">
                              {lead.firstName
                                ? `${lead.firstName} ${lead.lastName}`
                                : lead.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lead.email}
                            </p>
                          </Link>
                        </div>
                      </div>
                      {/* <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge> */}
                    </div>
                  ))}
                  {topLeadsArray.length === 0 && (
                    <p
                      className="text-sm text-muted-foreground text-center py-4"
                      data-testid="no-leads-message"
                    >
                      No leads available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Top 10 Bookings */}
              <Card data-testid="top-bookings-card">
                <CardHeader>
                  <CardTitle className="text-lg">Top 10 Bookings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topBookingsArray.slice(0, 10).map((booking: any, index) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      data-testid={`booking-item-${index}`}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {booking.customerName || "Unknown Customer"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${booking.totalAmount?.toLocaleString() || "0"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                  {topBookingsArray.length === 0 && (
                    <p
                      className="text-sm text-muted-foreground text-center py-4"
                      data-testid="no-bookings-message"
                    >
                      No bookings available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Top 10 Customers */}
              <Card data-testid="top-customers-card">
                <CardHeader>
                  <CardTitle className="text-lg">Top 10 Customers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topCustomersArray
                    .slice(0, 10)
                    .map((customer: any, index) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                        data-testid={`customer-item-${index}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {customer.firstName?.[0] ||
                                customer.name?.[0] ||
                                "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link href={`/customers/${customer.id}`}>
                              <p className="text-sm font-medium">
                                {customer.firstName
                                  ? `${customer.firstName} ${customer.lastName}`
                                  : customer.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {customer.email}
                              </p>
                            </Link>
                          </div>
                        </div>
                        {/* <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge> */}
                      </div>
                    ))}
                  {topCustomersArray.length === 0 && (
                    <p
                      className="text-sm text-muted-foreground text-center py-4"
                      data-testid="no-customers-message"
                    >
                      No customers available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Customization Dialog */}
      <DashboardCustomizationDialog
        open={isCustomizationOpen}
        onOpenChange={setIsCustomizationOpen}
      />
    </Layout>
  );
}

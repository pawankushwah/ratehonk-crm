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
      backgroundColor: bgColor || "#FFFFFF", // default white if no color provided
    };
  
    const content = (
      // <Card
      //   className="relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-l-4 border-l-[#0BBCD6] overflow-hidden"
      //   onMouseEnter={() => setIsHovered(true)}
      //   onMouseLeave={() => setIsHovered(false)}
      // >
      //   {/* Decorative background pattern */}
      //   {/*from-[#0BBCD6]/10  */}
      //   <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br to-transparent rounded-full transform translate-x-16 -translate-y-16" />
      //   <CardContent className="p-4 relative z-10">
      //     <div className="flex items-center justify-between">
      //       <div>
      //         <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
      //           {title}
      //         </p>
      //         <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
      //           {typeof value === "number" ? value.toLocaleString() : value}
      //         </p>
      //         <div
      //           className={`flex items-center text-xs mt-1 font-medium ${
      //             isPositive
      //               ? "text-emerald-600 dark:text-emerald-400"
      //               : "text-red-500 dark:text-red-400"
      //           }`}
      //         >
      //           {isPositive ? (
      //             <TrendingUp className="h-3 w-3 mr-1" />
      //           ) : (
      //             <TrendingDown className="h-3 w-3 mr-1" />
      //           )}
      //           {trend}
      //         </div>
      //       </div>
      //       <div className="relative">
      //         <div className="absolute inset-0 bg-[#0BBCD6]/20 rounded-full blur-xl" />
      //         <Icon className="h-8 w-8 text-[#0BBCD6] relative z-10" />
      //       </div>
      //     </div>
  
      //     {/* Enhanced Hover Details */}
      //     {isHovered && (
      //       <div className="absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-2xl p-3 z-20 mt-2">
      //         <div className="text-xs space-y-2">
      //           <div className="flex justify-between items-center">
      //             <span className="text-gray-600 dark:text-gray-400 font-medium">
      //               Previous Month:
      //             </span>
      //             <span className="font-bold text-gray-900 dark:text-white">
      //               {previousMonth.toLocaleString()}
      //             </span>
      //           </div>
      //           <div className="flex justify-between items-center">
      //             <span className="text-gray-600 dark:text-gray-400 font-medium">
      //               Current Month:
      //             </span>
      //             <span className="font-bold text-gray-900 dark:text-white">
      //               {currentMonth.toLocaleString()}
      //             </span>
      //           </div>
      //           <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2">
      //             <span className="text-gray-600 dark:text-gray-400 font-medium">
      //               Change:
      //             </span>
      //             <span
      //               className={`font-bold text-sm ${
      //                 currentMonth >= previousMonth
      //                   ? "text-emerald-600 dark:text-emerald-400"
      //                   : "text-red-500 dark:text-red-400"
      //               }`}
      //             >
      //               {currentMonth >= previousMonth ? "+" : ""}
      //               {(
      //                 ((currentMonth - previousMonth) / (previousMonth || 1)) *
      //                 100
      //               ).toFixed(1)}
      //               %
      //             </span>
      //           </div>
      //         </div>
      //       </div>
      //     )}
      //   </CardContent>
      // </Card>
  
      <Card
        className="relative w-[210px] h-[112px] rounded-2xl  p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={cardStyle}
      >
        <CardContent className="p-0 relative z-10">
          <div>
            {/* Title */}
            <p className="text-md font-medium text-[#000000]">{title}</p>
  
            {/* Value + Trend */}
            <div className="flex items-center justify-between gap-2 mt-2">
              <p className="text-4xl font-bold text-gray-900">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              <div
                className={`flex items-center text-sm font-semibold ${isPositive ? "text-[#000000]" : "text-[#000000"
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
  
          {/* Hover Details (optional) */}
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
                    className={`font-bold text-sm ${currentMonth >= previousMonth
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
  
  export default function Tenantdashboard() {
    const [isOpen, setIsOpen] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const ref = useRef(null);
  
    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: { target: any }) => {
        if (ref.current && !ref.current.contains(event.target)) {
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
      null
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
      null
    );
    const [estimatesCustomTo, setEstimatesCustomTo] = useState<Date | null>(null);
  
    // Expenses filters
    const [expensesDateFilter, setExpensesDateFilter] = useState("this_month");
    const [expensesCustomFrom, setExpensesCustomFrom] = useState<Date | null>(
      null
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
      null
    );
    const [profitLossCustomTo, setProfitLossCustomTo] = useState<Date | null>(
      null
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
      customTo: Date | null
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
  
    // Fetch Revenue by Lead Type data with individual filter
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
  
    // Fetch Bookings by Vendor data with individual filter
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
  
    // Fetch Estimates Analytics data with individual filter
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
  
    // Fetch Profit & Loss data with individual filter
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
      {} as Record<string, { name: string; value: number; count: number }>
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
          <div className="relative z-10 p-3 sm:p-5 w-full">
            {/* Dashboard Header with Date Filters */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="w-full bg-white rounded-2xl shadow-sm relative z-10">
                  <div className="w-full">
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
            </div>
  
            {/* Top 4 Metric Cards with Hover Details */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6 mb-8">
              {/* ========== LEFT CONTENT ========== */}
              <div>
                {/* Metric Cards Section */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
                  data-testid="metric-cards-container"
                >
                  {/* Total Revenue */}
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
  
                  {/* Total Bookings */}
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
  
                  {/* Total Customers */}
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
  
                  {/* Total Leads */}
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
  
                {/* ========== TOP GRID ========== */}
                <div
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-fit mt-6 lg:mt-10"
                  data-testid="dashboard-main-content"
                >
                  {/* ===== Left Section - Revenue (7 cols) ===== */}
                  <div className="lg:col-span-7 bg-white shadow-md rounded-xl p-4 sm:p-6 h-fit">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div>
                        <h2 className="text-[#000000] font-medium text-base sm:text-lg">
                          Revenue
                        </h2>
                        <p className="text-xl sm:text-2xl font-semibold text-[#000000] mt-1">
                          USD 7.852.000
                        </p>
                        <p className="text-xs sm:text-sm text-green-500 mt-1">
                          ↑ 2.1% vs last week
                        </p>
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
  
                    <p className="text-xs sm:text-sm text-gray-400 mt-4">
                      Sales from 1–12 Dec, 2020
                    </p>
  
                    {/* ===== Bar Chart ===== */}
                    <div className="mt-4 flex items-end justify-between h-32 sm:h-40 overflow-x-auto">
                      {[
                        { day: "01", h1: 80, h2: 50 },
                        { day: "02", h1: 85, h2: 40 },
                        { day: "03", h1: 90, h2: 55 },
                        { day: "04", h1: 100, h2: 60 },
                        { day: "05", h1: 110, h2: 70 },
                        { day: "06", h1: 120, h2: 80 },
                        { day: "07", h1: 95, h2: 60 },
                        { day: "08", h1: 85, h2: 55 },
                        { day: "09", h1: 90, h2: 60 },
                        { day: "10", h1: 88, h2: 58 },
                      ].map((bar, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center space-y-1 mx-0.5 sm:mx-1"
                        >
                          <div className="flex items-end space-x-0.5 sm:space-x-1 h-32 sm:h-40">
                            <div
                              className="bg-[#0A64A0] w-2.5 sm:w-4"
                              style={{ height: `${bar.h1}px` }}
                            />
                            <div
                              className="bg-[#7695C5] w-2.5 sm:w-4"
                              style={{ height: `${bar.h2}px` }}
                            />
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-400">
                            {bar.day}
                          </span>
                        </div>
                      ))}
                    </div>
  
                    {/* ===== Legend ===== */}
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
                  </div>
  
                  {/* ===== Middle Section - Profit & Loss (5 cols) ===== */}
                  <div className="lg:col-span-5 bg-white shadow-md rounded-xl p-4 sm:p-6">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                      <h2 className="font-semibold text-[#000000] text-base sm:text-lg">
                        Profit &amp; Loss
                      </h2>
  
                      <DateFilter
                        dateFilter={profitLossDateFilter}
                        setDateFilter={setProfitLossDateFilter}
                        customDateFrom={profitLossCustomFrom}
                        setCustomDateFrom={setProfitLossCustomFrom}
                        customDateTo={profitLossCustomTo}
                        setCustomDateTo={setProfitLossCustomTo}
                      />
                    </div>
  
                    {/* Profit & Loss Bars */}
                    <div className="space-y-3 sm:space-y-4">
                      {[
                        {
                          month: "Jan",
                          color: "bg-[#0A64A0]",
                          width: "w-4/5",
                          value: "$10k",
                        },
                        {
                          month: "Feb",
                          color: "bg-[#0A64A0]",
                          width: "w-3/5",
                          value: "$6k",
                        },
                        {
                          month: "Mar",
                          color: "bg-[#FE4F02]",
                          width: "w-1/5",
                          value: "-$4k",
                        },
                        {
                          month: "Apr",
                          color: "bg-[#FE4F02]",
                          width: "w-10/12",
                          value: "-$12k",
                        },
                        {
                          month: "May",
                          color: "bg-[#0A64A0]",
                          width: "w-11/12",
                          value: "$14k",
                        },
                        {
                          month: "Jun",
                          color: "bg-[#0A64A0]",
                          width: "w-2/3",
                          value: "$7k",
                        },
                      ].map((bar, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs sm:text-sm"
                        >
                          <span className="text-gray-500 w-6 sm:w-8">
                            {bar.month}
                          </span>
                          <div className="flex-1 bg-gray-200 h-2.5 sm:h-3 rounded overflow-hidden mx-2">
                            <div
                              className={`${bar.color} h-2.5 sm:h-3 ${bar.width}`}
                            />
                          </div>
                          <span className="text-[#202939] w-10 sm:w-12 text-right">
                            {bar.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
  
                <div
                  className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 mt-6 sm:mt-10"
                  data-testid="dashboard-main-content"
                >
                  {/* Expense Card (6 cols) */}
                  <div className="col-span-12 md:col-span-6 bg-white shadow-md rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                      <div>
                        <h2 className="text-[#000000] font-medium text-base sm:text-lg">
                          Expense
                        </h2>
                        <p className="text-xl sm:text-2xl font-semibold text-[#000000] mt-1">
                          USD 7.852.000
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
                        <button className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50">
                          <Download size={16} className="text-[#202939]" />
                        </button>
                      </div>
                    </div>
  
                    {/* Donut Chart */}
                    <div className="flex justify-center items-center">
                      <div className="relative w-36 h-36 sm:w-52 sm:h-52">
                        <svg
                          className="w-full h-full transform -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          {/* Background circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#6DA9DB"
                            strokeWidth="16"
                          />
                          {/* Sales - 40% */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#0A64A0"
                            strokeWidth="16"
                            strokeDasharray="100.53 251.33"
                            strokeDashoffset="0"
                          />
                          {/* Marketing - 32% */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#3E85C5"
                            strokeWidth="16"
                            strokeDasharray="80.42 251.33"
                            strokeDashoffset="-100.53"
                          />
                          {/* Advertising - 28% */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#6DA9DB"
                            strokeWidth="16"
                            strokeDasharray="70.37 251.33"
                            strokeDashoffset="-180.95"
                          />
                        </svg>
                      </div>
                    </div>
  
                    {/* Legend */}
                    <div className="flex flex-col sm:flex-row sm:justify-around pt-6 text-xs sm:text-sm text-gray-600 gap-3 sm:gap-0 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="w-2.5 h-2.5 bg-[#0A64A0] rounded-full"></span>
                        Sales 40%
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <span className="w-2.5 h-2.5 bg-[#3E85C5] rounded-full"></span>
                        Marketing 32%
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <span className="w-2.5 h-2.5 bg-[#6DA9DB] rounded-full"></span>
                        Advertising 28%
                      </div>
                    </div>
                  </div>
  
                  {/* Service Booking Card (6 cols) */}
                  <div className="col-span-12 md:col-span-6 bg-white shadow-md rounded-2xl p-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <div>
                        <h2 className="text-[#000000] font-medium text-base sm:text-lg">
                          Service Booking
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          Lorem ipsum dolor sit amet, consectetur
                        </p>
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
  
                    {/* Responsive Bubble Chart Section */}
                    <div className="relative flex justify-center items-center h-64 sm:h-[22rem] w-full max-w-[300px] sm:max-w-[500px] mx-auto">
                      {/* Center Bubble */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <svg
                          className="w-28 h-28 sm:w-40 sm:h-40"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="#0A64A0"
                            stroke="#CFE4FB"
                            strokeWidth="4"
                          />
                        </svg>
                        <div className="absolute text-white text-center">
                          <p className="text-lg sm:text-2xl font-bold">85%</p>
                          <p className="text-xs sm:text-sm">Flight</p>
                        </div>
                      </div>
  
                      {/* Surrounding bubbles */}
                      <div
                        className="absolute flex flex-col items-center justify-center"
                        style={{ top: "10%", left: "8%" }}
                      >
                        <svg
                          className="w-20 h-20 sm:w-28 sm:h-28"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="50"
                            fill="#6DA9DB"
                            stroke="#CFE4FB"
                            strokeWidth="4"
                          />
                        </svg>
                        <div className="absolute text-white text-center">
                          <p className="text-base sm:text-xl font-bold">92%</p>
                          <p className="text-[10px] sm:text-sm">Instagram</p>
                        </div>
                      </div>
  
                      <div
                        className="absolute flex flex-col items-center justify-center"
                        style={{ top: "15%", right: "15%" }}
                      >
                        <svg
                          className="w-16 h-16 sm:w-24 sm:h-24"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="#3E85C5"
                            stroke="#CFE4FB"
                            strokeWidth="4"
                          />
                        </svg>
                        <div className="absolute text-white text-center">
                          <p className="text-sm sm:text-lg font-bold">85%</p>
                          <p className="text-[10px] sm:text-xs">Website</p>
                        </div>
                      </div>
  
                      <div
                        className="absolute flex flex-col items-center justify-center"
                        style={{ bottom: "15%", left: "20%" }}
                      >
                        <svg
                          className="w-14 h-14 sm:w-20 sm:h-20"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="#5487B6"
                            stroke="#CFE4FB"
                            strokeWidth="4"
                          />
                        </svg>
                        <div className="absolute text-white text-center">
                          <p className="text-xs sm:text-sm font-bold">85%</p>
                          <p className="text-[10px] sm:text-xs">Meta</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
  
                <div
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mt-6 sm:mt-10"
                  data-testid="dashboard-main-content"
                >
                  {/* Service Provider Card */}
                  <div className="col-span-12 lg:col-span-6 bg-white shadow-md rounded-2xl p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3 sm:gap-0">
                      <h2 className="text-[#000000] font-medium text-center sm:text-left text-base sm:text-lg">
                        Service Provider
                      </h2>
                      <DateFilter
                        dateFilter={profitLossDateFilter}
                        setDateFilter={setProfitLossDateFilter}
                        customDateFrom={profitLossCustomFrom}
                        setCustomDateFrom={setProfitLossCustomFrom}
                        customDateTo={profitLossCustomTo}
                        setCustomDateTo={setProfitLossCustomTo}
                      />
                    </div>
  
                    {/* Chart & Legend */}
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6 sm:gap-4">
                      {/* Donut Chart */}
                      <div className="relative w-36 h-36 sm:w-52 sm:h-52">
                        <svg
                          className="w-full h-full transform -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#6DA9DB"
                            strokeWidth="16"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#787EDA"
                            strokeWidth="16"
                            strokeDasharray="100.53 251.33"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#C1C5FF"
                            strokeWidth="16"
                            strokeDasharray="80.42 251.33"
                            strokeDashoffset="-100.53"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#E2E4FF"
                            strokeWidth="16"
                            strokeDasharray="70.37 251.33"
                            strokeDashoffset="-180.95"
                          />
                        </svg>
                      </div>
  
                      {/* Legend */}
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#787EDA]"></div>
                          <div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              Sales
                            </div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              40%
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#C1C5FF]"></div>
                          <div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              Marketing
                            </div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              32%
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#E2E4FF]"></div>
                          <div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              Advertising
                            </div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              28%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
  
                  {/* Consolidated Booking Card */}
                  <div className="col-span-12 lg:col-span-6 bg-white shadow-md rounded-xl p-4">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-3 sm:gap-0">
                        <h2 className="text-[#000000] font-medium text-center sm:text-left text-base sm:text-lg">
                          Consolidated Booking
                        </h2>
                        <DateFilter
                          dateFilter={profitLossDateFilter}
                          setDateFilter={setProfitLossDateFilter}
                          customDateFrom={profitLossCustomFrom}
                          setCustomDateFrom={setProfitLossCustomFrom}
                          customDateTo={profitLossCustomTo}
                          setCustomDateTo={setProfitLossCustomTo}
                        />
                      </div>
  
                      {/* Chart + Legend */}
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6 sm:gap-0">
                        {/* Chart Section */}
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
                                {outerData.map((entry, index) => (
                                  <Cell
                                    key={`outer-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
  
                          {/* Inner Circle */}
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
                                  {innerData.map((entry, index) => (
                                    <Cell
                                      key={`inner-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
  
                        {/* Legend */}
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
                    </div>
                  </div>
                </div>
              </div>
  
              {/* ========== RIGHT SIDEBAR ========== */}
              <div className="relative">
                {/* Toggle Button for small screens */}
                {!isOpen && (
                  <button
                    onClick={() => setIsOpen(true)}
                    className="lg:hidden fixed top-0 right-0 z-50 text-black py-5 px-1"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
  
                {/* Sidebar (existing code) */}
                <div
                  className={`fixed top-0 right-0 z-40 w-64 bg-white border-l border-gray-200 p-4 space-y-6 h-screen overflow-y-auto transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:block ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                >
                  {/* Close button (only visible on mobile) */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden absolute top-4 left-4 text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
  
                  {/* Follow Up Section */}
                  <div className="mt-10 lg:mt-0">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Follow up
                    </h3>
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <img
                            src="https://i.pravatar.cc/40"
                            alt="User"
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              Harsh Vani
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              HarshVani0@gmail.com
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  {/* Customers Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Customers
                    </h3>
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <img
                            src="https://i.pravatar.cc/41"
                            alt="User"
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              Harsh Vani
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              HarshVani0@gmail.com
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  {/* Activities Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Activities
                    </h3>
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <img
                            src="https://i.pravatar.cc/41"
                            alt="User"
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              Harsh Vani
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              HarshVani0@gmail.com
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  {/* Contacts Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Contacts
                    </h3>
                    <div className="space-y-2">
                      {[
                        "Natali Craig",
                        "Drew Cano",
                        "Andi Lane",
                        "Koray Okumus",
                      ].map((name, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <img
                            src={`https://i.pravatar.cc/4${i}`}
                            alt={name}
                            className="h-8 w-8 rounded-full"
                          />
                          <p className="text-xs font-medium text-gray-700">
                            {name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
  
                {/* Background overlay when sidebar is open (mobile only) */}
                {isOpen && (
                  <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm lg:hidden z-30"
                    onClick={() => setIsOpen(false)}
                  />
                )}
              </div>
            </div>
  
            {/* ========== BOTTOM GRID ========== */}
  
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6 mb-8">
              {/* ========== LEFT CONTENT ========== */}
              <div>
                <div
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-fit mt-6 lg:mt-10"
                  data-testid="dashboard-main-content"
                >
                  {/* ===== Left Section - Revenue (7 cols) ===== */}
                  <div className="lg:col-span-6 bg-white shadow-md rounded-xl p-4 sm:p-6 h-full">
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 h-full min-h-[320px] flex flex-col justify-between">
                      {/* Header */}
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                          <h2 className="text-[#000000] font-medium text-center sm:text-left text-base sm:text-lg">
                            Invoice
                          </h2>
                          <DateFilter
                            dateFilter={profitLossDateFilter}
                            setDateFilter={setProfitLossDateFilter}
                            customDateFrom={profitLossCustomFrom}
                            setCustomDateFrom={setProfitLossCustomFrom}
                            customDateTo={profitLossCustomTo}
                            setCustomDateTo={setProfitLossCustomTo}
                          />
                        </div>
  
                        <div className="mb-3">
                          <div className="text-lg sm:text-2xl font-semibold text-[#000000] mb-3 text-center sm:text-left">
                            1500 Total Invoices
                          </div>
  
                          {/* Bar Chart */}
                          <div className="flex h-8 sm:h-12 overflow-hidden text-white text-sm sm:text-base font-medium mt-12">
                            <div
                              className="bg-[#2374A9] flex items-center justify-center text-[#FFFFFF]"
                              style={{ width: "46.67%" }}
                            >
                              700
                            </div>
                            <div
                              className="bg-[#787EDA] flex items-center justify-center text-[#FFFFFF]"
                              style={{ width: "20%" }}
                            >
                              500
                            </div>
                            <div
                              className="bg-[#FE4F02] flex items-center justify-center text-[#FFFFFF]"
                              style={{ width: "33.33%" }}
                            >
                              300
                            </div>
                          </div>
                        </div>
                      </div>
  
                      {/* Legend */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-2 sm:gap-6 text-xs sm:text-sm mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-700"></div>
                          <span className="text-gray-600">Invoice Cleared</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-500"></div>
                          <span className="text-gray-600">Partial Payment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-500"></div>
                          <span className="text-gray-600">Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>
  
  
                  {/* ===== Middle Section - Profit & Loss (5 cols) ===== */}
                  <div className="lg:col-span-6 bg-white shadow-md rounded-xl p-4 sm:p-6">
                    {/* Header Row */}
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                        <h2 className="text-[#000000] font-medium text-center sm:text-left text-base sm:text-lg">
                          Consolidated Booking
                        </h2>
                        <DateFilter
                          dateFilter={profitLossDateFilter}
                          setDateFilter={setProfitLossDateFilter}
                          customDateFrom={profitLossCustomFrom}
                          setCustomDateFrom={setProfitLossCustomFrom}
                          customDateTo={profitLossCustomTo}
                          setCustomDateTo={setProfitLossCustomTo}
                        />
                      </div>
  
                      {/* Chart + Legend */}
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6">
                        {/* Chart */}
                        <div className="relative w-full h-64">
                          {/* Outer Arc */}
                          <div className="absolute inset-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={outerData}
                                  dataKey="value"
                                  cx="50%"
                                  cy="60%" // lowers center slightly for better half-circle look
                                  innerRadius={60}
                                  outerRadius={80}
                                  startAngle={200}
                                  endAngle={-20}
                                  stroke="none"
                                >
                                  {outerData.map((entry, index) => (
                                    <Cell key={`outer-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
  
                          {/* Middle Arc */}
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
                                    <Cell key={`middle-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
  
                          {/* Inner Arc */}
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
                                    <Cell key={`inner-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
  
                        {/* Legend */}
                        <div className="space-y-2 sm:space-y-3 text-xs text-center sm:text-left">
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#2F80ED]"></div>
                            <div>
                              <p className="font-medium text-gray-900">Sales</p>
                              <p className="text-gray-500 text-[10px] sm:text-[11px]">
                                40%
                              </p>
                            </div>
                          </div>
  
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#F2994A]"></div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Marketing
                              </p>
                              <p className="text-gray-500 text-[10px] sm:text-[11px]">
                                32%
                              </p>
                            </div>
                          </div>
  
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#E5E7EB]"></div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Advertising
                              </p>
                              <p className="text-gray-500 text-[10px] sm:text-[11px]">
                                28%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Marketing & SEO Card */}
  
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6 mb-8">
              {/* ========== LEFT CONTENT ========== */}
              <div>
                <div
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-fit mt-6 lg:mt-10"
                  data-testid="dashboard-main-content"
                >
                  {/* ===== Left Section - Revenue (7 cols) ===== */}
                  <div className="lg:col-span-12 bg-white shadow-md rounded-xl p-4 sm:p-6 h-fit">
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 md:p-6">
                      <h2 className="text-[#000000] font-medium mb-3 text-base sm:text-lg md:text-xl">
                        Marketing & SEO
                      </h2>
  
                      <div className="relative h-40 sm:h-48 md:h-56">
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] sm:text-xs text-gray-400">
                          <span>30K</span>
                          <span>20K</span>
                          <span>10K</span>
                          <span>0</span>
                        </div>
  
                        {/* Chart area */}
                        <div className="ml-6 sm:ml-10 h-full flex items-end">
                          <div className="flex items-end justify-between w-full h-full overflow-x-auto">
                            {[
                              { month: "Jan", height: 80 },
                              { month: "Feb", height: 120 },
                              { month: "Mar", height: 95 },
                              { month: "Apr", height: 125 },
                              { month: "May", height: 60 },
                              { month: "Jun", height: 110 },
                              { month: "Jul", height: 85 },
                              { month: "Aug", height: 120 },
                              { month: "Sep", height: 100 },
                              { month: "Oct", height: 130 },
                              { month: "Nov", height: 60 },
                              { month: "Dec", height: 105 },
                            ].map((item, index) => (
                              <div
                                key={index}
                                className="flex flex-col items-center flex-1 min-w-[20px]"
                              >
                                <div
                                  className="w-[14px] sm:w-[24px] md:w-[30px] bg-[#008080] rounded-md transition-all hover:bg-[#007070]"
                                  style={{ height: `${item.height}px` }}
                                ></div>
                                <span className="text-[9px] sm:text-[10px] text-gray-500 mt-1">
                                  {item.month}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
  
                  {/* ===== Middle Section - Profit & Loss (5 cols) ===== */}
                </div>
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
  
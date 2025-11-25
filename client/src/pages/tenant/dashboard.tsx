import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { DashboardCustomizationDialog } from "@/components/dashboard-customization-dialog";
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  BookOpen,
  UserCheck,
  Download,
  Settings,
  HelpCircle,
  Bell,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import type { DashboardData } from "@/lib/types";
import type { Estimate, Expense, EmailCampaign } from "@shared/schema";

import { DateFilter } from "@/components/ui/date-filter";
import { buildDateFilters } from "@/lib/date-filter-helpers";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ProfitLossCard } from "@/components/dashboard/ProfitLossCard";
import { ExpensePieChart } from "@/components/dashboard/ExpensePieChart";
import { ServiceBookingScatter } from "@/components/dashboard/ServiceBookingScatter";
import { InvoiceStatusBar } from "@/components/dashboard/InvoiceStatusBar";
import { MarketingSEOBar } from "@/components/dashboard/MarketingSEOBar";
import { SidebarLists } from "@/components/dashboard/SidebarList";
import { ConsolidatedVendorBookingChart } from "@/components/dashboard/ConsolidatedVendorBookingChart";
import { ServiceProviderChart } from "@/components/dashboard/ServiceProviderChart";


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

export default function TenantDashboard() {
  const [profitPage, setProfitPage] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
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
  
  const topLeadsArray = Array.isArray(topLeads) ? topLeads : [];
  const topBookingsArray = Array.isArray(topBookings) ? topBookings : [];
  const topCustomersArray = Array.isArray(topCustomers) ? topCustomers : [];
  const revenueByLeadTypeArray = Array.isArray(revenueByLeadTypeData)
    ? revenueByLeadTypeData
    : [];
    
  
  console.log("revenueByLeadTypeArray :",revenueByLeadTypeArray)
  const bookingsByVendorArray = Array.isArray(bookingsByVendorData)
    ? bookingsByVendorData
    : [];
  console.log("bookingsByVendorArray :",bookingsByVendorArray)
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
  
  
  const followUpsArray = topLeadsArray ?? [];
  const customersArray = topCustomersArray ?? [];
  const activitiesArray = topBookingsArray ?? [];
  const contactsArray = topCustomersArray ?? [];
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
                    ).toFixed(1)}`}
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
                      ).toFixed(1)}`}
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
                      ).toFixed(1)}`}
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
                      ).toFixed(1)}`}
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
                <RevenueChart />
                <ProfitLossCard />
              </div>
              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mt-6 sm:mt-10"
                data-testid="dashboard-main-content"
              >
                <ExpensePieChart />
                <ServiceBookingScatter />
              </div>
              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mt-6 sm:mt-10"
                data-testid="dashboard-main-content"
              >
               <ServiceProviderChart />
                <ConsolidatedVendorBookingChart />
              </div>

              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-fit mt-6 lg:mt-10"
                data-testid="dashboard-main-content"
              >
                <InvoiceStatusBar />
              </div>
              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-fit mt-6 lg:mt-10"
                data-testid="dashboard-main-content"
              >
                <MarketingSEOBar />
              </div>
            </div>
            <SidebarLists
              followUpsArray={followUpsArray}
              customersArray={customersArray}
              activitiesArray={activitiesArray}
              contactsArray={contactsArray}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
            />
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

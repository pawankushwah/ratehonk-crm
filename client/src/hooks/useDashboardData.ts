import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { buildDateFilters } from "@/lib/date-filter-helpers";
import type { DashboardData } from "@/lib/types";
import { Estimate, Expense, EmailCampaign } from "../../../shared/schema";
import { format } from "date-fns";

export interface DateFilterState {
  period: string;
  startDate?: Date;
  endDate?: Date;
}

export const useDashboardData = (dateFilter: DateFilterState) => {
  const { tenant } = useAuth();
  const queryParams =
    dateFilter.period !== "custom"
      ? { period: dateFilter.period }
      : {
          startDate: dateFilter.startDate
            ? dateFilter.startDate.toISOString().split("T")[0]
            : undefined,
          endDate: dateFilter.endDate
            ? dateFilter.endDate.toISOString().split("T")[0]
            : undefined,
        };

  return useQuery<DashboardData>({
    queryKey: ["/api/reports/dashboard", queryParams],
    enabled: !!tenant?.id,
    refetchInterval: 30000,
  });
};




export const useTopLeads = (dateFilter: DateFilterState) => {
  const { tenant } = useAuth();
  const queryParams = {
    limit: 10,
    sort: "score",
    ...getQueryParams(dateFilter),
  };

  return useQuery({
    queryKey: ["/api/leads", queryParams],
    enabled: !!tenant?.id,
  });
};

export const useTopBookings = (dateFilter: DateFilterState) => {
  const { tenant } = useAuth();

  const queryParams = {
    limit: 10,
    sort: "totalAmount",
    ...getQueryParams(dateFilter),
  };

  return useQuery({
    queryKey: ["top-bookings", tenant?.id, queryParams],
    enabled: !!tenant?.id,

  
    queryFn: async () => {
      const url = `/api/tenants/${tenant?.id}/bookings`; 
      console.log("🔍 API Request URL:", url);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });
      if (!res.ok) {
        console.error("❌ API Error:", await res.text());
        return [];
      }

      const json = await res.json();
      console.log("📊 Top Bookings Data:", json);

      return Array.isArray(json) ? json : json.data ?? [];
    },
  });
};


export const useTopCustomers = (dateFilter: DateFilterState) => {
  const { tenant } = useAuth();
  const queryParams = {
    limit: 10,
    sort: "totalSpent",
    ...getQueryParams(dateFilter),
  };

  return useQuery({
    queryKey: ["/api/customers", queryParams],
    enabled: !!tenant?.id,
  });
};

export const useLeadTypesData = (dateFilter: DateFilterState) => {
  const { tenant } = useAuth();

  const params = buildFilterParamsFromDateFilter(
    dateFilter.period,
    dateFilter.startDate ?? null,
    dateFilter.endDate ?? null
  );

  return useQuery({
    queryKey: ["/api/reports/lead-types", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any).toString();
      const url = `/api/reports/lead-types${searchParams ? `?${searchParams}` : ""}`;

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
};

export const useRevenueByLeadType = (dateFilter: DateFilterState) => {
  const { tenant } = useAuth();

  const params = buildFilterParamsFromDateFilter(
    dateFilter.period,
    dateFilter.startDate ?? null,
    dateFilter.endDate ?? null
  );

  return useQuery({
    queryKey: ["/api/reports/revenue-by-lead-type", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any).toString();
      const url = `/api/reports/revenue-by-lead-type${searchParams ? `?${searchParams}` : ""}`;

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
};

export const useBookingsByVendor = (dateFilter: DateFilterState) => {
  const { tenant } = useAuth();

  const params = buildFilterParamsFromDateFilter(
    dateFilter.period,
    dateFilter.startDate ?? null,
    dateFilter.endDate ?? null
  );

  return useQuery({
    queryKey: ["/api/reports/bookings-by-vendor", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any).toString();
      const url = `/api/reports/bookings-by-vendor${searchParams ? `?${searchParams}` : ""}`;

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
};

export const useEstimates = (
  dateFilter: string,
  customFrom: Date | null,
  customTo: Date | null
) => {
  const { tenant } = useAuth();
  const params = buildFilterParamsFromDateFilter(
    dateFilter,
    customFrom,
    customTo
  );

  return useQuery<Estimate[]>({
    queryKey: ["/api/estimates", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any).toString();
      const url = `/api/estimates${searchParams ? `?${searchParams}` : ""}`;
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
};

export const useExpenses = (
  dateFilter: string,
  customFrom: Date | null,
  customTo: Date | null
) => {
  const { tenant } = useAuth();
  const params = buildFilterParamsFromDateFilter(
    dateFilter,
    customFrom,
    customTo
  );

  return useQuery<Expense[]>({
    queryKey: ["/api/expenses", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any).toString();
      const url = `/api/expenses${searchParams ? `?${searchParams}` : ""}`;
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
};

export const useEmailCampaigns = (
  dateFilter: string,
  customFrom: Date | null,
  customTo: Date | null
) => {
  const { tenant } = useAuth();
  const params = buildFilterParamsFromDateFilter(
    dateFilter,
    customFrom,
    customTo
  );

  return useQuery<EmailCampaign[]>({
    queryKey: ["/api/email-campaigns", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any).toString();
      const url = `/api/email-campaigns${searchParams ? `?${searchParams}` : ""}`;
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
};

export const useProfitLossData = (
  dateFilter: string,
  customFrom: Date | null,
  customTo: Date | null
) => {
  const { tenant } = useAuth();

  const params = buildFilterParamsFromDateFilter(
    dateFilter,
    customFrom,
    customTo
  );

  return useQuery<
    Array<{ month: string; expenses: number; revenue: number; profit: number }>
  >({
    queryKey: ["profitLoss", tenant?.id, params],

    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any).toString();

       const url = `/api/dashboard/profit-loss${searchParams ? `?${searchParams}` : ""}`;

      console.log("📌 Profit/Loss API URL:", url);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch profit/loss data");

      const data = await res.json();

      console.log("📊 Profit/Loss API Response:", data);

      return Array.isArray(data) ? data : data.result ?? [];
    },

    enabled: !!tenant?.id,
    staleTime: 25000,
    refetchInterval: 30000,
  });
};



export const useInvoicesForGraph = (
  tenantId: number | undefined,
  dateFilter: string,
  customFrom: Date | null,
  customTo: Date | null
) => {
  const params = buildFilterParamsFromDateFilter(dateFilter, customFrom, customTo);

  return useQuery({
    queryKey: ["invoice-graph-data", tenantId, dateFilter, customFrom, customTo],

    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any).toString();
      const url = `/api/tenants/${tenantId}/invoices${searchParams ? `?${searchParams}` : ""}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        credentials: "include",
      });

      if (!res.ok) return [];

      const json = await res.json();
      const invoices = Array.isArray(json) ? json : json.invoices;
      console.log("🚀 ~ useInvoicesForGraph ~ invoices:", invoices)

      return invoices; 
    },

    enabled: !!tenantId,
    refetchInterval: 30000,
  });
};



export const useChartData = (
  dateFilter: string,
  customFrom: Date | null,
  customTo: Date | null
) => {
  const { tenant } = useAuth();
  const params = buildFilterParamsFromDateFilter(
    dateFilter,
    customFrom,
    customTo
  );

  return useQuery({
    queryKey: ["/api/dashboard/chart-data", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params as any).toString();
      const url = `/api/dashboard/chart-data${searchParams ? `?${searchParams}` : ""}`;
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
};

const getQueryParams = (dateFilter: DateFilterState) => {
  if (dateFilter.period !== "custom") {
    return { period: dateFilter.period };
  }
  return {
    startDate: dateFilter.startDate
      ? format(dateFilter.startDate, "yyyy-MM-dd")
      : undefined,
    endDate: dateFilter.endDate
      ? format(dateFilter.endDate, "yyyy-MM-dd")
      : undefined,
  };
};

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

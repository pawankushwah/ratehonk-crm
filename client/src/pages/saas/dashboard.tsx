import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Users, DollarSign, CreditCard, Calendar, Loader2, AlertCircle, Activity } from "lucide-react";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
import { saasApiRequest } from "@/lib/saas-queryClient";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { DateFilter } from "@/components/ui/date-filter";
import { buildDateFilters } from "@/lib/date-filter-helpers";

export default function SaasDashboard() {
  const { user } = useSaasAuth();
  const [dateFilter, setDateFilter] = useState("this_month");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const getQueryParams = () => {
    const params: any = {};
    if (dateFilter !== "custom") {
      params.period = dateFilter;
    } else if (customDateFrom && customDateTo) {
      params.startDate = format(customDateFrom, "yyyy-MM-dd");
      params.endDate = format(customDateTo, "yyyy-MM-dd");
    }
    return params;
  };

  const queryParams = getQueryParams();

  // Fetch dashboard analytics
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/saas/dashboard", queryParams],
    queryFn: async () => {
      const params = new URLSearchParams(queryParams as any).toString();
      const url = `/api/saas/dashboard${params ? `?${params}` : ""}`;
      const response = await saasApiRequest("GET", url, {});
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Check if user is SaaS owner
  if (user?.role !== "saas_owner") {
    return (
      <SaasLayout>
        <div className="p-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">This page is only accessible to SaaS owners.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SaasLayout>
    );
  }

  const metrics = dashboardData?.metrics || {
    totalTenants: 0,
    activeTenants: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
    activeTrials: 0,
    activeSubscriptions: 0,
    growthRate: 0,
  };

  const charts = dashboardData?.charts || {
    tenantGrowth: [],
    revenueTrend: [],
    statusBreakdown: [],
    planDistribution: [],
  };

  const formatNumberShort = (num: number) => {
    if (num === null || num === undefined) return "0";
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <SaasLayout>
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">SaaS Dashboard</h1>
              <p className="text-muted-foreground mt-2">Analytics and insights for your SaaS platform</p>
            </div>
            <DateFilter
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              customDateFrom={customDateFrom}
              setCustomDateFrom={setCustomDateFrom}
              customDateTo={customDateTo}
              setCustomDateTo={setCustomDateTo}
            />
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalTenants}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeTenants} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue (MRR)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${formatNumberShort(metrics.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                ${formatNumberShort(metrics.annualRevenue)} ARR
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeTrials} in trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.growthRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Month over month
              </p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Charts Row 1 */}
            <div className="grid gap-6 lg:grid-cols-2 mb-6">
              {/* Tenant Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Growth</CardTitle>
                  <CardDescription>New tenants over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {charts.tenantGrowth && charts.tenantGrowth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={charts.tenantGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tenants" fill="#0088FE" name="New Tenants" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Recurring Revenue Trend</CardTitle>
                  <CardDescription>MRR growth over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {charts.revenueTrend && charts.revenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={charts.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="mrr" stroke="#00C49F" name="MRR" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-6 lg:grid-cols-2 mb-6">
              {/* Subscription Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Status</CardTitle>
                  <CardDescription>Breakdown by subscription status</CardDescription>
                </CardHeader>
                <CardContent>
                  {charts.statusBreakdown && charts.statusBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={charts.statusBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ status, count }) => `${status}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {charts.statusBreakdown.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Plan Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Plan Distribution</CardTitle>
                  <CardDescription>Subscriptions by plan</CardDescription>
                </CardHeader>
                <CardContent>
                  {charts.planDistribution && charts.planDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={charts.planDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="planName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="subscriptions" fill="#FF8042" name="Subscriptions" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Tenants */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tenants</CardTitle>
                <CardDescription>Latest companies that joined your platform</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.recentTenants && dashboardData.recentTenants.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentTenants.map((tenant: any) => (
                      <div key={tenant.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tenant.companyName}</p>
                          <p className="text-sm text-muted-foreground">{tenant.contactEmail}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={tenant.isActive ? "default" : "secondary"}>
                            {tenant.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {tenant.createdAt ? format(new Date(tenant.createdAt), "MMM dd, yyyy") : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No tenants yet</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SaasLayout>
  );
}

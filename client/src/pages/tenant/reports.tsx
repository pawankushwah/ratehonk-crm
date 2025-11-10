import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart
} from "recharts";
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Calendar, 
  FileText, Download, Filter, BarChart3, PieChart as PieChartIcon,
  Activity, Target, Star, Clock
} from "lucide-react";

// Colors for charts
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function Reports() {
  const { tenant } = useAuth();
  const [dateRange, setDateRange] = useState("6months");
  const [reportType, setReportType] = useState("overview");

  const { data: reportData, isLoading } = useQuery({
    queryKey: [`/api/reports/dashboard`, dateRange, reportType],
    enabled: !!tenant?.id
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: [`/api/reports/revenue-by-lead-type`, dateRange],
    enabled: !!tenant?.id && reportType === "revenue"
  });

  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: [`/api/reports/customers`],
    enabled: !!tenant?.id && reportType === "customers"
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: [`/api/reports/leads`],
    enabled: !!tenant?.id && reportType === "packages"
  });

  // Use real API data
  const performanceMetrics = reportData?.performanceMetrics || {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalBookings: 0,
    bookingsGrowth: 0,
    avgBookingValue: 0,
    avgValueGrowth: 0,
    totalCustomers: 0,
    newCustomers: 0,
    totalLeads: 0,
    newLeads: 0,
    conversionRate: 0,
    totalEstimates: 0,
    estimateValue: 0,
    avgEstimateValue: 0
  };

  const chartRevenueData = reportData?.monthlyRevenue || [];
  const chartPackageData = reportData?.topPackages || [];
  const chartLeadSourceData = reportData?.leadSources || [];

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  if (isLoading || revenueLoading || customerLoading || leadsLoading) {
    return (
      <Layout>
        <div className="p-4 sm:p-8 w-full">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading comprehensive reports...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your business performance and insights</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="revenue">Revenue Analysis</SelectItem>
                <SelectItem value="customers">Customer Insights</SelectItem>
                <SelectItem value="packages">Package Performance</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    ${performanceMetrics.totalRevenue.toLocaleString()}
                  </p>
                  <div className={`flex items-center gap-1 text-sm ${getGrowthColor(performanceMetrics.revenueGrowth)}`}>
                    {getGrowthIcon(performanceMetrics.revenueGrowth)}
                    <span>{Math.abs(performanceMetrics.revenueGrowth)}%</span>
                  </div>
                </div>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {performanceMetrics.totalBookings}
                  </p>
                  <div className={`flex items-center gap-1 text-sm ${getGrowthColor(performanceMetrics.bookingsGrowth)}`}>
                    {getGrowthIcon(performanceMetrics.bookingsGrowth)}
                    <span>{Math.abs(performanceMetrics.bookingsGrowth)}%</span>
                  </div>
                </div>
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Booking Value</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    ${performanceMetrics.avgBookingValue}
                  </p>
                  <div className={`flex items-center gap-1 text-sm ${getGrowthColor(performanceMetrics.avgValueGrowth)}`}>
                    {getGrowthIcon(performanceMetrics.avgValueGrowth)}
                    <span>{Math.abs(performanceMetrics.avgValueGrowth)}%</span>
                  </div>
                </div>
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {performanceMetrics.totalCustomers}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>+{performanceMetrics.newCustomers} this month</span>
                  </div>
                </div>
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <CardTitle>Revenue Trend</CardTitle>
              </div>
              <CardDescription>Monthly revenue and booking performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${value.toLocaleString()}` : value,
                        name === 'revenue' ? 'Revenue' : name === 'bookings' ? 'Bookings' : 'Customers'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#0088FE" 
                      fill="#0088FE" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Package Performance Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-green-600" />
                <CardTitle>Package Performance</CardTitle>
              </div>
              <CardDescription>Revenue distribution by travel packages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartPackageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="revenue"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartPackageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Sources and Conversion Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources & Conversion Rates</CardTitle>
            <CardDescription>Performance analysis by lead source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartLeadSourceData.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{source.source}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {source.leads} leads → {source.conversions} conversions
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{source.rate}%</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">conversion</p>
                    </div>
                    <Badge variant={source.rate >= 40 ? "default" : source.rate >= 30 ? "secondary" : "outline"}>
                      {source.rate >= 40 ? "Excellent" : source.rate >= 30 ? "Good" : "Needs Improvement"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceMetrics.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                +{performanceMetrics.newLeads} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Estimates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceMetrics.totalEstimates}</div>
              <p className="text-xs text-muted-foreground">
                ${(performanceMetrics.estimateValue / 1000000).toFixed(1)}M in pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceMetrics.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Leads to customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Estimate Value</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(performanceMetrics.avgEstimateValue / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">
                Per estimate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Business Activity</CardTitle>
            <CardDescription>Latest updates from your travel business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData?.recentActivity?.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'booking' ? 'bg-green-500' :
                      activity.type === 'lead' ? 'bg-blue-500' :
                      activity.type === 'estimate' ? 'bg-purple-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {activity.amount > 0 ? `$${activity.amount.toLocaleString()}` : ''}
                    </p>
                    <Badge variant={activity.status === 'confirmed' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              )) || (
                <p className="text-center text-gray-500 py-8">
                  No recent activity to display
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Travel Package Performance */}
        {chartPackageData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Travel Packages</CardTitle>
              <CardDescription>Revenue performance by travel packages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartPackageData.length > 0 ? (
                  chartPackageData.slice(0, 5).map((pkg: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{pkg.name}</h4>
                          <p className="text-sm text-gray-600">{pkg.destination}</p>
                          <p className="text-xs text-gray-500">
                            {pkg.bookings} bookings • ${pkg.price?.toLocaleString()} per package
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          ${pkg.revenue?.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">Total Revenue</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No package data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights and Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Business Insights</CardTitle>
            <CardDescription>Data-driven recommendations for your travel business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performanceMetrics.totalRevenue > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    💰 Revenue Performance
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    You've generated ${performanceMetrics.totalRevenue.toLocaleString()} from {performanceMetrics.totalBookings} bookings. 
                    Average booking value is ${performanceMetrics.avgBookingValue.toLocaleString()}.
                  </p>
                </div>
              )}
              
              {performanceMetrics.totalLeads > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    📊 Lead Pipeline
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    You have {performanceMetrics.totalLeads} active leads with a {performanceMetrics.conversionRate.toFixed(1)}% conversion rate. 
                    Focus on qualifying and nurturing your pipeline.
                  </p>
                </div>
              )}
              
              {performanceMetrics.totalEstimates > 0 && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                    📋 Estimates Pipeline
                  </h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    You have ${(performanceMetrics.estimateValue / 1000000).toFixed(1)}M in estimates across {performanceMetrics.totalEstimates} quotes. 
                    Average estimate value: ${(performanceMetrics.avgEstimateValue / 1000).toFixed(0)}K.
                  </p>
                </div>
              )}
              
              {performanceMetrics.totalCustomers > 0 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                    👥 Customer Growth
                  </h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    You have {performanceMetrics.totalCustomers} customers with {performanceMetrics.newCustomers} new customers this month. 
                    Focus on retention and referral programs.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
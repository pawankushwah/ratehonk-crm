import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  LabelList,
  Area,
} from "recharts";
import {
  TrendingUp,
  Users,
  Target,
  Zap,
  Calculator,
  Star,
  Award,
  Flame,
  ThermometerSun,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAllLeads, useAllLeadsForGraph } from "@/hooks/useDashboardData";
import { useAuth } from "../auth/auth-provider";
import { DateFilter } from "../ui/date-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = [
  "#0A64A0",
  "#6DA9DB",
  "#3E85C5",
  "#3FA7D6",
  "#C49976",
  "#244553",
  "#DCB596",
];
const colorPalette = [
  "#2F80ED",
  "#FE4F02",
  "#FCAE75",
  "#CE7E5A",
  "#CF4B00",
  "#DDBA7D",
  "#CF4B00",
  "#E2852E",
  "#F5C857",
  "#E2852E",
];

interface LeadsAnalyticsProps {
  // leads: any[];
  onStatusChange?: (leadId: number, newStatus: string) => Promise<void>;
}

export default function LeadsAnalytics({}: LeadsAnalyticsProps) {
  const { tenant } = useAuth();
  const [activeIndex, setActiveIndex] = useState(null);

  const [dateFilter, setDateFilter] = useState("this_year");

  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  const onEnter = (_, index) => setActiveIndex(index);
  const onLeave = () => setActiveIndex(null);

  // Ensure leads is always an array

  const { data: leads } = useAllLeadsForGraph(
    tenant?.id,
    dateFilter,
    customDateFrom,
    customDateTo
  );
  const validLeads = Array.isArray(leads) ? leads : [];

  // Calculate lead status distribution
  const statusDistribution = useMemo(() => {
    const statusCounts = validLeads.reduce((acc: any, lead: any) => {
      const status = lead.status || 'new';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count], index) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: COLORS[index % COLORS.length]
    }));
  }, [validLeads]);

  // Calculate priority distribution  
  const priorityDistribution = useMemo(() => {
    const priorityCounts = validLeads.reduce((acc: any, lead: any) => {
      const priority = lead.priority || 'low';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(priorityCounts).map(([priority, count], index) => ({
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      count,
      color: colorPalette[index % colorPalette.length],
    }));
  }, [validLeads]);

  // CustomTooltip priority distribution
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const { priority, count } = payload[0].payload;
      return (
        <div className="bg-white shadow-md rounded-md p-2 text-xs border">
          <p className="font-semibold">{priority}</p>
          <p className="text-gray-500">Count: {count}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate source performance
  const sourcePerformance = useMemo(() => {
    const sourceData = validLeads.reduce((acc: any, lead: any) => {
      const source = lead.source || 'unknown';
      if (!acc[source]) {
        acc[source] = { count: 0, converted: 0 };
      }
      acc[source].count++;
      if (lead.status === 'converted' || lead.status === 'customer') {
        acc[source].converted++;
      }
      return acc;
    }, {});

    return Object.entries(sourceData).map(([source, data]: [string, any]) => ({
      source: source.charAt(0).toUpperCase() + source.slice(1),
      count: data.count,
      converted: data.converted,
      conversionRate: data.count > 0 ? Math.round((data.converted / data.count) * 100) : 0
    }));
  }, [validLeads]);

  // Calculate lead generation trends (by month)
  const leadTrends = useMemo(() => {
    const monthlyData = validLeads.reduce((acc: any, lead: any) => {
      const date = new Date(lead.createdAt || lead.created_at || Date.now());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, newLeads: 0, qualified: 0, converted: 0 };
      }
      
      acc[monthKey].newLeads++;
      if (lead.status === 'qualified' || lead.status === 'proposal' || lead.status === 'negotiation') {
        acc[monthKey].qualified++;
      }
      if (lead.status === 'converted' || lead.status === 'customer') {
        acc[monthKey].converted++;
      }
      
      return acc;
    }, {});

    return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }, [validLeads]);

  // Calculate key metrics
  const totalLeads = validLeads.length;
  const highPriorityLeads = validLeads.filter(
    (lead) => lead.priority === "high" || lead.priority === "urgent"
  ).length;
  const convertedLeads = validLeads.filter(
    (lead) => lead.status === "closed_won" || lead.status === "customer"
  ).length;
  const conversionRate =
    totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
  const avgScore =
    totalLeads > 0
      ? Math.round(
          validLeads.reduce((sum, lead) => sum + (lead.score || 0), 0) /
            totalLeads
        )
      : 0;

  // Top performing leads by score
  const topLeads = useMemo(() => {
    return [...validLeads]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
      .map((lead) => ({
        ...lead,
        priorityLabel:
          (lead.score || 0) >= 80
            ? "Hot"
            : (lead.score || 0) >= 60
              ? "High"
              : (lead.score || 0) >= 40
                ? "Medium"
                : "Low",
      }));
  }, [validLeads]);

  function getPriorityIcon(score: number) {
    if (score >= 80) return <Flame className="h-4 w-4 text-red-500" />;
    if (score >= 60)
      return <ThermometerSun className="h-4 w-4 text-orange-500" />;
    if (score >= 40) return <Star className="h-4 w-4 text-yellow-500" />;
    return <Target className="h-4 w-4 text-gray-500" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end space-x-4">
        <DateFilter
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          customDateFrom={customDateFrom}
          setCustomDateFrom={setCustomDateFrom}
          customDateTo={customDateTo}
          setCustomDateTo={setCustomDateTo}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#E6F1FD]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 ">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">All time leads</p>
          </CardContent>
        </Card>

        <Card className="bg-[#EDEEFC]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityLeads}</div>
            <p className="text-xs text-muted-foreground">
              High/Urgent priority
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#E6F1FD]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Leads to customers</p>
          </CardContent>
        </Card>

        <Card className="bg-[#EDEEFC]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}</div>
            <p className="text-xs text-muted-foreground">Out of 100 points</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Lead Status Distribution
            </CardTitle>
          </CardHeader>

          <CardContent className="flex items-center gap-4">
            <div className="flex flex-col gap-3 text-sm">
              {statusDistribution.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: item.color }}
                  ></span>
                  <span>{item.status}</span>
                </div>
              ))}
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={290}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="60%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={85}
                    strokeWidth={8}
                    paddingAngle={2}
                    dataKey="count"
                    onMouseEnter={onEnter}
                    onMouseLeave={onLeave}
                  >
                    {statusDistribution.map((entry, index) => {
                      const isActive = activeIndex === index;

                      return (
                        <Cell
                          key={index}
                          fill={entry.color}
                          stroke={entry.color}
                          style={{
                            filter: isActive
                              ? "brightness(1.15) drop-shadow(0px 0px 4px rgba(0,0,0,0.15))"
                              : "brightness(1)",
                            transition: "all 0.25s ease",
                          }}
                        />
                      );
                    })}
                  </Pie>

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const { status, count } = payload[0].payload;

                      return (
                        <div className="bg-white shadow-lg rounded-md p-2 text-sm border">
                          <div className="font-medium">{status}</div>
                          <div className="text-gray-500">Count: {count}</div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Priority Distribution
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-5 text-xs">
                {priorityDistribution.map((item, idx) => (
                  <div className="flex items-center gap-2" key={idx}>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>

                    <div>
                      <p className="font-medium">{item.priority}</p>
                      <p className="text-gray-500 text-[11px]">
                        {item.count} leads
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative w-full h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={priorityDistribution}
                      dataKey="count"
                      nameKey="priority"
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={60}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                      onMouseEnter={(_, idx) => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell
                          key={`inner-${index}`}
                          fill={entry.color}
                          style={{
                            transition: "0.3s",
                            transform:
                              activeIndex === index
                                ? "scale(1.08)"
                                : "scale(1)",
                            filter:
                              activeIndex === index
                                ? "drop-shadow(0px 0px 6px rgba(0,0,0,0.3))"
                                : "none",
                            transformOrigin: "center",
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </Pie>

                    <Pie
                      data={priorityDistribution}
                      dataKey="count"
                      nameKey="priority"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={1}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                      onMouseEnter={(_, idx) => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell
                          key={`outer-${index}`}
                          fill={entry.color}
                          style={{
                            transition: "0.3s",
                            transform:
                              activeIndex === index
                                ? "scale(1.08)"
                                : "scale(1)",
                            filter:
                              activeIndex === index
                                ? "drop-shadow(0px 0px 6px rgba(0,0,0,0.3))"
                                : "none",
                            transformOrigin: "center",
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Lead Source Performance
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sourcePerformance}
                  layout="vertical"
                  barCategoryGap={20}
                >
                  <YAxis
                    type="category"
                    dataKey="source"
                    axisLine={false}
                    tickLine={false}
                    width={90}
                    tick={{ fontSize: 13, fill: "#333" }}
                  />

                  <XAxis type="number" hide />

                  <Tooltip cursor={true} />

                  <Bar dataKey="count" fill="#0369A1" barSize={16}>
                    <LabelList
                      dataKey="count"
                      position="right"
                      offset={10}
                      style={{ fill: "#000", fontSize: 12, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead Generation Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Lead Generation Trend
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={leadTrends}
                margin={{ left: 30, right: 20, top: 10 }}
              >
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#666", fontSize: 12 }}
                />

                <YAxis
                  axisLine={{ stroke: "#999", strokeWidth: 1 }}
                  tickLine={false}
                  tick={{ fill: "#666", fontSize: 12 }}
                  domain={[0, "auto"]}
                />

                <Tooltip cursor={false} />

                <defs>
                  <linearGradient
                    id="blackSmokeGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#000000" stopOpacity={0.9} />
                    <stop offset="50%" stopColor="#333333" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#666666" stopOpacity={0.4} />
                  </linearGradient>

                  <linearGradient
                    id="blueSmokeGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                    <stop offset="50%" stopColor="#60A5FA" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.4} />
                  </linearGradient>

                  <linearGradient
                    id="areaSmokeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#000000" stopOpacity={0.9} />
                    <stop offset="50%" stopColor="#333333" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#666666" stopOpacity={0.4} />
                  </linearGradient>
                </defs>

                <Area
                  type="monotone"
                  dataKey="newLeads"
                  stroke="none"
                  fill="url(#areaSmokeGradient)"
                  fillOpacity={1}
                  animationDuration={900}
                />

                <Line
                  type="monotone"
                  dataKey="newLeads"
                  stroke="url(#blackSmokeGradient)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  dot={false}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: "#fff",
                    fill: "#000",
                  }}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />

                <Line
                  type="monotone"
                  dataKey="qualified"
                  stroke="url(#blueSmokeGradient)"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  strokeLinecap="round"
                  dot={false}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: "#fff",
                    fill: "#3B82F6",
                  }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: "#666", fontSize: "12px" }}>
                      {value}
                    </span>
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Source Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourcePerformance.map((source, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{source.source}</span>
                  <span className="text-muted-foreground">
                    {source.conversionRate}%
                  </span>
                </div>
                <Progress value={source.conversionRate} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{source.converted} converted</span>
                  <span>{source.count} total</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Leads</CardTitle>
            <p className="text-sm text-muted-foreground">
              Highest scoring leads requiring attention
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topLeads.map((lead, index) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      {getPriorityIcon(lead.score || 0)}
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {lead.firstName || lead.name} {lead.lastName || ""}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {lead.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Source: {lead.source || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{lead.score || 0}</div>
                    <Badge
                      variant={
                        lead.priorityLabel === "Hot"
                          ? "destructive"
                          : lead.priorityLabel === "High"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {lead.priorityLabel}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {lead.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

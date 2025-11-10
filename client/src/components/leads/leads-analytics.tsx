import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, Target, Zap, Calculator, Star, Award, Flame, ThermometerSun } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

interface LeadsAnalyticsProps {
  leads: any[];
  onStatusChange?: (leadId: number, newStatus: string) => Promise<void>;
}

export default function LeadsAnalytics({ leads = [] }: LeadsAnalyticsProps) {
  // Ensure leads is always an array
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
      color: priority === 'urgent' ? '#ef4444' : priority === 'high' ? '#f97316' : priority === 'medium' ? '#eab308' : '#6b7280'
    }));
  }, [validLeads]);

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
  const highPriorityLeads = validLeads.filter(lead => lead.priority === 'high' || lead.priority === 'urgent').length;
  const convertedLeads = validLeads.filter(lead => lead.status === 'converted' || lead.status === 'customer').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
  const avgScore = totalLeads > 0 ? Math.round(validLeads.reduce((sum, lead) => sum + (lead.score || 0), 0) / totalLeads) : 0;

  // Top performing leads by score
  const topLeads = useMemo(() => {
    return [...validLeads]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
      .map(lead => ({
        ...lead,
        priorityLabel: (lead.score || 0) >= 80 ? 'Hot' : (lead.score || 0) >= 60 ? 'High' : (lead.score || 0) >= 40 ? 'Medium' : 'Low'
      }));
  }, [validLeads]);

  function getPriorityIcon(score: number) {
    if (score >= 80) return <Flame className="h-4 w-4 text-red-500" />;
    if (score >= 60) return <ThermometerSun className="h-4 w-4 text-orange-500" />;
    if (score >= 40) return <Star className="h-4 w-4 text-yellow-500" />;
    return <Target className="h-4 w-4 text-gray-500" />;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              All time leads
            </p>
          </CardContent>
        </Card>
        
        <Card>
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
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Leads to customers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}</div>
            <p className="text-xs text-muted-foreground">
              Out of 100 points
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ priority, count }) => `${priority}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourcePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Total Leads" />
                <Bar dataKey="converted" fill="#82ca9d" name="Converted" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Generation Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Generation Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={leadTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="newLeads" stroke="#8884d8" name="New Leads" />
                <Line type="monotone" dataKey="qualified" stroke="#82ca9d" name="Qualified" />
                <Line type="monotone" dataKey="converted" stroke="#ffc658" name="Converted" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Source Performance Summary & Top Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Source Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourcePerformance.map((source, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{source.source}</span>
                  <span className="text-muted-foreground">{source.conversionRate}%</span>
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

        {/* Top Performing Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Leads</CardTitle>
            <p className="text-sm text-muted-foreground">Highest scoring leads requiring attention</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topLeads.map((lead, index) => (
                <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      {getPriorityIcon(lead.score || 0)}
                    </div>
                    <div>
                      <h4 className="font-medium">{lead.firstName || lead.name} {lead.lastName || ''}</h4>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                      <p className="text-xs text-muted-foreground">Source: {lead.source || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{lead.score || 0}</div>
                    <Badge variant={
                      lead.priorityLabel === 'Hot' ? 'destructive' : 
                      lead.priorityLabel === 'High' ? 'default' : 
                      'secondary'
                    }>
                      {lead.priorityLabel}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{lead.status}</p>
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
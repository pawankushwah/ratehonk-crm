import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from "recharts";
import { TrendingUp, Users, Target, Zap, Calculator, Filter, Download, RefreshCw, Star, Award, Flame, ThermometerSun } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function LeadAnalytics() {
  const { tenant } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/leads`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/lead-analytics`, timeRange],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/lead-analytics?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  // Ensure leads is always an array
  const validLeads = Array.isArray(leads) ? leads : [];

  // Calculate lead scoring distribution
  const scoreDistribution = validLeads.reduce((acc: any[], lead: any) => {
    const scoreRange = getScoreRange(lead.score || 0);
    const existing = acc.find(item => item.range === scoreRange);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ range: scoreRange, count: 1, color: getScoreColor(lead.score || 0) });
    }
    return acc;
  }, []);

  // Calculate source performance
  const sourcePerformance = validLeads.reduce((acc: any[], lead: any) => {
    const source = lead.source || 'Unknown';
    const existing = acc.find(item => item.source === source);
    if (existing) {
      existing.count++;
      existing.totalScore += lead.score || 0;
      existing.conversions += lead.status === 'converted' ? 1 : 0;
    } else {
      acc.push({
        source,
        count: 1,
        totalScore: lead.score || 0,
        conversions: lead.status === 'converted' ? 1 : 0,
        avgScore: lead.score || 0,
        conversionRate: lead.status === 'converted' ? 100 : 0
      });
    }
    return acc;
  }, []).map(item => ({
    ...item,
    avgScore: Math.round(item.totalScore / item.count),
    conversionRate: Math.round((item.conversions / item.count) * 100)
  }));

  // Lead progression over time
  const leadProgression = analytics?.progression || [];

  // Top performing leads
  const topLeads = [...validLeads]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10)
    .map(lead => ({
      ...lead,
      priority: getPriorityLabel(lead.score || 0)
    }));

  function getScoreRange(score: number): string {
    if (score >= 80) return '80-100 (Hot)';
    if (score >= 60) return '60-79 (High)';
    if (score >= 40) return '40-59 (Medium)';
    return '0-39 (Low)';
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return '#ef4444'; // red
    if (score >= 60) return '#f97316'; // orange
    if (score >= 40) return '#eab308'; // yellow
    return '#6b7280'; // gray
  }

  function getPriorityLabel(score: number): string {
    if (score >= 80) return 'Hot';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }

  function getPriorityIcon(priority: string) {
    switch (priority) {
      case 'Hot': return <Flame className="h-4 w-4 text-red-500" />;
      case 'High': return <ThermometerSun className="h-4 w-4 text-orange-500" />;
      case 'Medium': return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <Target className="h-4 w-4 text-gray-500" />;
    }
  }

  if (isLoading || analyticsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Lead Analytics</h1>
            <p className="text-gray-600">Advanced insights into your lead performance and scoring</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{validLeads.length}</div>
              <p className="text-xs text-muted-foreground">
                +{analytics?.newLeads || 0} this period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Lead Score</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(validLeads.reduce((sum, lead) => sum + (lead.score || 0), 0) / validLeads.length) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of 100 points
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {validLeads.filter(lead => (lead.score || 0) >= 60).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Score 60+ leads
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((validLeads.filter(lead => lead.status === 'converted').length / validLeads.length) * 100) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Leads to customers
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="scoring" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
            <TabsTrigger value="sources">Source Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="leaderboard">Top Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="scoring" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={scoreDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ range, count }) => `${range}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Score vs Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={validLeads}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="score" />
                      <YAxis dataKey="status" />
                      <Tooltip />
                      <Scatter dataKey="score" fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Source Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={sourcePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Lead Count" />
                    <Bar dataKey="avgScore" fill="#82ca9d" name="Avg Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {sourcePerformance.map((source, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{source.source}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Leads:</span>
                      <span className="font-medium">{source.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Score:</span>
                      <span className="font-medium">{source.avgScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Conversion Rate:</span>
                      <span className="font-medium">{source.conversionRate}%</span>
                    </div>
                    <Progress value={source.conversionRate} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Generation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={leadProgression}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="newLeads" stroke="#8884d8" name="New Leads" />
                    <Line type="monotone" dataKey="qualified" stroke="#82ca9d" name="Qualified" />
                    <Line type="monotone" dataKey="converted" stroke="#ffc658" name="Converted" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Leads</CardTitle>
                <p className="text-sm text-gray-600">Leads with highest scores requiring immediate attention</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topLeads.map((lead, index) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                          {getPriorityIcon(lead.priority)}
                        </div>
                        <div>
                          <h3 className="font-medium">{lead.firstName} {lead.lastName}</h3>
                          <p className="text-sm text-gray-600">{lead.email}</p>
                          <p className="text-xs text-gray-500">Source: {lead.source || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{lead.score || 0}</div>
                        <Badge variant={lead.priority === 'Hot' ? 'destructive' : lead.priority === 'High' ? 'default' : 'secondary'}>
                          {lead.priority}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{lead.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
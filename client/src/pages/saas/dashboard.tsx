import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Users, DollarSign } from "lucide-react";

export default function SaasDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/saas/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">SaaS Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse bg-gray-200 h-20"></CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const data = dashboardData || {
    totalTenants: 0,
    monthlyRevenue: 0,
    activeTrials: 0,
    growthRate: 0,
    recentTenants: []
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">SaaS Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTenants}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.monthlyRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeTrials}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.growthRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tenants</CardTitle>
          <CardDescription>Latest companies that joined your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentTenants.map((tenant: any) => (
              <div key={tenant.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{tenant.companyName}</p>
                  <p className="text-sm text-muted-foreground">{tenant.contactEmail}</p>
                </div>
                <Badge variant={tenant.isActive ? "default" : "secondary"}>
                  {tenant.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
            {data.recentTenants.length === 0 && (
              <p className="text-muted-foreground">No tenants yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
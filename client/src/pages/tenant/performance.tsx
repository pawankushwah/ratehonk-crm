import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, Calendar, Activity, Bell, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/components/auth/auth-provider";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  roleName: string | null;
}

interface UserDashboard {
  performance: {
    leadsAssigned: number;
    customersAssigned: number;
    activeTasks: number;
    completedTasks: number;
    unreadNotifications: number;
    conversionRate: number;
  };
  assignments: {
    recentLeads: Array<{
      id: number;
      name: string;
      status: string;
      createdAt: string;
      priority: string;
    }>;
    recentCustomers: Array<{
      id: number;
      name: string;
      crmStatus: string;
      lastActivity: string;
      totalValue: number;
    }>;
    upcomingTasks: Array<{
      id: number;
      title: string;
      dueDate: string;
      priority: string;
      status: string;
      type: string;
    }>;
  };
  notifications: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    priority: string;
    createdAt: string;
  }>;
  metrics: Record<string, any>;
}

function PerformancePageContent() {
  const { tenant } = useAuth();
  const tenantId = tenant?.id;
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Fetch users for dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: [`/api/tenants/${tenantId}/users`],
    queryFn: () =>
      fetch(`/api/tenants/${tenantId}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }).then(res => res.json()),
    enabled: !!tenantId
  });

  // Fetch user dashboard data when a specific user is selected
  const { data: userDashboard, isLoading: dashboardLoading } = useQuery<UserDashboard>({
    queryKey: [`/api/tenants/${tenantId}/users/${selectedUserId}/dashboard`],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenantId}/users/${selectedUserId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
    enabled: !!tenantId && !!selectedUserId
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <p className="text-gray-600 mt-2">View detailed performance metrics for individual team members</p>
      </div>

      {/* User Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select User</CardTitle>
          <CardDescription>Choose a user to view their performance dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedUserId?.toString() || ""} 
            onValueChange={(value) => setSelectedUserId(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a user to view their dashboard" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user: User) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.firstName} {user.lastName} - {user.roleName || 'No role'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {selectedUserId && (
        <>
          {dashboardLoading ? (
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({length: 6}).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : userDashboard ? (
            <>
              {/* Performance Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Leads</p>
                        <p className="text-2xl font-bold">{userDashboard.performance.leadsAssigned}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <UserCheck className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Customers</p>
                        <p className="text-2xl font-bold">{userDashboard.performance.customersAssigned}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Active Tasks</p>
                        <p className="text-2xl font-bold">{userDashboard.performance.activeTasks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Activity className="h-8 w-8 text-cyan-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="text-2xl font-bold">{userDashboard.performance.completedTasks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Bell className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Notifications</p>
                        <p className="text-2xl font-bold">{userDashboard.performance.unreadNotifications}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-teal-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Conversion</p>
                        <p className="text-2xl font-bold">{userDashboard.performance.conversionRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Notifications */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Assignments */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Leads</CardTitle>
                    <CardDescription>Latest assigned leads and their status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userDashboard.assignments?.recentLeads?.map((lead: any) => (
                        <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{lead.name}</p>
                            <p className="text-xs text-gray-500">{lead.status} • {lead.priority} priority</p>
                          </div>
                          <Badge variant="outline">{new Date(lead.createdAt).toLocaleDateString()}</Badge>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">No recent leads</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Recent updates and alerts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userDashboard.notifications?.map((notification: any) => (
                        <div key={notification.id} className={`p-3 rounded-lg ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            </div>
                            <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'}>
                              {notification.priority}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">No notifications</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
              <p className="text-gray-600">Performance data will appear here once the user has been active.</p>
            </div>
          )}
        </>
      )}

      {!selectedUserId && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a user</h3>
              <p className="text-gray-600">Choose a team member from the dropdown above to view their performance metrics.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PerformancePage() {
  return (
    <Layout>
      <PerformancePageContent />
    </Layout>
  );
}


import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Target, Calendar, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/components/auth/auth-provider";

interface AssignableUser {
  id: number;
  firstName: string;
  lastName: string;
  roleName: string;
  workload?: {
    leads: number;
    customers: number;
    activeTasks: number;
    total: number;
  };
}

interface AssignmentHistory {
  id: number;
  entityType: string;
  entityId: number;
  assignedToName: string;
  reason: string;
  createdAt: string;
}

function AssignmentsPageContent() {
  const { tenant } = useAuth();
  const tenantId = tenant?.id;
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");

  // Fetch assignable users (with workload data)
  const { data: assignableUsers = [], isLoading: assignableUsersLoading, error: assignableUsersError } = useQuery<AssignableUser[]>({
    queryKey: [`/api/tenants/${tenantId}/assignable-users`],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenantId}/assignable-users?entityType=leads`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch assignable users');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!tenantId
  });

  // Fetch assignment history
  const { data: assignmentHistory = [], isLoading: historyLoading } = useQuery<AssignmentHistory[]>({
    queryKey: [`/api/tenants/${tenantId}/assignment-history`, selectedEntityType],
    queryFn: async () => {
      const url = selectedEntityType === "all" 
        ? `/api/tenants/${tenantId}/assignment-history`
        : `/api/tenants/${tenantId}/assignment-history?entityType=${selectedEntityType}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!tenantId
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Assignments & Workload</h1>
        <p className="text-gray-600 mt-2">Monitor team workload and track assignment history</p>
      </div>

      {/* Workload Overview */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Team Workload Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assignableUsersLoading ? (
            Array.from({length: 3}).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))
          ) : assignableUsersError ? (
            <div className="col-span-3 text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load user data</h3>
              <p className="text-gray-600">Please try refreshing the page or check your connection.</p>
            </div>
          ) : Array.isArray(assignableUsers) && assignableUsers.length > 0 ? (
            assignableUsers.map((user: AssignableUser) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <CardDescription>{user.roleName}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leads:</span>
                      <span className="font-medium">{user.workload?.leads || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customers:</span>
                      <span className="font-medium">{user.workload?.customers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tasks:</span>
                      <span className="font-medium">{user.workload?.activeTasks || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold text-cyan-600">{user.workload?.total || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users available</h3>
              <p className="text-gray-600">Add team members to see their workload here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Assignment History</CardTitle>
              <CardDescription>Track recent assignment changes and distributions</CardDescription>
            </div>
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="animate-pulse space-y-4">
              {Array.from({length: 5}).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : Array.isArray(assignmentHistory) && assignmentHistory.length > 0 ? (
            <div className="space-y-4">
              {assignmentHistory.map((assignment: AssignmentHistory) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                      <Target className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{assignment.entityType} assigned</p>
                      <p className="text-xs text-gray-500">
                        {assignment.assignedToName} • {assignment.reason || 'Manual assignment'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(assignment.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments yet</h3>
              <p className="text-gray-600">Assignment history will appear here as you assign leads and customers to users.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AssignmentsPage() {
  return (
    <Layout>
      <AssignmentsPageContent />
    </Layout>
  );
}


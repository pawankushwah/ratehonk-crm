import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/components/auth/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, User, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { CreateFollowUpDialog } from "@/components/follow-ups/CreateFollowUpDialog";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface FollowUp {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  priority: string;
  assignedUserId?: number;
  assignedUserName?: string;
  createdByUserId?: number;
  createdByName?: string;
  relatedTableName?: string;
  relatedTableId?: number;
  createdAt: string;
  updatedAt: string;
}

export default function FollowUpsPage() {
  const { tenant, user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("table");

  // Check if user is a reporting person (has subordinates)
  const { data: subordinates } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/users/${user?.id}/hierarchy`],
    enabled: !!tenant?.id && !!user?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tenants/${tenant?.id}/users/${user?.id}/hierarchy`, {});
      return response.json();
    },
  });

  const hasSubordinates = subordinates?.subordinates && subordinates.subordinates.length > 0;
  const isReportingPerson = hasSubordinates || user?.role === "owner" || user?.role === "tenant_admin";

  // Fetch all follow-ups
  const { data: followUpsData, isLoading, refetch } = useQuery<{ data: FollowUp[] } | FollowUp[]>({
    queryKey: [`/api/tenants/${tenant?.id}/follow-ups`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tenants/${tenant?.id}/follow-ups`, {});
      const data = await response.json();
      // Handle both array and paginated response
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });

  const followUps = Array.isArray(followUpsData) ? followUpsData : (followUpsData?.data || []);

  // Fetch assignable users for board view
  const { data: assignableUsers } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/assignable-users`],
    enabled: !!tenant?.id && isReportingPerson && activeTab === "board",
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tenants/${tenant?.id}/assignable-users`, {});
      return response.json();
    },
  });

  // Group follow-ups by assigned user for board view
  const followUpsByUser = useMemo(() => {
    if (!followUps || !Array.isArray(followUps)) return {};
    
    const grouped: Record<number, FollowUp[]> = {};
    
    // Include current user and their subordinates
    const usersToShow = isReportingPerson && assignableUsers 
      ? assignableUsers.filter((u: any) => 
          u.id === user?.id || 
          subordinates?.subordinates?.some((s: any) => s.id === u.id)
        )
      : [{ id: user?.id, firstName: user?.firstName, lastName: user?.lastName }];

    usersToShow.forEach((u: any) => {
      grouped[u.id] = followUps.filter((fu: FollowUp) => fu.assignedUserId === u.id);
    });

    return grouped;
  }, [followUps, assignableUsers, user, subordinates, isReportingPerson]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending", variant: "secondary" },
      in_progress: { label: "In Progress", variant: "default" },
      completed: { label: "Completed", variant: "outline" },
      cancelled: { label: "Cancelled", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      low: { label: "Low", className: "bg-gray-100 text-gray-800" },
      medium: { label: "Medium", className: "bg-blue-100 text-blue-800" },
      high: { label: "High", className: "bg-orange-100 text-orange-800" },
      urgent: { label: "Urgent", className: "bg-red-100 text-red-800" },
    };
    const config = priorityConfig[priority] || { label: priority, className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Follow-Ups</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all follow-up activities
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Follow-Up
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            {isReportingPerson && (
              <TabsTrigger value="board">Board View</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Follow-Ups</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading follow-ups...</div>
                ) : followUps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No follow-ups found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Created By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {followUps.map((followUp: FollowUp) => (
                          <TableRow key={followUp.id}>
                            <TableCell className="font-medium">
                              {followUp.title}
                            </TableCell>
                            <TableCell>
                              {followUp.assignedUserName || "Unassigned"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(followUp.dueDate), "MMM dd, yyyy")}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(followUp.status)}</TableCell>
                            <TableCell>{getPriorityBadge(followUp.priority)}</TableCell>
                            <TableCell>{followUp.createdByName || "Unknown"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isReportingPerson && (
            <TabsContent value="board" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Follow-Ups Board</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading board...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="flex gap-4 min-w-max pb-4">
                        {Object.entries(followUpsByUser).map(([userId, userFollowUps]) => {
                          const userInfo = assignableUsers?.find((u: any) => u.id === parseInt(userId)) || 
                                          (parseInt(userId) === user?.id ? user : null);
                          const userName = userInfo 
                            ? `${userInfo.firstName} ${userInfo.lastName}` 
                            : "Unknown User";
                          
                          return (
                            <div key={userId} className="flex-shrink-0 w-80">
                              <div className="bg-gray-50 rounded-lg p-4 min-h-[500px]">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="font-semibold text-lg">{userName}</h3>
                                  <Badge variant="secondary">{userFollowUps.length}</Badge>
                                </div>
                                <div className="space-y-3">
                                  {userFollowUps.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                      No follow-ups
                                    </div>
                                  ) : (
                                    userFollowUps.map((followUp: FollowUp) => (
                                      <div
                                        key={followUp.id}
                                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <h4 className="font-medium text-sm">{followUp.title}</h4>
                                          {getStatusBadge(followUp.status)}
                                        </div>
                                        {followUp.description && (
                                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                            {followUp.description}
                                          </p>
                                        )}
                                        <div className="flex items-center justify-between mt-3">
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(followUp.dueDate), "MMM dd")}
                                          </div>
                                          {getPriorityBadge(followUp.priority)}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <CreateFollowUpDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              refetch();
            }
          }}
        />
      </div>
    </Layout>
  );
}


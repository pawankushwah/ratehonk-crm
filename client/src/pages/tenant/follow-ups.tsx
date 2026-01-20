import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/components/auth/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, User, Clock, AlertCircle, CheckCircle, XCircle, Loader2, Eye, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { CreateFollowUpDialog } from "@/components/follow-ups/CreateFollowUpDialog";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("table");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);

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

  // Fetch assignable users (for both table and board views)
  const { data: assignableUsers } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/assignable-users`],
    enabled: !!tenant?.id,
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

  // Mutation to update follow-up
  const updateFollowUpMutation = useMutation({
    mutationFn: async ({ followUpId, updates }: { followUpId: number; updates: { status?: string; assignedUserId?: number | null; priority?: string } }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/tenants/${tenant?.id}/general-follow-ups/${followUpId}`,
        updates
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/follow-ups`] });
      toast({
        title: "Success",
        description: "Follow-up updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow-up",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (followUpId: number, newStatus: string) => {
    updateFollowUpMutation.mutate({
      followUpId,
      updates: { status: newStatus },
    });
  };

  const handleAssignedUserChange = (followUpId: number, newUserId: string | null) => {
    updateFollowUpMutation.mutate({
      followUpId,
      updates: { assignedUserId: newUserId ? parseInt(newUserId) : null },
    });
  };

  const handlePriorityChange = (followUpId: number, newPriority: string) => {
    updateFollowUpMutation.mutate({
      followUpId,
      updates: { priority: newPriority },
    });
  };

  const handlePreview = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setPreviewDialogOpen(true);
  };

  const handleRelatedEntityClick = (followUp: FollowUp) => {
    if (!followUp.relatedTableName || !followUp.relatedTableId) return;
    
    const routeMap: Record<string, string> = {
      invoices: `/invoices?highlight=${followUp.relatedTableId}`,
      expenses: `/expenses?highlight=${followUp.relatedTableId}`,
      estimates: `/estimates?highlight=${followUp.relatedTableId}`,
      bookings: `/bookings?highlight=${followUp.relatedTableId}`,
      leads: `/leads?highlight=${followUp.relatedTableId}`,
      customers: `/customers?highlight=${followUp.relatedTableId}`,
    };

    const route = routeMap[followUp.relatedTableName];
    if (route) {
      setLocation(route);
    }
  };

  const getRelatedEntityLabel = (tableName?: string) => {
    if (!tableName) return null;
    const labelMap: Record<string, string> = {
      invoices: "Invoice",
      expenses: "Expense",
      estimates: "Estimate",
      bookings: "Booking",
      leads: "Lead",
      customers: "Customer",
    };
    return labelMap[tableName] || tableName;
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
                          <TableHead>Related To</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {followUps.map((followUp: FollowUp) => (
                          <TableRow key={followUp.id}>
                            <TableCell className="font-medium">
                              <button
                                onClick={() => handlePreview(followUp)}
                                className="text-left hover:underline cursor-pointer"
                              >
                                {followUp.title}
                              </button>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={followUp.assignedUserId?.toString() || "unassigned"}
                                onValueChange={(value) => 
                                  handleAssignedUserChange(followUp.id, value === "unassigned" ? null : value)
                                }
                                disabled={updateFollowUpMutation.isPending}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select user">
                                    {followUp.assignedUserName || "Unassigned"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {assignableUsers?.map((u: any) => (
                                    <SelectItem key={u.id} value={u.id.toString()}>
                                      {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(followUp.dueDate), "MMM dd, yyyy")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={followUp.status}
                                onValueChange={(value) => handleStatusChange(followUp.id, value)}
                                disabled={updateFollowUpMutation.isPending}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={followUp.priority}
                                onValueChange={(value) => handlePriorityChange(followUp.id, value)}
                                disabled={updateFollowUpMutation.isPending}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {followUp.relatedTableName && followUp.relatedTableId ? (
                                <button
                                  onClick={() => handleRelatedEntityClick(followUp)}
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {getRelatedEntityLabel(followUp.relatedTableName)} #{followUp.relatedTableId}
                                </button>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>{followUp.createdByName || "Unknown"}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(followUp)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
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
                                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <h4 className="font-medium text-sm">{followUp.title}</h4>
                                        </div>
                                        {followUp.description && (
                                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                            {followUp.description}
                                          </p>
                                        )}
                                        
                                        {/* Status Select */}
                                        <div className="mb-3">
                                          <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                                          <Select
                                            value={followUp.status}
                                            onValueChange={(value) => handleStatusChange(followUp.id, value)}
                                            disabled={updateFollowUpMutation.isPending}
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">Pending</SelectItem>
                                              <SelectItem value="in_progress">In Progress</SelectItem>
                                              <SelectItem value="completed">Completed</SelectItem>
                                              <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Assigned User Select */}
                                        {isReportingPerson && (
                                          <div className="mb-3">
                                            <Label className="text-xs text-muted-foreground mb-1 block">Assigned To</Label>
                                            <Select
                                              value={followUp.assignedUserId?.toString() || "unassigned"}
                                              onValueChange={(value) => 
                                                handleAssignedUserChange(followUp.id, value === "unassigned" ? null : value)
                                              }
                                              disabled={updateFollowUpMutation.isPending}
                                            >
                                              <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Select user">
                                                  {followUp.assignedUserName || "Unassigned"}
                                                </SelectValue>
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {assignableUsers?.map((u: any) => (
                                                  <SelectItem key={u.id} value={u.id.toString()}>
                                                    {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}

                                        {/* Priority Select */}
                                        <div className="mb-3">
                                          <Label className="text-xs text-muted-foreground mb-1 block">Priority</Label>
                                          <Select
                                            value={followUp.priority}
                                            onValueChange={(value) => handlePriorityChange(followUp.id, value)}
                                            disabled={updateFollowUpMutation.isPending}
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="low">Low</SelectItem>
                                              <SelectItem value="medium">Medium</SelectItem>
                                              <SelectItem value="high">High</SelectItem>
                                              <SelectItem value="urgent">Urgent</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Related Entity Link */}
                                        {followUp.relatedTableName && followUp.relatedTableId && (
                                          <div className="mb-3">
                                            <Label className="text-xs text-muted-foreground mb-1 block">Related To</Label>
                                            <button
                                              onClick={() => handleRelatedEntityClick(followUp)}
                                              className="flex items-center gap-1 text-blue-600 hover:underline text-xs"
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                              {getRelatedEntityLabel(followUp.relatedTableName)} #{followUp.relatedTableId}
                                            </button>
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(followUp.dueDate), "MMM dd")}
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePreview(followUp)}
                                            className="h-6 px-2 text-xs"
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Preview
                                          </Button>
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

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Follow-Up Preview</DialogTitle>
            </DialogHeader>
            {selectedFollowUp && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Title</Label>
                  <p className="text-base mt-1">{selectedFollowUp.title}</p>
                </div>
                {selectedFollowUp.description && (
                  <div>
                    <Label className="text-sm font-semibold">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {selectedFollowUp.description}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedFollowUp.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Priority</Label>
                    <div className="mt-1">{getPriorityBadge(selectedFollowUp.priority)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Due Date</Label>
                    <p className="text-sm mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(selectedFollowUp.dueDate), "MMM dd, yyyy h:mm a")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Assigned To</Label>
                    <p className="text-sm mt-1">
                      {selectedFollowUp.assignedUserName || "Unassigned"}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Created By</Label>
                  <p className="text-sm mt-1">
                    {selectedFollowUp.createdByName || "Unknown"}
                  </p>
                </div>
                {selectedFollowUp.relatedTableName && selectedFollowUp.relatedTableId && (
                  <div>
                    <Label className="text-sm font-semibold">Related To</Label>
                    <button
                      onClick={() => {
                        handleRelatedEntityClick(selectedFollowUp);
                        setPreviewDialogOpen(false);
                      }}
                      className="flex items-center gap-2 text-blue-600 hover:underline mt-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {getRelatedEntityLabel(selectedFollowUp.relatedTableName)} #{selectedFollowUp.relatedTableId}
                    </button>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-semibold">Created At</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedFollowUp.createdAt), "MMM dd, yyyy h:mm a")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Last Updated</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedFollowUp.updatedAt), "MMM dd, yyyy h:mm a")}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}


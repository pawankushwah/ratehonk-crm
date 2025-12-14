import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ExternalLink,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  X,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";

interface FollowUpDetailsPopoverProps {
  followUp: {
    id: number;
    title: string;
    description?: string;
    assignedUserId?: number;
    assignedUserName?: string;
    assignedUserEmail?: string;
    createdByName?: string;
    priority: string;
    status: string;
    dueDate: string;
    relatedTableName?: string;
    relatedTableId?: number;
    tags?: string[];
    previousAssignedUserName?: string;
  };
  children: React.ReactNode;
}

export function FollowUpDetailsPopover({
  followUp,
  children,
}: FollowUpDetailsPopoverProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(followUp.status);
  const [assignedUserId, setAssignedUserId] = useState(followUp.assignedUserId);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");

  // Fetch assignable users
  const { data: assignableUsersData } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/follow-ups/assignable-users`],
    queryFn: async () => {
      const response = await fetch(
        `/api/tenants/${tenant?.id}/follow-ups/assignable-users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch assignable users");
      return response.json();
    },
    enabled: !!tenant?.id && open,
  });

  const assignableUsers = assignableUsersData?.users || [];

  // Fetch related entity details
  const { data: relatedEntityData } = useQuery({
    queryKey: [
      `/api/tenants/${tenant?.id}/general-follow-ups/related-entity-details`,
      followUp.relatedTableName,
      followUp.relatedTableId,
    ],
    queryFn: async () => {
      if (!followUp.relatedTableName || !followUp.relatedTableId) return null;
      const params = new URLSearchParams({
        tableName: followUp.relatedTableName,
        tableId: followUp.relatedTableId.toString(),
      });
      const response = await fetch(
        `/api/tenants/${tenant?.id}/general-follow-ups/related-entity-details?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          credentials: "include",
        }
      );
      if (!response.ok) return null;
      return response.json();
    },
    enabled:
      !!tenant?.id &&
      !!followUp.relatedTableName &&
      !!followUp.relatedTableId &&
      open,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(
        `/api/tenants/${tenant?.id}/general-follow-ups/${followUp.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Follow-up status updated",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/general-follow-ups`],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Reassign mutation
  const reassignMutation = useMutation({
    mutationFn: async (newUserId: number) => {
      const response = await fetch(
        `/api/tenants/${tenant?.id}/general-follow-ups/${followUp.id}/reassign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          credentials: "include",
          body: JSON.stringify({ newUserId }),
        }
      );
      if (!response.ok) throw new Error("Failed to reassign");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Follow-up reassigned successfully. Email notification sent.",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/general-follow-ups`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/follow-ups/assignable-users`],
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reassign follow-up",
        variant: "destructive",
      });
    },
  });

  // Complete follow-up mutation
  const completeMutation = useMutation({
    mutationFn: async (notes?: string) => {
      const response = await fetch(
        `/api/tenants/${tenant?.id}/general-follow-ups/${followUp.id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          credentials: "include",
          body: JSON.stringify({ completionNotes: notes }),
        }
      );
      if (!response.ok) throw new Error("Failed to complete follow-up");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Follow-up marked as complete",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/general-follow-ups`],
      });
      setShowCompleteDialog(false);
      setCompletionNotes("");
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete follow-up",
        variant: "destructive",
      });
    },
  });

  // Delete follow-up mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/tenants/${tenant?.id}/general-follow-ups/${followUp.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to delete follow-up");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Follow-up deleted successfully",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/general-follow-ups`],
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete follow-up",
        variant: "destructive",
      });
    },
  });

  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  const handleReassign = () => {
    if (assignedUserId && assignedUserId !== followUp.assignedUserId) {
      reassignMutation.mutate(assignedUserId);
    }
  };

  const handleNavigateToRelated = () => {
    if (!followUp.relatedTableName || !followUp.relatedTableId) return;

    const routeMap: Record<string, string> = {
      leads: `/leads`,
      customers: `/customers`,
      invoices: `/invoices`,
      bookings: `/bookings`,
      estimates: `/estimates`,
      expenses: `/expenses`,
    };

    const route = routeMap[followUp.relatedTableName];
    if (route) {
      setLocation(route);
      setOpen(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[500px] max-h-[600px] overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg">{followUp.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Description */}
          {followUp.description && (
            <div>
              <Label className="text-xs text-gray-500">Description</Label>
              <p className="text-sm text-gray-700 mt-1">{followUp.description}</p>
            </div>
          )}

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Status</Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9">
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
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Priority</Label>
              <Badge
                className={priorityColors[followUp.priority] || priorityColors.medium}
              >
                {followUp.priority}
              </Badge>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <Label className="text-xs text-gray-500">Due Date</Label>
              <p className="text-sm font-medium">
                {format(new Date(followUp.dueDate), "MMM dd, yyyy h:mm a")}
              </p>
            </div>
          </div>

          {/* Assigned User */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">
              Assigned To
            </Label>
            <div className="flex items-center gap-2 mb-2">
              {followUp.assignedUserName && (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                      {getInitials(followUp.assignedUserName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{followUp.assignedUserName}</span>
                </>
              )}
            </div>
            <Select
              value={assignedUserId?.toString() || ""}
              onValueChange={(value) => setAssignedUserId(parseInt(value))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map((u: any) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.firstName && u.lastName
                      ? `${u.firstName} ${u.lastName}`
                      : u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignedUserId !== followUp.assignedUserId && (
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={handleReassign}
                disabled={reassignMutation.isPending}
              >
                {reassignMutation.isPending ? "Reassigning..." : "Reassign"}
              </Button>
            )}
          </div>

          {/* Created By */}
          {followUp.createdByName && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <Label className="text-xs text-gray-500">Created By</Label>
                <p className="text-sm">{followUp.createdByName}</p>
              </div>
            </div>
          )}

          {/* Related Entity */}
          {followUp.relatedTableName && followUp.relatedTableId && (
            <div className="border-t pt-4">
              <Label className="text-xs text-gray-500 mb-2 block">
                Related To
              </Label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {followUp.relatedTableName}
                    </p>
                    {relatedEntityData?.name && (
                      <p className="text-xs text-gray-500">
                        {relatedEntityData.name}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNavigateToRelated}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open
                </Button>
              </div>
            </div>
          )}

          {/* Tags */}
          {followUp.tags && followUp.tags.length > 0 && (
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Tags</Label>
              <div className="flex flex-wrap gap-1">
                {followUp.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {followUp.status !== "completed" && (
            <div className="border-t pt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowCompleteDialog(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this follow-up?")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Follow-Up as Complete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="completionNotes">Completion Notes (Optional)</Label>
              <Textarea
                id="completionNotes"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any notes about completing this follow-up..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCompleteDialog(false);
                setCompletionNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => completeMutation.mutate(completionNotes)}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? "Completing..." : "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Popover>
  );
}


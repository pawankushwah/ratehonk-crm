import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedTableName?: string;
  relatedTableId?: number;
  relatedEntityName?: string;
  onSuccess?: () => void;
}

export function CreateFollowUpDialog({
  open,
  onOpenChange,
  relatedTableName,
  relatedTableId,
  relatedEntityName,
  onSuccess,
}: CreateFollowUpDialogProps) {
  const { user, tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [tags, setTags] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | undefined>(undefined);
  const [reminderTime, setReminderTime] = useState("");

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

  // Pre-fill title if related entity is provided
  useEffect(() => {
    if (relatedTableName && relatedTableId && relatedEntityName && !title) {
      const entityTypeMap: Record<string, string> = {
        leads: "Lead",
        customers: "Customer",
        invoices: "Invoice",
        bookings: "Booking",
        estimates: "Estimate",
        expenses: "Expense",
      };
      const entityType = entityTypeMap[relatedTableName] || relatedTableName;
      setTitle(`Follow up on ${entityType} - ${relatedEntityName}`);
    }
  }, [relatedTableName, relatedTableId, relatedEntityName, title]);

  // Create follow-up mutation
  const createFollowUpMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      assignedUserId?: number | null;
      priority: string;
      dueDate: string;
      relatedTableName?: string;
      relatedTableId?: number;
      tags?: string[];
      reminderDate?: string;
    }) => {
      const response = await fetch(
        `/api/tenants/${tenant?.id}/general-follow-ups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create follow-up");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Follow-up created successfully",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/general-follow-ups`],
      });
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create follow-up",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setDueTime("");
    setPriority("medium");
    setAssignedUserId(null);
    setTags("");
    setReminderEnabled(false);
    setReminderDate(undefined);
    setReminderTime("");
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!dueDate) {
      toast({
        title: "Validation Error",
        description: "Due date is required",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const dueDateTime = new Date(dueDate);
    if (dueTime) {
      const [hours, minutes] = dueTime.split(":");
      dueDateTime.setHours(parseInt(hours), parseInt(minutes));
    } else {
      dueDateTime.setHours(12, 0); // Default to noon if no time specified
    }

    let reminderDateTime: string | undefined = undefined;
    if (reminderEnabled && reminderDate) {
      const reminder = new Date(reminderDate);
      if (reminderTime) {
        const [hours, minutes] = reminderTime.split(":");
        reminder.setHours(parseInt(hours), parseInt(minutes));
      } else {
        reminder.setHours(10, 0); // Default to 10 AM if no time specified
      }
      reminderDateTime = reminder.toISOString();
    }

    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    createFollowUpMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      assignedUserId: assignedUserId || null,
      priority,
      dueDate: dueDateTime.toISOString(),
      relatedTableName: relatedTableName || undefined,
      relatedTableId: relatedTableId || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      reminderDate: reminderDateTime,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Follow-Up</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter follow-up title"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter follow-up description"
              className="mt-1"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePickerCalendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Due Time</Label>
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Priority <span className="text-red-500">*</span>
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1">
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

            <div>
              <Label>
                Assign To <span className="text-red-500">*</span>
              </Label>
              <Select
                value={assignedUserId?.toString() || ""}
                onValueChange={(value) =>
                  setAssignedUserId(value ? parseInt(value) : null)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} {user.relationship === "self" && "(Self)"}
                      {user.relationship === "parent" && " (Manager)"}
                      {user.relationship === "child" && " (Team Member)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(relatedTableName || relatedTableId) && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <Label className="text-sm font-medium text-blue-900">
                Related To
              </Label>
              <p className="text-sm text-blue-700 mt-1">
                {relatedEntityName || `${relatedTableName} #${relatedTableId}`}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., sales, urgent, follow-up"
              className="mt-1"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="reminder"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="reminder" className="cursor-pointer">
                Set Reminder
              </Label>
            </div>

            {reminderEnabled && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <Label>Reminder Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !reminderDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {reminderDate
                          ? format(reminderDate, "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DatePickerCalendar
                        mode="single"
                        selected={reminderDate}
                        onSelect={setReminderDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Reminder Time</Label>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {assignedUserId &&
            assignableUsers.find((u: any) => u.id === assignedUserId)
              ?.id !== user?.id && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  An email notification will be sent to the assigned user.
                </p>
              </div>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createFollowUpMutation.isPending}
          >
            {createFollowUpMutation.isPending ? "Creating..." : "Create Follow-Up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


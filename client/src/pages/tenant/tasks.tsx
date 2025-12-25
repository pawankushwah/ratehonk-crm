import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { format, addDays, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Flag,
  Users,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Bell,
  Edit,
  Trash2,
  MoreHorizontal,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Tag,
  Target
} from "lucide-react";

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'follow_up' | 'call' | 'email' | 'meeting' | 'quote' | 'booking' | 'general';
  dueDate: string;
  completedAt?: string;
  assignedTo: string;
  assignedToId: number;
  reportingUserId?: number;
  customerId?: number;
  customerName?: string;
  leadId?: number;
  leadName?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  notes?: string;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
}

interface FollowUp {
  id: number;
  taskId: number;
  scheduledDate: string;
  type: 'reminder' | 'escalation' | 'check_in';
  message: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

const taskTypes = [
  { value: 'follow_up', label: 'Follow Up', icon: RotateCcw, color: 'bg-blue-100 text-blue-800' },
  { value: 'call', label: 'Phone Call', icon: Phone, color: 'bg-green-100 text-green-800' },
  { value: 'email', label: 'Email', icon: Mail, color: 'bg-purple-100 text-purple-800' },
  { value: 'meeting', label: 'Meeting', icon: Users, color: 'bg-orange-100 text-orange-800' },
  { value: 'quote', label: 'Send Quote', icon: Target, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'booking', label: 'Process Booking', icon: CheckCircle2, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'general', label: 'General Task', icon: CheckSquare, color: 'bg-gray-100 text-gray-800' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800', icon: Circle },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800', icon: Circle },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800', icon: Flag },
];

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
];

export default function TasksAndFollowUps() {
  const { user, tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: [`/api/tenants/${tenant?.id}/tasks`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
  });

  const { data: followUps } = useQuery<FollowUp[]>({
    queryKey: [`/api/tenants/${tenant?.id}/follow-ups`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/follow-ups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch follow-ups");
      return response.json();
    },
  });

  const { data: customersResponse } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/customers`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/customers?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const data = await response.json();
      // Handle paginated response structure { data: [...], total: ... }
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });

  const { data: leadsResponse } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/leads`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/leads?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const data = await response.json();
      // Handle paginated response structure { data: [...], total: ... }
      return Array.isArray(data) ? data : (data?.data || []);
    },
  });

  // Extract data arrays from responses (handle both array and paginated object formats)
  const customers = Array.isArray(customersResponse) ? customersResponse : (customersResponse?.data || []);
  const leads = Array.isArray(leadsResponse) ? leadsResponse : (leadsResponse?.data || []);

  // Convert to ComboboxOptions with email support
  const customerOptions: ComboboxOption[] = customers.map((customer: any) => ({
    value: customer.id.toString(),
    label: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || `Customer ${customer.id}`,
    email: customer.email || undefined,
  }));

  const leadOptions: ComboboxOption[] = leads.map((lead: any) => ({
    value: lead.id.toString(),
    label: lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || `Lead ${lead.id}`,
    email: lead.email || undefined,
  }));

  // Fetch assignable users (users that current user can assign tasks to)
  const { data: assignableUsers } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/assignable-users`],
    enabled: !!tenant?.id && !!user?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/assignable-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch assignable users");
      const users = await response.json();
      // Get user hierarchy to filter subordinates
      try {
        const hierarchyResponse = await fetch(`/api/tenants/${tenant?.id}/users/${user?.id}/hierarchy`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (hierarchyResponse.ok) {
          const hierarchy = await hierarchyResponse.json();
          // Filter to show only current user and their subordinates
          const subordinateIds = hierarchy.allSubordinateIds || [];
          return users.filter((u: any) => u.id === user?.id || subordinateIds.includes(u.id));
        }
      } catch (e) {
        console.error("Error fetching hierarchy:", e);
      }
      return users;
    },
  });

  // Convert assignable users to ComboboxOptions with email support
  const assignableUserOptions: ComboboxOption[] = useMemo(() => {
    return (assignableUsers || []).map((u: any) => ({
      value: u.id.toString(),
      label: `${u.firstName} ${u.lastName}${u.id === user?.id ? ' (Me)' : ''}${u.roleName ? ` - ${u.roleName}` : ''}`,
      email: u.email || undefined,
      icon: <User className="w-4 h-4" />,
    }));
  }, [assignableUsers, user?.id]);

  const createTask = useMutation({
    mutationFn: async (data: any) => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/tasks`] });
      toast({ title: "Task created successfully" });
      // Close dialog only after successful submission
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create task", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
      // Don't close dialog on error - let user fix and retry
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/tasks`] });
      toast({ title: "Task updated successfully" });
    },
  });

  const updateTaskAssignment = useMutation({
    mutationFn: async ({ taskId, assignedToId, assignedTo }: { taskId: number; assignedToId: number; assignedTo: string }) => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignedToId, assignedTo }),
      });
      if (!response.ok) throw new Error('Failed to update task assignment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/tasks`] });
      toast({ title: "Task assignment updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update task assignment", variant: "destructive" });
    },
  });

  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.leadName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || task.type === selectedType;
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'today' && isToday(new Date(task.dueDate))) ||
      (selectedFilter === 'tomorrow' && isTomorrow(new Date(task.dueDate))) ||
      (selectedFilter === 'week' && isThisWeek(new Date(task.dueDate))) ||
      (selectedFilter === 'overdue' && isPast(new Date(task.dueDate)) && task.status !== 'completed') ||
      (selectedFilter === 'completed' && task.status === 'completed') ||
      (selectedFilter === 'my_tasks' && task.assignedToId === user?.id);
    
    return matchesSearch && matchesType && matchesFilter;
  }) || [];

  const getTaskIcon = (type: string) => {
    const taskType = taskTypes.find(t => t.value === type);
    return taskType ? taskType.icon : CheckSquare;
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const priorityOption = priorityOptions.find(p => p.value === priority);
    return priorityOption?.color || 'bg-gray-100 text-gray-800';
  };

  const getDueDateColor = (dueDate: string, status: string) => {
    const date = new Date(dueDate);
    if (status === 'completed') return 'text-green-600';
    if (isPast(date)) return 'text-red-600';
    if (isToday(date)) return 'text-orange-600';
    if (isTomorrow(date)) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const CreateTaskDialog = () => {
    const initialFormData = {
      title: '',
      description: '',
      type: 'general',
      priority: 'medium',
      dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      assignedToId: user?.id?.toString() || '',
      reportingUserId: '',
      customerId: '',
      leadId: '',
      estimatedDuration: 30,
      tags: [],
      notes: '',
      sendEmailNotification: true
    };

    const [formData, setFormData] = useState(initialFormData);
    const [selectedDueDate, setSelectedDueDate] = useState<Date>(addDays(new Date(), 1));
    const [selectedEndDate, setSelectedEndDate] = useState<Date>(addDays(new Date(), 7));

    // Reset form when dialog closes
    useEffect(() => {
      if (!isCreateOpen) {
        setFormData(initialFormData);
        setSelectedDueDate(addDays(new Date(), 1));
        setSelectedEndDate(addDays(new Date(), 7));
      }
    }, [isCreateOpen]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const selectedUser = assignableUsers?.find((u: any) => u.id.toString() === formData.assignedToId);
      const reportingUser = assignableUsers?.find((u: any) => u.id.toString() === formData.reportingUserId);
      createTask.mutate({
        ...formData,
        dueDate: selectedDueDate.toISOString(),
        endDate: selectedEndDate.toISOString(),
        assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : user?.id,
        assignedTo: selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : `${user?.firstName} ${user?.lastName}`,
        reportingUserId: formData.reportingUserId ? parseInt(formData.reportingUserId) : (selectedUser?.reportingUserId || null),
        reportingUserName: reportingUser ? `${reportingUser.firstName} ${reportingUser.lastName}` : (selectedUser?.reportingUserName || null),
        status: 'pending',
        sendEmailNotification: formData.sendEmailNotification,
        createdBy: user?.id,
        tenantId: tenant?.id,
        // Convert string IDs to numbers or null
        customerId: formData.customerId ? parseInt(formData.customerId) : null,
        leadId: formData.leadId ? parseInt(formData.leadId) : null
      });
    };

    return (
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        // Only allow closing if not submitting
        if (!createTask.isPending) {
          setIsCreateOpen(open);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a task or follow-up to track important activities
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Task Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <priority.icon className="w-4 h-4" />
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Related Customer (Optional)</Label>
                <Combobox
                  options={customerOptions}
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({...formData, customerId: value, leadId: ''})}
                  placeholder="Select customer"
                  searchPlaceholder="Search customers by name or email..."
                  emptyText="No customers found"
                />
              </div>
              <div>
                <Label htmlFor="lead">Related Lead (Optional)</Label>
                <Combobox
                  options={leadOptions}
                  value={formData.leadId}
                  onValueChange={(value) => setFormData({...formData, leadId: value, customerId: ''})}
                  placeholder="Select lead"
                  searchPlaceholder="Search leads by name or email..."
                  emptyText="No leads found"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Assign To</Label>
                <Combobox
                  options={assignableUserOptions}
                  value={formData.assignedToId}
                  onValueChange={(value) => {
                    const selectedUser = assignableUsers?.find((u: any) => u.id.toString() === value);
                    setFormData({
                      ...formData, 
                      assignedToId: value,
                      // Auto-set reporting user if assigned user has one
                      reportingUserId: selectedUser?.reportingUserId ? selectedUser.reportingUserId.toString() : formData.reportingUserId
                    });
                  }}
                  placeholder="Select user to assign task"
                  searchPlaceholder="Search users by name or email..."
                  emptyText="No users found"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can assign tasks to yourself or your team members
                </p>
              </div>
              <div>
                <Label htmlFor="reportingUser">Reporting User (Optional)</Label>
                <Combobox
                  options={assignableUserOptions}
                  value={formData.reportingUserId}
                  onValueChange={(value) => setFormData({...formData, reportingUserId: value})}
                  placeholder="Select reporting manager"
                  searchPlaceholder="Search users by name or email..."
                  emptyText="No users found"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Manager/supervisor who should be notified
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Due Date (Start)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDueDate ? format(selectedDueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDueDate}
                      onSelect={(date) => date && setSelectedDueDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedEndDate ? format(selectedEndDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedEndDate}
                      onSelect={(date) => date && setSelectedEndDate(date)}
                      initialFocus
                      disabled={(date) => date < selectedDueDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({...formData, estimatedDuration: parseInt(e.target.value)})}
                  min="5"
                  step="5"
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="sendEmail"
                  checked={formData.sendEmailNotification}
                  onCheckedChange={(checked) => setFormData({...formData, sendEmailNotification: checked as boolean})}
                />
                <Label htmlFor="sendEmail" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Send email notification to assigned user
                  </div>
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter task description"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any additional notes or context"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  if (!createTask.isPending) {
                    setIsCreateOpen(false);
                  }
                }}
                disabled={createTask.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTask.isPending}>
                {createTask.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Tasks & Follow-ups
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage tasks and track follow-up activities
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Today</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {tasks?.filter(t => isToday(new Date(t.dueDate)) && t.status !== 'completed').length || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {tasks?.filter(t => isPast(new Date(t.dueDate)) && t.status !== 'completed').length || 0}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {tasks?.filter(t => t.status === 'in_progress').length || 0}
                  </p>
                </div>
                <PlayCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed This Week</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tasks?.filter(t => t.status === 'completed' && isThisWeek(new Date(t.completedAt || t.updatedAt))).length || 0}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="today">Due Today</SelectItem>
                    <SelectItem value="tomorrow">Due Tomorrow</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="my_tasks">My Tasks</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {taskTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Tasks
              <Badge variant="secondary">{filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={filteredTasks.length > 0 && filteredTasks.every(t => t.status === 'completed')}
                        onCheckedChange={(checked) => {
                          filteredTasks.forEach(task => {
                            if (task.status !== 'completed' && checked) {
                              updateTaskStatus.mutate({ taskId: task.id, status: 'completed' });
                            }
                          });
                        }}
                      />
                    </TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Related To</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const Icon = getTaskIcon(task.type);
                    const PriorityIcon = priorityOptions.find(p => p.value === task.priority)?.icon || Circle;
                    const taskType = taskTypes.find(t => t.value === task.type);
                    return (
                      <TableRow 
                        key={task.id} 
                        className={cn(
                          task.status === 'completed' ? 'opacity-60' : '',
                          'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                        onClick={(e) => {
                          // Don't open preview if clicking on interactive elements
                          const target = e.target as HTMLElement;
                          if (target.closest('button') || target.closest('[role="combobox"]') || target.closest('input[type="checkbox"]')) {
                            return;
                          }
                          setSelectedTask(task);
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={task.status === 'completed'}
                            onCheckedChange={(checked) => {
                              updateTaskStatus.mutate({
                                taskId: task.id,
                                status: checked ? 'completed' : 'pending'
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${taskType?.color || 'bg-gray-100 text-gray-800'}`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-xs font-medium">{taskType?.label || task.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <PriorityIcon className={`w-4 h-4 ${task.priority === 'urgent' ? 'text-red-500' : task.priority === 'high' ? 'text-orange-500' : 'text-gray-400'}`} />
                            <span className="text-sm capitalize">{task.priority}</span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={task.status}
                            onValueChange={(newStatus) => {
                              updateTaskStatus.mutate({
                                taskId: task.id,
                                status: newStatus
                              });
                            }}
                          >
                            <SelectTrigger className="w-36 h-8">
                              <SelectValue>
                                <Badge className={getStatusColor(task.status)}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  <Badge className={status.color}>
                                    {status.label}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Combobox
                            options={assignableUserOptions}
                            value={task.assignedToId.toString()}
                            onValueChange={(value) => {
                              const selectedUser = assignableUsers?.find((u: any) => u.id.toString() === value);
                              if (selectedUser) {
                                updateTaskAssignment.mutate({
                                  taskId: task.id,
                                  assignedToId: parseInt(value),
                                  assignedTo: `${selectedUser.firstName} ${selectedUser.lastName}`
                                });
                              }
                            }}
                            placeholder="Assign user"
                            searchPlaceholder="Search users..."
                            emptyText="No users found"
                          />
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm ${getDueDateColor(task.dueDate, task.status)}`}>
                            {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {task.endDate ? (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {format(new Date(task.endDate), 'MMM dd, yyyy')}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.customerName ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Customer</span>
                              <span className="text-sm flex items-center gap-1 font-medium">
                                <User className="w-3 h-3 text-blue-500" />
                                {task.customerName}
                              </span>
                            </div>
                          ) : task.leadName ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Lead</span>
                              <span className="text-sm flex items-center gap-1 font-medium">
                                <User className="w-3 h-3 text-green-500" />
                                {task.leadName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.estimatedDuration ? (
                            <span className="text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimatedDuration}m
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedTask(task)}>
                                <Edit className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  updateTaskStatus.mutate({
                                    taskId: task.id,
                                    status: task.status === 'completed' ? 'pending' : 'completed'
                                  });
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No tasks found</p>
                        <p className="text-sm text-gray-400">Try adjusting your filters or create a new task</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <CreateTaskDialog />

        {/* Task Detail Dialog */}
        {selectedTask && (
          <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${taskTypes.find(t => t.value === selectedTask.type)?.color || 'bg-gray-100 text-gray-800'}`}>
                    {React.createElement(getTaskIcon(selectedTask.type), { className: "w-5 h-5" })}
                  </div>
                  {selectedTask.title}
                </DialogTitle>
                <DialogDescription>
                  Task Details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedTask.status)}>
                        {selectedTask.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Priority</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {React.createElement(priorityOptions.find(p => p.value === selectedTask.priority)?.icon || Circle, { 
                        className: `w-4 h-4 ${selectedTask.priority === 'urgent' ? 'text-red-500' : selectedTask.priority === 'high' ? 'text-orange-500' : 'text-gray-400'}` 
                      })}
                      <span className="text-sm capitalize">{selectedTask.priority}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Assigned To</Label>
                    <p className="text-sm font-medium mt-1">{selectedTask.assignedTo}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Type</Label>
                    <p className="text-sm mt-1">{taskTypes.find(t => t.value === selectedTask.type)?.label || selectedTask.type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Due Date</Label>
                    <p className={`text-sm mt-1 ${getDueDateColor(selectedTask.dueDate, selectedTask.status)}`}>
                      {format(new Date(selectedTask.dueDate), 'PPP')}
                    </p>
                  </div>
                  {selectedTask.endDate && (
                    <div>
                      <Label className="text-xs text-gray-500">End Date</Label>
                      <p className="text-sm mt-1">{format(new Date(selectedTask.endDate), 'PPP')}</p>
                    </div>
                  )}
                  {selectedTask.estimatedDuration && (
                    <div>
                      <Label className="text-xs text-gray-500">Estimated Duration</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {selectedTask.estimatedDuration} minutes
                      </p>
                    </div>
                  )}
                  {(selectedTask.customerName || selectedTask.leadName) && (
                    <div>
                      <Label className="text-xs text-gray-500">Related To</Label>
                      {selectedTask.customerName ? (
                        <p className="text-sm mt-1 flex items-center gap-1">
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Customer:</span>
                          <span className="font-medium">{selectedTask.customerName}</span>
                        </p>
                      ) : (
                        <p className="text-sm mt-1 flex items-center gap-1">
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Lead:</span>
                          <span className="font-medium">{selectedTask.leadName}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {selectedTask.description && (
                  <div>
                    <Label className="text-xs text-gray-500">Description</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded-md">{selectedTask.description}</p>
                  </div>
                )}
                {selectedTask.notes && (
                  <div>
                    <Label className="text-xs text-gray-500">Notes</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded-md">{selectedTask.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs text-gray-500">Created</Label>
                    <p className="text-sm mt-1">{format(new Date(selectedTask.createdAt), 'PPP p')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Last Updated</Label>
                    <p className="text-sm mt-1">{format(new Date(selectedTask.updatedAt), 'PPP p')}</p>
                  </div>
                  {selectedTask.completedAt && (
                    <div>
                      <Label className="text-xs text-gray-500">Completed</Label>
                      <p className="text-sm mt-1">{format(new Date(selectedTask.completedAt), 'PPP p')}</p>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTask(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
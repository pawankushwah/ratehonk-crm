import React, { useState } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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
  customerId?: number;
  customerName?: string;
  leadId?: number;
  leadName?: string;
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

  const { data: customers } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/customers`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

  const { data: leads } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/leads`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

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
      setIsCreateOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
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
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      type: 'general',
      priority: 'medium',
      dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      customerId: '',
      leadId: '',
      estimatedDuration: 30,
      tags: [],
      notes: ''
    });

    const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createTask.mutate({
        ...formData,
        dueDate: selectedDate.toISOString(),
        assignedToId: user?.id,
        assignedTo: `${user?.firstName} ${user?.lastName}`,
        status: 'pending',
        // Convert string IDs to numbers or null
        customerId: formData.customerId ? parseInt(formData.customerId) : null,
        leadId: formData.leadId ? parseInt(formData.leadId) : null
      });
    };

    return (
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                <Select value={formData.customerId} onValueChange={(value) => setFormData({...formData, customerId: value, leadId: ''})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(customers) && customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name || customer.firstName + ' ' + customer.lastName || `Customer ${customer.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lead">Related Lead (Optional)</Label>
                <Select value={formData.leadId} onValueChange={(value) => setFormData({...formData, leadId: value, customerId: ''})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(leads) && leads.map((lead: any) => (
                      <SelectItem key={lead.id} value={lead.id.toString()}>
                        {lead.name || lead.firstName + ' ' + lead.lastName || `Lead ${lead.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
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

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Tasks
              <Badge variant="secondary">{filteredTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {filteredTasks.map((task) => {
                const Icon = getTaskIcon(task.type);
                const PriorityIcon = priorityOptions.find(p => p.value === task.priority)?.icon || Circle;
                return (
                  <div
                    key={task.id}
                    className="p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={task.status === 'completed'}
                        onCheckedChange={(checked) => {
                          updateTaskStatus.mutate({
                            taskId: task.id,
                            status: checked ? 'completed' : 'pending'
                          });
                        }}
                        className="mt-1"
                      />
                      <div className={`p-2 rounded-lg ${taskTypes.find(t => t.value === task.type)?.color || 'bg-gray-100 text-gray-800'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <PriorityIcon className={`w-4 h-4 ${task.priority === 'urgent' ? 'text-red-500' : task.priority === 'high' ? 'text-orange-500' : 'text-gray-400'}`} />
                            <Badge className={getStatusColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                          {task.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            {(task.customerName || task.leadName) && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.customerName || task.leadName}
                              </span>
                            )}
                            <span className={`flex items-center gap-1 ${getDueDateColor(task.dueDate, task.status)}`}>
                              <CalendarIcon className="w-3 h-3" />
                              {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                            </span>
                            {task.estimatedDuration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.estimatedDuration}m
                              </span>
                            )}
                          </div>
                          <span>Assigned to {task.assignedTo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredTasks.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No tasks found</p>
                  <p className="text-sm">Try adjusting your filters or create a new task</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <CreateTaskDialog />
      </div>
    </Layout>
  );
}
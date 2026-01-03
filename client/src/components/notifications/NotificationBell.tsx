import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Bell, 
  Check, 
  X, 
  ExternalLink, 
  Filter,
  Trash2,
  Settings,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  AlertTriangle,
  Mail,
  FileText,
  DollarSign,
  Calendar,
  User,
  CheckSquare,
  Zap,
} from "lucide-react";
import { NotificationPreferencesPanel } from "./NotificationPreferences";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  entityType?: string;
  entityId?: number;
  isRead: boolean;
  priority: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

export function NotificationBell() {
  const { user, tenant } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showRead, setShowRead] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch user notifications with filters
  const { data: notificationData, isLoading } = useQuery<NotificationResponse>({
    queryKey: [`notifications-user-${user?.id}`, tenant?.id, filterType, filterPriority, showRead],
    enabled: !!user?.id && !!tenant?.id,
    queryFn: async () => {
      const params = new URLSearchParams({
        includeRead: showRead ? "true" : "false",
        ...(filterType !== "all" && { type: filterType }),
        ...(filterPriority !== "all" && { priority: filterPriority }),
        limit: "50",
        offset: "0",
      });

      const response = await fetch(`/api/user/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
    refetchInterval: 30000, // Check for new notifications every 30 seconds
  });

  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest("PUT", `/api/user/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`notifications-user-${user?.id}`, tenant?.id] });
    }
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/user/notifications/mark-all-read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`notifications-user-${user?.id}`, tenant?.id] });
    }
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest("DELETE", `/api/user/notifications/${notificationId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`notifications-user-${user?.id}`, tenant?.id] });
    }
  });

  // Delete all read notifications
  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/user/notifications/read/all`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`notifications-user-${user?.id}`, tenant?.id] });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      lead_assigned: User,
      lead_updated: User,
      lead_converted: CheckCircle,
      lead_status_changed: AlertCircle,
      customer_created: User,
      customer_updated: User,
      customer_assigned: User,
      invoice_created: FileText,
      invoice_sent: Mail,
      invoice_paid: DollarSign,
      invoice_overdue: AlertTriangle,
      estimate_created: FileText,
      estimate_sent: Mail,
      estimate_accepted: CheckCircle,
      estimate_rejected: X,
      booking_created: Calendar,
      booking_confirmed: CheckCircle,
      booking_cancelled: X,
      expense_created: DollarSign,
      expense_approved: CheckCircle,
      expense_rejected: X,
      task_assigned: CheckSquare,
      task_completed: CheckCircle,
      task_overdue: AlertTriangle,
      followup_created: Calendar,
      followup_due: Clock,
      followup_completed: CheckCircle,
      payment_received: DollarSign,
      payment_failed: AlertTriangle,
      reminder: Clock,
      system: Info,
      assignment: User,
      mention: Zap,
      comment: FileText,
      file_uploaded: FileText,
      email_sent: Mail,
      email_failed: AlertTriangle,
      subscription_expiring: AlertCircle,
      subscription_expired: AlertTriangle,
      trial_expiring: AlertCircle,
      trial_expired: AlertTriangle,
    };
    return iconMap[type] || Bell;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      setIsOpen(false);
      setLocation(notification.actionUrl);
    }
  };

  const handleDelete = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notificationId);
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filterType !== "all" && notification.type !== filterType) return false;
    if (filterPriority !== "all" && notification.priority !== filterPriority) return false;
    return true;
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreferences(true)}
                  className="h-8 text-xs"
                  title="Notification Settings"
                >
                  <Settings className="h-3 w-3" />
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className="h-8 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                {notifications.filter(n => n.isRead).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAllReadMutation.mutate()}
                    disabled={deleteAllReadMutation.isPending}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Filters */}
          <div className="px-4 pt-3 pb-2 border-b space-y-2">
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lead_assigned">Lead Assigned</SelectItem>
                  <SelectItem value="invoice_paid">Invoice Paid</SelectItem>
                  <SelectItem value="invoice_overdue">Invoice Overdue</SelectItem>
                  <SelectItem value="task_assigned">Task Assigned</SelectItem>
                  <SelectItem value="task_overdue">Task Overdue</SelectItem>
                  <SelectItem value="followup_due">Follow-up Due</SelectItem>
                  <SelectItem value="payment_received">Payment Received</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showRead ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRead(!showRead)}
                className="h-7 text-xs"
              >
                {showRead ? "Show All" : "Unread Only"}
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-1">No notifications</p>
                  <p className="text-sm">
                    {filterType !== "all" || filterPriority !== "all" 
                      ? "Try adjusting your filters" 
                      : "You're all caught up!"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => {
                    const Icon = getTypeIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-muted/50 transition-colors relative group",
                          !notification.isRead && 'bg-blue-50/50 dark:bg-blue-950/20'
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg shrink-0",
                            !notification.isRead 
                              ? "bg-blue-100 dark:bg-blue-900/50" 
                              : "bg-muted"
                          )}>
                            <Icon className={cn(
                              "h-4 w-4",
                              !notification.isRead 
                                ? "text-blue-600 dark:text-blue-400" 
                                : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <h4 className={cn(
                                  "text-sm font-medium truncate",
                                  !notification.isRead 
                                    ? "text-blue-900 dark:text-blue-100" 
                                    : "text-foreground"
                                )}>
                                  {notification.title}
                                </h4>
                                <Badge 
                                  variant={getPriorityColor(notification.priority) as any} 
                                  className="text-xs shrink-0"
                                >
                                  {notification.priority}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={(e) => handleDelete(e, notification.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {notification.actionUrl && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
      
      <NotificationPreferencesPanel 
        open={showPreferences} 
        onOpenChange={setShowPreferences} 
      />
    </Popover>
  );
}


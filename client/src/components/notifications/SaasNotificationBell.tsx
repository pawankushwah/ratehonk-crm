import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Bell,
  Check,
  X,
  ExternalLink,
  MessageCircle,
  FileText,
  Info,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
import { cn } from "@/lib/utils";

interface SaasNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  priority: string;
  actionUrl?: string;
  createdAt: string;
}

function apiRequest(method: string, url: string) {
  const token = localStorage.getItem("saas_auth_token");
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))));
}

export function SaasNotificationBell() {
  const { user } = useSaasAuth();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const prevUnreadRef = useRef(0);
  const isInitialMount = useRef(true);

  const { data, isLoading } = useQuery({
    queryKey: ["saas-notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const params = new URLSearchParams({ includeRead: "true", limit: "50", offset: "0" });
      const token = localStorage.getItem("saas_auth_token");
      const r = await fetch(`/api/saas/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
    refetchInterval: 30000,
  });

  const notifications = (data?.notifications || []) as SaasNotification[];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevUnreadRef.current = unreadCount;
      return;
    }
    if (unreadCount > prevUnreadRef.current) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } catch (_) {}
      prevUnreadRef.current = unreadCount;
    } else {
      prevUnreadRef.current = unreadCount;
    }
  }, [unreadCount]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/saas/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saas-notifications"] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/saas/notifications/mark-all-read"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saas-notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/saas/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saas-notifications"] }),
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/saas/notifications/read/all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saas-notifications"] }),
  });

  const getTypeIcon = (type: string) => {
    const map: Record<string, any> = {
      support_ticket: MessageCircle,
      system: Info,
      alert: AlertCircle,
    };
    return map[type] || Bell;
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  };

  const handleClick = (n: SaasNotification) => {
    if (!n.isRead) markAsReadMutation.mutate(n.id);
    if (n.actionUrl) {
      setIsOpen(false);
      setLocation(n.actionUrl);
    }
  };

  if (!user?.id) return null;

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
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifications</CardTitle>
              <div className="flex items-center gap-1">
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
                {notifications.filter((n) => n.isRead).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAllReadMutation.mutate()}
                    disabled={deleteAllReadMutation.isPending}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((n) => {
                    const Icon = getTypeIcon(n.type);
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-muted/50 transition-colors relative group",
                          !n.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                        )}
                        onClick={() => handleClick(n)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-lg shrink-0",
                              !n.isRead ? "bg-blue-100 dark:bg-blue-900/50" : "bg-muted"
                            )}
                          >
                            <Icon className={cn("h-4 w-4", !n.isRead ? "text-blue-600" : "text-muted-foreground")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-2 mb-1">
                              <h4 className={cn("text-sm font-medium", !n.isRead && "text-blue-900 dark:text-blue-100")}>
                                {n.title}
                              </h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMutation.mutate(n.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">{formatTimeAgo(n.createdAt)}</span>
                              {n.actionUrl && <ExternalLink className="h-3 w-3" />}
                            </div>
                          </div>
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
    </Popover>
  );
}

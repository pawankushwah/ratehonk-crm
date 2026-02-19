import { useState } from "react";
import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_OPTIONS = [
  { value: "open", label: "Open", icon: AlertCircle },
  { value: "in_progress", label: "In Progress", icon: Clock },
  { value: "resolved", label: "Resolved", icon: CheckCircle2 },
  { value: "closed", label: "Closed", icon: XCircle },
];

function apiRequest(method: string, url: string, body?: any) {
  const token = localStorage.getItem("saas_auth_token");
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => {
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  });
}

export default function SaasSupportTickets() {
  const { user } = useSaasAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["/api/saas/support-tickets", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      return apiRequest("GET", `/api/saas/support-tickets?${params}`);
    },
    enabled: user?.role === "saas_owner",
  });

  const { data: ticketDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["/api/saas/support-tickets", selectedTicket?.id],
    queryFn: () => apiRequest("GET", `/api/saas/support-tickets/${selectedTicket.id}`),
    enabled: !!selectedTicket?.id,
  });

  const addReplyMutation = useMutation({
    mutationFn: (msg: string) =>
      apiRequest("POST", `/api/saas/support-tickets/${selectedTicket.id}/messages`, { message: msg }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/support-tickets"] });
      setReplyText("");
      toast({ title: "Reply sent" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      apiRequest("PUT", `/api/saas/support-tickets/${selectedTicket.id}/status`, { status }),
    onSuccess: (_data: any, status: string) => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/support-tickets"] });
      setSelectedTicket((p: any) => (p ? { ...p, status } : null));
      toast({ title: "Status updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    addReplyMutation.mutate(replyText.trim());
  };

  if (user?.role !== "saas_owner") {
    return (
      <SaasLayout>
        <div className="p-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">This page is only accessible to SaaS owners.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SaasLayout>
    );
  }

  return (
    <SaasLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground mt-2">View and respond to tenant support requests</p>
        </div>

        <div className="flex gap-4 mb-4">
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No support tickets yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Ticket #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Submitted By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tickets.map((t: any) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                          {t.ticket_number || t.ticketNumber}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium max-w-[200px] truncate" title={t.subject}>
                          {t.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>{t.tenantName || `Tenant ${t.tenant_id}`}</div>
                          <div className="text-xs text-muted-foreground">ID: {t.tenant_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>{t.user_name}</div>
                          <div className="text-xs text-muted-foreground">{t.user_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                          {t.category?.replace("_", " ") || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                          {t.priority || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={t.status === "open" ? "destructive" : "secondary"}>
                            {t.status?.replace("_", " ") || "-"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedTicket} onOpenChange={(o) => !o && setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTicket?.subject}</DialogTitle>
              <DialogDescription>
                {selectedTicket?.ticket_number} • {selectedTicket?.tenantName || `Tenant ${selectedTicket?.tenant_id}`}
              </DialogDescription>
            </DialogHeader>
            {selectedTicket && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Select
                    value={ticketDetail?.status ?? selectedTicket.status}
                    onValueChange={(v) => updateStatusMutation.mutate(v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {loadingDetail ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    (ticketDetail?.messages || []).map((m: any) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-lg ${
                          m.sender_type === "saas_owner"
                            ? "bg-blue-50 dark:bg-blue-950/30 ml-8"
                            : "bg-muted mr-8"
                        }`}
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {m.sender_name || m.sender_email} • {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                        </div>
                        <div className="whitespace-pre-wrap">{m.message}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || addReplyMutation.isPending}
                  >
                    {addReplyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SaasLayout>
  );
}

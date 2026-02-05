import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Play, Pause, Settings, Clock, Users, Mail, Zap, RefreshCw, Lightbulb, ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { EmailAutomation, InsertEmailAutomation } from "@shared/schema";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/components/auth/auth-provider";

// Match lead statuses from Leads page. "all" = every lead regardless of status (one automation for all).
const LEAD_STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
];

// Match invoice statuses from Invoices page (All Status dropdown)
const INVOICE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partially Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const INTERVAL_OPTIONS = [
  { value: 1, label: "Every 1 day" },
  { value: 2, label: "Every 2 days" },
  { value: 3, label: "Every 3 days" },
  { value: 5, label: "Every 5 days" },
  { value: 7, label: "Every 7 days" },
  { value: 10, label: "Every 10 days" },
  { value: 14, label: "Every 14 days" },
  { value: 30, label: "Every 30 days" },
  { value: 60, label: "Every 60 days" },
  { value: 90, label: "Every 90 days" },
];

// Recommended automation by lead status (stage-based best practices)
const STATUS_RECOMMENDATIONS: Record<string, { goal: string; tip: string }> = {
  all: {
    goal: "One automation for every lead",
    tip: "Sends follow-up emails to all leads (any status) at your chosen interval. Use a higher “min days in status” to avoid spamming brand-new leads.",
  },
  new: {
    goal: "Speed + first touch",
    tip: "Instant welcome is already sent on lead create. Add a follow-up (e.g. every 2 days) if no reply.",
  },
  contacted: {
    goal: "Get qualification / no-reply follow-up",
    tip: "E.g. Day 2 reminder, Day 5 second follow-up, Day 10 final check-in. Create one automation per step.",
  },
  qualified: {
    goal: "Move to proposal",
    tip: "Send product deck or demo link; follow up every 3–5 days until they move to Proposal.",
  },
  proposal: {
    goal: "Prevent deal stalling",
    tip: "Day 2 reminder, Day 5 value message, Day 10 “Any feedback?”. Create separate automations for each.",
  },
  negotiation: {
    goal: "Close faster",
    tip: "Short-interval reminders (every 1–2 days) or value emails while terms are discussed.",
  },
  closed_won: {
    goal: "Handoff + retention",
    tip: "Thank-you and onboarding; optional 30-day upsell. Use interval 30 days.",
  },
  closed_lost: {
    goal: "Re-engage later",
    tip: "Re-engagement after 60–90 days. Set interval to 60 or 90 and a “Still interested?” template.",
  },
};

export default function EmailAutomations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [createTriggerType, setCreateTriggerType] = useState<string>("lead_status_follow_up");
  const [createLeadStatus, setCreateLeadStatus] = useState("all");
  const [createInvoiceStatus, setCreateInvoiceStatus] = useState("pending");
  const [createTemplateId, setCreateTemplateId] = useState<string>("");
  const [createIntervalDays, setCreateIntervalDays] = useState(2);
  const [createMinDaysInStatus, setCreateMinDaysInStatus] = useState(0);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { toast } = useToast();
  const { tenant } = useAuth();
  const tenantId = tenant?.id ?? 1;

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["/api/tenants", tenantId, "email-automations"],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/tenants/${tenantId}/email-automations`);
      return r.json() as Promise<EmailAutomation[]>;
    },
    enabled: !!tenantId,
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/email-templates`],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`/api/tenants/${tenantId}/email-templates`, {
        credentials: "include",
        headers,
      });
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!tenantId,
  });

  const createAutomationMutation = useMutation({
    mutationFn: (data: InsertEmailAutomation & { triggerConditions?: Record<string, unknown> }) =>
      apiRequest("POST", `/api/tenants/${tenantId}/email-automations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", tenantId, "email-automations"] });
      setIsCreatePanelOpen(false);
      setCreateTemplateId("");
      setCreateLeadStatus("all");
      setCreateInvoiceStatus("pending");
      setCreateIntervalDays(2);
      setCreateMinDaysInStatus(0);
      toast({
        title: "Automation Created!",
        description: "Your follow-up automation is active. Emails will be sent based on the schedule.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create automation",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PATCH", `/api/tenants/${tenantId}/email-automations/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", tenantId, "email-automations"] });
      toast({
        title: "Automation Updated",
        description: "The automation status has been changed.",
      });
    },
  });

  const handleCreateAutomation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    if (!name) return;

    if (createTriggerType === "lead_status_follow_up") {
      if (!createTemplateId) {
        toast({ title: "Select an email template", variant: "destructive" });
        return;
      }
      const automationData: InsertEmailAutomation & { triggerConditions?: Record<string, unknown> } = {
        tenantId,
        name,
        description: description || undefined,
        triggerType: "lead_status_follow_up",
        triggerConditions: {
          leadStatus: createLeadStatus,
          intervalDays: createIntervalDays,
          minDaysInStatus: createMinDaysInStatus || 0,
        },
        isActive: true,
        emailTemplateId: parseInt(createTemplateId, 10),
        delayHours: 0,
      };
      createAutomationMutation.mutate(automationData);
      return;
    }

    if (createTriggerType === "invoice_status_follow_up") {
      if (!createTemplateId) {
        toast({ title: "Select an email template", variant: "destructive" });
        return;
      }
      const automationData: InsertEmailAutomation & { triggerConditions?: Record<string, unknown> } = {
        tenantId,
        name,
        description: description || undefined,
        triggerType: "invoice_status_follow_up",
        triggerConditions: {
          invoiceStatus: createInvoiceStatus,
          intervalDays: createIntervalDays,
          minDaysInStatus: createMinDaysInStatus || 0,
        },
        isActive: true,
        emailTemplateId: parseInt(createTemplateId, 10),
        delayHours: 0,
      };
      createAutomationMutation.mutate(automationData);
      return;
    }

    const automationData: InsertEmailAutomation = {
      tenantId,
      name,
      description: description || undefined,
      triggerType: createTriggerType,
      triggerConditions: {
        delay: parseInt((formData.get("delayHours") as string) || "0", 10) || 0,
        condition: (formData.get("condition") as string) || "",
      },
      delayHours: parseInt((formData.get("delayHours") as string) || "0", 10) || 0,
      isActive: true,
    };
    createAutomationMutation.mutate(automationData);
  };

  const filteredAutomations = Array.isArray(automations)
    ? automations.filter(
        (automation: EmailAutomation) =>
          automation.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          automation.triggerType?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      customer_signup: "Customer Signup",
      booking_confirmed: "Booking Confirmed",
      lead_created: "New Lead",
      lead_status_follow_up: "Lead status follow-up",
      invoice_status_follow_up: "Invoice status follow-up",
      date_based: "Date-Based",
      behavior_based: "Behavior-Based",
    };
    return labels[type] || type;
  };

  const getTriggerIcon = (type: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      customer_signup: Users,
      booking_confirmed: Mail,
      lead_created: Zap,
      lead_status_follow_up: RefreshCw,
      invoice_status_follow_up: FileText,
      date_based: Clock,
      behavior_based: Settings,
    };
    const Icon = icons[type] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const getLeadStatusLabel = (value: string) => LEAD_STATUSES.find((s) => s.value === value)?.label ?? value;
  const getInvoiceStatusLabel = (value: string) => INVOICE_STATUSES.find((s) => s.value === value)?.label ?? value;
  const getIntervalLabel = (days: number) => INTERVAL_OPTIONS.find((o) => o.value === days)?.label ?? `Every ${days} days`;

  const formatAutomationSummary = (a: EmailAutomation) => {
    const cond = (a.triggerConditions || {}) as { leadStatus?: string; invoiceStatus?: string; intervalDays?: number; minDaysInStatus?: number };
    if (a.triggerType === "lead_status_follow_up" && (cond.leadStatus != null || cond.intervalDays != null)) {
      const parts = [];
      if (cond.leadStatus) parts.push(getLeadStatusLabel(cond.leadStatus));
      if (cond.intervalDays) parts.push(getIntervalLabel(cond.intervalDays));
      if (cond.minDaysInStatus) parts.push(`after ${cond.minDaysInStatus} days in status`);
      return parts.join(" · ");
    }
    if (a.triggerType === "invoice_status_follow_up" && (cond.invoiceStatus != null || cond.intervalDays != null)) {
      const parts = [];
      if (cond.invoiceStatus) parts.push(getInvoiceStatusLabel(cond.invoiceStatus));
      if (cond.intervalDays) parts.push(getIntervalLabel(cond.intervalDays));
      if (cond.minDaysInStatus) parts.push(`after ${cond.minDaysInStatus} days in status`);
      return parts.join(" · ");
    }
    if (a.delayHours > 0) return `${a.delayHours}h delay`;
    return null;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
              Email Automations
            </h1>
            <p className="text-muted-foreground">
              Follow-up emails for leads by status (e.g. every 1, 2, or 7 days). Enable or disable per automation.
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => {
              setIsCreatePanelOpen(true);
              queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenantId}/email-templates`] });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Automation
          </Button>
          <Sheet open={isCreatePanelOpen} onOpenChange={setIsCreatePanelOpen}>
            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Create Email Automation</SheetTitle>
                <SheetDescription>
                  Send automated follow-up emails to leads in a given status at your chosen interval.
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleCreateAutomation} className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Automation Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. Pending leads – every 2 days"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trigger Type</Label>
                    <Select
                      value={createTriggerType}
                      onValueChange={setCreateTriggerType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead_status_follow_up">Lead status follow-up</SelectItem>
                        <SelectItem value="invoice_status_follow_up">Invoice status follow-up</SelectItem>
                        <SelectItem value="customer_signup">Customer Signup</SelectItem>
                        <SelectItem value="booking_confirmed">Booking Confirmed</SelectItem>
                        <SelectItem value="lead_created">New Lead</SelectItem>
                        <SelectItem value="date_based">Date-Based</SelectItem>
                        <SelectItem value="behavior_based">Behavior-Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="e.g. Remind pending leads every 2 days"
                    className="resize-none"
                  />
                </div>

                {createTriggerType === "lead_status_follow_up" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Lead status</Label>
                        <Select value={createLeadStatus} onValueChange={setCreateLeadStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="e.g. Contacted" />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {STATUS_RECOMMENDATIONS[createLeadStatus] && (
                          <p className="text-xs text-muted-foreground">
                            {STATUS_RECOMMENDATIONS[createLeadStatus].goal}: {STATUS_RECOMMENDATIONS[createLeadStatus].tip}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Email template</Label>
                        <Select
                          value={createTemplateId || (templates.length === 0 ? "__none__" : "")}
                          onValueChange={(v) => v !== "__none__" && setCreateTemplateId(v)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={templatesLoading ? "Loading…" : "Select template"} />
                          </SelectTrigger>
                          <SelectContent>
                            {templatesLoading ? (
                              <SelectItem value="__loading__" disabled>Loading templates…</SelectItem>
                            ) : (templates as { id: number; name: string }[]).length === 0 ? (
                              <SelectItem value="__none__" disabled>No templates — create one in Email Templates</SelectItem>
                            ) : (
                              (templates as { id: number; name: string }[]).map((t) => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                  {t.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {!templatesLoading && (templates as { id: number; name: string }[]).length === 0 && (
                          <p className="text-xs text-muted-foreground">Create templates at Settings → Email Templates (or the Email Templates page).</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Send interval</Label>
                        <Select
                          value={String(createIntervalDays)}
                          onValueChange={(v) => setCreateIntervalDays(parseInt(v, 10))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INTERVAL_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={String(o.value)}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minDaysInStatus">Min days in status (optional)</Label>
                        <Input
                          id="minDaysInStatus"
                          type="number"
                          min={0}
                          value={createMinDaysInStatus || ""}
                          onChange={(e) => setCreateMinDaysInStatus(parseInt(e.target.value, 10) || 0)}
                          placeholder="0"
                        />
                        <p className="text-xs text-muted-foreground">Only send after lead has been in this status for at least N days</p>
                      </div>
                    </div>
                  </>
                )}

                {createTriggerType === "invoice_status_follow_up" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Invoice status</Label>
                        <Select value={createInvoiceStatus} onValueChange={setCreateInvoiceStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="e.g. Pending" />
                          </SelectTrigger>
                          <SelectContent>
                            {INVOICE_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Send to customers with invoices in this status (e.g. Pending or Overdue)</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Email template</Label>
                        <Select
                          value={createTemplateId || (templates.length === 0 ? "__none__" : "")}
                          onValueChange={(v) => v !== "__none__" && setCreateTemplateId(v)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={templatesLoading ? "Loading…" : "Select template"} />
                          </SelectTrigger>
                          <SelectContent>
                            {templatesLoading ? (
                              <SelectItem value="__loading__" disabled>Loading templates…</SelectItem>
                            ) : (templates as { id: number; name: string }[]).length === 0 ? (
                              <SelectItem value="__none__" disabled>No templates — create one in Email Templates</SelectItem>
                            ) : (
                              (templates as { id: number; name: string }[]).map((t) => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                  {t.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {!templatesLoading && (templates as { id: number; name: string }[]).length === 0 && (
                          <p className="text-xs text-muted-foreground">Create templates at Settings → Email Templates (or the Email Templates page).</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Send interval</Label>
                        <Select
                          value={String(createIntervalDays)}
                          onValueChange={(v) => setCreateIntervalDays(parseInt(v, 10))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INTERVAL_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={String(o.value)}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minDaysInvoiceStatus">Min days in status (optional)</Label>
                        <Input
                          id="minDaysInvoiceStatus"
                          type="number"
                          min={0}
                          value={createMinDaysInStatus || ""}
                          onChange={(e) => setCreateMinDaysInStatus(parseInt(e.target.value, 10) || 0)}
                          placeholder="0"
                        />
                        <p className="text-xs text-muted-foreground">Only send after invoice has been in this status for at least N days</p>
                      </div>
                    </div>
                  </>
                )}

                {createTriggerType !== "lead_status_follow_up" && createTriggerType !== "invoice_status_follow_up" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delayHours">Delay (Hours)</Label>
                      <Input id="delayHours" name="delayHours" type="number" placeholder="0" min={0} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Input id="condition" name="condition" placeholder="After signup" />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreatePanelOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAutomationMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {createAutomationMutation.isPending ? "Creating..." : "Create Automation"}
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card className="border-dashed">
          <button
            type="button"
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Recommended automations by lead status
            </span>
            {showRecommendations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showRecommendations && (
            <CardContent className="pt-0 pb-4 px-4">
              <p className="text-sm text-muted-foreground mb-3">
                Stage-based follow-ups that match your pipeline. Create one automation per step (e.g. Day 2, Day 5, Day 10 for no-reply).
              </p>
              <ul className="space-y-2 text-sm">
                {LEAD_STATUSES.map((s) => {
                  const rec = STATUS_RECOMMENDATIONS[s.value];
                  if (!rec) return null;
                  return (
                    <li key={s.value} className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{s.label}</span>
                      <span className="text-muted-foreground">{rec.goal} — {rec.tip}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          )}
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Active</span>
                <Zap className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {filteredAutomations.filter((a: EmailAutomation) => a.isActive).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <Settings className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{filteredAutomations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Follow-up type</span>
                <RefreshCw className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {filteredAutomations.filter((a: EmailAutomation) => a.triggerType === "lead_status_follow_up").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {filteredAutomations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create a lead status follow-up: choose a status (e.g. Contacted), an email template, and how often to send (e.g. every 2 days).
                </p>
                <Button
                  onClick={() => setIsCreatePanelOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first automation
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAutomations.map((automation: EmailAutomation & { templateName?: string; templateSubject?: string }) => (
              <Card key={automation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                        {getTriggerIcon(automation.triggerType)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{automation.name}</h3>
                        <p className="text-muted-foreground">{automation.description}</p>
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {getTriggerTypeLabel(automation.triggerType)}
                          </Badge>
                          {formatAutomationSummary(automation) && (
                            <Badge variant="secondary" className="text-xs">
                              {formatAutomationSummary(automation)}
                            </Badge>
                          )}
                          {automation.templateName && (
                            <Badge variant="outline" className="text-xs">
                              <Mail className="h-3 w-3 mr-1" />
                              {automation.templateName}
                            </Badge>
                          )}
                          {automation.triggerType !== "lead_status_follow_up" && automation.delayHours > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {automation.delayHours}h delay
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={automation.isActive ? "default" : "secondary"}
                        className={
                          automation.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }
                      >
                        {automation.isActive ? "Active" : "Paused"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAutomationMutation.mutate(automation.id)}
                        disabled={toggleAutomationMutation.isPending}
                      >
                        {automation.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

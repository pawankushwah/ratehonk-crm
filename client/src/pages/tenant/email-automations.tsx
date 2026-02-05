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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Play, Pause, Settings, Clock, Users, Mail, Zap, RefreshCw } from "lucide-react";
import type { EmailAutomation, InsertEmailAutomation } from "@shared/schema";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/components/auth/auth-provider";

const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "pending", label: "Pending" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
];

const INTERVAL_OPTIONS = [
  { value: 1, label: "Every 1 day" },
  { value: 2, label: "Every 2 days" },
  { value: 3, label: "Every 3 days" },
  { value: 7, label: "Every 7 days" },
  { value: 14, label: "Every 14 days" },
];

export default function EmailAutomations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createTriggerType, setCreateTriggerType] = useState<string>("lead_status_follow_up");
  const [createLeadStatus, setCreateLeadStatus] = useState("new");
  const [createTemplateId, setCreateTemplateId] = useState<string>("");
  const [createIntervalDays, setCreateIntervalDays] = useState(2);
  const [createMinDaysInStatus, setCreateMinDaysInStatus] = useState(0);
  const { toast } = useToast();
  const { tenant } = useAuth();
  const tenantId = tenant?.id ?? 1;

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["/api/tenants", tenantId, "email-automations"],
    queryFn: () => apiRequest(`/api/tenants/${tenantId}/email-automations`).then((r) => r as EmailAutomation[]),
    enabled: !!tenantId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["/api/tenants", tenantId, "email-templates"],
    queryFn: () => apiRequest(`/api/tenants/${tenantId}/email-templates`).then((r) => (Array.isArray(r) ? r : [])),
    enabled: !!tenantId && isCreateDialogOpen,
  });

  const createAutomationMutation = useMutation({
    mutationFn: (data: InsertEmailAutomation & { triggerConditions?: Record<string, unknown> }) =>
      apiRequest(`/api/tenants/${tenantId}/email-automations`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", tenantId, "email-automations"] });
      setIsCreateDialogOpen(false);
      setCreateTemplateId("");
      setCreateLeadStatus("new");
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
      apiRequest(`/api/tenants/${tenantId}/email-automations/${id}/toggle`, {
        method: "PATCH",
      }),
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
      date_based: Clock,
      behavior_based: Settings,
    };
    const Icon = icons[type] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const getLeadStatusLabel = (value: string) => LEAD_STATUSES.find((s) => s.value === value)?.label ?? value;
  const getIntervalLabel = (days: number) => INTERVAL_OPTIONS.find((o) => o.value === days)?.label ?? `Every ${days} days`;

  const formatAutomationSummary = (a: EmailAutomation) => {
    const cond = (a.triggerConditions || {}) as { leadStatus?: string; intervalDays?: number; minDaysInStatus?: number };
    if (a.triggerType === "lead_status_follow_up" && (cond.leadStatus != null || cond.intervalDays != null)) {
      const parts = [];
      if (cond.leadStatus) parts.push(getLeadStatusLabel(cond.leadStatus));
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Automation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Email Automation</DialogTitle>
                <DialogDescription>
                  Send automated follow-up emails to leads in a given status at your chosen interval.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAutomation} className="space-y-4">
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
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Email template</Label>
                        <Select value={createTemplateId} onValueChange={setCreateTemplateId} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {(templates as { id: number; name: string }[]).map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                {t.name}
                              </SelectItem>
                            ))}
                            {Array.isArray(templates) && templates.length === 0 && (
                              <SelectItem value="" disabled>
                                No templates – create one in Email Templates
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
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

                {createTriggerType !== "lead_status_follow_up" && (
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

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
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
            </DialogContent>
          </Dialog>
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
                  Create a lead status follow-up: choose a status (e.g. Pending), an email template, and how often to send (e.g. every 2 days).
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
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

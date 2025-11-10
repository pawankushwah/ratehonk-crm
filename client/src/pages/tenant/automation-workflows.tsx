import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Settings, Zap, Mail, Bell, Calendar, User, Play, Pause, Edit, Trash2, Clock, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const workflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  triggerType: z.enum(["lead_score_change", "status_change", "time_based", "behavior"]),
  triggerConditions: z.object({
    minScore: z.number().optional(),
    maxScore: z.number().optional(),
    fromStatus: z.string().optional(),
    toStatus: z.string().optional(),
    behaviorType: z.string().optional(),
    minOccurrences: z.number().optional(),
  }),
  actions: z.array(z.object({
    type: z.enum(["send_email", "update_status", "assign_task", "schedule_follow_up"]),
    config: z.any(),
    delay: z.number().optional(),
  })),
  isActive: z.boolean().default(true),
});

const emailActionSchema = z.object({
  subject: z.string().min(1, "Email subject is required"),
  htmlContent: z.string().min(1, "Email content is required"),
  textContent: z.string().optional(),
});

const taskActionSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDateHours: z.number().min(1).max(168), // 1 hour to 1 week
});

export default function AutomationWorkflows() {
  const { tenant } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof workflowSchema>>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: "",
      description: "",
      triggerType: "lead_score_change",
      triggerConditions: {},
      actions: [],
      isActive: true,
    },
  });

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/automation-workflows`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/automation-workflows`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch workflows");
      return response.json();
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: z.infer<typeof workflowSchema>) => {
      return apiRequest("POST", `/api/tenants/${tenant?.id}/automation-workflows`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/automation-workflows`] });
      toast({ title: "Success", description: "Automation workflow created successfully" });
      setIsDialogOpen(false);
      form.reset();
      setCurrentStep(1);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create workflow",
        variant: "destructive",
      });
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/tenants/${tenant?.id}/automation-workflows/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/automation-workflows`] });
      toast({ title: "Success", description: "Workflow status updated" });
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/tenants/${tenant?.id}/automation-workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/automation-workflows`] });
      toast({ title: "Success", description: "Workflow deleted successfully" });
    },
  });

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'lead_score_change': return <TrendingUp className="h-4 w-4" />;
      case 'status_change': return <Target className="h-4 w-4" />;
      case 'time_based': return <Clock className="h-4 w-4" />;
      case 'behavior': return <User className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email': return <Mail className="h-4 w-4" />;
      case 'assign_task': return <Bell className="h-4 w-4" />;
      case 'schedule_follow_up': return <Calendar className="h-4 w-4" />;
      case 'update_status': return <Settings className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const renderTriggerConfig = () => {
    const triggerType = form.watch("triggerType");

    switch (triggerType) {
      case "lead_score_change":
        return (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="triggerConditions.minScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Score</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="70" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="triggerConditions.maxScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Score</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="100" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "status_change":
        return (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="triggerConditions.fromStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="triggerConditions.toStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return <p className="text-sm text-gray-500">Additional configuration options will appear based on trigger type.</p>;
    }
  };

  const addAction = (type: string) => {
    const currentActions = form.getValues("actions");
    const newAction = {
      type,
      config: {},
      delay: 0,
    };
    form.setValue("actions", [...currentActions, newAction]);
  };

  const removeAction = (index: number) => {
    const currentActions = form.getValues("actions");
    currentActions.splice(index, 1);
    form.setValue("actions", currentActions);
  };

  const onSubmit = (data: z.infer<typeof workflowSchema>) => {
    createWorkflowMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Automation Workflows</h1>
            <p className="text-gray-600">Set up automated responses to lead behavior and scoring changes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Automation Workflow</DialogTitle>
                <DialogDescription>
                  Set up automated actions based on lead behavior and scoring
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Step 1: Basic Info */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Workflow Information</h3>
                      
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Workflow Name</FormLabel>
                            <FormControl>
                              <Input placeholder="High Score Welcome Email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Send welcome email when lead score reaches 70+" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button type="button" onClick={() => setCurrentStep(2)}>
                          Next: Configure Trigger
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Trigger Configuration */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Trigger Configuration</h3>
                      
                      <FormField
                        control={form.control}
                        name="triggerType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trigger Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="lead_score_change">Lead Score Change</SelectItem>
                                <SelectItem value="status_change">Status Change</SelectItem>
                                <SelectItem value="time_based">Time Based</SelectItem>
                                <SelectItem value="behavior">Behavior Trigger</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {renderTriggerConfig()}

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                          Back
                        </Button>
                        <Button type="button" onClick={() => setCurrentStep(3)}>
                          Next: Configure Actions
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Actions Configuration */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Actions Configuration</h3>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={() => addAction("send_email")}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                        <Button type="button" variant="outline" onClick={() => addAction("assign_task")}>
                          <Bell className="h-4 w-4 mr-2" />
                          Create Task
                        </Button>
                        <Button type="button" variant="outline" onClick={() => addAction("schedule_follow_up")}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Follow-up
                        </Button>
                        <Button type="button" variant="outline" onClick={() => addAction("update_status")}>
                          <Settings className="h-4 w-4 mr-2" />
                          Update Status
                        </Button>
                      </div>

                      {/* Action List */}
                      {form.watch("actions").map((action, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                {getActionIcon(action.type)}
                                <CardTitle className="text-sm">{action.type.replace('_', ' ').toUpperCase()}</CardTitle>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeAction(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {action.type === "send_email" && (
                              <div className="space-y-2">
                                <Input placeholder="Email Subject" />
                                <Textarea placeholder="Email Content (HTML)" />
                              </div>
                            )}
                            {action.type === "assign_task" && (
                              <div className="space-y-2">
                                <Input placeholder="Task Title" />
                                <Input placeholder="Description" />
                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Activate Workflow</FormLabel>
                              <FormDescription>
                                Enable this workflow to start processing automatically
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                          Back
                        </Button>
                        <Button type="submit" disabled={createWorkflowMutation.isPending}>
                          {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workflows List */}
        <div className="grid gap-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No automation workflows yet</h3>
                <p className="text-gray-500 text-center mb-4">
                  Create your first automation workflow to start nurturing leads automatically
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            workflows.map((workflow: any) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle>{workflow.name}</CardTitle>
                        <Badge variant={workflow.isActive ? "default" : "secondary"}>
                          {workflow.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{workflow.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={workflow.isActive}
                        onCheckedChange={(checked) => 
                          toggleWorkflowMutation.mutate({ id: workflow.id, isActive: checked })
                        }
                      />
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Trigger */}
                    <div className="flex items-center space-x-2">
                      {getTriggerIcon(workflow.trigger.type)}
                      <span className="text-sm font-medium">Trigger:</span>
                      <span className="text-sm text-gray-600">{workflow.trigger.name}</span>
                    </div>

                    {/* Actions */}
                    <div>
                      <span className="text-sm font-medium">Actions:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {workflow.actions.map((action: any, index: number) => (
                          <Badge key={index} variant="outline" className="flex items-center space-x-1">
                            {getActionIcon(action.type)}
                            <span>{action.type.replace('_', ' ')}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex space-x-4 text-sm text-gray-500">
                      <span>Executed: {workflow.executionCount || 0} times</span>
                      <span>Last run: {workflow.lastExecuted ? new Date(workflow.lastExecuted).toLocaleDateString() : 'Never'}</span>
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
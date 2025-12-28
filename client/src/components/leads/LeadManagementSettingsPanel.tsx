import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Save, RefreshCw } from "lucide-react";

// Schema for lead management settings
const leadManagementSchema = z.object({
  leadScoringEnabled: z.boolean(),
  autoLeadAssignment: z.boolean(),
  autoAssignmentPriorityRoleId: z.number().nullable().optional(),
  duplicateDetection: z.boolean(),
});

type LeadManagementSettings = z.infer<typeof leadManagementSchema>;

interface LeadManagementSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadManagementSettingsPanel({
  open,
  onOpenChange,
}: LeadManagementSettingsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  const tenantId = tenant?.id;

  // Fetch roles for auto-assignment priority role dropdown
  const { data: roles = [] } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/roles`],
    queryFn: async () => {
      if (!tenantId) return [];
      const res = await fetch(`/api/tenants/${tenantId}/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!tenantId && open,
  });

  // Fetch current system settings
  const { data: systemData, isLoading: systemLoading } = useQuery({
    queryKey: ["/api/system/settings"],
    enabled: open,
  });

  const form = useForm<LeadManagementSettings>({
    resolver: zodResolver(leadManagementSchema),
    defaultValues: {
      leadScoringEnabled: true,
      autoLeadAssignment: false,
      autoAssignmentPriorityRoleId: null,
      duplicateDetection: true,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (systemData) {
      form.reset({
        leadScoringEnabled: (systemData as any).leadScoringEnabled !== false,
        autoLeadAssignment: (systemData as any).autoLeadAssignment === true,
        autoAssignmentPriorityRoleId: (systemData as any).autoAssignmentPriorityRoleId || null,
        duplicateDetection: (systemData as any).duplicateDetection !== false,
      });
    }
  }, [systemData, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: LeadManagementSettings) => {
      const token = localStorage.getItem("auth_token");
      
      // Update auto-assignment priority role separately via dedicated endpoint
      if (data.autoAssignmentPriorityRoleId !== undefined) {
        try {
          await apiRequest("PUT", "/api/tenant-settings/auto-assignment", {
            autoAssignmentPriorityRoleId: data.autoAssignmentPriorityRoleId,
          });
        } catch (error) {
          console.error("Failed to update auto-assignment priority role:", error);
          // Don't throw - continue with other settings
        }
      }

      // Update other system settings
      const { autoAssignmentPriorityRoleId, ...otherSettings } = data;
      const response = await fetch("/api/system/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(otherSettings),
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Update system settings error:", errorData);
        throw new Error("Failed to update system settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Lead management settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/system/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-settings"] });
    },
    onError: () => {
      toast({
        title: "Failed to update lead management settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeadManagementSettings) => {
    updateMutation.mutate(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[640px] lg:w-[800px] xl:w-[900px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Lead Management Settings
          </SheetTitle>
          <SheetDescription>
            Configure lead scoring and assignment settings
          </SheetDescription>
        </SheetHeader>

        {systemLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Lead Management
                  </CardTitle>
                  <CardDescription>
                    Configure lead scoring and assignment settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="leadScoringEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Lead Scoring
                            </FormLabel>
                            <FormDescription>
                              Automatically score leads based on behavior and
                              attributes
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="autoLeadAssignment"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Auto Lead Assignment
                            </FormLabel>
                            <FormDescription>
                              Automatically assign leads to team members based
                              on rules
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="autoAssignmentPriorityRoleId"
                      render={({ field }) => (
                        <FormItem className="rounded-lg border p-4">
                          <div className="space-y-3">
                            <div>
                              <FormLabel className="text-base">
                                Auto-Assignment Priority Role
                              </FormLabel>
                              <FormDescription>
                                Select which role should receive leads first when auto-assigning. 
                                Leads will be distributed evenly among users with this role based on workload.
                                Leave empty to use default assignment logic.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Select
                                value={field.value?.toString() || "none"}
                                onValueChange={(value) => {
                                  field.onChange(value === "none" ? null : parseInt(value));
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority role (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None (Use Default Logic)</SelectItem>
                                  {Array.isArray(roles) && roles.map((role: any) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      {role.name}
                                      {role.isDefault && " (Owner)"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            {field.value && (
                              <p className="text-sm text-muted-foreground">
                                Selected role: {roles.find((r: any) => r.id === field.value)?.name || 'Unknown'}
                              </p>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duplicateDetection"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Duplicate Detection
                            </FormLabel>
                            <FormDescription>
                              Prevent duplicate leads from being created
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Settings
                </Button>
              </div>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}


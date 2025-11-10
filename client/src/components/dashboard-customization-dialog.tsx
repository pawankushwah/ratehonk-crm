import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Eye, EyeOff, BarChart3, Users, DollarSign, TrendingUp, Activity, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DashboardComponent {
  key: string;
  label: string;
  description: string;
  icon: any;
  isVisible: boolean;
  customOrder: number;
}

interface DashboardCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_COMPONENTS: Omit<DashboardComponent, 'isVisible' | 'customOrder'>[] = [
  {
    key: "metrics-cards",
    label: "Metrics Cards",
    description: "Key performance indicators and metrics overview",
    icon: BarChart3
  },
  {
    key: "bookings-chart",
    label: "Booking & Leads Trends",
    description: "Financial analytics chart with booking and lead trends",
    icon: TrendingUp
  },
  {
    key: "recent-activities",
    label: "Recent Activities",
    description: "Latest customer activities and interactions",
    icon: Activity
  },
  {
    key: "leads-chart",
    label: "Lead Sources Chart",
    description: "Pie chart showing lead distribution by source",
    icon: Users
  },
  {
    key: "revenue-chart",
    label: "Revenue Analytics",
    description: "Monthly revenue breakdown and trends",
    icon: DollarSign
  },
  {
    key: "upcoming-events",
    label: "Calendar & Events",
    description: "Upcoming bookings and scheduled events",
    icon: Calendar
  }
];

export function DashboardCustomizationDialog({ open, onOpenChange }: DashboardCustomizationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [components, setComponents] = useState<DashboardComponent[]>([]);

  // Fetch current dashboard preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/dashboard/preferences'],
    enabled: open,
  });

  // Initialize components when preferences are loaded
  useEffect(() => {
    if (preferences) {
      const preferencesMap = new Map(preferences.map((p: any) => [p.component_key, p]));
      
      const initializedComponents = DEFAULT_COMPONENTS.map((comp, index) => {
        const pref = preferencesMap.get(comp.key);
        return {
          ...comp,
          isVisible: pref ? pref.is_visible : true,
          customOrder: pref ? pref.custom_order : index
        };
      });

      // Sort by custom order
      initializedComponents.sort((a, b) => a.customOrder - b.customOrder);
      setComponents(initializedComponents);
    } else {
      // Initialize with defaults
      const defaultComponents = DEFAULT_COMPONENTS.map((comp, index) => ({
        ...comp,
        isVisible: true,
        customOrder: index
      }));
      setComponents(defaultComponents);
    }
  }, [preferences]);

  // Mutation to update preferences
  const updatePreferenceMutation = useMutation({
    mutationFn: async (data: { componentKey: string; isVisible: boolean; customOrder: number }) => {
      return apiRequest(`/api/dashboard/preferences/${data.componentKey}`, {
        method: 'PUT',
        body: {
          isVisible: data.isVisible,
          customOrder: data.customOrder
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/preferences'] });
      // Trigger dashboard refresh by invalidating dashboard data
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/chart-data'] });
    },
    onError: (error) => {
      console.error('Error updating preference:', error);
      toast({
        title: "Error",
        description: "Failed to update dashboard preferences. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleToggleVisibility = async (componentKey: string) => {
    const updatedComponents = components.map(comp => 
      comp.key === componentKey 
        ? { ...comp, isVisible: !comp.isVisible }
        : comp
    );
    setComponents(updatedComponents);

    const component = updatedComponents.find(c => c.key === componentKey);
    if (component) {
      await updatePreferenceMutation.mutateAsync({
        componentKey,
        isVisible: component.isVisible,
        customOrder: component.customOrder
      });

      toast({
        title: component.isVisible ? "Component Shown" : "Component Hidden",
        description: `${component.label} has been ${component.isVisible ? 'shown' : 'hidden'} on your dashboard.`,
      });
    }
  };

  const handleResetToDefaults = async () => {
    const defaultComponents = DEFAULT_COMPONENTS.map((comp, index) => ({
      ...comp,
      isVisible: true,
      customOrder: index
    }));
    setComponents(defaultComponents);

    // Update all preferences to default
    for (const comp of defaultComponents) {
      await updatePreferenceMutation.mutateAsync({
        componentKey: comp.key,
        isVisible: comp.isVisible,
        customOrder: comp.customOrder
      });
    }

    toast({
      title: "Reset Complete",
      description: "Dashboard preferences have been reset to default settings.",
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" data-testid="dialog-dashboard-customization">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Dashboard Customization
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0BBCD6]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-dashboard-customization">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Customization
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Customize which components are visible on your dashboard. Changes are saved automatically.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {components.map((component) => {
            const IconComponent = component.icon;
            return (
              <Card key={component.key} className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${component.isVisible ? 'bg-[#0BBCD6]/10 text-[#0BBCD6]' : 'bg-gray-100 text-gray-400'}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label 
                            htmlFor={`toggle-${component.key}`}
                            className={`font-medium cursor-pointer ${component.isVisible ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                          >
                            {component.label}
                          </Label>
                          {component.isVisible ? (
                            <Eye className="h-4 w-4 text-green-500" data-testid={`icon-visible-${component.key}`} />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" data-testid={`icon-hidden-${component.key}`} />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {component.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={`toggle-${component.key}`}
                      checked={component.isVisible}
                      onCheckedChange={() => handleToggleVisibility(component.key)}
                      disabled={updatePreferenceMutation.isPending}
                      data-testid={`switch-${component.key}`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={updatePreferenceMutation.isPending}
            data-testid="button-reset-defaults"
          >
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
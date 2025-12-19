import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Settings, 
  Eye, 
  EyeOff, 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Calendar,
  RefreshCw,
  BookOpen,
  UserCheck,
  CreditCard,
  FileText,
  Building2,
  MessageSquare,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DashboardComponent {
  key: string;
  label: string;
  description: string;
  icon: any;
  permissionKey: string; // Role-based permission key
  isVisible: boolean;
  hasPermission: boolean; // Whether user has role-based permission
}

interface DashboardSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// All dashboard components with their permission keys
const DASHBOARD_COMPONENTS: Omit<DashboardComponent, 'isVisible' | 'hasPermission'>[] = [
  {
    key: "dashboard.revenue",
    label: "Revenue Card",
    description: "Total revenue metric card",
    icon: DollarSign,
    permissionKey: "dashboard.revenue"
  },
  {
    key: "dashboard.bookings",
    label: "Bookings/Invoices Card",
    description: "Total invoices metric card",
    icon: BookOpen,
    permissionKey: "dashboard.bookings"
  },
  {
    key: "dashboard.customers",
    label: "Customers Card",
    description: "Total customers metric card",
    icon: Users,
    permissionKey: "dashboard.customers"
  },
  {
    key: "dashboard.leads",
    label: "Leads Card",
    description: "Total leads metric card",
    icon: UserCheck,
    permissionKey: "dashboard.leads"
  },
  {
    key: "dashboard.revenue-chart",
    label: "Revenue Chart",
    description: "Revenue analytics chart",
    icon: TrendingUp,
    permissionKey: "dashboard.revenue-chart"
  },
  {
    key: "dashboard.profit-loss",
    label: "Profit & Loss Card",
    description: "Profit and loss analysis",
    icon: BarChart3,
    permissionKey: "dashboard.profit-loss"
  },
  {
    key: "dashboard.expense-chart",
    label: "Expense Chart",
    description: "Expense pie chart",
    icon: CreditCard,
    permissionKey: "dashboard.expense-chart"
  },
  {
    key: "dashboard.service-booking",
    label: "Service Booking Chart",
    description: "Service booking scatter chart",
    icon: Calendar,
    permissionKey: "dashboard.service-booking"
  },
  {
    key: "dashboard.service-provider",
    label: "Service Provider Chart",
    description: "Service provider analytics",
    icon: Building2,
    permissionKey: "dashboard.service-provider"
  },
  {
    key: "dashboard.vendor-booking",
    label: "Vendor Booking Chart",
    description: "Vendor booking consolidated chart",
    icon: Building2,
    permissionKey: "dashboard.vendor-booking"
  },
  {
    key: "dashboard.invoice-status",
    label: "Invoice Status Bar",
    description: "Invoice status overview",
    icon: FileText,
    permissionKey: "dashboard.invoice-status"
  },
  {
    key: "dashboard.marketing-seo",
    label: "Marketing SEO Bar",
    description: "Marketing and SEO analytics",
    icon: TrendingUp,
    permissionKey: "dashboard.marketing-seo"
  },
  {
    key: "dashboard.sidebar-followups",
    label: "Sidebar - Follow-ups",
    description: "Follow-ups list in sidebar",
    icon: Activity,
    permissionKey: "dashboard.sidebar-followups"
  },
  {
    key: "dashboard.sidebar-customers",
    label: "Sidebar - Customers",
    description: "Customers list in sidebar",
    icon: Users,
    permissionKey: "dashboard.sidebar-customers"
  },
  {
    key: "dashboard.sidebar-bookings",
    label: "Sidebar - Bookings/Invoices",
    description: "Invoices list in sidebar",
    icon: BookOpen,
    permissionKey: "dashboard.sidebar-bookings"
  },
  {
    key: "dashboard.sidebar-contacts",
    label: "Sidebar - Contacts",
    description: "Contacts list in sidebar",
    icon: MessageSquare,
    permissionKey: "dashboard.sidebar-contacts"
  },
  {
    key: "shortcuts",
    label: "Shortcuts Section",
    description: "Quick shortcuts navigation",
    icon: Zap,
    permissionKey: "dashboard" // Shortcuts don't have specific permission
  }
];

export function DashboardSettingsPanel({ open, onOpenChange }: DashboardSettingsPanelProps) {
  const { toast } = useToast();
  const { user, tenant } = useAuth();
  const { canView } = usePermissions();
  const queryClient = useQueryClient();
  const [components, setComponents] = useState<DashboardComponent[]>([]);

  // Fetch current user dashboard preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/user/dashboard/preferences'],
    enabled: open && !!user?.id && !!tenant?.id,
  });

  // Initialize components when preferences are loaded
  useEffect(() => {
    if (user && tenant) {
      const preferencesMap = new Map(
        preferences?.map((p: any) => [p.component_key, p]) || []
      );
      
      const initializedComponents = DASHBOARD_COMPONENTS.map((comp) => {
        const pref = preferencesMap.get(comp.key);
        const hasPermission = canView(comp.permissionKey);
        
        return {
          ...comp,
          // Default to visible if no preference exists, but respect user preference if set
          isVisible: pref ? pref.is_visible : true,
          hasPermission
        };
      });

      setComponents(initializedComponents);
    }
  }, [preferences, user, tenant, canView]);

  // Mutation to update user preferences
  const updatePreferenceMutation = useMutation({
    mutationFn: async (data: { componentKey: string; isVisible: boolean }) => {
      const response = await apiRequest(
        'PUT',
        `/api/user/dashboard/preferences/${data.componentKey}`,
        {
          isVisible: data.isVisible
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/dashboard/preferences'] });
      // Trigger dashboard refresh
      queryClient.invalidateQueries({ queryKey: ['/api/reports/dashboard'] });
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
        isVisible: component.isVisible
      });

      toast({
        title: component.isVisible ? "Component Shown" : "Component Hidden",
        description: `${component.label} has been ${component.isVisible ? 'shown' : 'hidden'} on your dashboard.`,
      });
    }
  };

  const handleResetToDefaults = async () => {
    const defaultComponents = DASHBOARD_COMPONENTS.map((comp) => ({
      ...comp,
      isVisible: true,
      hasPermission: canView(comp.permissionKey)
    }));
    setComponents(defaultComponents);

    // Update all preferences to default (visible)
    for (const comp of defaultComponents) {
      await updatePreferenceMutation.mutateAsync({
        componentKey: comp.key,
        isVisible: true
      });
    }

    toast({
      title: "Reset Complete",
      description: "Dashboard preferences have been reset to default settings.",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Settings
          </SheetTitle>
          <SheetDescription>
            Customize which components are visible on your dashboard. Changes are saved automatically and only affect your view.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0BBCD6]" />
          </div>
        ) : (
          <div className="space-y-4 py-6">
            {components.map((component) => {
              const IconComponent = component.icon;
              // Only show components that user has permission to see
              if (!component.hasPermission && component.key !== "shortcuts") {
                return null;
              }
              
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
                              <Eye className="h-4 w-4 text-green-500" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
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
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t mt-6">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={updatePreferenceMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

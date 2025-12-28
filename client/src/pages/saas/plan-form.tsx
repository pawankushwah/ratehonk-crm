import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
import { useToast } from "@/hooks/use-toast";
import { saasApiRequest } from "@/lib/saas-queryClient";
import { ALL_MENU_ITEMS, MENU_ITEM_LABELS, COUNTRIES } from "@/lib/menu-items";
import { MENU_ITEMS, type PermissionAction } from "@shared/permissions";

export default function PlanForm() {
  const [, setLocation] = useLocation();
  const [matchEdit, paramsEdit] = useRoute("/saas/plans/:planId");
  const [matchNew] = useRoute("/saas/plans/new");
  const { user } = useSaasAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get plan ID from URL params if editing
  const planId = matchEdit && paramsEdit?.planId ? parseInt(paramsEdit.planId) : null;
  const isEditing = !!planId && !matchNew;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    country: "US",
    currency: "USD",
    monthlyPrice: "",
    yearlyPrice: "",
    maxUsers: 10,
    maxCustomers: 100,
    allowedMenuItems: [] as string[],
    allowedPages: [] as string[],
    allowedDashboardWidgets: [] as string[],
    allowedPagePermissions: {} as Record<string, string[]>,
    freeTrialDays: 0,
    isFreePlan: false,
    isActive: true,
  });

  // Fetch plan data if editing
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["/api/saas/plans", planId],
    queryFn: async () => {
      if (!planId) return null;
      const response = await saasApiRequest("GET", `/api/subscription/plans`, {});
      const plans = await response.json();
      return Array.isArray(plans) ? plans.find((p: any) => p.id === planId) : null;
    },
    enabled: !!planId,
  });

  // Load plan data when editing
  useEffect(() => {
    if (plan) {
      const selectedCountry = COUNTRIES.find(c => c.code === (plan.country || 'US'));
      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        country: plan.country || "US",
        currency: plan.currency || selectedCountry?.currency || "USD",
        monthlyPrice: plan.monthlyPrice || plan.monthly_price || "",
        yearlyPrice: plan.yearlyPrice || plan.yearly_price || "",
        maxUsers: plan.maxUsers || plan.max_users || 10,
        maxCustomers: plan.maxCustomers || plan.max_customers || 100,
        allowedMenuItems: plan.allowedMenuItems || plan.allowed_menu_items || plan.features || [],
        allowedPages: plan.allowedPages || plan.allowed_pages || plan.features || [],
        allowedDashboardWidgets: plan.allowedDashboardWidgets || plan.allowed_dashboard_widgets || [],
        allowedPagePermissions: plan.allowedPagePermissions || plan.allowed_page_permissions || {},
        freeTrialDays: plan.freeTrialDays || plan.free_trial_days || 0,
        isFreePlan: plan.isFreePlan || plan.is_free_plan || false,
        isActive: plan.isActive !== undefined ? plan.isActive : (plan.is_active !== undefined ? plan.is_active : true),
      });
    }
  }, [plan]);

  // Create/Update Plan
  const planMutation = useMutation({
    mutationFn: async (planData: any) => {
      const url = isEditing 
        ? `/api/saas/plans/${planId}`
        : "/api/saas/plans";
      const method = isEditing ? "PUT" : "POST";
      const response = await saasApiRequest(method, url, planData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isEditing ? "Plan updated successfully" : "Plan created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/saas/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/plans"] });
      setLocation("/saas/plans");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save plan",
        variant: "destructive",
      });
    },
  });

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    setFormData({
      ...formData,
      country: countryCode,
      currency: country?.currency || "USD",
    });
  };

  const toggleMenuItem = (menuItem: string) => {
    const currentItems = formData.allowedMenuItems || [];
    const newItems = currentItems.includes(menuItem)
      ? currentItems.filter((item: string) => item !== menuItem)
      : [...currentItems, menuItem];
    
    // Also update allowedPages to match
    const pageRoute = menuItem === 'dashboard' ? '/dashboard' : `/${menuItem}`;
    const currentPages = formData.allowedPages || [];
    const newPages = currentItems.includes(menuItem)
      ? currentPages.filter((page: string) => page !== pageRoute)
      : [...currentPages, pageRoute];

    setFormData({
      ...formData,
      allowedMenuItems: newItems,
      allowedPages: newPages,
    });
  };

  const selectAllMenuItems = () => {
    setFormData({
      ...formData,
      allowedMenuItems: [...ALL_MENU_ITEMS],
      allowedPages: ALL_MENU_ITEMS.map(item => item === 'dashboard' ? '/dashboard' : `/${item}`),
    });
  };

  const deselectAllMenuItems = () => {
    setFormData({
      ...formData,
      allowedMenuItems: [],
      allowedPages: [],
    });
  };

  // Dashboard Widgets helpers
  const dashboardWidgets = Object.entries(MENU_ITEMS).filter(([key]) => key.startsWith('dashboard.'));
  
  const toggleDashboardWidget = (widgetKey: string) => {
    const currentWidgets = formData.allowedDashboardWidgets || [];
    const newWidgets = currentWidgets.includes(widgetKey)
      ? currentWidgets.filter((w: string) => w !== widgetKey)
      : [...currentWidgets, widgetKey];
    
    setFormData({
      ...formData,
      allowedDashboardWidgets: newWidgets,
    });
  };

  const selectAllDashboardWidgets = () => {
    setFormData({
      ...formData,
      allowedDashboardWidgets: dashboardWidgets.map(([key]) => key),
    });
  };

  const deselectAllDashboardWidgets = () => {
    setFormData({
      ...formData,
      allowedDashboardWidgets: [],
    });
  };

  // Page Permissions helpers
  const pagePermissions = Object.entries(MENU_ITEMS).filter(([key]) => !key.startsWith('dashboard.'));
  
  const togglePagePermission = (pageKey: string, action: PermissionAction) => {
    const currentPermissions = formData.allowedPagePermissions || {};
    const pageActions = currentPermissions[pageKey] || [];
    const newActions = pageActions.includes(action)
      ? pageActions.filter((a: string) => a !== action)
      : [...pageActions, action];
    
    setFormData({
      ...formData,
      allowedPagePermissions: {
        ...currentPermissions,
        [pageKey]: newActions.length > 0 ? newActions : undefined,
      },
    });
  };

  const hasPagePermission = (pageKey: string, action: PermissionAction) => {
    return (formData.allowedPagePermissions[pageKey] || []).includes(action);
  };

  const selectAllPagePermissions = (pageKey: string) => {
    const pageConfig = MENU_ITEMS[pageKey as keyof typeof MENU_ITEMS];
    if (!pageConfig) return;
    
    setFormData({
      ...formData,
      allowedPagePermissions: {
        ...formData.allowedPagePermissions,
        [pageKey]: [...pageConfig.actions],
      },
    });
  };

  const deselectAllPagePermissions = (pageKey: string) => {
    const currentPermissions = { ...formData.allowedPagePermissions };
    delete currentPermissions[pageKey];
    setFormData({
      ...formData,
      allowedPagePermissions: currentPermissions,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    planMutation.mutate(formData);
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

  if (planLoading) {
    return (
      <SaasLayout>
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </SaasLayout>
    );
  }

  return (
    <SaasLayout>
      <div className="p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/saas/plans")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>
          <h1 className="text-3xl font-bold">{isEditing ? "Edit Plan" : "Create New Plan"}</h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? "Update subscription plan details" : "Create a new subscription plan with country-specific pricing and features"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
              <CardDescription>Basic information about the subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={handleCountryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name} ({country.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    required
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="monthlyPrice">Monthly Price ({formData.currency}) *</Label>
                  <Input
                    id="monthlyPrice"
                    type="number"
                    step="0.01"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearlyPrice">Yearly Price ({formData.currency}) *</Label>
                  <Input
                    id="yearlyPrice"
                    type="number"
                    step="0.01"
                    value={formData.yearlyPrice}
                    onChange={(e) => setFormData({ ...formData, yearlyPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">Max Users (-1 for unlimited)</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || -1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCustomers">Max Customers (-1 for unlimited)</Label>
                  <Input
                    id="maxCustomers"
                    type="number"
                    value={formData.maxCustomers}
                    onChange={(e) => setFormData({ ...formData, maxCustomers: parseInt(e.target.value) || -1 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="freeTrialDays">Free Trial Days (0 = no trial)</Label>
                  <Input
                    id="freeTrialDays"
                    type="number"
                    min="0"
                    value={formData.freeTrialDays}
                    onChange={(e) => setFormData({ ...formData, freeTrialDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFreePlan"
                      checked={formData.isFreePlan}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFreePlan: !!checked })}
                    />
                    <Label htmlFor="isFreePlan" className="cursor-pointer">Free Trial Plan (one-time use per tenant)</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Allowed Menu Items & Pages *</CardTitle>
                  <CardDescription>Select which features are included in this plan</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={selectAllMenuItems}>
                    Select All
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={deselectAllMenuItems}>
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ALL_MENU_ITEMS.map((menuItem) => (
                    <div key={menuItem} className="flex items-center space-x-2">
                      <Checkbox
                        id={`menu-${menuItem}`}
                        checked={(formData.allowedMenuItems || []).includes(menuItem)}
                        onCheckedChange={() => toggleMenuItem(menuItem)}
                      />
                      <Label htmlFor={`menu-${menuItem}`} className="cursor-pointer text-sm">
                        {MENU_ITEM_LABELS[menuItem] || menuItem}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-4">
                Selected: {(formData.allowedMenuItems || []).length} of {ALL_MENU_ITEMS.length} menu items
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dashboard Widgets</CardTitle>
                  <CardDescription>Select which dashboard widgets are visible in this plan</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={selectAllDashboardWidgets}>
                    Select All
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={deselectAllDashboardWidgets}>
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dashboardWidgets.map(([key, config]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`widget-${key}`}
                        checked={(formData.allowedDashboardWidgets || []).includes(key)}
                        onCheckedChange={() => toggleDashboardWidget(key)}
                      />
                      <Label htmlFor={`widget-${key}`} className="cursor-pointer text-sm">
                        {config.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-4">
                Selected: {(formData.allowedDashboardWidgets || []).length} of {dashboardWidgets.length} widgets
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Page Permissions</CardTitle>
              <CardDescription>Configure granular permissions for each page (view, edit, create, delete)</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {pagePermissions.map(([pageKey, config]) => {
                    const pageActions = formData.allowedPagePermissions[pageKey] || [];
                    const allSelected = config.actions.every((action: PermissionAction) => pageActions.includes(action));
                    
                    return (
                      <div key={pageKey} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`page-${pageKey}`}
                              checked={allSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  selectAllPagePermissions(pageKey);
                                } else {
                                  deselectAllPagePermissions(pageKey);
                                }
                              }}
                            />
                            <Label htmlFor={`page-${pageKey}`} className="cursor-pointer font-medium">
                              {config.name}
                            </Label>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => selectAllPagePermissions(pageKey)}
                              className="h-7 text-xs"
                            >
                              All
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deselectAllPagePermissions(pageKey)}
                              className="h-7 text-xs"
                            >
                              None
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 ml-6">
                          {config.actions.map((action: PermissionAction) => (
                            <div key={action} className="flex items-center space-x-2">
                              <Checkbox
                                id={`permission-${pageKey}-${action}`}
                                checked={hasPagePermission(pageKey, action)}
                                onCheckedChange={() => togglePagePermission(pageKey, action)}
                              />
                              <Label htmlFor={`permission-${pageKey}-${action}`} className="cursor-pointer text-sm capitalize">
                                {action}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-4">
                Configured: {Object.keys(formData.allowedPagePermissions).length} of {pagePermissions.length} pages
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setLocation("/saas/plans")}>
              Cancel
            </Button>
            <Button type="submit" disabled={planMutation.isPending}>
              {planMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Plan" : "Create Plan"
              )}
            </Button>
          </div>
        </form>
      </div>
    </SaasLayout>
  );
}


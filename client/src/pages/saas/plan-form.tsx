import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
import { useToast } from "@/hooks/use-toast";
import { saasApiRequest } from "@/lib/saas-queryClient";
import { COUNTRIES } from "@/lib/menu-items";
import { PlanFormContent, type PlanFormData } from "@/components/plan-form/PlanFormContent";

export default function PlanForm() {
  const [, setLocation] = useLocation();
  const [matchEdit, paramsEdit] = useRoute("/saas/plans/:planId");
  const [matchNew] = useRoute("/saas/plans/new");
  const { user } = useSaasAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const planId = matchEdit && paramsEdit?.planId ? parseInt(paramsEdit.planId) : null;
  const isEditing = !!planId && !matchNew;

  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    description: "",
    country: "US",
    currency: "USD",
    monthlyPrice: "",
    yearlyPrice: "",
    maxUsers: 10,
    maxCustomers: 100,
    allowedMenuItems: [],
    allowedPages: [],
    allowedDashboardWidgets: [],
    allowedPagePermissions: {},
    freeTrialDays: 0,
    isFreePlan: false,
    isActive: true,
    partnerId: "",
  });

  const { data: partners } = useQuery({
    queryKey: ["/api/saas/partners"],
    queryFn: async () => {
      const res = await saasApiRequest("GET", "/api/saas/partners", {});
      return res.json();
    },
  });

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["/api/subscription/plans", planId],
    queryFn: async () => {
      if (!planId) return null;
      const response = await saasApiRequest("GET", `/api/subscription/plans/${planId}`, {});
      if (!response.ok) throw new Error("Failed to fetch plan");
      return response.json();
    },
    enabled: !!planId,
  });

  useEffect(() => {
    if (plan && isEditing) {
      const selectedCountry = COUNTRIES.find((c) => c.code === (plan.country || "US"));
      const allowedMenuItems = Array.isArray(plan.allowed_menu_items)
        ? plan.allowed_menu_items
        : Array.isArray(plan.allowedMenuItems)
          ? plan.allowedMenuItems
          : Array.isArray(plan.features)
            ? plan.features
            : [];
      const allowedPages = Array.isArray(plan.allowed_pages)
        ? plan.allowed_pages
        : Array.isArray(plan.allowedPages)
          ? plan.allowedPages
          : [];
      const allowedDashboardWidgets = Array.isArray(plan.allowed_dashboard_widgets)
        ? plan.allowed_dashboard_widgets
        : Array.isArray(plan.allowedDashboardWidgets)
          ? plan.allowedDashboardWidgets
          : [];
      const allowedPagePermissions =
        plan.allowed_page_permissions && typeof plan.allowed_page_permissions === "object"
          ? plan.allowed_page_permissions
          : plan.allowedPagePermissions && typeof plan.allowedPagePermissions === "object"
            ? plan.allowedPagePermissions
            : {};

      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        country: plan.country || "US",
        currency: plan.currency || selectedCountry?.currency || "USD",
        monthlyPrice: String(plan.monthly_price || plan.monthlyPrice || "").replace(".00", ""),
        yearlyPrice: String(plan.yearly_price || plan.yearlyPrice || "").replace(".00", ""),
        maxUsers: plan.max_users ?? plan.maxUsers ?? 10,
        maxCustomers: plan.max_customers ?? plan.maxCustomers ?? 100,
        allowedMenuItems,
        allowedPages,
        allowedDashboardWidgets,
        allowedPagePermissions,
        freeTrialDays: plan.free_trial_days ?? plan.freeTrialDays ?? 0,
        isFreePlan: plan.is_free_plan ?? plan.isFreePlan ?? false,
        isActive: plan.is_active ?? plan.isActive ?? true,
        partnerId: plan.partner_id ?? "",
      });
    }
  }, [plan, isEditing]);

  const planMutation = useMutation({
    mutationFn: async (planData: PlanFormData) => {
      const url = isEditing ? `/api/saas/plans/${planId}` : "/api/saas/plans";
      const method = isEditing ? "PUT" : "POST";
      const payload = {
        ...planData,
        monthlyPrice: parseFloat(planData.monthlyPrice) || 0,
        yearlyPrice: parseFloat(planData.yearlyPrice) || 0,
      };
      const response = await saasApiRequest(method, url, payload);
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
          <Button variant="ghost" onClick={() => setLocation("/saas/plans")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>
          <h1 className="text-3xl font-bold">{isEditing ? "Edit Plan" : "Create New Plan"}</h1>
          <p className="text-muted-foreground mt-2">
            {isEditing
              ? "Update subscription plan details"
              : "Create a new subscription plan with country-specific pricing and features"}
          </p>
        </div>

        <PlanFormContent
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isLoading={planMutation.isPending}
          isEditing={isEditing}
          showPartnerSelector={true}
          partners={partners}
          onCancel={() => setLocation("/saas/plans")}
        />
      </div>
    </SaasLayout>
  );
}

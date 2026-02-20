import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PartnerLayout } from "@/components/layout/partner-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { partnerApiRequest } from "@/lib/partner-queryClient";
import { useToast } from "@/hooks/use-toast";
import { PlanFormContent, type PlanFormData } from "@/components/plan-form/PlanFormContent";

export default function PartnerPlanForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  });

  const createMutation = useMutation({
    mutationFn: async (planData: PlanFormData) => {
      const payload = {
        ...planData,
        monthlyPrice: parseFloat(planData.monthlyPrice) || 0,
        yearlyPrice: parseFloat(planData.yearlyPrice) || 0,
        maxUsers: planData.maxUsers,
        maxCustomers: planData.maxCustomers,
        allowedMenuItems: planData.allowedMenuItems || [],
        allowedPages: planData.allowedPages || [],
        allowedDashboardWidgets: planData.allowedDashboardWidgets || [],
        allowedPagePermissions: planData.allowedPagePermissions || {},
        freeTrialDays: planData.freeTrialDays ?? 0,
        isFreePlan: planData.isFreePlan ?? false,
        isActive: planData.isActive !== false,
      };
      const res = await partnerApiRequest("POST", "/api/partner/plans", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Plan created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/plans"] });
      setLocation("/partner/plans");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create plan",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <PartnerLayout>
      <div className="p-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation("/partner/plans")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>
          <h1 className="text-3xl font-bold">Create New Plan</h1>
          <p className="text-muted-foreground mt-2">
            Create a new subscription plan with country-specific pricing and features for your tenants
          </p>
        </div>

        <PlanFormContent
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          isEditing={false}
          showPartnerSelector={false}
          onCancel={() => setLocation("/partner/plans")}
        />
      </div>
    </PartnerLayout>
  );
}

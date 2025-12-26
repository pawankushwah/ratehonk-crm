import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Loader2 } from "lucide-react";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
import { useToast } from "@/hooks/use-toast";
import { saasApiRequest } from "@/lib/saas-queryClient";

export default function SaasPlans() {
  const { user } = useSaasAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  // Fetch subscription plans
  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ["/api/saas/plans"],
    queryFn: async () => {
      const response = await saasApiRequest("GET", "/api/subscription/plans", {});
      return response.json();
    },
  });

  // Create/Update Plan
  const planMutation = useMutation({
    mutationFn: async (planData: any) => {
      const url = editingPlan 
        ? `/api/saas/plans/${editingPlan.id}`
        : "/api/saas/plans";
      const method = editingPlan ? "PUT" : "POST";
      const response = await saasApiRequest(method, url, planData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingPlan ? "Plan updated successfully" : "Plan created successfully",
      });
      setPlanDialogOpen(false);
      setEditingPlan(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save plan",
        variant: "destructive",
      });
    },
  });

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Subscription Plans</h1>
            <p className="text-muted-foreground mt-2">Manage subscription plans for tenants</p>
          </div>
          <Button onClick={() => {
            setEditingPlan(null);
            setPlanDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-3 text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : plans && plans.length > 0 ? (
            plans.map((plan: any) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <Badge variant={plan.isActive || plan.is_active ? "default" : "secondary"}>
                      {plan.isActive || plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Monthly:</span>
                      <span className="font-bold">${plan.monthlyPrice || plan.monthly_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Yearly:</span>
                      <span className="font-bold">${plan.yearlyPrice || plan.yearly_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Max Users:</span>
                      <span className="font-medium">{plan.maxUsers || plan.max_users === -1 ? "Unlimited" : plan.maxUsers || plan.max_users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Max Customers:</span>
                      <span className="font-medium">{plan.maxCustomers || plan.max_customers === -1 ? "Unlimited" : plan.maxCustomers || plan.max_customers}</span>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setEditingPlan(plan);
                          setPlanDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              No plans found
            </div>
          )}
        </div>

        <PlanDialog
          open={planDialogOpen}
          onOpenChange={setPlanDialogOpen}
          plan={editingPlan}
          onSave={(data) => planMutation.mutate(data)}
          isLoading={planMutation.isPending}
        />
      </div>
    </SaasLayout>
  );
}

function PlanDialog({ open, onOpenChange, plan, onSave, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: plan?.name || "",
    description: plan?.description || "",
    monthlyPrice: plan?.monthlyPrice || plan?.monthly_price || "",
    yearlyPrice: plan?.yearlyPrice || plan?.yearly_price || "",
    maxUsers: plan?.maxUsers || plan?.max_users || 10,
    maxCustomers: plan?.maxCustomers || plan?.max_customers || 100,
    features: plan?.features || [],
    isActive: plan?.isActive !== undefined ? plan.isActive : (plan?.is_active !== undefined ? plan.is_active : true),
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        monthlyPrice: plan.monthlyPrice || plan.monthly_price || "",
        yearlyPrice: plan.yearlyPrice || plan.yearly_price || "",
        maxUsers: plan.maxUsers || plan.max_users || 10,
        maxCustomers: plan.maxCustomers || plan.max_customers || 100,
        features: plan.features || [],
        isActive: plan.isActive !== undefined ? plan.isActive : (plan.is_active !== undefined ? plan.is_active : true),
      });
    } else {
      setFormData({
        name: "",
        description: "",
        monthlyPrice: "",
        yearlyPrice: "",
        maxUsers: 10,
        maxCustomers: 100,
        features: [],
        isActive: true,
      });
    }
  }, [plan, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
          <DialogDescription>
            {plan ? "Update subscription plan details" : "Create a new subscription plan"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyPrice">Monthly Price *</Label>
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
                <Label htmlFor="yearlyPrice">Yearly Price *</Label>
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {plan ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


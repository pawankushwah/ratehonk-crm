import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Loader2 } from "lucide-react";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
import { useToast } from "@/hooks/use-toast";
import { saasApiRequest } from "@/lib/saas-queryClient";
import { format } from "date-fns";

export default function SaasSubscriptions() {
  const { user } = useSaasAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);

  // Fetch tenants and plans
  const { data: tenants } = useQuery({
    queryKey: ["/api/saas/tenants"],
    queryFn: async () => {
      const response = await saasApiRequest("GET", "/api/saas/tenants", {});
      return response.json();
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["/api/subscription/plans"],
    queryFn: async () => {
      const response = await saasApiRequest("GET", "/api/subscription/plans", {});
      return response.json();
    },
  });

  // Fetch tenant subscriptions
  const { data: subscriptions, isLoading, refetch, error: subscriptionsError } = useQuery({
    queryKey: ["/api/saas/subscriptions"],
    queryFn: async () => {
      try {
        console.log("🔍 Fetching subscriptions from SaaS API...");
        const response = await saasApiRequest("GET", "/api/saas/subscriptions", {});
        const data = await response.json();
        console.log("🔍 Subscriptions response:", data);
        console.log("🔍 Subscriptions count:", Array.isArray(data) ? data.length : "Not an array");
        return Array.isArray(data) ? data : [];
      } catch (error: any) {
        console.error("🔍 Error fetching subscriptions:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch subscriptions",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Create/Update Subscription
  const subscriptionMutation = useMutation({
    mutationFn: async (subscriptionData: any) => {
      const url = editingSubscription 
        ? `/api/saas/subscriptions/${editingSubscription.id}`
        : "/api/saas/subscriptions";
      const method = editingSubscription ? "PUT" : "POST";
      const response = await saasApiRequest(method, url, subscriptionData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingSubscription ? "Subscription updated successfully" : "Subscription created successfully",
      });
      setSubscriptionDialogOpen(false);
      setEditingSubscription(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save subscription",
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
            <h1 className="text-3xl font-bold">Tenant Subscriptions</h1>
            <p className="text-muted-foreground mt-2">Manage tenant subscriptions and billing</p>
          </div>
          <Button onClick={() => {
            setEditingSubscription(null);
            setSubscriptionDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Subscription
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {subscriptionsError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  Error loading subscriptions: {subscriptionsError instanceof Error ? subscriptionsError.message : "Unknown error"}
                </p>
              </div>
            )}
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Current Period</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions && subscriptions.length > 0 ? (
                    subscriptions.map((subscription: any) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">
                          {subscription.tenantName || subscription.tenant_name || `Tenant #${subscription.tenantId || subscription.tenant_id}`}
                        </TableCell>
                        <TableCell>{subscription.planName || subscription.plan_name || `Plan #${subscription.planId || subscription.plan_id}`}</TableCell>
                        <TableCell>
                          <Badge variant={
                            subscription.status === "active" ? "default" :
                            subscription.status === "trial" ? "secondary" :
                            subscription.status === "cancelled" ? "destructive" : "outline"
                          }>
                            {subscription.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{subscription.billingCycle || subscription.billing_cycle}</TableCell>
                        <TableCell>
                          {subscription.currentPeriodStart && subscription.currentPeriodEnd ? (
                            <>
                              {format(new Date(subscription.currentPeriodStart), "MMM dd")} - {format(new Date(subscription.currentPeriodEnd), "MMM dd, yyyy")}
                            </>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {subscription.nextBillingDate || subscription.next_billing_date ? format(new Date(subscription.nextBillingDate || subscription.next_billing_date), "MMM dd, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSubscription(subscription);
                              setSubscriptionDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <SubscriptionDialog
          open={subscriptionDialogOpen}
          onOpenChange={setSubscriptionDialogOpen}
          subscription={editingSubscription}
          tenants={tenants || []}
          plans={plans || []}
          onSave={(data) => subscriptionMutation.mutate(data)}
          isLoading={subscriptionMutation.isPending}
        />
      </div>
    </SaasLayout>
  );
}

function SubscriptionDialog({ open, onOpenChange, subscription, tenants, plans, onSave, isLoading }: any) {
  const [formData, setFormData] = useState({
    tenantId: subscription?.tenantId || subscription?.tenant_id || "",
    planId: subscription?.planId || subscription?.plan_id || "",
    status: subscription?.status || "trial",
    billingCycle: subscription?.billingCycle || subscription?.billing_cycle || "monthly",
    paymentGateway: subscription?.paymentGateway || subscription?.payment_gateway || "stripe",
  });

  useEffect(() => {
    if (subscription) {
      setFormData({
        tenantId: subscription.tenantId || subscription.tenant_id || "",
        planId: subscription.planId || subscription.plan_id || "",
        status: subscription.status || "trial",
        billingCycle: subscription.billingCycle || subscription.billing_cycle || "monthly",
        paymentGateway: subscription.paymentGateway || subscription.payment_gateway || "stripe",
      });
    } else {
      setFormData({
        tenantId: "",
        planId: "",
        status: "trial",
        billingCycle: "monthly",
        paymentGateway: "stripe",
      });
    }
  }, [subscription, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subscription ? "Edit Subscription" : "Create New Subscription"}</DialogTitle>
          <DialogDescription>
            {subscription ? "Update tenant subscription" : "Assign a subscription plan to a tenant"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant *</Label>
              <Select
                value={formData.tenantId.toString()}
                onValueChange={(value) => setFormData({ ...formData, tenantId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant: any) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.companyName || tenant.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="planId">Plan *</Label>
              <Select
                value={formData.planId.toString()}
                onValueChange={(value) => setFormData({ ...formData, planId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingCycle">Billing Cycle *</Label>
                <Select
                  value={formData.billingCycle}
                  onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentGateway">Payment Gateway *</Label>
                <Select
                  value={formData.paymentGateway}
                  onValueChange={(value) => setFormData({ ...formData, paymentGateway: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {subscription ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PartnerLayout } from "@/components/layout/partner-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { partnerApiRequest } from "@/lib/partner-queryClient";
import { format } from "date-fns";

export default function PartnerSubscriptions() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: subscriptions, isLoading, refetch } = useQuery({
    queryKey: ["/api/partner/subscriptions"],
    queryFn: async () => {
      const res = await partnerApiRequest("GET", "/api/partner/subscriptions", {});
      return res.json();
    },
  });

  const { data: tenants } = useQuery({
    queryKey: ["/api/partner/tenants"],
    queryFn: async () => {
      const res = await partnerApiRequest("GET", "/api/partner/tenants", {});
      return res.json();
    },
  });

  const { data: plansData } = useQuery({
    queryKey: ["/api/partner/plans"],
    queryFn: async () => {
      const res = await partnerApiRequest("GET", "/api/partner/plans", {});
      return res.json();
    },
  });

  const plans = useMemo(() => {
    if (!plansData || !Array.isArray(plansData)) return [];
    if (plansData.length > 0 && plansData[0]?.country && plansData[0]?.plans) {
      const all: any[] = [];
      plansData.forEach((g: any) => {
        if (g.plans) g.plans.forEach((p: any) => all.push(p));
      });
      return all;
    }
    return plansData;
  }, [plansData]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await partnerApiRequest("POST", "/api/partner/subscriptions", data);
      return res.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      refetch();
    },
  });

  return (
    <PartnerLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Subscriptions</h1>
            <p className="text-muted-foreground mt-2">Manage subscriptions for your tenants</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Assign Subscription
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
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
                    <TableHead>Next Billing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions && subscriptions.length > 0 ? (
                    subscriptions.map((sub: any) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.tenantName || sub.tenant_name}</TableCell>
                        <TableCell>{sub.planName || sub.plan_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sub.status === "active"
                                ? "default"
                                : sub.status === "trial"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{sub.billingCycle || sub.billing_cycle}</TableCell>
                        <TableCell>
                          {sub.nextBillingDate || sub.next_billing_date
                            ? format(new Date(sub.nextBillingDate || sub.next_billing_date), "MMM dd, yyyy")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No subscriptions yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AssignSubscriptionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          tenants={tenants || []}
          plans={plans}
          onSave={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </div>
    </PartnerLayout>
  );
}

function AssignSubscriptionDialog({
  open,
  onOpenChange,
  tenants,
  plans,
  onSave,
  isLoading,
}: any) {
  const [formData, setFormData] = useState({
    tenantId: "",
    planId: "",
    status: "trial",
    billingCycle: "monthly",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Subscription</DialogTitle>
          <DialogDescription>Assign a plan to one of your tenants</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tenant *</Label>
              <Select
                value={formData.tenantId}
                onValueChange={(v) => setFormData({ ...formData, tenantId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.company_name || t.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan *</Label>
              <Select
                value={formData.planId}
                onValueChange={(v) => setFormData({ ...formData, planId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter((p: any) => p?.id).map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name || "Unnamed Plan"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select
                  value={formData.billingCycle}
                  onValueChange={(v) => setFormData({ ...formData, billingCycle: v })}
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
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

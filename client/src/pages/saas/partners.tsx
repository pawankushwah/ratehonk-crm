import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Loader2, Users } from "lucide-react";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
import { useToast } from "@/hooks/use-toast";
import { saasApiRequest } from "@/lib/saas-queryClient";
import { format } from "date-fns";

export default function SaasPartners() {
  const { user } = useSaasAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);

  const { data: partners, isLoading, refetch } = useQuery({
    queryKey: ["/api/saas/partners"],
    queryFn: async () => {
      const res = await saasApiRequest("GET", "/api/saas/partners", {});
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingPartner ? `/api/saas/partners/${editingPartner.id}` : "/api/saas/partners";
      const method = editingPartner ? "PUT" : "POST";
      const res = await saasApiRequest(method, url, editingPartner ? { ...data, id: undefined } : data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingPartner ? "Partner updated" : "Partner created",
      });
      setDialogOpen(false);
      setEditingPartner(null);
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
                <p className="text-muted-foreground">SaaS owners only.</p>
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
            <h1 className="text-3xl font-bold">Partners</h1>
            <p className="text-muted-foreground mt-2">Manage CRM selling partners and commission settings</p>
          </div>
          <Button
            onClick={() => {
              setEditingPartner(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Partner
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
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners && partners.length > 0 ? (
                    partners.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.company_name || p.companyName}</TableCell>
                        <TableCell>{p.contact_email || p.contactEmail}</TableCell>
                        <TableCell>
                          {(p.commission_type || p.commissionType) === "percentage"
                            ? `${p.commission_value ?? p.commissionValue}%`
                            : `$${p.commission_value ?? p.commissionValue}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.is_active !== false ? "default" : "secondary"}>
                            {p.is_active !== false ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.created_at || p.createdAt
                            ? format(new Date(p.created_at || p.createdAt), "MMM dd, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPartner(p);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No partners yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <PartnerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          partner={editingPartner}
          onSave={(data: any) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </div>
    </SaasLayout>
  );
}

function PartnerDialog({
  open,
  onOpenChange,
  partner,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  partner: any;
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    companyName: partner?.company_name || partner?.companyName || "",
    contactEmail: partner?.contact_email || partner?.contactEmail || "",
    contactPhone: partner?.contact_phone || partner?.contactPhone || "",
    address: partner?.address || "",
    commissionType: partner?.commission_type || partner?.commissionType || "percentage",
    commissionValue: partner?.commission_value ?? partner?.commissionValue ?? 0,
    minimumSubscriptionPrice: partner?.minimum_subscription_price ?? partner?.minimumSubscriptionPrice ?? "",
    isActive: partner?.is_active !== false,
    loginEmail: "",
    loginPassword: "",
    firstName: "",
    lastName: "",
  });

  React.useEffect(() => {
    if (partner) {
      setFormData({
        companyName: partner.company_name || partner.companyName || "",
        contactEmail: partner.contact_email || partner.contactEmail || "",
        contactPhone: partner.contact_phone || partner.contactPhone || "",
        address: partner.address || "",
        commissionType: partner.commission_type || partner.commissionType || "percentage",
        commissionValue: partner.commission_value ?? partner.commissionValue ?? 0,
        minimumSubscriptionPrice: partner.minimum_subscription_price ?? partner.minimumSubscriptionPrice ?? "",
        isActive: partner.is_active !== false,
        loginEmail: "",
        loginPassword: "",
        firstName: "",
        lastName: "",
      });
    } else {
      setFormData({
        companyName: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        commissionType: "percentage",
        commissionValue: 0,
        minimumSubscriptionPrice: "",
        isActive: true,
        loginEmail: "",
        loginPassword: "",
        firstName: "",
        lastName: "",
      });
    }
  }, [partner, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{partner ? "Edit Partner" : "Create Partner"}</DialogTitle>
          <DialogDescription>
            {partner ? "Update partner and commission settings" : "Add a new partner with login credentials"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email *</Label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Commission Type</Label>
                <Select
                  value={formData.commissionType}
                  onValueChange={(v) => setFormData({ ...formData, commissionType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commission Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.commissionValue}
                  onChange={(e) =>
                    setFormData({ ...formData, commissionValue: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Subscription Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 1000"
                  value={formData.minimumSubscriptionPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumSubscriptionPrice: e.target.value ? parseFloat(e.target.value) : "" })
                  }
                />
                <p className="text-xs text-muted-foreground">Tenants cannot create subscriptions below this amount</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 flex items-end">
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
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            {!partner && (
              <>
                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-medium mb-2">Partner Login (optional)</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Create login credentials for the partner to access the partner panel
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Login Email</Label>
                      <Input
                        type="email"
                        value={formData.loginEmail}
                        onChange={(e) => setFormData({ ...formData, loginEmail: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={formData.loginPassword}
                        onChange={(e) => setFormData({ ...formData, loginPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {partner ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

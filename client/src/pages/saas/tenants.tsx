import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
import { useToast } from "@/hooks/use-toast";
import { saasApiRequest } from "@/lib/saas-queryClient";
import { format } from "date-fns";

export default function SaasTenants() {
  const { user } = useSaasAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);

  // Fetch tenants
  const { data: tenants, isLoading, refetch } = useQuery({
    queryKey: ["/api/saas/tenants"],
    queryFn: async () => {
      const response = await saasApiRequest("GET", "/api/saas/tenants", {});
      return response.json();
    },
  });

  // Create/Update Tenant
  const tenantMutation = useMutation({
    mutationFn: async (tenantData: any) => {
      const url = editingTenant 
        ? `/api/saas/tenants/${editingTenant.id}`
        : "/api/saas/tenants";
      const method = editingTenant ? "PUT" : "POST";
      const response = await saasApiRequest(method, url, tenantData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingTenant ? "Tenant updated successfully" : "Tenant created successfully",
      });
      setTenantDialogOpen(false);
      setEditingTenant(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save tenant",
        variant: "destructive",
      });
    },
  });

  // Delete Tenant
  const deleteTenantMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      const response = await saasApiRequest("DELETE", `/api/saas/tenants/${tenantId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tenant deleted successfully",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tenant",
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
            <h1 className="text-3xl font-bold">Tenant Management</h1>
            <p className="text-muted-foreground mt-2">Manage all tenants on your platform</p>
          </div>
          <Button onClick={() => {
            setEditingTenant(null);
            setTenantDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
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
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Subdomain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants && tenants.length > 0 ? (
                    tenants.map((tenant: any) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">
                          {tenant.companyName || tenant.company_name}
                        </TableCell>
                        <TableCell>{tenant.contactEmail || tenant.contact_email}</TableCell>
                        <TableCell>{tenant.subdomain || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={tenant.isActive || tenant.is_active ? "default" : "secondary"}>
                            {tenant.isActive || tenant.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tenant.createdAt || tenant.created_at ? format(new Date(tenant.createdAt || tenant.created_at), "MMM dd, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTenant(tenant);
                                setTenantDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this tenant?")) {
                                  deleteTenantMutation.mutate(tenant.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No tenants found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <TenantDialog
          open={tenantDialogOpen}
          onOpenChange={setTenantDialogOpen}
          tenant={editingTenant}
          onSave={(data) => tenantMutation.mutate(data)}
          isLoading={tenantMutation.isPending}
        />
      </div>
    </SaasLayout>
  );
}

function TenantDialog({ open, onOpenChange, tenant, onSave, isLoading }: any) {
  const [formData, setFormData] = useState({
    companyName: tenant?.companyName || tenant?.company_name || "",
    contactEmail: tenant?.contactEmail || tenant?.contact_email || "",
    contactPhone: tenant?.contactPhone || tenant?.contact_phone || "",
    address: tenant?.address || "",
    subdomain: tenant?.subdomain || "",
    isActive: tenant?.isActive !== undefined ? tenant.isActive : (tenant?.is_active !== undefined ? tenant.is_active : true),
  });

  React.useEffect(() => {
    if (tenant) {
      setFormData({
        companyName: tenant.companyName || tenant.company_name || "",
        contactEmail: tenant.contactEmail || tenant.contact_email || "",
        contactPhone: tenant.contactPhone || tenant.contact_phone || "",
        address: tenant.address || "",
        subdomain: tenant.subdomain || "",
        isActive: tenant.isActive !== undefined ? tenant.isActive : (tenant.is_active !== undefined ? tenant.is_active : true),
      });
    } else {
      setFormData({
        companyName: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        subdomain: "",
        isActive: true,
      });
    }
  }, [tenant, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tenant ? "Edit Tenant" : "Create New Tenant"}</DialogTitle>
          <DialogDescription>
            {tenant ? "Update tenant information" : "Add a new tenant to the platform"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <Input
                  id="subdomain"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
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
              {tenant ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


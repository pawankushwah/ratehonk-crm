import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Building2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ServiceProvider {
  id: number;
  tenantId: number;
  leadTypeId: number;
  name: string;
  contactInfo?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LeadType {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export default function ServiceProviders() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeadType, setSelectedLeadType] = useState<string>("all");
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    leadTypeId: "",
    contactInfo: "",
    notes: "",
  });

  // Fetch lead types
  const { data: leadTypes = [], isLoading: isLoadingLeadTypes } = useQuery<LeadType[]>({
    queryKey: ["/api/lead-types", tenant?.id],
    enabled: !!tenant?.id,
  });

  // Fetch service providers
  const { data: serviceProviders = [], isLoading: isLoadingProviders } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/service-providers", tenant?.id],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenant?.id}/service-providers`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch service providers");
      return response.json();
    },
    enabled: !!tenant?.id,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/service-providers`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-providers", tenant?.id] });
      setIsCreateOpen(false);
      setFormData({ name: "", leadTypeId: "", contactInfo: "", notes: "" });
      toast({
        title: "Success",
        description: "Service provider created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service provider",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/tenants/${tenant?.id}/service-providers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-providers", tenant?.id] });
      setIsEditOpen(false);
      setEditingProvider(null);
      setFormData({ name: "", leadTypeId: "", contactInfo: "", notes: "" });
      toast({
        title: "Success",
        description: "Service provider updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service provider",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tenants/${tenant?.id}/service-providers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-providers", tenant?.id] });
      toast({
        title: "Success",
        description: "Service provider deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service provider",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.name || !formData.leadTypeId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      name: formData.name,
      leadTypeId: parseInt(formData.leadTypeId),
      contactInfo: formData.contactInfo,
      notes: formData.notes,
    });
  };

  const handleEdit = (provider: ServiceProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      leadTypeId: provider.leadTypeId.toString(),
      contactInfo: provider.contactInfo || "",
      notes: provider.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingProvider || !formData.name || !formData.leadTypeId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: editingProvider.id,
      data: {
        name: formData.name,
        leadTypeId: parseInt(formData.leadTypeId),
        contactInfo: formData.contactInfo,
        notes: formData.notes,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this service provider?")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter service providers
  const filteredProviders = serviceProviders.filter((provider) => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeadType = selectedLeadType === "all" || provider.leadTypeId.toString() === selectedLeadType;
    return matchesSearch && matchesLeadType;
  });

  // Get lead type name
  const getLeadTypeName = (leadTypeId: number) => {
    const leadType = leadTypes.find((lt) => lt.id === leadTypeId);
    return leadType?.name || "Unknown";
  };

  const isLoading = isLoadingLeadTypes || isLoadingProviders;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Service Providers
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage service providers linked to lead types
            </p>
          </div>
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <Button data-testid="button-create-provider">
                <Plus className="mr-2 h-4 w-4" />
                Add Service Provider
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Create Service Provider</SheetTitle>
                <SheetDescription>
                  Add a new service provider linked to a lead type
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Name *</Label>
                  <Input
                    id="create-name"
                    data-testid="input-provider-name"
                    placeholder="e.g., Air India, Grand Hyatt"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-leadType">Lead Type *</Label>
                  <Select
                    value={formData.leadTypeId}
                    onValueChange={(value) => setFormData({ ...formData, leadTypeId: value })}
                  >
                    <SelectTrigger id="create-leadType" data-testid="select-lead-type">
                      <SelectValue placeholder="Select lead type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadTypes.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id.toString()}>
                          {lt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-contact">Contact Info</Label>
                  <Input
                    id="create-contact"
                    data-testid="input-contact-info"
                    placeholder="Phone, email, or address"
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-notes">Notes</Label>
                  <Textarea
                    id="create-notes"
                    data-testid="textarea-notes"
                    placeholder="Additional notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setFormData({ name: "", leadTypeId: "", contactInfo: "", notes: "" });
                    }}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Service Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={selectedLeadType} onValueChange={setSelectedLeadType}>
                <SelectTrigger data-testid="select-filter-lead-type">
                  <SelectValue placeholder="Filter by lead type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lead Types</SelectItem>
                  {leadTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id.toString()}>
                      {lt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Service Providers List</CardTitle>
                <CardDescription>
                  {filteredProviders.length} provider{filteredProviders.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Lead Type</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="h-12 w-12 text-gray-300" />
                          <p>No service providers found</p>
                          <p className="text-sm">Create your first service provider to get started</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProviders.map((provider) => (
                      <TableRow key={provider.id} data-testid={`row-provider-${provider.id}`}>
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {getLeadTypeName(provider.leadTypeId)}
                          </span>
                        </TableCell>
                        <TableCell>{provider.contactInfo || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">{provider.notes || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(provider)}
                              data-testid={`button-edit-${provider.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(provider.id)}
                              data-testid={`button-delete-${provider.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Sheet */}
        <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Service Provider</SheetTitle>
              <SheetDescription>
                Update service provider information
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  data-testid="input-edit-name"
                  placeholder="e.g., Air India, Grand Hyatt"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-leadType">Lead Type *</Label>
                <Select
                  value={formData.leadTypeId}
                  onValueChange={(value) => setFormData({ ...formData, leadTypeId: value })}
                >
                  <SelectTrigger id="edit-leadType" data-testid="select-edit-lead-type">
                    <SelectValue placeholder="Select lead type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadTypes.map((lt) => (
                      <SelectItem key={lt.id} value={lt.id.toString()}>
                        {lt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">Contact Info</Label>
                <Input
                  id="edit-contact"
                  data-testid="input-edit-contact"
                  placeholder="Phone, email, or address"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  data-testid="textarea-edit-notes"
                  placeholder="Additional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingProvider(null);
                    setFormData({ name: "", leadTypeId: "", contactInfo: "", notes: "" });
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}

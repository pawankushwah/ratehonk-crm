import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/layout";
import { 
  Plus, Building2, Mail, Phone, Globe, MapPin, Star, 
  Search, Filter, Grid, List, MoreHorizontal, Trash2, 
  Edit, Eye, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Vendor {
  id: number;
  name: string;
  contactPersonName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  servicesOffered?: string;
  productCategories: string[];
  paymentTerms: string;
  creditLimit?: string;
  taxId?: string;
  status: string;
  notes?: string;
  preferredContactMethod: string;
  contractStartDate?: string;
  contractEndDate?: string;
  rating: number;
  isPreferred: boolean;
  createdAt: Date;
  createdByName?: string;
}

export default function Vendors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: rawVendors = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
  });

  // Transform and filter vendors
  const vendors = rawVendors
    .map((vendor: any) => ({
      id: vendor.id,
      name: vendor.name || "Unnamed Vendor",
      contactPersonName: vendor.contact_person_name || vendor.contactPersonName,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      zipCode: vendor.zip_code || vendor.zipCode,
      country: vendor.country || "United States",
      servicesOffered: vendor.services_offered || vendor.servicesOffered,
      productCategories: vendor.product_categories || vendor.productCategories || [],
      paymentTerms: vendor.payment_terms || vendor.paymentTerms || "Net 30",
      creditLimit: vendor.credit_limit || vendor.creditLimit,
      taxId: vendor.tax_id || vendor.taxId,
      status: vendor.status || "active",
      notes: vendor.notes,
      preferredContactMethod: vendor.preferred_contact_method || vendor.preferredContactMethod || "email",
      contractStartDate: vendor.contract_start_date || vendor.contractStartDate,
      contractEndDate: vendor.contract_end_date || vendor.contractEndDate,
      rating: vendor.rating || 0,
      isPreferred: vendor.is_preferred || vendor.isPreferred || false,
      createdAt: new Date(vendor.created_at || vendor.createdAt || Date.now()),
      createdByName: vendor.created_by_name || vendor.createdByName,
    }))
    .filter((vendor: Vendor) => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (vendor.email && vendor.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           (vendor.servicesOffered && vendor.servicesOffered.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  // Pagination calculations
  const totalVendors = vendors.length;
  const totalPages = Math.ceil(totalVendors / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVendors = vendors.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const [formData, setFormData] = useState({
    name: "",
    contactPersonName: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    servicesOffered: "",
    productCategories: [] as string[],
    paymentTerms: "Net 30",
    creditLimit: "",
    taxId: "",
    status: "active",
    notes: "",
    preferredContactMethod: "email",
    contractStartDate: "",
    contractEndDate: "",
    rating: 0,
    isPreferred: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("🏢 Frontend - Creating vendor with data:", data);
      const response = await apiRequest("POST", "/api/vendors", data);
      const result = await response.json();
      console.log("🏢 Frontend - Vendor creation response:", result);
      return result;
    },
    onSuccess: (result) => {
      console.log("🏢 Frontend - Vendor creation successful:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setShowCreateDialog(false);
      setFormData({
        name: "",
        contactPersonName: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
        servicesOffered: "",
        productCategories: [],
        paymentTerms: "Net 30",
        creditLimit: "",
        taxId: "",
        status: "active",
        notes: "",
        preferredContactMethod: "email",
        contractStartDate: "",
        contractEndDate: "",
        rating: 0,
        isPreferred: false,
      });
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
    },
    onError: (error: any) => {
      console.error("🏢 Frontend - Vendor creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create vendor",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/vendors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setEditingVendor(null);
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVendor) {
      updateMutation.mutate({ id: editingVendor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setFormData({
      name: vendor.name,
      contactPersonName: vendor.contactPersonName || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      website: vendor.website || "",
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      zipCode: vendor.zipCode || "",
      country: vendor.country,
      servicesOffered: vendor.servicesOffered || "",
      productCategories: vendor.productCategories,
      paymentTerms: vendor.paymentTerms,
      creditLimit: vendor.creditLimit || "",
      taxId: vendor.taxId || "",
      status: vendor.status,
      notes: vendor.notes || "",
      preferredContactMethod: vendor.preferredContactMethod,
      contractStartDate: vendor.contractStartDate || "",
      contractEndDate: vendor.contractEndDate || "",
      rating: vendor.rating,
      isPreferred: vendor.isPreferred,
    });
    setEditingVendor(vendor);
    setShowCreateDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      suspended: "bg-red-100 text-red-800"
    };
    
    const icons: Record<string, any> = {
      active: CheckCircle,
      inactive: AlertCircle,
      suspended: XCircle
    };
    
    const Icon = icons[status] || CheckCircle;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.active}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

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
      <div className="p-4 sm:p-8 w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
            <p className="text-muted-foreground">
              Manage your suppliers and vendor relationships
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vendors</CardTitle>
                <CardDescription>
                  {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} total
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
               
  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">          
        <div className="relative flex-1 max-w-sm">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 mb-10" />
                <Input
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table View */}
            <Table className="mt-5">
                <TableHeader className="bg-[#EEF2F6] border-b-2">
                <TableRow>
                  <TableHead>
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Vendor Name</TableHead>
                  <TableHead className=" text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Contact Person</TableHead>
                  <TableHead className=" text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Email</TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Phone</TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Services</TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Payment Terms</TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Status</TableHead>
                  <TableHead className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Rating</TableHead>
                  <TableHead className=" text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVendors.map((vendor) => (
                  <TableRow key={vendor.id} className="hover:bg-gray-50">
                    <TableCell>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          {vendor.isPreferred && (
                            <Badge variant="secondary" className="mt-1">
                              <Star className="h-3 w-3 mr-1" />
                              Preferred
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{vendor.contactPersonName || "-"}</TableCell>
                    <TableCell>
                      {vendor.email ? (
                        <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">
                          {vendor.email}
                        </a>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {vendor.phone ? (
                        <a href={`tel:${vendor.phone}`} className="text-blue-600 hover:underline">
                          {vendor.phone}
                        </a>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={vendor.servicesOffered}>
                        {vendor.servicesOffered || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{vendor.paymentTerms}</TableCell>
                    <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getRatingStars(vendor.rating)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(vendor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(vendor)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            {vendor.website && (
                              <DropdownMenuItem>
                                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                  <Globe className="h-4 w-4 mr-2" />
                                  Visit Website
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => deleteMutation.mutate(vendor.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {paginatedVendors.length === 0 && vendors.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first vendor</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Vendor
                </Button>
              </div>
            )}

            {/* Pagination Controls */}
            {vendors.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Show</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>of {totalVendors} vendors</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || page === totalPages || 
                               (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVendor ? "Edit Vendor" : "Create New Vendor"}
              </DialogTitle>
              <DialogDescription>
                {editingVendor ? "Update vendor information" : "Add a new vendor to your supplier database"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., ABC Transportation Co."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPersonName">Contact Person</Label>
                  <Input
                    id="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPersonName: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@vendor.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://vendor.com"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Business St"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="NY"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="10001"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="United States"
                  />
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="servicesOffered">Services/Products Offered</Label>
                  <Textarea
                    id="servicesOffered"
                    value={formData.servicesOffered}
                    onChange={(e) => setFormData(prev => ({ ...prev, servicesOffered: e.target.value }))}
                    placeholder="Describe what this vendor provides..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select value={formData.paymentTerms} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="COD">Cash on Delivery</SelectItem>
                        <SelectItem value="Prepaid">Prepaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="creditLimit">Credit Limit</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: e.target.value }))}
                      placeholder="10000.00"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                      placeholder="12-3456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredContactMethod">Preferred Contact</Label>
                    <Select value={formData.preferredContactMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, preferredContactMethod: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this vendor..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateDialog(false);
                  setEditingVendor(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 
                    (editingVendor ? "Updating..." : "Creating...") : 
                    (editingVendor ? "Update Vendor" : "Create Vendor")
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
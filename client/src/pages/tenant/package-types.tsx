import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Package, Search, Settings } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '@/components/layout/layout';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Package type form schema
const packageTypeSchema = z.object({
  name: z.string().min(1, 'Package type name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  packageCategory: z.string().optional(),
  displayOrder: z.number().min(0).default(0),
});

type PackageTypeForm = z.infer<typeof packageTypeSchema>;

interface PackageType {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  packageCategory?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

// Predefined package categories
const PACKAGE_CATEGORIES = [
  'Adventure Tours',
  'Family Packages',
  'Business Travel',
  'Luxury Tours',
  'Honeymoon Packages',
  'Group Tours',
  'Weekend Getaways',
  'International Tours',
  'Domestic Tours',
  'Pilgrimage Tours',
  'Educational Tours',
  'Corporate Packages'
];

// Color options for package types
const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
];

function PackageTypeForm({ packageType, open, onClose }: {
  packageType?: PackageType;
  open: boolean;
  onClose: () => void;
}) {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PackageTypeForm>({
    resolver: zodResolver(packageTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: '',
      color: COLOR_OPTIONS[0].value,
      packageCategory: '',
      displayOrder: 0,
    }
  });

  // Reset form when packageType changes (for editing)
  useEffect(() => {
    if (packageType) {
      form.reset({
        name: packageType.name,
        description: packageType.description || '',
        icon: packageType.icon || '',
        color: packageType.color || COLOR_OPTIONS[0].value,
        packageCategory: packageType.packageCategory || '',
        displayOrder: packageType.displayOrder || 0,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        icon: '',
        color: COLOR_OPTIONS[0].value,
        packageCategory: '',
        displayOrder: 0,
      });
    }
  }, [packageType, form]);

  const createMutation = useMutation({
    mutationFn: (data: PackageTypeForm) =>
      apiRequest('POST', `/api/tenants/${tenant?.id}/package-types`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/package-types`] });
      toast({ title: 'Success', description: 'Package type created successfully' });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create package type',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: PackageTypeForm) =>
      apiRequest('PUT', `/api/tenants/${tenant?.id}/package-types/${packageType!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/package-types`] });
      toast({ title: 'Success', description: 'Package type updated successfully' });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update package type',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: PackageTypeForm) => {
    if (packageType) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {packageType ? 'Edit Package Type' : 'Create Package Type'}
          </DialogTitle>
          <DialogDescription>
            {packageType 
              ? 'Update the package type details below.'
              : 'Create a new package type to categorize your travel packages.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Type Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Adventure Tours" 
                        data-testid="input-package-type-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="packageCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-package-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PACKAGE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe this package type..." 
                      data-testid="textarea-package-description"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-package-color">
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COLOR_OPTIONS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: color.value }}
                              />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="0" 
                        data-testid="input-display-order"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-package-type"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Package Type'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function PackageTypes() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPackageType, setEditingPackageType] = useState<PackageType | undefined>(undefined);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: packageTypes = [], isLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/package-types`],
    enabled: !!tenant?.id,
  });

  // Filter and search logic
  const filteredPackageTypes = useMemo(() => {
    let filtered = packageTypes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((type: PackageType) =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.packageCategory?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((type: PackageType) =>
        statusFilter === "active" ? type.isActive : !type.isActive
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((type: PackageType) =>
        type.packageCategory === categoryFilter
      );
    }

    return filtered;
  }, [packageTypes, searchTerm, statusFilter, categoryFilter]);

  // Get unique categories for filter dropdown
  const availableCategories = useMemo(() => {
    const categories = packageTypes
      .map((type: PackageType) => type.packageCategory)
      .filter((category): category is string => !!category);
    return [...new Set(categories)];
  }, [packageTypes]);

  const deleteMutation = useMutation({
    mutationFn: (packageTypeId: number) =>
      apiRequest('DELETE', `/api/tenants/${tenant?.id}/package-types/${packageTypeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/package-types`] });
      toast({ title: 'Success', description: 'Package type deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete package type',
        variant: 'destructive'
      });
    }
  });

  const handleEdit = (packageType: PackageType) => {
    setEditingPackageType(packageType);
  };

  const handleDelete = (packageTypeId: number) => {
    if (confirm('Are you sure you want to delete this package type?')) {
      deleteMutation.mutate(packageTypeId);
    }
  };

  const closeDialog = () => {
    setEditingPackageType(undefined);
    setShowCreateDialog(false);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Package Types</h1>
              <p className="text-muted-foreground">Manage travel package categories and types</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 bg-[#F6F6F6] p-1 mt-0">
        {/* Main Card Container */}
        <div className="bg-white rounded-xl shadow-[0px_1px_6px_0px_rgba(0,0,0,0.05)] border border-[#E3E8EF]">
          {/* Header Section */}
          <div className="w-full h-[72px] flex items-center bg-white px-[18px] py-4 rounded-t-xl border-b border-[#E3E8EF] shadow-[0px_1px_6px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[#1F2937]">Package Types</h1>
                  <p className="text-sm text-[#6B7280]">Manage travel package categories and types</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                data-testid="button-create-package-type"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Package Type
              </Button>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search package types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-package-types"
                />
              </div>

              {/* Filters */}
              <div className="flex space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                {availableCategories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          {packageTypes.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No package types yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first package type to start categorizing your travel packages
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                data-testid="button-create-first-package-type"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Package Type
              </Button>
            </div>
          ) : filteredPackageTypes.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No package types match your search</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
            </div>
          ) : (
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#EEF2F6] border-b-2">
                    <tr>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Package Type
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Category
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Description
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Order
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-[#364152] font-[500] text-[15px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPackageTypes.map((packageType: PackageType) => (
                      <tr
                        key={packageType.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {packageType.color && (
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: packageType.color }}
                              />
                            )}
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {packageType.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {packageType.packageCategory ? (
                            <Badge variant="secondary" className="text-xs">
                              {packageType.packageCategory}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            {packageType.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {packageType.displayOrder}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={packageType.isActive ? "default" : "secondary"}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                              packageType.isActive
                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                : "bg-red-50 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            {packageType.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(packageType)}
                              data-testid={`button-edit-${packageType.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(packageType.id)}
                              data-testid={`button-delete-${packageType.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <PackageTypeForm
        packageType={editingPackageType}
        open={!!editingPackageType || showCreateDialog}
        onClose={closeDialog}
      />
    </Layout>
  );
}
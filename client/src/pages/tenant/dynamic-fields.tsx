import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Edit, Move, Settings, Receipt } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { Layout } from "@/components/layout/layout";
import type { DynamicField } from "@shared/schema";
import { Link } from "wouter";
import { Activity,Mail,Crown } from "lucide-react";

const dynamicFieldSchema = z.object({
  fieldName: z.string().min(1, "Field name is required").regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Field name must be alphanumeric with underscores"),
  fieldLabel: z.string().min(1, "Field label is required"),
  fieldType: z.enum(["text", "number", "select", "date", "boolean", "textarea"]),
  fieldOptions: z.string().optional(),
  isRequired: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  displayOrder: z.number().default(0),
  // Module visibility
  showInLeads: z.boolean().default(true),
  showInCustomers: z.boolean().default(false),
  showInInvoices: z.boolean().default(false),
  showInBookings: z.boolean().default(false),
  showInPackages: z.boolean().default(false),
});

type DynamicFieldForm = z.infer<typeof dynamicFieldSchema>;

export default function DynamicFieldsPage() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<DynamicField | null>(null);

  const form = useForm<DynamicFieldForm>({
    resolver: zodResolver(dynamicFieldSchema),
    defaultValues: {
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      fieldOptions: "",
      isRequired: false,
      isEnabled: true,
      displayOrder: 0,
      showInLeads: true,
      showInCustomers: false,
      showInInvoices: false,
      showInBookings: false,
      showInPackages: false,
    },
  });

  // Fetch dynamic fields for the tenant
  const { data: fields = [], isLoading } = useQuery({
    queryKey: [`dynamic-fields-${tenant?.id}`],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants/${tenant?.id}/dynamic-fields`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch dynamic fields:', errorText);
        throw new Error(`Failed to fetch dynamic fields: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Dynamic fields fetched:', data);
      return data as DynamicField[];
    },
    enabled: !!tenant?.id,
  });

  // Create dynamic field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: DynamicFieldForm) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants/${tenant?.id}/dynamic-fields`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tenantId: tenant?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create dynamic field');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`dynamic-fields-${tenant?.id}`] });
      toast({
        title: "Success",
        description: "Dynamic field created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update dynamic field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async (data: DynamicFieldForm & { id: number }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants/${tenant?.id}/dynamic-fields/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update dynamic field');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`dynamic-fields-${tenant?.id}`] });
      toast({
        title: "Success",
        description: "Dynamic field updated successfully",
      });
      setIsDialogOpen(false);
      setEditingField(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete dynamic field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants/${tenant?.id}/dynamic-fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete dynamic field');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`dynamic-fields-${tenant?.id}`] });
      toast({
        title: "Success",
        description: "Dynamic field deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DynamicFieldForm) => {
    if (editingField) {
      updateFieldMutation.mutate({ ...data, id: editingField.id });
    } else {
      createFieldMutation.mutate(data);
    }
  };

  const handleEdit = (field: DynamicField) => {
    console.log('🔍 Editing field:', field);
    setEditingField(field);
    
    // Map database field names to form field names
    const formData = {
      fieldName: field.field_name || field.fieldName,
      fieldLabel: field.field_label || field.fieldLabel,
      fieldType: (field.field_type || field.fieldType) as any,
      fieldOptions: field.field_options || field.fieldOptions || "",
      isRequired: field.is_required !== undefined ? field.is_required : field.isRequired,
      isEnabled: field.is_enabled !== undefined ? field.is_enabled : field.isEnabled,
      displayOrder: field.display_order !== undefined ? field.display_order : field.displayOrder,
      // Module visibility mapping
      showInLeads: field.show_in_leads !== undefined ? field.show_in_leads : (field as any).showInLeads !== undefined ? (field as any).showInLeads : true,
      showInCustomers: field.show_in_customers !== undefined ? field.show_in_customers : (field as any).showInCustomers !== undefined ? (field as any).showInCustomers : false,
      showInInvoices: field.show_in_invoices !== undefined ? field.show_in_invoices : (field as any).showInInvoices !== undefined ? (field as any).showInInvoices : false,
      showInBookings: field.show_in_bookings !== undefined ? field.show_in_bookings : (field as any).showInBookings !== undefined ? (field as any).showInBookings : false,
      showInPackages: field.show_in_packages !== undefined ? field.show_in_packages : (field as any).showInPackages !== undefined ? (field as any).showInPackages : false,
    };
    
    console.log('🔍 Form data for edit:', formData);
    form.reset(formData);
    setIsDialogOpen(true);
  };

  const handleDelete = (fieldId: number) => {
    if (confirm("Are you sure you want to delete this field? This action cannot be undone.")) {
      deleteFieldMutation.mutate(fieldId);
    }
  };

  const getFieldTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      text: "Text Input",
      number: "Number Input",
      select: "Dropdown Select",
      date: "Date Picker",
      boolean: "Yes/No Toggle",
      textarea: "Text Area",
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
       
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dynamic Fields
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Create custom fields that appear in lead creation and editing forms
          </p>
        </div>

        

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingField(null);
                form.reset();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingField ? "Edit Dynamic Field" : "Create Dynamic Field"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fieldName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., company_size" 
                          {...field}
                          disabled={!!editingField} // Don't allow changing field name after creation
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fieldLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Company Size" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fieldType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text Input</SelectItem>
                          <SelectItem value="textarea">Text Area</SelectItem>
                          <SelectItem value="number">Number Input</SelectItem>
                          <SelectItem value="select">Dropdown Select</SelectItem>
                          <SelectItem value="date">Date Picker</SelectItem>
                          <SelectItem value="boolean">Yes/No Toggle</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("fieldType") === "select" && (
                  <FormField
                    control={form.control}
                    name="fieldOptions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Options</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter each option on a new line:&#10;Small (1-10)&#10;Medium (11-50)&#10;Large (51+)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control}
                    name="isRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Required</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Enabled</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Module Visibility Section */}
                <div className="space-y-4 border-t pt-4">
                  <FormLabel className="text-base font-semibold">Show field in these modules:</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="showInLeads"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Lead Pipeline</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showInCustomers"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Customer Directory</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showInInvoices"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Invoices & Billing</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showInBookings"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Booking Management</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showInPackages"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 col-span-1">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Travel Packages</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
                  >
                    {editingField ? "Update" : "Create"} Field
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
  <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg shadow-sm">

      

      <Link href="/menu-ordering">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <Activity className="w-4 h-4" />
          Menu Customization
        </Button>
      </Link>

      <Link href="/settings">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <Settings className="w-4 h-4" />
          System Settings
        </Button>
      </Link>

      <Link href="/subscription">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <Crown className="w-4 h-4" />
          Subscription Plans
        </Button>
      </Link>
        <Link href="/email-settings">
              <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
                <Mail className="w-4 h-4" />
                Email Configuration
              </Button>
            </Link>
      
      <Link href="/gmail-emails">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <Mail className="w-4 h-4" />
          Gmail Integration
        </Button>
      </Link>
      <Link href="/gst-settings">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <Receipt className="w-4 h-4" />
          GST Settings
        </Button>
      </Link>

    </div>
      {fields.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Dynamic Fields
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Create custom fields to capture additional lead information
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {fields
            .sort((a, b) => (a.display_order || a.displayOrder || 0) - (b.display_order || b.displayOrder || 0))
            .map((field) => (
              <Card key={field.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Move className="h-4 w-4 text-gray-400" />
                      <div>
                        <CardTitle className="text-lg">
                          {field.field_label || field.fieldLabel}
                          {(field.is_required !== undefined ? field.is_required : field.isRequired) && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {field.field_name || field.fieldName} • {getFieldTypeLabel(field.field_type || field.fieldType)}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(field.show_in_leads !== false && (field as any).showInLeads !== false) && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs">
                              Leads
                            </span>
                          )}
                          {((field.show_in_customers || (field as any).showInCustomers)) && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs">
                              Customers
                            </span>
                          )}
                          {((field.show_in_invoices || (field as any).showInInvoices)) && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs">
                              Invoices
                            </span>
                          )}
                          {((field.show_in_bookings || (field as any).showInBookings)) && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 rounded-full text-xs">
                              Bookings
                            </span>
                          )}
                          {((field.show_in_packages || (field as any).showInPackages)) && (
                            <span className="px-2 py-1 bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300 rounded-full text-xs">
                              Packages
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (field.is_enabled !== undefined ? field.is_enabled : field.isEnabled)
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {(field.is_enabled !== undefined ? field.is_enabled : field.isEnabled) ? 'Enabled' : 'Disabled'}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(field)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(field.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {(field.field_options || field.fieldOptions) && (
                  <CardContent className="pt-0">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Options:</strong> {(field.field_options || field.fieldOptions).replace(/\n/g, ', ')}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
        </div>
      )}
      </div>
    </Layout>
  );
}
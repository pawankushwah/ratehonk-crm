import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  MoveUp,
  MoveDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const fieldSchema = z.object({
  fieldName: z.string().min(1, "Field name is required").regex(/^[a-z_][a-z0-9_]*$/, "Field name must be lowercase alphanumeric with underscores"),
  fieldLabel: z.string().min(1, "Field label is required"),
  fieldType: z.enum(["text", "number", "select", "dropdown", "date", "boolean", "textarea"]),
  fieldOptions: z.string().optional(),
  isRequired: z.boolean().default(false),
  displayOrder: z.number().default(0),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
});

type FieldFormData = z.infer<typeof fieldSchema>;

interface LeadTypeField {
  id: number;
  leadTypeId: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  fieldOptions?: string;
  isRequired: boolean;
  displayOrder: number;
  placeholder?: string;
  helpText?: string;
  isActive: boolean;
  createdAt: string;
}

interface LeadTypeFieldsDialogProps {
  leadTypeId: number;
  leadTypeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadTypeFieldsDialog({
  leadTypeId,
  leadTypeName,
  open,
  onOpenChange,
}: LeadTypeFieldsDialogProps) {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<LeadTypeField | null>(null);

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      fieldOptions: "",
      isRequired: false,
      displayOrder: 0,
      placeholder: "",
      helpText: "",
    },
  });

  // Fetch fields for this lead type
  const { data: fields = [], isLoading } = useQuery<LeadTypeField[]>({
    queryKey: [`/api/tenants/${tenant?.id}/lead-types/${leadTypeId}/fields`],
    enabled: !!tenant?.id && !!leadTypeId && open,
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: FieldFormData) => {
      return apiRequest("POST", `/api/tenants/${tenant?.id}/lead-types/${leadTypeId}/fields`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/lead-types/${leadTypeId}/fields`],
      });
      toast({ title: "Custom field created successfully" });
      setIsFieldDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create field",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async (data: FieldFormData & { id: number }) => {
      return apiRequest(
        "PUT",
        `/api/tenants/${tenant?.id}/lead-types/${leadTypeId}/fields/${data.id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/lead-types/${leadTypeId}/fields`],
      });
      toast({ title: "Custom field updated successfully" });
      setIsFieldDialogOpen(false);
      setEditingField(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update field",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      return apiRequest(
        "DELETE",
        `/api/tenants/${tenant?.id}/lead-types/${leadTypeId}/fields/${fieldId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/lead-types/${leadTypeId}/fields`],
      });
      toast({ title: "Custom field deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete field",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FieldFormData) => {
    if (editingField) {
      updateFieldMutation.mutate({ ...data, id: editingField.id });
    } else {
      createFieldMutation.mutate(data);
    }
  };

  const handleEdit = (field: LeadTypeField) => {
    setEditingField(field);
    form.reset({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType as any,
      fieldOptions: field.fieldOptions || "",
      isRequired: field.isRequired,
      displayOrder: field.displayOrder,
      placeholder: field.placeholder || "",
      helpText: field.helpText || "",
    });
    setIsFieldDialogOpen(true);
  };

  const handleDelete = (fieldId: number) => {
    deleteFieldMutation.mutate(fieldId);
  };

  const handleAddField = () => {
    setEditingField(null);
    form.reset({
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      fieldOptions: "",
      isRequired: false,
      displayOrder: fields.length,
      placeholder: "",
      helpText: "",
    });
    setIsFieldDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Custom Fields: {leadTypeName}
            </DialogTitle>
            <DialogDescription>
              Add custom fields to capture type-specific information for this lead type.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {fields.length} custom field{fields.length !== 1 ? "s" : ""}
              </p>
              <Button onClick={handleAddField} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Custom Fields
                </h3>
                <p className="text-gray-600 mb-4">
                  Create custom fields to capture specific information for this lead type
                </p>
                <Button onClick={handleAddField} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Field
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Label</TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">
                          {field.fieldLabel}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {field.fieldName}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{field.fieldType}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {field.fieldOptions ? (
                            <span className="text-xs text-gray-600">
                              {field.fieldOptions.substring(0, 40)}
                              {field.fieldOptions.length > 40 ? "..." : ""}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {field.isRequired ? (
                            <Badge variant="destructive">Required</Badge>
                          ) : (
                            <span className="text-gray-400">Optional</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{field.displayOrder}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(field)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Field</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{field.fieldLabel}"?
                                    This will remove the field from all leads.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(field.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Field Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingField ? "Edit Custom Field" : "Add Custom Field"}
            </DialogTitle>
            <DialogDescription>
              Configure the custom field properties below.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fieldLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Departure City" {...field} />
                      </FormControl>
                      <FormDescription>
                        The label shown to users
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fieldName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., departure_city" {...field} />
                      </FormControl>
                      <FormDescription>
                        Internal name (lowercase, underscores)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fieldType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="select">Select / Dropdown</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="boolean">Yes/No</SelectItem>
                          <SelectItem value="textarea">Long Text</SelectItem>
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
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Order in forms (0 = first)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {(form.watch("fieldType") === "select" || form.watch("fieldType") === "dropdown") && (
                <FormField
                  control={form.control}
                  name="fieldOptions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Options (JSON Array)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='["Option 1", "Option 2", "Option 3"]'
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter options as a JSON array, e.g., ["Economy", "Business", "First Class"]
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="placeholder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placeholder Text (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Enter city name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="helpText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Help Text (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional instructions for users"
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Required Field</FormLabel>
                      <FormDescription>
                        Users must fill this field
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFieldDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
                >
                  {editingField ? "Update Field" : "Add Field"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

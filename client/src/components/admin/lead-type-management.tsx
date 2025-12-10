import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Settings2,
  Type,
  Palette,
  ChevronRight,
  UserCircleIcon,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { Sidebar } from "../layout/sidebar";
import { LeadTypeFieldsDialog } from "./lead-type-fields-dialog";

// Available icons for lead types
const AVAILABLE_ICONS = [
  { value: "🌍", label: "🌍 World" },
  { value: "✈️", label: "✈️ Flight" },
  { value: "🏨", label: "🏨 Hotel" },
  { value: "🎒", label: "🎒 Package" },
  { value: "🎭", label: "🎭 Events" },
  { value: "🏛️", label: "🏛️ Attractions" },
  { value: "🚗", label: "🚗 Transport" },
  { value: "📞", label: "📞 Contact" },
  { value: "💼", label: "💼 Business" },
  { value: "🎯", label: "🎯 Target" },
];

// Available colors for lead types
const AVAILABLE_COLORS = [
  { value: "#3B82F6", label: "Blue", bg: "bg-blue-500" },
  { value: "#10B981", label: "Green", bg: "bg-green-500" },
  { value: "#F59E0B", label: "Orange", bg: "bg-orange-500" },
  { value: "#EF4444", label: "Red", bg: "bg-red-500" },
  { value: "#8B5CF6", label: "Purple", bg: "bg-purple-500" },
  { value: "#06B6D4", label: "Cyan", bg: "bg-cyan-500" },
  { value: "#84CC16", label: "Lime", bg: "bg-lime-500" },
  { value: "#F97316", label: "Orange", bg: "bg-orange-500" },
];

// Available categories for lead types
const AVAILABLE_CATEGORIES = [
  { value: 0, label: "Default" },
  { value: 1, label: "Flight" },
  { value: 2, label: "Hotels" },
  { value: 3, label: "Package" },
  { value: 4, label: "Event Booking" },
  { value: 5, label: "Car Rental" },
  { value: 6, label: "Attraction" },
  { value: 7, label: "holiday" },
  { value: 8, label: "Activities" },
  { value: 9, label: "Insurance" },
  { value: 10, label: "Cruise" },

   
];

const leadTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  lead_type_category: z.number().min(0, "Category is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
  isActive: z.boolean().default(true),
  displayOrder: z.number().min(0).default(0),
});

type LeadTypeFormData = z.infer<typeof leadTypeSchema>;

interface LeadType {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  lead_type_category?: number;
  icon: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export default function LeadTypeManagement() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLeadType, setEditingLeadType] = useState<LeadType | null>(null);
  const [fieldsDialogOpen, setFieldsDialogOpen] = useState(false);
  const [selectedLeadTypeForFields, setSelectedLeadTypeForFields] = useState<LeadType | null>(null);

  const form = useForm<LeadTypeFormData>({
    resolver: zodResolver(leadTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      lead_type_category: AVAILABLE_CATEGORIES[0].value,
      icon: "🌍",
      color: "#3B82F6",
      isActive: true,
      displayOrder: 0,
    },
  });

  // status

  // Fetch lead types
  const { data: leadTypes = [], isLoading } = useQuery<LeadType[]>({
    queryKey: [`/api/tenants/${tenant?.id}/lead-types`],
    enabled: !!tenant?.id,
  });

  // Create lead type mutation
  const createMutation = useMutation({
    mutationFn: async (data: LeadTypeFormData) => {
      return apiRequest("POST", `/api/tenants/${tenant?.id}/lead-types`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/lead-types`],
      });
      toast({ title: "Lead type created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create lead type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update lead type mutation
  const updateMutation = useMutation({
    mutationFn: async (data: LeadTypeFormData & { id: number }) => {
      return apiRequest(
        "PUT",
        `/api/tenants/${tenant?.id}/lead-types/${data.id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/lead-types`],
      });
      toast({ title: "Lead type updated successfully" });
      setIsDialogOpen(false);
      setEditingLeadType(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update lead type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete lead type mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(
        "DELETE",
        `/api/tenants/${tenant?.id}/lead-types/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/lead-types`],
      });
      toast({ title: "Lead type deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete lead type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: LeadTypeFormData) => {
    if (editingLeadType) {
      updateMutation.mutate({ ...data, id: editingLeadType.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (leadType: LeadType) => {
    console.log("Editing leadType:", leadType);
    setEditingLeadType(leadType);
    form.reset({
      name: leadType.name,
      description: leadType.description || "",
      lead_type_category: leadType.lead_type_category || 0,
      icon: leadType.icon,
      color: leadType.color,
      isActive: leadType.isActive,
      displayOrder: leadType.displayOrder,
    });
    setIsDialogOpen(true);
  };

  console.log("leadTypes", leadTypes);
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const resetForm = () => {
    setEditingLeadType(null);
    form.reset({
      name: "",
      description: "",
      lead_type_category: 0,
      icon: "🌍",
      color: "#3B82F6",
      isActive: true,
      displayOrder: 0,
    });
  };

  return (
    //  <SidebarProvider>
    //  <div className="min-h-screen bg-background flex w-full">
    // <Sidebar />
    <SidebarInset className="flex-1 flex flex-col min-w-0 w-full">
      <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <h1 className="text-[20px] text-[#121926] font-medium leading-6 tracking-normal ">
            Lead Type Management
          </h1>
        </div>

        {/* Right side: Icons */}
        <div className="flex items-center gap-4">
          {/* Replace with your actual icon components */}
          <button className="hover:text-gray-700 transition-colors">
            {/* bell icon notificaiotn button */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0.5"
                y="0.5"
                width="39"
                height="39"
                rx="5.5"
                fill="white"
              />
              <rect
                x="0.5"
                y="0.5"
                width="39"
                height="39"
                rx="5.5"
                stroke="#E3E8EF"
              />
              <path
                d="M18 13C18 12.4696 18.2107 11.9609 18.5858 11.5858C18.9609 11.2107 19.4696 11 20 11C20.5304 11 21.0391 11.2107 21.4142 11.5858C21.7893 11.9609 22 12.4696 22 13C23.1484 13.543 24.1274 14.3883 24.8321 15.4453C25.5367 16.5023 25.9404 17.7311 26 19V22C26.0753 22.6217 26.2954 23.2171 26.6428 23.7381C26.9902 24.2592 27.4551 24.6914 28 25H12C12.5449 24.6914 13.0098 24.2592 13.3572 23.7381C13.7046 23.2171 13.9247 22.6217 14 22V19C14.0596 17.7311 14.4633 16.5023 15.1679 15.4453C15.8726 14.3883 16.8516 13.543 18 13Z"
                stroke="#364152"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M17 25V26C17 26.7956 17.3161 27.5587 17.8787 28.1213C18.4413 28.6839 19.2044 29 20 29C20.7956 29 21.5587 28.6839 22.1213 28.1213C22.6839 27.5587 23 26.7956 23 26V25"
                stroke="#364152"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button className="hover:text-gray-700 transition-colors">
            <UserCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Lead Types Table */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-1 p-4">
              <div className="flex items-center space-x-1">
                {/* file icon */}
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 11H17L20 14H27C27.5304 14 28.0391 14.2107 28.4142 14.5858C28.7893 14.9609 29 15.4696 29 16V24C29 24.5304 28.7893 25.0391 28.4142 25.4142C28.0391 25.7893 27.5304 26 27 26H13C12.4696 26 11.9609 25.7893 11.5858 25.4142C11.2107 25.0391 11 24.5304 11 24V13C11 12.4696 11.2107 11.9609 11.5858 11.5858C11.9609 11.2107 12.4696 11 13 11Z"
                    stroke="#364152"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span className="font-medium leading-[24px] text-[#364152]">
                  Lead{" "}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 mx-8" />
              <div className="flex items-center space-x-2 px-3 py-1 bg-[#eef3ff] border-[2px] border-[#759df3] rounded-md">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clip-path="url(#clip0_55_4802)">
                    <path
                      d="M12 1V5C12 5.26522 12.1054 5.51957 12.2929 5.70711C12.4804 5.89464 12.7348 6 13 6H17"
                      stroke="#101828"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M15 19H5C4.46957 19 3.96086 18.7893 3.58579 18.4142C3.21071 18.0391 3 17.5304 3 17V3C3 2.46957 3.21071 1.96086 3.58579 1.58579C3.96086 1.21071 4.46957 1 5 1H12L17 6V17C17 17.5304 16.7893 18.0391 16.4142 18.4142C16.0391 18.7893 15.5304 19 15 19Z"
                      stroke="#101828"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M10 9V15"
                      stroke="#101828"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M7 12H13"
                      stroke="#101828"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_55_4802">
                      <rect width="20" height="20" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                <span className="font-semibold text-[14px] leading-[24px] text-[#364152]">
                  Lead Types
                </span>
              </div>
            </div>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingLeadType
                      ? "Edit Lead Type"
                      : "Create New Lead Type"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingLeadType
                      ? "Update the lead type configuration"
                      : "Add a new lead type for categorizing leads"}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Type className="h-4 w-4" />
                            Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Flight Booking"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Optional description for this lead type"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lead_type_category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {AVAILABLE_CATEGORIES.map((category) => (
                                <SelectItem
                                  key={category.value}
                                  value={category.value.toString()}
                                >
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Icon</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {AVAILABLE_ICONS.map((icon) => (
                                  <SelectItem
                                    key={icon.value}
                                    value={icon.value}
                                  >
                                    {icon.label}
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
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Palette className="h-4 w-4" />
                              Color
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {AVAILABLE_COLORS.map((color) => (
                                  <SelectItem
                                    key={color.value}
                                    value={color.value}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-4 h-4 rounded ${color.bg}`}
                                      />
                                      {color.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Active</FormLabel>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Enable this lead type
                              </div>
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
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          createMutation.isPending || updateMutation.isPending
                        }
                      >
                        {editingLeadType ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : leadTypes.length === 0 ? (
            <div className="text-center py-8">
              <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Lead Types
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first lead type to categorize leads
              </p>
            </div>
          ) : (
            <Table className="rounded-2xl overflow-hidden">
              <TableHeader className=" bg-[#EEF2F6] border-b-2 text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadTypes
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((leadType) => (
                    <TableRow key={leadType.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: leadType.color }}
                          >
                            {leadType.icon}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {leadType.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600 dark:text-gray-400">
                          {leadType.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600 dark:text-gray-400">
                          {AVAILABLE_CATEGORIES.find(cat => cat.value === leadType.lead_type_category)?.label || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {/* <Badge variant={leadType.isActive ? "default" : "secondary"}>
                          {leadType.isActive ? "Active" : "Inactive"}
                        </Badge> */}

                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${leadType.isActive ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mr-2 ${leadType.isActive ? "bg-green-500" : "bg-blue-500"}`}
                          />
                          {leadType?.isActive ? "active" : "new"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{leadType.displayOrder}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(leadType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLeadTypeForFields(leadType);
                              setFieldsDialogOpen(true);
                            }}
                            title="Manage custom fields"
                          >
                            <Settings2 className="h-4 w-4 text-blue-600" />
                          </Button> */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Lead Type
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "
                                  {leadType.name}"? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(leadType.id)}
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
        </CardContent>
      </Card>

      {/* Custom Fields Management Dialog */}
      {selectedLeadTypeForFields && (
        <LeadTypeFieldsDialog
          leadTypeId={selectedLeadTypeForFields.id}
          leadTypeName={selectedLeadTypeForFields.name}
          open={fieldsDialogOpen}
          onOpenChange={setFieldsDialogOpen}
        />
      )}
    </SidebarInset>
    // </div>
    // </SidebarProvider>
  );
}

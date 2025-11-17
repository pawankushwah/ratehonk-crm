import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { SlidePanel } from "@/components/ui/slide-panel";
import { LeadTypeCreateForm } from "@/components/forms/lead-type-create-form";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DollarSign, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { TravelModuleForm } from "./travel-module-form";
import { handleNumericKeyDown } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AutocompleteInput,
  AutocompleteOption,
} from "@/components/ui/autocomplete-input";
import { useAuth } from "@/components/auth/auth-provider";
import type { Customer } from "@shared/schema";
import { directCustomersApi } from "@/lib/direct-customers-api";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { EnhancedCustomerForm } from "@/components/customer/enhanced-customer-form";

const leadSchema = z.object({
  leadTypeId: z.string().min(1, "Lead type is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  status: z.string().default("new"),
  notes: z.string().optional(),
  budgetRange: z.string().optional(),
  priority: z.string().default("medium"),
  typeSpecificData: z.record(z.any()).optional(),
  dynamicData: z.record(z.any()).optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface FlexibleLeadFormProps {
  lead?: any;
  tenantId: string;
  userId: string;
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface LeadType {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  displayOrder: number;
  lead_type_category?: number;
}

export function FlexibleLeadForm({
  lead,
  tenantId,
  userId,
  onSubmit,
  onCancel,
  isLoading = false,
}: FlexibleLeadFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formValidationErrors, setFormValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState("");

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key === "Enter" ||
      e.key === "." ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Home" ||
      e.key === "End"
    ) {
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const [selectedLeadType, setSelectedLeadType] = useState(
    lead?.leadTypeId?.toString() || ""
  );
  const [selectedCountry, setSelectedCountry] = useState(lead?.country || "");
  const [selectedState, setSelectedState] = useState(lead?.state || "");
  const [typeSpecificData, settypeSpecificData] = useState(
    lead?.typeSpecificData || {}
  );
  const [isLeadTypePanelOpen, setIsLeadTypePanelOpen] = useState(false);

  const {
    data: leadTypes = [],
    isLoading: leadTypesLoading,
    error: leadTypesError,
    isError: leadTypesIsError,
  } = useQuery<LeadType[]>({
    queryKey: [`/api/tenants/${tenantId}/lead-types`],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/tenants/${tenantId}/lead-types`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    },
  });

  console.log("leadTypes:", leadTypes);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      leadTypeId: lead?.leadTypeId?.toString() || "",
      firstName: lead?.fisrt_name || "",
      lastName: lead?.email_name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      source: lead?.source || "",
      status: lead?.status || "new",
      notes: lead?.notes || "",
      budgetRange: lead?.budgetRange || "",
      priority: lead?.priority || "medium",
      country: lead?.country || "",
      state: lead?.state || "",
      city: lead?.city || "",
      typeSpecificData: lead?.type_specific_data || {},
      dynamicData: lead?.dynamicData || {},
    },
  });

  useEffect(() => {
    if (lead) {
      const leadTypeId = lead.leadTypeId?.toString() || "";

      form.reset({
        leadTypeId: leadTypeId,
        firstName: lead.first_name || "",
        lastName: lead.last_name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source || "",
        status: lead.status || "new",
        notes: lead.notes || "",
        budgetRange: lead.budgetRange || "",
        priority: lead.priority || "medium",
        country: lead.country || "",
        state: lead.state || "",
        city: lead.city || "",
        typeSpecificData: lead.type_specific_data || {},
        dynamicData: lead.dynamicData || {},
      });

      setSelectedLeadType(leadTypeId);
      setSelectedCountry(lead.country || "");
      setSelectedState(lead.state || "");
    }
  }, [lead, form]);

  const { data: dynamicFields = [], isLoading: dynamicFieldsLoading } =
    useQuery({
      queryKey: [`dynamic-fields-${tenantId}`],
      enabled: !!tenantId,
      queryFn: async () => {
        const token = auth.getToken();
        const response = await fetch(
          `/api/tenants/${tenantId}/dynamic-fields`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        return data.filter((field: any) => field.show_in_leads !== false);
      },
    });

  const getCategoryInfo = (leadTypeId: string) => {
    const leadType = leadTypes.find((lt) => lt.id.toString() === leadTypeId);
    if (!leadType) return { name: "Unknown", icon: "❓" };

    const iconMap: { [key: string]: string } = {
      plane: "✈️",
      hotel: "🏩",
      car: "🚗",
      calendar: "📅",
      "map-pin": "🗺️",
    };

    return {
      name: leadType.name,
      icon: leadType.icon ? iconMap[leadType.icon] || "🌍" : "🌍",
      color: leadType.color,
    };
  };

  const getTravelCategoryKey = (categoryNumber: number | undefined): string => {
    const categoryToKeyMap: { [key: string]: string } = {
      "1": "flight",
      "2": "hotel",
      "3": "package",
      "4": "event",
      "5": "car-rental",
      "6": "attraction",
      "7": "holiday",
      "0": "default",
    };

    return categoryToKeyMap[categoryNumber || "0"] || "flight";
  };

  const setupDefaultTypes = useMutation({
    mutationFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/tenants/${tenantId}/lead-types/setup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to setup default lead types");
      }
      const data = await response.json();
      return data;
    },
  });

  useEffect(() => {
    if (tenantId && leadTypes.length === 0 && !leadTypesError) {
      setupDefaultTypes.mutate();
    }
  }, [tenantId, leadTypes.length, leadTypesError]);

  useEffect(() => {
    if (leadTypes.length > 0 && !selectedLeadType && !lead?.leadTypeId) {
      const firstLeadType = leadTypes[0];
      setSelectedLeadType(firstLeadType.id.toString());
      form.setValue("leadTypeId", firstLeadType.id.toString());
    }
  }, [leadTypes, selectedLeadType, lead?.leadTypeId]);

  useEffect(() => {
    if (selectedCountry) {
      setSelectedState("");
      form.setValue("state", "");
      form.setValue("city", "");
    }
  }, [selectedCountry]);

  const { data: leadDynamicData, isLoading: dynamicDataLoading } = useQuery({
    queryKey: [`lead-dynamic-sql-${lead?.id}`],
    enabled: !!lead?.id && !!tenantId,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      try {
        const response = await fetch("/api/debug/execute-sql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            sql: `SELECT df.field_name, dfv.field_value FROM dynamic_field_values dfv JOIN dynamic_fields df ON dfv.field_id = df.id WHERE dfv.lead_id = ${lead.id} AND df.tenant_id = ${tenantId} AND df.show_in_leads = true`,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && Array.isArray(result.data)) {
            const dynamicData: Record<string, any> = {};
            result.data.forEach((field: any) => {
              dynamicData[field.field_name] = field.field_value;
            });
            return dynamicData;
          }
        }
      } catch (error) {
        console.error("Error fetching dynamic data:", error);
      }

      return {};
    },
  });

  useEffect(() => {
    if (lead) {
      if (leadDynamicData && Object.keys(leadDynamicData).length > 0) {
        form.setValue("dynamicData", leadDynamicData);
        Object.entries(leadDynamicData).forEach(([fieldName, fieldValue]) => {
          form.setValue(`dynamicData.${fieldName}`, fieldValue);
        });
        setTimeout(() => {
          form.setValue("dynamicData", leadDynamicData);
        }, 50);
      }

      form.reset({
        leadTypeId: lead.leadTypeId?.toString() || "",
        firstName: lead.first_name || "",
        lastName: lead.last_name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source || "",
        status: lead.status || "new",
        notes: lead.notes || "",
        budgetRange: lead.budgetRange || "",
        priority: lead.priority || "medium",
        country: lead.country || "",
        state: lead.state || "",
        city: lead.city || "",
        typeSpecificData: lead.type_specific_data || {},
        dynamicData: leadDynamicData || lead.dynamicData || {},
      });

      if (lead.leadTypeId) {
        setSelectedLeadType(lead.leadTypeId.toString());
      }
      if (lead.country) {
        setSelectedCountry(lead.country);
      }
      if (lead.state) {
        setSelectedState(lead.state);
      }

      setTimeout(() => {
        form.setValue("budgetRange", lead.budgetRange || "");
        form.setValue("priority", lead.priority || "medium");
        form.setValue("country", lead.country || "");
        form.setValue("state", lead.state || "");
        form.setValue("city", lead.city || "");
        form.setValue("notes", lead.notes || "");
        form.setValue("dynamicData", leadDynamicData || lead.dynamicData || {});

        if (
          lead.typeSpecificData &&
          Object.keys(lead.typeSpecificData).length > 0
        ) {
          form.setValue("typeSpecificData", lead.typeSpecificData);
          Object.entries(lead.typeSpecificData).forEach(
            ([fieldName, fieldValue]) => {
              form.setValue(`typeSpecificData.${fieldName}`, fieldValue);
            }
          );
        }
      }, 100);
    } else {
      form.reset({
        leadTypeId: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        source: "",
        status: "new",
        notes: "",
        budgetRange: "",
        priority: "medium",
        country: "",
        state: "",
        city: "",
        typeSpecificData: {},
        dynamicData: {},
      });
      setSelectedLeadType("");
      setSelectedCountry("");
      setSelectedState("");
    }
  }, [lead?.id, form]);

  const { data: leadTypeFields = [] } = useQuery({
    queryKey: [
      "/api/tenants",
      tenantId,
      "lead-types",
      selectedLeadType,
      "fields",
    ],
    enabled: !!tenantId && !!selectedLeadType,
  });

  const { data: countries = [] } = useQuery<any[]>({
    queryKey: ["/api/location/countries"],
    enabled: true,
  });

  const {
    data: states = [],
    isLoading: statesLoading,
    error: statesError,
  } = useQuery<any[]>({
    queryKey: [`/api/location/states/${selectedCountry}`],
    enabled: !!selectedCountry,
    refetchOnMount: true,
    staleTime: 0,
  });

  const handleLeadTypeChange = (leadTypeId: string) => {
    if (leadTypeId === "create_new") {
      setIsLeadTypePanelOpen(true);
    } else {
      setSelectedLeadType(leadTypeId);
      form.setValue("leadTypeId", leadTypeId);
      form.setValue("typeSpecificData", {});
    }
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedState("");
    form.setValue("country", countryCode);
    form.setValue("state", "");
    form.setValue("city", "");
  };

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    form.setValue("state", stateName);
    form.setValue("city", "");
  };

  const selectedLeadTypeData = leadTypes.find(
    (type: any) => type.id === parseInt(selectedLeadType)
  );

  const renderDynamicField = (fieldConfig: any) => {
    const fieldName = `dynamicData.${fieldConfig.field_name || fieldConfig.fieldName}`;
    const currentValue =
      form.watch("dynamicData")?.[
        fieldConfig.field_name || fieldConfig.fieldName
      ];

    switch (fieldConfig.field_type || fieldConfig.fieldType) {
      case "text":
        return (
          <FormField
            key={fieldConfig.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  {fieldConfig.field_label || fieldConfig.fieldLabel}
                  {(fieldConfig.is_required || fieldConfig.isRequired) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder={`Enter ${(fieldConfig.field_label || fieldConfig.fieldLabel).toLowerCase()}`}
                    value={currentValue || ""}
                    onChange={(e) => {
                      const dynamicData = form.getValues("dynamicData") || {};
                      dynamicData[
                        fieldConfig.field_name || fieldConfig.fieldName
                      ] = e.target.value;
                      form.setValue("dynamicData", dynamicData);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "textarea":
        return (
          <FormField
            key={fieldConfig.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  {fieldConfig.field_label || fieldConfig.fieldLabel}
                  {(fieldConfig.is_required || fieldConfig.isRequired) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder={`Enter ${(fieldConfig.field_label || fieldConfig.fieldLabel).toLowerCase()}`}
                    value={currentValue || ""}
                    onChange={(e) => {
                      const dynamicData = form.getValues("dynamicData") || {};
                      dynamicData[
                        fieldConfig.field_name || fieldConfig.fieldName
                      ] = e.target.value;
                      form.setValue("dynamicData", dynamicData);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "dropdown":
      case "select":
        const options = (
          fieldConfig.field_options ||
          fieldConfig.fieldOptions ||
          []
        ).map((option: any) => ({
          value:
            typeof option === "string"
              ? option
              : option.value || option.label || option,
          label:
            typeof option === "string"
              ? option
              : option.label || option.value || option,
        }));

        return (
          <FormField
            key={fieldConfig.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  {fieldConfig.field_label || fieldConfig.fieldLabel}
                  {(fieldConfig.is_required || fieldConfig.isRequired) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Combobox
                    options={options}
                    value={currentValue || ""}
                    onValueChange={(value) => {
                      const dynamicData = form.getValues("dynamicData") || {};
                      dynamicData[
                        fieldConfig.field_name || fieldConfig.fieldName
                      ] = value;
                      form.setValue("dynamicData", dynamicData);
                    }}
                    placeholder={`Select ${(fieldConfig.field_label || fieldConfig.fieldLabel).toLowerCase()}`}
                    searchPlaceholder="Search..."
                    emptyText="No options found"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "number":
      case "currency":
        return (
          <FormField
            key={fieldConfig.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold mb-1.5 block">
                  {fieldConfig.fieldLabel}
                  {fieldConfig.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    {fieldConfig.fieldType === "currency" && (
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input
                      type="text"
                      onKeyDown={handleNumericKeyDown}
                      className={`h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        fieldConfig.fieldType === "currency" ? "pl-10" : ""
                      }`}
                      placeholder={
                        fieldConfig.placeholder ||
                        `Enter ${fieldConfig.fieldLabel.toLowerCase()}`
                      }
                      value={currentValue || ""}
                      onChange={(e) => {
                        const typeSpecificData =
                          form.getValues("typeSpecificData") || {};
                        typeSpecificData[fieldConfig.fieldName] =
                          e.target.value;
                        form.setValue("typeSpecificData", typeSpecificData);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  const leadTypeOptions = [
    {
      value: "Activity",
      label: "Activity",
    },
    {
      value: "Holidays",
      label: "Holidays",
    },
    ...leadTypes.map((type) => {
      const categoryInfo = getCategoryInfo(type.id.toString());
      return {
        value: type.id.toString(),
        label: type.name,
        icon: <span className="text-base">{categoryInfo.icon}</span>,
      };
    }),
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const statusOptions = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "proposal", label: "Proposal" },
    { value: "negotiation", label: "Negotiation" },
    { value: "closed_won", label: "Closed Won" },
    { value: "closed_lost", label: "Closed Lost" },
  ];

  const sourceOptions = [
    { value: "all", label: "All sources" },
    { value: "website", label: "Website" },
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "twitter", label: "Twitter" },
    { value: "google", label: "Google" },
    { value: "referral", label: "Referral" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "trade_show", label: "Trade Show" },
    { value: "advertisement", label: "Advertisement" },
    { value: "other", label: "Other" },
  ];

  const countryOptions = countries.map((country: any) => ({
    value: country.code,
    label: `${country.flag} ${country.name}`,
  }));

  const stateOptions = states.map((state: any) => ({
    value: state.name,
    label: state.name,
  }));

  // fetch customers details

  const { data: customers = [] } = useQuery({
    queryKey: [`customers-tenant-${tenant?.id}`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/customers?action=get-customers&tenantId=${tenant?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result)
        ? result
        : result.customers || result.data || result.rows || [];
    },
  });

  const getCustomerOptions = (): AutocompleteOption[] => {
    const customerOptions = customers.map((customer: any) => {
      const name =
        customer.name ||
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
        "Unnamed Customer";
      const email = customer.email ? ` | ${customer.email}` : "";
      const phone = customer.phone ? ` | ${customer.phone}` : "";
      return {
        value: `${name}`,
        label: `${name}`,
      };
    });
    console.log("selectedCustomerId", customerOptions);
    return [
      { value: "create_new", label: "➕ Create New Customer" },
      ...customerOptions,
    ];
  };

  // add customers

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      return directCustomersApi.createCustomer(tenant?.id!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`customers-tenant-${tenant?.id}`],
      });
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      setFormValidationErrors({}); 
    },
    onError: (error: any) => {
      
      if (
        error.validationErrors &&
        Object.keys(error.validationErrors).length > 0
      ) {
        setFormValidationErrors(error.validationErrors);
        const errorMessages = Object.values(error.validationErrors).join(", ");
        toast({
          title: "Validation Error",
          description: errorMessages,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create customer",
          variant: "destructive",
        });
        setFormValidationErrors({});
      }
    },
  });

  const onSubmitCustomer = (data: any) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return directCustomersApi.updateCustomer(tenant?.id!, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`customers-tenant-${tenant?.id}`],
      });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      setIsDialogOpen(false);
      setEditingCustomer(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <div className="w-full max-w-[987px] bg-white border border-[#E3E8EF] rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Basic Information
            </h2>

            <div className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-12 md:col-span-5">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700 block mb-1.5">
                        Search Customer
                      </FormLabel>
                      <FormControl>
                        <AutocompleteInput
                          data-testid="autocomplete-customer"
                          suggestions={getCustomerOptions()}
                          value={field.value}
                          onValueChange={(val) => field.onChange(val)}
                          placeholder="Search name, gmail, organization"
                          emptyText="No customers found"
                          className="h-10 rounded-md border-gray-300 focus:ring-2 focus:ring-cyan-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-6 md:col-span-2 flex items-center">
                <Button
                  className={`
          w-[137px] h-[32px] 
          rounded-[6px] 
          bg-[#0E76BC] hover:bg-[#0C5F96] 
          text-white text-xs font-medium 
          flex items-center justify-center 
          gap-[10px] 
          px-[12px] py-[8px] 
          shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]
          transition-colors
        `}
                  onClick={() => {
                    setEditingCustomer(null);
                    setFormValidationErrors({});
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  New Customer
                </Button>
              </div>

              {/* Budget */}
              <div className="col-span-6 md:col-span-5">
                <FormField
                  control={form.control}
                  name="budgetRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700 block mb-1.5">
                        Budget
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-10 rounded-md border-gray-300 focus:ring-2 focus:ring-cyan-500 placeholder:text-gray-400"
                          placeholder="Select Source"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700 block mb-1.5">
                        Status
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={statusOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select Status"
                          className="h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-12 md:col-span-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700 block mb-1.5">
                        Priority
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={priorityOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select Priority"
                          className="h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700 block mb-1.5">
                        Source
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={sourceOptions}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Select Source"
                          className="h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? "Edit Customer" : "Add New Customer"}
                </DialogTitle>
                <DialogDescription>
                  {editingCustomer
                    ? "Update the customer information below."
                    : "Fill in the customer information below."}
                </DialogDescription>
              </DialogHeader>
              <EnhancedCustomerForm
                customer={editingCustomer}
                tenantId={tenant?.id!}
                onSubmit={onSubmitCustomer}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setFormValidationErrors({});
                }}
                isLoading={
                  createCustomerMutation.isPending ||
                  updateCustomerMutation.isPending
                }
                serverErrors={formValidationErrors}
              />
            </DialogContent>
          </Dialog>

          {dynamicFields.length > 0 && (
            <div className="col-span-12">
              <Accordion type="single" collapsible>
                <AccordionItem value="dynamic-fields">
                  <AccordionTrigger className="text-xs font-semibold">
                    Additional Fields ({dynamicFields.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-12 gap-3 pt-2">
                      {dynamicFields.map((field: any) => (
                        <div key={field.id} className="col-span-4">
                          {renderDynamicField(field)}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          <div className="col-span-12 mt-5">
            <div className="w-[987px] bg-white border border-[#E3E8EF] rounded-[8px] p-[20px] space-y-[16px]">
              <h2 className="text-sm font-semibold text-gray-900">
                Lead Details
              </h2>
              <h2 className="text-sm font-semibold text-gray-900">Lead Type</h2>

              <div className="flex flex-wrap">
                {leadTypeOptions.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleLeadTypeChange(type.value)}
                    type="button"
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                      selectedLeadType === type.value
                        ? "bg-[#F8FAFC] text-black border-[#E2E8F0]" 
                        : "bg-white text-black border-gray-300 hover:bg-gray-50" 
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Travel Module Form */}
              {selectedLeadType &&
                selectedLeadTypeData &&
                selectedLeadTypeData.lead_type_category != 0 && (
                  <TravelModuleForm
                    form={form}
                    selectedCategory={getTravelCategoryKey(
                      selectedLeadTypeData?.lead_type_category
                    )}
                    typeSpecificData={typeSpecificData}
                  />
                )}
            </div>
          </div>

          <div className="col-span-12 mt-5">
            <div className="w-full max-w-[987px] bg-white border border-[#E3E8EF] rounded-lg p-5 space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold mb-1.5 block">
                      Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Enter Notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div
          className="
    w-full lg:w-[987px]
    flex items-center justify-between
    px-5 py-5
  "
        >
          <div className="flex gap-3 w-full max-w-[947px] justify-end">
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="
        h-[44px] px-5 
        rounded-[8px] text-sm font-medium
        border border-[#D0D5DD] 
        text-gray-700 bg-white 
        hover:bg-gray-50
        disabled:opacity-50 disabled:cursor-not-allowed
      "
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="
        h-[44px] px-6 
        rounded-[8px] text-sm font-medium
        bg-[#0E76BC] text-white 
        hover:bg-[#0C5F96]
        shadow-[0px_1px_2px_rgba(16,24,40,0.05)]
        disabled:opacity-50 disabled:cursor-not-allowed
      "
            >
              {isLoading ? "Saving..." : lead ? "Update Lead" : "Create Lead"}
            </Button>
          </div>
        </div>
      </form>

      {/* Slide Panel for Creating New Travel Category */}
      {/* <SlidePanel
        isOpen={isLeadTypePanelOpen}
        onClose={() => setIsLeadTypePanelOpen(false)}
        title="Create New Travel Category"
      >
        <LeadTypeCreateForm
          tenantId={parseInt(tenantId)}
          onSuccess={(leadType) => {
            queryClient.invalidateQueries({
              queryKey: [`/api/tenants/${tenantId}/lead-types`],
            });
            setSelectedLeadType(leadType.id.toString());
            form.setValue("leadTypeId", leadType.id.toString());
            setIsLeadTypePanelOpen(false);
            toast({
              title: "Success",
              description: "Travel category created successfully",
            });
          }}
          onCancel={() => setIsLeadTypePanelOpen(false)}
        />
      </SlidePanel> */}
    </Form>
  );
}

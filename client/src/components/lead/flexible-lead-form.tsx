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
    lead?.leadTypeId?.toString() || "",
  );
  const [selectedCountry, setSelectedCountry] = useState(lead?.country || "");
  const [selectedState, setSelectedState] = useState(lead?.state || "");
  const [typeSpecificData, settypeSpecificData] = useState(
    lead?.typeSpecificData || {},
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
          },
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
      const response = await fetch(`/api/tenants/${tenantId}/lead-types/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
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
            },
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
    (type: any) => type.id === parseInt(selectedLeadType),
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
      value: "create_new",
      label: "+ Create New Travel Category",
      icon: <Plus className="h-4 w-4 text-cyan-600" />,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    First Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                      placeholder="First name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                      placeholder="Last name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                      type="email"
                      placeholder="Email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    Phone
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                      placeholder="Phone number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    Source
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={sourceOptions}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder="Select source"
                      searchPlaceholder="Search sources..."
                      emptyText="No source found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="budgetRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    Budget
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                      placeholder="e.g., $5,000 - $10,000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    Country
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={countryOptions}
                      value={selectedCountry}
                      onValueChange={handleCountryChange}
                      placeholder="Select country"
                      searchPlaceholder="Search countries..."
                      emptyText="No country found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    State
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={stateOptions}
                      value={selectedState}
                      onValueChange={handleStateChange}
                      placeholder={
                        statesLoading ? "Loading..." : "Select state"
                      }
                      searchPlaceholder="Search states..."
                      emptyText="No state found"
                      disabled={!selectedCountry || statesLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    City
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-10 rounded-lg px-3 py-2 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                      placeholder="City name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="leadTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    Travel Category
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={leadTypeOptions}
                      value={selectedLeadType}
                      onValueChange={handleLeadTypeChange}
                      placeholder="Select category"
                      searchPlaceholder="Search categories..."
                      emptyText="No categories found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    Priority
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={priorityOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select priority"
                      searchPlaceholder="Search..."
                      emptyText="No priority found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    Status
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={statusOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select status"
                      searchPlaceholder="Search..."
                      emptyText="No status found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {selectedLeadType &&
            selectedLeadTypeData &&
            selectedLeadTypeData.lead_type_category != 0 && (
              <div className="col-span-12">
                <TravelModuleForm
                  form={form}
                  selectedCategory={getTravelCategoryKey(
                    selectedLeadTypeData?.lead_type_category,
                  )}
                  typeSpecificData={typeSpecificData}
                />
              </div>
            )}

          <div className="col-span-12">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold mb-1.5 block">
                    Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Additional notes or comments"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : lead ? "Update Lead" : "Create Lead"}
          </Button>
        </div>
      </form>

      {/* Slide Panel for Creating New Travel Category */}
      <SlidePanel
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
      </SlidePanel>
    </Form>
  );
}
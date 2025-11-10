import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  User,
  Globe,
  Mail,
  Phone,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Enhanced customer schema with location and dynamic fields
const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  status: z.string().default("active"),
  notes: z.string().optional(),
  dynamicData: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface EnhancedCustomerFormProps {
  customer?: any;
  tenantId: string;
  onSubmit: (data: CustomerFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  serverErrors?: Record<string, string>;
}

export function EnhancedCustomerForm({
  customer,
  tenantId,
  onSubmit,
  onCancel,
  isLoading = false,
  serverErrors = {},
}: EnhancedCustomerFormProps) {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const handleSubmit = (data: CustomerFormData) => {
    console.log("🔍 Customer Form - Form submitted with data:", data);
    console.log("🔍 Customer Form - Selected country:", selectedCountry);
    console.log("🔍 Customer Form - Selected state:", selectedState);
    console.log("🔍 Customer Form - Form errors:", form.formState.errors);
    onSubmit(data);
  };

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: customer?.firstName || customer?.name?.split(" ")[0] || "",
      lastName:
        customer?.lastName ||
        customer?.name?.split(" ").slice(1).join(" ") ||
        "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      country: customer?.country || "",
      state: customer?.state || "",
      city: customer?.city || "",
      pincode: customer?.pincode || "",
      status:
        customer?.status ||
        customer?.crm_status ||
        customer?.crmStatus ||
        "active",
      notes: customer?.notes || "",
      dynamicData: customer?.dynamicData || customer?.dynamic_data || {},
      preferences: customer?.preferences || {},
    },
  });

  // Fetch countries
  const { data: countries = [] } = useQuery({
    queryKey: ["/api/location/countries"],
    enabled: true,
  });

  // Fetch states for selected country
  const {
    data: states = [],
    isLoading: statesLoading,
    error: statesError,
  } = useQuery({
    queryKey: [`/api/location/states/${selectedCountry}`],
    enabled: !!selectedCountry,
    refetchOnMount: true,
    staleTime: 0, // Always refetch
    retry: 1, // Reduce retries for faster fallback
  });

  // Fetch cities for selected state
  const { data: cities = [] } = useQuery({
    queryKey: [`/api/location/cities/${selectedCountry}/${selectedState}`],
    enabled: !!selectedCountry && !!selectedState,
  });

  // Fetch custom customer columns
  // Fetch dynamic fields for customers from the existing dynamic fields system
  const { data: dynamicFields = [] } = useQuery({
    queryKey: [`dynamic-fields-tenant-${tenantId}`],
    enabled: !!tenantId,
    queryFn: async () => {
      console.log(
        "🔍 Fetching dynamic fields for customer form, tenant:",
        tenantId,
      );
      const response = await fetch(
        `/api/tenants/${tenantId}/dynamic-fields`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (response.ok) {
        const result = await response.json();
        console.log("🔍 Raw dynamic fields response:", result);
        // Filter fields that should show in customers module
        const filtered = Array.isArray(result)
          ? result.filter((field: any) => field.show_in_customers)
          : [];
        console.log("🔍 Filtered customer fields:", filtered);
        return filtered;
      }
      return [];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Initialize location fields when customer data changes
  useEffect(() => {
    if (customer) {
      console.log("🔍 Form - Setting customer data:", customer);
      console.log("🔍 Form - Customer name:", customer.name);
      console.log("🔍 Form - Customer city:", customer.city);
      console.log("🔍 Form - Customer state:", customer.state);
      console.log("🔍 Form - Customer country:", customer.country);

      // Set location state variables first
      const customerCountry = customer.country || "";
      const customerState = customer.state || "";

      setSelectedCountry(customerCountry);
      setSelectedState(customerState);

      // Parse name into firstName/lastName
      const fullName = customer.name || "";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      console.log(
        "🔍 Form - Parsed firstName:",
        firstName,
        "lastName:",
        lastName,
      );

      // Update form values for all fields
      const formData = {
        firstName: customer.firstName || firstName,
        lastName: customer.lastName || lastName,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        country: customerCountry,
        state: customerState,
        city: customer.city || "",
        pincode: customer.pincode || "",
        status:
          customer.status ||
          customer.crm_status ||
          customer.crmStatus ||
          "active",
        notes: customer.notes || "",
        dynamicData: customer.dynamicData || customer.dynamic_data || {},
        preferences: customer.preferences || {},
      };

      console.log("🔍 Form - Resetting form with data:", formData);
      form.reset(formData);
    }
  }, [customer, form]);

  // Ensure state and city are maintained when editing
  useEffect(() => {
    if (
      customer &&
      selectedCountry &&
      customer.state &&
      selectedState !== customer.state
    ) {
      console.log("🔍 Form - Setting state for editing:", customer.state);
      setSelectedState(customer.state);
      form.setValue("state", customer.state);
    }
  }, [customer, selectedCountry, selectedState, form]);

  // Ensure city is maintained when editing
  useEffect(() => {
    if (customer && customer.city && form.getValues("city") !== customer.city) {
      console.log("🔍 Form - Setting city for editing:", customer.city);
      form.setValue("city", customer.city);
    }
  }, [customer, form]);

  // Debug dynamic fields
  useEffect(() => {
    console.log("🔍 Customer Form - Dynamic fields loaded:", dynamicFields);
    console.log(
      "🔍 Customer Form - Dynamic fields count:",
      dynamicFields.length,
    );
    dynamicFields.forEach((field: any) => {
      console.log(
        "🔍 Customer Form - Field:",
        field.field_name,
        "Type:",
        field.field_type,
        "Show in customers:",
        field.show_in_customers,
      );
    });
  }, [dynamicFields]);

  // Reset state when country changes
  useEffect(() => {
    if (selectedCountry && !customer) {
      setSelectedState("");
      form.setValue("state", "");
      form.setValue("city", "");
    }
  }, [selectedCountry]);

  // Handle server-side validation errors
  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      Object.entries(serverErrors).forEach(([field, message]) => {
        // Map server field names to form field names if needed
        const formFieldName = field as keyof CustomerFormData;
        form.setError(formFieldName, {
          type: "server",
          message: message,
        });
      });
    }
    // Note: We don't clear errors when serverErrors is empty to avoid clearing
    // client-side validation errors. Server errors will be cleared when form is reset.
  }, [serverErrors, form]);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedState("");
    form.setValue("country", countryCode);
    form.setValue("state", "");
    form.setValue("city", "");
  };

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode);
    form.setValue("state", stateCode);
    form.setValue("city", "");
  };

  const renderDynamicField = (column: any) => {
    const fieldName = `dynamicData.${column.fieldName}`;
    const currentValue = form.watch("dynamicData")?.[column.fieldName];

    switch (column.fieldType) {
      case "text":
      case "email":
      case "phone":
        return (
          <FormField
            key={column.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {column.fieldLabel}
                  {column.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type={column.fieldType}
                    placeholder={
                      column.placeholder ||
                      `Enter ${column.fieldLabel.toLowerCase()}`
                    }
                    value={currentValue || ""}
                    onChange={(e) => {
                      const dynamicData = form.getValues("dynamicData") || {};
                      dynamicData[column.fieldName] = e.target.value;
                      form.setValue("dynamicData", dynamicData);
                    }}
                  />
                </FormControl>
                {column.helpText && (
                  <p className="text-sm text-muted-foreground">
                    {column.helpText}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "textarea":
        return (
          <FormField
            key={column.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {column.fieldLabel}
                  {column.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={
                      column.placeholder ||
                      `Enter ${column.fieldLabel.toLowerCase()}`
                    }
                    value={currentValue || ""}
                    onChange={(e) => {
                      const dynamicData = form.getValues("dynamicData") || {};
                      dynamicData[column.fieldName] = e.target.value;
                      form.setValue("dynamicData", dynamicData);
                    }}
                  />
                </FormControl>
                {column.helpText && (
                  <p className="text-sm text-muted-foreground">
                    {column.helpText}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "select":
        return (
          <FormField
            key={column.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {column.fieldLabel}
                  {column.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </FormLabel>
                <Select
                  value={currentValue || ""}
                  onValueChange={(value) => {
                    const dynamicData = form.getValues("dynamicData") || {};
                    dynamicData[column.fieldName] = value;
                    form.setValue("dynamicData", dynamicData);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`Select ${column.fieldLabel.toLowerCase()}`}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {column.fieldOptions?.map((option: any) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {column.helpText && (
                  <p className="text-sm text-muted-foreground">
                    {column.helpText}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "number":
        return (
          <FormField
            key={column.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {column.fieldLabel}
                  {column.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder={
                      column.placeholder ||
                      `Enter ${column.fieldLabel.toLowerCase()}`
                    }
                    value={currentValue || ""}
                    onChange={(e) => {
                      const dynamicData = form.getValues("dynamicData") || {};
                      dynamicData[column.fieldName] = e.target.value;
                      form.setValue("dynamicData", dynamicData);
                    }}
                  />
                </FormControl>
                {column.helpText && (
                  <p className="text-sm text-muted-foreground">
                    {column.helpText}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "date":
        return (
          <FormField
            key={column.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {column.fieldLabel}
                  {column.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    value={currentValue || ""}
                    onChange={(e) => {
                      const dynamicData = form.getValues("dynamicData") || {};
                      dynamicData[column.fieldName] = e.target.value;
                      form.setValue("dynamicData", dynamicData);
                    }}
                  />
                </FormControl>
                {column.helpText && (
                  <p className="text-sm text-muted-foreground">
                    {column.helpText}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter email address"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone (with country code like 01,91,...)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Country
                    </FormLabel>
                    <Select
                      value={selectedCountry}
                      onValueChange={handleCountryChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country: any) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
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
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <Select
                      value={selectedState}
                      onValueChange={handleStateChange}
                      disabled={!selectedCountry || statesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              statesLoading
                                ? "Loading states..."
                                : "Select state"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {states.length > 0
                          ? states.map((state: any) => (
                              <SelectItem key={state.code} value={state.code}>
                                {state.name}
                              </SelectItem>
                            ))
                          : selectedCountry &&
                            !statesLoading && (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No states available
                              </div>
                            )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN/ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter PIN/ZIP code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Fields */}
        {dynamicFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Custom Fields
                <Badge variant="secondary">{dynamicFields.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dynamicFields.map((field: any) => (
                  <div key={field.id}>
                    {field.field_type === "text" && (
                      <FormField
                        control={form.control}
                        name={`dynamicData.${field.field_name}` as any}
                        render={() => (
                          <FormItem>
                            <FormLabel>
                              {field.field_name
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l: string) =>
                                  l.toUpperCase(),
                                )}
                              {field.is_required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={`Enter ${field.field_name.replace(/_/g, " ")}`}
                                value={
                                  form.getValues("dynamicData")?.[
                                    field.field_name
                                  ] || ""
                                }
                                onChange={(e) => {
                                  const dynamicData =
                                    form.getValues("dynamicData") || {};
                                  dynamicData[field.field_name] =
                                    e.target.value;
                                  form.setValue("dynamicData", dynamicData);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {field.field_type === "textarea" && (
                      <FormField
                        control={form.control}
                        name={`dynamicData.${field.field_name}` as any}
                        render={() => (
                          <FormItem>
                            <FormLabel>
                              {field.field_name
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l: string) =>
                                  l.toUpperCase(),
                                )}
                              {field.is_required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`Enter ${field.field_name.replace(/_/g, " ")}`}
                                value={
                                  form.getValues("dynamicData")?.[
                                    field.field_name
                                  ] || ""
                                }
                                onChange={(e) => {
                                  const dynamicData =
                                    form.getValues("dynamicData") || {};
                                  dynamicData[field.field_name] =
                                    e.target.value;
                                  form.setValue("dynamicData", dynamicData);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {field.field_type === "select" && (
                      <FormField
                        control={form.control}
                        name={`dynamicData.${field.field_name}` as any}
                        render={() => {
                          let options = [];
                          if (field.field_options) {
                            if (typeof field.field_options === "string") {
                              // Handle newline-separated options (like "Small (1-10)\nMedium (11-50)\nLarge (51+)")
                              options = field.field_options
                                .split("\n")
                                .filter((opt) => opt.trim());
                            } else if (Array.isArray(field.field_options)) {
                              options = field.field_options;
                            }
                          }
                          return (
                            <FormItem>
                              <FormLabel>
                                {field.field_name
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l: string) =>
                                    l.toUpperCase(),
                                  )}
                                {field.is_required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </FormLabel>
                              <Select
                                value={
                                  form.getValues("dynamicData")?.[
                                    field.field_name
                                  ] || ""
                                }
                                onValueChange={(value) => {
                                  const dynamicData =
                                    form.getValues("dynamicData") || {};
                                  dynamicData[field.field_name] = value;
                                  form.setValue("dynamicData", dynamicData);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={`Select ${field.field_name.replace(/_/g, " ")}`}
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {options.map((option: string) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    )}

                    {field.field_type === "number" && (
                      <FormField
                        control={form.control}
                        name={`dynamicData.${field.field_name}` as any}
                        render={() => (
                          <FormItem>
                            <FormLabel>
                              {field.field_name
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l: string) =>
                                  l.toUpperCase(),
                                )}
                              {field.is_required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={`Enter ${field.field_name.replace(/_/g, " ")}`}
                                value={
                                  form.getValues("dynamicData")?.[
                                    field.field_name
                                  ] || ""
                                }
                                onChange={(e) => {
                                  const dynamicData =
                                    form.getValues("dynamicData") || {};
                                  dynamicData[field.field_name] =
                                    e.target.value;
                                  form.setValue("dynamicData", dynamicData);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {field.field_type === "date" && (
                      <FormField
                        control={form.control}
                        name={`dynamicData.${field.field_name}` as any}
                        render={() => (
                          <FormItem>
                            <FormLabel>
                              {field.field_name
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l: string) =>
                                  l.toUpperCase(),
                                )}
                              {field.is_required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={
                                  form.getValues("dynamicData")?.[
                                    field.field_name
                                  ] || ""
                                }
                                onChange={(e) => {
                                  const dynamicData =
                                    form.getValues("dynamicData") || {};
                                  dynamicData[field.field_name] =
                                    e.target.value;
                                  form.setValue("dynamicData", dynamicData);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes about this customer"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : customer
                ? "Update Customer"
                : "Create Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

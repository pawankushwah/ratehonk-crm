import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAuth } from "@/components/auth/auth-provider";

import {
  Settings as SettingsIcon,
  Building2,
  Bell,
  Shield,
  Globe,
  Mail,
  Database,
  Palette,
  Key,
  Zap,
  Save,
  RefreshCw,
  User,
  CreditCard,
  Calendar,
  Upload,
  Image,
  Receipt,
  ArrowRight,
  MessageCircle,
} from "lucide-react";

// Schema for tenant settings
const tenantSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  subdomain: z.string().min(3, "Subdomain must be at least 3 characters"),
  timezone: z.string(),
  currency: z.string(),
  dateFormat: z.string(),
  companyLogo: z.string().optional(),
});

// Schema for user preferences
const userPreferencesSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  language: z.string(),
  theme: z.string(),
  emailNotifications: z.boolean(),
  browserNotifications: z.boolean(),
});

// Schema for system settings
const systemSettingsSchema = z.object({
  leadScoringEnabled: z.boolean(),
  autoLeadAssignment: z.boolean(),
  autoAssignmentPriorityRoleId: z.number().nullable().optional(),
  duplicateDetection: z.boolean(),
  dataRetentionDays: z.number().min(30).max(2555),
  auditLogging: z.boolean(),
  sessionTimeout: z.number().min(15).max(480),
});

// Schema for WhatsApp settings
const whatsappSettingsSchema = z.object({
  enableLeadWelcomeMessage: z.boolean(),
  leadWelcomeMessage: z.string().min(1, "Lead welcome message is required"),
  enableCustomerWelcomeMessage: z.boolean(),
  customerWelcomeMessage: z
    .string()
    .min(1, "Customer welcome message is required"),
});

// Schema for Zoom settings
const zoomSettingsSchema = z.object({
  zoomAccountId: z.string().optional(),
  zoomClientId: z.string().optional(),
  zoomClientSecret: z.string().optional(),
});

type TenantSettings = z.infer<typeof tenantSettingsSchema>;
type UserPreferences = z.infer<typeof userPreferencesSchema>;
type SystemSettings = z.infer<typeof systemSettingsSchema>;
type WhatsAppSettings = z.infer<typeof whatsappSettingsSchema>;
type ZoomSettings = z.infer<typeof zoomSettingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("tenant");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Read tab from URL query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) {
      // Valid tabs: tenant, user, notifications, system, whatsapp
      const validTabs = ["tenant", "user", "notifications", "system", "whatsapp"];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Fetch current settings - using existing tenant data
  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ["/api/tenant/settings"],
  });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user/preferences"],
  });

  const { data: systemData, isLoading: systemLoading } = useQuery({
    queryKey: ["/api/system/settings"],
  });

  const { data: whatsappData, isLoading: whatsappLoading } = useQuery({
    queryKey: ["/api/tenant-settings"],
  });

  const { tenant } = useAuth();
  const tenantId = tenant?.id;

  // Fetch roles for auto-assignment priority role dropdown
  const { data: roles = [] } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/roles`],
    queryFn: async () => {
      if (!tenantId) return [];
      const res = await fetch(`/api/tenants/${tenantId}/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!tenantId,
  });

  // Forms with data from API
  const tenantForm = useForm<TenantSettings>({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: {
      companyName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      subdomain: "",
      timezone: "UTC",
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      companyLogo: "",
    },
  });

  // Update form when data loads
  React.useEffect(() => {
    if (tenantData) {
      tenantForm.reset({
        companyName: (tenantData as any).companyName || "",
        contactEmail: (tenantData as any).contactEmail || "",
        contactPhone: (tenantData as any).contactPhone || "",
        address: (tenantData as any).address || "",
        subdomain: (tenantData as any).subdomain || "",
        timezone: (tenantData as any).timezone || "UTC",
        currency: (tenantData as any).currency || "USD",
        dateFormat: (tenantData as any).dateFormat || "MM/DD/YYYY",
        companyLogo: (tenantData as any).companyLogo || "",
      });
    }
  }, [tenantData, tenantForm]);

  const userForm = useForm<UserPreferences>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      language: "en",
      theme: "system",
      emailNotifications: true,
      browserNotifications: true,
    },
  });

  // Update user form when data loads
  React.useEffect(() => {
    if (userData) {
      userForm.reset({
        firstName: (userData as any).firstName || "",
        lastName: (userData as any).lastName || "",
        email: (userData as any).email || "",
        phone: (userData as any).phone || "",
        language: (userData as any).language || "en",
        theme: (userData as any).theme || "system",
        emailNotifications: (userData as any).emailNotifications !== false,
        browserNotifications: (userData as any).browserNotifications !== false,
      });
    }
  }, [userData, userForm]);

  const systemForm = useForm<SystemSettings>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      leadScoringEnabled: true,
      autoLeadAssignment: false,
      autoAssignmentPriorityRoleId: null,
      duplicateDetection: true,
      dataRetentionDays: 365,
      auditLogging: true,
      sessionTimeout: 120,
    },
  });

  // Update system form when data loads
  React.useEffect(() => {
    if (systemData) {
      systemForm.reset({
        leadScoringEnabled: (systemData as any).leadScoringEnabled !== false,
        autoLeadAssignment: (systemData as any).autoLeadAssignment === true,
        autoAssignmentPriorityRoleId: (systemData as any).autoAssignmentPriorityRoleId || null,
        duplicateDetection: (systemData as any).duplicateDetection !== false,
        dataRetentionDays: (systemData as any).dataRetentionDays || 365,
        auditLogging: (systemData as any).auditLogging !== false,
        sessionTimeout: (systemData as any).sessionTimeout || 120,
      });
    }
  }, [systemData, systemForm]);

  // Load auto-assignment priority role from tenant settings
  React.useEffect(() => {
    if (whatsappData && (whatsappData as any).autoAssignmentPriorityRoleId !== undefined) {
      systemForm.setValue('autoAssignmentPriorityRoleId', (whatsappData as any).autoAssignmentPriorityRoleId || null);
    }
  }, [whatsappData, systemForm]);

  const whatsappForm = useForm<WhatsAppSettings>({
    resolver: zodResolver(whatsappSettingsSchema),
    defaultValues: {
      enableLeadWelcomeMessage: true,
      leadWelcomeMessage:
        "Hello! Thank you for your interest. Our team will get in touch with you shortly.",
      enableCustomerWelcomeMessage: true,
      customerWelcomeMessage:
        "Welcome! Thank you for choosing us. We're excited to serve you!",
    },
  });

  // Update WhatsApp form when data loads
  React.useEffect(() => {
    if (whatsappData) {
      whatsappForm.reset({
        enableLeadWelcomeMessage:
          (whatsappData as any).enableLeadWelcomeMessage !== false,
        leadWelcomeMessage:
          (whatsappData as any).leadWelcomeMessage ||
          "Hello! Thank you for your interest. Our team will get in touch with you shortly.",
        enableCustomerWelcomeMessage:
          (whatsappData as any).enableCustomerWelcomeMessage !== false,
        customerWelcomeMessage:
          (whatsappData as any).customerWelcomeMessage ||
          "Welcome! Thank you for choosing us. We're excited to serve you!",
      });
    }
  }, [whatsappData, whatsappForm]);

  const zoomForm = useForm<ZoomSettings>({
    resolver: zodResolver(zoomSettingsSchema),
    defaultValues: {
      zoomAccountId: "",
      zoomClientId: "",
      zoomClientSecret: "",
    },
  });

  // Update Zoom form when data loads
  React.useEffect(() => {
    if (tenantData) {
      zoomForm.reset({
        zoomAccountId: (tenantData as any).zoomAccountId || "",
        zoomClientId: (tenantData as any).zoomClientId || "",
        zoomClientSecret: (tenantData as any).zoomClientSecret || "",
      });
    }
  }, [tenantData, zoomForm]);

  // Mutations
  const updateTenantMutation = useMutation({
    mutationFn: async (data: TenantSettings) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/tenant/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Update tenant settings error:", errorData);

        // Check for specific error types
        if (response.status === 413 || errorData.includes("entity too large")) {
          throw new Error(
            "Request too large. Please reduce image size or remove logo and try again.",
          );
        }

        throw new Error("Failed to update tenant settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Tenant settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant"] });
      // Force reload to update sidebar
      window.location.reload();
    },
    onError: (error: any) => {
      console.error("Tenant settings update error:", error);
      toast({
        title: "Failed to update tenant settings",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserPreferences) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Update user preferences error:", errorData);
        throw new Error("Failed to update user preferences");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User preferences updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: () => {
      toast({
        title: "Failed to update user preferences",
        variant: "destructive",
      });
    },
  });

  const updateSystemMutation = useMutation({
    mutationFn: async (data: SystemSettings) => {
      const token = localStorage.getItem("auth_token");
      
      // Update auto-assignment priority role separately via dedicated endpoint
      if (data.autoAssignmentPriorityRoleId !== undefined) {
        try {
          await apiRequest("PUT", "/api/tenant-settings/auto-assignment", {
            autoAssignmentPriorityRoleId: data.autoAssignmentPriorityRoleId,
          });
        } catch (error) {
          console.error("Failed to update auto-assignment priority role:", error);
          // Don't throw - continue with other settings
        }
      }

      // Update other system settings
      const { autoAssignmentPriorityRoleId, ...otherSettings } = data;
      const response = await fetch("/api/system/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(otherSettings),
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Update system settings error:", errorData);
        throw new Error("Failed to update system settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "System settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/system/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-settings"] });
    },
    onError: () => {
      toast({
        title: "Failed to update system settings",
        variant: "destructive",
      });
    },
  });

  const updateWhatsAppMutation = useMutation({
    mutationFn: async (data: WhatsAppSettings) => {
      return await apiRequest("PUT", "/api/tenant-settings/whatsapp", data);
    },
    onSuccess: () => {
      toast({ title: "WhatsApp settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-settings"] });
    },
    onError: () => {
      toast({
        title: "Failed to update WhatsApp settings",
        variant: "destructive",
      });
    },
  });

  const updateZoomMutation = useMutation({
    mutationFn: async (data: ZoomSettings) => {
      return await apiRequest("PUT", "/api/tenant-settings/zoom", data);
    },
    onSuccess: () => {
      toast({ title: "Zoom credentials saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/settings"] });
    },
    onError: () => {
      toast({
        title: "Failed to update Zoom credentials",
        variant: "destructive",
      });
    },
  });

  const onTenantSubmit = (data: TenantSettings) => {
    updateTenantMutation.mutate(data);
  };

  const onUserSubmit = (data: UserPreferences) => {
    updateUserMutation.mutate(data);
  };

  const onSystemSubmit = (data: SystemSettings) => {
    updateSystemMutation.mutate(data);
  };

  const onWhatsAppSubmit = (data: WhatsAppSettings) => {
    updateWhatsAppMutation.mutate(data);
  };

  const onZoomSubmit = (data: ZoomSettings) => {
    updateZoomMutation.mutate(data);
  };

  // Handle logo upload
  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 1MB for better performance)
    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: "File too large",
        description:
          "Please select an image smaller than 1MB for optimal performance",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append("logo", file);

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/tenant/upload-logo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }

      const result = await response.json();
      const logoUrl = result.logoUrl;

      // Update form with new logo URL
      tenantForm.setValue("companyLogo", logoUrl);
      setLogoPreview(logoUrl);

      // Invalidate tenant settings cache to update header logo immediately
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/settings"] });

      toast({
        title: "Logo uploaded successfully",
        description: "Your company logo has been updated",
      });
    } catch (error) {
      console.error("Logo upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Set logo preview from form data
  React.useEffect(() => {
    const currentLogo = tenantForm.watch("companyLogo");
    if (currentLogo) {
      setLogoPreview(currentLogo);
    }
  }, [tenantForm]);

  if (tenantLoading || userLoading || systemLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-8 w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account, system preferences, and application
              configuration
            </p>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tenant" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* Tenant Settings Tab */}
          <TabsContent value="tenant" className="space-y-6">
            <Form {...tenantForm}>
              <form
                onSubmit={tenantForm.handleSubmit(onTenantSubmit)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Company Information
                    </CardTitle>
                    <CardDescription>
                      Basic information about your company
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={tenantForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your Company Name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Company Logo Upload */}
                      <FormField
                        control={tenantForm.control}
                        name="companyLogo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Logo</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                {/* Logo Preview */}
                                {logoPreview && (
                                  <div className="flex items-center gap-4">
                                    <img
                                      src={logoPreview}
                                      alt="Company Logo Preview"
                                      className="h-16 w-16 object-contain border rounded-lg"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setLogoPreview(null);
                                        field.onChange("");
                                      }}
                                    >
                                      Remove Logo
                                    </Button>
                                  </div>
                                )}

                                {/* Upload Button */}
                                <div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    id="company-logo-upload"
                                    disabled={uploadingLogo}
                                  />
                                  <label
                                    htmlFor="company-logo-upload"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                                  >
                                    {uploadingLogo ? (
                                      <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Image className="h-4 w-4 mr-2" />
                                        Upload Company Logo
                                      </>
                                    )}
                                  </label>
                                </div>
                                <p className="text-sm text-gray-500">
                                  Company logo for header display. Recommended:
                                  PNG/JPG, max 1MB, square format for best
                                  performance.
                                </p>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={tenantForm.control}
                        name="subdomain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subdomain</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Input placeholder="myagency" {...field} />
                                <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-muted text-muted-foreground">
                                  .travelcrm.com
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Your unique subdomain for accessing the CRM
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={tenantForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="info@youragency.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tenantForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+1 (555) 123-4567"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={tenantForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="123 Main Street, City, State, ZIP Code"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Localization Settings
                    </CardTitle>
                    <CardDescription>
                      Configure timezone, currency, and date format
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={tenantForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="America/New_York">
                                  Eastern Time
                                </SelectItem>
                                <SelectItem value="America/Chicago">
                                  Central Time
                                </SelectItem>
                                <SelectItem value="America/Denver">
                                  Mountain Time
                                </SelectItem>
                                <SelectItem value="America/Los_Angeles">
                                  Pacific Time
                                </SelectItem>
                                <SelectItem value="Europe/London">
                                  London
                                </SelectItem>
                                <SelectItem value="Europe/Paris">
                                  Paris
                                </SelectItem>
                                <SelectItem value="Asia/Tokyo">
                                  Tokyo
                                </SelectItem>
                                <SelectItem value="Asia/Kolkata">
                                  India
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tenantForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">
                                  USD - US Dollar
                                </SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="GBP">
                                  GBP - British Pound
                                </SelectItem>
                                <SelectItem value="CAD">
                                  CAD - Canadian Dollar
                                </SelectItem>
                                <SelectItem value="AUD">
                                  AUD - Australian Dollar
                                </SelectItem>
                                <SelectItem value="INR">
                                  INR - Indian Rupee
                                </SelectItem>
                                <SelectItem value="JPY">
                                  JPY - Japanese Yen
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tenantForm.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Format</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MM/DD/YYYY">
                                  MM/DD/YYYY
                                </SelectItem>
                                <SelectItem value="DD/MM/YYYY">
                                  DD/MM/YYYY
                                </SelectItem>
                                <SelectItem value="YYYY-MM-DD">
                                  YYYY-MM-DD
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateTenantMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {updateTenantMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Company Settings
                  </Button>
                </div>
              </form>
            </Form>

            {/* GST/Tax Settings Navigation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  GST / Tax Settings
                </CardTitle>
                <CardDescription>
                  Configure tax rates, GST, VAT, or sales tax for your invoices
                  and bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/gst-settings">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    data-testid="button-gst-settings"
                  >
                    <span>Manage Tax Configuration</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>
                    Page URL:{" "}
                    <code className="bg-muted px-2 py-0.5 rounded">
                      /gst-settings
                    </code>
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Preferences Tab */}
          <TabsContent value="user" className="space-y-6">
            <Form {...userForm}>
              <form
                onSubmit={userForm.handleSubmit(onUserSubmit)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Your personal details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={userForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="john@company.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+1 (555) 123-4567"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Display Preferences
                    </CardTitle>
                    <CardDescription>
                      Customize your interface and display settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={userForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                                <SelectItem value="it">Italian</SelectItem>
                                <SelectItem value="pt">Portuguese</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Choose how you want to receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={userForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Email Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive notifications via email
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

                      <FormField
                        control={userForm.control}
                        name="browserNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Browser Notifications
                              </FormLabel>
                              <FormDescription>
                                Show notifications in your browser
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
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {updateUserMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Profile Settings
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <Form {...systemForm}>
              <form
                onSubmit={systemForm.handleSubmit(onSystemSubmit)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Lead Management
                    </CardTitle>
                    <CardDescription>
                      Configure lead scoring and assignment settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={systemForm.control}
                        name="leadScoringEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Lead Scoring
                              </FormLabel>
                              <FormDescription>
                                Automatically score leads based on behavior and
                                attributes
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

                      <FormField
                        control={systemForm.control}
                        name="autoLeadAssignment"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Auto Lead Assignment
                              </FormLabel>
                              <FormDescription>
                                Automatically assign leads to team members based
                                on rules
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

                      <FormField
                        control={systemForm.control}
                        name="autoAssignmentPriorityRoleId"
                        render={({ field }) => (
                          <FormItem className="rounded-lg border p-4">
                            <div className="space-y-3">
                              <div>
                                <FormLabel className="text-base">
                                  Auto-Assignment Priority Role
                                </FormLabel>
                                <FormDescription>
                                  Select which role should receive leads first when auto-assigning. 
                                  Leads will be distributed evenly among users with this role based on workload.
                                  Leave empty to use default assignment logic.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Select
                                  value={field.value?.toString() || "none"}
                                  onValueChange={(value) => {
                                    field.onChange(value === "none" ? null : parseInt(value));
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority role (optional)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None (Use Default Logic)</SelectItem>
                                    {Array.isArray(roles) && roles.map((role: any) => (
                                      <SelectItem key={role.id} value={role.id.toString()}>
                                        {role.name}
                                        {role.isDefault && " (Owner)"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              {field.value && (
                                <p className="text-sm text-muted-foreground">
                                  Selected role: {roles.find((r: any) => r.id === field.value)?.name || 'Unknown'}
                                </p>
                              )}
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemForm.control}
                        name="duplicateDetection"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Duplicate Detection
                              </FormLabel>
                              <FormDescription>
                                Prevent duplicate leads from being created
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
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security & Data
                    </CardTitle>
                    <CardDescription>
                      Configure security settings and data retention
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={systemForm.control}
                      name="auditLogging"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Audit Logging
                            </FormLabel>
                            <FormDescription>
                              Log all system activities for compliance and
                              security
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={systemForm.control}
                        name="dataRetentionDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Retention (days)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="30"
                                max="2555"
                                placeholder="365"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              How long to keep deleted records
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={systemForm.control}
                        name="sessionTimeout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Session Timeout (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="15"
                                max="480"
                                placeholder="120"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Users will be logged out after this period of
                              inactivity
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateSystemMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {updateSystemMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save System Settings
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Available Integrations
                </CardTitle>
                <CardDescription>
                  Connect with external services and tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">Email Marketing</h3>
                        <Badge variant="secondary">Connected</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      SendGrid integration for email campaigns
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Configure
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Globe className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-semibold">Social Media</h3>
                        <Badge variant="outline">Available</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Facebook and Instagram lead capture
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Connect
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <CreditCard className="h-8 w-8 text-purple-500" />
                      <div>
                        <h3 className="font-semibold">Payment Gateway</h3>
                        <Badge variant="outline">Available</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Stripe integration for secure payments
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Connect
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="h-8 w-8 text-orange-500" />
                      <div>
                        <h3 className="font-semibold">Calendar Sync</h3>
                        <Badge variant="outline">Available</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Google Calendar integration
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Connect
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Database className="h-8 w-8 text-red-500" />
                      <div>
                        <h3 className="font-semibold">Analytics</h3>
                        <Badge variant="outline">Available</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Google Analytics tracking
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Connect
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Key className="h-8 w-8 text-indigo-500" />
                      <div>
                        <h3 className="font-semibold">API Access</h3>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      REST API for custom integrations
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Keys
                    </Button>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Zoom Configuration Section */}
            <Form {...zoomForm}>
              <form onSubmit={zoomForm.handleSubmit(onZoomSubmit)}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h17A1.5 1.5 0 0 1 22 5.5v4.34a3.499 3.499 0 0 0-2-1.08V6.5H4v11h16v-2.26c.61.07 1.23.26 1.75.56a.499.499 0 0 0 .25.06c.28 0 .55-.15.71-.41.21-.35.09-.8-.26-1.01a4.453 4.453 0 0 0-2.45-.69c-2.48 0-4.5 2.02-4.5 4.5S17.52 23 20 23s4.5-2.02 4.5-4.5c0-.88-.26-1.7-.71-2.39-.22-.34-.67-.44-1.01-.21-.35.22-.44.67-.21 1.01.3.45.46.99.46 1.59 0 1.65-1.35 3-3 3s-3-1.35-3-3 1.35-3 3-3c.83 0 1.58.34 2.12.89V5.5A1.5 1.5 0 0 0 20.5 4h-17A1.5 1.5 0 0 0 2 5.5v13A1.5 1.5 0 0 0 3.5 20h11.24c.13.72.41 1.39.79 1.98.16.25.43.39.71.39.12 0 .24-.03.36-.08a.748.748 0 0 0 .31-1.01 3.48 3.48 0 0 1 0-3.56c.22-.34.12-.8-.22-1.02-.35-.22-.8-.12-1.02.22-.54.83-.82 1.78-.82 2.77 0 .17.01.34.03.5H3.5A1.5 1.5 0 0 1 2 18.5v-13z"/>
                      </svg>
                      Zoom Meeting Integration
                    </CardTitle>
                    <CardDescription>
                      Configure Zoom Server-to-Server OAuth credentials to enable automatic meeting generation from the Calendar. These credentials allow the system to create Zoom meetings on your behalf when scheduling calendar events.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-sm text-blue-800">
                          <p className="font-semibold mb-2">How to get Zoom credentials:</p>
                          <ol className="list-decimal ml-4 space-y-1">
                            <li>Visit <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="underline">Zoom Marketplace</a></li>
                            <li>Click "Develop" → "Build App" → Choose "Server-to-Server OAuth"</li>
                            <li>Fill in app details and activate the app</li>
                            <li>Copy Account ID, Client ID, and Client Secret from the app credentials page</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={zoomForm.control}
                      name="zoomAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zoom Account ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your Zoom Account ID" 
                              {...field}
                              data-testid="input-zoom-account-id"
                            />
                          </FormControl>
                          <FormDescription>
                            Found in your Zoom Server-to-Server OAuth app credentials
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={zoomForm.control}
                      name="zoomClientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zoom Client ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your Zoom Client ID" 
                              {...field}
                              data-testid="input-zoom-client-id"
                            />
                          </FormControl>
                          <FormDescription>
                            OAuth client ID from your Zoom app
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={zoomForm.control}
                      name="zoomClientSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zoom Client Secret</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Enter your Zoom Client Secret" 
                              {...field}
                              data-testid="input-zoom-client-secret"
                            />
                          </FormControl>
                          <FormDescription>
                            OAuth client secret from your Zoom app (kept secure)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={updateZoomMutation.isPending}
                        className="flex items-center gap-2"
                        data-testid="button-save-zoom-credentials"
                      >
                        {updateZoomMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save Zoom Credentials
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </TabsContent>

          {/* WhatsApp Settings Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Form {...whatsappForm}>
              <form
                onSubmit={whatsappForm.handleSubmit(onWhatsAppSubmit)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      WhatsApp Welcome Messages
                    </CardTitle>
                    <CardDescription>
                      Configure automatic WhatsApp welcome messages for new
                      leads and customers. Messages are sent using your default
                      WhatsApp device when a phone number is provided during
                      creation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Lead Welcome Message Settings */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            Lead Welcome Message
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Send automatically when a new lead is created with a
                            phone number
                          </p>
                        </div>
                        <FormField
                          control={whatsappForm.control}
                          name="enableLeadWelcomeMessage"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-enable-lead-welcome"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={whatsappForm.control}
                        name="leadWelcomeMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message Template</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your lead welcome message..."
                                {...field}
                                rows={4}
                                data-testid="textarea-lead-welcome-message"
                              />
                            </FormControl>
                            <FormDescription>
                              This message will be sent via WhatsApp to new
                              leads
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Customer Welcome Message Settings */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            Customer Welcome Message
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Send automatically when a new customer is created
                            with a phone number
                          </p>
                        </div>
                        <FormField
                          control={whatsappForm.control}
                          name="enableCustomerWelcomeMessage"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-enable-customer-welcome"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={whatsappForm.control}
                        name="customerWelcomeMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message Template</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your customer welcome message..."
                                {...field}
                                rows={4}
                                data-testid="textarea-customer-welcome-message"
                              />
                            </FormControl>
                            <FormDescription>
                              This message will be sent via WhatsApp to new
                              customers
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Make sure you have a WhatsApp Integration configured
                          in{" "}
                          <Link
                            href="/whatsapp-setup"
                            className="text-primary hover:underline"
                          >
                            Integrate
                          </Link>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Make sure you have a default WhatsApp device
                          configured in{" "}
                          <Link
                            href="/whatsapp-devices"
                            className="text-primary hover:underline"
                          >
                            WhatsApp Devices
                          </Link>
                        </p>
                      </div>
                      <Button
                        type="submit"
                        disabled={updateWhatsAppMutation.isPending}
                        data-testid="button-save-whatsapp-settings"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {updateWhatsAppMutation.isPending
                          ? "Saving..."
                          : "Save Settings"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

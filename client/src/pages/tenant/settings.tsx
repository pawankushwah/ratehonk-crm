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
import { Label } from "@/components/ui/label";
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
  dataRetentionDays: z.number().min(30).max(2555),
  auditLogging: z.boolean(),
  sessionTimeout: z.number().min(15).max(480),
});

// WhatsApp settings moved to WhatsAppSettingsPanel component

// Schema for Zoom settings
const zoomSettingsSchema = z.object({
  zoomAccountId: z.string().optional(),
  zoomClientId: z.string().optional(),
  zoomClientSecret: z.string().optional(),
});

type TenantSettings = z.infer<typeof tenantSettingsSchema>;
type UserPreferences = z.infer<typeof userPreferencesSchema>;
type SystemSettings = z.infer<typeof systemSettingsSchema>;
type ZoomSettings = z.infer<typeof zoomSettingsSchema>;

function IntegrationsTab({ tenantId }: { tenantId?: number }) {
  const [openaiKey, setOpenaiKey] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: aiSettings } = useQuery({
    queryKey: ["/api/tenants", tenantId, "settings/ai"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tenants/${tenantId}/settings/ai`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!tenantId,
  });

  const updateAiMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await apiRequest("PUT", `/api/tenants/${tenantId}/settings/ai`, {
        openaiApiKey: key || "",
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", tenantId, "settings/ai"] });
      setOpenaiKey("");
      toast({ title: "OpenAI API key saved" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to save", description: e?.message, variant: "destructive" });
    },
  });

  const configured = aiSettings?.openaiApiKeyConfigured === true;

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Select a tenant to manage integrations.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI API Key
        </CardTitle>
        <CardDescription>
          Add your OpenAI API key to use AI features: email template generation, AI compose, and AI improve.
          Your key is stored per tenant and never sent to us.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {configured && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Key configured
          </Badge>
        )}
        <div className="space-y-2">
          <Label htmlFor="openai-api-key">API Key</Label>
          <Input
            id="openai-api-key"
            type="password"
            placeholder="sk-..."
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            disabled={updateAiMutation.isPending}
            className="max-w-md font-mono"
          />
          <p className="text-sm text-muted-foreground">
            Leave empty and save to clear the stored key. Use your key from platform.openai.com
          </p>
        </div>
        <Button
          onClick={() => updateAiMutation.mutate(openaiKey)}
          disabled={updateAiMutation.isPending}
          className="flex items-center gap-2"
        >
          {updateAiMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}

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
      // Valid tabs: tenant, user, notifications, system, integrations
      const validTabs = ["tenant", "user", "notifications", "system", "integrations"];
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


  const { tenant } = useAuth();

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
      dataRetentionDays: 365,
      auditLogging: true,
      sessionTimeout: 120,
    },
  });

  // Update system form when data loads
  React.useEffect(() => {
    if (systemData) {
      systemForm.reset({
        dataRetentionDays: (systemData as any).dataRetentionDays || 365,
        auditLogging: (systemData as any).auditLogging !== false,
        sessionTimeout: (systemData as any).sessionTimeout || 120,
      });
    }
  }, [systemData, systemForm]);


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
      const response = await fetch("/api/system/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
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
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Integrations
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

          {/* Integrations Tab - OpenAI API key */}
          <TabsContent value="integrations" className="space-y-6">
            <IntegrationsTab tenantId={tenant?.id} />
          </TabsContent>

        </Tabs>
      </div>
    </Layout>
  );
}

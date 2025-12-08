import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Edit, Settings2, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { Layout } from "@/components/layout/layout";
import type { GstSetting, GstRate } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const gstSettingSchema = z.object({
  taxName: z.string().min(1, "Tax name is required"),
  taxNumber: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  state: z.string().optional(),
  taxType: z.enum(["gst", "vat", "sales_tax", "other"]),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

const gstRateSchema = z.object({
  rateName: z.string().min(1, "Rate name is required"),
  ratePercentage: z.string().min(1, "Rate percentage is required").regex(/^\d+(\.\d{1,2})?$/, "Must be a valid percentage"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

type GstSettingForm = z.infer<typeof gstSettingSchema>;
type GstRateForm = z.infer<typeof gstRateSchema>;

export default function GstSettingsPage() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<GstSetting | null>(null);
  const [editingRate, setEditingRate] = useState<GstRate | null>(null);
  const [selectedSetting, setSelectedSetting] = useState<GstSetting | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  const settingForm = useForm<GstSettingForm>({
    resolver: zodResolver(gstSettingSchema),
    defaultValues: {
      taxName: "",
      taxNumber: "",
      country: "",
      state: "",
      taxType: "gst",
      isActive: true,
      isDefault: false,
    },
  });

  const rateForm = useForm<GstRateForm>({
    resolver: zodResolver(gstRateSchema),
    defaultValues: {
      rateName: "",
      ratePercentage: "",
      description: "",
      isDefault: false,
      displayOrder: 0,
      isActive: true,
    },
  });

  const { data: settings = [], isLoading: isLoadingSettings } = useQuery<GstSetting[]>({
    queryKey: ['/api/gst-settings'],
    enabled: !!tenant?.id,
  });

  const { data: rates = [], isLoading: isLoadingRates, error: ratesError } = useQuery<GstRate[]>({
    queryKey: ['/api/gst-rates', selectedSetting?.id],
    enabled: !!tenant?.id && !!selectedSetting?.id,
    queryFn: async ({ queryKey }) => {
      const gstSettingId = queryKey[1] as number;
      if (!gstSettingId) {
        throw new Error('GST Setting ID is required');
      }
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/gst-rates?gstSettingId=${gstSettingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch tax rates:', response.status, errorText);
        throw new Error(`Failed to fetch tax rates: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched tax rates:', data);
      return Array.isArray(data) ? data : [];
    },
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch countries
  const { data: countries = [] } = useQuery<Array<{ code: string; name: string; flag: string }>>({
    queryKey: ['/api/location/countries'],
    enabled: true,
  });

  // Fetch states for selected country
  const { data: states = [], isLoading: isLoadingStates } = useQuery<Array<{ code: string; name: string }>>({
    queryKey: [`/api/location/states/${selectedCountry}`],
    enabled: !!selectedCountry,
    refetchOnMount: true,
    staleTime: 0,
  });

  const createSettingMutation = useMutation({
    mutationFn: async (data: GstSettingForm) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/gst-settings', {
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
        throw new Error('Failed to create GST setting');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gst-settings'] });
      toast({
        title: "Success",
        description: "Tax setting created successfully",
      });
      setIsSettingDialogOpen(false);
      setSelectedCountry("");
      settingForm.reset();
      setEditingSetting(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: GstSettingForm }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/gst-settings/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update GST setting');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gst-settings'] });
      toast({
        title: "Success",
        description: "Tax setting updated successfully",
      });
      setIsSettingDialogOpen(false);
      setSelectedCountry("");
      settingForm.reset();
      setEditingSetting(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSettingMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/gst-settings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete GST setting');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gst-settings'] });
      toast({
        title: "Success",
        description: "Tax setting deleted successfully",
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

  const createRateMutation = useMutation({
    mutationFn: async (data: GstRateForm) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/gst-rates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          gstSettingId: selectedSetting?.id,
          tenantId: tenant?.id,
          ratePercentage: parseFloat(data.ratePercentage),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tax rate');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gst-rates', selectedSetting?.id] });
      toast({
        title: "Success",
        description: "Tax rate created successfully",
      });
      setIsRateDialogOpen(false);
      rateForm.reset();
      setEditingRate(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: GstRateForm }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/gst-rates/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          ratePercentage: parseFloat(data.ratePercentage),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tax rate');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gst-rates', selectedSetting?.id] });
      toast({
        title: "Success",
        description: "Tax rate updated successfully",
      });
      setIsRateDialogOpen(false);
      rateForm.reset();
      setEditingRate(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRateMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/gst-rates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete tax rate');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gst-rates', selectedSetting?.id] });
      toast({
        title: "Success",
        description: "Tax rate deleted successfully",
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

  const handleEditSetting = (setting: GstSetting) => {
    setEditingSetting(setting);
    setSelectedCountry(setting.country || "");
    settingForm.reset({
      taxName: setting.taxName,
      taxNumber: setting.taxNumber || "",
      country: setting.country,
      state: setting.state || "",
      taxType: setting.taxType as "gst" | "vat" | "sales_tax" | "other",
      isActive: setting.isActive,
      isDefault: setting.isDefault,
    });
    setIsSettingDialogOpen(true);
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    settingForm.setValue("country", countryCode);
    settingForm.setValue("state", ""); // Reset state when country changes
  };

  const handleEditRate = (rate: GstRate) => {
    setEditingRate(rate);
    rateForm.reset({
      rateName: rate.rateName,
      ratePercentage: rate.ratePercentage.toString(),
      description: rate.description || "",
      isDefault: rate.isDefault,
      displayOrder: rate.displayOrder || 0,
      isActive: rate.isActive,
    });
    setIsRateDialogOpen(true);
  };

  const onSubmitSetting = (data: GstSettingForm) => {
    if (editingSetting) {
      updateSettingMutation.mutate({ id: editingSetting.id, data });
    } else {
      createSettingMutation.mutate(data);
    }
  };

  const onSubmitRate = (data: GstRateForm) => {
    if (editingRate) {
      updateRateMutation.mutate({ id: editingRate.id, data });
    } else {
      createRateMutation.mutate(data);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tax Settings</h1>
            <p className="text-muted-foreground mt-1">Configure tax settings and rates for your business</p>
          </div>
          <Dialog open={isSettingDialogOpen} onOpenChange={(open) => {
            setIsSettingDialogOpen(open);
            if (!open) {
              setSelectedCountry("");
              settingForm.reset();
              setEditingSetting(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-tax-setting" onClick={() => {
                setEditingSetting(null);
                setSelectedCountry("");
                settingForm.reset();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tax Setting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSetting ? "Edit Tax Setting" : "Create Tax Setting"}</DialogTitle>
              </DialogHeader>
              <Form {...settingForm}>
                <form onSubmit={settingForm.handleSubmit(onSubmitSetting)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={settingForm.control}
                      name="taxName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., GST India" data-testid="input-tax-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingForm.control}
                      name="taxNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., GSTIN" data-testid="input-tax-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={settingForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              handleCountryChange(value);
                              field.onChange(value);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  {country.flag} {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedCountry || isLoadingStates}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-state">
                                <SelectValue placeholder={isLoadingStates ? "Loading..." : selectedCountry ? "Select state" : "Select country first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state.code} value={state.name}>
                                  {state.name}
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
                    control={settingForm.control}
                    name="taxType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tax-type">
                              <SelectValue placeholder="Select tax type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gst">GST (Goods & Services Tax)</SelectItem>
                            <SelectItem value="vat">VAT (Value Added Tax)</SelectItem>
                            <SelectItem value="sales_tax">Sales Tax</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-6">
                    <FormField
                      control={settingForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-is-active"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Active</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingForm.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-is-default"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Set as Default</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsSettingDialogOpen(false);
                        setSelectedCountry("");
                        settingForm.reset();
                        setEditingSetting(null);
                      }}
                      data-testid="button-cancel-setting"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createSettingMutation.isPending || updateSettingMutation.isPending}
                      data-testid="button-submit-setting"
                    >
                      {editingSetting ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingSettings ? (
          <div className="text-center py-12">Loading tax settings...</div>
        ) : settings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Settings2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tax settings configured yet. Create your first tax setting to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {settings.map((setting) => (
              <Card key={setting.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{setting.taxName}</CardTitle>
                        {setting.isDefault && (
                          <Badge variant="default" className="bg-cyan-600">
                            <Check className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {!setting.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {setting.country}{setting.state ? `, ${setting.state}` : ""} • {setting.taxType.toUpperCase().replace("_", " ")}
                        {setting.taxNumber && ` • ${setting.taxNumber}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSetting(setting);
                        }}
                        data-testid={`button-manage-rates-${setting.id}`}
                      >
                        <Settings2 className="h-4 w-4 mr-1" />
                        Manage Rates
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSetting(setting)}
                        data-testid={`button-edit-setting-${setting.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this tax setting?')) {
                            deleteSettingMutation.mutate(setting.id);
                          }
                        }}
                        data-testid={`button-delete-setting-${setting.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {selectedSetting && (
          <Dialog open={!!selectedSetting} onOpenChange={(open) => !open && setSelectedSetting(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tax Rates - {selectedSetting.taxName}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Configure tax rates for {selectedSetting.taxName}
                  </p>
                  <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => {
                        setEditingRate(null);
                        rateForm.reset();
                      }} data-testid="button-add-rate">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rate
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingRate ? "Edit Tax Rate" : "Create Tax Rate"}</DialogTitle>
                      </DialogHeader>
                      <Form {...rateForm}>
                        <form onSubmit={rateForm.handleSubmit(onSubmitRate)} className="space-y-4">
                          <FormField
                            control={rateForm.control}
                            name="rateName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rate Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., CGST 9%" data-testid="input-rate-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={rateForm.control}
                            name="ratePercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rate Percentage *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., 9.00" type="text" data-testid="input-rate-percentage" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={rateForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Optional description" data-testid="input-rate-description" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={rateForm.control}
                            name="displayOrder"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Display Order</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    placeholder="0"
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    data-testid="input-display-order"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-3">
                            <FormField
                              control={rateForm.control}
                              name="isDefault"
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      data-testid="switch-rate-is-default"
                                    />
                                  </FormControl>
                                  <FormLabel className="!mt-0">Set as Default Rate</FormLabel>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={rateForm.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      data-testid="switch-rate-is-active"
                                    />
                                  </FormControl>
                                  <FormLabel className="!mt-0">Active</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsRateDialogOpen(false);
                                rateForm.reset();
                                setEditingRate(null);
                              }}
                              data-testid="button-cancel-rate"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createRateMutation.isPending || updateRateMutation.isPending}
                              data-testid="button-submit-rate"
                            >
                              {editingRate ? "Update" : "Create"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {isLoadingRates ? (
                  <div className="text-center py-8">Loading rates...</div>
                ) : ratesError ? (
                  <div className="text-center py-8 text-destructive">
                    Error loading tax rates: {ratesError.message}
                  </div>
                ) : rates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tax rates configured for this setting.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rate Name</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rates.map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell className="font-medium">
                            {rate.rateName}
                            {rate.isDefault && (
                              <Badge variant="default" className="ml-2 bg-cyan-600">Default</Badge>
                            )}
                          </TableCell>
                          <TableCell>{rate.ratePercentage}%</TableCell>
                          <TableCell>
                            <Badge variant={rate.isActive ? "default" : "secondary"}>
                              {rate.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRate(rate)}
                                data-testid={`button-edit-rate-${rate.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this tax rate?')) {
                                    deleteRateMutation.mutate(rate.id);
                                  }
                                }}
                                data-testid={`button-delete-rate-${rate.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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
        )}
      </div>
    </Layout>
  );
}

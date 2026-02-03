import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Save, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { GstSetting } from "@shared/schema";
import { GstSettingCreateForm } from "@/components/forms/gst-setting-create-form";

interface EstimateSettings {
  estimateNumberStart: number;
  estimateNumberPrefix: string;
  defaultCurrency: string;
  defaultGstSettingId?: number | null;
  showTax: boolean;
  showDiscount: boolean;
  showNotes: boolean;
  showDeposit: boolean;
  showPaymentTerms: boolean;
  sendEstimateViaEmail: boolean;
  sendEstimateViaWhatsapp: boolean;
}

interface EstimateSettingsPanelProps {
  tenantId: number;
}

export function EstimateSettingsPanel({ tenantId }: EstimateSettingsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isTaxCreatePanelOpen, setIsTaxCreatePanelOpen] = useState(false);
  const [settings, setSettings] = useState<EstimateSettings>({
    estimateNumberStart: 1,
    estimateNumberPrefix: "EST",
    defaultCurrency: "USD",
    defaultGstSettingId: null,
    showTax: true,
    showDiscount: true,
    showNotes: true,
    showDeposit: true,
    showPaymentTerms: true,
    sendEstimateViaEmail: true,
    sendEstimateViaWhatsapp: false,
  });

  const { data: fetchedSettings, isLoading, refetch } = useQuery({
    queryKey: ["/api/estimate-settings", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/estimate-settings/${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch settings");
      const result = await response.json();
      return result.data;
    },
    enabled: open,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Refetch settings when panel opens
  useEffect(() => {
    if (open && tenantId) {
      refetch();
    }
  }, [open, tenantId, refetch]);

  // Fetch GST settings for dropdown
  const { data: gstSettings = [] } = useQuery<GstSetting[]>({
    queryKey: ['/api/gst-settings'],
    enabled: open && !!tenantId,
  });

  useEffect(() => {
    if (fetchedSettings) {
      setSettings({
        ...fetchedSettings,
        estimateNumberPrefix: fetchedSettings.estimateNumberPrefix || "EST",
      });
    }
  }, [fetchedSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data: EstimateSettings) => {
      const response = await apiRequest("POST", "/api/estimate-settings", { tenantId, ...data });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/estimate-settings", tenantId],
      });
      toast({
        title: "Settings saved",
        description: "Estimate settings have been updated successfully.",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          data-testid="button-estimate-settings"
          className="w-10 h-10"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Estimate Settings</SheetTitle>
          <SheetDescription>
            Configure estimate preferences and field visibility
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Estimate Number Prefix */}
          <div className="space-y-2">
            <Label htmlFor="estimateNumberPrefix">
              Estimate Number Prefix
            </Label>
            <Input
              id="estimateNumberPrefix"
              type="text"
              value={settings.estimateNumberPrefix}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  estimateNumberPrefix: e.target.value.toUpperCase() ?? "EST",
                })
              }
              data-testid="input-estimate-prefix"
              placeholder="EST"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Prefix for estimate numbers (e.g., EST, QUOTE)
            </p>
          </div>

          {/* Estimate Number Starting Point */}
          <div className="space-y-2">
            <Label htmlFor="estimateNumberStart">
              Estimate Number Starting Point
            </Label>
            <Input
              id="estimateNumberStart"
              type="number"
              min="1"
              value={settings.estimateNumberStart}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  estimateNumberStart: parseInt(e.target.value) || 1,
                })
              }
              data-testid="input-estimate-start"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Next estimate will start from this number
            </p>
          </div>

          {/* Default Currency */}
          <div className="space-y-2">
            <Label htmlFor="defaultCurrency">Default Currency</Label>
            <Select
              value={settings.defaultCurrency}
              onValueChange={(value) =>
                setSettings({ ...settings, defaultCurrency: value })
              }
            >
              <SelectTrigger data-testid="select-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar (A$)</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar (C$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Tax Setting */}
          <div className="space-y-2">
            <Label htmlFor="defaultGstSetting">Default Tax Setting</Label>
            <Select
              value={settings.defaultGstSettingId?.toString() || "none"}
              onValueChange={(value) => {
                if (value === "create_new") {
                  setIsTaxCreatePanelOpen(true);
                  return;
                }
                setSettings({
                  ...settings,
                  defaultGstSettingId: value === "none" ? null : parseInt(value),
                });
              }}
            >
              <SelectTrigger data-testid="select-tax-setting">
                <SelectValue placeholder="Select tax setting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {gstSettings
                  .filter((setting) => setting.isActive)
                  .map((setting) => (
                    <SelectItem key={setting.id} value={setting.id.toString()}>
                      {setting.taxName} {setting.country && `(${setting.country})`}
                    </SelectItem>
                  ))}
                <SelectItem value="create_new" className="text-primary font-medium">
                  <Plus className="h-4 w-4 mr-2 inline" />
                  Create new tax setting
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Default tax setting to use when creating estimates
            </p>
          </div>

          {/* Create Tax Setting slide panel (nested) */}
          <Sheet open={isTaxCreatePanelOpen} onOpenChange={setIsTaxCreatePanelOpen}>
            <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Create New Tax Setting</SheetTitle>
                <SheetDescription>
                  Add a new tax setting to use as default or in line items
                </SheetDescription>
              </SheetHeader>
              <div className="py-6">
                <GstSettingCreateForm
                  onSuccess={(newSetting) => {
                    queryClient.invalidateQueries({ queryKey: ["/api/gst-settings"] });
                    setSettings((prev) => ({
                      ...prev,
                      defaultGstSettingId: newSetting.id,
                    }));
                    setIsTaxCreatePanelOpen(false);
                    toast({
                      title: "Tax setting created",
                      description: "New tax setting created and set as default.",
                    });
                  }}
                  onCancel={() => setIsTaxCreatePanelOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Field Visibility Toggles */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Field Visibility</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Show or hide fields on the estimate create page
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="showTax" className="cursor-pointer">
                  Tax
                </Label>
                <Switch
                  id="showTax"
                  checked={settings.showTax}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showTax: checked })
                  }
                  data-testid="switch-show-tax"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showDiscount" className="cursor-pointer">
                  Discount
                </Label>
                <Switch
                  id="showDiscount"
                  checked={settings.showDiscount}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showDiscount: checked })
                  }
                  data-testid="switch-show-discount"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showDeposit" className="cursor-pointer">
                  Deposit
                </Label>
                <Switch
                  id="showDeposit"
                  checked={settings.showDeposit}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showDeposit: checked })
                  }
                  data-testid="switch-show-deposit"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showPaymentTerms" className="cursor-pointer">
                  Payment Terms
                </Label>
                <Switch
                  id="showPaymentTerms"
                  checked={settings.showPaymentTerms}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showPaymentTerms: checked })
                  }
                  data-testid="switch-show-payment-terms"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showNotes" className="cursor-pointer">
                  Notes
                </Label>
                <Switch
                  id="showNotes"
                  checked={settings.showNotes}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showNotes: checked })
                  }
                  data-testid="switch-show-notes"
                />
              </div>
            </div>
          </div>

          {/* Email and WhatsApp Delivery Options */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Estimate Delivery</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Automatically send estimates to customers when created
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sendEstimateViaEmail" className="cursor-pointer">
                  Send estimate via Email
                </Label>
                <Switch
                  id="sendEstimateViaEmail"
                  checked={settings.sendEstimateViaEmail}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, sendEstimateViaEmail: checked })
                  }
                  data-testid="switch-send-email"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label
                  htmlFor="sendEstimateViaWhatsapp"
                  className="cursor-pointer"
                >
                  Send estimate via WhatsApp
                </Label>
                <Switch
                  id="sendEstimateViaWhatsapp"
                  checked={settings.sendEstimateViaWhatsapp}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, sendEstimateViaWhatsapp: checked })
                  }
                  data-testid="switch-send-whatsapp"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-settings"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              data-testid="button-save-settings"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


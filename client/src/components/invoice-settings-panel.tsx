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
import { Settings, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { GstSetting } from "@shared/schema";

interface InvoiceSettings {
  invoiceNumberStart: number;
  defaultCurrency: string;
  defaultGstSettingId?: number | null;
  showTax: boolean;
  showDiscount: boolean;
  showNotes: boolean;
  showVoucherInvoice: boolean;
  showProvider: boolean;
  showVendor: boolean;
  showUnitPrice: boolean;
  showAdditionalCommission: boolean;
  sendInvoiceViaEmail: boolean;
  sendInvoiceViaWhatsapp: boolean;
}

interface InvoiceSettingsPanelProps {
  tenantId: number;
}

export function InvoiceSettingsPanel({ tenantId }: InvoiceSettingsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<InvoiceSettings>({
    invoiceNumberStart: 1,
    defaultCurrency: "USD",
    defaultGstSettingId: null,
    showTax: true,
    showDiscount: true,
    showNotes: true,
    showVoucherInvoice: true,
    showProvider: true,
    showVendor: true,
    showUnitPrice: true,
    showAdditionalCommission: false,
    sendInvoiceViaEmail: true,
    sendInvoiceViaWhatsapp: false,
  });

  const { data: fetchedSettings, isLoading, refetch } = useQuery({
    queryKey: ["/api/invoice-settings", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/invoice-settings/${tenantId}`);
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
      setSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data: InvoiceSettings) => {
      const response = await apiRequest("POST", "/api/invoice-settings", { tenantId, ...data });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/invoice-settings", tenantId],
      });
      toast({
        title: "Settings saved",
        description: "Invoice settings have been updated successfully.",
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
          data-testid="button-invoice-settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Invoice Settings</SheetTitle>
          <SheetDescription>
            Configure invoice preferences and field visibility
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Invoice Number Starting Point */}
          <div className="space-y-2">
            <Label htmlFor="invoiceNumberStart">
              Invoice Number Starting Point
            </Label>
            <Input
              id="invoiceNumberStart"
              type="number"
              min="1"
              value={settings.invoiceNumberStart}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  invoiceNumberStart: parseInt(e.target.value) || 1,
                })
              }
              data-testid="input-invoice-start"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Next invoice will start from this number
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
              onValueChange={(value) =>
                setSettings({ 
                  ...settings, 
                  defaultGstSettingId: value === "none" ? null : parseInt(value)
                })
              }
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
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Default tax setting to use when creating invoices
            </p>
          </div>

          {/* Field Visibility Toggles */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Field Visibility</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Show or hide fields on the invoice create page
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

              <div className="flex items-center justify-between">
                <Label htmlFor="showVoucherInvoice" className="cursor-pointer">
                  Voucher/Invoice Number
                </Label>
                <Switch
                  id="showVoucherInvoice"
                  checked={settings.showVoucherInvoice}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showVoucherInvoice: checked })
                  }
                  data-testid="switch-show-voucher"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showProvider" className="cursor-pointer">
                  Provider
                </Label>
                <Switch
                  id="showProvider"
                  checked={settings.showProvider}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showProvider: checked })
                  }
                  data-testid="switch-show-provider"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showVendor" className="cursor-pointer">
                  Vendor
                </Label>
                <Switch
                  id="showVendor"
                  checked={settings.showVendor}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showVendor: checked })
                  }
                  data-testid="switch-show-vendor"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showUnitPrice" className="cursor-pointer">
                  Unit Price
                </Label>
                <Switch
                  id="showUnitPrice"
                  checked={settings.showUnitPrice}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showUnitPrice: checked })
                  }
                  data-testid="switch-show-unit-price"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showAdditionalCommission" className="cursor-pointer">
                  Additional Commission
                </Label>
                <Switch
                  id="showAdditionalCommission"
                  checked={settings.showAdditionalCommission}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showAdditionalCommission: checked })
                  }
                  data-testid="switch-show-additional-commission"
                />
              </div>
            </div>
          </div>

          {/* Invoice Delivery Options */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Invoice Delivery</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose how invoices should be automatically sent to customers
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sendInvoiceViaEmail" className="cursor-pointer">
                  Send invoice via Email
                </Label>
                <Switch
                  id="sendInvoiceViaEmail"
                  checked={settings.sendInvoiceViaEmail}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, sendInvoiceViaEmail: checked })
                  }
                  data-testid="switch-send-email"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="sendInvoiceViaWhatsapp"
                  className="cursor-pointer"
                >
                  Send invoice via WhatsApp
                </Label>
                <Switch
                  id="sendInvoiceViaWhatsapp"
                  checked={settings.sendInvoiceViaWhatsapp}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, sendInvoiceViaWhatsapp: checked })
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

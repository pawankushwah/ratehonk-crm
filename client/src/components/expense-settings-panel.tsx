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
import { Settings, Save, Plus, Settings2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { GstSetting } from "@shared/schema";
import { GstSettingCreateForm } from "@/components/forms/gst-setting-create-form";
import { TaxRatesManageDialog } from "@/components/tax-rates-manage-dialog";

interface ExpenseSettings {
  expenseNumberStart: number;
  defaultCurrency: string;
  defaultGstSettingId?: number | null;
  showTax: boolean;
  showVendor: boolean;
  showLeadType: boolean;
  showCategory: boolean;
  showSubcategory: boolean;
  showPaymentMethod: boolean;
  showPaymentStatus: boolean;
  showNotes: boolean;
}

interface ExpenseSettingsPanelProps {
  tenantId: number;
}

export function ExpenseSettingsPanel({ tenantId }: ExpenseSettingsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isTaxCreatePanelOpen, setIsTaxCreatePanelOpen] = useState(false);
  const [isManageRatesOpen, setIsManageRatesOpen] = useState(false);
  const [settings, setSettings] = useState<ExpenseSettings>({
    expenseNumberStart: 1,
    expenseNumberPrefix: "EXP",
    defaultCurrency: "USD",
    defaultGstSettingId: null,
    showTax: true,
    showVendor: true,
    showLeadType: true,
    showCategory: true,
    showSubcategory: true,
    showPaymentMethod: true,
    showPaymentStatus: true,
    showNotes: true,
  });

  const { data: fetchedSettings, isLoading, refetch } = useQuery({
    queryKey: ["/api/expense-settings", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/expense-settings/${tenantId}`);
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
    mutationFn: async (data: ExpenseSettings) => {
      const response = await apiRequest("POST", "/api/expense-settings", { tenantId, ...data });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/expense-settings", tenantId],
      });
      toast({
        title: "Settings saved",
        description: "Expense settings have been updated successfully.",
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
          data-testid="button-expense-settings"
          className="w-10 h-10"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Expense Settings</SheetTitle>
          <SheetDescription>
            Configure expense preferences and field visibility
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Expense Number Prefix */}
          <div className="space-y-2">
            <Label htmlFor="expenseNumberPrefix">
              Expense Number Prefix
            </Label>
            <Input
              id="expenseNumberPrefix"
              type="text"
              value={settings.expenseNumberPrefix ?? "EXP"}
              onChange={(e) => {
                const newValue = e.target.value.toUpperCase().trim();
                setSettings({
                  ...settings,
                  expenseNumberPrefix: newValue || "EXP",
                });
              }}
              placeholder="EXP"
              maxLength={10}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Prefix for expense numbers (e.g., EXP, BILL, EXP-2024)
            </p>
          </div>

          {/* Expense Number Starting Point */}
          <div className="space-y-2">
            <Label htmlFor="expenseNumberStart">
              Expense Number Starting Point
            </Label>
            <Input
              id="expenseNumberStart"
              type="number"
              min="1"
              value={settings.expenseNumberStart}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  expenseNumberStart: parseInt(e.target.value) || 1,
                })
              }
              data-testid="input-expense-start"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Next expense will start from this number
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
            <div className="flex gap-2">
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
                <SelectTrigger data-testid="select-tax-setting" className="flex-1">
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!settings.defaultGstSettingId}
                onClick={() => setIsManageRatesOpen(true)}
                data-testid="button-manage-rates"
                title="Manage tax rates"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <TaxRatesManageDialog
                setting={settings.defaultGstSettingId ? gstSettings.find((s) => s.id === settings.defaultGstSettingId) ?? null : null}
                open={isManageRatesOpen}
                onOpenChange={setIsManageRatesOpen}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Default tax setting to use when creating expenses. Use the gear icon to manage rates.
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
              Show or hide fields on the expense create page
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
                <Label htmlFor="showLeadType" className="cursor-pointer">
                  Lead Type
                </Label>
                <Switch
                  id="showLeadType"
                  checked={settings.showLeadType}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showLeadType: checked })
                  }
                  data-testid="switch-show-lead-type"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showCategory" className="cursor-pointer">
                  Category
                </Label>
                <Switch
                  id="showCategory"
                  checked={settings.showCategory}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showCategory: checked })
                  }
                  data-testid="switch-show-category"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showSubcategory" className="cursor-pointer">
                  Subcategory
                </Label>
                <Switch
                  id="showSubcategory"
                  checked={settings.showSubcategory}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showSubcategory: checked })
                  }
                  data-testid="switch-show-subcategory"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showPaymentMethod" className="cursor-pointer">
                  Payment Method
                </Label>
                <Switch
                  id="showPaymentMethod"
                  checked={settings.showPaymentMethod}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showPaymentMethod: checked })
                  }
                  data-testid="switch-show-payment-method"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showPaymentStatus" className="cursor-pointer">
                  Payment Status
                </Label>
                <Switch
                  id="showPaymentStatus"
                  checked={settings.showPaymentStatus}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showPaymentStatus: checked })
                  }
                  data-testid="switch-show-payment-status"
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


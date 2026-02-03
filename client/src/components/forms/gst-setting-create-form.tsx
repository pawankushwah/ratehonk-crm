import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import type { GstSetting } from "@shared/schema";

const gstSettingSchema = z.object({
  taxName: z.string().min(1, "Tax name is required"),
  taxNumber: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  state: z.string().optional(),
  taxType: z.enum(["gst", "vat", "sales_tax", "other"]),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

type GstSettingForm = z.infer<typeof gstSettingSchema>;

interface GstSettingCreateFormProps {
  onSuccess?: (setting: GstSetting) => void;
  onCancel?: () => void;
}

export function GstSettingCreateForm({
  onSuccess,
  onCancel,
}: GstSettingCreateFormProps) {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<GstSettingForm>({
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

  const { data: countries = [] } = useQuery<Array<{ code: string; name: string; flag: string }>>({
    queryKey: ["/api/location/countries"],
    enabled: true,
  });

  const selectedCountry = form.watch("country");

  const { data: states = [], isLoading: isLoadingStates } = useQuery<
    Array<{ code: string; name: string }>
  >({
    queryKey: [`/api/location/states/${selectedCountry}`],
    enabled: !!selectedCountry,
  });

  const createMutation = useMutation({
    mutationFn: async (data: GstSettingForm) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/gst-settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          tenantId: tenant?.id,
        }),
      });
      if (!response.ok) throw new Error("Failed to create tax setting");
      return response.json();
    },
    onSuccess: (setting: GstSetting) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gst-settings"] });
      toast({
        title: "Success",
        description: "Tax setting created successfully",
      });
      if (onSuccess) onSuccess(setting);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCountryChange = (value: string) => {
    form.setValue("country", value);
    form.setValue("state", "");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="taxName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., GST India" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="taxNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., GSTIN" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country *</FormLabel>
                <Select
                  onValueChange={(v) => {
                    handleCountryChange(v);
                    field.onChange(v);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
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
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedCountry || isLoadingStates}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingStates
                            ? "Loading..."
                            : selectedCountry
                              ? "Select state"
                              : "Select country first"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.code} value={s.name}>
                        {s.name}
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
          control={form.control}
          name="taxType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
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
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Active</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Set as Default</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Tax Setting"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

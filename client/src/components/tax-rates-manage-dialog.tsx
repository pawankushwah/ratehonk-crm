import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import type { GstSetting, GstRate } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const gstRateSchema = z.object({
  rateName: z.string().min(1, "Rate name is required"),
  ratePercentage: z.string().min(1, "Rate percentage is required").regex(/^\d+(\.\d{1,2})?$/, "Must be a valid percentage"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

type GstRateForm = z.infer<typeof gstRateSchema>;

interface TaxRatesManageDialogProps {
  setting: GstSetting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaxRatesManageDialog({ setting, open, onOpenChange }: TaxRatesManageDialogProps) {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<GstRate | null>(null);

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

  const { data: rates = [], isLoading: isLoadingRates, error: ratesError } = useQuery<GstRate[]>({
    queryKey: ['/api/gst-rates', setting?.id],
    enabled: !!tenant?.id && !!setting?.id && open,
    queryFn: async ({ queryKey }) => {
      const gstSettingId = queryKey[1] as number;
      if (!gstSettingId) throw new Error('GST Setting ID is required');
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/gst-rates?gstSettingId=${gstSettingId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch tax rates: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    refetchOnMount: true,
    staleTime: 0,
  });

  const createRateMutation = useMutation({
    mutationFn: async (data: GstRateForm) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/gst-rates', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          gstSettingId: setting?.id,
          tenantId: tenant?.id,
          ratePercentage: parseFloat(data.ratePercentage),
        }),
      });
      if (!response.ok) throw new Error('Failed to create tax rate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gst-rates', setting?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/gst-settings'] });
      toast({ title: "Success", description: "Tax rate created successfully" });
      setIsRateDialogOpen(false);
      rateForm.reset();
      setEditingRate(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: GstRateForm }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/gst-rates/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ratePercentage: parseFloat(data.ratePercentage) }),
      });
      if (!response.ok) throw new Error('Failed to update tax rate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gst-rates', setting?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/gst-settings'] });
      toast({ title: "Success", description: "Tax rate updated successfully" });
      setIsRateDialogOpen(false);
      rateForm.reset();
      setEditingRate(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteRateMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/gst-rates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete tax rate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gst-rates', setting?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/gst-settings'] });
      toast({ title: "Success", description: "Tax rate deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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

  const onSubmitRate = (data: GstRateForm) => {
    if (editingRate) {
      updateRateMutation.mutate({ id: editingRate.id, data });
    } else {
      createRateMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tax Rates{setting ? ` - ${setting.taxName}` : ""}</DialogTitle>
        </DialogHeader>
        {!setting ? (
          <div className="py-8 text-center text-muted-foreground">No tax setting selected.</div>
        ) : (

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Configure tax rates for {setting.taxName}
            </p>
            <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { setEditingRate(null); rateForm.reset(); }} data-testid="button-add-rate">
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
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-rate-is-default" />
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
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-rate-is-active" />
                            </FormControl>
                            <FormLabel className="!mt-0">Active</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => { setIsRateDialogOpen(false); rateForm.reset(); setEditingRate(null); }} data-testid="button-cancel-rate">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createRateMutation.isPending || updateRateMutation.isPending} data-testid="button-submit-rate">
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
            <div className="text-center py-8 text-destructive">Error loading tax rates: {ratesError.message}</div>
          ) : rates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tax rates configured for this setting.</div>
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
                      {rate.isDefault && <Badge variant="default" className="ml-2 bg-cyan-600">Default</Badge>}
                    </TableCell>
                    <TableCell>{rate.ratePercentage}%</TableCell>
                    <TableCell>
                      <Badge variant={rate.isActive ? "default" : "secondary"}>{rate.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditRate(rate)} data-testid={`button-edit-rate-${rate.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => confirm('Delete this tax rate?') && deleteRateMutation.mutate(rate.id)} data-testid={`button-delete-rate-${rate.id}`}>
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
        )}
      </DialogContent>
    </Dialog>
  );
}

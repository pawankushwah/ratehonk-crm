import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface ServiceProviderCreateFormProps {
  onSuccess?: (provider: any) => void;
  onCancel?: () => void;
  preselectedLeadTypeId?: string;
}

export function ServiceProviderCreateForm({ 
  onSuccess, 
  onCancel,
  preselectedLeadTypeId 
}: ServiceProviderCreateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    leadTypeId: preselectedLeadTypeId || "",
    contactInfo: "",
    notes: "",
  });

  // Fetch lead types
  const { data: leadTypes = [] } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/lead-types`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/lead-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.leadTypes || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/service-providers`, {
        ...data,
        leadTypeId: parseInt(data.leadTypeId),
      });
      return response.json();
    },
    onSuccess: (provider) => {
      queryClient.invalidateQueries({ queryKey: [`/api/service-providers`, tenant?.id] });
      toast({
        title: "Success",
        description: "Service provider created successfully",
      });
      if (onSuccess) onSuccess(provider);
    },
    onError: (error: any) => {
      console.error("Error creating service provider:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create service provider",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.leadTypeId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-semibold">
            Service Provider Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Air India, Grand Hyatt"
            required
            className="mt-1.5"
            data-testid="input-service-provider-name"
          />
        </div>

        <div>
          <Label htmlFor="leadTypeId" className="text-sm font-semibold">
            Lead Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.leadTypeId}
            onValueChange={(value) => setFormData({ ...formData, leadTypeId: value })}
            required
          >
            <SelectTrigger className="mt-1.5" data-testid="select-lead-type">
              <SelectValue placeholder="Select lead type" />
            </SelectTrigger>
            <SelectContent>
              {leadTypes.map((lt: any) => (
                <SelectItem key={lt.id} value={lt.id.toString()}>
                  {lt.name || lt.type_name || lt.typeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contactInfo" className="text-sm font-semibold">
            Contact Info
          </Label>
          <Input
            id="contactInfo"
            value={formData.contactInfo}
            onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
            placeholder="Phone, email, or address"
            className="mt-1.5"
            data-testid="input-contact-info"
          />
        </div>

        <div>
          <Label htmlFor="notes" className="text-sm font-semibold">
            Notes
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this service provider"
            className="mt-1.5"
            rows={3}
            data-testid="textarea-notes"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={createMutation.isPending}
          data-testid="button-submit"
        >
          {createMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Service Provider
        </Button>
      </div>
    </form>
  );
}

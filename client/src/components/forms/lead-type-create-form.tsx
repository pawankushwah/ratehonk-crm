import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface LeadTypeCreateFormProps {
  tenantId?: number;
  onSuccess?: (leadType: any) => void;
  onCancel?: () => void;
}

const AVAILABLE_CATEGORIES = [
  { value: "0", label: "Default" },
  { value: "1", label: "Flight" },
  { value: "2", label: "Hotels" },
  { value: "3", label: "Package" },
  { value: "4", label: "Event" },
  { value: "5", label: "Car Rental" },
  { value: "6", label: "Attraction" }
];

export function LeadTypeCreateForm({
  tenantId: propTenantId,
  onSuccess,
  onCancel,
}: LeadTypeCreateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => auth.getCurrentUser(),
  });
  
  const tenantId = propTenantId || currentUser?.tenantId;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "✈️",
    color: "#0BBCD6",
    isActive: true,
    displayOrder: 0,
    leadTypeCategory: "0",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }
      const response = await apiRequest("POST", `/api/tenants/${tenantId}/lead-types`, data);
      return response.json();
    },
    onSuccess: (leadType) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenantId}/lead-types`] });
      toast({
        title: "Success",
        description: "Lead type created successfully",
      });
      if (onSuccess) onSuccess(leadType);
    },
    onError: (error: any) => {
      console.error("Error creating lead type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create lead type",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const iconOptions = [
    "✈️",
    "🏨",
    "🚗",
    "🚢",
    "🎫",
    "🗺️",
    "🏖️",
    "⛰️",
    "🎡",
    "🍽️",
  ];

  const colorOptions = [
    { value: "#0BBCD6", label: "Cyan", color: "#0BBCD6" },
    { value: "#3B82F6", label: "Blue", color: "#3B82F6" },
    { value: "#10B981", label: "Green", color: "#10B981" },
    { value: "#F59E0B", label: "Orange", color: "#F59E0B" },
    { value: "#EF4444", label: "Red", color: "#EF4444" },
    { value: "#8B5CF6", label: "Purple", color: "#8B5CF6" },
    { value: "#EC4899", label: "Pink", color: "#EC4899" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-semibold">
            Lead Type Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Flight Booking, Hotel Reservation"
            required
            className="mt-1.5"
            data-testid="input-lead-type-name"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-semibold">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe this lead type"
            rows={3}
            className="mt-1.5 resize-none"
          />
        </div>

        <div>
          <Label htmlFor="leadTypeCategory" className="text-sm font-semibold">
            Category
          </Label>
          <Combobox
            options={AVAILABLE_CATEGORIES}
            value={formData.leadTypeCategory}
            onValueChange={(value) =>
              setFormData({ ...formData, leadTypeCategory: value })
            }
            placeholder="Select category"
            searchPlaceholder="Search categories..."
            emptyText="No category found"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Icon</Label>
          <div className="flex flex-wrap gap-2">
            {iconOptions.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData({ ...formData, icon })}
                className={`w-12 h-12 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                  formData.icon === icon
                    ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950"
                    : "border-gray-200 dark:border-gray-700 hover:border-cyan-300"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Color</Label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((colorOption) => (
              <button
                key={colorOption.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, color: colorOption.value })
                }
                className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                  formData.color === colorOption.value
                    ? "border-gray-900 dark:border-white"
                    : "border-gray-200 dark:border-gray-700"
                }`}
                style={{ backgroundColor: colorOption.color }}
                title={colorOption.label}
              />
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="displayOrder" className="text-sm font-semibold">
            Display Order
          </Label>
          <Input
            id="displayOrder"
            type="number"
            value={formData.displayOrder}
            onChange={(e) =>
              setFormData({
                ...formData,
                displayOrder: parseInt(e.target.value) || 0,
              })
            }
            placeholder="0"
            className="mt-1.5"
          />
          <p className="text-xs text-gray-500 mt-1">
            Lower numbers appear first in lists
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createMutation.isPending}
            data-testid="button-cancel-lead-type"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-cyan-600 hover:bg-cyan-700"
          data-testid="button-submit-lead-type"
        >
          {createMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Lead Type
        </Button>
      </div>
    </form>
  );
}

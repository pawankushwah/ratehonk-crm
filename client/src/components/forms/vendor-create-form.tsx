import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface VendorCreateFormProps {
  onSuccess?: (vendor: any) => void;
  onCancel?: () => void;
}

export function VendorCreateForm({ onSuccess, onCancel }: VendorCreateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    contactPersonName: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    servicesOffered: "",
    paymentTerms: "Net 30",
    creditLimit: "",
    taxId: "",
    preferredContactMethod: "email",
    status: "active",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/vendors", data);
    },
    onSuccess: (vendor) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
      if (onSuccess) onSuccess(vendor);
    },
    onError: (error: any) => {
      console.error("Error creating vendor:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create vendor",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  const paymentTermsOptions = [
    { value: "Net 30", label: "Net 30" },
    { value: "Net 15", label: "Net 15" },
    { value: "Net 60", label: "Net 60" },
    { value: "COD", label: "Cash on Delivery" },
    { value: "Prepaid", label: "Prepaid" },
  ];

  const contactMethodOptions = [
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "both", label: "Both" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="name" className="text-sm font-semibold">
            Vendor Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter vendor name"
            required
            className="mt-1.5"
            data-testid="input-vendor-name"
          />
        </div>

        <div>
          <Label htmlFor="contactPersonName" className="text-sm font-semibold">
            Contact Person
          </Label>
          <Input
            id="contactPersonName"
            value={formData.contactPersonName}
            onChange={(e) =>
              setFormData({ ...formData, contactPersonName: e.target.value })
            }
            placeholder="Contact person name"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-semibold">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-semibold">
            Phone
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone number"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="website" className="text-sm font-semibold">
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
            placeholder="https://example.com"
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address" className="text-sm font-semibold">
            Address
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Business St"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="city" className="text-sm font-semibold">
            City
          </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="New York"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="state" className="text-sm font-semibold">
            State
          </Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="NY"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="zipCode" className="text-sm font-semibold">
            ZIP Code
          </Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            placeholder="10001"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="country" className="text-sm font-semibold">
            Country
          </Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="United States"
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="servicesOffered" className="text-sm font-semibold">
            Services Offered
          </Label>
          <Textarea
            id="servicesOffered"
            value={formData.servicesOffered}
            onChange={(e) =>
              setFormData({ ...formData, servicesOffered: e.target.value })
            }
            placeholder="Describe the services this vendor provides"
            rows={2}
            className="mt-1.5 resize-none"
          />
        </div>

        <div>
          <Label htmlFor="paymentTerms" className="text-sm font-semibold">
            Payment Terms
          </Label>
          <Combobox
            options={paymentTermsOptions}
            value={formData.paymentTerms}
            onValueChange={(value) =>
              setFormData({ ...formData, paymentTerms: value })
            }
            placeholder="Select payment terms"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="creditLimit" className="text-sm font-semibold">
            Credit Limit
          </Label>
          <Input
            id="creditLimit"
            type="number"
            value={formData.creditLimit}
            onChange={(e) =>
              setFormData({ ...formData, creditLimit: e.target.value })
            }
            placeholder="10000.00"
            step="0.01"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="taxId" className="text-sm font-semibold">
            Tax ID
          </Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            placeholder="12-3456789"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="preferredContactMethod" className="text-sm font-semibold">
            Preferred Contact
          </Label>
          <Combobox
            options={contactMethodOptions}
            value={formData.preferredContactMethod}
            onValueChange={(value) =>
              setFormData({ ...formData, preferredContactMethod: value })
            }
            placeholder="Select contact method"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="status" className="text-sm font-semibold">
            Status
          </Label>
          <Combobox
            options={statusOptions}
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value })
            }
            placeholder="Select status"
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notes" className="text-sm font-semibold">
            Notes
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this vendor"
            rows={3}
            className="mt-1.5 resize-none"
          />
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
            data-testid="button-cancel-vendor"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-cyan-600 hover:bg-cyan-700"
          data-testid="button-submit-vendor"
        >
          {createMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Vendor
        </Button>
      </div>
    </form>
  );
}

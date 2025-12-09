import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { SlidePanel } from "@/components/ui/slide-panel";
import { LeadTypeCreateForm } from "@/components/forms/lead-type-create-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

const leadSchema = z.object({
  leadTypeId: z.string().min(1, "Lead type is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  source: z.string().optional(),
  budgetRange: z.string().optional(),
  priority: z.string().default("medium"),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadCreateFormProps {
  tenantId: string;
  onSuccess?: (lead: any) => void;
  onCancel?: () => void;
  onFillOnly?: (data: any) => void;
  enableFillOnlyButton?: boolean;
}

const sourceOptions = [
  { value: "website", label: "Website" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter" },
  { value: "google", label: "Google" },
  { value: "referral", label: "Referral" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "trade show", label: "Trade Show" },
  { value: "advertisement", label: "Advertisement" },
  { value: "other", label: "Other" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function LeadCreateForm({
  tenantId,
  onSuccess,
  onCancel,
  enableFillOnlyButton,
  onFillOnly,
}: LeadCreateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLeadTypePanelOpen, setIsLeadTypePanelOpen] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      leadTypeId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      country: "",
      source: "",
      budgetRange: "",
      priority: "medium",
      notes: "",
    },
  });

  // Fetch lead types
  const { data: leadTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/lead-types"],
  });

  const leadTypeOptions = [
    {
      value: "create_new",
      label: "+ Create New Travel Category",
      icon: <Plus className="h-4 w-4 text-cyan-600" />,
    },
    ...leadTypes.map((type: any) => ({
      value: type.id.toString(),
      label: type.name,
    })),
  ];

  const handleLeadTypeChange = (value: string, field: any) => {
    if (value === "create_new") {
      setIsLeadTypePanelOpen(true);
    } else {
      field.onChange(value);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const response = await apiRequest("POST", "/api/leads", {
        ...data,
        name: `${data.firstName} ${data.lastName}`,
        status: "new",
        tenantId: parseInt(tenantId),
      });
      return response.json();
    },
    onSuccess: (lead) => {
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      if (onSuccess) onSuccess(lead);
    },
    onError: (error: any) => {
      console.error("Error creating lead:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: LeadFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {!enableFillOnlyButton && (
          <FormField
            control={form.control}
            name="leadTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Type *</FormLabel>
                <FormControl>
                  <Combobox
                    options={leadTypeOptions}
                    value={field.value}
                    onValueChange={(value) =>
                      handleLeadTypeChange(value, field)
                    }
                    placeholder="Select lead type"
                    emptyText="No lead types found"
                    data-testid="combobox-lead-type"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter first name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter last name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="lead@example.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter phone number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="City" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="State" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Country" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!enableFillOnlyButton && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Combobox
                      options={sourceOptions}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder="Select source"
                      emptyText="No sources found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Combobox
                      options={priorityOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select priority"
                      emptyText="No priorities found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {!enableFillOnlyButton && (
          <FormField
            control={form.control}
            name="budgetRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Range</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., $1000 - $5000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!enableFillOnlyButton && (
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="Additional notes..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>

         {enableFillOnlyButton ? (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        const values = form.getValues();
        onFillOnly?.(values);
      }}
      disabled={createMutation.isPending}
    >
      Use This Data
    </Button>
  ) : (
    <Button type="submit" disabled={createMutation.isPending}>
      {createMutation.isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        "Create Lead"
      )}
    </Button>
  )}
        </div>
      </form>

      <SlidePanel
        isOpen={isLeadTypePanelOpen}
        onClose={() => setIsLeadTypePanelOpen(false)}
        title="Create New Travel Category"
      >
        <LeadTypeCreateForm
          onSuccess={(leadType) => {
            queryClient.invalidateQueries({ queryKey: ["/api/lead-types"] });
            form.setValue("leadTypeId", leadType.id.toString());
            setIsLeadTypePanelOpen(false);
            toast({
              title: "Success",
              description: "Travel category created successfully",
            });
          }}
          onCancel={() => setIsLeadTypePanelOpen(false)}
        />
      </SlidePanel>
    </Form>
  );
}

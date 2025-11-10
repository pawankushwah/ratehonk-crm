import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Upload, FileText, Image } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";

// Estimate interfaces
interface LineItem {
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  leadCategory?: string;
  tax?: number;
  discount?: number;
}

interface EstimateFormData {
  title: string;
  selectedLeadId?: string;
  selectedCustomerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  invoiceNumber: string;
  currency: string;
  validUntil: string;
  lineItems: LineItem[];
  discountPercentage: string;
  taxPercentage: string;
  depositRequired: boolean;
  depositPercentage: string;
  paymentTerms: string;
  notes: string;
}

export default function EstimateCreate() {
  const [, setLocation] = useLocation();
  const { user, tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to allow only numeric input
  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === '.' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      return;
    }
    
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    
    // Prevent input if not a number
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Line items visibility toggle
  const [showLineItems, setShowLineItems] = useState(false);

  // Attachment files
  const [attachments, setAttachments] = useState<File[]>([]);

  // Form data state
  const [formData, setFormData] = useState<EstimateFormData>({
    title: "",
    selectedLeadId: "",
    selectedCustomerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    invoiceNumber: "",
    currency: "USD",
    validUntil: "",
    lineItems: [
      {
        itemName: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        leadCategory: "",
        tax: 0,
        discount: 0,
      },
    ],
    discountPercentage: "0",
    taxPercentage: "0",
    depositRequired: false,
    depositPercentage: "0",
    paymentTerms: "net30",
    notes: "",
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
    enabled: !!tenant?.id,
  });

  // Fetch leads
  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
    enabled: !!tenant?.id,
  });

  // Fetch lead types
  const { data: leadTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/lead-types"],
    enabled: !!tenant?.id,
  });

  // Fetch existing estimates for title suggestions
  const { data: estimates = [] } = useQuery<any[]>({
    queryKey: ["/api/estimates"],
    enabled: !!tenant?.id,
  });

  // Extract unique estimate titles for autocomplete
  const estimateTitleSuggestions = useMemo(() => {
    if (!estimates || !Array.isArray(estimates)) return [];
    
    const uniqueTitles = new Set(
      estimates
        .map((est: any) => est.title)
        .filter((title: string) => title && title.trim() !== "")
    );
    
    return Array.from(uniqueTitles).map((title: string) => ({
      value: title,
      label: title,
    }));
  }, [estimates]);

  const getTravelCategories = () => {
    if (leadTypes && Array.isArray(leadTypes) && leadTypes.length > 0) {
      return leadTypes
        .map(
          (lt: any) =>
            lt.name || lt.type_name || lt.typeName || `Lead Type ${lt.id}`,
        )
        .filter(Boolean);
    }
    return [
      "Flight",
      "Hotel",
      "Car Rental",
      "Tour Package",
      "Insurance",
      "Visa Services",
      "Meals",
      "Activities",
    ];
  };

  // Handle customer selection and auto-populate
  const handleCustomerSelection = (customerId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedCustomerId: customerId,
      selectedLeadId: "",
    }));

    if (customerId && customerId !== "none") {
      const customer = customers.find((c) => c.id.toString() === customerId);
      if (customer) {
        setFormData((prev) => ({
          ...prev,
          customerName:
            customer.name || customer.firstName + " " + customer.lastName || "",
          customerEmail: customer.email || "",
          customerPhone: customer.phone || customer.phoneNumber || "",
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
      }));
    }
  };

  const handleLeadSelection = (leadId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedLeadId: leadId,
      selectedCustomerId: "",
    }));

    if (leadId && leadId !== "none") {
      const lead = leads.find((l) => l.id.toString() === leadId);
      if (lead) {
        setFormData((prev) => ({
          ...prev,
          customerName:
            lead.name ||
            lead.firstName + " " + lead.lastName ||
            lead.leadName ||
            "",
          customerEmail: lead.email || lead.emailAddress || "",
          customerPhone:
            lead.phone || lead.phoneNumber || lead.contactNumber || "",
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
      }));
    }
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          itemName: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          leadCategory: "",
          tax: 0,
          discount: 0,
        },
      ],
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index),
      }));
    }
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate total price for this line item
    const item = updatedItems[index];
    const unitPrice = parseFloat(item.unitPrice?.toString() || "0") || 0;
    const quantity = parseInt(item.quantity?.toString() || "1") || 1;
    const tax = parseFloat(item.tax?.toString() || "0") || 0;
    const discount = parseFloat(item.discount?.toString() || "0") || 0;

    const subtotal = unitPrice * quantity;
    const afterDiscount = subtotal - discount;
    const total = afterDiscount + tax;

    updatedItems[index].totalPrice = total;

    setFormData((prev) => ({ ...prev, lineItems: updatedItems }));
  };

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = formData.lineItems.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    );
    const discountAmount =
      (subtotal * parseFloat(formData.discountPercentage || "0")) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount =
      (afterDiscount * parseFloat(formData.taxPercentage || "0")) / 100;
    const total = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  }, [formData.lineItems, formData.discountPercentage, formData.taxPercentage]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a PDF or image file`,
          variant: "destructive",
        });
      }
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
      }
      
      return isValidType && isValidSize;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Create estimate mutation
  const createMutation = useMutation({
    mutationFn: async (data: EstimateFormData) => {
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      const response = await fetch(`/api/estimates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          tenantId: tenant?.id,
        }),
      });
      if (!response.ok) throw new Error("Failed to create estimate");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Estimate created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      setLocation("/estimates");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create estimate",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const onCancel = () => {
    setLocation("/estimates");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-5xl mx-auto p-4 lg:p-6">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onCancel}
                className="hover:bg-white/60 dark:hover:bg-gray-800/60"
                data-testid="button-back-to-estimates"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Create Estimate
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-9 px-4 text-sm"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="estimate-form"
                disabled={createMutation.isPending}
                className="h-9 px-4 text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Creating..." : "Create Estimate"}
              </Button>
            </div>
          </div>

          <form id="estimate-form" onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              {/* Compact Form Grid */}
              <div className="space-y-4">
                {/* Title, Ref No., and Valid Until - Same Row */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr,180px,160px] gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <AutocompleteInput
                      id="title"
                      suggestions={estimateTitleSuggestions}
                      value={formData.title}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: value,
                        }))
                      }
                      placeholder="e.g., Website Development Project"
                      required
                      data-testid="input-title"
                      emptyText="No previous titles found."
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Ref No.</Label>
                    <Input
                      value={formData.invoiceNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          invoiceNumber: e.target.value,
                        }))
                      }
                      placeholder="INV-001"
                      className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Valid Until</Label>
                    <DatePicker
                      value={formData.validUntil}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          validUntil: date,
                        }))
                      }
                      placeholder="Select date"
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:border-cyan-400 dark:hover:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Lead & Customer Selection - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Lead (Optional)</Label>
                    <Combobox
                      options={[
                        { value: "none", label: "No lead" },
                        ...leads.map((lead: any) => ({
                          value: lead.id.toString(),
                          label: lead.name ||
                            lead.firstName + " " + lead.lastName ||
                            lead.leadName ||
                            `Lead ${lead.id}`
                        }))
                      ]}
                      value={formData.selectedLeadId || "none"}
                      onValueChange={handleLeadSelection}
                      placeholder="Select lead"
                      searchPlaceholder="Search..."
                      emptyText="No leads found."
                      className="h-10 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Customer (Optional)</Label>
                    <Combobox
                      options={[
                        { value: "none", label: "No customer" },
                        ...customers.map((customer: any) => ({
                          value: customer.id.toString(),
                          label: customer.name ||
                            customer.firstName + " " + customer.lastName ||
                            `Customer ${customer.id}`
                        }))
                      ]}
                      value={formData.selectedCustomerId || "none"}
                      onValueChange={handleCustomerSelection}
                      placeholder="Select customer"
                      searchPlaceholder="Search..."
                      emptyText="No customers found."
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Customer Information - 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      Customer Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                      required
                      placeholder="John Doe"
                      className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      data-testid="input-customer-name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerEmail: e.target.value,
                        }))
                      }
                      required
                      placeholder="john@example.com"
                      className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      data-testid="input-customer-email"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Phone</Label>
                    <Input
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerPhone: e.target.value,
                        }))
                      }
                      placeholder="+1 (555) 123-4567"
                      className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

              {/* Line Items Section with Toggle */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLineItems(!showLineItems)}
                    className="flex items-center gap-1.5 h-8 px-2 text-xs"
                  >
                    {showLineItems ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        Hide Line Items
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        Show Line Items
                      </>
                    )}
                  </Button>
                  {showLineItems && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addLineItem}
                      className="gap-1 h-8 px-3 text-xs"
                      data-testid="button-add-line-item"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                  )}
                </div>

                {showLineItems && (
                  <div className="space-y-3">
                    {formData.lineItems.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs text-gray-600 dark:text-gray-400">Service</Label>
                            <Combobox
                              options={getTravelCategories().map((category) => ({
                                value: category,
                                label: category
                              }))}
                              value={item.leadCategory || ""}
                              onValueChange={(value) =>
                                updateLineItem(index, "leadCategory", value)
                              }
                              placeholder="Category"
                              searchPlaceholder="Search..."
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 dark:text-gray-400">Qty</Label>
                            <Input
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              onKeyDown={handleNumericKeyDown}
                              className="h-8 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 dark:text-gray-400">Price</Label>
                            <Input
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "unitPrice",
                                  e.target.value,
                                )
                              }
                              onKeyDown={handleNumericKeyDown}
                              className="h-8 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 dark:text-gray-400">Tax</Label>
                            <Input
                              value={item.tax}
                              onChange={(e) =>
                                updateLineItem(index, "tax", e.target.value)
                              }
                              onKeyDown={handleNumericKeyDown}
                              placeholder="0"
                              className="h-8 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs text-gray-600 dark:text-gray-400">Discount</Label>
                            <Input
                              value={item.discount}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "discount",
                                  e.target.value,
                                )
                              }
                              onKeyDown={handleNumericKeyDown}
                              placeholder="0"
                              className="h-8 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 dark:text-gray-400">Total</Label>
                            <Input
                              readOnly
                              value={`$${item.totalPrice.toFixed(2)}`}
                              className="h-8 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                            />
                          </div>
                          {formData.lineItems.length > 1 && (
                            <div className="flex items-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLineItem(index)}
                                type="button"
                                className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <div>
                          <Textarea
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Description (optional)"
                            rows={2}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg resize-none text-sm px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <div className="pt-4">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="application/pdf,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="flex items-center gap-2 h-8 px-3 text-xs"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Files
                  </Button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    PDF or Images (10MB max)
                  </span>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          {file.type === 'application/pdf' ? (
                            <FileText className="h-4 w-4 text-red-500" />
                          ) : (
                            <Image className="h-4 w-4 text-blue-500" />
                          )}
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing & Payment - 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                {/* Pricing */}
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Currency</Label>
                      <Combobox
                        options={[
                          { value: "USD", label: "USD" },
                          { value: "EUR", label: "EUR" },
                          { value: "INR", label: "INR" },
                          { value: "GBP", label: "GBP" },
                        ]}
                        value={formData.currency}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, currency: value }))
                        }
                        placeholder="Select currency"
                        searchPlaceholder="Search..."
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Total Price</Label>
                      <Input
                        value={totals.subtotal}
                        readOnly
                        className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Discount (%)</Label>
                      <Input
                        value={formData.discountPercentage}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            discountPercentage: e.target.value,
                          }))
                        }
                        onKeyDown={handleNumericKeyDown}
                        placeholder="0"
                        className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Tax (%)</Label>
                      <Input
                        value={formData.taxPercentage}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            taxPercentage: e.target.value,
                          }))
                        }
                        onKeyDown={handleNumericKeyDown}
                        placeholder="0"
                        className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all max-w-[200px]"
                      />
                    </div>
                  </div>
                  <div className="pt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                      <span className="font-medium">-${totals.discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                      <span className="font-medium">${totals.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-cyan-600 dark:text-cyan-400 pt-1.5 border-t border-gray-200 dark:border-gray-700">
                      <span>Total:</span>
                      <span>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Deposit Settings & Payment Terms */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Require Deposit</Label>
                    <Switch
                      checked={formData.depositRequired}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          depositRequired: checked,
                        }))
                      }
                    />
                  </div>
                  {formData.depositRequired && (
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Deposit (%)</Label>
                      <Input
                        value={formData.depositPercentage}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            depositPercentage: e.target.value,
                          }))
                        }
                        onKeyDown={handleNumericKeyDown}
                        placeholder="e.g., 50"
                        className="h-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all max-w-[200px]"
                      />
                    </div>
                  )}
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Payment Terms</Label>
                    <Combobox
                      options={[
                        { value: "immediate", label: "Immediate" },
                        { value: "net7", label: "Net 7" },
                        { value: "net30", label: "Net 30" },
                        { value: "net60", label: "Net 60" },
                      ]}
                      value={formData.paymentTerms}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentTerms: value,
                        }))
                      }
                      placeholder="Select terms"
                      searchPlaceholder="Search..."
                      className="max-w-[200px] h-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Add any additional notes or special instructions here..."
                  rows={4}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg resize-none text-sm px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

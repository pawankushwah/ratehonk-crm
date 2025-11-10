import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AutocompleteInput,
  AutocompleteOption,
} from "@/components/ui/autocomplete-input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Receipt,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { VendorCreateForm } from "@/components/forms/vendor-create-form";
import { LeadTypeCreateForm } from "@/components/forms/lead-type-create-form";
import { DatePicker } from "@/components/ui/date-picker";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const EXPENSE_CATEGORIES = [
  { value: "travel", label: "Travel & Transportation", icon: "🚗" },
  { value: "office", label: "Office Supplies", icon: "🏢" },
  { value: "marketing", label: "Marketing & Advertising", icon: "📢" },
  { value: "software", label: "Software & Tools", icon: "💻" },
  { value: "meals", label: "Meals & Entertainment", icon: "🍽️" },
  { value: "training", label: "Training & Education", icon: "📚" },
  { value: "equipment", label: "Equipment & Hardware", icon: "⚙️" },
  { value: "communication", label: "Communication", icon: "📞" },
  { value: "utilities", label: "Utilities", icon: "⚡" },
  { value: "other", label: "Other", icon: "📦" },
];

export default function ExpenseCreate() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [expenseItems, setExpenseItems] = useState([
    {
      category: "",
      title: "",
      vendorId: "",
      leadTypeId: "",
      amount: "",
      taxRate: "0",
      taxAmount: "0",
      totalAmount: 0,
      paymentMethod: "credit_card",
      paymentStatus: "paid", // paid, credit, due
      amountPaid: "",
      amountDue: "",
      notes: "",
    },
  ]);

  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const currency = "USD"; // Default currency
  const [notesContent, setNotesContent] = useState("");

  // Slide panel states
  const [isVendorPanelOpen, setIsVendorPanelOpen] = useState(false);
  const [isLeadTypePanelOpen, setIsLeadTypePanelOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Fetch vendors
  const { data: vendors = [] } = useQuery({
    queryKey: ["/api/vendors"],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch("/api/vendors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch vendors");
      return response.json();
    },
  });

  // Fetch lead types
  const { data: leadTypes = [] } = useQuery({
    queryKey: ["/api/lead-types"],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch("/api/lead-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch lead types");
      return response.json();
    },
  });

  // Fetch all expenses for title suggestions
  const { data: allExpenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch("/api/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
  });

  // Get unique expense titles for autocomplete
  const getExpenseTitleSuggestions = (): AutocompleteOption[] => {
    if (!allExpenses || !Array.isArray(allExpenses)) return [];
    
    const uniqueTitles = new Set(
      allExpenses
        .map((exp: any) => exp.title)
        .filter((title: string) => title && title.trim() !== "")
    );

    return Array.from(uniqueTitles).map((title: string) => ({
      value: title,
      label: title,
    }));
  };

  const createExpensesMutation = useMutation({
    mutationFn: async (expenses: any[]) => {
      const token = auth.getToken();
      const promises = expenses.map((expense) =>
        fetch("/api/expenses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(expense),
        }).then((res) => {
          if (!res.ok) throw new Error("Failed to create expense");
          return res.json();
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Success",
        description: `${expenseItems.length} expense(s) created successfully`,
      });
      navigate("/expenses");
    },
    onError: (error: any) => {
      console.error("Error creating expenses:", error);
      toast({
        title: "Error",
        description: "Failed to create expenses",
        variant: "destructive",
      });
    },
  });

  const handleNumericKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9.]/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
      e.preventDefault();
    }
  };

  const addExpenseItem = () => {
    setExpenseItems([
      ...expenseItems,
      {
        category: "",
        title: "",
        vendorId: "",
        leadTypeId: "",
        amount: "",
        taxRate: "0",
        taxAmount: "0",
        totalAmount: 0,
        paymentMethod: "credit_card",
        paymentStatus: "paid",
        amountPaid: "",
        amountDue: "",
        notes: "",
      },
    ]);
  };

  const removeExpenseItem = (index: number) => {
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter((_, i) => i !== index));
    }
  };

  const updateExpenseItem = (index: number, field: string, value: any) => {
    const updatedItems = [...expenseItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate totals if amount or tax changes
    if (field === "amount" || field === "taxRate") {
      const amount = parseFloat(updatedItems[index].amount || "0");
      const taxRate = parseFloat(updatedItems[index].taxRate || "0");
      const taxAmount = (amount * taxRate) / 100;
      updatedItems[index].taxAmount = taxAmount.toFixed(2);
      updatedItems[index].totalAmount = amount + taxAmount;
    }

    setExpenseItems(updatedItems);
  };

  // Get vendor options
  const getVendorOptions = (): AutocompleteOption[] => {
    const vendorOptions = vendors.map((vendor: any) => ({
      value: vendor.id.toString(),
      label: vendor.name,
    }));

    return [
      { value: "none", label: "No Vendor" },
      { value: "create_new", label: "➕ Create New Vendor" },
      ...vendorOptions,
    ];
  };

  // Get lead type options
  const getLeadTypeOptions = (): AutocompleteOption[] => {
    const leadTypeOptions = leadTypes.map((type: any) => ({
      value: type.id.toString(),
      label: type.name,
    }));

    return [
      { value: "none", label: "No Lead Type" },
      { value: "create_new", label: "➕ Create New Lead Type" },
      ...leadTypeOptions,
    ];
  };

  // Get category options
  const getCategoryOptions = (): AutocompleteOption[] => {
    return EXPENSE_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: `${cat.icon} ${cat.label}`,
    }));
  };

  // Handle vendor selection
  const handleVendorSelection = (vendorId: string, index: number) => {
    if (vendorId === "create_new") {
      setCurrentItemIndex(index);
      setIsVendorPanelOpen(true);
    } else {
      updateExpenseItem(index, "vendorId", vendorId);
    }
  };

  // Handle lead type selection
  const handleLeadTypeSelection = (leadTypeId: string, index: number) => {
    if (leadTypeId === "create_new") {
      setCurrentItemIndex(index);
      setIsLeadTypePanelOpen(true);
    } else {
      updateExpenseItem(index, "leadTypeId", leadTypeId);
    }
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return expenseItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
  };

  const calculateTotalTax = () => {
    return expenseItems.reduce((sum, item) => sum + parseFloat(item.taxAmount || "0"), 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateTotalTax();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const expenses = expenseItems.map((item) => ({
      title: item.title,
      description: item.notes,
      amount: parseFloat(item.amount || "0"),
      currency: currency,
      category: item.category,
      subcategory: "",
      expenseDate: expenseDate,
      paymentMethod: item.paymentMethod,
      paymentReference: "",
      vendorId: item.vendorId && item.vendorId !== "none" ? parseInt(item.vendorId) : null,
      leadTypeId: item.leadTypeId && item.leadTypeId !== "none" ? parseInt(item.leadTypeId) : null,
      expenseType: "purchase",
      receiptUrl: "",
      taxAmount: parseFloat(item.taxAmount || "0"),
      taxRate: parseFloat(item.taxRate || "0"),
      isReimbursable: false,
      isRecurring: false,
      recurringFrequency: "",
      status: "pending",
      tags: [],
      notes: notesContent || item.notes,
    }));

    createExpensesMutation.mutate(expenses);
  };

  return (
    <Layout initialSidebarCollapsed={true}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/expenses")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create Expenses
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Add multiple expense entries at once
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Expense Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="expenseDate">Expense Date *</Label>
                  <DatePicker
                    value={expenseDate}
                    onChange={setExpenseDate}
                    placeholder="Select expense date"
                    className="w-full"
                  />
                  <input type="hidden" name="expenseDate" value={expenseDate} />
                </div>
              </div>

              {/* Expense Line Items */}
              <div className="border rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[auto_1fr_1.5fr_0.8fr_0.8fr_0.8fr_0.5fr_0.6fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-2 bg-gray-100 dark:bg-gray-800 p-3 font-medium text-sm">
                  <div className="text-center">#</div>
                  <div>Category *</div>
                  <div>Title *</div>
                  <div>Vendor</div>
                  <div>Lead Type</div>
                  <div>Amount *</div>
                  <div>Tax %</div>
                  <div>Tax Amt</div>
                  <div>Total</div>
                  <div>Status *</div>
                  <div>Paid</div>
                  <div>Due</div>
                  <div>Payment</div>
                  <div></div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {expenseItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[auto_1fr_1.5fr_0.8fr_0.8fr_0.8fr_0.5fr_0.6fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <div className="flex items-center justify-center">
                        <span className="font-medium text-sm">{index + 1}</span>
                      </div>

                      <div>
                        <AutocompleteInput
                          data-testid={`autocomplete-category-${index}`}
                          suggestions={getCategoryOptions()}
                          value={item.category}
                          onValueChange={(value) =>
                            updateExpenseItem(index, "category", value)
                          }
                          placeholder="Select..."
                          emptyText="No categories found"
                        />
                      </div>

                      <div>
                        <AutocompleteInput
                          data-testid={`autocomplete-title-${index}`}
                          suggestions={getExpenseTitleSuggestions()}
                          value={item.title}
                          onValueChange={(value) =>
                            updateExpenseItem(index, "title", value)
                          }
                          placeholder="Type or select expense title..."
                          emptyText="No previous expenses found"
                          allowCustomValue={true}
                        />
                      </div>

                      <div>
                        <AutocompleteInput
                          data-testid={`autocomplete-vendor-${index}`}
                          suggestions={getVendorOptions()}
                          value={item.vendorId}
                          onValueChange={(value) =>
                            handleVendorSelection(value, index)
                          }
                          placeholder="Select..."
                          emptyText="No vendors found"
                        />
                      </div>

                      <div>
                        <AutocompleteInput
                          data-testid={`autocomplete-lead-type-${index}`}
                          suggestions={getLeadTypeOptions()}
                          value={item.leadTypeId}
                          onValueChange={(value) =>
                            handleLeadTypeSelection(value, index)
                          }
                          placeholder="Select..."
                          emptyText="No lead types found"
                        />
                      </div>

                      <div>
                        <Input
                          data-testid={`input-amount-${index}`}
                          type="text"
                          value={item.amount}
                          onChange={(e) =>
                            updateExpenseItem(index, "amount", e.target.value)
                          }
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div>
                        <Input
                          data-testid={`input-tax-rate-${index}`}
                          type="text"
                          value={item.taxRate}
                          onChange={(e) =>
                            updateExpenseItem(index, "taxRate", e.target.value)
                          }
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Input
                          value={item.taxAmount}
                          readOnly
                          className="bg-gray-50 dark:bg-gray-900 text-xs"
                        />
                      </div>

                      <div>
                        <Input
                          value={item.totalAmount.toFixed(2)}
                          readOnly
                          className="bg-gray-50 dark:bg-gray-900 font-semibold text-xs"
                        />
                      </div>

                      <div>
                        <Select
                          value={item.paymentStatus}
                          onValueChange={(value) => {
                            updateExpenseItem(index, "paymentStatus", value);
                            // Auto-fill paid/due amounts based on status
                            if (value === "paid") {
                              updateExpenseItem(index, "amountPaid", item.totalAmount.toFixed(2));
                              updateExpenseItem(index, "amountDue", "0");
                            } else if (value === "due") {
                              updateExpenseItem(index, "amountPaid", "0");
                              updateExpenseItem(index, "amountDue", item.totalAmount.toFixed(2));
                            }
                          }}
                        >
                          <SelectTrigger data-testid={`select-payment-status-${index}`} className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="due">Due</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Input
                          data-testid={`input-amount-paid-${index}`}
                          type="text"
                          value={item.amountPaid}
                          onChange={(e) =>
                            updateExpenseItem(index, "amountPaid", e.target.value)
                          }
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0.00"
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <Input
                          data-testid={`input-amount-due-${index}`}
                          type="text"
                          value={item.amountDue}
                          onChange={(e) =>
                            updateExpenseItem(index, "amountDue", e.target.value)
                          }
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0.00"
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <Select
                          value={item.paymentMethod}
                          onValueChange={(value) =>
                            updateExpenseItem(index, "paymentMethod", value)
                          }
                        >
                          <SelectTrigger data-testid={`select-payment-method-${index}`} className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit_card">Card</SelectItem>
                            <SelectItem value="debit_card">Debit</SelectItem>
                            <SelectItem value="bank_transfer">Bank</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="petty_cash">Petty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpenseItem(index)}
                          disabled={expenseItems.length === 1}
                          data-testid={`button-remove-expense-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Line Button */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addExpenseItem}
                    className="w-full"
                    data-testid="button-add-expense-item"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense Item
                  </Button>
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="border rounded-lg p-6 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Subtotal:</span>
                    <span className="font-semibold text-lg">
                      {currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
                      {calculateSubtotal().toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Total Tax:</span>
                    <span className="font-semibold text-lg text-blue-600">
                      {currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
                      {calculateTotalTax().toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 dark:border-gray-600">
                    <span className="text-gray-900 dark:text-white font-bold text-lg">Grand Total:</span>
                    <span className="font-bold text-2xl text-cyan-600">
                      {currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
                      {calculateGrandTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes Section with Rich Text Editor */}
              <div className="border rounded-lg p-4">
                <Label htmlFor="notes" className="text-lg font-semibold mb-3 block">
                  Notes (Optional)
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Add any additional notes or attachments for all expenses.
                </p>
                <div className="bg-white dark:bg-gray-900 rounded-lg" data-testid="rich-text-editor-notes">
                  <ReactQuill
                    theme="snow"
                    value={notesContent}
                    onChange={setNotesContent}
                    className="h-48"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['link', 'image'],
                        ['clean']
                      ],
                    }}
                    formats={[
                      'header',
                      'bold', 'italic', 'underline', 'strike',
                      'list', 'bullet',
                      'color', 'background',
                      'link', 'image'
                    ]}
                    placeholder="Type your notes here..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/expenses")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createExpensesMutation.isPending}
                  data-testid="button-create-expenses"
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  {createExpensesMutation.isPending
                    ? "Creating..."
                    : `Create ${expenseItems.length} Expense${expenseItems.length > 1 ? "s" : ""}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Vendor Create Slide Panel */}
      <Sheet open={isVendorPanelOpen} onOpenChange={setIsVendorPanelOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Vendor</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <VendorCreateForm
              tenantId={tenant?.id?.toString() || ""}
              onSuccess={(vendor) => {
                queryClient.invalidateQueries({
                  queryKey: ["/api/vendors"],
                });
                updateExpenseItem(currentItemIndex, "vendorId", vendor.id?.toString() || "");
                setIsVendorPanelOpen(false);
                toast({
                  title: "Success",
                  description: "Vendor created and selected",
                });
              }}
              onCancel={() => setIsVendorPanelOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Lead Type Create Slide Panel */}
      <Sheet open={isLeadTypePanelOpen} onOpenChange={setIsLeadTypePanelOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Lead Type</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <LeadTypeCreateForm
              tenantId={tenant?.id?.toString() || ""}
              onSuccess={(leadType) => {
                queryClient.invalidateQueries({
                  queryKey: ["/api/lead-types"],
                });
                updateExpenseItem(currentItemIndex, "leadTypeId", leadType.id?.toString() || "");
                setIsLeadTypePanelOpen(false);
                toast({
                  title: "Success",
                  description: "Lead type created and selected",
                });
              }}
              onCancel={() => setIsLeadTypePanelOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}

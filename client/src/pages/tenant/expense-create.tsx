import React, { useState, useEffect, useMemo, useRef } from "react";
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
  HelpCircle,
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
import { useLocation, useRoute } from "wouter";
import { VendorCreateForm } from "@/components/forms/vendor-create-form";
import { LeadTypeCreateForm } from "@/components/forms/lead-type-create-form";
import { DatePicker } from "@/components/ui/date-picker";
import { ExpenseSettingsPanel } from "@/components/expense-settings-panel";
import { Switch } from "@/components/ui/switch";
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
  const [location, navigate] = useLocation();
  const [match, params] = useRoute("/expenses/create/:id?");
  
  // Extract expense ID from route params or URL path
  const expenseId = React.useMemo(() => {
    if (params?.id) {
      const id = parseInt(params.id);
      return isNaN(id) ? null : id;
    }
    // Fallback: extract from URL path
    const pathMatch = location.match(/\/expenses\/create\/(\d+)/);
    if (pathMatch && pathMatch[1]) {
      const id = parseInt(pathMatch[1]);
      return isNaN(id) ? null : id;
    }
    return null;
  }, [params?.id, location]);
  
  const isEditMode = !!expenseId;

  // Debug: Log route params
  useEffect(() => {
    console.log("Route params:", { 
      location, 
      match, 
      params, 
      expenseId, 
      isEditMode,
      extractedFromParams: !!params?.id,
      extractedFromPath: location.includes('/expenses/create/')
    });
  }, [location, match, params, expenseId, isEditMode]);

  const [expenseItems, setExpenseItems] = useState([
    {
      category: "",
      title: "",
      vendorId: "",
      leadTypeId: "",
      amount: "",
      taxRateId: "",
      taxAmount: "0",
      totalAmount: 0,
      paymentMethod: "credit_card",
      paymentStatus: "paid", // paid, credit, due
      amountPaid: "",
      amountDue: "",
      notes: "",
    },
  ]);

  const [selectedTaxSettingId, setSelectedTaxSettingId] = useState<string>("");

  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("USD");
  const [notesContent, setNotesContent] = useState("");
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [expenseNumber, setExpenseNumber] = useState("");

  // Fetch expense settings
  const { data: expenseSettings = {
    expenseNumberStart: 1,
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
  }, refetch: refetchExpenseSettings } = useQuery({
    queryKey: ["/api/expense-settings", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const token = auth.getToken();
      const response = await fetch(`/api/expense-settings/${tenant.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch expense settings");
      const result = await response.json();
      return result.data;
    },
    enabled: !!tenant?.id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Fetch existing expenses for number generation
  const { data: expenses = [] } = useQuery<any[]>({
    queryKey: ["/api/expenses", tenant?.id],
    enabled: !!tenant?.id && !isEditMode,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/expenses?tenantId=${tenant?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.expenses || result.data || [];
    },
  });

  // Update currency when settings load
  useEffect(() => {
    if (expenseSettings?.defaultCurrency) {
      setCurrency(expenseSettings.defaultCurrency);
    }
    if (expenseSettings?.defaultGstSettingId) {
      setSelectedTaxSettingId(expenseSettings.defaultGstSettingId.toString());
    }
  }, [expenseSettings?.defaultCurrency, expenseSettings?.defaultGstSettingId]);

  // Function to generate next expense number
  const generateNextExpenseNumber = useMemo(() => {
    const startNumber = expenseSettings?.expenseNumberStart || 1;
    
    if (!expenses || expenses.length === 0) {
      // No existing expenses, use starting number from settings
      return `EXP-${String(startNumber).padStart(3, '0')}`;
    }

    // Extract numbers from existing expense numbers (if they have one)
    // Note: Expenses might not have expenseNumber field yet, so we'll use ID as fallback
    const expenseNumbers = expenses
      .map((exp: any) => {
        const expNum = exp.expenseNumber || exp.referenceNumber || "";
        // Extract number from formats like EXP-001, EXP-1, EXP001, etc.
        const match = expNum.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num: number) => num > 0);

    // Find the highest number
    const maxNumber = expenseNumbers.length > 0 
      ? Math.max(...expenseNumbers) 
      : startNumber - 1;

    // Use the higher of: max existing number + 1, or starting number
    const nextNumber = Math.max(maxNumber + 1, startNumber);
    
    return `EXP-${String(nextNumber).padStart(3, '0')}`;
  }, [expenses, expenseSettings?.expenseNumberStart]);

  // Track the last starting number used for auto-generation
  const lastStartingNumber = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  // Auto-generate expense number when expenses/settings are loaded
  useEffect(() => {
    if (isEditMode) return; // Don't auto-generate in edit mode
    
    const currentStartNumber = expenseSettings?.expenseNumberStart || 1;
    
    if (generateNextExpenseNumber) {
      // Check if starting number changed
      const startingNumberChanged = lastStartingNumber.current !== null && 
                                    lastStartingNumber.current !== currentStartNumber;
      
      // On first initialization, always update (even if field has a value)
      // After that, update if field is empty OR starting number changed
      const shouldUpdate = !hasInitialized.current || 
                          !expenseNumber || 
                          startingNumberChanged;
      
      if (shouldUpdate) {
        lastStartingNumber.current = currentStartNumber;
        hasInitialized.current = true;
        setExpenseNumber(generateNextExpenseNumber);
      }
    } else if (expenseSettings?.expenseNumberStart && !hasInitialized.current) {
      // Initialize lastStartingNumber even if generateNextExpenseNumber isn't ready yet
      lastStartingNumber.current = expenseSettings.expenseNumberStart;
    }
  }, [generateNextExpenseNumber, expenseSettings?.expenseNumberStart, isEditMode]);

  // Fetch GST rates based on selected tax setting
  const { data: gstRates = [] } = useQuery<any[]>({
    queryKey: ["/api/gst-rates", selectedTaxSettingId],
    enabled: !!selectedTaxSettingId && !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/gst-rates?gstSettingId=${selectedTaxSettingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.rates || [];
    },
  });

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

  // Fetch expense data for edit mode
  const { data: expenseData, isLoading: isLoadingExpense } = useQuery({
    queryKey: ["/api/expenses", expenseId],
    enabled: isEditMode && !!expenseId && !!tenant?.id,
    queryFn: async () => {
      console.log("Fetching expense data for ID:", expenseId);
      const token = auth.getToken();
      const response = await fetch(`/api/expenses/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.error("Failed to fetch expense:", response.status, response.statusText);
        throw new Error("Failed to fetch expense");
      }
      const data = await response.json();
      console.log("Expense data fetched:", data);
      return data;
    },
  });

  // Debug: Log query state
  useEffect(() => {
    console.log("Expense query state:", {
      expenseId,
      tenantId: tenant?.id,
      isEditMode,
      enabled: isEditMode && !!expenseId && !!tenant?.id,
      isLoadingExpense,
      expenseData,
      match,
      params,
    });
  }, [expenseId, tenant?.id, isEditMode, isLoadingExpense, expenseData, match, params]);

  // Load expense data when in edit mode
  useEffect(() => {
    if (isEditMode && expenseData && !isLoadingExpense) {
      const expense = expenseData;
      console.log("Loading expense data:", expense);
      
      setExpenseDate(expense.expense_date || expense.expenseDate || new Date().toISOString().split("T")[0]);
      setCurrency(expense.currency || "USD");
      setNotesContent(expense.notes || "");
      
      // Find tax rate ID from tax rate value - wait for gstRates to be available
      let taxRateId = "";
      if (expense.tax_rate && gstRates && gstRates.length > 0) {
        const taxRateValue = parseFloat(expense.tax_rate?.toString() || "0");
        const matchingRate = gstRates.find((rate: any) => {
          const rateValue = parseFloat(rate.rate?.toString() || "0");
          return Math.abs(rateValue - taxRateValue) < 0.01; // Allow small floating point differences
        });
        if (matchingRate) {
          taxRateId = matchingRate.id?.toString() || "";
        }
      }
      
      // Set expense items from the expense data
      const expenseItem = {
        category: expense.category || "",
        title: expense.title || "",
        vendorId: expense.vendor_id?.toString() || expense.vendorId?.toString() || "",
        leadTypeId: expense.lead_type_id?.toString() || expense.leadTypeId?.toString() || "",
        amount: expense.amount?.toString() || "",
        taxRateId: taxRateId,
        taxAmount: expense.tax_amount?.toString() || expense.taxAmount?.toString() || "0",
        totalAmount: parseFloat(expense.amount || "0") + parseFloat(expense.tax_amount || expense.taxAmount || "0"),
        paymentMethod: expense.payment_method || expense.paymentMethod || "credit_card",
        paymentStatus: expense.status || "paid",
        amountPaid: expense.amount_paid?.toString() || expense.amountPaid?.toString() || "",
        amountDue: expense.amount_due?.toString() || expense.amountDue?.toString() || "",
        notes: expense.notes || expense.description || "",
      };
      
      console.log("Setting expense item:", expenseItem);
      setExpenseItems([expenseItem]);
    }
  }, [isEditMode, expenseData, isLoadingExpense, gstRates]);

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
      if (isEditMode && expenseId) {
        // Update existing expense
        const expense = expenses[0];
        const response = await fetch(`/api/expenses/${expenseId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(expense),
        });
        if (!response.ok) throw new Error("Failed to update expense");
        return [await response.json()];
      } else {
        // Create new expenses
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Success",
        description: isEditMode 
          ? "Expense updated successfully"
          : `${expenseItems.length} expense(s) created successfully`,
      });
      navigate("/expenses");
    },
    onError: (error: any) => {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} expenses:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} expense${isEditMode ? '' : 's'}`,
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
        taxRateId: "",
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

    // Calculate totals if amount or tax rate changes
    if (field === "amount" || field === "taxRateId") {
      const amount = parseFloat(updatedItems[index].amount || "0");
      let taxAmount = 0;
      let totalAmount = amount;
      
      if (updatedItems[index].taxRateId) {
        const selectedRate = gstRates.find(
          (rate: any) => rate.id?.toString() === updatedItems[index].taxRateId
        );
        if (selectedRate) {
          const ratePercentage = parseFloat(selectedRate.rate || "0");
          
          if (isTaxInclusive) {
            // When tax is inclusive, tax is already in the price
            // Calculate: amount = subtotal + tax, so tax = amount - subtotal
            // Or: subtotal = amount / (1 + rate/100), tax = amount - subtotal
            const subtotal = amount / (1 + ratePercentage / 100);
            taxAmount = amount - subtotal;
            totalAmount = amount; // Total is the amount itself when inclusive
          } else {
            // When tax is exclusive, calculate tax and add it
            taxAmount = (amount * ratePercentage) / 100;
            totalAmount = amount + taxAmount;
          }
        }
      }
      
      updatedItems[index].taxAmount = taxAmount.toFixed(2);
      updatedItems[index].totalAmount = totalAmount;
    }

    setExpenseItems(updatedItems);
  };

  // Recalculate all items when tax inclusive setting changes
  useEffect(() => {
    const recalculatedItems = expenseItems.map((item) => {
      if (item.amount && item.taxRateId) {
        const amount = parseFloat(item.amount || "0");
        let taxAmount = 0;
        let totalAmount = amount;
        
        const selectedRate = gstRates.find(
          (rate: any) => rate.id?.toString() === item.taxRateId
        );
        if (selectedRate) {
          const ratePercentage = parseFloat(selectedRate.rate || "0");
          
          if (isTaxInclusive) {
            const subtotal = amount / (1 + ratePercentage / 100);
            taxAmount = amount - subtotal;
            totalAmount = amount;
          } else {
            taxAmount = (amount * ratePercentage) / 100;
            totalAmount = amount + taxAmount;
          }
        }
        
        return {
          ...item,
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount,
        };
      }
      return item;
    });
    setExpenseItems(recalculatedItems);
  }, [isTaxInclusive, gstRates]);

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

  // Build dynamic grid template based on visible fields - matching invoice-create design
  const getGridTemplate = useMemo(() => {
    const cols: string[] = [];
    
    cols.push("30px"); // # column - smaller (fixed)
    if (expenseSettings?.showCategory !== false) cols.push("minmax(250px, 2fr)"); // Category - bigger (flexible, min 250px)
    cols.push("minmax(150px, 1.5fr)"); // Title (flexible, min 150px)
    if (expenseSettings?.showVendor !== false) cols.push("minmax(250px, 2fr)"); // Vendor - bigger (flexible, min 250px)
    if (expenseSettings?.showLeadType !== false) cols.push("minmax(250px, 2fr)"); // Lead Type/Provider - bigger (flexible, min 250px)
    cols.push("minmax(130px, 1fr)"); // Amount - small (flexible, min 130px)
    if (expenseSettings?.showTax !== false) {
      cols.push("minmax(100px, 1fr)"); // Tax Rate - small (flexible, min 100px)
      cols.push("minmax(100px, 1fr)"); // Tax Amt - small (flexible, min 100px)
    }
    cols.push("minmax(100px, 1fr)"); // Total - small (flexible, min 100px)
    if (expenseSettings?.showPaymentStatus !== false) cols.push("minmax(100px, 1fr)"); // Status - small (flexible, min 100px)
    if (expenseSettings?.showPaymentStatus !== false) {
      cols.push("minmax(100px, 1fr)"); // Paid - small (flexible, min 100px)
      cols.push("minmax(100px, 1fr)"); // Due - small (flexible, min 100px)
    }
    if (expenseSettings?.showPaymentMethod !== false) cols.push("minmax(100px, 1fr)"); // Payment - small (flexible, min 100px)
    cols.push("50px"); // Delete button - small (fixed)
    
    return cols.join(" ");
  }, [expenseSettings?.showCategory, expenseSettings?.showVendor, expenseSettings?.showLeadType, expenseSettings?.showTax, expenseSettings?.showPaymentStatus, expenseSettings?.showPaymentMethod]);
  
  const gridTemplate = getGridTemplate;

  // Get currency symbol
  const getCurrencySymbol = () => {
    switch (currency) {
      case "INR": return "₹";
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "AUD": return "A$";
      case "CAD": return "C$";
      default: return "$";
    }
  };
  const currencySymbol = getCurrencySymbol();

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
    if (isTaxInclusive) {
      // When tax is inclusive, subtotal = sum of all amounts (tax is already included)
      return expenseItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
    } else {
      // When tax is exclusive, subtotal = sum of amounts without tax
      return expenseItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
    }
  };

  const calculateTotalTax = () => {
    if (isTaxInclusive) {
      // When tax is inclusive, tax should be 0 in display (it's already in the price)
      return 0;
    } else {
      // When tax is exclusive, sum all tax amounts
      return expenseItems.reduce((sum, item) => sum + parseFloat(item.taxAmount || "0"), 0);
    }
  };

  const calculateGrandTotal = () => {
    if (isTaxInclusive) {
      // When tax is inclusive, grand total = subtotal (tax is already included)
      return calculateSubtotal();
    } else {
      // When tax is exclusive, grand total = subtotal + tax
      return calculateSubtotal() + calculateTotalTax();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const expenses = expenseItems.map((item) => ({
      title: item.title,
      description: item.notes,
      amount: parseFloat(item.amount || "0"),
      currency: expenseSettings?.defaultCurrency || currency,
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
      taxRate: item.taxRateId
        ? (() => {
            const selectedRate = gstRates.find(
              (rate: any) => rate.id?.toString() === item.taxRateId
            );
            return selectedRate ? parseFloat(selectedRate.rate || "0") : 0;
          })()
        : 0,
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
      <div className="p-3 sm:p-4 md:p-6 mx-auto">
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="">
            <div className="w-full min-h-[72px] flex flex-col sm:flex-row items-start sm:items-center bg-white px-3 sm:px-4 md:px-[18px] py-3 sm:py-4 rounded-t-xl border-b border-[#E3E8EF] shadow-[0px_1px_6px_0px_rgba(0,0,0,0.05)] gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/expenses")}
                  data-testid="button-back"
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <h1 className="ml-2 sm:ml-4 font-inter font-medium text-base sm:text-[20px] leading-[24px] text-[#121926] truncate">
                  {isEditMode ? "Edit Expense" : "Create Expenses"}
                </h1>
              </div>

              <div className="flex gap-3 ml-auto">
                {tenant?.id && <ExpenseSettingsPanel tenantId={tenant.id} />}
                <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                  <HelpCircle className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <Card>
            <CardContent className="p-6 space-y-6">
              {/* Expense Number and Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Expense
                  </h1>
                </div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div>
                  <Label htmlFor="expenseNumber">Expense Number</Label>
                  <Input
                    id="expenseNumber"
                    value={expenseNumber}
                    onChange={(e) => setExpenseNumber(e.target.value)}
                    placeholder="EXP-001"
                  />
                </div>
              </div>

              {/* Expense Date Row */}
              <div className="flex items-end gap-4">
                <div className="w-auto md:w-64">
                  <Label htmlFor="expenseDate">Expense Date *</Label>
                  <DatePicker
                    value={expenseDate}
                    onChange={setExpenseDate}
                    placeholder="Select expense date"
                    className="w-full"
                  />
                  <input type="hidden" name="expenseDate" value={expenseDate} />
                </div>
                {expenseSettings?.showTax !== false && (
                  <div className="ml-auto">
                    <Label htmlFor="taxInclusive" className="text-sm font-medium">
                      Tax Type
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-black">Exclusive</span>
                      <Switch
                        id="taxInclusive"
                        checked={isTaxInclusive}
                        onCheckedChange={setIsTaxInclusive}
                        data-testid="switch-tax-inclusive"
                      />
                      <span className="text-sm text-black">Inclusive</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Expense Line Items */}
              <div className="border rounded-lg">
                <div className="overflow-x-auto">
                  <div className="min-w-[2200px]">
                    {/* Table Header */}
                    <div 
                      className="sticky top-0 z-[100] grid gap-2 p-3 font-medium text-sm border-b bg-gray-50 dark:bg-gray-800" 
                      style={{ 
                        gridTemplateColumns: gridTemplate,
                        backgroundColor: 'rgb(249, 250, 251)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        minWidth: '2200px',
                        width: '100%',
                        willChange: 'transform'
                      }}
                    >
                      <div className="text-center flex items-center justify-center">#</div>
                      {expenseSettings?.showCategory !== false && <div className="flex items-center">Category *</div>}
                      <div className="flex items-center">Title *</div>
                      {expenseSettings?.showVendor !== false && <div className="flex items-center">Vendor</div>}
                      {expenseSettings?.showLeadType !== false && <div className="flex items-center">Lead Type</div>}
                      <div className="flex items-center">Amount ({currencySymbol}) *</div>
                      {expenseSettings?.showTax !== false && <div className="flex items-center">Tax Rate</div>}
                      {expenseSettings?.showTax !== false && <div className="flex items-center">Tax Amt ({currencySymbol})</div>}
                      <div className="flex items-center">Total ({currencySymbol})</div>
                      {expenseSettings?.showPaymentStatus !== false && <div className="flex items-center">Status *</div>}
                      {expenseSettings?.showPaymentStatus !== false && <div className="flex items-center">Paid ({currencySymbol})</div>}
                      {expenseSettings?.showPaymentStatus !== false && <div className="flex items-center">Due ({currencySymbol})</div>}
                      {expenseSettings?.showPaymentMethod !== false && <div className="flex items-center">Payment</div>}
                      <div></div>
                    </div>

                    {/* Table Body */}
                    <div>
                      {expenseItems.map((item, index) => (
                        <div
                          key={index}
                          className="grid gap-2 p-3 border-b last:border-b-0"
                          style={{ gridTemplateColumns: gridTemplate }}
                        >
                        <div className="flex items-center justify-center">
                          <span className="font-medium text-sm">{index + 1}</span>
                        </div>

                        {expenseSettings?.showCategory !== false && (
                          <div className="flex items-center">
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
                        )}

                        <div className="flex items-center">
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

                        {expenseSettings?.showVendor !== false && (
                          <div className="flex items-center">
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
                        )}

                        {expenseSettings?.showLeadType !== false && (
                          <div className="flex items-center">
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
                        )}

                        <div className="flex items-center">
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

                        {expenseSettings?.showTax !== false && (
                          <div className="flex items-center">
                            <Select
                              value={item.taxRateId || "none"}
                              onValueChange={(value) =>
                                updateExpenseItem(index, "taxRateId", value === "none" ? "" : value)
                              }
                            >
                              <SelectTrigger data-testid={`select-tax-rate-${index}`} className="text-xs">
                                <SelectValue placeholder="Select tax rate" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {gstRates
                                  .filter((rate: any) => rate.isActive !== false)
                                  .map((rate: any) => (
                                    <SelectItem key={rate.id} value={rate.id?.toString()}>
                                      {rate.rateName || `Rate ${rate.rate}%`} ({rate.rate}%)
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {!selectedTaxSettingId && (
                              <p className="text-xs text-black mt-1">
                                Select tax setting in expense settings
                              </p>
                            )}
                            {selectedTaxSettingId && gstRates.length === 0 && (
                              <p className="text-xs text-black mt-1">
                                No tax rates available
                              </p>
                            )}
                          </div>
                        )}

                        {expenseSettings?.showTax !== false && (
                          <div className="flex items-center">
                            <Input
                              value={item.taxAmount}
                              readOnly
                              className="text-xs"
                            />
                          </div>
                        )}

                        <div className="flex items-center">
                          <Input
                            value={item.totalAmount.toFixed(2)}
                            readOnly
                            className="font-semibold text-xs"
                          />
                        </div>

                        {expenseSettings?.showPaymentStatus !== false && (
                          <div className="flex items-center">
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
                        )}

                        {expenseSettings?.showPaymentStatus !== false && (
                          <div className="flex items-center">
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
                        )}

                        {expenseSettings?.showPaymentStatus !== false && (
                          <div className="flex items-center">
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
                        )}

                        {expenseSettings?.showPaymentMethod !== false && (
                          <div className="flex items-center">
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
                        )}

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
                  </div>
                </div>

                {/* Add New Line Button */}
                <div className="p-3 border-t">
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


              {/* Notes and Summary in Same Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Notes Section with Rich Text Editor */}
                {expenseSettings?.showNotes !== false && (
                  <div className="border rounded-lg p-4">
                    <Label htmlFor="notes" className="text-lg font-semibold mb-3 block">
                      Notes (Optional)
                    </Label>
                    <p className="text-sm text-black mb-3">
                      Add any additional notes or attachments for all expenses.
                    </p>
                    <div className="bg-white dark:bg-gray-900 rounded-lg" data-testid="rich-text-editor-notes">
                      <ReactQuill
                        theme="snow"
                        value={notesContent}
                        onChange={setNotesContent}
                        className="h-32"
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
                )}

                {/* Calculation Summary */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">
                    Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-black font-medium">Subtotal:</span>
                      <span className="font-semibold text-lg text-black">
                        {currencySymbol}{calculateSubtotal().toFixed(2)}
                      </span>
                    </div>

                    {expenseSettings?.showTax !== false && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-black font-medium">Total Tax:</span>
                        <span className="font-semibold text-lg text-black">
                          {currencySymbol}{isTaxInclusive ? "0.00" : calculateTotalTax().toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-3  border-gray-300 dark:border-gray-600">
                      <span className="text-black font-bold text-lg">Grand Total:</span>
                      <span className="font-bold text-2xl text-black">
                        {currencySymbol}{calculateGrandTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
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
                    ? (isEditMode ? "Updating..." : "Creating...")
                    : (isEditMode 
                        ? "Update Expense"
                        : `Create ${expenseItems.length} Expense${expenseItems.length > 1 ? "s" : ""}`)}
                </Button>
              </div>
              </CardContent>
            </Card>
            </form>
          </div>
        </div>
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

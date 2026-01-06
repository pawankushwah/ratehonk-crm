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
  Loader2,
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
    console.log("🔍 Route params:", { 
      location, 
      match, 
      params, 
      expenseId, 
      isEditMode,
      extractedFromParams: !!params?.id,
      extractedFromPath: location.includes('/expenses/create/'),
      tenantId: tenant?.id
    });
  }, [location, match, params, expenseId, isEditMode, tenant?.id]);

  const [expenseItems, setExpenseItems] = useState([
    {
      category: "",
      title: "",
      vendorId: "",
      leadTypeId: "",
      quantity: "1",
      amount: "",
      taxRateId: "",
      taxAmount: "0",
      totalAmount: 0,
      paymentMethod: "credit_card",
      paymentStatus: "paid", // paid, credit, due
      amountPaid: "",
      amountDue: "",
      notes: "",
      billFile: null as File | null,
      billUrl: "",
    },
  ]);

  const [selectedTaxSettingId, setSelectedTaxSettingId] = useState<string>("");

  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("USD");
  const [notesContent, setNotesContent] = useState("");
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [expenseNumber, setExpenseNumber] = useState("");
  const [expenseNumberOnly, setExpenseNumberOnly] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

  // Fetch expense settings
  const { data: expenseSettings = {
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
    showBills: true,
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
  // Fetch with a high limit to get all expenses for number generation
  const { data: expensesResponse } = useQuery<any>({
    queryKey: ["/api/expenses-all", tenant?.id],
    enabled: !!tenant?.id && !isEditMode,
    queryFn: async () => {
      const token = auth.getToken();
      // Fetch with a high limit to get all expenses for number generation
      const response = await fetch(`/api/expenses?limit=10000&page=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return { data: [] };
      const result = await response.json();
      // Handle both paginated and non-paginated responses
      if (Array.isArray(result)) {
        return { data: result };
      }
      return { data: result.data || result.expenses || [] };
    },
  });

  // Extract expenses array from response
  const expenses = expensesResponse?.data || [];

  // Fetch invoices for dropdown
  const { data: invoicesResponse } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/invoices`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("pageSize", "1000"); // Get a large number for dropdown
      const response = await fetch(
        `/api/tenants/${tenant?.id}/invoices?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) return { data: [] };
      const result = await response.json();
      return {
        data: result.data || result.invoices || [],
      };
    },
  });

  const invoices = invoicesResponse?.data || [];

  // Update currency when settings load
  useEffect(() => {
    if (expenseSettings?.defaultCurrency) {
      setCurrency(expenseSettings.defaultCurrency);
    }
    if (expenseSettings?.defaultGstSettingId) {
      setSelectedTaxSettingId(expenseSettings.defaultGstSettingId.toString());
    }
  }, [expenseSettings?.defaultCurrency, expenseSettings?.defaultGstSettingId]);

  // Helper function to extract number part from full expense number
  const extractNumberPart = (fullNumber: string, prefix: string): string => {
    if (!fullNumber) return "";
    // Remove prefix and any separators (like "-")
    const prefixPattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s-]*`, 'i');
    const cleaned = fullNumber.replace(prefixPattern, '').trim();
    // Extract just the numeric part
    const match = cleaned.match(/(\d+)/);
    return match ? match[1] : cleaned;
  };

  // Function to generate next expense number (returns just the number part)
  const generateNextExpenseNumber = useMemo(() => {
    const startNumber = expenseSettings?.expenseNumberStart || 1;
    const prefix = expenseSettings?.expenseNumberPrefix || "EXP";
    
    console.log("🔢 Generating expense number - expenses count:", expenses?.length, "startNumber:", startNumber, "prefix:", prefix);
    
    if (!expenses || expenses.length === 0) {
      // No existing expenses, use starting number from settings
      const generated = String(startNumber).padStart(3, '0');
      console.log("🔢 No existing expenses, using start number from settings:", generated);
      return generated;
    }

    // Extract numbers from existing expense numbers
    // Handle formats like: EXP-001, EXP001, EXP-1, EXP1, etc.
    const expenseNumbers = expenses
      .map((exp: any, index: number) => {
        const expNum = exp.expenseNumber || exp.expense_number || exp.referenceNumber || exp.reference_number || "";
        if (!expNum) {
          console.log(`🔢 Expense ${index} has no expense number`);
          return 0;
        }
        
        console.log(`🔢 Processing expense ${index}: "${expNum}"`);
        
        // Try to extract number - handle multiple formats
        // Pattern 1: PREFIX-NUMBER (e.g., EXP-001, BILL-123)
        const matchWithDash = expNum.match(/^[A-Za-z0-9]+[\s-]+(\d+)/);
        if (matchWithDash) {
          const num = parseInt(matchWithDash[1], 10);
          console.log(`🔢 Matched with dash pattern: ${num}`);
          return num;
        }
        
        // Pattern 2: PREFIXNUMBER (e.g., EXP001, BILL123)
        const matchNoDash = expNum.match(/^[A-Za-z]+(\d+)/);
        if (matchNoDash) {
          const num = parseInt(matchNoDash[1], 10);
          console.log(`🔢 Matched no dash pattern: ${num}`);
          return num;
        }
        
        // Pattern 3: Just numbers (extract first number sequence)
        const matchNumbers = expNum.match(/(\d+)/);
        if (matchNumbers) {
          const num = parseInt(matchNumbers[1], 10);
          console.log(`🔢 Matched numbers pattern: ${num}`);
          return num;
        }
        
        console.log(`🔢 No pattern matched for: "${expNum}"`);
        return 0;
      })
      .filter((num: number) => num > 0);

    console.log("🔢 Extracted expense numbers:", expenseNumbers);

    // Find the highest number from existing expenses
    const maxNumber = expenseNumbers.length > 0 
      ? Math.max(...expenseNumbers) 
      : 0;

    console.log("🔢 Max number from existing expenses:", maxNumber, "Start number from settings:", startNumber);

    // If we have existing expenses, increment from the highest
    // If no valid numbers found, use start number
    // Otherwise, use the higher of: (maxNumber + 1) or startNumber
    let nextNumber: number;
    if (expenseNumbers.length === 0) {
      // No valid expense numbers found, use start number
      nextNumber = startNumber;
      console.log("🔢 No valid expense numbers found, using start number:", nextNumber);
    } else {
      // We have valid expense numbers, increment from the highest
      // But ensure we don't go below the start number
      nextNumber = Math.max(maxNumber + 1, startNumber);
      console.log("🔢 Incrementing from max number:", maxNumber, "-> next:", nextNumber);
    }
    
    // Return just the number part (without prefix)
    const generated = String(nextNumber).padStart(3, '0');
    console.log("🔢 Final generated expense number:", generated);
    return generated;
  }, [expenses, expenseSettings?.expenseNumberStart, expenseSettings?.expenseNumberPrefix]);

  // Track the last starting number used for auto-generation
  const lastStartingNumber = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  // Auto-generate expense number when expenses/settings are loaded
  useEffect(() => {
    if (isEditMode) return; // Don't auto-generate in edit mode
    
    const currentStartNumber = expenseSettings?.expenseNumberStart || 1;
    const prefix = expenseSettings?.expenseNumberPrefix || "EXP";
    
    // Wait for both expenses and settings to be loaded
    if (generateNextExpenseNumber && expenseSettings && (expenses !== undefined)) {
      // Check if starting number changed
      const startingNumberChanged = lastStartingNumber.current !== null && 
                                    lastStartingNumber.current !== currentStartNumber;
      
      // On first initialization, always update (even if field has a value)
      // After that, update if field is empty OR starting number changed
      const shouldUpdate = !hasInitialized.current || 
                          !expenseNumberOnly || 
                          startingNumberChanged;
      
      if (shouldUpdate) {
        lastStartingNumber.current = currentStartNumber;
        hasInitialized.current = true;
        const numberPart = generateNextExpenseNumber;
        setExpenseNumberOnly(numberPart);
        setExpenseNumber(`${prefix}${numberPart}`);
        console.log("🔢 Set expense number:", `${prefix}${numberPart}`, "Number part:", numberPart);
      }
    } else if (expenseSettings?.expenseNumberStart && !hasInitialized.current) {
      // Initialize lastStartingNumber even if generateNextExpenseNumber isn't ready yet
      lastStartingNumber.current = expenseSettings.expenseNumberStart;
    }
  }, [generateNextExpenseNumber, expenseSettings, expenses, isEditMode]);

  // Sync expenseNumberOnly when expenseNumber changes (for edit mode)
  useEffect(() => {
    if (expenseNumber) {
      const prefix = expenseSettings?.expenseNumberPrefix || "EXP";
      const numberPart = extractNumberPart(expenseNumber, prefix);
      if (numberPart !== expenseNumberOnly) {
        setExpenseNumberOnly(numberPart);
      }
    } else if (!expenseNumber && expenseNumberOnly) {
      // Clear number part if expense number is cleared
      setExpenseNumberOnly("");
    }
  }, [expenseNumber, expenseSettings?.expenseNumberPrefix]); // Note: intentionally not including expenseNumberOnly to avoid loops

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

  // Track if expense data has been loaded to prevent re-loading
  const expenseDataLoadedRef = useRef<number | null>(null);

  // Fetch expense data for edit mode
  const { data: expenseData, isLoading: isLoadingExpense, refetch: refetchExpense } = useQuery({
    queryKey: ["/api/expenses", expenseId],
    enabled: isEditMode && !!expenseId && !!tenant?.id,
    queryFn: async () => {
      console.log("Fetching expense data for ID:", expenseId);
      const token = auth.getToken();
      // Add timestamp to URL to prevent 304 cached responses
      const url = `/api/expenses/${expenseId}?t=${Date.now()}`;
      const response = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store', // Bypass browser cache completely
      });
      
      // Handle 304 Not Modified - force a fresh request (fallback)
      if (response.status === 304) {
        console.warn("Received 304, forcing fresh fetch with new timestamp...");
        // Retry with a new timestamp to bypass cache
        const freshUrl = `/api/expenses/${expenseId}?t=${Date.now()}`;
        const freshResponse = await fetch(freshUrl, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          cache: 'no-store',
        });
        if (!freshResponse.ok) {
          console.error("Failed to fetch expense after 304 retry:", freshResponse.status, freshResponse.statusText);
          throw new Error("Failed to fetch expense");
        }
        const data = await freshResponse.json();
        const expense = data.data || data;
        console.log("Expense data fetched (raw, after 304 retry):", expense);
        return expense;
      }
      
      if (!response.ok) {
        console.error("Failed to fetch expense:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Failed to fetch expense");
      }
      const data = await response.json();
      console.log("Expense data fetched (raw):", data);
      
      // Handle different response formats
      // If response has a 'data' property, use it; otherwise use the response directly
      const expense = data.data || data;
      console.log("Expense data (processed):", expense);
      return expense;
    },
    // Force refetch every time to ensure fresh data when editing
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale, so it refetches
    cacheTime: 0, // Don't cache, always fetch fresh data
    retry: 2, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
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

  // Reset the loaded flag and force refetch when expenseId changes
  useEffect(() => {
    if (expenseId && expenseDataLoadedRef.current !== expenseId) {
      expenseDataLoadedRef.current = null;
      // Force refetch when expenseId changes
      if (isEditMode && refetchExpense) {
        console.log("Expense ID changed, forcing refetch for:", expenseId);
        refetchExpense();
      }
    }
  }, [expenseId, isEditMode, refetchExpense]);

  // Load expense data when in edit mode
  useEffect(() => {
    // Validate that we have valid expense data
    const hasValidData = expenseData && 
                        typeof expenseData === 'object' && 
                        Object.keys(expenseData).length > 0 &&
                        (expenseData.id || expenseData.title || expenseData.amount !== undefined);
    
    // Check if expenseItems are empty or don't have the expected data
    const itemsEmpty = expenseItems.length === 0 || 
                      (expenseItems.length === 1 && !expenseItems[0].title && expenseData?.title);
    
    // Only load if we have valid data, not loading, and either:
    // 1. Haven't loaded this expense yet (ref doesn't match), OR
    // 2. Items are empty even though we have data (fallback case)
    const shouldLoad = isEditMode && 
                      hasValidData && 
                      !isLoadingExpense && 
                      (expenseDataLoadedRef.current !== expenseId || itemsEmpty);
    
    console.log("🔍 Data loading check:", {
      isEditMode,
      hasValidData,
      isLoadingExpense,
      currentRef: expenseDataLoadedRef.current,
      expenseId,
      itemsEmpty,
      shouldLoad,
      expenseDataKeys: expenseData ? Object.keys(expenseData).length : 0,
      expenseDataTitle: expenseData?.title,
      expenseItemsLength: expenseItems.length,
      firstItemTitle: expenseItems[0]?.title,
    });
    
    if (shouldLoad) {
      const expense = expenseData;
      console.log("🔄 Loading expense data into form:", expense);
      console.log("🔄 Expense ID:", expenseId);
      console.log("🔄 Expense keys:", Object.keys(expense));
      console.log("Expense keys:", Object.keys(expense));
      console.log("Expense amount:", expense.amount);
      console.log("Expense quantity:", expense.quantity);
      console.log("Expense amount_paid:", expense.amount_paid);
      console.log("Expense amount_due:", expense.amount_due);
      
      // Set basic expense fields
      setExpenseDate(expense.expense_date || expense.expenseDate || new Date().toISOString().split("T")[0]);
      setCurrency(expense.currency || "USD");
      setExpenseTitle(expense.title || "");
      // Load invoice_id if available
      setSelectedInvoiceId(expense.invoice_id?.toString() || expense.invoiceId?.toString() || "");
      
      // Clean notes - remove HTML tags if present
      let notesText = expense.notes || expense.description || "";
      if (notesText && typeof notesText === "string") {
        notesText = notesText.replace(/<[^>]*>/g, "").trim();
      }
      setNotesContent(notesText);
      
      // Set expense number if available (might be in different fields)
      if (expense.expense_number || expense.expenseNumber || expense.reference_number || expense.referenceNumber) {
        const expNum = expense.expense_number || expense.expenseNumber || expense.reference_number || expense.referenceNumber;
        setExpenseNumber(expNum);
        // Extract number part for the input field
        const prefix = expenseSettings?.expenseNumberPrefix || "EXP";
        const numberPart = extractNumberPart(expNum, prefix);
        setExpenseNumberOnly(numberPart);
        console.log("Setting expense number:", expNum, "Number part:", numberPart);
      } else {
        console.log("No expense number found in expense data");
      }
      
      // Find tax rate ID from tax rate value - wait for gstRates to be available
      let taxRateId = "";
      if (expense.tax_rate && gstRates && gstRates.length > 0) {
        const taxRateValue = parseFloat(expense.tax_rate?.toString() || "0");
        const matchingRate = gstRates.find((rate: any) => {
          const rateValue = parseFloat(rate.rate?.toString() || rate.ratePercentage?.toString() || "0");
          return Math.abs(rateValue - taxRateValue) < 0.01; // Allow small floating point differences
        });
        if (matchingRate) {
          taxRateId = matchingRate.id?.toString() || "";
          console.log("Found matching tax rate:", matchingRate, "for tax_rate:", taxRateValue);
        } else {
          console.log("No matching tax rate found for tax_rate:", taxRateValue, "Available rates:", gstRates);
        }
      } else {
        console.log("Tax rate lookup skipped - tax_rate:", expense.tax_rate, "gstRates available:", !!gstRates, "gstRates length:", gstRates?.length);
      }
      
      // Map expense status to payment status
      // API status: "pending", "approved", "rejected", "paid"
      // Form payment status: "paid", "credit", "due"
      let paymentStatus = "due"; // default
      if (expense.status === "paid") {
        paymentStatus = "paid";
      } else if (expense.status === "approved") {
        paymentStatus = "credit";
      } else if (expense.status === "pending" || expense.status === "rejected") {
        paymentStatus = "due";
      }
      
      // Calculate paid and due amounts
      // First, try to use amount_paid and amount_due from the database if available
      // Otherwise, calculate based on status and total
      const totalAmount = parseFloat(expense.amount || "0") + parseFloat(expense.tax_amount || expense.taxAmount || "0");
      let amountPaid = "";
      let amountDue = "";
      
      // Check if amount_paid and amount_due are already in the database
      const dbAmountPaid = expense.amount_paid !== undefined && expense.amount_paid !== null 
        ? parseFloat(expense.amount_paid.toString()) 
        : null;
      const dbAmountDue = expense.amount_due !== undefined && expense.amount_due !== null 
        ? parseFloat(expense.amount_due.toString()) 
        : null;
      
      if (dbAmountPaid !== null || dbAmountDue !== null) {
        // Use database values if available
        amountPaid = (dbAmountPaid !== null ? dbAmountPaid : 0).toFixed(2);
        amountDue = (dbAmountDue !== null ? dbAmountDue : 0).toFixed(2);
      } else {
        // Calculate based on status if database values not available
        if (paymentStatus === "paid") {
          amountPaid = totalAmount.toFixed(2);
          amountDue = "0.00";
        } else if (paymentStatus === "due") {
          amountPaid = "0.00";
          amountDue = totalAmount.toFixed(2);
        } else if (paymentStatus === "credit") {
          // For credit, we might have partial payment
          amountPaid = expense.amount_paid?.toString() || expense.amountPaid?.toString() || "0.00";
          const paid = parseFloat(amountPaid || "0");
          amountDue = (totalAmount - paid).toFixed(2);
        }
      }
      
      // Format tax amount to ensure it shows properly
      const taxAmount = parseFloat(expense.tax_amount?.toString() || expense.taxAmount?.toString() || "0");
      
      // Set expense items from line items or fallback to expense data (for backward compatibility)
      let itemsToLoad: any[] = [];
      
      if (expense.lineItems && Array.isArray(expense.lineItems) && expense.lineItems.length > 0) {
        // New format: use line items
        itemsToLoad = expense.lineItems.map((item: any) => {
          const itemQuantity = item.quantity ? parseFloat(item.quantity.toString()) : 1;
          const itemTotalAmount = parseFloat(item.total_amount?.toString() || item.totalAmount?.toString() || item.amount?.toString() || "0");
          const itemUnitAmount = itemQuantity > 0 ? itemTotalAmount / itemQuantity : itemTotalAmount;
          const itemTaxAmount = parseFloat(item.tax_amount?.toString() || item.taxAmount?.toString() || "0");
          
          // Find tax rate ID from tax rate value
          let itemTaxRateId = "";
          if (item.tax_rate_id || item.taxRateId) {
            itemTaxRateId = (item.tax_rate_id || item.taxRateId).toString();
          } else if (item.tax_rate && gstRates && gstRates.length > 0) {
            const taxRateValue = parseFloat(item.tax_rate?.toString() || "0");
            const matchingRate = gstRates.find((rate: any) => {
              const rateValue = parseFloat(rate.rate?.toString() || rate.ratePercentage?.toString() || "0");
              return Math.abs(rateValue - taxRateValue) < 0.01;
            });
            if (matchingRate) {
              itemTaxRateId = matchingRate.id?.toString() || "";
            }
          }
          
          // Map payment status
          let itemPaymentStatus = "paid";
          if (item.payment_status) {
            itemPaymentStatus = item.payment_status;
          } else if (item.paymentStatus) {
            itemPaymentStatus = item.paymentStatus;
          }
          
          // Get paid and due amounts
          const itemAmountPaid = parseFloat(item.amount_paid?.toString() || item.amountPaid?.toString() || "0");
          const itemAmountDue = parseFloat(item.amount_due?.toString() || item.amountDue?.toString() || "0");
          
          // Clean notes
          let itemNotes = item.notes || item.description || "";
          if (itemNotes && typeof itemNotes === "string") {
            itemNotes = itemNotes.replace(/<[^>]*>/g, "").trim();
          }
          
          return {
            category: item.category || "",
            title: item.title || "",
            vendorId: item.vendor_id?.toString() || item.vendorId?.toString() || "",
            leadTypeId: item.lead_type_id?.toString() || item.leadTypeId?.toString() || "",
            quantity: itemQuantity.toString(),
            amount: itemUnitAmount.toString(),
            taxRateId: itemTaxRateId,
            taxAmount: itemTaxAmount.toFixed(2),
            totalAmount: itemTotalAmount,
            paymentMethod: item.payment_method || item.paymentMethod || "credit_card",
            paymentStatus: itemPaymentStatus,
            amountPaid: itemAmountPaid.toFixed(2),
            amountDue: itemAmountDue.toFixed(2),
            notes: itemNotes,
            billFile: null as File | null,
            billUrl: item.receipt_url || item.receiptUrl || "",
          };
        });
      } else {
        // Old format: convert expense to single line item (backward compatibility)
        const expenseQuantity = expense.quantity ? parseFloat(expense.quantity.toString()) : 1;
        const expenseTotalAmount = parseFloat(expense.amount || "0");
        const unitAmount = expenseQuantity > 0 ? expenseTotalAmount / expenseQuantity : expenseTotalAmount;
        
        let cleanNotes = expense.notes || expense.description || "";
        if (cleanNotes && typeof cleanNotes === "string") {
          cleanNotes = cleanNotes.replace(/<[^>]*>/g, "").trim();
        }
        
        itemsToLoad = [{
          category: expense.category || "",
          title: expense.title || "",
          vendorId: expense.vendor_id?.toString() || expense.vendorId?.toString() || "",
          leadTypeId: expense.lead_type_id?.toString() || expense.leadTypeId?.toString() || "",
          quantity: expenseQuantity.toString(),
          amount: unitAmount.toString(),
          taxRateId: taxRateId,
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount,
          paymentMethod: expense.payment_method || expense.paymentMethod || "credit_card",
          paymentStatus: paymentStatus,
          amountPaid: amountPaid,
          amountDue: amountDue,
          notes: cleanNotes,
          billFile: null as File | null,
          billUrl: expense.receipt_url || expense.receiptUrl || "",
        }];
      }
      
      console.log("Processed expense items:", itemsToLoad);
      console.log("Original expense data:", expense);
      
      setExpenseItems(itemsToLoad);
      expenseDataLoadedRef.current = expenseId; // Mark as loaded AFTER setting all data
      console.log("✅ Expense items state updated successfully");
      console.log("✅ Expense items count:", itemsToLoad.length);
    } else {
      const skipReason = {
        isEditMode,
        hasExpenseData: !!expenseData,
        isLoadingExpense,
        expenseId,
        tenantId: tenant?.id,
        alreadyLoaded: expenseDataLoadedRef.current === expenseId,
        expenseDataType: typeof expenseData,
        expenseDataKeys: expenseData ? Object.keys(expenseData).length : 0,
      };
      console.log("⏭️ Skipping expense data load:", skipReason);
      
      // If we're in edit mode but data isn't loading and we don't have data, try to refetch
      if (isEditMode && !isLoadingExpense && !expenseData && expenseId && expenseDataLoadedRef.current !== expenseId) {
        console.log("🔄 No data available, attempting to refetch...");
        setTimeout(() => {
          if (refetchExpense) {
            refetchExpense();
          }
        }, 500);
      }
      
      // If we have data but it's already loaded, check if expenseItems are empty
      // This can happen if the data was loaded but items weren't set properly
      if (isEditMode && expenseData && !isLoadingExpense && expenseDataLoadedRef.current === expenseId) {
        console.log("ℹ️ Data already loaded for this expense ID");
        // Check if expenseItems are empty or don't match the data
        if (expenseItems.length === 0 || (expenseItems.length === 1 && !expenseItems[0].title && expenseData.title)) {
          console.log("⚠️ Expense items are empty but data exists, forcing reload...");
          expenseDataLoadedRef.current = null; // Reset to allow reload
          // Force reload by clearing ref and triggering useEffect again
          setTimeout(() => {
            if (refetchExpense) {
              refetchExpense();
            }
          }, 100);
        }
      }
    }
  }, [isEditMode, expenseData, isLoadingExpense, gstRates, tenant?.id, expenseId, refetchExpense, expenseItems]);

  // Fallback: If we have expense data but items are empty, force reload
  useEffect(() => {
    if (isEditMode && expenseData && !isLoadingExpense && expenseId) {
      const hasData = expenseData.title || expenseData.amount;
      const itemsEmpty = expenseItems.length === 0 || 
                        (expenseItems.length === 1 && !expenseItems[0].title && !expenseItems[0].amount);
      
      if (hasData && itemsEmpty && expenseDataLoadedRef.current !== expenseId) {
        console.log("🔄 Fallback: Data exists but items are empty, forcing load...");
        // Reset ref and trigger data load
        expenseDataLoadedRef.current = null;
        // The main useEffect should pick this up on next render
      }
    }
  }, [isEditMode, expenseData, isLoadingExpense, expenseId, expenseItems]);

  // Ensure invoice ID is set after invoices are loaded
  useEffect(() => {
    if (isEditMode && expenseData && invoices.length > 0) {
      const invoiceIdFromExpense = (expenseData as any).invoice_id?.toString() || (expenseData as any).invoiceId?.toString();
      if (invoiceIdFromExpense && selectedInvoiceId !== invoiceIdFromExpense) {
        console.log("🔄 Setting invoice ID after invoices loaded:", invoiceIdFromExpense);
        setSelectedInvoiceId(invoiceIdFromExpense);
      }
    }
  }, [isEditMode, expenseData, invoices, selectedInvoiceId]);

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
    mutationFn: async (data: any) => {
      const token = auth.getToken();
      if (isEditMode && expenseId) {
        // Update existing expense
        if (data.isFormData && data.formData) {
          // Use FormData approach for file uploads
          const response = await fetch(`/api/expenses/${expenseId}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: data.formData,
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Failed to update expense" }));
            throw new Error(errorData.message || "Failed to update expense");
          }
          return await response.json();
        } else {
          // Use JSON approach
          const response = await fetch(`/api/expenses/${expenseId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error("Failed to update expense");
          return await response.json();
        }
      } else {
        // Create new expense
        if (data.isFormData && data.formData) {
          // Use FormData approach for file uploads
          const response = await fetch("/api/expenses", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: data.formData,
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Failed to create expense" }));
            throw new Error(errorData.message || "Failed to create expense");
          }
          const result = await response.json();
          return result;
        } else {
          // Use JSON approach
          const response = await fetch("/api/expenses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Failed to create expense" }));
            throw new Error(errorData.message || "Failed to create expense");
          }
          return await response.json();
        }
      }
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      const expenseCount = Array.isArray(result) ? result.length : 1;
      toast({
        title: "Success",
        description: isEditMode 
          ? "Expense updated successfully"
          : `${expenseCount} expense(s) created successfully`,
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
        quantity: "1",
        amount: "",
        taxRateId: "",
        taxAmount: "0",
        totalAmount: 0,
        paymentMethod: "credit_card",
        paymentStatus: "paid",
        amountPaid: "",
        amountDue: "",
        notes: "",
        billFile: null,
        billUrl: "",
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

    // Calculate totals if amount, quantity, or tax rate changes
    if (field === "amount" || field === "quantity" || field === "taxRateId") {
      const quantity = parseFloat(updatedItems[index].quantity || "1");
      const unitAmount = parseFloat(updatedItems[index].amount || "0");
      const totalAmountBeforeTax = unitAmount * quantity;
      let taxAmount = 0;
      let totalAmount = totalAmountBeforeTax;
      
      if (updatedItems[index].taxRateId) {
        const selectedRate = gstRates.find(
          (rate: any) => rate.id?.toString() === updatedItems[index].taxRateId
        );
        if (selectedRate) {
          // Use ratePercentage (or rate_percentage) field from the API response
          const ratePercentage = parseFloat(
            selectedRate.ratePercentage?.toString() || 
            selectedRate.rate_percentage?.toString() || 
            selectedRate.rate?.toString() || 
            "0"
          );
          
          if (isTaxInclusive) {
            // When tax is inclusive, tax is already in the price
            // Calculate: amount = subtotal + tax, so tax = amount - subtotal
            // Or: subtotal = amount / (1 + rate/100), tax = amount - subtotal
            const subtotal = totalAmountBeforeTax / (1 + ratePercentage / 100);
            taxAmount = totalAmountBeforeTax - subtotal;
            totalAmount = totalAmountBeforeTax; // Total is the amount itself when inclusive
          } else {
            // When tax is exclusive, calculate tax and add it
            taxAmount = (totalAmountBeforeTax * ratePercentage) / 100;
            totalAmount = totalAmountBeforeTax + taxAmount;
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
        const quantity = parseFloat(item.quantity || "1");
        const unitAmount = parseFloat(item.amount || "0");
        const amount = unitAmount * quantity;
        let taxAmount = 0;
        let totalAmount = amount;
        
        const selectedRate = gstRates.find(
          (rate: any) => rate.id?.toString() === item.taxRateId
        );
        if (selectedRate) {
          // Use ratePercentage (or rate_percentage) field from the API response
          const ratePercentage = parseFloat(
            selectedRate.ratePercentage?.toString() || 
            selectedRate.rate_percentage?.toString() || 
            selectedRate.rate?.toString() || 
            "0"
          );
          
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

  // Get invoice options for dropdown
  const getInvoiceOptions = (): AutocompleteOption[] => {
    const invoiceOptions = invoices.map((invoice: any) => {
      const invoiceNumber = invoice.invoiceNumber || invoice.invoice_number || `INV-${invoice.id}`;
      const customerName = invoice.customerName || invoice.customer?.name || "Unknown Customer";
      const totalAmount = parseFloat(invoice.totalAmount || invoice.total_amount || "0");
      const currency = invoice.currency || "USD";
      return {
        value: invoice.id.toString(),
        label: `${invoiceNumber} - ${customerName} (${currency} ${totalAmount.toFixed(2)})`,
      };
    });

    return [
      { value: "", label: "No Invoice (Optional)" },
      ...invoiceOptions,
    ];
  };

  // Get category options
  const getCategoryOptions = (): AutocompleteOption[] => {
    return EXPENSE_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: `${cat.icon} ${cat.label}`,
    }));
  };

  // Calculate grid template columns dynamically (matching invoice-create design)
  const gridTemplate = useMemo(() => {
    const columns = [
      '30px', // # column - smaller (fixed)
      ...(expenseSettings?.showCategory !== false ? ['minmax(180px, 1.5fr)'] : []), // Category - reduced width (flexible, min 180px)
      'minmax(180px, 1.5fr)', // Title - reduced width (flexible, min 180px)
      ...(expenseSettings?.showVendor !== false ? ['minmax(180px, 1.5fr)'] : []), // Vendor - reduced width (flexible, min 180px)
      ...(expenseSettings?.showLeadType !== false ? ['minmax(180px, 1.5fr)'] : []), // Lead Type - reduced width (flexible, min 180px)
      'minmax(60px, 1fr)', // Quantity - small (flexible, min 60px)
      'minmax(130px, 1fr)', // Amount - small (flexible, min 130px)
      ...(expenseSettings?.showTax !== false ? ['minmax(100px, 1fr)'] : []), // Tax - small (flexible, min 100px)
      'minmax(100px, 1fr)', // Total - small (flexible, min 100px)
      ...(expenseSettings?.showPaymentStatus !== false ? ['minmax(100px, 1fr)'] : []), // Status - small (flexible, min 100px)
      ...(expenseSettings?.showPaymentStatus !== false ? ['minmax(100px, 1fr)'] : []), // Paid - small (flexible, min 100px)
      ...(expenseSettings?.showPaymentStatus !== false ? ['minmax(100px, 1fr)'] : []), // Due - small (flexible, min 100px)
      ...(expenseSettings?.showPaymentMethod !== false ? ['minmax(100px, 1fr)'] : []), // Payment - small (flexible, min 100px)
      ...(expenseSettings?.showBills !== false ? ['minmax(120px, 1fr)'] : []), // Bills - small (flexible, min 120px)
      '50px', // Delete button - small (fixed)
    ];
    return columns.join(' ');
  }, [expenseSettings?.showCategory, expenseSettings?.showVendor, expenseSettings?.showLeadType, expenseSettings?.showTax, expenseSettings?.showPaymentStatus, expenseSettings?.showPaymentMethod, expenseSettings?.showBills]);

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
      return expenseItems.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity || "1");
        const unitAmount = parseFloat(item.amount || "0");
        return sum + (unitAmount * quantity);
      }, 0);
    } else {
      // When tax is exclusive, subtotal = sum of amounts without tax
      return expenseItems.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity || "1");
        const unitAmount = parseFloat(item.amount || "0");
        return sum + (unitAmount * quantity);
      }, 0);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Combine prefix and number for expense header
    const prefix = expenseSettings?.expenseNumberPrefix || "EXP";
    const fullExpenseNumber = expenseNumberOnly ? `${prefix}${expenseNumberOnly}` : expenseNumber;

    // Prepare expense header
    const expenseHeader = {
      expenseNumber: fullExpenseNumber || null,
      expenseDate: expenseDate,
      currency: expenseSettings?.defaultCurrency || currency,
      notes: notesContent || null,
      title: expenseTitle || "Expense", // Use expense title or default
      category: "other", // Default category
      invoiceId: selectedInvoiceId && selectedInvoiceId !== "" ? parseInt(selectedInvoiceId) : null,
    };

    // Prepare line items
    const lineItems = expenseItems.map((item) => {
      const quantity = parseFloat(item.quantity || "1");
      const unitAmount = parseFloat(item.amount || "0");
      const totalAmount = unitAmount * quantity;
      const taxAmount = parseFloat(item.taxAmount || "0");
      const taxRate = item.taxRateId
        ? (() => {
            const selectedRate = gstRates.find(
              (rate: any) => rate.id?.toString() === item.taxRateId
            );
            if (selectedRate) {
              return parseFloat(
                selectedRate.ratePercentage?.toString() || 
                selectedRate.rate_percentage?.toString() || 
                selectedRate.rate?.toString() || 
                "0"
              );
            }
            return 0;
          })()
        : 0;

      return {
        category: item.category || "",
        title: item.title || "",
        description: item.notes || null,
        quantity: quantity,
        amount: unitAmount,
        taxRateId: item.taxRateId && item.taxRateId !== "none" ? parseInt(item.taxRateId) : null,
        taxAmount: taxAmount,
        taxRate: taxRate,
        totalAmount: totalAmount,
        vendorId: item.vendorId && item.vendorId !== "none" ? parseInt(item.vendorId) : null,
        leadTypeId: item.leadTypeId && item.leadTypeId !== "none" ? parseInt(item.leadTypeId) : null,
        paymentMethod: item.paymentMethod || "credit_card",
        paymentStatus: item.paymentStatus || "paid",
        amountPaid: parseFloat(item.amountPaid || "0"),
        amountDue: parseFloat(item.amountDue || "0"),
        receiptUrl: item.billUrl || null,
        notes: item.notes || null,
      };
    });

    // Check if there are any bill files to upload
    const hasBillFiles = expenseItems.some(item => item.billFile);

    if (hasBillFiles) {
      // Use FormData approach for file uploads
      const formData = new FormData();
      
      formData.append("expenseHeader", JSON.stringify(expenseHeader));
      formData.append("lineItems", JSON.stringify(lineItems));
      
      // Add bill files with index-based field names
      expenseItems.forEach((item, index) => {
        if (item.billFile) {
          formData.append(`billFiles[${index}]`, item.billFile);
        }
      });
      
      createExpensesMutation.mutate({ formData, isFormData: true });
    } else {
      // No files, use JSON approach
      createExpensesMutation.mutate({
        expenseHeader,
        lineItems,
      });
    }
  };

  return (
    <Layout initialSidebarCollapsed={true}>
      <div className="p-3 sm:p-4 md:p-6 mx-auto max-w-full overflow-x-hidden">
        <div className="bg-white rounded-2xl shadow-sm relative max-w-full overflow-x-hidden">
          {/* Loading Overlay - only show when actively loading */}
          {isEditMode && isLoadingExpense && (
            <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Loading expense data...
                </p>
              </div>
            </div>
          )}
          
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

          <div className="p-6 max-w-full">
            <form onSubmit={handleSubmit} className="max-w-full">
              <Card className="max-w-full">
            <CardContent className="p-6 space-y-6 max-w-full">
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
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium">
                      {expenseSettings?.expenseNumberPrefix || "EXP"}
                    </span>
                    <Input
                      id="expenseNumber"
                      value={expenseNumberOnly}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExpenseNumberOnly(val);
                        const prefix = expenseSettings?.expenseNumberPrefix || "EXP";
                        setExpenseNumber(val ? `${prefix}${val}` : "");
                      }}
                      placeholder="001"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Expense Title and Date Row */}
              <div className="flex items-end gap-4">
                <div className="w-auto md:w-48">
                  <Label htmlFor="expenseTitle">Expense Title</Label>
                  <Input
                    id="expenseTitle"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    placeholder="Enter expense title"
                    className="w-full"
                  />
                </div>
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
                <div className="w-auto md:w-80">
                  <Label htmlFor="selectedInvoice">Invoice (Optional)</Label>
                  <AutocompleteInput
                    id="selectedInvoice"
                    suggestions={getInvoiceOptions()}
                    value={selectedInvoiceId}
                    onValueChange={(value) => setSelectedInvoiceId(value)}
                    placeholder="Search invoice..."
                    emptyText="No invoices found"
                    allowCustomValue={false}
                  />
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
              <div className="border rounded-lg overflow-x-auto w-full">
                <div className="min-w-[2200px]">
                  {/* Table Header */}
                  <div 
                    className="top-0 z-[100] grid gap-2 border-b p-3 font-medium text-sm bg-gray-50 dark:bg-gray-800"
                    style={{ 
                      gridTemplateColumns: gridTemplate,
                      backgroundColor: 'rgb(249, 250, 251)',
                      // position: 'sticky',
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
                    <div className="flex items-center">Quantity *</div>
                    <div className="flex items-center">Amount ({currencySymbol}) *</div>
                    {expenseSettings?.showTax !== false && <div className="flex items-center">Tax ({currencySymbol})</div>}
                    <div className="flex items-center">Total ({currencySymbol})</div>
                    {expenseSettings?.showPaymentStatus !== false && <div className="flex items-center">Status *</div>}
                    {expenseSettings?.showPaymentStatus !== false && <div className="flex items-center">Paid ({currencySymbol})</div>}
                    {expenseSettings?.showPaymentStatus !== false && <div className="flex items-center">Due ({currencySymbol})</div>}
                    {expenseSettings?.showPaymentMethod !== false && <div className="flex items-center">Payment</div>}
                    {expenseSettings?.showBills !== false && <div className="flex items-center">Bills</div>}
                    <div className="flex items-center"></div>
                  </div>

                  {/* Table Body */}
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
                            data-testid={`input-quantity-${index}`}
                            value={item.quantity}
                            onChange={(e) =>
                              updateExpenseItem(index, "quantity", e.target.value)
                            }
                            onKeyPress={handleNumericKeyPress}
                            placeholder="1"
                          />
                        </div>

                        <div className="flex items-center">
                          <Input
                            data-testid={`input-amount-${index}`}
                            value={item.amount}
                            onChange={(e) =>
                              updateExpenseItem(index, "amount", e.target.value)
                            }
                            onKeyPress={handleNumericKeyPress}
                            placeholder="0"
                          />
                        </div>

                        {expenseSettings?.showTax !== false && (
                          <div className="flex items-center">
                            <Select
                              value={item.taxRateId || "none"}
                              onValueChange={(value) =>
                                updateExpenseItem(index, "taxRateId", value === "none" ? "" : value)
                              }
                              disabled={!selectedTaxSettingId || selectedTaxSettingId === "none" || gstRates.length === 0}
                            >
                              <SelectTrigger data-testid={`select-tax-rate-${index}`}>
                                <SelectValue placeholder={
                                  !selectedTaxSettingId || selectedTaxSettingId === "none" 
                                    ? "Select tax setting first" 
                                    : gstRates.length === 0 
                                    ? "No rates available"
                                    : "Select tax rate"
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Tax</SelectItem>
                                {gstRates
                                  .filter((rate: any) => rate.isActive)
                                  .map((rate: any) => (
                                    <SelectItem key={rate.id} value={rate.id.toString()}>
                                      {rate.rateName} ({rate.ratePercentage}%)
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {item.taxAmount && parseFloat(item.taxAmount) > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Tax: {currencySymbol}{parseFloat(item.taxAmount).toFixed(2)}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center">
                          <Input
                            data-testid={`input-total-amount-${index}`}
                            value={item.totalAmount.toFixed(2)}
                            readOnly
                            className="bg-transparent"
                          />
                        </div>

                        {expenseSettings?.showPaymentStatus !== false && (
                          <div className="flex items-center">
                            <Select
                              value={item.paymentStatus || "paid"}
                              onValueChange={(value) => {
                                // Update all fields in a single state update to avoid stale state issues
                                const updatedItems = [...expenseItems];
                                const currentItem = updatedItems[index];
                                
                                // Update payment status
                                updatedItems[index] = {
                                  ...currentItem,
                                  paymentStatus: value,
                                };
                                
                                // Auto-fill paid/due amounts based on status
                                if (value === "paid") {
                                  updatedItems[index].amountPaid = currentItem.totalAmount.toFixed(2);
                                  updatedItems[index].amountDue = "0";
                                } else if (value === "due") {
                                  updatedItems[index].amountPaid = "0";
                                  updatedItems[index].amountDue = currentItem.totalAmount.toFixed(2);
                                } else if (value === "credit") {
                                  // For credit, typically no amount is paid or due initially
                                  updatedItems[index].amountPaid = "0";
                                  updatedItems[index].amountDue = "0";
                                }
                                
                                setExpenseItems(updatedItems);
                              }}
                            >
                              <SelectTrigger data-testid={`select-payment-status-${index}`}>
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
                              value={item.amountPaid}
                              onChange={(e) => {
                                const paidValue = e.target.value;
                                const paidAmount = parseFloat(paidValue) || 0;
                                const totalAmount = item.totalAmount || 0;
                                const dueAmount = Math.max(0, totalAmount - paidAmount);
                                
                                // Update both paid and due amounts in a single state update
                                const updatedItems = [...expenseItems];
                                updatedItems[index] = {
                                  ...updatedItems[index],
                                  amountPaid: paidValue,
                                  amountDue: dueAmount.toFixed(2),
                                };
                                setExpenseItems(updatedItems);
                              }}
                              onKeyPress={handleNumericKeyPress}
                              placeholder="0"
                            />
                          </div>
                        )}

                        {expenseSettings?.showPaymentStatus !== false && (
                          <div className="flex items-center">
                            <Input
                              data-testid={`input-amount-due-${index}`}
                              value={item.amountDue}
                              onChange={(e) =>
                                updateExpenseItem(index, "amountDue", e.target.value)
                              }
                              onKeyPress={handleNumericKeyPress}
                              placeholder="0"
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
                              <SelectTrigger data-testid={`select-payment-method-${index}`}>
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

                        {expenseSettings?.showBills !== false && (
                          <div className="flex items-center">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  updateExpenseItem(index, "billFile", file);
                                }
                              }}
                              className="hidden"
                              id={`bill-upload-${index}`}
                            />
                            <label
                              htmlFor={`bill-upload-${index}`}
                              className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Receipt className="h-3 w-3 mr-1.5" />
                              {item.billFile ? item.billFile.name.substring(0, 15) + (item.billFile.name.length > 15 ? '...' : '') : item.billUrl ? 'View Bill' : 'Upload'}
                            </label>
                            {item.billFile && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => updateExpenseItem(index, "billFile", null)}
                                className="ml-1 h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                            {item.billUrl && !item.billFile && (
                              <a
                                href={item.billUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-xs text-blue-600 hover:text-blue-800"
                              >
                                View
                              </a>
                            )}
                          </div>
                        )}

                      <div className="flex items-center justify-center">
                        {expenseItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExpenseItem(index)}
                            data-testid={`button-remove-expense-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-gray-900 dark:text-white" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addExpenseItem}
                  data-testid="button-add-expense-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense Item
                </Button>
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
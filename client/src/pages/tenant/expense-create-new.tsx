import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Receipt,
  Bell,
  HelpCircle,
  Settings,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
import { ExpenseSettingsPanel } from "@/components/expense-settings-panel";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [location, navigate] = useLocation();
  const [match, params] = useRoute("/expenses/create/:id?");
  
  // Extract expense ID from route params or URL path
  const expenseId = useMemo(() => {
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
    },
  ]);

  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expenseNumber, setExpenseNumber] = useState("");
  const [currency, setCurrency] = useState("USD");

  // Tax states
  const [selectedTaxSettingId, setSelectedTaxSettingId] = useState("none");
  const [selectedTaxRateId, setSelectedTaxRateId] = useState("");
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);

  // Slide panel states
  const [isVendorPanelOpen, setIsVendorPanelOpen] = useState(false);
  const [isLeadTypePanelOpen, setIsLeadTypePanelOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Notes state for rich text editor
  const [notesContent, setNotesContent] = useState("");

  // Fetch expense settings
  const { data: expenseSettings = {
    expenseNumberStart: 1,
    defaultCurrency: "USD",
    defaultGstSettingId: null,
    showTax: true,
    showVendor: true,
    showLeadType: true,
    showCategory: true,
    showPaymentMethod: true,
    showPaymentStatus: true,
    showNotes: true,
  }, refetch: refetchExpenseSettings } = useQuery({
    queryKey: ["/api/expense-settings", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const response = await fetch(`/api/expense-settings/${tenant?.id}`);
      if (!response.ok) throw new Error("Failed to fetch settings");
      const result = await response.json();
      return result.data;
    },
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
      const response = await fetch(`/api/expenses?limit=10000&page=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : (result.data || result.expenses || []);
    },
  });

  // Refetch expense settings when page loads
  useEffect(() => {
    if (tenant?.id) {
      refetchExpenseSettings();
    }
  }, [tenant?.id, refetchExpenseSettings]);

  // Auto-select tax setting from Expense settings
  useEffect(() => {
    if (expenseSettings?.defaultGstSettingId) {
      setSelectedTaxSettingId(expenseSettings.defaultGstSettingId.toString());
    }
  }, [expenseSettings?.defaultGstSettingId]);

  // Function to generate next expense number
  const generateNextExpenseNumber = useMemo(() => {
    const startNumber = expenseSettings?.expenseNumberStart || 1;
    
    if (!expenses || expenses.length === 0) {
      // No existing expenses, use starting number from settings
      return `EXP-${String(startNumber).padStart(3, '0')}`;
    }

    // Extract numbers from existing expense numbers
    const expenseNumbers = expenses
      .map((exp: any) => {
        const expNum = exp.expenseNumber || exp.expense_number || exp.referenceNumber || exp.reference_number || "";
        if (!expNum || expNum === "") {
          return 0;
        }
        // Extract number from formats like EXP-001, EXP-1, EXP001, etc.
        const match = expNum.toString().match(/(\d+)/);
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

  // Update currency when settings load
  useEffect(() => {
    if (expenseSettings?.defaultCurrency) {
      setCurrency(expenseSettings.defaultCurrency);
    }
  }, [expenseSettings?.defaultCurrency]);

  // Fetch vendors
  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: [`/api/vendors`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch("/api/vendors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.vendors || [];
    },
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

  // Fetch GST settings
  const { data: gstSettings = [] } = useQuery<any[]>({
    queryKey: ["/api/gst-settings"],
    enabled: !!tenant?.id,
  });

  // Fetch GST rates for selected setting
  const { data: gstRates = [] } = useQuery<any[]>({
    queryKey: ["/api/gst-rates", selectedTaxSettingId],
    enabled:
      !!tenant?.id && !!selectedTaxSettingId && selectedTaxSettingId !== "none",
  });

  // Track if Expense data has been loaded to prevent re-loading
  const expenseDataLoadedRef = useRef<number | null>(null);

  // Fetch Expense data when in edit mode
  const { data: existingExpense, isLoading: isLoadingExpense, refetch: refetchExpense } = useQuery({
    queryKey: [`/api/expenses/${expenseId}`],
    enabled: isEditMode && !!expenseId && !!tenant?.id,
    queryFn: async () => {
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
          console.error("Failed to fetch Expense after 304 retry:", freshResponse.status, freshResponse.statusText);
          throw new Error("Failed to fetch Expense");
        }
        const result = await freshResponse.json();
        console.log("Expense data fetched (raw, after 304 retry):", result);
        return result.Expense || result.data || result;
      }
      
      if (!response.ok) throw new Error("Failed to fetch Expense");
      const result = await response.json();
      console.log("Expense data fetched (raw):", result);
      return result.Expense || result.data || result;
    },
    // Force refetch every time to ensure fresh data when editing
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale, so it refetches
    gcTime: 0, // Don't cache, always fetch fresh data
    retry: 2, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Reset the loaded flag and force refetch when expenseId changes
  useEffect(() => {
    if (expenseId) {
      const previousexpenseId = expenseDataLoadedRef.current;
      if (previousexpenseId !== expenseId) {
        console.log("🔄 Expense ID changed from", previousexpenseId, "to", expenseId);
        expenseDataLoadedRef.current = null; // Reset before refetch
        // Force refetch when expenseId changes
        if (isEditMode && refetchExpense) {
          console.log("🔄 Forcing refetch for new Expense ID:", expenseId);
          setTimeout(() => {
            refetchExpense();
          }, 100);
        }
      }
    } else {
      // Reset when not in edit mode
      expenseDataLoadedRef.current = null;
    }
  }, [expenseId, isEditMode, refetchExpense]);

  // Populate form fields when Expense data loads
  useEffect(() => {
    // Validate that we have valid Expense data
    const Expense = existingExpense as any;
    const hasValidData = Expense && 
                        typeof Expense === 'object' && 
                        Object.keys(Expense).length > 0 &&
                        (Expense.id || Expense.expenseNumber || Expense.totalAmount !== undefined);
    
    // Check if expenseItems are empty or don't have the expected data
    const expenseItemsEmpty = !Expense?.expenseItems || 
                          (Array.isArray(Expense.expenseItems) && Expense.expenseItems.length === 0) ||
                          (expenseItems.length === 0 && Expense?.expenseItems?.length > 0);
    
    // Only load if we have valid data, not loading, and either:
    // 1. Haven't loaded this Expense yet (ref doesn't match), OR
    // 2. Line items are empty even though we have data (fallback case)
    const shouldLoad = isEditMode && 
                      hasValidData && 
                      !isLoadingExpense && 
                      (expenseDataLoadedRef.current !== expenseId || expenseItemsEmpty);
    
    console.log("🔍 Expense data loading check:", {
      isEditMode,
      hasValidData,
      isLoadingExpense,
      currentRef: expenseDataLoadedRef.current,
      expenseId,
      expenseItemsEmpty,
      shouldLoad,
      ExpenseDataKeys: Expense ? Object.keys(Expense).length : 0,
      expenseNumber: Expense?.expenseNumber,
      formexpenseItemsLength: expenseItems.length,
      dataexpenseItemsLength: Expense?.expenseItems?.length || 0,
    });
    
    if (shouldLoad) {
      expenseDataLoadedRef.current = expenseId; // Mark as loaded BEFORE setting data
      console.log("🔄 Loading Expense data into form:", Expense);
      
      // Set basic expense fields
      setExpenseDate(Expense.expenseDate || Expense.expense_date || new Date().toISOString().split("T")[0]);
      setCurrency(Expense.currency || "USD");
      
      // Clean notes - remove HTML tags if present
      let notesText = Expense.notes || Expense.description || "";
      if (notesText && typeof notesText === "string") {
        notesText = notesText.replace(/<[^>]*>/g, "").trim();
      }
      setNotesContent(notesText);
      
      // Set expense number if available
      if (Expense.expenseNumber || Expense.expense_number || Expense.referenceNumber || Expense.reference_number) {
        const expNum = Expense.expenseNumber || Expense.expense_number || Expense.referenceNumber || Expense.reference_number;
        setExpenseNumber(expNum);
      }

      // Parse and set line items
      let parsedexpenseItems = [];
      if (Expense.expenseItems) {
        if (typeof Expense.expenseItems === "string") {
          try {
            parsedexpenseItems = JSON.parse(Expense.expenseItems);
          } catch (e) {
            console.warn("Failed to parse line items:", e);
          }
        } else if (Array.isArray(Expense.expenseItems)) {
          parsedexpenseItems = Expense.expenseItems;
        }
      } else if (Expense.items && Array.isArray(Expense.items)) {
        parsedexpenseItems = Expense.items;
      }

      if (parsedexpenseItems.length > 0) {
        setExpenseItems(parsedexpenseItems.map((item: any) => ({
          category: item.category || "",
          title: item.title || item.itemTitle || item.description || "",
          vendorId: item.vendorId?.toString() || item.vendor_id?.toString() || item.vendor?.toString() || "",
          leadTypeId: item.leadTypeId?.toString() || item.lead_type_id?.toString() || "",
          quantity: item.quantity?.toString() || "1",
          amount: item.amount?.toString() || item.unitPrice?.toString() || item.sellingPrice?.toString() || "",
          taxRateId: item.taxRateId?.toString() || "",
          taxAmount: item.taxAmount?.toString() || item.tax?.toString() || "0",
          totalAmount: parseFloat(item.totalAmount?.toString() || item.totalPrice?.toString() || "0"),
          paymentMethod: item.paymentMethod || item.payment_method || "credit_card",
          paymentStatus: item.paymentStatus || item.payment_status || "paid",
          amountPaid: item.amountPaid?.toString() || item.amount_paid?.toString() || "",
          amountDue: item.amountDue?.toString() || item.amount_due?.toString() || "",
          notes: item.notes || "",
        })));
      }
      
      expenseDataLoadedRef.current = expenseId;
      console.log("✅ Expense data loaded successfully");
      console.log("✅ Expense items count:", expenseItems.length);
    } else {
      const skipReason = {
        isEditMode,
        hasExpenseData: !!existingExpense,
        isLoadingExpense,
        expenseId,
        tenantId: tenant?.id,
        alreadyLoaded: expenseDataLoadedRef.current === expenseId,
        ExpenseDataType: typeof existingExpense,
        ExpenseDataKeys: existingExpense ? Object.keys(existingExpense).length : 0,
      };
      console.log("⏭️ Skipping Expense data load:", skipReason);
      
      // If we're in edit mode but data isn't loading and we don't have data, try to refetch
      if (isEditMode && !isLoadingExpense && !existingExpense && expenseId && expenseDataLoadedRef.current !== expenseId) {
        console.log("🔄 No data available, attempting to refetch...");
        setTimeout(() => {
          if (refetchExpense) {
            refetchExpense();
          }
        }, 500);
      }
      
      // If we have data but expenseItems are empty, force reload
      if (isEditMode && existingExpense && !isLoadingExpense && expenseItems.length === 0 && (existingExpense as any).expenseItems?.length > 0) {
        console.log("⚠️ Line items are empty but data exists, forcing reload...");
        expenseDataLoadedRef.current = null; // Reset to allow reload
        setTimeout(() => {
          if (refetchExpense) {
            refetchExpense();
          }
        }, 100);
      }
    }
  }, [existingExpense, isEditMode, isLoadingExpense, expenseId, tenant?.id, refetchExpense, expenseItems.length]);

  // Create expense mutation
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

  // Helper to allow only numeric input
  const handleNumericKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      ".",
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
    ];
    if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  // Get category options for expense categories
  const getCategoryOptions = (): AutocompleteOption[] => {
    return EXPENSE_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: cat.label,
    }));
  };

    return [
      { value: "create_new", label: "➕ New" },
      ...defaultCategories,
    ];
  };

  // Get customer options
  const getCustomerOptions = (): AutocompleteOption[] => {
    const customerOptions = customers.map((customer: any) => {
      const name =
        customer.name ||
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
        "Unnamed Customer";
      const email = customer.email ? ` | ${customer.email}` : "";
      const phone = customer.phone ? ` | ${customer.phone}` : "";
      return {
        value: customer.id.toString(),
        label: `${name}${email}${phone}`,
      };
    });

    return [
      { value: "create_new", label: "➕ Create New Customer" },
      ...customerOptions,
    ];
  };

  // Get booking options
  const getBookingOptions = (): AutocompleteOption[] => {
    return [
      { value: "none", label: "No booking selected" },
      ...bookings.map((booking: any) => ({
        value: booking.id.toString(),
        label: `${booking.bookingNumber || `BK-${booking.id}`} - ${booking.customerName || "Unknown Customer"}${booking.travelDate ? ` (${new Date(booking.travelDate).toLocaleDateString()})` : ""}`,
      })),
    ];
  };

  // Get vendor options
  const getVendorOptions = (): AutocompleteOption[] => {
    return [
      { value: "create_new", label: "➕ New" },
      // { value: "none", label: "No vendor selected" },
      ...vendors.map((vendor: any) => ({
        value: vendor.id.toString(),
        label: vendor.companyName || vendor.name || "Unnamed Vendor",
      })),
    ];
  };

  // Get service provider options filtered by lead type
  const getServiceProviderOptions = (
    leadTypeName: string,
  ): AutocompleteOption[] => {
    // Find the lead type ID by name
    const leadType = leadTypes.find(
      (lt: any) => (lt.name || lt.type_name || lt.typeName) === leadTypeName,
    );

    if (!leadType) {
      return [
        { value: "create_new", label: "➕ New" },
        // { value: "none", label: "Select lead type first" },
      ];
    }

    // Filter service providers by lead type ID
    const filteredProviders = serviceProviders.filter(
      (sp: any) => sp.leadTypeId === leadType.id,
    );

    return [
      { value: "create_new", label: "➕ New" },
      // { value: "none", label: "No service provider" },
      ...filteredProviders.map((sp: any) => ({
        value: sp.id.toString(),
        label: sp.name,
      })),
    ];
  };

  // Get payment status options
  const getPaymentStatusOptions = (): AutocompleteOption[] => {
    return [
      { value: "pending", label: "Pending" },
      { value: "paid", label: "Paid" },
      { value: "partial", label: "Partially Paid" },
      { value: "overdue", label: "Overdue" },
    ];
  };

  // Get currency symbol
  const getCurrencySymbol = (currencyCode: string): string => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      INR: "₹",
      AUD: "A$",
      CAD: "C$",
      JPY: "¥",
      CNY: "¥",
      SGD: "S$",
      HKD: "HK$",
      NZD: "NZ$",
    };
    return symbols[currencyCode] || currencyCode;
  };

  // Get current currency from Expense settings
  const currentCurrency = expenseSettings?.defaultCurrency || "USD";
  const currencySymbol = getCurrencySymbol(currentCurrency);

  // Get currency options
  const getCurrencyOptions = (): AutocompleteOption[] => {
    return [
      { value: "INR", label: "INR (₹)" },
      { value: "USD", label: "USD ($)" },
      { value: "EUR", label: "EUR (€)" },
    ];
  };

  // Calculate expense item totals
  const calculateExpenseItemTotals = (item: typeof expenseItems[number]) => {
    const quantity = parseFloat(item.quantity || "1");
    const unitAmount = parseFloat(item.amount || "0");
    const totalAmountBeforeTax = unitAmount * quantity;
    let taxAmount = 0;
    let totalAmount = totalAmountBeforeTax;

    if (item.taxRateId) {
      const selectedRate = gstRates.find(
        (rate: any) => rate.id?.toString() === item.taxRateId
      );
      if (selectedRate) {
        const ratePercentage = parseFloat(
          selectedRate.ratePercentage?.toString() || 
          selectedRate.rate_percentage?.toString() || 
          selectedRate.rate?.toString() || 
          "0"
        );
        
        if (isTaxInclusive) {
          const subtotal = totalAmountBeforeTax / (1 + ratePercentage / 100);
          taxAmount = totalAmountBeforeTax - subtotal;
          totalAmount = totalAmountBeforeTax;
        } else {
          taxAmount = (totalAmountBeforeTax * ratePercentage) / 100;
          totalAmount = totalAmountBeforeTax + taxAmount;
        }
      }
    }

    return {
      ...item,
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount,
    };
  };

  // Update expense item
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
          const ratePercentage = parseFloat(
            selectedRate.ratePercentage?.toString() || 
            selectedRate.rate_percentage?.toString() || 
            selectedRate.rate?.toString() || 
            "0"
          );
          
          if (isTaxInclusive) {
            const subtotal = totalAmountBeforeTax / (1 + ratePercentage / 100);
            taxAmount = totalAmountBeforeTax - subtotal;
            totalAmount = totalAmountBeforeTax;
          } else {
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

  // Add expense item
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
      },
    ]);
  };

  // Remove expense item
  const removeExpenseItem = (index: number) => {
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter((_, i) => i !== index));
    }
  };

  // Calculate subtotal (without tax)
  const calculateSubtotal = () => {
    return expenseItems.reduce(
      (total, item) => {
        const sellingPrice = parseFloat(item.sellingPrice || "0");
        const quantity = parseInt(item.quantity || "1");
        return total + (sellingPrice * quantity);
      },
      0,
    );
  };

  // Calculate total tax
  const calculateTotalTax = () => {
    return expenseItems.reduce(
      (total, item) => total + parseFloat(item.tax || "0"),
      0,
    );
  };

  // Calculate total additional commission
  const calculateTotalAdditionalCommission = () => {
    return expenseItems.reduce(
      (total, item) => total + parseFloat(item.additionalCommission || "0"),
      0,
    );
  };

  // Calculate grand total (subtotal + tax - discount + additional commission)
  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTotalTax();
    const discount = parseFloat(discountAmount || "0");
    const additionalCommission = calculateTotalAdditionalCommission();
    return subtotal + tax - discount + additionalCommission;
  };

  // Calculate payment installments
  const calculateInstallments = () => {
    if (!enableInstallments) return [];

    const totalAmount = calculateGrandTotal();
    const paidAmount = paymentStatus === "paid"
      ? totalAmount // Full payment when status is "paid"
      : isEditMode 
        ? existingPaidAmount + parseFloat(amountPaid || "0") // Add new payment to existing
        : parseFloat(amountPaid || "0");
    const pendingAmount = totalAmount - paidAmount;

    if (pendingAmount <= 0) return [];

    const numInstallments = parseInt(numberOfInstallments);
    if (numInstallments <= 0) return [];

    const amountPerInstallment = pendingAmount / numInstallments;
    const installments = [];

    let currentDate = new Date(dueDate);

    for (let i = 0; i < numInstallments; i++) {
      installments.push({
        installmentNumber: i + 1,
        amount: amountPerInstallment.toFixed(2),
        dueDate: currentDate.toISOString().split("T")[0],
      });

      // Calculate next date based on frequency
      switch (installmentFrequency) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case "yearly":
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }

    return installments;
  };

  // Generate expenses from line items
  const generateExpenses = () => {
    return expenseItems
      .filter(
        (item) => item.purchasePrice && parseFloat(item.purchasePrice) > 0,
      )
      .map((item, index) => {
        const leadType = leadTypes.find(
          (lt: any) =>
            (lt.name || lt.type_name || lt.typeName) === item.travelCategory,
        );

        const vendor = vendors.find(
          (v: any) => v.id.toString() === item.vendor,
        );

        const purchasePrice = parseFloat(item.purchasePrice || "0");
        const quantity = parseInt(item.quantity || "1");
        
        return {
          itemIndex: index,
          title: item.itemTitle || `Expense for ${item.travelCategory}`,
          purchasePrice: purchasePrice, // Purchase price per unit
          amount: purchasePrice * quantity, // Multiply purchase price by quantity
          category: item.travelCategory || "General",
          vendorId: item.vendor !== "none" ? parseInt(item.vendor) : null,
          vendorName: vendor
            ? vendor.companyName || vendor.name
            : "Not specified",
          leadTypeId: leadType?.id || null,
          leadTypeName: item.travelCategory || "Not specified",
          expenseType: "purchase",
          quantity: quantity,
          expenseNumber: item.expenseNumber,
          voucherNumber: item.voucherNumber,
        };
      });
  };

  // Add manual expense
  const addManualExpense = () => {
    setManualExpenses([
      ...manualExpenses,
      {
        title: "",
        purchasePrice: "",
        amount: "",
        category: "",
        vendorId: "",
        quantity: "1",
        expenseType: "manual",
      },
    ]);
  };

  // Update manual expense
  const updateManualExpense = (index: number, field: string, value: any) => {
    const updated = [...manualExpenses];
    updated[index] = { ...updated[index], [field]: value };
    
    // Calculate amount when purchasePrice or quantity changes
    if (field === "purchasePrice" || field === "quantity") {
      const purchasePrice = parseFloat(updated[index].purchasePrice || "0");
      const quantity = parseInt(updated[index].quantity || "1");
      updated[index].amount = (purchasePrice * quantity).toFixed(2);
    }
    
    setManualExpenses(updated);
  };

  // Remove manual expense
  const removeManualExpense = (index: number) => {
    setManualExpenses(manualExpenses.filter((_, i) => i !== index));
  };

  // Combine all expenses
  const getAllExpenses = () => {
    const autoExpenses = generateExpenses();
    const manualExpensesFormatted = manualExpenses.map((exp, idx) => {
      const purchasePrice = parseFloat(exp.purchasePrice || "0");
      const quantity = parseInt(exp.quantity || "1");
      const amount = purchasePrice * quantity; // Calculate amount from purchasePrice * quantity
      
      return {
        ...exp,
        itemIndex: `M-${idx + 1}`,
        purchasePrice: purchasePrice,
        amount: amount,
        quantity: quantity,
        vendorName: exp.vendorId
          ? vendors.find((v: any) => v.id.toString() === exp.vendorId)
            ?.companyName || "Unknown"
          : "Not specified",
      };
    });
    return [...autoExpenses, ...manualExpensesFormatted];
  };

  // Handle customer selection
  const handleCustomerSelection = (customerId: string) => {
    if (customerId === "create_new") {
      setIsCustomerPanelOpen(true);
    } else {
      setSelectedCustomerId(customerId);
    }
  };

  // Handle travel category selection
  const handleTravelCategorySelection = (value: string, index: number) => {
    if (value === "create_new") {
      setCurrentItemIndex(index);
      setIsLeadTypePanelOpen(true);
    } else {
      updateExpenseItem(index, "travelCategory", value);
    }
  };

  // Handle vendor selection
  const handleVendorSelection = (value: string, index: number) => {
    if (value === "create_new") {
      setCurrentItemIndex(index);
      setIsVendorPanelOpen(true);
    } else {
      updateExpenseItem(index, "vendor", value);
    }
  };

  // Handle service provider selection
  const handleServiceProviderSelection = (value: string, index: number) => {
    if (value === "create_new") {
      setCurrentItemIndex(index);
      setIsServiceProviderPanelOpen(true);
    } else {
      updateExpenseItem(index, "serviceProviderId", value);
    }
  };

  // Handle booking selection
  const handleBookingSelection = (bookingId: string) => {
    setSelectedBookingId(bookingId);

    if (bookingId && bookingId !== "none") {
      const selectedBooking = bookings.find(
        (b: any) => b.id.toString() === bookingId,
      );

      if (selectedBooking) {
        setSelectedCustomerId(selectedBooking.customerId?.toString() || "");

        const bookingAmount =
          selectedBooking.totalAmount ||
          selectedBooking.total_amount ||
          selectedBooking.amount ||
          0;
        const bookingPassengers =
          selectedBooking.passengers || selectedBooking.passenger_count || 1;
        const bookingPackage =
          selectedBooking.packageName ||
          selectedBooking.package_name ||
          selectedBooking.travelPackage;

        const totalAmount = parseFloat(bookingAmount.toString()) || 0;
        const unitPrice = totalAmount / bookingPassengers || 0;
        const purchasePrice = unitPrice * 0.8;
        const taxAmount = totalAmount * 0.18;

        const newexpenseItems = [...expenseItems];
        newexpenseItems[0] = {
          ...newexpenseItems[0],
          travelCategory: getTravelCategories()[1]?.value || "Tour Package",
          itemTitle:
            bookingPackage ||
            `Booking ${selectedBooking.bookingNumber || selectedBooking.booking_number || selectedBooking.id}`,
          quantity: bookingPassengers.toString(),
          unitPrice: unitPrice.toString(),
          sellingPrice: unitPrice.toString(),
          purchasePrice: purchasePrice.toString(),
          expenseNumber:
            selectedBooking.bookingNumber ||
            selectedBooking.booking_number ||
            `BK-${selectedBooking.id}`,
          voucherNumber:
            selectedBooking.voucherNumber ||
            selectedBooking.voucher_number ||
            `V-${selectedBooking.id}`,
          tax: taxAmount.toString(),
          totalAmount: totalAmount,
        };

        setExpenseItems(newexpenseItems);

        const bookingPaidAmount =
          selectedBooking.paidAmount || selectedBooking.paid_amount || 0;
        const bookingDiscount =
          selectedBooking.discountAmount ||
          selectedBooking.discount_amount ||
          0;

        setAmountPaid(bookingPaidAmount.toString());
        setDiscountAmount(bookingDiscount.toString());
      }
    }
  };

  // Calculate due date based on Expense date and payment terms
  const calculateDueDate = (date: string, terms: string, custom: string = "") => {
    const baseDate = new Date(date);
    let daysToAdd = 0;

    if (terms === "custom") {
      daysToAdd = parseInt(custom) || 0;
    } else {
      daysToAdd = parseInt(terms) || 0;
    }

    const newDueDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return newDueDate.toISOString().split("T")[0];
  };

  // Handle Expense date change
  const handleexpenseDateChange = (date: string) => {
    setexpenseDate(date);
    const newDueDate = calculateDueDate(date, paymentTerms, customDays);
    setDueDate(newDueDate);
  };

  // Handle payment terms change
  const handlePaymentTermsChange = (terms: string) => {
    setPaymentTerms(terms);
    const newDueDate = calculateDueDate(expenseDate, terms, customDays);
    setDueDate(newDueDate);
  };

  // Handle custom days change
  const handleCustomDaysChange = (days: string) => {
    setCustomDays(days);
    if (paymentTerms === "custom") {
      const newDueDate = calculateDueDate(expenseDate, "custom", days);
      setDueDate(newDueDate);
    }
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    if (isTaxInclusive) {
      return expenseItems.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity || "1");
        const unitAmount = parseFloat(item.amount || "0");
        return sum + (unitAmount * quantity);
      }, 0);
    } else {
      return expenseItems.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity || "1");
        const unitAmount = parseFloat(item.amount || "0");
        return sum + (unitAmount * quantity);
      }, 0);
    }
  };

  const calculateTotalTax = () => {
    if (isTaxInclusive) {
      return 0;
    } else {
      return expenseItems.reduce((sum, item) => sum + parseFloat(item.taxAmount || "0"), 0);
    }
  };

  const calculateGrandTotal = () => {
    if (isTaxInclusive) {
      return calculateSubtotal();
    } else {
      return calculateSubtotal() + calculateTotalTax();
    }
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
      '50px', // Delete button - small (fixed)
    ];
    return columns.join(' ');
  }, [expenseSettings?.showCategory, expenseSettings?.showVendor, expenseSettings?.showLeadType, expenseSettings?.showTax, expenseSettings?.showPaymentStatus, expenseSettings?.showPaymentMethod]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const expenses = expenseItems.map((item) => {
      const quantity = parseFloat(item.quantity || "1");
      const unitAmount = parseFloat(item.amount || "0");
      const totalAmount = unitAmount * quantity;
      
      return {
        title: item.title,
        description: item.notes,
        quantity: quantity,
        amount: totalAmount,
        currency: expenseSettings?.defaultCurrency || currency,
        category: item.category,
        subcategory: "",
        expenseDate: expenseDate,
        expenseNumber: expenseNumber || undefined,
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
          : 0,
        isReimbursable: false,
        isRecurring: false,
        recurringFrequency: "",
        status: "pending",
        amountPaid: parseFloat(item.amountPaid || "0"),
        amountDue: parseFloat(item.amountDue || "0"),
        tags: [],
        notes: notesContent || item.notes,
      };
    });

    createExpensesMutation.mutate(expenses);
  };

  // OLD CODE - REMOVED: Prepare Expense data for preview
  const prepareExpenseData_OLD = (): ExpenseData | null => {
    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return null;
    
    const formData = new FormData(form);
    const selectedCustomer = customers.find((c: any) => c.id.toString() === selectedCustomerId);
    
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return null;
    }

    const grandTotal = calculateGrandTotal();
    const discount = parseFloat(discountAmount || "0");
    const subtotal = calculateSubtotal();
    const tax = calculateTotalTax();
    const finalAmount = grandTotal;

    // Get company info from tenant or use defaults
    const companyName = tenant?.companyName || "Company Name";
    const companyEmail = tenant?.contactEmail || "company@example.com";
    const companyPhone = tenant?.contactPhone || "";

    const ExpenseData: ExpenseData = {
      expenseNumber: expenseNumber || formData.get("expenseNumber") as string || "INV-001",
      issueDate: expenseDate,
      dueDate: dueDate,
      customerName: selectedCustomer.name || selectedCustomer.customerName || "Customer",
      customerEmail: selectedCustomer.email || selectedCustomer.customerEmail || "",
      customerPhone: selectedCustomer.phone || selectedCustomer.customerPhone || "",
      customerAddress: selectedCustomer.address || selectedCustomer.customerAddress || "",
      companyName: companyName,
      companyEmail: companyEmail,
      companyPhone: companyPhone,
      companyAddress: tenant?.address || "",
      items: expenseItems
        .map((item, originalIndex) => {
          const sellingPrice = parseFloat(item.sellingPrice || "0");
          const quantity = parseInt(item.quantity || "1");
          const totalAmount = parseFloat(item.totalAmount?.toString() || "0");
          const hasTitle = item.itemTitle && item.itemTitle.trim() !== "";
          const hasPrice = sellingPrice > 0;
          const hasTotal = totalAmount > 0;
          const hasCategory = item.travelCategory && item.travelCategory.trim() !== "";
          
          // Include items that have any meaningful data (title, price, total, or category)
          if (!hasTitle && !hasPrice && !hasTotal && !hasCategory) {
            return null;
          }
          
          // Build description from available data
          let description = item.itemTitle?.trim();
          if (!description && hasCategory) {
            description = item.travelCategory;
          }
          if (!description) {
            description = `Item ${originalIndex + 1}`;
          }
          
          return {
            description: description,
            quantity: quantity || 1,
            unitPrice: sellingPrice,
            totalPrice: totalAmount > 0 ? totalAmount : (sellingPrice * quantity),
          };
        })
        .filter((item) => item !== null) as { description: string; quantity: number; unitPrice: number; totalPrice: number; }[],
      subtotal: subtotal,
      taxAmount: tax,
      discountAmount: discount,
      totalAmount: finalAmount,
      currency: currencySymbol,
      notes: notesContent || undefined,
      paymentTerms: paymentTerms || undefined,
      paymentStatus: paymentStatus,
      paidAmount: paymentStatus === "paid"
        ? calculateGrandTotal() // Full payment when status is "paid"
        : isEditMode 
          ? existingPaidAmount + parseFloat(amountPaid || "0") // Add new payment to existing
          : parseFloat(amountPaid || "0"),
      installments: enableInstallments ? calculateInstallments().map(inst => ({
        installmentNumber: inst.installmentNumber,
        dueDate: inst.dueDate,
        amount: inst.amount,
      })) : undefined,
    };

    return ExpenseData;
  };

  // Handle preview button click
  const handlePreview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ExpenseData = prepareExpenseData();
    if (ExpenseData) {
      setPreviewExpenseData(ExpenseData);
      setShowPreview(true);
    }
  };

  // Handle actual save from preview
  const handleSaveFromPreview = async () => {
    if (!previewExpenseData) return;

    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);

    const grandTotal = calculateGrandTotal();
    const discount = parseFloat(discountAmount || "0");
    const finalAmount = grandTotal;

    // Combine auto-generated and manual expenses
    const expenseNumber = formData.get("expenseNumber") as string;
    const autoExpenses = generateExpenses().map((expense, index) => {
      const totalAmount = expense.amount || 0;
      // Generate expense number based on Expense number
      const expenseNumber = expense.expenseNumber || expense.voucherNumber || `${expenseNumber}-EXP-${index + 1}`;
      
      return {
        title: expense.title,
        amount: totalAmount,
        quantity: expense.quantity || 1,
        category: expense.category,
        subcategory: expense.category,
        vendorId: expense.vendorId,
        leadTypeId: expense.leadTypeId,
        expenseType: expense.expenseType,
        expenseDate: formData.get("issueDate") as string,
        expenseNumber: expenseNumber,
        paymentMethod: "bank_transfer",
        currency: expenseSettings?.defaultCurrency || "USD",
        taxAmount: 0, // Can be calculated if tax info is available
        taxRate: 0,
        amountPaid: 0,
        amountDue: totalAmount,
        status: "pending",
        notes: `Auto-generated from Expense ${expenseNumber} - ${expense.expenseNumber || expense.voucherNumber || ""}`,
      };
    });

    const manualExpensesData = manualExpenses.map((expense, index) => {
      const purchasePrice = parseFloat(expense.purchasePrice || "0");
      const quantity = parseInt(expense.quantity || "1");
      const amount = purchasePrice * quantity;
      const expenseNumber = `${expenseNumber}-MAN-${index + 1}`;
      
      return {
        title: expense.title || "Manual Expense",
        amount: amount,
        quantity: quantity,
        category: expense.category || "General",
        subcategory: expense.category || "General",
        vendorId: expense.vendorId && expense.vendorId !== "none" ? parseInt(expense.vendorId) : null,
        leadTypeId: null,
        expenseType: "manual",
        expenseDate: formData.get("issueDate") as string,
        expenseNumber: expenseNumber,
        paymentMethod: "bank_transfer",
        currency: expenseSettings?.defaultCurrency || "USD",
        taxAmount: 0,
        taxRate: 0,
        amountPaid: 0,
        amountDue: amount,
        status: "pending",
        notes: `Manual expense from Expense ${expenseNumber}`,
      };
    });

    const expenses = [...autoExpenses, ...manualExpensesData];

    const ExpenseData = {
      expenseNumber: formData.get("expenseNumber") as string,
      customerId: parseInt(selectedCustomerId),
      bookingId:
        selectedBookingId && selectedBookingId !== "none"
          ? parseInt(selectedBookingId)
          : null,
      issueDate: formData.get("issueDate") as string,
      dueDate: formData.get("dueDate") as string,
      totalAmount: finalAmount,
      paidAmount: paymentStatus === "paid"
        ? calculateGrandTotal() // Full payment when status is "paid"
        : isEditMode 
          ? existingPaidAmount + parseFloat(amountPaid || "0") // Add new payment to existing
          : parseFloat(amountPaid || "0"),
      subtotal: grandTotal,
      taxAmount: expenseItems.reduce(
        (total, item) => total + parseFloat(item.tax || "0"),
        0,
      ),
      discountAmount: discount,
      status: paymentStatus,
      currency: expenseSettings?.defaultCurrency || "USD",
      notes: notesContent || undefined,
      additionalNotes: additionalNotesContent || undefined,
      paymentTerms: paymentTerms || undefined,
      paymentMethod: paymentMethod.length > 0 ? paymentMethod : ["credit_card"],
      isTaxInclusive: isTaxInclusive,
      enableReminder,
      reminderFrequency: enableReminder ? reminderFrequency : null,
      reminderSpecificDate: enableReminder && reminderFrequency === "specific_date" ? reminderSpecificDate : null,
      expenseItems: expenseItems.map((item) => ({
        ...item,
        quantity: parseInt(item.quantity || "1"),
        unitPrice: parseFloat(item.unitPrice || "0"),
        sellingPrice: parseFloat(item.sellingPrice || "0"),
        purchasePrice: parseFloat(item.purchasePrice || "0"),
        tax: parseFloat(item.tax || "0"),
        additionalCommission: parseFloat(item.additionalCommission || "0"),
      })),
      expenses, // Include auto-generated expenses
      installments: enableInstallments ? calculateInstallments().map(inst => ({
        installmentNumber: inst.installmentNumber,
        dueDate: inst.dueDate,
        amount: inst.amount,
        status: "pending",
        paidAmount: 0,
      })) : undefined,
    };

    if (isEditMode && expenseId) {
      updateExpenseMutation.mutate(ExpenseData);
    } else {
      createExpenseMutation.mutate(ExpenseData);
    }
  };

  const [currency, setCurrency] = useState(expenseSettings?.defaultCurrency || "USD");

  // Update currency when Expense settings change
  useEffect(() => {
    if (expenseSettings?.defaultCurrency) {
      setCurrency(expenseSettings.defaultCurrency);
    }
  }, [expenseSettings?.defaultCurrency]);

  // Payment method options
  const paymentMethodOptions = [
    { value: "credit_card", label: "Credit Card" },
    { value: "debit_card", label: "Debit Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "wire_transfer", label: "Wire Transfer" },
    { value: "ach_transfer", label: "ACH Transfer" },
    { value: "cash", label: "Cash" },
    { value: "check", label: "Check" },
    { value: "petty_cash", label: "Petty Cash" },
    { value: "paypal", label: "PayPal" },
    { value: "stripe", label: "Stripe" },
    { value: "venmo", label: "Venmo" },
    { value: "zelle", label: "Zelle" },
    { value: "apple_pay", label: "Apple Pay" },
    { value: "google_pay", label: "Google Pay" },
    { value: "cryptocurrency", label: "Cryptocurrency" },
    { value: "mobile_payment", label: "Mobile Payment" },
    { value: "online_gateway", label: "Online Payment Gateway" },
    { value: "money_order", label: "Money Order" },
    { value: "other", label: "Other" },
  ];

  // Calculate grid template columns dynamically (must be before any conditional returns)
  const gridTemplate = useMemo(() => {
    const columns = [
      '30px', // # column - smaller (fixed)
      'minmax(180px, 1.5fr)', // Category - reduced width (flexible, min 180px)
      ...(expenseSettings?.showVendor ? ['minmax(180px, 1.5fr)'] : []), // Vendor - reduced width (flexible, min 180px)
      ...(expenseSettings?.showProvider ? ['minmax(180px, 1.5fr)'] : []), // Provider - reduced width (flexible, min 180px)
      'minmax(60px, 1fr)', // Pax - small (flexible, min 60px)
      ...(expenseSettings?.showUnitPrice ? ['minmax(130px, 1fr)'] : []), // Unit Price - small (flexible, min 100px)
      'minmax(130px, 1fr)', // Selling Price - small (flexible, min 100px)
      'minmax(130px, 1fr)', // Purchase Price - small (flexible, min 100px)
      ...(expenseSettings?.showTax ? ['minmax(100px, 1fr)'] : []), // Tax - small (flexible, min 100px)
      'minmax(100px, 1fr)', // Amount - small (flexible, min 100px)
      ...(expenseSettings?.showAdditionalCommission ? ['minmax(100px, 1fr)'] : []), // Additional Commission - small (flexible, min 100px)
      ...(expenseSettings?.showVoucherExpense ? ['minmax(100px, 1fr)'] : []), // Expense/Voucher - small (flexible, min 100px)
      '50px', // Delete button - small (fixed)
    ];
    return columns.join(' ');
  }, [expenseSettings?.showVendor, expenseSettings?.showProvider, expenseSettings?.showUnitPrice, expenseSettings?.showTax, expenseSettings?.showAdditionalCommission, expenseSettings?.showVoucherExpense]);

  // Grid template for expense table
  const expenseGridTemplate = useMemo(() => {
    const columns = [
      '30px', // # column
      'minmax(180px, 2fr)', // Title
      'minmax(150px, 1.5fr)', // Category
      'minmax(150px, 1.5fr)', // Vendor
      'minmax(60px, 1fr)', // Qty
      'minmax(130px, 1fr)', // Purchase Price
      'minmax(130px, 1fr)', // Amount
      '50px', // Delete button
    ];
    return columns.join(' ');
  }, []);

  // Show loading state when fetching Expense data
  if (isEditMode && isLoadingExpense) {
    return (
      <Layout initialSidebarCollapsed={true}>
        <div className="p-6 max-w-[1600px] mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="text-center">Loading Expense data...</div>
          </div>
        </div>
      </Layout>
    );
  }

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
                  onClick={() => navigate("/Expenses")}
                  data-testid="button-back"
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                {isEditMode && (
                  <h1 className="ml-2 sm:ml-4 font-inter font-medium text-base sm:text-[20px] leading-[24px] text-[#121926] truncate">
                    Edit Expense
                  </h1>
                )}
              </div>
              {/* <h1 className="font-inter font-medium text-[20px] leading-[24px] text-[#121926]">
                  Leads
                </h1> */}

              <div className="flex gap-2 sm:gap-3 ml-auto">
                {" "}
                {tenant?.id && <expenseSettingsPanel tenantId={tenant.id} />}
                <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                  <HelpCircle className="h-5 w-5 text-gray-600" />
                </div>
                {/* <div
                  style={{ width: "8rem" }}
                  className="h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm"
                > */}
                  {/* <Bell className="h-5 w-5 text-gray-600" /> */}

                  {/* <Label htmlFor="currency">Currency *</Label> */}
                  {/* <AutocompleteInput
                    data-testid="autocomplete-currency"
                    suggestions={getCurrencyOptions()}
                    value={currency}
                    onValueChange={setCurrency}
                    placeholder="Select currency..."
                    emptyText="No currency found"
                  /> */}
                  <input type="hidden" name="currency" value={currency} />
                {/* </div> */}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handlePreview}>
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Expense
                  </h1>
                  {/* <p className="text-gray-600 dark:text-gray-400">
              Fill in the details to create a new Expense
            </p> */}
                </div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div>
                  <Label htmlFor="expenseNumber">Expense Number *</Label>
                  <Input
                    data-testid="input-Expense-number"
                    id="expenseNumber"
                    name="expenseNumber"
                    value={expenseNumber}
                    onChange={(e) => setexpenseNumber(e.target.value)}
                    placeholder="INV-001"
                    required
                  />
                </div>
              </div>
              {/* Customer and Expense Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <Label htmlFor="customerId">Customer *</Label>
                  <AutocompleteInput
                    data-testid="autocomplete-customer"
                    suggestions={getCustomerOptions()}
                    value={selectedCustomerId}
                    onValueChange={handleCustomerSelection}
                    placeholder="Search customer..."
                    emptyText="No customers found"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="issueDate">Expense Date *</Label>
                  <DatePicker
                    value={expenseDate}
                    onChange={handleexpenseDateChange}
                    placeholder="Select Expense date"
                    className="w-full"
                  />
                  <input type="hidden" name="issueDate" value={expenseDate} />
                </div>
              </div>

              {/* Payment Terms and Due Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <div className="flex items-center gap-1 mb-1.5">
                        <Label htmlFor="paymentTerms">Terms *</Label>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-gray-900 dark:text-white cursor-help" />
                        </TooltipTrigger>
                      </div>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Payment terms specify when payment is due. For example, "30 Days" means
                          payment is due 30 days after the Expense date. "Due on Receipt" means
                          immediate payment is expected.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Select
                    value={paymentTerms}
                    onValueChange={handlePaymentTermsChange}
                  >
                    <SelectTrigger data-testid="select-payment-terms">
                      <SelectValue placeholder="Select terms..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Due on Receipt</SelectItem>
                      <SelectItem value="15">15 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="paymentTerms" value={paymentTerms === "custom" ? `${customDays} days` : `${paymentTerms} days`} />
                </div>

                {paymentTerms === "custom" && (
                  <div>
                    <Label htmlFor="customDays">Custom Days *</Label>
                    <Input
                      data-testid="input-custom-days"
                      type="number"
                      value={customDays}
                      onChange={(e) => handleCustomDaysChange(e.target.value)}
                      placeholder="Enter number of days"
                      min="0"
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <DatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Select due date"
                    className="w-full"
                  />
                  <input type="hidden" name="dueDate" value={dueDate} />
                </div>
              </div>

              {/* Payment Method and Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-10"
                        data-testid="select-payment-method"
                      >
                        <span className="truncate">
                          {paymentMethod.length === 0
                            ? "Select methods..."
                            : paymentMethod.length === 1
                            ? paymentMethodOptions.find((opt) => opt.value === paymentMethod[0])?.label || paymentMethod[0]
                            : `${paymentMethod.length} methods selected`}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="max-h-[300px] overflow-y-auto p-2">
                        {paymentMethodOptions.map((option) => {
                          const isSelected = paymentMethod.includes(option.value);
                          return (
                            <div
                              key={option.value}
                              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                if (isSelected) {
                                  setPaymentMethod(paymentMethod.filter((v) => v !== option.value));
                                } else {
                                  setPaymentMethod([...paymentMethod, option.value]);
                                }
                              }}
                            >
                              <div
                                className={`flex h-4 w-4 items-center justify-center rounded border ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <span className="text-sm">{option.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      {paymentMethod.length > 0 && (
                        <div className="border-t p-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {paymentMethod.length} selected
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setPaymentMethod([])}
                          >
                            Clear all
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="paymentStatus">Payment Status *</Label>
                  <Select
                    value={paymentStatus}
                    onValueChange={setPaymentStatus}
                  >
                    <SelectTrigger data-testid="select-payment-status">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partially Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Line Items */}
              <div className="border rounded-lg overflow-x-auto">
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
                    <div className="flex items-center">Category *</div>
                    {expenseSettings?.showVendor && <div className="flex items-center">Vendor</div>}
                    {expenseSettings?.showProvider && <div className="flex items-center">Provider</div>}
                    <div className="flex items-center">Pax *</div>
                    {expenseSettings?.showUnitPrice && <div className="flex items-center">Unit Price ({currencySymbol}) *</div>}
                    <div className="flex items-center">Selling Price ({currencySymbol}) *</div>
                    <div className="flex items-center">Purchase Price ({currencySymbol}) *</div>
                    {expenseSettings?.showTax && <div className="flex items-center">Tax ({currencySymbol})</div>}
                    <div className="flex items-center">Amount ({currencySymbol})</div>
                    {expenseSettings?.showAdditionalCommission && <div className="flex items-center">Commission ({currencySymbol})</div>}
                    {expenseSettings?.showVoucherExpense && <div className="flex items-center">Expense/Voucher</div>}
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

                      <div className="flex items-center">
                        <AutocompleteInput
                          data-testid={`autocomplete-category-${index}`}
                          suggestions={getTravelCategories()}
                          value={item.travelCategory}
                          onValueChange={(value) =>
                            handleTravelCategorySelection(value, index)
                          }
                          placeholder="Select..."
                          emptyText="No categories found"
                        />
                      </div>

                      {expenseSettings?.showVendor && (
                        <div className="flex items-center">
                          <AutocompleteInput
                            data-testid={`autocomplete-vendor-${index}`}
                            suggestions={getVendorOptions()}
                            value={item.vendor}
                            onValueChange={(value) =>
                              handleVendorSelection(value, index)
                            }
                            placeholder="Select..."
                            emptyText="No vendors found"
                          />
                        </div>
                      )}

                      {expenseSettings?.showProvider && (
                        <div className="flex items-center">
                          <AutocompleteInput
                            data-testid={`autocomplete-service-provider-${index}`}
                            suggestions={getServiceProviderOptions(
                              item.travelCategory,
                            )}
                            value={item.serviceProviderId}
                            onValueChange={(value) =>
                              handleServiceProviderSelection(value, index)
                            }
                            placeholder="Select..."
                            emptyText="No providers found"
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

                      {expenseSettings?.showUnitPrice && (
                        <div className="flex items-center">
                          <Input
                            data-testid={`input-unit-price-${index}`}
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateExpenseItem(index, "unitPrice", e.target.value)
                            }
                            onKeyPress={handleNumericKeyPress}
                            placeholder="0"
                          />
                        </div>
                      )}

                      <div className="flex items-center">
                        <Input
                          data-testid={`input-selling-price-${index}`}
                          value={item.sellingPrice}
                          onChange={(e) =>
                            updateExpenseItem(
                              index,
                              "sellingPrice",
                              e.target.value,
                            )
                          }
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0"
                        />
                      </div>

                      <div className="flex items-center">
                        <Input
                          data-testid={`input-purchase-price-${index}`}
                          value={item.purchasePrice}
                          onChange={(e) =>
                            updateExpenseItem(
                              index,
                              "purchasePrice",
                              e.target.value,
                            )
                          }
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0"
                        />
                      </div>

                      {expenseSettings?.showTax && (
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
                          {item.tax && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Tax: {currencySymbol}{parseFloat(item.tax).toFixed(2)}
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

                      {expenseSettings?.showAdditionalCommission && (
                        <div className="flex items-center">
                          <Input
                            data-testid={`input-additional-commission-${index}`}
                            type="text"
                            value={item.additionalCommission || ""}
                            onChange={(e) =>
                              updateExpenseItem(
                                index,
                                "additionalCommission",
                                e.target.value,
                              )
                            }
                            onKeyPress={handleNumericKeyPress}
                            placeholder="0.00"
                          />
                        </div>
                      )}

                      {expenseSettings?.showVoucherExpense && (
                        <div className="flex items-center">
                          <Input
                            data-testid={`input-line-Expense-number-${index}`}
                            value={item.expenseNumber}
                            onChange={(e) =>
                              updateExpenseItem(
                                index,
                                "expenseNumber",
                                e.target.value,
                              )
                            }
                            placeholder="#"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-center">
                        {expenseItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExpenseItem(index)}
                            data-testid={`button-remove-item-${index}`}
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
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line Item
                </Button>
              </div>
              {/* Auto-Generated Expenses Preview */}

              <div className="border-t pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Side - Tax and Discount Inputs */}
                  <div className="space-y-4">
                    {expenseSettings?.showTax && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex flex-col">
                          <Label htmlFor="taxInclusive" className="text-sm font-medium">
                            Tax Type
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isTaxInclusive ? "Tax is included in prices" : "Tax will be added to prices"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Exclusive</span>
                          <Switch
                            id="taxInclusive"
                            checked={isTaxInclusive}
                            onCheckedChange={setIsTaxInclusive}
                            data-testid="switch-tax-inclusive"
                          />
                          <span className="text-sm text-muted-foreground">Inclusive</span>
                        </div>
                      </div>
                    )}

                    {expenseSettings?.showDiscount && (
                      <div>
                        <Label htmlFor="discountAmount">Discount Amount ({currencySymbol})</Label>
                        <Input
                          data-testid="input-discount-amount"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0"
                        />
                      </div>
                    )}
                    {/* Payment Reminder Section */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Bell className="h-5 w-5 text-gray-900 dark:text-white" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Payment Reminder
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="enableReminder" className="text-sm">
                            Enable Reminder
                          </Label>
                          <Switch
                            id="enableReminder"
                            checked={enableReminder}
                            onCheckedChange={setEnableReminder}
                            data-testid="switch-enable-reminder"
                          />
                        </div>
                      </div>

                      {enableReminder && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="reminderFrequency">Reminder Frequency *</Label>
                            <Select
                              value={reminderFrequency}
                              onValueChange={setReminderFrequency}
                            >
                              <SelectTrigger data-testid="select-reminder-frequency">
                                <SelectValue placeholder="Select frequency..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="specific_date">Specific Date</SelectItem>
                              </SelectContent>
                            </Select>
                            <input type="hidden" name="reminderFrequency" value={reminderFrequency} />
                          </div>

                          {reminderFrequency === "specific_date" && (
                            <div>
                              <Label htmlFor="reminderSpecificDate">Reminder Date *</Label>
                              <DatePicker
                                value={reminderSpecificDate}
                                onChange={setReminderSpecificDate}
                                placeholder="Select reminder date"
                                className="w-full"
                              />
                              <input type="hidden" name="reminderSpecificDate" value={reminderSpecificDate} />
                            </div>
                          )}

                          <div className="col-span-full">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {reminderFrequency === "daily" && "Customer will receive payment reminders every day until the Expense is paid."}
                              {reminderFrequency === "weekly" && "Customer will receive payment reminders every week until the Expense is paid."}
                              {reminderFrequency === "monthly" && "Customer will receive payment reminders every month until the Expense is paid."}
                              {reminderFrequency === "specific_date" && "Customer will receive a payment reminder on the selected date."}
                            </p>
                          </div>
                        </div>
                      )}
                      <input type="hidden" name="enableReminder" value={enableReminder.toString()} />
                    </div>
                  </div>

                  {/* Right Side - Calculation Summary */}
                  <div className="border-l pl-6 space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Calculation Summary
                    </h3>

                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                      <span className="font-medium" data-testid="text-subtotal">
                        {currencySymbol}{calculateSubtotal().toFixed(2)}
                      </span>
                    </div>

                    {expenseSettings?.showTax && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-700 dark:text-gray-300">Tax:</span>
                        <span className="font-medium" data-testid="text-tax">
                          {currencySymbol}{calculateTotalTax().toFixed(2)}
                        </span>
                      </div>
                    )}

                    {expenseSettings?.showDiscount && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-700 dark:text-gray-300">Discount:</span>
                        <span className="font-medium text-gray-900 dark:text-white" data-testid="text-discount">
                          -{currencySymbol}{parseFloat(discountAmount || "0").toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-3 border px-3 rounded-lg">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white" data-testid="text-total-amount">
                        {currencySymbol}{calculateGrandTotal().toFixed(2)}
                      </span>
                    </div>

                    {/* Show existing paid amount in edit mode */}
                    {isEditMode && existingPaidAmount > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 mt-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Previously Paid:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {currencySymbol}{existingPaidAmount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {paymentStatus !== "paid" && (
                      <div className="pt-2">
                        <Label htmlFor="amountPaid" className="mb-2 block">
                          {isEditMode ? "Additional Amount Paid" : "Amount Paid"} ({currencySymbol})
                        </Label>
                        <Input
                          data-testid="input-amount-paid"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0"
                          className="text-lg font-medium"
                        />
                        {isEditMode && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            This will be added to the existing paid amount of {currencySymbol}{existingPaidAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Payment Installments Section */}
                    <div className="pt-4 border-t mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label htmlFor="enableInstallments" className="text-sm font-semibold">
                          Enable Payment Installments
                        </Label>
                        <Switch
                          id="enableInstallments"
                          checked={enableInstallments}
                          onCheckedChange={setEnableInstallments}
                          data-testid="switch-enable-installments"
                        />
                      </div>

                      {enableInstallments && (
                        <div className="space-y-3 border p-4 rounded-lg">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Number of Installments</Label>
                              <Input
                                type="number"
                                min="2"
                                max="12"
                                value={numberOfInstallments}
                                onChange={(e) => setNumberOfInstallments(e.target.value)}
                                data-testid="input-number-installments"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Frequency</Label>
                              <Select
                                value={installmentFrequency}
                                onValueChange={setInstallmentFrequency}
                              >
                                <SelectTrigger data-testid="select-installment-frequency" className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Installment Preview */}
                          {calculateInstallments().length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-semibold mb-2">Installment Plan Preview</h4>
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left pb-2">#</th>
                                      <th className="text-left pb-2">Due Date</th>
                                      <th className="text-right pb-2">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {calculateInstallments().map((inst) => (
                                      <tr key={inst.installmentNumber} className="border-b last:border-0">
                                        <td className="py-2">{inst.installmentNumber}</td>
                                        <td className="py-2">{new Date(inst.dueDate).toLocaleDateString()}</td>
                                        <td className="py-2 text-right font-medium">{currencySymbol}{inst.amount}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <div className="mt-3 pt-2 border-t flex justify-between font-semibold">
                                  <span>Total Pending:</span>
                                  <span className="text-gray-900 dark:text-white">
                                    {currencySymbol}{(
                                      calculateGrandTotal() - 
                                      (isEditMode ? existingPaidAmount + parseFloat(amountPaid || "0") : parseFloat(amountPaid || "0"))
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section with Rich Text Editor - Side by Side */}
              {expenseSettings?.showNotes && (
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-lg p-2 sm:p-4">
                      <Label htmlFor="notes" className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 block">
                        Notes
                      </Label>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                        Add notes for the Expense.
                      </p>
                       <div className="bg-white dark:bg-gray-900 rounded-lg" data-testid="rich-text-editor-notes">
                         <ReactQuill
                           theme="snow"
                           value={notesContent}
                           onChange={setNotesContent}
                           className="h-40"
                          modules={{
                            toolbar: [
                              ['bold', 'italic', 'underline'],
                              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                              ['link', 'image'],
                              ['clean']
                            ],
                          }}
                          formats={[
                            'bold', 'italic', 'underline',
                            'list', 'bullet',
                            'link', 'image'
                          ]}
                          placeholder="Type your notes here..."
                        />
                      </div>
                      <input type="hidden" name="notes" value={notesContent} />
                    </div>

                    <div className="rounded-lg p-2 sm:p-4">
                      <Label htmlFor="notes" className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 block">
                        Additional Notes 
                      </Label>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                         It will be hidden to the Expense .
                      </p>
                      <div className="bg-white dark:bg-gray-900 rounded-lg" data-testid="rich-text-editor-additional-notes">
                        <ReactQuill
                          theme="snow"
                          value={additionalNotesContent}
                          onChange={setAdditionalNotesContent}
                          className="h-40"
                          modules={{
                            toolbar: [
                              ['bold', 'italic', 'underline'],
                              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                              ['link', 'image'],
                              ['clean']
                            ],
                          }}
                          formats={[
                            'bold', 'italic', 'underline',
                            'list', 'bullet',
                            'link', 'image'
                          ]}
                          placeholder="Type your notes here..."
                        />
                      </div>
                      <input type="hidden" name="notes" value={additionalNotesContent} />
                    </div>
                  </div>
                </div>
              )}

              {(generateExpenses().length > 0 || manualExpenses.length > 0) && (
                <div className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-gray-900 dark:text-white" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Expenses ({getAllExpenses().length})
                      </h3>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addManualExpense}
                      data-testid="button-add-manual-expense"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Manual Expense
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Auto-generated expenses from purchase prices and manually added expenses
                  </p>

                  <div className="border rounded-lg overflow-x-auto">
                    <div className="min-w-[2200px]">
                      {/* Table Header */}
                      <div 
                        className="top-0 z-[100] grid gap-2 border-b p-3 font-medium text-sm bg-gray-50 dark:bg-gray-800"
                        style={{ 
                          gridTemplateColumns: expenseGridTemplate,
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
                        <div className="flex items-center">Title</div>
                        <div className="flex items-center">Category</div>
                        <div className="flex items-center">Vendor</div>
                        <div className="flex items-center">Qty</div>
                        <div className="flex items-center">Purchase Price ({currencySymbol})</div>
                        <div className="flex items-center">Amount ({currencySymbol})</div>
                        <div className="flex items-center"></div>
                      </div>

                      {/* Table Body */}
                      <div>
                        {getAllExpenses().map((expense, idx) =>
                          expense.expenseType === "manual" ? (
                            <div
                              key={idx}
                              className="grid gap-2 p-3 border-b last:border-b-0"
                              style={{ gridTemplateColumns: expenseGridTemplate }}
                            >
                              <div className="flex items-center justify-center">
                                <span className="font-medium text-sm">{expense.itemIndex}</span>
                              </div>
                              <div className="flex items-center">
                                <Input
                                  value={expense.title}
                                  onChange={(e) =>
                                    updateManualExpense(
                                      parseInt(expense.itemIndex.split("-")[1]) - 1,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Expense title"
                                />
                              </div>
                              <div className="flex items-center">
                                <AutocompleteInput
                                  suggestions={getTravelCategories().filter(
                                    (cat) => cat.value !== "create_new",
                                  )}
                                  value={expense.category}
                                  onValueChange={(value) =>
                                    updateManualExpense(
                                      parseInt(expense.itemIndex.split("-")[1]) - 1,
                                      "category",
                                      value,
                                    )
                                  }
                                  placeholder="Category"
                                />
                              </div>
                              <div className="flex items-center">
                                <AutocompleteInput
                                  suggestions={getVendorOptions().filter(
                                    (v) => v.value !== "create_new",
                                  )}
                                  value={expense.vendorId}
                                  onValueChange={(value) =>
                                    updateManualExpense(
                                      parseInt(expense.itemIndex.split("-")[1]) - 1,
                                      "vendorId",
                                      value,
                                    )
                                  }
                                  placeholder="Vendor"
                                />
                              </div>
                              <div className="flex items-center">
                                <Input
                                  value={expense.quantity}
                                  onChange={(e) =>
                                    updateManualExpense(
                                      parseInt(expense.itemIndex.split("-")[1]) - 1,
                                      "quantity",
                                      e.target.value,
                                    )
                                  }
                                  onKeyPress={handleNumericKeyPress}
                                  placeholder="1"
                                />
                              </div>
                              <div className="flex items-center">
                                <Input
                                  value={expense.purchasePrice || ""}
                                  onChange={(e) =>
                                    updateManualExpense(
                                      parseInt(expense.itemIndex.split("-")[1]) - 1,
                                      "purchasePrice",
                                      e.target.value,
                                    )
                                  }
                                  onKeyPress={handleNumericKeyPress}
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="flex items-center">
                                <span className="font-semibold text-sm">
                                  {currencySymbol}{expense.amount ? parseFloat(expense.amount).toFixed(2) : "0.00"}
                                </span>
                              </div>
                              <div className="flex items-center justify-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeManualExpense(
                                      parseInt(expense.itemIndex.split("-")[1]) - 1,
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-gray-900 dark:text-white" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              key={idx}
                              className="grid gap-2 p-3 border-b last:border-b-0"
                              style={{ gridTemplateColumns: expenseGridTemplate }}
                            >
                              <div className="flex items-center justify-center">
                                <span className="font-medium text-sm">#{expense.itemIndex + 1}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm font-medium">{expense.title}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border text-gray-900 dark:text-white">
                                  {expense.category}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm">{expense.vendorName}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm">{expense.quantity}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm text-right">
                                  {currencySymbol}{expense.purchasePrice?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm font-semibold">
                                  {currencySymbol}{expense.amount.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center"></div>
                            </div>
                          ),
                        )}
                        {/* Total Row */}
                        <div 
                          className="grid gap-2 p-3 border-t font-semibold"
                          style={{ gridTemplateColumns: expenseGridTemplate }}
                        >
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                          <div className="flex items-center justify-end">
                            <span className="text-sm">Total Expenses:</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm">
                              {currencySymbol}{getAllExpenses()
                                .reduce((sum, exp) => sum + exp.amount, 0)
                                .toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profit Calculation Section */}
                  <div className="mt-6  pt-4">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white">💰</span> Profit Analysis
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Left Side - Values */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Total Expense Amount:</span>
                            <span className="font-semibold text-lg">
                              {currencySymbol}{calculateGrandTotal().toFixed(2)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Total Expenses:</span>
                            <span className="font-semibold text-lg text-gray-900 dark:text-white">
                              -{currencySymbol}
                              {getAllExpenses()
                                .reduce((sum, exp) => sum + exp.amount, 0)
                                .toFixed(2)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Tax Amount:</span>
                            <span className="font-semibold text-lg text-gray-900 dark:text-white">
                              {currencySymbol}
                              {expenseItems.reduce(
                                (total, item) => total + parseFloat(item.tax || "0"),
                                0
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Right Side - Profit Display */}
                        <div className="flex items-center justify-center">
                          <div className="border rounded-lg p-6 shadow-md w-full">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">Net Profit</p>
                            <p className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                              {currencySymbol}{(
                                calculateGrandTotal() -
                                getAllExpenses().reduce((sum, exp) => sum + exp.amount, 0)
                              ).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                              (Expense Amount - Expenses)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/Expenses")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  data-testid="button-create-Expense"
                >
                  {createExpenseMutation.isPending
                    ? "Creating..."
                    : "Save Expense"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Expense Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expense Preview</DialogTitle>
            <DialogDescription>
              Review your Expense before saving. All Expense data will be displayed as shown below.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewExpenseData && (
              <>
                {/* Use actual Expense template */}
                <ModernTemplate data={previewExpenseData} />
                
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveFromPreview}
              disabled={isEditMode ? updateExpenseMutation.isPending : createExpenseMutation.isPending}
              className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900"
            >
              {isEditMode 
                ? (updateExpenseMutation.isPending ? "Updating..." : "Update Expense")
                : (createExpenseMutation.isPending ? "Saving..." : "Save Expense")
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Create Slide Panel */}
      <Sheet open={isCustomerPanelOpen} onOpenChange={setIsCustomerPanelOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Customer</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CustomerCreateForm
              tenantId={tenant?.id?.toString() || ""}
              onSuccess={(customer) => {
                queryClient.invalidateQueries({
                  queryKey: [`customers-tenant-${tenant?.id}`],
                });
                setSelectedCustomerId(customer.id?.toString() || "");
                setIsCustomerPanelOpen(false);
                toast({
                  title: "Success",
                  description: "Customer created and selected",
                });
              }}
              onCancel={() => setIsCustomerPanelOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Vendor Create Slide Panel */}
      <Sheet open={isVendorPanelOpen} onOpenChange={setIsVendorPanelOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Vendor</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <VendorCreateForm
              onSuccess={(vendor) => {
                queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
                updateExpenseItem(
                  currentItemIndex,
                  "vendor",
                  vendor.id?.toString() || "",
                );
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
            <SheetTitle>Create New Travel Category</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <LeadTypeCreateForm
              onSuccess={(leadType) => {
                queryClient.invalidateQueries({
                  queryKey: [`/api/tenants/${tenant?.id}/lead-types`],
                });
                updateExpenseItem(
                  currentItemIndex,
                  "travelCategory",
                  leadType.name || "",
                );
                setIsLeadTypePanelOpen(false);
                toast({
                  title: "Success",
                  description: "Travel category created and selected",
                });
              }}
              onCancel={() => setIsLeadTypePanelOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Service Provider Create Slide Panel */}
      <Sheet
        open={isServiceProviderPanelOpen}
        onOpenChange={setIsServiceProviderPanelOpen}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Service Provider</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ServiceProviderCreateForm
              preselectedLeadTypeId={
                expenseItems[currentItemIndex]?.travelCategory
                  ? leadTypes
                    .find(
                      (lt: any) =>
                        lt.name ===
                        expenseItems[currentItemIndex].travelCategory,
                    )
                    ?.id.toString()
                  : undefined
              }
              onSuccess={(provider) => {
                queryClient.invalidateQueries({
                  queryKey: [`/api/service-providers`, tenant?.id],
                });
                updateExpenseItem(
                  currentItemIndex,
                  "serviceProviderId",
                  provider.id?.toString() || "",
                );
                setIsServiceProviderPanelOpen(false);
                toast({
                  title: "Success",
                  description: "Service provider created and selected",
                });
              }}
              onCancel={() => setIsServiceProviderPanelOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}

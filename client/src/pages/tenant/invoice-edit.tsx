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
  Paperclip,
  File,
  FileText,
  Image as ImageIcon,
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
import { CustomerCreateForm } from "@/components/forms/customer-create-form";
import { VendorCreateForm } from "@/components/forms/vendor-create-form";
import { LeadTypeCreateForm } from "@/components/forms/lead-type-create-form";
import { ServiceProviderCreateForm } from "@/components/forms/service-provider-create-form";
import { InvoiceSettingsPanel } from "@/components/invoice-settings-panel";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ModernTemplate, InvoiceData } from "@/components/invoices/invoice-templates";
import type { UploadResult } from "@uppy/core";

export default function InvoiceEdit() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/invoice-edit/:id");
  const invoiceId = params?.id ? parseInt(params.id) : null;
  const isEditMode = true; // Always in edit mode for this page

  // Redirect if no invoice ID provided
  useEffect(() => {
    if (!invoiceId || isNaN(invoiceId)) {
      toast({
        title: "Error",
        description: "Invalid invoice ID",
        variant: "destructive",
      });
      navigate("/invoices");
    }
  }, [invoiceId, navigate, toast]);

  const [lineItems, setLineItems] = useState([
    {
      travelCategory: "",
      vendor: "",
      serviceProviderId: "",
      packageId: "",
      itemTitle: "",
      invoiceNumber: "",
      voucherNumber: "",
      quantity: "1",
      unitPrice: "",
      sellingPrice: "",
      purchasePrice: "",
      tax: "",
      taxRateId: "",
      additionalCommissionPercentage: "",
      additionalCommission: "",
      totalAmount: 0,
    },
  ]);
  
  // Track the count of line items that were previously created (loaded from invoice)
  // This is used internally to distinguish between existing and new line items
  // Items at indices < previouslyCreatedLineItemCount are previously created
  const [previouslyCreatedLineItemCount, setPreviouslyCreatedLineItemCount] = useState(0);

  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [existingPaidAmount, setExistingPaidAmount] = useState(0); // Store original paid amount for edit mode
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [hasCancellationCharge, setHasCancellationCharge] = useState(false);
  const [cancellationChargeAmount, setCancellationChargeAmount] = useState("");
  const [cancellationChargeNotes, setCancellationChargeNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string[]>([]);
  const [paymentTerms, setPaymentTerms] = useState("30");
  const [customDays, setCustomDays] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceNumberOnly, setInvoiceNumberOnly] = useState(""); // Just the number part without prefix

  // Travel dates
  const [travelDate, setTravelDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");

  // Payment reminder states
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState("weekly");
  const [reminderSpecificDate, setReminderSpecificDate] = useState("");

  // Payment installments states
  const [enableInstallments, setEnableInstallments] = useState(false);
  const [numberOfInstallments, setNumberOfInstallments] = useState("2");
  const [installmentFrequency, setInstallmentFrequency] = useState("monthly");

  // Tax states
  const [selectedTaxSettingId, setSelectedTaxSettingId] = useState("none");
  const [selectedTaxRateId, setSelectedTaxRateId] = useState("");
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);

  // Slide panel states
  const [isCustomerPanelOpen, setIsCustomerPanelOpen] = useState(false);
  const [isVendorPanelOpen, setIsVendorPanelOpen] = useState(false);
  const [isLeadTypePanelOpen, setIsLeadTypePanelOpen] = useState(false);
  const [isServiceProviderPanelOpen, setIsServiceProviderPanelOpen] =
    useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Manual expenses state
  const [manualExpenses, setManualExpenses] = useState<any[]>([]);
  
  // Store expenses grouped by expense ID for display
  const [groupedExpenses, setGroupedExpenses] = useState<Map<number, any>>(new Map());
  
  // Store edited expense line items (from API) - keyed by lineItem.id
  const [editedExpenseLineItems, setEditedExpenseLineItems] = useState<Map<number, any>>(new Map());
  
  // Store deleted expense line item IDs (to exclude from save)
  const [deletedExpenseLineItemIds, setDeletedExpenseLineItemIds] = useState<Set<number>>(new Set());

  // Notes state for rich text editor
  const [notesContent, setNotesContent] = useState("");
  const [additionalNotesContent, setAdditionalNotesContent] = useState("");
  // Notes attachments state - store File objects until invoice is saved
  const [invoiceAttachments, setInvoiceAttachments] = useState<Array<{ id: string; file: File; name: string; type?: string }>>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<Array<{ id: string; name: string; url: string; type?: string }>>([]);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewInvoiceData, setPreviewInvoiceData] = useState<InvoiceData | null>(null);

  // Fetch invoice settings
  const { data: invoiceSettings = {
    invoiceNumberStart: 1,
    invoiceNumberPrefix: "INV",
    showTax: true,
    showDiscount: true,
    showNotes: true,
    showVoucherInvoice: true,
    showProvider: true,
    showVendor: true,
    showUnitPrice: true,
    showAdditionalCommission: false,
    defaultCurrency: "USD",
    defaultGstSettingId: null,
  }, refetch: refetchInvoiceSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/invoice-settings", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      console.log("📥 Fetching invoice settings for tenant:", tenant?.id);
      try {
        const response = await fetch(`/api/invoice-settings/${tenant?.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          console.error("❌ Failed to fetch invoice settings:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("❌ Error response:", errorText);
          throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        console.log("✅ Invoice settings fetched:", result.data);
        return result.data || result;
      } catch (error) {
        console.error("❌ Error fetching invoice settings:", error);
        throw error;
      }
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 0,
    cacheTime: 0,
    retry: 2,
  });

  // Fetch existing invoices for number generation
  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices", tenant?.id],
    enabled: !!tenant?.id && !isEditMode,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

  // Read URL query params for customerId and redirectTo (works in both create and edit mode)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const customerIdParam = params.get("customerId");
    const redirectToParam = params.get("redirectTo");
    
    // In create mode, auto-select customer from URL
    if (!isEditMode && customerIdParam) {
      console.log("🔍 Auto-selecting customer from URL:", customerIdParam);
      setSelectedCustomerId(customerIdParam);
    }
    
    // Always read redirectTo from URL (for both create and edit mode)
    if (redirectToParam) {
      console.log("🔍 Storing redirect URL:", redirectToParam);
      setRedirectTo(redirectToParam);
    }
  }, [isEditMode]);

  // Refetch invoice settings when page loads
  useEffect(() => {
    if (tenant?.id) {
      console.log("🔄 Refetching invoice settings on page load for tenant:", tenant?.id);
      refetchInvoiceSettings();
    }
  }, [tenant?.id, refetchInvoiceSettings]);

  // Auto-select tax setting from invoice settings
  useEffect(() => {
    if (invoiceSettings?.defaultGstSettingId) {
      setSelectedTaxSettingId(invoiceSettings.defaultGstSettingId.toString());
    }
  }, [invoiceSettings?.defaultGstSettingId]);

  // Function to generate next invoice number
  const generateNextInvoiceNumber = useMemo(() => {
    const startNumber = invoiceSettings?.invoiceNumberStart || 1;
    const prefix = invoiceSettings?.invoiceNumberPrefix || "INV";
    
    console.log("🔢 Generating invoice number - invoices count:", invoices?.length, "startNumber:", startNumber, "prefix:", prefix);
    console.log("🔢 Invoice settings:", invoiceSettings);
    console.log("🔢 Invoices data:", invoices);
    
    if (!invoices || invoices.length === 0) {
      // No existing invoices, use starting number from settings
      const generated = `${prefix}${String(startNumber).padStart(3, '0')}`;
      console.log("🔢 No existing invoices, using start number from settings:", generated);
      return generated;
    }

    // Extract numbers from existing invoice numbers
    // Handle formats like: INV-001, INV001, INV-1, INV1, BILL-123, BILL123, etc.
    const invoiceNumbers = invoices
      .map((inv: any, index: number) => {
        const invNum = inv.invoiceNumber || "";
        if (!invNum) {
          console.log(`🔢 Invoice ${index} has no invoice number`);
          return 0;
        }
        
        console.log(`🔢 Processing invoice ${index}: "${invNum}"`);
        
        // Try to extract number - handle multiple formats
        // Pattern 1: PREFIX-NUMBER (e.g., INV-001, BILL-123)
        const matchWithDash = invNum.match(/^[A-Za-z0-9]+[\s-]+(\d+)/);
        if (matchWithDash) {
          const num = parseInt(matchWithDash[1], 10);
          console.log(`🔢 Matched with dash pattern: ${num}`);
          return num;
        }
        
        // Pattern 2: PREFIXNUMBER (e.g., INV001, BILL123)
        const matchNoDash = invNum.match(/^[A-Za-z]+(\d+)/);
        if (matchNoDash) {
          const num = parseInt(matchNoDash[1], 10);
          console.log(`🔢 Matched no dash pattern: ${num}`);
          return num;
        }
        
        // Pattern 3: Just numbers (extract first number sequence)
        const matchNumbers = invNum.match(/(\d+)/);
        if (matchNumbers) {
          const num = parseInt(matchNumbers[1], 10);
          console.log(`🔢 Matched numbers pattern: ${num}`);
          return num;
        }
        
        console.log(`🔢 No pattern matched for: "${invNum}"`);
        return 0;
      })
      .filter((num: number) => num > 0);

    console.log("🔢 Extracted invoice numbers:", invoiceNumbers);

    // Find the highest number from existing invoices
    const maxNumber = invoiceNumbers.length > 0 
      ? Math.max(...invoiceNumbers) 
      : 0;

    console.log("🔢 Max number from existing invoices:", maxNumber, "Start number from settings:", startNumber);

    // If we have existing invoices, increment from the highest
    // If no valid numbers found, use start number
    // Otherwise, use the higher of: (maxNumber + 1) or startNumber
    let nextNumber: number;
    if (invoiceNumbers.length === 0) {
      // No valid invoice numbers found, use start number
      nextNumber = startNumber;
      console.log("🔢 No valid invoice numbers found, using start number:", nextNumber);
    } else {
      // We have valid invoice numbers, increment from the highest
      // But ensure we don't go below the start number
      nextNumber = Math.max(maxNumber + 1, startNumber);
      console.log("🔢 Incrementing from max number:", maxNumber, "-> next:", nextNumber);
    }
    
    // Return without dash: INV001 instead of INV-001
    const generated = `${prefix}${String(nextNumber).padStart(3, '0')}`;
    console.log("🔢 Final generated invoice number:", generated);
    return generated;
  }, [invoices, invoiceSettings?.invoiceNumberStart, invoiceSettings?.invoiceNumberPrefix]);

  // Track the last starting number used for auto-generation
  const lastStartingNumber = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  // Helper function to extract number part from full invoice number
  const extractNumberPart = (fullNumber: string, prefix: string): string => {
    if (!fullNumber) return "";
    // Remove prefix and any separators (like "-")
    const prefixPattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s-]*`, 'i');
    const cleaned = fullNumber.replace(prefixPattern, '').trim();
    // Extract just the numeric part
    const match = cleaned.match(/(\d+)/);
    return match ? match[1] : cleaned;
  };

  // Auto-generate invoice number when invoices/settings are loaded
  useEffect(() => {
    if (isEditMode) return; // Don't auto-generate in edit mode
    
    const currentStartNumber = invoiceSettings?.invoiceNumberStart || 1;
    const prefix = invoiceSettings?.invoiceNumberPrefix || "INV";
    
    // Wait for both invoices and settings to be loaded
    if (generateNextInvoiceNumber && invoiceSettings && (invoices !== undefined)) {
      // Check if starting number changed
      const startingNumberChanged = lastStartingNumber.current !== null && 
                                    lastStartingNumber.current !== currentStartNumber;
      
      // On first initialization, always update (even if field has a value)
      // After that, update if field is empty OR starting number changed
      const shouldUpdate = !hasInitialized.current || 
                          !invoiceNumber || 
                          startingNumberChanged;
      
      if (shouldUpdate) {
        lastStartingNumber.current = currentStartNumber;
        hasInitialized.current = true;
        const fullNumber = generateNextInvoiceNumber;
        setInvoiceNumber(fullNumber);
        // Extract and set just the number part
        const numberPart = extractNumberPart(fullNumber, prefix);
        setInvoiceNumberOnly(numberPart);
        console.log("🔢 Set invoice number:", fullNumber, "Number part:", numberPart);
      }
    } else if (invoiceSettings?.invoiceNumberStart && !hasInitialized.current) {
      // Initialize lastStartingNumber even if generateNextInvoiceNumber isn't ready yet
      lastStartingNumber.current = invoiceSettings.invoiceNumberStart;
    }
  }, [generateNextInvoiceNumber, invoiceSettings, invoices, isEditMode]);

  // Sync invoiceNumberOnly when invoiceNumber changes (for edit mode)
  useEffect(() => {
    if (invoiceNumber) {
      const prefix = invoiceSettings?.invoiceNumberPrefix || "INV";
      const numberPart = extractNumberPart(invoiceNumber, prefix);
      if (numberPart !== invoiceNumberOnly) {
        setInvoiceNumberOnly(numberPart);
      }
    } else if (!invoiceNumber && invoiceNumberOnly) {
      // Clear number part if invoice number is cleared
      setInvoiceNumberOnly("");
    }
  }, [invoiceNumber, invoiceSettings?.invoiceNumberPrefix]); // Note: intentionally not including invoiceNumberOnly to avoid loops

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: [`customers-tenant-${tenant?.id}`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/customers?action=get-customers&tenantId=${tenant?.id}&all=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result)
        ? result
        : result.customers || result.data || result.rows || [];
    },
  });

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

  // Fetch packages
  const { data: packages = [] } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/packages`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/packages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

  // Fetch service providers
  const { data: serviceProviders = [] } = useQuery<any[]>({
    queryKey: [`/api/service-providers`, tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/tenants/${tenant?.id}/service-providers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

  // Fetch bookings
  const { data: bookings = [] } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/bookings`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result)
        ? result
        : result.data || result.bookings || [];
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

  // Track if invoice data has been loaded to prevent re-loading
  const invoiceDataLoadedRef = useRef<number | null>(null);

  // Fetch invoice data when in edit mode
  const { data: existingInvoice, isLoading: isLoadingInvoice, refetch: refetchInvoice } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/invoices/${invoiceId}`],
    enabled: isEditMode && !!invoiceId && !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      // Add timestamp to URL to prevent 304 cached responses
      const url = `/api/tenants/${tenant?.id}/invoices/${invoiceId}?t=${Date.now()}`;
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
        const freshUrl = `/api/tenants/${tenant?.id}/invoices/${invoiceId}?t=${Date.now()}`;
        const freshResponse = await fetch(freshUrl, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          cache: 'no-store',
        });
        if (!freshResponse.ok) {
          console.error("Failed to fetch invoice after 304 retry:", freshResponse.status, freshResponse.statusText);
          throw new Error("Failed to fetch invoice");
        }
        const result = await freshResponse.json();
        console.log("Invoice data fetched (raw, after 304 retry):", result);
        return result.invoice || result.data || result;
      }
      
      if (!response.ok) throw new Error("Failed to fetch invoice");
      const result = await response.json();
      console.log("Invoice data fetched (raw):", result);
      return result.invoice || result.data || result;
    },
    // Force refetch every time to ensure fresh data when editing
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale, so it refetches
    gcTime: 0, // Don't cache, always fetch fresh data
    retry: 2, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Fetch ALL expenses linked to this invoice when editing
  // Show all expenses (both auto-generated and manual) linked to the invoice
  const { data: existingExpenses = [], isLoading: isLoadingExpenses, refetch: refetchExpenses } = useQuery({
    queryKey: [`/api/expenses`, invoiceId, 'all'],
    enabled: isEditMode && !!invoiceId && !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      // Add timestamp to prevent caching
      const url = `/api/expenses?invoiceId=${invoiceId}&limit=1000&page=1&t=${Date.now()}`;
      const response = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store', // Bypass browser cache completely
      });
      if (!response.ok) return [];
      const result = await response.json();
      // Handle paginated response
      let expenses = [];
      if (result && typeof result === "object" && "data" in result) {
        expenses = result.data || [];
      } else if (Array.isArray(result)) {
        expenses = result;
      }
      
      // Return ALL expenses linked to the invoice (both auto-generated and manual)
      console.log("📦 Fetched expenses from API:", expenses.length, expenses);
      return expenses;
    },
    // Force refetch every time to ensure fresh data when editing
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale, so it refetches
    gcTime: 0, // Don't cache, always fetch fresh data
    retry: 2,
  });

  // Fetch all expenses (including from expense page) for profit calculation only
  // These are NOT displayed in the expenses section, only used for profit calculation
  const { data: allExpensesForProfit = [] } = useQuery({
    queryKey: [`/api/expenses`, invoiceId, 'all-for-profit'],
    enabled: isEditMode && !!invoiceId && !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const url = `/api/expenses?invoiceId=${invoiceId}&limit=1000&page=1`;
      const response = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) return [];
      const result = await response.json();
      // Handle paginated response
      let expenses = [];
      if (result && typeof result === "object" && "data" in result) {
        expenses = result.data || [];
      } else if (Array.isArray(result)) {
        expenses = result;
      }
      
      // Return ALL expenses (both auto-generated and from expense page) for profit calculation
      return expenses;
    },
  });

  // Reset the loaded flag and force refetch when invoiceId changes
  useEffect(() => {
    if (invoiceId) {
      const previousInvoiceId = invoiceDataLoadedRef.current;
      if (previousInvoiceId !== invoiceId) {
        console.log("🔄 Invoice ID changed from", previousInvoiceId, "to", invoiceId);
        invoiceDataLoadedRef.current = null; // Reset before refetch
        // Force refetch when invoiceId changes
        if (isEditMode) {
          console.log("🔄 Forcing refetch for new invoice ID:", invoiceId);
          setTimeout(() => {
            if (refetchInvoice) refetchInvoice();
            if (refetchExpenses) refetchExpenses();
          }, 100);
        }
      }
      } else {
        // Reset when not in edit mode
        invoiceDataLoadedRef.current = null;
      }
    }, [invoiceId, isEditMode, refetchInvoice, refetchExpenses]);

  // Populate form fields when invoice data loads
  useEffect(() => {
    // Validate that we have valid invoice data
    const invoice = existingInvoice as any;
    const hasValidData = invoice && 
                        typeof invoice === 'object' && 
                        Object.keys(invoice).length > 0 &&
                        (invoice.id || invoice.invoiceNumber || invoice.totalAmount !== undefined);
    
    // Check if lineItems are empty or don't have the expected data
    const lineItemsEmpty = !invoice?.lineItems || 
                          (Array.isArray(invoice.lineItems) && invoice.lineItems.length === 0) ||
                          (lineItems.length === 0 && invoice?.lineItems?.length > 0);
    
    // Only load if we have valid data, not loading, and either:
    // 1. Haven't loaded this invoice yet (ref doesn't match), OR
    // 2. Line items are empty even though we have data (fallback case)
    const shouldLoad = isEditMode && 
                      hasValidData && 
                      !isLoadingInvoice && 
                      (invoiceDataLoadedRef.current !== invoiceId || lineItemsEmpty);
    
    console.log("🔍 Invoice data loading check:", {
      isEditMode,
      hasValidData,
      isLoadingInvoice,
      currentRef: invoiceDataLoadedRef.current,
      invoiceId,
      lineItemsEmpty,
      shouldLoad,
      invoiceDataKeys: invoice ? Object.keys(invoice).length : 0,
      invoiceNumber: invoice?.invoiceNumber,
      formLineItemsLength: lineItems.length,
      dataLineItemsLength: invoice?.lineItems?.length || 0,
    });
    
    if (shouldLoad) {
      invoiceDataLoadedRef.current = invoiceId; // Mark as loaded BEFORE setting data
      console.log("🔄 Loading invoice data into form:", invoice);
      
      // Set basic fields
      setSelectedCustomerId(invoice.customerId?.toString() || "");
      setSelectedBookingId(invoice.bookingId?.toString() || "none");
      setInvoiceDate(invoice.issueDate || invoice.invoiceDate || new Date().toISOString().split("T")[0]);
      setDueDate(invoice.dueDate || new Date().toISOString().split("T")[0]);
      setDiscountAmount(invoice.discountAmount?.toString() || "0");
      // In edit mode, store existing paid amount separately and set amount paid field to 0
      const existingPaid = parseFloat(invoice.paidAmount?.toString() || "0");
      setExistingPaidAmount(existingPaid);
      setAmountPaid("0"); // Start with 0 for new payment
      setPaymentStatus(invoice.status || "pending");
      // Load cancellation charge data - handle both camelCase and snake_case
      const hasCharge = invoice.hasCancellationCharge || invoice.has_cancellation_charge || false;
      const chargeAmount = invoice.cancellationChargeAmount || invoice.cancellation_charge_amount || 0;
      const chargeNotes = invoice.cancellationChargeNotes || invoice.cancellation_charge_notes || "";
      
      // Auto-enable if there's a charge amount > 0
      const chargeAmountNum = parseFloat(chargeAmount?.toString() || "0");
      const shouldEnable = hasCharge || chargeAmountNum > 0;
      
      console.log("🔍 Loading cancellation charge data:", {
        hasCharge,
        chargeAmount,
        chargeAmountNum,
        chargeNotes,
        shouldEnable,
        invoiceKeys: Object.keys(invoice).filter(k => k.toLowerCase().includes('cancel')),
      });
      
      setHasCancellationCharge(shouldEnable);
      setCancellationChargeAmount(chargeAmountNum > 0 ? chargeAmountNum.toString() : "0");
      setCancellationChargeNotes(chargeNotes);
      // Handle both array and string for backward compatibility
      const paymentMethodValue = invoice.paymentMethod;
      if (Array.isArray(paymentMethodValue)) {
        setPaymentMethod(paymentMethodValue);
      } else if (typeof paymentMethodValue === 'string') {
        setPaymentMethod([paymentMethodValue]);
      } else {
        setPaymentMethod(["credit_card"]);
      }
      setPaymentTerms(invoice.paymentTerms?.toString() || "30");
      // Set invoice number and extract number part
      if (invoice.invoiceNumber) {
        setInvoiceNumber(invoice.invoiceNumber);
        const prefix = invoiceSettings?.invoiceNumberPrefix || "INV";
        const numberPart = extractNumberPart(invoice.invoiceNumber, prefix);
        setInvoiceNumberOnly(numberPart);
      }
      setIsTaxInclusive(invoice.isTaxInclusive || false);
      
      // Load travel dates
      setTravelDate(invoice.travelDate || invoice.travel_date || "");
      setDepartureDate(invoice.departureDate || invoice.departure_date || "");
      setArrivalDate(invoice.arrivalDate || invoice.arrival_date || "");
      
      // Parse notes and extract attachments (links in HTML) - keep for backward compatibility
      const notesHtml = invoice.notes || "";
      const notesAttachmentsFound: Array<{ id: string; name: string; url: string }> = [];
      const notesWithoutAttachments = notesHtml.replace(/<p><a href="([^"]+)"[^>]*>📎 ([^<]+)<\/a><\/p>/g, (match, url, name) => {
        notesAttachmentsFound.push({
          id: `notes-${notesAttachmentsFound.length}`,
          name: name.trim(),
          url: url.trim(),
        });
        return '';
      }).trim();
      setNotesContent(notesWithoutAttachments);
      
      // Parse additional notes and extract attachments - keep for backward compatibility
      const additionalNotesHtml = invoice.additionalNotes || "";
      const additionalNotesAttachmentsFound: Array<{ id: string; name: string; url: string }> = [];
      const additionalNotesWithoutAttachments = additionalNotesHtml.replace(/<p><a href="([^"]+)"[^>]*>📎 ([^<]+)<\/a><\/p>/g, (match, url, name) => {
        additionalNotesAttachmentsFound.push({
          id: `additional-${additionalNotesAttachmentsFound.length}`,
          name: name.trim(),
          url: url.trim(),
        });
        return '';
      }).trim();
      setAdditionalNotesContent(additionalNotesWithoutAttachments);
      
      // Load attachments from invoice data (new system - from invoice.attachments)
      const invoiceAttachmentsData = invoice.attachments || [];
      const invoiceAttachmentsParsed = Array.isArray(invoiceAttachmentsData) 
        ? invoiceAttachmentsData.map((att: any, index: number) => ({
            id: `uploaded-${index}`,
            name: att.name || att.fileName || `Attachment ${index + 1}`,
            url: att.url || att.publicUrl || att.objectPath || att.location || "",
            type: att.type || att.contentType || "application/octet-stream",
          }))
        : [];
      
      // Set uploaded attachments (already uploaded, read-only)
      setUploadedAttachments(invoiceAttachmentsParsed);
      
      // Clear any new file attachments (they will be uploaded on save)
      setInvoiceAttachments([]);
      
      setEnableReminder(invoice.enableReminder || false);
      setReminderFrequency(invoice.reminderFrequency || "weekly");
      setReminderSpecificDate(invoice.reminderSpecificDate || "");

      // Set payment installments if they exist
      if (invoice.installments && Array.isArray(invoice.installments) && invoice.installments.length > 0) {
        setEnableInstallments(true);
        setNumberOfInstallments(invoice.installments.length.toString());
        // Calculate installment frequency based on dates if available
        if (invoice.installments.length > 1) {
          const firstDate = new Date(invoice.installments[0].dueDate);
          const secondDate = new Date(invoice.installments[1].dueDate);
          const daysDiff = Math.round((secondDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 28 && daysDiff <= 31) {
            setInstallmentFrequency("monthly");
          } else if (daysDiff >= 7 && daysDiff <= 14) {
            setInstallmentFrequency("weekly");
          } else if (daysDiff >= 85 && daysDiff <= 95) {
            setInstallmentFrequency("quarterly");
          }
        }
      }

      // Parse and set line items
      let parsedLineItems = [];
      if (invoice.lineItems) {
        if (typeof invoice.lineItems === "string") {
          try {
            parsedLineItems = JSON.parse(invoice.lineItems);
          } catch (e) {
            console.warn("Failed to parse line items:", e);
          }
        } else if (Array.isArray(invoice.lineItems)) {
          parsedLineItems = invoice.lineItems;
        }
      } else if (invoice.items && Array.isArray(invoice.items)) {
        parsedLineItems = invoice.items;
      }

      if (parsedLineItems.length > 0) {
        const loadedLineItems = parsedLineItems.map((item: any) => ({
          travelCategory: item.travelCategory || "",
          vendor: item.vendor?.toString() || item.vendorId?.toString() || "",
          serviceProviderId: item.serviceProviderId?.toString() || "",
          packageId: item.packageId?.toString() || "",
          itemTitle: item.itemTitle || item.description || "",
          invoiceNumber: item.invoiceNumber || "",
          voucherNumber: item.voucherNumber || "",
          quantity: item.quantity?.toString() || "1",
          unitPrice: item.unitPrice?.toString() || "",
          sellingPrice: item.sellingPrice?.toString() || item.unitPrice?.toString() || "",
          purchasePrice: item.purchasePrice?.toString() || "0",
          tax: item.tax?.toString() || "0",
          taxRateId: item.taxRateId?.toString() || "",
          additionalCommissionPercentage: item.additionalCommissionPercentage?.toString() || "",
          additionalCommission: item.additionalCommission?.toString() || "",
          totalAmount: parseFloat(item.totalAmount?.toString() || item.totalPrice?.toString() || "0"),
        }));
        
        setLineItems(loadedLineItems);
        
        // Mark the count of previously created line items (code level only, not shown on frontend)
        // All items at indices < this count are previously created
        setPreviouslyCreatedLineItemCount(loadedLineItems.length);
        console.log("✅ Marked", loadedLineItems.length, "line items as previously created (code level only)");
      }
      
      console.log("✅ Invoice data loaded successfully");
      console.log("✅ Line items count:", lineItems.length);
    } else {
      const skipReason = {
        isEditMode,
        hasInvoiceData: !!existingInvoice,
        isLoadingInvoice,
        invoiceId,
        tenantId: tenant?.id,
        alreadyLoaded: invoiceDataLoadedRef.current === invoiceId,
        invoiceDataType: typeof existingInvoice,
        invoiceDataKeys: existingInvoice ? Object.keys(existingInvoice).length : 0,
      };
      console.log("⏭️ Skipping invoice data load:", skipReason);
      
      // If we're in edit mode but data isn't loading and we don't have data, try to refetch
      if (isEditMode && !isLoadingInvoice && !existingInvoice && invoiceId && invoiceDataLoadedRef.current !== invoiceId) {
        console.log("🔄 No data available, attempting to refetch...");
        setTimeout(() => {
          if (refetchInvoice) {
            refetchInvoice();
          }
        }, 500);
      }
      
      // If we have data but lineItems are empty, force reload
      if (isEditMode && existingInvoice && !isLoadingInvoice && lineItems.length === 0 && (existingInvoice as any).lineItems?.length > 0) {
        console.log("⚠️ Line items are empty but data exists, forcing reload...");
        invoiceDataLoadedRef.current = null; // Reset to allow reload
        setTimeout(() => {
          if (refetchInvoice) {
            refetchInvoice();
          }
        }, 100);
      }
    }
  }, [existingInvoice, isEditMode, isLoadingInvoice, invoiceId, tenant?.id, refetchInvoice, lineItems.length]);

  // Load existing auto-generated expenses linked to this invoice from API
  // Only auto-generated expenses (auto_generated = 1) are shown on invoice update page
  useEffect(() => {
    if (isEditMode && existingExpenses && existingExpenses.length > 0 && !isLoadingExpenses) {
      console.log("📦 Loading expenses from API:", existingExpenses);
      
      // Group expenses by expense ID
      const expensesMap = new Map<number, any>();
      
      existingExpenses.forEach((exp: any) => {
        // Process ALL expenses linked to the invoice (both auto-generated and manual)
        console.log("📦 Processing expense:", exp.id, "auto_generated:", exp.auto_generated, "with lineItems:", exp.lineItems);
        
        // Get line items from expense - API should include lineItems array
        const lineItems = exp.lineItems || [];
        console.log("📦 Expense lineItems count:", lineItems.length);
        
        // Process line items - ALL existing line items should be shown
        const processedLineItems = lineItems.map((lineItem: any) => {
          // Handle different field names from API
          const amount = parseFloat(lineItem.total_amount || lineItem.amount || lineItem.totalAmount || "0");
          const quantity = parseInt(lineItem.quantity || "1");
          // Calculate purchase price per unit
          const purchasePrice = quantity > 0 ? (amount / quantity).toFixed(2) : amount.toFixed(2);
          
          // Get lead_type_id from line item
          const leadTypeId = lineItem.lead_type_id || lineItem.leadTypeId || null;
          // Find the lead type by ID to get its name for the category field
          const leadType = leadTypes.find((lt: any) => lt.id === leadTypeId);
          const categoryValue = leadType ? (leadType.name || leadType.type_name || leadType.typeName || "other") : "other";
          
          const lineItemData = {
            id: lineItem.id,
            expenseId: exp.id,
            title: lineItem.title || exp.title || "",
            purchasePrice: purchasePrice,
            amount: amount.toFixed(2),
            category: categoryValue, // Use lead type name from lead_type_id
            packageId: leadTypeId ? leadTypeId.toString() : "", // Store lead_type_id as packageId for saving
            vendorId: (lineItem.vendor_id || lineItem.vendorId || exp.vendor_id || exp.vendorId)?.toString() || "",
            quantity: quantity.toString(),
            notes: lineItem.notes || exp.notes || "",
            leadTypeId: leadTypeId, // Store lead_type_id for reference
            isFromAPI: true,
            isLineItem: true,
            isExisting: true, // Mark as existing line item
          };
          
          // Initialize edited line items map with original data
          setEditedExpenseLineItems((prev) => {
            const newMap = new Map(prev);
            if (!newMap.has(lineItem.id)) {
              newMap.set(lineItem.id, { ...lineItemData });
            }
            return newMap;
          });
          
          return lineItemData;
        });
        
        // If no line items in expense, create one from the expense itself
        // This handles expenses that were created without line items
        if (processedLineItems.length === 0) {
          console.log("⚠️ No line items found for expense", exp.id, ", creating from expense data");
          const amount = parseFloat(exp.amount || "0");
          const quantity = parseInt(exp.quantity || "1");
          const purchasePrice = quantity > 0 ? (amount / quantity).toFixed(2) : amount.toFixed(2);
          
          // Get lead_type_id from expense
          const leadTypeId = exp.lead_type_id || exp.leadTypeId || null;
          // Find the lead type by ID to get its name for the category field
          const leadType = leadTypes.find((lt: any) => lt.id === leadTypeId);
          const categoryValue = leadType ? (leadType.name || leadType.type_name || leadType.typeName || "other") : "other";
          
          // Create a line item from the expense itself when no line items exist
          // Use a negative ID to distinguish from actual line item IDs
          processedLineItems.push({
            id: -exp.id, // Use negative expense ID as identifier (to avoid conflicts with real line item IDs)
            expenseId: exp.id,
            title: exp.title || "",
            purchasePrice: purchasePrice,
            amount: amount.toFixed(2),
            category: categoryValue, // Use lead type name from lead_type_id
            packageId: leadTypeId ? leadTypeId.toString() : "", // Store lead_type_id as packageId for saving
            vendorId: (exp.vendor_id || exp.vendorId)?.toString() || "",
            quantity: quantity.toString(),
            notes: exp.notes || "",
            leadTypeId: leadTypeId, // Store lead_type_id for reference
            isFromAPI: true,
            isLineItem: false, // This is the expense itself, not a line item
            isExisting: true,
          });
        }
        
        expensesMap.set(exp.id, {
          id: exp.id,
          title: exp.title || "Expense",
          expenseNumber: exp.expense_number || exp.expenseNumber,
          isFromInvoiceCreation: true, // All auto-generated expenses are from invoice
          lineItems: processedLineItems,
        });
        
        console.log("✅ Processed expense", exp.id, "with", processedLineItems.length, "line items");
      });
      
      console.log("✅ Loaded", expensesMap.size, "expenses with line items from API");
      console.log("✅ Expenses map details:", Array.from(expensesMap.entries()).map(([id, exp]) => ({
        expenseId: id,
        title: exp.title,
        lineItemsCount: exp.lineItems?.length || 0,
        lineItems: exp.lineItems
      })));
      setGroupedExpenses(expensesMap);
    } else if (isEditMode && !isLoadingExpenses && existingExpenses.length === 0) {
      // Clear expenses if no expenses found
      console.log("ℹ️ No expenses found for invoice", invoiceId);
      setGroupedExpenses(new Map());
    }
  }, [existingExpenses, isEditMode, isLoadingExpenses, invoiceId]);

  // Note: Create invoice mutation removed - this page is for editing only

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/invoices/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update invoice: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice Updated",
        description: "Invoice has been updated successfully.",
      });
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices/${invoiceId}`],
      });
      // Invalidate expenses query to refresh expense line items
      queryClient.invalidateQueries({
        queryKey: [`/api/expenses`, invoiceId, 'all'],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/expenses`, invoiceId, 'all-for-profit'],
      });
      // Invalidate customer activities to refresh activity list
      if (selectedCustomerId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/tenants/${tenant?.id}/customers/${selectedCustomerId}/activities`],
        });
      }
      // Redirect to customer detail page if we came from there, otherwise go to invoices list
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate("/invoices");
      }
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update invoice. Please try again.",
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

  // Handler for numeric-only input (no decimals) - for commission field
  const handleIntegerKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // Get travel categories from lead types
  const getTravelCategories = (): AutocompleteOption[] => {
    const leadTypeCategories = leadTypes.map((lt: any) => ({
      value: lt.name || lt.type_name || lt.typeName || `Lead Type ${lt.id}`,
      label: lt.name || lt.type_name || lt.typeName || `Lead Type ${lt.id}`,
    }));

    const defaultCategories =
      leadTypeCategories.length === 0
        ? [
          { value: "Flight", label: "Flight" },
          { value: "Hotel", label: "Hotel" },
          { value: "Transport", label: "Transport" },
          { value: "Tour Package", label: "Tour Package" },
          { value: "Visa Services", label: "Visa Services" },
          { value: "Insurance", label: "Insurance" },
          { value: "Meals", label: "Meals" },
          { value: "Activities", label: "Activities" },
          { value: "Other Services", label: "Other Services" },
        ]
        : leadTypeCategories;

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

  // Check if category has lead_type_category of 3, 8, or 4
  const shouldShowPackageColumn = (categoryName: string): boolean => {
    try {
      if (!categoryName || !leadTypes || leadTypes.length === 0) return false;
      const leadType = leadTypes.find(
        (lt: any) => (lt.name || lt.type_name || lt.typeName) === categoryName,
      );
      if (!leadType || leadType.lead_type_category === undefined || leadType.lead_type_category === null) return false;
      
      // Convert to number for comparison (handles both string and number)
      const categoryId = typeof leadType.lead_type_category === 'string' 
        ? parseInt(leadType.lead_type_category, 10) 
        : leadType.lead_type_category;
      
      // Check if categoryId is 3, 8, or 4
      return categoryId === 3 || categoryId === 8 || categoryId === 4;
    } catch (error) {
      console.error("Error checking package column:", error);
      return false;
    }
  };

  // Check if any line item should show package column
  const shouldShowPackageColumnForAnyItem = useMemo(() => {
    if (!lineItems || lineItems.length === 0) return false;
    return lineItems.some((item) => 
      item.travelCategory && shouldShowPackageColumn(item.travelCategory)
    );
  }, [lineItems, leadTypes]);

  // Get package options
  const getPackageOptions = (): AutocompleteOption[] => {
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return [{ value: "", label: "Select..." }];
    }
    try {
      return [
        { value: "", label: "Select..." },
        ...packages.map((pkg: any) => ({
          value: pkg.id?.toString() || "",
          label: pkg.name || `Package ${pkg.id || ""}`,
        })),
      ];
    } catch (error) {
      console.error("Error getting package options:", error);
      return [{ value: "", label: "Select..." }];
    }
  };

  // Get payment status options
  // Get payment status options - show all options when editing existing invoice
  const getPaymentStatusOptions = (): AutocompleteOption[] => {
    return [
      { value: "draft", label: "Draft" },
      { value: "pending", label: "Pending" },
      { value: "paid", label: "Paid" },
      { value: "partial", label: "Partially Paid" },
      { value: "overdue", label: "Overdue" },
      { value: "cancelled", label: "Cancelled" },
      { value: "void", label: "Void" },
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

  // Get current currency from invoice settings
  const currentCurrency = invoiceSettings?.defaultCurrency || "USD";
  const currencySymbol = getCurrencySymbol(currentCurrency);

  // Get currency options
  const getCurrencyOptions = (): AutocompleteOption[] => {
    return [
      { value: "INR", label: "INR (₹)" },
      { value: "USD", label: "USD ($)" },
      { value: "EUR", label: "EUR (€)" },
    ];
  };

  const calculateLineItemTotals = (item: typeof lineItems[number]) => {
    const sellingPrice = parseFloat(item.sellingPrice || "0");
    const quantity = parseInt(item.quantity || "1");
    const subtotal = sellingPrice * quantity;
    let taxAmount = 0;
    let totalAmount = subtotal;

    const activeRate = item.taxRateId
      ? gstRates.find((rate: any) => rate.id?.toString() === item.taxRateId)
      : null;

    if (activeRate) {
      const ratePercentage = parseFloat(activeRate.ratePercentage) || 0;
      if (isTaxInclusive) {
        // When tax is inclusive, tax is already in the price, so show 0
        taxAmount = 0;
        totalAmount = subtotal; // Total is the selling price (tax already included)
      } else {
        // When tax is exclusive, calculate tax and add it
        taxAmount = subtotal * (ratePercentage / 100);
        totalAmount = subtotal + taxAmount;
      }
    } else {
      // No tax rate selected
      taxAmount = 0;
      totalAmount = subtotal;
    }

    // Additional commission is now a direct value (not percentage-based)
    // Keep as string like unitPrice and sellingPrice - only parse when needed for calculations
    const additionalCommission = item.additionalCommission || "";

    return {
      ...item,
      tax: taxAmount ? taxAmount.toFixed(2) : "",
      totalAmount,
      additionalCommission: additionalCommission, // Keep as string, don't format during input
    } as typeof item;
  };

  // Update line item
  const updateLineItem = (index: number, field: string, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = calculateLineItemTotals({
      ...updatedItems[index],
      [field]: value,
    });

    setLineItems(updatedItems);
  };

  useEffect(() => {
    setLineItems((prev) => prev.map((item) => calculateLineItemTotals(item)));
  }, [isTaxInclusive, gstRates]);

  // Auto-set amount paid to full total when payment status is "paid"
  useEffect(() => {
    if (paymentStatus === "paid") {
      const grandTotal = calculateGrandTotal();
      // In edit mode, set to the difference needed to make it fully paid
      if (isEditMode) {
        const totalNeeded = grandTotal - existingPaidAmount;
        setAmountPaid(totalNeeded > 0 ? totalNeeded.toFixed(2) : "0");
      } else {
        setAmountPaid(grandTotal.toFixed(2));
      }
    }
  }, [paymentStatus, lineItems, discountAmount, isTaxInclusive, gstRates, isEditMode, existingPaidAmount]);

  // Add line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        travelCategory: "other",
        vendor: "",
        serviceProviderId: "",
        packageId: "",
        itemTitle: "",
        invoiceNumber: "",
        voucherNumber: "",
        quantity: "1",
        unitPrice: "",
        sellingPrice: "",
        purchasePrice: "",
        tax: "",
        taxRateId: "",
        additionalCommissionPercentage: "",
        additionalCommission: "",
        totalAmount: 0,
      },
    ]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Calculate subtotal (without tax)
  const calculateSubtotal = () => {
    return lineItems.reduce(
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
    return lineItems.reduce(
      (total, item) => total + parseFloat(item.tax || "0"),
      0,
    );
  };

  // Calculate total additional commission
  const calculateTotalAdditionalCommission = () => {
    return lineItems.reduce(
      (total, item) => total + parseFloat(item.additionalCommission || "0"),
      0,
    );
  };

  // Calculate grand total (subtotal + tax - discount) - commission is NOT included
  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTotalTax();
    const discount = parseFloat(discountAmount || "0");
    return subtotal + tax - discount;
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
  // Only generates expenses for NEW line items (not previously created)
  const generateExpenses = () => {
    return lineItems
      .filter((item, index) => {
        // Only include line items that have purchase price AND are NOT previously created
        const hasPurchasePrice = item.purchasePrice && parseFloat(item.purchasePrice) > 0;
        // Check if this line item was previously created (code level check)
        // Items at indices < previouslyCreatedLineItemCount are previously created
        const isPreviouslyCreated = index < previouslyCreatedLineItemCount;
        return hasPurchasePrice && !isPreviouslyCreated;
      })
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
        
        // Get lead type ID from packageId (packageId is the lead_type_id)
        const leadTypeId = item.packageId && item.packageId !== "" ? parseInt(item.packageId) : null;
        const selectedLeadType = leadTypes.find((lt: any) => lt.id === leadTypeId);
        
        return {
          itemIndex: index,
          title: item.itemTitle || `Expense for ${item.travelCategory || "other"}`,
          purchasePrice: purchasePrice, // Purchase price per unit
          amount: purchasePrice * quantity, // Multiply purchase price by quantity
          category: "other", // Always set category to "other" for new line items
          vendorId: item.vendor !== "none" ? parseInt(item.vendor) : null,
          vendorName: vendor
            ? vendor.companyName || vendor.name
            : "Not specified",
          leadTypeId: leadTypeId, // Use packageId as lead_type_id
          leadTypeName: selectedLeadType?.name || selectedLeadType?.type_name || selectedLeadType?.typeName || "Not specified",
          expenseType: "purchase",
          quantity: quantity,
          invoiceNumber: item.invoiceNumber,
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

  // Get all expense line items from API (flattened)
  const getExistingExpenseLineItems = () => {
    const allLineItems: any[] = [];
    console.log("🔍 getExistingExpenseLineItems - groupedExpenses size:", groupedExpenses.size);
    
    groupedExpenses.forEach((expenseGroup, expenseId) => {
      console.log(`🔍 Processing expense ${expenseId}, lineItems count:`, expenseGroup.lineItems?.length || 0);
      if (expenseGroup.lineItems && Array.isArray(expenseGroup.lineItems)) {
        expenseGroup.lineItems.forEach((lineItem: any) => {
          if (!deletedExpenseLineItemIds.has(lineItem.id)) {
            const editedData = editedExpenseLineItems.get(lineItem.id) || lineItem;
            allLineItems.push({
              ...lineItem,
              ...editedData,
              isFromAPI: true,
              isExisting: true,
            });
          }
        });
      }
    });
    
    console.log("🔍 getExistingExpenseLineItems - returning", allLineItems.length, "line items");
    return allLineItems;
  };

  // Get auto-generated expenses from line items (only NEW ones, not already in API)
  const getNewAutoGeneratedExpenses = () => {
    const existingLineItems = getExistingExpenseLineItems();
    const autoExpenses = generateExpenses();
    
    // Filter out expenses that already exist in API
    // Match by title and purchase price to avoid duplicates
    return autoExpenses.filter((autoExp: any) => {
      // Check if this expense already exists in API expenses
      const exists = existingLineItems.some((existing: any) => {
        // Match by title and purchase price (with some tolerance for floating point)
        const titleMatch = existing.title === autoExp.title || 
                          (existing.title && autoExp.title && 
                           existing.title.toLowerCase().includes(autoExp.title.toLowerCase()));
        const priceMatch = Math.abs(parseFloat(existing.purchasePrice || "0") - parseFloat(autoExp.purchasePrice || "0")) < 0.01;
        return titleMatch && priceMatch;
      });
      return !exists; // Only return if it doesn't exist
    });
  };

  // Combine all expenses for display in ONE unified table
  const getAllExpenses = () => {
    // 1. Existing expense line items from API (editable)
    const existingLineItems = getExistingExpenseLineItems().map((item, idx) => ({
      ...item,
      itemIndex: `E-${idx + 1}`,
      vendorName: item.vendorId
        ? vendors.find((v: any) => v.id.toString() === item.vendorId)?.companyName || "N/A"
        : "N/A",
    }));

    // 2. New auto-generated expenses from line items (only NEW ones)
    const newAutoExpenses = getNewAutoGeneratedExpenses().map((exp, idx) => ({
      ...exp,
      itemIndex: `A-${idx + 1}`,
      isFromAPI: false,
      isExisting: false,
      vendorName: exp.vendorId
        ? vendors.find((v: any) => v.id.toString() === exp.vendorId)?.companyName || "Not specified"
        : "Not specified",
    }));

    // 3. New manual expenses
    const manualExpensesFormatted = manualExpenses
      .filter((exp: any) => !exp.isFromAPI)
      .map((exp, idx) => {
        const purchasePrice = parseFloat(exp.purchasePrice || "0");
        const quantity = parseInt(exp.quantity || "1");
        const amount = purchasePrice * quantity;
        
        return {
          ...exp,
          itemIndex: `M-${idx + 1}`,
          purchasePrice: purchasePrice,
          amount: amount,
          quantity: quantity,
          isFromAPI: false,
          isExisting: false,
          vendorName: exp.vendorId
            ? vendors.find((v: any) => v.id.toString() === exp.vendorId)
              ?.companyName || "Unknown"
            : "Not specified",
        };
      });

    // Combine all into one array
    return [...existingLineItems, ...newAutoExpenses, ...manualExpensesFormatted];
  };

  // Calculate total expenses for profit calculation (includes ALL expenses: auto-generated + from expense page + new from line items)
  const getTotalExpensesForProfit = () => {
    // Start with expenses from API (existing expenses)
    let totalFromAPI = 0;
    if (isEditMode && allExpensesForProfit.length > 0) {
      // Sum up all expenses from API (auto-generated + from expense page)
      totalFromAPI = allExpensesForProfit.reduce((sum: number, exp: any) => {
        // Sum up all line items if they exist, otherwise use expense amount
        if (exp.lineItems && exp.lineItems.length > 0) {
          const lineItemsTotal = exp.lineItems.reduce((lineSum: number, lineItem: any) => {
            return lineSum + parseFloat(lineItem.total_amount || lineItem.amount || "0");
          }, 0);
          return sum + lineItemsTotal;
        }
        return sum + parseFloat(exp.amount || "0");
      }, 0);
    }
    
    // Add new expenses from line items (not yet in API)
    const newExpensesFromLineItems = getNewAutoGeneratedExpenses();
    const totalFromNewLineItems = newExpensesFromLineItems.reduce((sum, exp) => {
      return sum + (parseFloat(exp.amount) || 0);
    }, 0);
    
    // Add manual expenses
    const totalFromManual = manualExpenses.reduce((sum, exp) => {
      const purchasePrice = parseFloat(exp.purchasePrice || "0");
      const quantity = parseInt(exp.quantity || "1");
      const amount = purchasePrice * quantity;
      return sum + amount;
    }, 0);
    
    const total = totalFromAPI + totalFromNewLineItems + totalFromManual;
    console.log("🔍 getTotalExpensesForProfit:", {
      totalFromAPI,
      totalFromNewLineItems,
      totalFromManual,
      total,
      newExpensesCount: newExpensesFromLineItems.length
    });
    
    return total;
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
      // Find the lead type by name to get its ID
      const selectedLeadType = leadTypes.find((lt: any) => 
        (lt.name || lt.type_name || lt.typeName) === value
      );
      const packageId = selectedLeadType ? selectedLeadType.id.toString() : "";
      
      // Update both travelCategory (for display) and packageId (for lead_type_id) in a single update
      const updatedItems = [...lineItems];
      updatedItems[index] = {
        ...updatedItems[index],
        travelCategory: value,
        packageId: packageId,
      };
      setLineItems(updatedItems);
    }
  };

  // Handle vendor selection
  const handleVendorSelection = (value: string, index: number) => {
    if (value === "create_new") {
      setCurrentItemIndex(index);
      setIsVendorPanelOpen(true);
    } else {
      updateLineItem(index, "vendor", value);
    }
  };

  // Handle service provider selection
  const handleServiceProviderSelection = (value: string, index: number) => {
    if (value === "create_new") {
      setCurrentItemIndex(index);
      setIsServiceProviderPanelOpen(true);
    } else {
      updateLineItem(index, "serviceProviderId", value);
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

        const newLineItems = [...lineItems];
        newLineItems[0] = {
          ...newLineItems[0],
          travelCategory: getTravelCategories()[1]?.value || "Tour Package",
          itemTitle:
            bookingPackage ||
            `Booking ${selectedBooking.bookingNumber || selectedBooking.booking_number || selectedBooking.id}`,
          quantity: bookingPassengers.toString(),
          unitPrice: unitPrice.toString(),
          sellingPrice: unitPrice.toString(),
          purchasePrice: purchasePrice.toString(),
          invoiceNumber:
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

        setLineItems(newLineItems);

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

  // Calculate due date based on invoice date and payment terms
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

  // Handle invoice date change
  const handleInvoiceDateChange = (date: string) => {
    setInvoiceDate(date);
    const newDueDate = calculateDueDate(date, paymentTerms, customDays);
    setDueDate(newDueDate);
  };

  // Handle payment terms change
  const handlePaymentTermsChange = (terms: string) => {
    setPaymentTerms(terms);
    const newDueDate = calculateDueDate(invoiceDate, terms, customDays);
    setDueDate(newDueDate);
  };

  // Handle custom days change
  const handleCustomDaysChange = (days: string) => {
    setCustomDays(days);
    if (paymentTerms === "custom") {
      const newDueDate = calculateDueDate(invoiceDate, "custom", days);
      setDueDate(newDueDate);
    }
  };

  // Prepare invoice data for preview
  const prepareInvoiceData = (): InvoiceData | null => {
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

    const invoiceData: InvoiceData = {
      invoiceNumber: invoiceNumber || (() => {
        const prefix = invoiceSettings?.invoiceNumberPrefix || "INV";
        const numberPart = invoiceNumberOnly || formData.get("invoiceNumber") as string || "001";
        return numberPart ? `${prefix}${numberPart}` : `${prefix}001`;
      })(),
      issueDate: invoiceDate,
      dueDate: dueDate,
      customerName: selectedCustomer.name || selectedCustomer.customerName || "Customer",
      customerEmail: selectedCustomer.email || selectedCustomer.customerEmail || "",
      customerPhone: selectedCustomer.phone || selectedCustomer.customerPhone || "",
      customerAddress: selectedCustomer.address || selectedCustomer.customerAddress || "",
      companyName: companyName,
      companyEmail: companyEmail,
      companyPhone: companyPhone,
      companyAddress: tenant?.address || "",
      items: lineItems
        .map((item, originalIndex) => {
          const sellingPrice = parseFloat(item.sellingPrice || "0");
          const quantity = parseInt(item.quantity || "1");
          const totalAmount = parseFloat(item.totalAmount?.toString() || "0");
          const hasTitle = item.itemTitle && item.itemTitle.trim() !== "";
          const hasPrice = sellingPrice > 0;
          const hasTotal = totalAmount > 0;
          const hasLeadType = item.packageId && item.packageId.trim() !== "";
          
          // Include items that have any meaningful data (title, price, total, or lead_type_id)
          if (!hasTitle && !hasPrice && !hasTotal && !hasLeadType) {
            return null;
          }
          
          // Build description from available data
          let description = item.itemTitle?.trim();
          if (!description && hasLeadType) {
            // Try to get lead type name from packageId
            const leadTypeId = item.packageId ? parseInt(item.packageId) : null;
            const leadType = leadTypes.find((lt: any) => lt.id === leadTypeId);
            description = leadType ? (leadType.name || leadType.type_name || leadType.typeName) : item.travelCategory;
          }
          if (!description && item.travelCategory) {
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
      cancellationChargeAmount: paymentStatus === "cancelled" && hasCancellationCharge ? parseFloat(cancellationChargeAmount || "0") : undefined,
      cancellationChargeNotes: paymentStatus === "cancelled" && hasCancellationCharge ? cancellationChargeNotes : undefined,
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

    return invoiceData;
  };

  // Handle preview button click
  const handlePreview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const invoiceData = prepareInvoiceData();
    if (invoiceData) {
      setPreviewInvoiceData(invoiceData);
      setShowPreview(true);
    }
  };

  // Handle actual save from preview
  const handleSaveFromPreview = async () => {
    if (!previewInvoiceData) return;

    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);

    const grandTotal = calculateGrandTotal();
    const discount = parseFloat(discountAmount || "0");
    const finalAmount = grandTotal;

    // Combine auto-generated and manual expenses
    // Separate expenses into:
    // 1. New expenses (to be consolidated into invoice expense)
    // 2. Existing expenses from expense create page (to be kept as separate expenses)
    const invoiceNumber = formData.get("invoiceNumber") as string;
    
    // Auto-generated expenses from line items
    const autoExpenses = generateExpenses().map((expense, index) => {
      const totalAmount = expense.amount || 0;
      const expenseNumber = expense.invoiceNumber || expense.voucherNumber || `${invoiceNumber}-EXP-${index + 1}`;
      
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
        currency: invoiceSettings?.defaultCurrency || "USD",
        taxAmount: 0,
        taxRate: 0,
        amountPaid: 0,
        amountDue: totalAmount,
        status: "pending",
        notes: `Auto-generated from invoice ${invoiceNumber} - ${expense.invoiceNumber || expense.voucherNumber || ""}`,
      };
    });

    // Include edited expense line items from API (excluding deleted ones)
    // Group edited line items by their expense ID
    const expensesWithLineItems: Map<number, any> = new Map();
    
    // First, add all existing expenses with their line items from groupedExpenses
    groupedExpenses.forEach((expenseGroup, expenseId) => {
      const lineItemsForExpense: any[] = [];
      
      // Process line items if they exist
      if (expenseGroup.lineItems && Array.isArray(expenseGroup.lineItems)) {
        expenseGroup.lineItems.forEach((lineItem: any) => {
          // Skip deleted line items
          // Make sure we're using the actual line item ID (positive number from database)
          // Negative IDs are temporary placeholders and should be handled differently
          const lineItemId = lineItem.id;
          if (lineItemId && typeof lineItemId === 'number' && lineItemId > 0 && !deletedExpenseLineItemIds.has(lineItemId)) {
            const editedData = editedExpenseLineItems.get(lineItemId) || lineItem;
            const purchasePrice = parseFloat(editedData.purchasePrice || "0");
            const quantity = parseInt(editedData.quantity || "1");
            const amount = purchasePrice * quantity;
            
            lineItemsForExpense.push({
              id: lineItemId, // Actual line item ID from database (not expense ID)
              expenseId: expenseId, // Include expense ID for reference
              title: editedData.title || "Expense",
              amount: amount,
              quantity: quantity,
              category: "other", // Always set category to "other"
              subcategory: "other", // Always set subcategory to "other"
              vendorId: editedData.vendorId && editedData.vendorId !== "none" ? parseInt(editedData.vendorId) : null,
              leadTypeId: editedData.leadTypeId || (editedData.packageId && editedData.packageId !== "" ? parseInt(editedData.packageId) : null),
              expenseType: "purchase",
              expenseDate: formData.get("issueDate") as string,
              paymentMethod: "bank_transfer",
              currency: invoiceSettings?.defaultCurrency || "USD",
              taxAmount: 0,
              taxRate: 0,
              amountPaid: 0,
              amountDue: amount,
              status: "pending",
              notes: editedData.notes || `Edited expense from invoice ${invoiceNumber}`,
            });
          } else if (lineItemId && lineItemId < 0) {
            // Handle fallback line items (created from expense itself with negative ID)
            // These need to be converted to new line items for existing expense
            const editedData = editedExpenseLineItems.get(lineItemId) || lineItem;
            const purchasePrice = parseFloat(editedData.purchasePrice || "0");
            const quantity = parseInt(editedData.quantity || "1");
            const amount = purchasePrice * quantity;
            
            // New line item for existing expense - no ID but include expenseId
            lineItemsForExpense.push({
              // No id - new line item to be created
              expenseId: expenseId, // Include expense ID so backend knows which expense to add it to
              title: editedData.title || "Expense",
              amount: amount,
              quantity: quantity,
              category: "other", // Always set category to "other"
              subcategory: "other", // Always set subcategory to "other"
              vendorId: editedData.vendorId && editedData.vendorId !== "none" ? parseInt(editedData.vendorId) : null,
              leadTypeId: editedData.leadTypeId || (editedData.packageId && editedData.packageId !== "" ? parseInt(editedData.packageId) : null),
              expenseType: "purchase",
              expenseDate: formData.get("issueDate") as string,
              paymentMethod: "bank_transfer",
              currency: invoiceSettings?.defaultCurrency || "USD",
              taxAmount: 0,
              taxRate: 0,
              amountPaid: 0,
              amountDue: amount,
              status: "pending",
              notes: editedData.notes || `Expense from invoice ${invoiceNumber}`,
            });
          }
        });
      }
      
      // Always include the expense, even if no line items (to preserve the expense)
      // Calculate total amount for the expense
      const totalAmount = lineItemsForExpense.length > 0 
        ? lineItemsForExpense.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
        : parseFloat(expenseGroup.amount || "0") || 0;
      
      expensesWithLineItems.set(expenseId, {
        id: expenseId, // Include expense ID for updates
        title: expenseGroup.title || "Expense",
        amount: totalAmount,
        quantity: lineItemsForExpense.length > 0
          ? lineItemsForExpense.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0)
          : parseFloat(expenseGroup.quantity || "1") || 1,
        category: "other", // Always set category to "other"
        subcategory: "other", // Always set subcategory to "other"
        vendorId: lineItemsForExpense[0]?.vendorId || expenseGroup.vendorId || null,
        leadTypeId: lineItemsForExpense[0]?.leadTypeId || null,
        expenseType: "purchase",
        expenseDate: formData.get("issueDate") as string,
        expenseNumber: expenseGroup.expenseNumber || `${invoiceNumber}-EXP-1`,
        paymentMethod: "bank_transfer",
        currency: invoiceSettings?.defaultCurrency || "USD",
        taxAmount: 0,
        taxRate: 0,
        amountPaid: 0,
        amountDue: totalAmount,
        status: "pending",
        notes: `Expense from invoice ${invoiceNumber}`,
        lineItems: lineItemsForExpense, // Always include line items array (even if empty)
      });
    });
    
    // Also add any expenses from existingExpenses that might not be in groupedExpenses
    // This handles cases where expenses exist but weren't properly loaded into groupedExpenses
    existingExpenses.forEach((exp: any) => {
      const expenseId = exp.id;
      // Only add if not already in expensesWithLineItems
      if (!expensesWithLineItems.has(expenseId)) {
        const lineItems = exp.lineItems || [];
        const lineItemsForExpense: any[] = [];
        
        // Process line items
        lineItems.forEach((lineItem: any) => {
          if (lineItem.id && !deletedExpenseLineItemIds.has(lineItem.id)) {
            const editedData = editedExpenseLineItems.get(lineItem.id) || lineItem;
            const amount = parseFloat(lineItem.total_amount || lineItem.amount || lineItem.totalAmount || "0");
            const quantity = parseInt(lineItem.quantity || "1");
            
            lineItemsForExpense.push({
              id: lineItem.id, // Actual line item ID
              expenseId: expenseId, // Include expense ID for reference
              title: editedData.title || lineItem.title || "Expense",
              amount: amount,
              quantity: quantity,
              category: "other", // Always set category to "other"
              subcategory: "other", // Always set subcategory to "other"
              vendorId: editedData.vendorId && editedData.vendorId !== "none" ? parseInt(editedData.vendorId) : (lineItem.vendor_id || lineItem.vendorId || null),
              leadTypeId: editedData.leadTypeId || lineItem.lead_type_id || lineItem.leadTypeId || null,
              expenseType: "purchase",
              expenseDate: formData.get("issueDate") as string,
              paymentMethod: "bank_transfer",
              currency: invoiceSettings?.defaultCurrency || "USD",
              taxAmount: 0,
              taxRate: 0,
              amountPaid: 0,
              amountDue: amount,
              status: "pending",
              notes: editedData.notes || lineItem.notes || `Expense from invoice ${invoiceNumber}`,
            });
          }
        });
        
        const totalAmount = lineItemsForExpense.length > 0
          ? lineItemsForExpense.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
          : parseFloat(exp.amount || "0") || 0;
        
        expensesWithLineItems.set(expenseId, {
          id: expenseId,
          title: exp.title || "Expense",
          amount: totalAmount,
          quantity: lineItemsForExpense.length > 0
            ? lineItemsForExpense.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0)
            : parseFloat(exp.quantity || "1") || 1,
          category: "other", // Always set category to "other"
          subcategory: "other", // Always set subcategory to "other"
          vendorId: lineItemsForExpense[0]?.vendorId || exp.vendor_id || exp.vendorId || null,
          leadTypeId: lineItemsForExpense[0]?.leadTypeId || exp.lead_type_id || exp.leadTypeId || null,
          expenseType: "purchase",
          expenseDate: formData.get("issueDate") as string,
          expenseNumber: exp.expense_number || exp.expenseNumber || `${invoiceNumber}-EXP-1`,
          paymentMethod: "bank_transfer",
          currency: invoiceSettings?.defaultCurrency || "USD",
          taxAmount: 0,
          taxRate: 0,
          amountPaid: 0,
          amountDue: totalAmount,
          status: "pending",
          notes: exp.notes || `Expense from invoice ${invoiceNumber}`,
          lineItems: lineItemsForExpense, // Always include line items array
        });
      }
    });
    
    // Add new expenses from line items (without expense ID - will be created)
    autoExpenses.forEach((expense, index) => {
      // Use a temporary negative ID to mark as new (will be removed before sending)
      expensesWithLineItems.set(-(index + 1), {
        // No ID - new expense to be created
        title: expense.title,
        amount: expense.amount,
        quantity: expense.quantity || 1,
        category: "other", // Always set category to "other"
        subcategory: "other", // Always set subcategory to "other"
        vendorId: expense.vendorId,
        leadTypeId: expense.leadTypeId,
        expenseType: expense.expenseType,
        expenseDate: formData.get("issueDate") as string,
        expenseNumber: expense.expenseNumber || `${invoiceNumber}-EXP-${index + 1}`,
        paymentMethod: "bank_transfer",
        currency: invoiceSettings?.defaultCurrency || "USD",
        taxAmount: 0,
        taxRate: 0,
        amountPaid: 0,
        amountDue: expense.amount,
        status: "pending",
        notes: expense.notes || `Auto-generated from invoice ${invoiceNumber}`,
        lineItems: [{
          // No ID - new line item to be created
          title: expense.title,
          amount: expense.amount,
          quantity: expense.quantity || 1,
          category: "other", // Always set category to "other"
          vendorId: expense.vendorId,
          leadTypeId: expense.leadTypeId,
          expenseType: expense.expenseType,
          paymentMethod: "bank_transfer",
          taxAmount: 0,
          taxRate: 0,
          amountPaid: 0,
          amountDue: expense.amount,
          status: "pending",
          notes: expense.notes || `Auto-generated from invoice ${invoiceNumber}`,
        }],
      });
    });
    
    // Process manual expenses - if there's an existing expense for this invoice, add manual expenses as line items to it
    // Otherwise, create new expenses
    const newManualExpenses: any[] = [];
    
    // Check if there's an existing expense for this invoice (after processing existing expenses)
    const existingExpenseId = expensesWithLineItems.size > 0 
      ? Array.from(expensesWithLineItems.keys()).find(id => id > 0) // Find first positive (existing) expense ID
      : null;
    
    // Only include expenses that are NOT from API (new expenses being added)
    manualExpenses.filter((expense) => !expense.isFromAPI).forEach((expense) => {
      const purchasePrice = parseFloat(expense.purchasePrice || "0");
      const quantity = parseInt(expense.quantity || "1");
      const amount = purchasePrice * quantity;
      
      // If there's an existing expense, add this as a line item to it instead of creating a new expense
      if (existingExpenseId && existingExpenseId > 0) {
        const existingExpense = expensesWithLineItems.get(existingExpenseId);
        if (existingExpense) {
          // Add as a new line item to the existing expense
          const newLineItem = {
            // No id - new line item to be created
            expenseId: existingExpenseId, // Associate with existing expense
            title: expense.title || "Manual Expense",
            amount: amount,
            quantity: quantity,
            category: "other", // Always set category to "other"
            subcategory: "other", // Always set subcategory to "other"
            vendorId: expense.vendorId && expense.vendorId !== "none" ? parseInt(expense.vendorId) : null,
            leadTypeId: expense.leadTypeId || expense.packageId && expense.packageId !== "" ? parseInt(expense.packageId) : null,
            expenseType: "manual",
            expenseDate: formData.get("issueDate") as string,
            paymentMethod: "bank_transfer",
            currency: invoiceSettings?.defaultCurrency || "USD",
            taxAmount: 0,
            taxRate: 0,
            amountPaid: 0,
            amountDue: amount,
            status: "pending",
            notes: `Manual expense from invoice ${invoiceNumber}`,
          };
          
          // Add to existing expense's line items
          existingExpense.lineItems = existingExpense.lineItems || [];
          existingExpense.lineItems.push(newLineItem);
          
          // Update the expense amount to include the new line item
          existingExpense.amount = (parseFloat(existingExpense.amount?.toString() || "0") || 0) + amount;
          
          // Update the expense in the map
          expensesWithLineItems.set(existingExpenseId, existingExpense);
          
          console.log(`📦 Added manual expense as line item to existing expense ${existingExpenseId}`);
          return; // Skip adding as new expense
        }
      }
      
      // If no existing expense, create a new expense
      newManualExpenses.push({
        title: expense.title || "Manual Expense",
        amount: amount,
        quantity: quantity,
        category: "other", // Always set category to "other"
        subcategory: "other", // Always set subcategory to "other"
        vendorId: expense.vendorId && expense.vendorId !== "none" ? parseInt(expense.vendorId) : null,
        leadTypeId: expense.leadTypeId || expense.packageId && expense.packageId !== "" ? parseInt(expense.packageId) : null,
        expenseType: "manual",
        expenseDate: formData.get("issueDate") as string,
        expenseNumber: expense.expenseNumber || `${invoiceNumber}-MAN-${newManualExpenses.length + 1}`,
        paymentMethod: "bank_transfer",
        currency: invoiceSettings?.defaultCurrency || "USD",
        taxAmount: 0,
        taxRate: 0,
        amountPaid: 0,
        amountDue: amount,
        status: "pending",
        notes: `Manual expense from invoice ${invoiceNumber}`,
      });
    });

    // Add new manual expenses (without expense ID - will be created)
    newManualExpenses.forEach((expense, index) => {
      // Use a temporary negative ID to mark as new (will be removed before sending)
      expensesWithLineItems.set(-(autoExpenses.length + index + 1), {
        // No ID - new expense to be created
        title: expense.title,
        amount: expense.amount,
        quantity: expense.quantity,
        category: "other", // Always set category to "other"
        subcategory: "other", // Always set subcategory to "other"
        vendorId: expense.vendorId,
        leadTypeId: expense.leadTypeId,
        expenseType: expense.expenseType,
        expenseDate: expense.expenseDate,
        expenseNumber: expense.expenseNumber,
        paymentMethod: expense.paymentMethod,
        currency: expense.currency,
        taxAmount: expense.taxAmount,
        taxRate: expense.taxRate,
        amountPaid: expense.amountPaid,
        amountDue: expense.amountDue,
        status: expense.status,
        notes: expense.notes,
        lineItems: [{
          // No ID - new line item to be created
          title: expense.title,
          amount: expense.amount,
          quantity: expense.quantity,
          category: "other", // Always set category to "other"
          vendorId: expense.vendorId,
          leadTypeId: expense.leadTypeId,
          expenseType: expense.expenseType,
          paymentMethod: expense.paymentMethod,
          taxAmount: expense.taxAmount,
          taxRate: expense.taxRate,
          amountPaid: expense.amountPaid,
          amountDue: expense.amountDue,
          status: expense.status,
          notes: expense.notes,
        }],
      });
    });

    // Convert map to array
    // Expenses with positive IDs are existing (for updates)
    // Expenses with negative IDs are new (remove the temporary ID)
    const expenses = Array.from(expensesWithLineItems.values()).map(exp => {
      // If expense ID is negative, it's a new expense (remove the temporary ID)
      if (exp.id < 0) {
        const { id, ...expenseWithoutId } = exp;
        // Ensure lineItems array exists
        if (!expenseWithoutId.lineItems) {
          expenseWithoutId.lineItems = [];
        }
        return expenseWithoutId;
      }
      // Ensure lineItems array exists for existing expenses too
      if (!exp.lineItems) {
        exp.lineItems = [];
      }
      return exp;
    });
    
    console.log("📦 Expenses payload for update:", expenses.map(exp => ({
      id: exp.id || "NEW",
      title: exp.title,
      lineItemsCount: exp.lineItems?.length || 0,
      hasLineItems: !!exp.lineItems,
      lineItems: exp.lineItems?.map((li: any) => ({ id: li.id || "NEW", title: li.title }))
    })));

    // Upload files first if there are any attachments
    let allAttachments: Array<{ name: string; url: string; type?: string }> = [];
    if (invoiceAttachments.length > 0) {
      try {
        const uploadedUrls: Array<{ name: string; url: string; type?: string }> = [];
        
        for (const attachment of invoiceAttachments) {
          const token = auth.getToken();
          // Encode filename to handle special characters (non-ISO-8859-1)
          const encodedFilename = encodeURIComponent(attachment.name);
          
          const uploadResponse = await fetch('/api/objects/store', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Filename': encodedFilename,
              'Content-Type': attachment.type || 'application/octet-stream',
            },
            body: attachment.file,
          });
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Failed to upload ${attachment.name}: ${errorText}`);
          }
          
          const uploadResult = await uploadResponse.json();
          const fileUrl = uploadResult.publicUrl || uploadResult.objectPath || uploadResult.url || uploadResult.location;
          
          if (fileUrl) {
            uploadedUrls.push({
              name: attachment.name,
              url: fileUrl.startsWith('http') ? fileUrl : fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`,
              type: attachment.type,
            });
          }
        }
        
        // Combine existing uploaded attachments with newly uploaded ones
        const existingAttachments = uploadedAttachments.map(a => ({ name: a.name, url: a.url, type: a.type }));
        allAttachments = [...existingAttachments, ...uploadedUrls];
        
        if (uploadedUrls.length > 0) {
          toast({
            title: "Files Uploaded",
            description: `${uploadedUrls.length} file(s) uploaded successfully`,
          });
        }
      } catch (error: any) {
        console.error("Error uploading files:", error);
        toast({
          title: "Upload Error",
          description: `Failed to upload some files: ${error.message}`,
          variant: "destructive",
        });
        // Continue with invoice update even if file upload fails
        // Use existing attachments if upload fails
        allAttachments = uploadedAttachments.map(a => ({ name: a.name, url: a.url, type: a.type }));
      }
    } else {
      // If no new files, just use existing uploaded attachments
      allAttachments = uploadedAttachments.map(a => ({ name: a.name, url: a.url, type: a.type }));
    }

    const invoiceData = {
      invoiceNumber: formData.get("invoiceNumber") as string,
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
      taxAmount: lineItems.reduce(
        (total, item) => total + parseFloat(item.tax || "0"),
        0,
      ),
      discountAmount: discount,
      status: paymentStatus,
      currency: invoiceSettings?.defaultCurrency || "USD",
      hasCancellationCharge: paymentStatus === "cancelled" ? hasCancellationCharge : false,
      cancellationChargeAmount: paymentStatus === "cancelled" && hasCancellationCharge ? parseFloat(cancellationChargeAmount || "0") : 0,
      cancellationChargeNotes: paymentStatus === "cancelled" && hasCancellationCharge ? cancellationChargeNotes : "",
      notes: notesContent || undefined,
      additionalNotes: additionalNotesContent || undefined,
      attachments: allAttachments.length > 0 ? allAttachments : undefined,
      paymentTerms: paymentTerms || undefined,
      paymentMethod: paymentMethod.length > 0 ? paymentMethod : ["credit_card"],
      isTaxInclusive: isTaxInclusive,
      enableReminder,
      reminderFrequency: enableReminder ? reminderFrequency : null,
      reminderSpecificDate: enableReminder && reminderFrequency === "specific_date" ? reminderSpecificDate : null,
      travelDate: travelDate || undefined,
      departureDate: departureDate || undefined,
      arrivalDate: arrivalDate || undefined,
      lineItems: lineItems.map((item) => ({
        ...item,
        quantity: parseInt(item.quantity || "1"),
        unitPrice: parseFloat(item.unitPrice || "0"),
        sellingPrice: parseFloat(item.sellingPrice || "0"),
        purchasePrice: parseFloat(item.purchasePrice || "0"),
        tax: parseFloat(item.tax || "0"),
        additionalCommission: parseFloat(item.additionalCommission || "0"),
        packageId: item.packageId || null,
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

    if (invoiceId) {
      updateInvoiceMutation.mutate(invoiceData);
    } else {
      toast({
        title: "Error",
        description: "Invoice ID is required for editing",
        variant: "destructive",
      });
    }
  };

  const [currency, setCurrency] = useState(invoiceSettings?.defaultCurrency || "USD");

  // Update currency when invoice settings change
  useEffect(() => {
    if (invoiceSettings?.defaultCurrency) {
      setCurrency(invoiceSettings.defaultCurrency);
    }
  }, [invoiceSettings?.defaultCurrency]);

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
      ...(invoiceSettings?.showVendor ? ['minmax(180px, 1.5fr)'] : []), // Vendor - reduced width (flexible, min 180px)
      ...(invoiceSettings?.showProvider ? ['minmax(180px, 1.5fr)'] : []), // Provider - reduced width (flexible, min 180px)
      ...(shouldShowPackageColumnForAnyItem ? ['minmax(180px, 1.5fr)'] : []), // Package - conditional, after Provider
      'minmax(60px, 1fr)', // Pax - small (flexible, min 60px)
      ...(invoiceSettings?.showUnitPrice ? ['minmax(130px, 1fr)'] : []), // Unit Price - small (flexible, min 100px)
      'minmax(130px, 1fr)', // Selling Price - small (flexible, min 100px)
      'minmax(130px, 1fr)', // Purchase Price - small (flexible, min 100px)
      ...(invoiceSettings?.showTax ? ['minmax(100px, 1fr)'] : []), // Tax - small (flexible, min 100px)
      'minmax(100px, 1fr)', // Amount - small (flexible, min 100px)
      ...(invoiceSettings?.showAdditionalCommission ? ['minmax(100px, 1fr)'] : []), // Additional Commission - small (flexible, min 100px)
      ...(invoiceSettings?.showVoucherInvoice ? ['minmax(100px, 1fr)'] : []), // Invoice/Voucher - small (flexible, min 100px)
      '50px', // Delete button - small (fixed)
    ];
    return columns.join(' ');
  }, [invoiceSettings?.showVendor, invoiceSettings?.showProvider, invoiceSettings?.showUnitPrice, invoiceSettings?.showTax, invoiceSettings?.showAdditionalCommission, invoiceSettings?.showVoucherInvoice, shouldShowPackageColumnForAnyItem]);

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

  // Show loading state when fetching invoice data
  if (isEditMode && isLoadingInvoice) {
    return (
      <Layout initialSidebarCollapsed={true}>
        <div className="p-6 max-w-[1600px] mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="text-center">Loading invoice data...</div>
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
                  onClick={() => navigate("/invoices")}
                  data-testid="button-back"
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                {isEditMode && (
                  <h1 className="ml-2 sm:ml-4 font-inter font-medium text-base sm:text-[20px] leading-[24px] text-[#121926] truncate">
                    Edit Invoice
                  </h1>
                )}
              </div>
              {/* <h1 className="font-inter font-medium text-[20px] leading-[24px] text-[#121926]">
                  Leads
                </h1> */}

              <div className="flex gap-2 sm:gap-3 ml-auto">
                {" "}
                {tenant?.id && <InvoiceSettingsPanel tenantId={tenant.id} />}
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
                    Edit Invoice
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Update invoice details and save changes
                  </p>
                </div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {invoiceSettings?.invoiceNumberPrefix || "INV"}
                    </span>
                    <Input
                      data-testid="input-invoice-number"
                      id="invoiceNumber"
                      name="invoiceNumber"
                      value={invoiceNumberOnly}
                      onChange={(e) => {
                        const numberPart = e.target.value;
                        setInvoiceNumberOnly(numberPart);
                        const prefix = invoiceSettings?.invoiceNumberPrefix || "INV";
                        setInvoiceNumber(numberPart ? `${prefix}${numberPart}` : "");
                      }}
                      placeholder="001"
                      required
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              {/* Customer and Invoice Date Row */}
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
                  <Label htmlFor="issueDate">Invoice Date *</Label>
                  <DatePicker
                    value={invoiceDate}
                    onChange={handleInvoiceDateChange}
                    placeholder="Select invoice date"
                    className="w-full"
                  />
                  <input type="hidden" name="issueDate" value={invoiceDate} />
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
                          payment is due 30 days after the invoice date. "Due on Receipt" means
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
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
                      {getPaymentStatusOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="travelDate">Travel Date</Label>
                  <DatePicker
                    value={travelDate}
                    onChange={setTravelDate}
                    placeholder="Select travel date"
                    className="w-full"
                  />
                  <input type="hidden" name="travelDate" value={travelDate} />
                </div>

                <div>
                  <Label htmlFor="departureDate">Departure Date</Label>
                  <DatePicker
                    value={departureDate}
                    onChange={setDepartureDate}
                    placeholder="Select departure date"
                    className="w-full"
                  />
                  <input type="hidden" name="departureDate" value={departureDate} />
                </div>

                <div>
                  <Label htmlFor="arrivalDate">Arrival Date</Label>
                  <DatePicker
                    value={arrivalDate}
                    onChange={setArrivalDate}
                    placeholder="Select arrival date"
                    className="w-full"
                  />
                  <input type="hidden" name="arrivalDate" value={arrivalDate} />
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
                    {invoiceSettings?.showVendor && <div className="flex items-center">Vendor</div>}
                    {invoiceSettings?.showProvider && <div className="flex items-center">Provider</div>}
                    {shouldShowPackageColumnForAnyItem && <div className="flex items-center">Package</div>}
                    <div className="flex items-center">Pax *</div>
                    {invoiceSettings?.showUnitPrice && <div className="flex items-center">Unit Price ({currencySymbol}) *</div>}
                    <div className="flex items-center">Selling Price ({currencySymbol}) *</div>
                    <div className="flex items-center">Purchase Price ({currencySymbol}) *</div>
                    {invoiceSettings?.showTax && <div className="flex items-center">Tax ({currencySymbol})</div>}
                    <div className="flex items-center">Amount ({currencySymbol})</div>
                    {invoiceSettings?.showAdditionalCommission && <div className="flex items-center">Commission ({currencySymbol})</div>}
                    {invoiceSettings?.showVoucherInvoice && <div className="flex items-center">Invoice/Voucher</div>}
                    <div className="flex items-center"></div>
                  </div>

                  {/* Table Body */}
                  {lineItems.map((item, index) => (
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

                      {invoiceSettings?.showVendor && (
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

                      {invoiceSettings?.showProvider && (
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

                      {shouldShowPackageColumn(item.travelCategory) && (
                        <div className="flex items-center">
                          <AutocompleteInput
                            data-testid={`autocomplete-package-${index}`}
                            suggestions={getPackageOptions()}
                            value={item.packageId}
                            onValueChange={(value) =>
                              updateLineItem(index, "packageId", value)
                            }
                            placeholder="Select..."
                            emptyText="No packages found"
                          />
                        </div>
                      )}

                      <div className="flex items-center">
                        <Input
                          data-testid={`input-quantity-${index}`}
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(index, "quantity", e.target.value)
                          }
                          onKeyPress={handleNumericKeyPress}
                          placeholder="1"
                        />
                      </div>

                      {invoiceSettings?.showUnitPrice && (
                        <div className="flex items-center">
                          <Input
                            data-testid={`input-unit-price-${index}`}
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateLineItem(index, "unitPrice", e.target.value)
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
                            updateLineItem(
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
                            updateLineItem(
                              index,
                              "purchasePrice",
                              e.target.value,
                            )
                          }
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0"
                        />
                      </div>

                      {invoiceSettings?.showTax && (
                        <div className="flex items-center">
                          <Select
                            value={item.taxRateId || "none"}
                            onValueChange={(value) =>
                              updateLineItem(index, "taxRateId", value === "none" ? "" : value)
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

                      {invoiceSettings?.showAdditionalCommission && (
                        <div className="flex items-center">
                          <Input
                            data-testid={`input-additional-commission-${index}`}
                            type="text"
                            value={item.additionalCommission || ""}
                            onChange={(e) => {
                              // Allow numeric input with decimals (same as unit price and selling price)
                              const value = e.target.value;
                              // Allow numbers, decimal point, and empty string
                              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                updateLineItem(
                                  index,
                                  "additionalCommission",
                                  value,
                                );
                              }
                            }}
                            onKeyPress={handleNumericKeyPress}
                            placeholder="0.00"
                          />
                        </div>
                      )}

                      {invoiceSettings?.showVoucherInvoice && (
                        <div className="flex items-center">
                          <Input
                            data-testid={`input-line-invoice-number-${index}`}
                            value={item.invoiceNumber}
                            onChange={(e) =>
                              updateLineItem(
                                index,
                                "invoiceNumber",
                                e.target.value,
                              )
                            }
                            placeholder="#"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-center">
                        {lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
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
                  onClick={addLineItem}
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
                    {invoiceSettings?.showTax && (
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

                    {invoiceSettings?.showDiscount && (
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

                    {/* Cancellation Charge Section - Only show when status is cancelled */}
                    {paymentStatus === "cancelled" && (
                      <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                              Cancellation Charge
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="hasCancellationCharge" className="text-sm">
                              Apply Charge
                            </Label>
                            <Switch
                              id="hasCancellationCharge"
                              checked={hasCancellationCharge}
                              onCheckedChange={setHasCancellationCharge}
                            />
                          </div>
                        </div>

                        {hasCancellationCharge && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="cancellationChargeAmount">
                                Cancellation Charge Amount ({currencySymbol})
                              </Label>
                              <Input
                                id="cancellationChargeAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={cancellationChargeAmount}
                                onChange={(e) => setCancellationChargeAmount(e.target.value)}
                                onKeyPress={handleNumericKeyPress}
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cancellationChargeNotes">Notes (Optional)</Label>
                              <Textarea
                                id="cancellationChargeNotes"
                                value={cancellationChargeNotes}
                                onChange={(e) => setCancellationChargeNotes(e.target.value)}
                                placeholder="Enter reason or notes for cancellation charge..."
                                rows={3}
                              />
                            </div>
                          </div>
                        )}
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
                              {reminderFrequency === "daily" && "Customer will receive payment reminders every day until the invoice is paid."}
                              {reminderFrequency === "weekly" && "Customer will receive payment reminders every week until the invoice is paid."}
                              {reminderFrequency === "monthly" && "Customer will receive payment reminders every month until the invoice is paid."}
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

                    {invoiceSettings?.showTax && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-700 dark:text-gray-300">Tax:</span>
                        <span className="font-medium" data-testid="text-tax">
                          {currencySymbol}{calculateTotalTax().toFixed(2)}
                        </span>
                      </div>
                    )}

                    {invoiceSettings?.showDiscount && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-700 dark:text-gray-300">Discount:</span>
                        <span className="font-medium text-gray-900 dark:text-white" data-testid="text-discount">
                          -{currencySymbol}{parseFloat(discountAmount || "0").toFixed(2)}
                        </span>
                      </div>
                    )}

                    {paymentStatus === "cancelled" && hasCancellationCharge && parseFloat(cancellationChargeAmount || "0") > 0 && (
                      <div className="flex justify-between items-center py-2 border-b text-red-600 dark:text-red-400">
                        <span className="text-gray-700 dark:text-gray-300">Cancellation Charge:</span>
                        <span className="font-medium" data-testid="text-cancellation-charge">
                          {currencySymbol}{parseFloat(cancellationChargeAmount || "0").toFixed(2)}
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
              {invoiceSettings?.showNotes && (
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-lg p-2 sm:p-4">
                      <Label htmlFor="notes" className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 block">
                        Notes
                      </Label>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                        Add notes for the invoice.
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
                         It will be hidden to the invoice .
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
                  
                  {/* Single Attachments Section - Below Notes */}
                  <div className="mt-6 pt-6 border-t">
                    <Label className="text-base sm:text-lg font-semibold mb-3 block">
                      Attachments
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Upload files and images to attach to this invoice.
                    </p>
                    
                    {/* Display previously uploaded attachments (read-only) */}
                    {uploadedAttachments.length > 0 && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium mb-2 block">Previously Uploaded Files</Label>
                        <div className="flex flex-wrap gap-2">
                          {uploadedAttachments.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
                            >
                              {attachment.type?.startsWith('image/') ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : attachment.name.toLowerCase().endsWith('.pdf') ? (
                                <FileText className="h-4 w-4" />
                              ) : (
                                <File className="h-4 w-4" />
                              )}
                              <span className="truncate max-w-[200px]">{attachment.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Display selected files (not uploaded yet) */}
                    {invoiceAttachments.length > 0 && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium mb-2 block">Selected Files (will be uploaded on save)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {invoiceAttachments.map((attachment) => {
                            const fileUrl = URL.createObjectURL(attachment.file);
                            return (
                              <div
                                key={attachment.id}
                                className="relative group border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800"
                              >
                                {attachment.type?.startsWith('image/') ? (
                                  <div className="aspect-square">
                                    <img
                                      src={fileUrl}
                                      alt={attachment.name}
                                      className="w-full h-full object-cover"
                                      onLoad={() => URL.revokeObjectURL(fileUrl)}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setInvoiceAttachments(invoiceAttachments.filter(a => a.id !== attachment.id));
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-white bg-red-600 hover:bg-red-700 rounded-full p-2 transition-opacity"
                                        title="Remove"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 flex flex-col items-center justify-center min-h-[100px]">
                                    {attachment.name.toLowerCase().endsWith('.pdf') ? (
                                      <FileText className="h-8 w-8 text-red-600 mb-2" />
                                    ) : (
                                      <File className="h-8 w-8 text-gray-600 mb-2" />
                                    )}
                                    <p className="text-xs text-center text-gray-700 dark:text-gray-300 truncate w-full px-2" title={attachment.name}>
                                      {attachment.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {(attachment.file.size / 1024).toFixed(1)} KB
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setInvoiceAttachments(invoiceAttachments.filter(a => a.id !== attachment.id));
                                      }}
                                      className="mt-2 text-red-600 hover:text-red-800"
                                      title="Remove"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* File Input - Files will be uploaded when invoice is saved */}
                    <div>
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            const newAttachments = files.map((file) => ({
                              id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              file: file,
                              name: file.name,
                              type: file.type,
                            }));
                            setInvoiceAttachments((prev) => [...prev, ...newAttachments]);
                            toast({
                              title: "Files Selected",
                              description: `${files.length} file(s) selected. They will be uploaded when you save the invoice.`,
                            });
                            // Reset input
                            e.target.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          document.getElementById('file-upload')?.click();
                        }}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Select Files ({invoiceAttachments.length})
                      </Button>
                      {invoiceAttachments.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {invoiceAttachments.length} file(s) selected. Files will be uploaded when you save the invoice.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Show expenses section only if we have expenses linked to this invoice */}
              {/* Only show if there are expenses from API (linked to invoice) or new expenses from line items */}
              {(() => {
                const existingExpensesFromAPI = getExistingExpenseLineItems();
                const newExpensesFromLineItems = getNewAutoGeneratedExpenses();
                const allExpenses = getAllExpenses();
                const hasExpenses = allExpenses.length > 0;
                
                console.log("🔍 Expense section check:", {
                  existingExpensesFromAPI: existingExpensesFromAPI.length,
                  newExpensesFromLineItems: newExpensesFromLineItems.length,
                  manualExpenses: manualExpenses.length,
                  allExpenses: allExpenses.length,
                  hasExpenses,
                  groupedExpensesSize: groupedExpenses.size,
                  existingExpensesCount: existingExpenses?.length || 0
                });
                
                return hasExpenses;
              })() && (
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
                  {/* Unified Expenses Table - Shows all expenses in one table */}
                  <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <div className="min-w-[2200px]">
                          {/* Table Header */}
                          <div 
                            className="grid gap-2 border-b p-3 font-medium text-sm bg-gray-50 dark:bg-gray-800"
                            style={{ gridTemplateColumns: expenseGridTemplate }}
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
                          {/* Table Body - All expenses unified */}
                          <div>
                            {getAllExpenses().map((expense: any, idx: number) => {
                              // Handle existing expense line items from API
                              if (expense.isFromAPI && expense.isExisting && expense.id) {
                                const editedData = editedExpenseLineItems.get(expense.id) || expense;
                                const displayItem = { ...expense, ...editedData };
                                
                                return (
                                  <div
                                    key={`existing-${expense.id}`}
                                    className="grid gap-2 p-3 border-b last:border-b-0"
                                    style={{ gridTemplateColumns: expenseGridTemplate }}
                                  >
                                    <div className="flex items-center justify-center">
                                      <span className="font-medium text-sm">{expense.itemIndex || idx + 1}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Input
                                        value={displayItem.title}
                                        onChange={(e) => {
                                          const updated = { ...displayItem, title: e.target.value };
                                          setEditedExpenseLineItems((prev) => {
                                            const newMap = new Map(prev);
                                            newMap.set(expense.id, updated);
                                            return newMap;
                                          });
                                        }}
                                        placeholder="Expense title"
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="flex items-center">
                                      <AutocompleteInput
                                        suggestions={getTravelCategories().filter((cat) => cat.value !== "create_new")}
                                        value={displayItem.category || ""}
                                        onValueChange={(value) => {
                                          // Find lead type by name to get its ID
                                          const selectedLeadType = leadTypes.find((lt: any) => 
                                            (lt.name || lt.type_name || lt.typeName) === value
                                          );
                                          const packageId = selectedLeadType ? selectedLeadType.id.toString() : "";
                                          const updated = { 
                                            ...displayItem, 
                                            category: value,
                                            packageId: packageId,
                                            leadTypeId: selectedLeadType ? selectedLeadType.id : null
                                          };
                                          setEditedExpenseLineItems((prev) => {
                                            const newMap = new Map(prev);
                                            newMap.set(expense.id, updated);
                                            return newMap;
                                          });
                                        }}
                                        placeholder="Category"
                                      />
                                    </div>
                                    <div className="flex items-center">
                                      <AutocompleteInput
                                        suggestions={getVendorOptions().filter((v) => v.value !== "create_new")}
                                        value={displayItem.vendorId || ""}
                                        onValueChange={(value) => {
                                          const updated = { ...displayItem, vendorId: value };
                                          setEditedExpenseLineItems((prev) => {
                                            const newMap = new Map(prev);
                                            newMap.set(expense.id, updated);
                                            return newMap;
                                          });
                                        }}
                                        placeholder="Vendor"
                                      />
                                    </div>
                                    <div className="flex items-center">
                                      <Input
                                        value={displayItem.quantity}
                                        onChange={(e) => {
                                          const quantity = e.target.value;
                                          const purchasePrice = parseFloat(displayItem.purchasePrice || "0");
                                          const amount = (purchasePrice * parseFloat(quantity || "1")).toFixed(2);
                                          const updated = { 
                                            ...displayItem, 
                                            quantity,
                                            amount
                                          };
                                          setEditedExpenseLineItems((prev) => {
                                            const newMap = new Map(prev);
                                            newMap.set(expense.id, updated);
                                            return newMap;
                                          });
                                        }}
                                        onKeyPress={handleNumericKeyPress}
                                        placeholder="1"
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="flex items-center">
                                      <Input
                                        value={displayItem.purchasePrice || ""}
                                        onChange={(e) => {
                                          const purchasePrice = e.target.value;
                                          const quantity = parseFloat(displayItem.quantity || "1");
                                          const amount = (parseFloat(purchasePrice || "0") * quantity).toFixed(2);
                                          const updated = { 
                                            ...displayItem, 
                                            purchasePrice,
                                            amount
                                          };
                                          setEditedExpenseLineItems((prev) => {
                                            const newMap = new Map(prev);
                                            newMap.set(expense.id, updated);
                                            return newMap;
                                          });
                                        }}
                                        onKeyPress={handleNumericKeyPress}
                                        placeholder="0.00"
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="flex items-center">
                                      <span className="font-semibold text-sm">
                                        {currencySymbol}{parseFloat(displayItem.amount || "0").toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setDeletedExpenseLineItemIds((prev) => {
                                            const newSet = new Set(prev);
                                            newSet.add(expense.id);
                                            return newSet;
                                          });
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              }
                              
                              // Handle new expenses (auto-generated or manual)
                              // Find the index in manualExpenses if it's a manual expense
                              const manualExpenseIdx = manualExpenses.findIndex((m: any) => 
                                !m.isFromAPI && m.title === expense.title && parseFloat(m.purchasePrice || "0") === parseFloat(expense.purchasePrice || "0")
                              );
                              
                              // Check if it's a new auto-generated expense (starts with "A-")
                              const isNewAutoGenerated = expense.itemIndex?.startsWith("A-");
                              
                              // For new auto-generated expenses, we need to track them separately
                              // They will be included in the save but we can't edit them directly via manualExpenses
                              // So we'll make them editable but they'll be saved as part of autoExpenses
                              
                              return (
                                <div
                                  key={`new-${expense.itemIndex || idx}`}
                                  className="grid gap-2 p-3 border-b last:border-b-0"
                                  style={{ gridTemplateColumns: expenseGridTemplate }}
                                >
                                  <div className="flex items-center justify-center">
                                    <span className="font-medium text-sm">{expense.itemIndex || idx + 1}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Input
                                      value={expense.title}
                                      onChange={(e) => {
                                        if (manualExpenseIdx >= 0) {
                                          updateManualExpense(manualExpenseIdx, "title", e.target.value);
                                        } else if (isNewAutoGenerated) {
                                          // For auto-generated, update the line item directly
                                          const lineItemIdx = lineItems.findIndex((li: any) => 
                                            li.itemTitle === expense.title || 
                                            (li.purchasePrice && parseFloat(li.purchasePrice) === parseFloat(expense.purchasePrice || "0"))
                                          );
                                          if (lineItemIdx >= 0) {
                                            updateLineItem(lineItemIdx, "itemTitle", e.target.value);
                                          }
                                        }
                                      }}
                                      placeholder="Expense title"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="flex items-center">
                                    <AutocompleteInput
                                      suggestions={getTravelCategories().filter((cat) => cat.value !== "create_new")}
                                      value={expense.category}
                                      onValueChange={(value) => {
                                        if (manualExpenseIdx >= 0) {
                                          updateManualExpense(manualExpenseIdx, "category", value);
                                        } else if (isNewAutoGenerated) {
                                          const lineItemIdx = lineItems.findIndex((li: any) => 
                                            li.itemTitle === expense.title || 
                                            (li.purchasePrice && parseFloat(li.purchasePrice) === parseFloat(expense.purchasePrice || "0"))
                                          );
                                          if (lineItemIdx >= 0) {
                                            updateLineItem(lineItemIdx, "travelCategory", value);
                                          }
                                        }
                                      }}
                                      placeholder="Category"
                                    />
                                  </div>
                                  <div className="flex items-center">
                                    <AutocompleteInput
                                      suggestions={getVendorOptions().filter((v) => v.value !== "create_new")}
                                      value={expense.vendorId || ""}
                                      onValueChange={(value) => {
                                        if (manualExpenseIdx >= 0) {
                                          updateManualExpense(manualExpenseIdx, "vendorId", value);
                                        } else if (isNewAutoGenerated) {
                                          const lineItemIdx = lineItems.findIndex((li: any) => 
                                            li.itemTitle === expense.title || 
                                            (li.purchasePrice && parseFloat(li.purchasePrice) === parseFloat(expense.purchasePrice || "0"))
                                          );
                                          if (lineItemIdx >= 0) {
                                            updateLineItem(lineItemIdx, "vendor", value);
                                          }
                                        }
                                      }}
                                      placeholder="Vendor"
                                    />
                                  </div>
                                  <div className="flex items-center">
                                    <Input
                                      value={expense.quantity}
                                      onChange={(e) => {
                                        if (manualExpenseIdx >= 0) {
                                          updateManualExpense(manualExpenseIdx, "quantity", e.target.value);
                                        } else if (isNewAutoGenerated) {
                                          const lineItemIdx = lineItems.findIndex((li: any) => 
                                            li.itemTitle === expense.title || 
                                            (li.purchasePrice && parseFloat(li.purchasePrice) === parseFloat(expense.purchasePrice || "0"))
                                          );
                                          if (lineItemIdx >= 0) {
                                            updateLineItem(lineItemIdx, "quantity", e.target.value);
                                          }
                                        }
                                      }}
                                      onKeyPress={handleNumericKeyPress}
                                      placeholder="1"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="flex items-center">
                                    <Input
                                      value={expense.purchasePrice || ""}
                                      onChange={(e) => {
                                        if (manualExpenseIdx >= 0) {
                                          updateManualExpense(manualExpenseIdx, "purchasePrice", e.target.value);
                                        } else if (isNewAutoGenerated) {
                                          const lineItemIdx = lineItems.findIndex((li: any) => 
                                            li.itemTitle === expense.title || 
                                            (li.purchasePrice && parseFloat(li.purchasePrice) === parseFloat(expense.purchasePrice || "0"))
                                          );
                                          if (lineItemIdx >= 0) {
                                            updateLineItem(lineItemIdx, "purchasePrice", e.target.value);
                                          }
                                        }
                                      }}
                                      onKeyPress={handleNumericKeyPress}
                                      placeholder="0.00"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="flex items-center">
                                    <span className="font-semibold text-sm">
                                      {currencySymbol}{parseFloat(expense.amount || "0").toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-center">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (manualExpenseIdx >= 0) {
                                          removeManualExpense(manualExpenseIdx);
                                        } else if (isNewAutoGenerated) {
                                          // Remove purchase price from line item to remove it from expenses
                                          const lineItemIdx = lineItems.findIndex((li: any) => 
                                            li.itemTitle === expense.title || 
                                            (li.purchasePrice && parseFloat(li.purchasePrice) === parseFloat(expense.purchasePrice || "0"))
                                          );
                                          if (lineItemIdx >= 0) {
                                            updateLineItem(lineItemIdx, "purchasePrice", "");
                                          }
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                      </div>
                    </div>
                  </div>

                  {/* Total Row */}
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-end items-center gap-4">
                      <span className="text-sm font-medium">Total Expenses:</span>
                      <span className="text-lg font-semibold">
                        {currencySymbol}{getAllExpenses()
                          .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Profit Calculation Section */}
              <div className="mt-6 pt-4">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-gray-900 dark:text-white">💰</span> Profit Analysis
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Left Side - Values */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Total Invoice Amount:</span>
                        <span className="font-semibold text-lg">
                          {currencySymbol}{calculateGrandTotal().toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Total Expenses:</span>
                        <span className="font-semibold text-lg text-gray-900 dark:text-white">
                          -{currencySymbol}
                          {getTotalExpensesForProfit().toFixed(2)}
                        </span>
                        {isEditMode && allExpensesForProfit.length > 0 && (
                          <span className="text-xs text-gray-500 ml-2">
                            (includes expenses from expense page)
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Tax Amount:</span>
                        <span className="font-semibold text-lg text-gray-900 dark:text-white">
                          {currencySymbol}
                          {lineItems.reduce(
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
                            getTotalExpensesForProfit() +
                            calculateTotalAdditionalCommission()
                          ).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                          (Invoice Amount - Expenses) + Commission
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/invoices")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateInvoiceMutation.isPending}
                  data-testid="button-update-invoice"
                >
                  {updateInvoiceMutation.isPending
                    ? "Updating..."
                    : "Update Invoice"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Invoice Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Review your invoice before saving. All invoice data will be displayed as shown below.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewInvoiceData && (
              <>
                {/* Use actual invoice template */}
                <ModernTemplate data={previewInvoiceData} />
                
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
              disabled={updateInvoiceMutation.isPending}
              className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900"
            >
              {updateInvoiceMutation.isPending ? "Updating..." : "Update Invoice"}
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
                updateLineItem(
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
                updateLineItem(
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
                lineItems[currentItemIndex]?.travelCategory
                  ? leadTypes
                    .find(
                      (lt: any) =>
                        lt.name ===
                        lineItems[currentItemIndex].travelCategory,
                    )
                    ?.id.toString()
                  : undefined
              }
              onSuccess={(provider) => {
                queryClient.invalidateQueries({
                  queryKey: [`/api/service-providers`, tenant?.id],
                });
                updateLineItem(
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

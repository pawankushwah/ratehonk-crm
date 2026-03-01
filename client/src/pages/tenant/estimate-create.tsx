import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Upload, FileText, Image, HelpCircle, Download, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { EstimateSettingsPanel } from "@/components/estimate-settings-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { auth } from "@/lib/auth";
import { formatLocalDate, parseLocalDate } from "@/lib/utils";
import { ModernEstimateTemplate, EstimateData } from "@/components/estimates/estimate-templates";

// Estimate interfaces
interface LineItem {
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  leadCategory?: string;
  tax?: number;
  taxRateId?: string;
  discount?: number;
  itineraryId?: string;
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
  manualTotalPrice: string;
  manualTaxRateId?: string;
  depositRequired: boolean;
  depositPercentage: string;
  paymentTerms: string;
  notes: string;
}

export default function EstimateCreate() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const estimateId = params?.id ? parseInt(params.id) : null;
  const isEditMode = !!estimateId;
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

  // Tax inclusive/exclusive toggle
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewEstimateData, setPreviewEstimateData] = useState<EstimateData | null>(null);

  // Attachment files
  const [attachments, setAttachments] = useState<File[]>([]);
  // Existing attachments from database (for edit mode)
  const [existingAttachments, setExistingAttachments] = useState<Array<{filename: string; path: string; size: number; mimetype: string}>>([]);

  // Estimate number state - separate prefix and number
  const [estimateNumberOnly, setEstimateNumberOnly] = useState(""); // Just the number part without prefix

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
    lineItems: [],
    discountPercentage: "0",
    taxPercentage: "0",
    manualTotalPrice: "0",
    manualTaxRateId: "",
    depositRequired: true,
    depositPercentage: "0",
    paymentTerms: "net30",
    notes: "",
  });

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
      // Handle different response formats
      if (Array.isArray(result)) {
        return result;
      } else if (result.customers && Array.isArray(result.customers)) {
        return result.customers;
      } else if (result.data && Array.isArray(result.data)) {
        return result.data;
      } else if (result.rows && Array.isArray(result.rows)) {
        return result.rows;
      }
      return [];
    },
  });

  // Fetch leads
  const { data: leads = [] } = useQuery({
    queryKey: [`/api/leads`, tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch("/api/leads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      // Handle different response formats
      if (Array.isArray(result)) {
        return result;
      } else if (result.leads && Array.isArray(result.leads)) {
        return result.leads;
      } else if (result.data && Array.isArray(result.data)) {
        return result.data;
      } else if (result.rows && Array.isArray(result.rows)) {
        return result.rows;
      }
      return [];
    },
  });

  // Fetch lead types
  const { data: leadTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/lead-types"],
    enabled: !!tenant?.id,
  });

  // Fetch itineraries
  const { data: itineraries = [] } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/itineraries`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/itineraries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.data || [];
    },
  });

  // Fetch existing estimates for title suggestions
  const { data: estimatesResponse } = useQuery<any>({
    queryKey: ["/api/estimates", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch("/api/estimates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        return [];
      }
      const result = await response.json();
      // Handle both old format (array) and new format (object with data and pagination)
      const estimatesList = Array.isArray(result) ? result : (result.data || []);
      
      // Filter by tenant to ensure we only get estimates for current tenant
      // This is a safety check in case the API returns estimates from other tenants
      const tenantEstimates = estimatesList.filter((est: any) => {
        return est.tenantId === tenant?.id || est.tenant_id === tenant?.id;
      });
      
      console.log("🔢 Fetched estimates for number generation:", {
        total: estimatesList.length,
        tenantFiltered: tenantEstimates.length,
        tenantId: tenant?.id,
        sampleEstimate: tenantEstimates[0] ? {
          id: tenantEstimates[0].id,
          estimateNumber: tenantEstimates[0].estimateNumber,
          tenantId: tenantEstimates[0].tenantId || tenantEstimates[0].tenant_id
        } : null
      });
      
      return tenantEstimates;
    },
  });

  // Extract estimates array from response
  const estimates = Array.isArray(estimatesResponse) 
    ? estimatesResponse 
    : (estimatesResponse?.data || []);

  // Track if estimate data has been loaded to prevent re-loading
  const estimateDataLoadedRef = useRef<number | null>(null);

  // Fetch estimate data for editing
  const { data: estimateData, isLoading: isLoadingEstimate, refetch: refetchEstimate } = useQuery({
    queryKey: [`/api/estimates/${estimateId}`, estimateId],
    enabled: !!estimateId && !!tenant?.id,
    queryFn: async () => {
      if (!estimateId) return null;
      const token = auth.getToken();
      // Add timestamp to URL to prevent 304 cached responses
      const url = `/api/estimates/${estimateId}?t=${Date.now()}`;
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
        const freshUrl = `/api/estimates/${estimateId}?t=${Date.now()}`;
        const freshResponse = await fetch(freshUrl, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          cache: 'no-store',
        });
        if (!freshResponse.ok) {
          console.error("Failed to fetch estimate after 304 retry:", freshResponse.status, freshResponse.statusText);
          throw new Error("Failed to fetch estimate");
        }
        const data = await freshResponse.json();
        console.log("Estimate data fetched (raw, after 304 retry):", data);
        return data;
      }
      
      if (!response.ok) throw new Error("Failed to fetch estimate");
      const data = await response.json();
      console.log("Estimate data fetched (raw):", data);
      return data;
    },
    // Force refetch every time to ensure fresh data when editing
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale, so it refetches
    gcTime: 0, // Don't cache, always fetch fresh data (gcTime replaces cacheTime in React Query v5)
    retry: 2, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Fetch estimate settings
  const { data: estimateSettings = {
    estimateNumberStart: 1,
    defaultCurrency: "USD",
    defaultGstSettingId: null,
    showTax: true,
    showDiscount: true,
    showNotes: true,
    showDeposit: true,
    showPaymentTerms: true,
  }, refetch: refetchEstimateSettings } = useQuery({
    queryKey: ["/api/estimate-settings", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const token = auth.getToken();
      const response = await fetch(`/api/estimate-settings/${tenant.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch estimate settings");
      const result = await response.json();
      return result.data;
    },
    enabled: !!tenant?.id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const [selectedTaxSettingId, setSelectedTaxSettingId] = useState<string>("");

  // Helper function to extract number part from full estimate number
  const extractNumberPart = (fullNumber: string, prefix: string): string => {
    if (!fullNumber) return "";
    
    // Normalize prefix for comparison (uppercase, no special chars)
    const normalizedPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Try multiple patterns to extract the number
    // Pattern 1: PREFIX-NUMBER or PREFIX NUMBER (e.g., EST-001, EST 001)
    const matchWithSeparator = fullNumber.match(new RegExp(`^${normalizedPrefix}[\\s-]+(\\d+)`, 'i'));
    if (matchWithSeparator) {
      return matchWithSeparator[1];
    }
    
    // Pattern 2: PREFIXNUMBER (e.g., EST001)
    const matchNoSeparator = fullNumber.match(new RegExp(`^${normalizedPrefix}(\\d+)`, 'i'));
    if (matchNoSeparator) {
      return matchNoSeparator[1];
    }
    
    // Pattern 3: Try to find where prefix ends and numbers start (generic)
    const genericMatch = fullNumber.match(/^[A-Za-z]+(\d+)/);
    if (genericMatch) {
      return genericMatch[1];
    }
    
    // Pattern 4: Just numbers
    const numbersOnly = fullNumber.match(/(\d+)/);
    if (numbersOnly) {
      return numbersOnly[1];
    }
    
    // If no pattern matches, return the original (might be just a number)
    return fullNumber.replace(/[^0-9]/g, '') || fullNumber;
  };

  // Function to generate next estimate number
  const generateNextEstimateNumber = useMemo(() => {
    const startNumber = estimateSettings?.estimateNumberStart || 1;
    const prefix = estimateSettings?.estimateNumberPrefix || "EST";
    
    console.log("🔢 Generating estimate number - estimates count:", estimates?.length, "startNumber:", startNumber, "prefix:", prefix);
    
    if (!estimates || estimates.length === 0) {
      // No existing estimates, use starting number from settings
      const generated = `${prefix}${String(startNumber).padStart(3, '0')}`;
      console.log("🔢 No existing estimates, using start number from settings:", generated);
      return generated;
    }

    // Extract numbers from existing estimate numbers
    // Handle formats like: EST-001, EST001, EST-1, EST1, etc.
    // Also handle cases where estimate_number and estimate_prefix are separate fields
    const estimateNumbers = estimates
      .map((est: any, index: number) => {
        // Try to get estimate number from various field names
        let estNum = est.estimateNumber || est.invoiceNumber || est.estimate_number || "";
        
        // If we have separate prefix and number fields, combine them
        if (!estNum && est.estimate_prefix && est.estimate_number) {
          estNum = `${est.estimate_prefix}${est.estimate_number}`;
        }
        
        if (!estNum) {
          console.log(`🔢 Estimate ${index} (ID: ${est.id}) has no estimate number`);
          return 0;
        }
        
        console.log(`🔢 Processing estimate ${index} (ID: ${est.id}): "${estNum}"`);
        
        // Use the extractNumberPart helper to get the number
        const numberPart = extractNumberPart(estNum, prefix);
        if (numberPart) {
          const num = parseInt(numberPart, 10);
          if (!isNaN(num) && num > 0) {
            console.log(`🔢 Extracted number: ${num} from "${estNum}"`);
            return num;
          }
        }
        
        console.log(`🔢 Could not extract valid number from: "${estNum}"`);
        return 0;
      })
      .filter((num: number) => num > 0);

    console.log("🔢 Extracted estimate numbers:", estimateNumbers);

    // Find the highest number from existing estimates
    const maxNumber = estimateNumbers.length > 0 
      ? Math.max(...estimateNumbers) 
      : 0;

    console.log("🔢 Max number from existing estimates:", maxNumber, "Start number from settings:", startNumber);

    // If we have existing estimates, increment from the highest
    // If no valid numbers found, use start number
    // Otherwise, use the higher of: (maxNumber + 1) or startNumber
    let nextNumber: number;
    if (estimateNumbers.length === 0) {
      // No valid estimate numbers found, use start number
      nextNumber = startNumber;
      console.log("🔢 No valid estimate numbers found, using start number:", nextNumber);
    } else {
      // We have valid estimate numbers, increment from the highest
      // But ensure we don't go below the start number
      nextNumber = Math.max(maxNumber + 1, startNumber);
      console.log("🔢 Incrementing from max number:", maxNumber, "-> next:", nextNumber);
    }
    
    // Return without dash: EST001 instead of EST-001
    const generated = `${prefix}${String(nextNumber).padStart(3, '0')}`;
    console.log("🔢 Final generated estimate number:", generated);
    return generated;
  }, [estimates, estimateSettings?.estimateNumberStart, estimateSettings?.estimateNumberPrefix]);

  // Update currency and tax setting when settings load
  useEffect(() => {
    if (estimateSettings?.defaultCurrency && !isEditMode) {
      setFormData((prev) => ({ ...prev, currency: estimateSettings.defaultCurrency }));
    }
    if (estimateSettings?.defaultGstSettingId) {
      setSelectedTaxSettingId(estimateSettings.defaultGstSettingId.toString());
    }
  }, [estimateSettings?.defaultCurrency, estimateSettings?.defaultGstSettingId, isEditMode]);

  // Reset the loaded flag and force refetch when estimateId changes
  useEffect(() => {
    if (estimateId) {
      const previousEstimateId = estimateDataLoadedRef.current;
      if (previousEstimateId !== estimateId) {
        console.log("🔄 Estimate ID changed from", previousEstimateId, "to", estimateId);
        estimateDataLoadedRef.current = null; // Reset before refetch
        // Force refetch when estimateId changes
        if (isEditMode && refetchEstimate) {
          console.log("🔄 Forcing refetch for new estimate ID:", estimateId);
          setTimeout(() => {
            refetchEstimate();
          }, 100);
        }
      }
    } else {
      // Reset when not in edit mode
      estimateDataLoadedRef.current = null;
    }
  }, [estimateId, isEditMode, refetchEstimate]);

  // Load estimate data into form when editing
  useEffect(() => {
    // Validate that we have valid estimate data
    const estimate = estimateData as any;
    const hasValidData = estimate && 
                        typeof estimate === 'object' && 
                        Object.keys(estimate).length > 0 &&
                        (estimate.id || estimate.title || estimate.totalAmount !== undefined);
    
    // Check if lineItems are empty or don't have the expected data
    const lineItemsEmpty = !estimate?.lineItems || 
                          (Array.isArray(estimate.lineItems) && estimate.lineItems.length === 0) ||
                          (formData.lineItems.length === 0 && estimate?.lineItems?.length > 0);
    
    // Only load if we have valid data, not loading, and either:
    // 1. Haven't loaded this estimate yet (ref doesn't match), OR
    // 2. Line items are empty even though we have data (fallback case)
    const shouldLoad = isEditMode && 
                      hasValidData && 
                      !isLoadingEstimate && 
                      (estimateDataLoadedRef.current !== estimateId || lineItemsEmpty);
    
    console.log("🔍 Estimate data loading check:", {
      isEditMode,
      hasValidData,
      isLoadingEstimate,
      currentRef: estimateDataLoadedRef.current,
      estimateId,
      lineItemsEmpty,
      shouldLoad,
      estimateDataKeys: estimateData ? Object.keys(estimateData).length : 0,
      estimateDataTitle: estimateData?.title,
      formLineItemsLength: formData.lineItems.length,
      dataLineItemsLength: estimateData?.lineItems?.length || 0,
    });
    
    if (shouldLoad) {
      estimateDataLoadedRef.current = estimateId; // Mark as loaded BEFORE setting data
      console.log("🔄 Loading estimate data into form:", estimate);
      console.log("Line items:", estimate.lineItems);
      
      const leadIdValue = estimate.leadId ? estimate.leadId.toString() : "";
      const customerIdValue = estimate.customerId ? estimate.customerId.toString() : "";
      
      setFormData({
        title: estimate.title || "",
        selectedLeadId: leadIdValue,
        selectedCustomerId: customerIdValue,
        customerName: estimate.customerName || "",
        customerEmail: estimate.customerEmail || "",
        customerPhone: estimate.customerPhone || "",
        invoiceNumber: estimate.invoiceNumber || estimate.estimateNumber || "",
        currency: estimate.currency || "USD",
        validUntil: estimate.validUntil ? formatLocalDate(parseLocalDate(estimate.validUntil)) : "",
        lineItems: estimate.lineItems?.map((item: any) => {
          const taxValue = (item.tax !== null && item.tax !== undefined && item.tax !== "") 
            ? parseFloat(item.tax) 
            : 0;
          const discountValue = (item.discount !== null && item.discount !== undefined && item.discount !== "") 
            ? parseFloat(item.discount) 
            : 0;
          const taxRateIdValue = (item.taxRateId !== null && item.taxRateId !== undefined && item.taxRateId !== "") 
            ? item.taxRateId.toString() 
            : "";
          
          console.log("Mapping line item:", {
            original: item,
            tax: taxValue,
            discount: discountValue,
            taxRateId: taxRateIdValue
          });
          
          return {
            itemName: item.itemName || "",
            description: item.description || "",
            quantity: item.quantity || 1,
            unitPrice: parseFloat(item.unitPrice || 0),
            totalPrice: parseFloat(item.totalPrice || 0),
            leadCategory: item.category || "",
            tax: taxValue,
            taxRateId: taxRateIdValue,
            discount: discountValue,
          };
        }) || [],
        discountPercentage: estimate.discountPercentage ? estimate.discountPercentage.toString() : "0",
        taxPercentage: estimate.taxRate ? estimate.taxRate.toString() : "0",
        manualTotalPrice: estimate.manualTotalPrice ? estimate.manualTotalPrice.toString() : "0",
        manualTaxRateId: estimate.manualTaxRateId ? estimate.manualTaxRateId.toString() : "",
        depositRequired: estimate.depositRequired ?? true,
        depositPercentage: estimate.depositPercentage ? estimate.depositPercentage.toString() : "0",
        paymentTerms: estimate.paymentTerms || "net30",
        notes: estimate.notes || "",
      });
      
      // Load attachments if they exist
      if (estimate.attachments && Array.isArray(estimate.attachments) && estimate.attachments.length > 0) {
        // Store attachment info in state for display
        setExistingAttachments(estimate.attachments);
      } else {
        setExistingAttachments([]);
      }
      
      if (estimate.lineItems && estimate.lineItems.length > 0) {
        setShowLineItems(true);
      }
      
      // Extract and set estimate number part for display
      if (estimate.estimateNumber || estimate.invoiceNumber || estimate.estimate_number) {
        const prefix = estimateSettings?.estimateNumberPrefix || "EST";
        // Try multiple field names for estimate number
        const fullNumber = estimate.estimateNumber || estimate.invoiceNumber || estimate.estimate_number || "";
        if (fullNumber) {
          const numberPart = extractNumberPart(fullNumber, prefix);
          console.log("🔢 Extracting estimate number for edit mode:", {
            fullNumber,
            prefix,
            extractedNumber: numberPart,
            estimateId: estimate.id
          });
          setEstimateNumberOnly(numberPart);
          // Also update formData.invoiceNumber to keep it in sync
          setFormData((prev) => ({
            ...prev,
            invoiceNumber: fullNumber,
          }));
        }
      }
    }
  }, [estimateData, isEditMode, isLoadingEstimate, estimateId, tenant?.id, refetchEstimate, formData.lineItems.length, estimateSettings?.estimateNumberPrefix]);
  
  // Track if we've already triggered the selection handlers to avoid infinite loops
  const hasTriggeredSelection = useRef(false);

  // Separate effect to trigger selection handlers once customers/leads are loaded
  // This ensures the dropdowns show the correct selected values and populate customer/lead details
  useEffect(() => {
    // Reset the flag when estimateId changes (new estimate being edited)
    if (!isEditMode || !estimateId) {
      hasTriggeredSelection.current = false;
      return;
    }

    if (estimateData && !isLoadingEstimate && !hasTriggeredSelection.current) {
      const estimate = estimateData;
      const customerIdValue = estimate.customerId ? estimate.customerId.toString() : "";
      const leadIdValue = estimate.leadId ? estimate.leadId.toString() : "";
      
      // Wait for both customers and leads lists to be available (or no selection needed)
      const customersReady = customerIdValue === "" || customers.length > 0;
      const leadsReady = leadIdValue === "" || leads.length > 0;
      
      if (customersReady && leadsReady) {
        let timer1: ReturnType<typeof setTimeout> | null = null;
        let timer2: ReturnType<typeof setTimeout> | null = null;
        
        // Check customer selection separately
        if (customerIdValue && customerIdValue !== "none") {
          const customer = customers.find((c: any) => String(c.id) === customerIdValue);
          if (customer) {
            // Use a small delay to avoid race conditions
            timer1 = setTimeout(() => {
              handleCustomerSelection(customerIdValue);
            }, 100);
          }
        }
        
        // Check lead selection separately (not else if, so both can be checked)
        if (leadIdValue && leadIdValue !== "none") {
          const lead = leads.find((l: any) => String(l.id) === leadIdValue);
          if (lead) {
            // Use a slightly longer delay if customer was also set
            timer2 = setTimeout(() => {
              handleLeadSelection(leadIdValue);
            }, customerIdValue && customerIdValue !== "none" ? 200 : 100);
          }
        }
        
        // Mark as triggered to avoid re-running
        hasTriggeredSelection.current = true;
        
        return () => {
          if (timer1) clearTimeout(timer1);
          if (timer2) clearTimeout(timer2);
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, estimateData, isLoadingEstimate, customers.length, leads.length, estimateId]);

  // Track the last starting number used for auto-generation
  const lastStartingNumber = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  // Auto-generate ref no when estimates/settings are loaded
  useEffect(() => {
    const currentStartNumber = estimateSettings?.estimateNumberStart || 1;
    const prefix = estimateSettings?.estimateNumberPrefix || "EST";
    
    // Wait for both estimates and settings to be loaded
    if (generateNextEstimateNumber && estimateSettings && (estimates !== undefined)) {
      // Check if starting number changed
      const startingNumberChanged = lastStartingNumber.current !== null && 
                                   lastStartingNumber.current !== currentStartNumber;
      
      // On first initialization, always update (even if field has a value)
      // After that, update if field is empty OR starting number changed
      const shouldUpdate = !hasInitialized.current || 
                          !formData.invoiceNumber || 
                          startingNumberChanged;
      
      if (shouldUpdate) {
        lastStartingNumber.current = currentStartNumber;
        hasInitialized.current = true;
        const fullNumber = generateNextEstimateNumber;
        setFormData((prev) => ({ ...prev, invoiceNumber: fullNumber }));
        // Extract and set just the number part
        const numberPart = extractNumberPart(fullNumber, prefix);
        console.log("🔢 Setting estimate number:", {
          fullNumber,
          prefix,
          extractedNumberPart: numberPart,
          shouldUpdate,
          hasInitialized: hasInitialized.current
        });
        setEstimateNumberOnly(numberPart);
      }
    } else if (estimateSettings?.estimateNumberStart && !hasInitialized.current) {
      // Initialize lastStartingNumber even if generateNextEstimateNumber isn't ready yet
      lastStartingNumber.current = estimateSettings.estimateNumberStart;
    }
  }, [generateNextEstimateNumber, estimateSettings?.estimateNumberStart, estimateSettings?.estimateNumberPrefix, estimates, formData.invoiceNumber]);

  // Sync estimateNumberOnly when invoiceNumber changes (for edit mode or manual changes)
  useEffect(() => {
    if (formData.invoiceNumber) {
      const prefix = estimateSettings?.estimateNumberPrefix || "EST";
      const numberPart = extractNumberPart(formData.invoiceNumber, prefix);
      if (numberPart !== estimateNumberOnly) {
        console.log("🔢 Syncing estimateNumberOnly:", {
          invoiceNumber: formData.invoiceNumber,
          prefix,
          extractedNumber: numberPart,
          currentEstimateNumberOnly: estimateNumberOnly
        });
        setEstimateNumberOnly(numberPart);
      }
    } else if (!formData.invoiceNumber && estimateNumberOnly) {
      // Clear number part if estimate number is cleared
      setEstimateNumberOnly("");
    }
  }, [formData.invoiceNumber, estimateSettings?.estimateNumberPrefix]); // Note: intentionally not including estimateNumberOnly to avoid loops

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

  // Calculate grid template columns dynamically (matching invoice-create design)
  const gridTemplate = useMemo(() => {
    const columns = [
      '30px', // # column - smaller (fixed)
      'minmax(250px, 2fr)', // Category - bigger (flexible, min 250px)
      'minmax(250px, 2fr)', // Service/Description - bigger (flexible, min 250px)
      'minmax(60px, 1fr)', // Qty - small (flexible, min 60px)
      'minmax(130px, 1fr)', // Price - small (flexible, min 130px)
      'minmax(100px, 1fr)', // Tax Rate - small (flexible, min 100px)
      'minmax(100px, 1fr)', // Discount - small (flexible, min 100px)
      'minmax(100px, 1fr)', // Total - small (flexible, min 100px)
      '50px', // Delete button - small (fixed)
    ];
    return columns.join(' ');
  }, []);

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

  // Get current currency from estimate settings
  const currentCurrency = estimateSettings?.defaultCurrency || formData.currency || "USD";
  const currencySymbol = getCurrencySymbol(currentCurrency);

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
      const customer = customers.find((c: any) => String(c.id) === customerId);
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
      const lead = leads.find((l: any) => String(l.id) === leadId);
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

  const addLineItemFromItinerary = (itinerary: any) => {
    const price = parseFloat(itinerary.clientPrice || itinerary.client_price || "0") || 0;
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          itemName: itinerary.title || "Itinerary",
          description: `Itinerary: ${itinerary.title || "Travel plan"}`,
          quantity: 1,
          unitPrice: price,
          totalPrice: price,
          leadCategory: "",
          tax: 0,
          discount: 0,
          itineraryId: String(itinerary.id),
        },
      ],
    }));
    setShowLineItems(true);
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
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate total price for this line item
    const item = updatedItems[index];
    const unitPrice = parseFloat(item.unitPrice?.toString() || "0") || 0;
    const quantity = parseInt(item.quantity?.toString() || "1") || 1;
    let tax = 0;
    const discount = parseFloat(item.discount?.toString() || "0") || 0;

    // Calculate tax from tax rate if taxRateId is set
    if (field === "taxRateId" || field === "unitPrice" || field === "quantity" || field === "discount") {
      if (item.taxRateId) {
        const selectedRate = gstRates.find(
          (rate: any) => rate.id?.toString() === item.taxRateId
        );
        if (selectedRate) {
          // Try ratePercentage first, then fallback to rate
          const ratePercentage = parseFloat(selectedRate.ratePercentage || selectedRate.rate || "0");
          const subtotal = unitPrice * quantity;
          const afterDiscount = subtotal - discount;
          
          if (isTaxInclusive) {
            // When tax is inclusive, tax is already in the price
            // Calculate: subtotal = amount / (1 + rate/100), tax = amount - subtotal
            const amount = afterDiscount;
            const baseAmount = amount / (1 + ratePercentage / 100);
            tax = amount - baseAmount;
          } else {
            // When tax is exclusive, calculate tax and add it
            tax = (afterDiscount * ratePercentage) / 100;
          }
          updatedItems[index].tax = tax;
        }
      } else {
        updatedItems[index].tax = 0;
        tax = 0;
      }
    } else {
      // Use existing tax value if not recalculating
      tax = parseFloat(item.tax?.toString() || "0") || 0;
    }

    const subtotal = unitPrice * quantity;
    const afterDiscount = subtotal - discount;
    const total = isTaxInclusive ? afterDiscount : afterDiscount + tax;

    updatedItems[index].totalPrice = total;

    setFormData((prev) => ({ ...prev, lineItems: updatedItems }));
  };

  // Recalculate all line items when tax inclusive setting changes
  useEffect(() => {
    if (gstRates.length === 0) return;
    
    const recalculatedItems = formData.lineItems.map((item) => {
      const unitPrice = parseFloat(item.unitPrice?.toString() || "0") || 0;
      const quantity = parseInt(item.quantity?.toString() || "1") || 1;
      const discount = parseFloat(item.discount?.toString() || "0") || 0;
      let tax = 0;
      
      if (item.taxRateId) {
        const selectedRate = gstRates.find(
          (rate: any) => rate.id?.toString() === item.taxRateId
        );
        if (selectedRate) {
          // Try ratePercentage first, then fallback to rate
          const ratePercentage = parseFloat(selectedRate.ratePercentage || selectedRate.rate || "0");
          const subtotal = unitPrice * quantity;
          const afterDiscount = subtotal - discount;
          
          if (isTaxInclusive) {
            const amount = afterDiscount;
            const baseAmount = amount / (1 + ratePercentage / 100);
            tax = amount - baseAmount;
          } else {
            tax = (afterDiscount * ratePercentage) / 100;
          }
        }
      }
      
      const subtotal = unitPrice * quantity;
      const afterDiscount = subtotal - discount;
      const total = isTaxInclusive ? afterDiscount : afterDiscount + tax;
      
      return {
        ...item,
        tax: tax,
        totalPrice: total,
      };
    });
    
    setFormData((prev) => ({ ...prev, lineItems: recalculatedItems }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTaxInclusive]);

  // Calculate totals
  const totals = useMemo(() => {
    // If there are no line items, use manual total price
    if (formData.lineItems.length === 0) {
      const manualTotal = parseFloat(formData.manualTotalPrice || "0") || 0;
      
      // Apply discount percentage to the manual total
      const discountAmount =
        (manualTotal * parseFloat(formData.discountPercentage || "0")) / 100;
      const afterDiscount = manualTotal - discountAmount;

      // Calculate tax based on selected tax rate
      let taxAmount = 0;
      if (formData.manualTaxRateId && gstRates.length > 0) {
        const selectedRate = gstRates.find(
          (rate: any) => rate.id?.toString() === formData.manualTaxRateId
        );
        if (selectedRate) {
          // Try ratePercentage first, then fallback to rate
          const ratePercentage = parseFloat(selectedRate.ratePercentage || selectedRate.rate || "0");
          if (isTaxInclusive) {
            // Tax is already included, so show 0
            taxAmount = 0;
          } else {
            // Calculate tax on the amount after discount
            taxAmount = (afterDiscount * ratePercentage) / 100;
          }
        }
      }

      const total = isTaxInclusive ? afterDiscount : afterDiscount + taxAmount;

      return {
        subtotal: afterDiscount,
        discountAmount,
        taxAmount,
        total,
      };
    }

    // When there are line items, use existing logic
    if (isTaxInclusive) {
      // When tax is inclusive, totalPrice already includes tax
      // Subtotal = sum of all line items' totalPrice (after item-level discount)
      const lineItemsTotal = formData.lineItems.reduce((sum, item) => {
        return sum + (parseFloat(item.totalPrice?.toString() || "0") || 0);
      }, 0);

      // Apply discount percentage to the total
      const discountAmount =
        (lineItemsTotal * parseFloat(formData.discountPercentage || "0")) / 100;
      const subtotal = lineItemsTotal - discountAmount;

      // Tax is already included in the price, so show 0
      const taxAmount = 0;
      const total = subtotal; // Total equals subtotal (tax already included)

      return {
        subtotal,
        discountAmount,
        taxAmount,
        total,
      };
    } else {
      // When tax is exclusive, calculate subtotal without tax
      const lineItemsSubtotal = formData.lineItems.reduce((sum, item) => {
        const unitPrice = parseFloat(item.unitPrice?.toString() || "0") || 0;
        const quantity = parseInt(item.quantity?.toString() || "1") || 1;
        const discount = parseFloat(item.discount?.toString() || "0") || 0;
        const subtotal = unitPrice * quantity;
        const afterDiscount = subtotal - discount;
        return sum + afterDiscount;
      }, 0);

      // Apply discount percentage to subtotal
      const discountPercentage = parseFloat(formData.discountPercentage || "0");
      const discountAmount = (lineItemsSubtotal * discountPercentage) / 100;
      const afterDiscount = lineItemsSubtotal - discountAmount;

      // Recalculate tax on the discounted amount
      // Tax should be calculated on the amount after discount, not on original prices
      let taxAmount = 0;
      if (gstRates.length > 0 && discountPercentage > 0) {
        // Recalculate tax for each line item based on discounted amount
        formData.lineItems.forEach((item) => {
          if (item.taxRateId) {
            const selectedRate = gstRates.find(
              (rate: any) => rate.id?.toString() === item.taxRateId
            );
            if (selectedRate) {
              const unitPrice = parseFloat(item.unitPrice?.toString() || "0") || 0;
              const quantity = parseInt(item.quantity?.toString() || "1") || 1;
              const itemDiscount = parseFloat(item.discount?.toString() || "0") || 0;
              const itemSubtotal = unitPrice * quantity;
              const itemAfterItemDiscount = itemSubtotal - itemDiscount;
              
              // Apply summary discount percentage to this item's amount
              const itemSummaryDiscount = (itemAfterItemDiscount * discountPercentage) / 100;
              const itemFinalAmount = itemAfterItemDiscount - itemSummaryDiscount;
              
              // Try ratePercentage first, then fallback to rate
              const ratePercentage = parseFloat(selectedRate.ratePercentage || selectedRate.rate || "0");
              taxAmount += (itemFinalAmount * ratePercentage) / 100;
            }
          }
        });
      } else {
        // No discount or no rates: use existing tax from line items
        taxAmount = formData.lineItems.reduce((sum, item) => {
          return sum + (parseFloat(item.tax?.toString() || "0") || 0);
        }, 0);
        
        // If there's a discount but we're using existing tax, reduce tax proportionally
        if (discountPercentage > 0 && lineItemsSubtotal > 0) {
          const discountRatio = afterDiscount / lineItemsSubtotal;
          taxAmount = taxAmount * discountRatio;
        }
      }

      const total = afterDiscount + taxAmount;

      return {
        subtotal: afterDiscount,
        discountAmount,
        taxAmount,
        total,
      };
    }
  }, [formData.lineItems, formData.discountPercentage, formData.manualTotalPrice, formData.manualTaxRateId, isTaxInclusive, gstRates]);

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

  // Prepare estimate data for preview
  const prepareEstimateData = (): EstimateData | null => {
    const selectedCustomer = customers.find((c: any) => c.id.toString() === formData.selectedCustomerId);
    const selectedLead = leads.find((l: any) => l.id.toString() === formData.selectedLeadId);
    const customer = selectedCustomer || selectedLead;
    
    if (!customer && !formData.customerName) {
      toast({
        title: "Error",
        description: "Please select a customer or enter customer information",
        variant: "destructive",
      });
      return null;
    }

    // Get company info from tenant or use defaults
    const companyName = tenant?.companyName || "Company Name";
    const companyEmail = tenant?.contactEmail || "company@example.com";
    const companyPhone = tenant?.contactPhone || "";

    // Prepare line items
    const items = formData.lineItems
      .filter((item) => {
        const hasName = item.itemName && item.itemName.trim() !== "";
        const hasDescription = item.description && item.description.trim() !== "";
        const hasPrice = parseFloat(item.unitPrice?.toString() || "0") > 0;
        const hasTotal = parseFloat(item.totalPrice?.toString() || "0") > 0;
        return hasName || hasDescription || hasPrice || hasTotal;
      })
      .map((item) => {
        const description = item.itemName || item.description || "Service";
        const quantity = parseInt(item.quantity?.toString() || "1") || 1;
        const unitPrice = parseFloat(item.unitPrice?.toString() || "0") || 0;
        const totalPrice = parseFloat(item.totalPrice?.toString() || "0") || (unitPrice * quantity);
        const category = item.leadCategory || "";
        const discount = parseFloat(item.discount?.toString() || "0") || 0;
        
        // Get tax rate name if taxRateId is set
        let taxRate = "";
        if (item.taxRateId && gstRates.length > 0) {
          const selectedRate = gstRates.find(
            (rate: any) => rate.id?.toString() === item.taxRateId
          );
          if (selectedRate) {
            const ratePercentage = parseFloat(selectedRate.ratePercentage || selectedRate.rate || "0");
            taxRate = selectedRate.rateName || `${ratePercentage}%`;
          }
        }
        
        return {
          description,
          category,
          quantity,
          unitPrice,
          taxRate,
          discount,
          totalPrice,
        };
      });

    // If no line items, create a single item from manual total price
    const finalItems = items.length > 0 ? items : [{
      description: "Service",
      category: "",
      quantity: 1,
      unitPrice: totals.subtotal,
      taxRate: formData.manualTaxRateId && gstRates.length > 0
        ? (() => {
            const selectedRate = gstRates.find(
              (rate: any) => rate.id?.toString() === formData.manualTaxRateId
            );
            if (selectedRate) {
              const ratePercentage = parseFloat(selectedRate.ratePercentage || selectedRate.rate || "0");
              return selectedRate.rateName || `${ratePercentage}%`;
            }
            return "";
          })()
        : "",
      discount: 0,
      totalPrice: totals.subtotal,
    }];

    const estimateData: EstimateData = {
      estimateNumber: (() => {
        const prefix = estimateSettings?.estimateNumberPrefix || "EST";
        const numberPart = estimateNumberOnly || extractNumberPart(formData.invoiceNumber || "", prefix) || "001";
        return numberPart ? `${prefix}${numberPart}` : `${prefix}001`;
      })(),
      validUntil: formData.validUntil || "",
      customerName: customer 
        ? (customer.name || customer.customerName || customer.firstName + " " + customer.lastName || customer.leadName || "Customer")
        : formData.customerName || "Customer",
      customerEmail: customer 
        ? (customer.email || customer.emailAddress || customer.customerEmail || "")
        : formData.customerEmail || "",
      customerPhone: customer 
        ? (customer.phone || customer.phoneNumber || customer.contactNumber || customer.customerPhone || "")
        : formData.customerPhone || "",
      customerAddress: customer?.address || customer?.customerAddress || "",
      companyName: companyName,
      companyEmail: companyEmail,
      companyPhone: companyPhone,
      companyAddress: tenant?.address || "",
      items: finalItems,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: totals.discountAmount,
      totalAmount: totals.total,
      currency: currentCurrency,
      notes: formData.notes || undefined,
      paymentTerms: formData.paymentTerms || undefined,
      depositRequired: formData.depositRequired,
      depositAmount: formData.depositRequired 
        ? (totals.total * parseFloat(formData.depositPercentage || "0")) / 100
        : undefined,
      depositPercentage: formData.depositRequired 
        ? parseFloat(formData.depositPercentage || "0")
        : undefined,
    };

    return estimateData;
  };

  // Handle preview button click
  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    const estimateData = prepareEstimateData();
    if (estimateData) {
      setPreviewEstimateData(estimateData);
      setShowPreview(true);
    }
  };

  // Handle actual save from preview
  const handleSaveFromPreview = async () => {
    if (!previewEstimateData) return;
    createMutation.mutate(formData);
  };

  // Create/Update estimate mutation
  const createMutation = useMutation({
    mutationFn: async (data: EstimateFormData) => {
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      
      // Upload attachments first if any
      let uploadedAttachments: Array<{filename: string; path: string; size: number; mimetype: string}> = [];
      if (attachments.length > 0) {
        try {
          const formData = new FormData();
          attachments.forEach((file) => {
            formData.append('attachments', file);
          });

          const uploadResponse = await fetch('/api/estimate-attachments/upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            uploadedAttachments = uploadResult.files || [];
          } else {
            console.error('Failed to upload attachments');
            toast({
              title: "Warning",
              description: "Failed to upload some attachments. Estimate will be saved without them.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error uploading attachments:', error);
          toast({
            title: "Warning",
            description: "Failed to upload attachments. Estimate will be saved without them.",
            variant: "destructive",
          });
        }
      }
      
      const url = isEditMode ? `/api/estimates/${estimateId}` : `/api/estimates`;
      const method = isEditMode ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          tenantId: tenant?.id,
          attachments: [
            ...uploadedAttachments,
            ...existingAttachments,
          ],
        }),
      });
      if (!response.ok) throw new Error(isEditMode ? "Failed to update estimate" : "Failed to create estimate");
      return response.json();
    },
    onSuccess: async (data) => {
      toast({ 
        title: "Success", 
        description: isEditMode ? "Estimate updated successfully" : "Estimate created successfully" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      
      // Clear attachments after successful save
      setAttachments([]);
      setExistingAttachments([]);

      // Send estimate via email/WhatsApp if enabled (only for new estimates)
      if (!isEditMode) {
        const selectedCustomer = customers.find((c: any) => c.id.toString() === formData.selectedCustomerId);
        const selectedLead = leads.find((l: any) => l.id.toString() === formData.selectedLeadId);
        const customer = selectedCustomer || selectedLead;
        
        if (data.estimate?.id && customer && estimateSettings) {
        try {
          const token = auth.getToken();
          
          // Send via email if enabled
          if (estimateSettings?.sendEstimateViaEmail && (customer.email || customer.emailAddress || formData.customerEmail)) {
            try {
              const email = customer.email || customer.emailAddress || formData.customerEmail;
              await fetch(`/api/tenants/${tenant?.id}/estimates/${data.estimate.id}/email`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
            } catch (error) {
              console.error("Failed to send estimate via email:", error);
            }
          }

          // Send via WhatsApp if enabled
          if (estimateSettings?.sendEstimateViaWhatsapp && (customer.phone || customer.phoneNumber || customer.contactNumber || formData.customerPhone)) {
            try {
              const response = await fetch(`/api/tenants/${tenant?.id}/estimates/${data.estimate.id}/whatsapp`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
              const result = await response.json();
              if (result.whatsappLink) {
                window.open(result.whatsappLink, '_blank');
              }
            } catch (error) {
              console.error("Failed to send estimate via WhatsApp:", error);
            }
          }
        } catch (error) {
          console.error("Error sending estimate:", error);
        }
      }
      }

      setLocation("/estimates");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (isEditMode ? "Failed to update estimate" : "Failed to create estimate"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePreview(e);
  };

  const onCancel = () => {
    setLocation("/estimates");
  };

  return (
    <Layout initialSidebarCollapsed={true}>
      <div className="p-3 sm:p-4 md:p-6 mx-auto">
        <div className="bg-white rounded-2xl shadow-sm relative">
          {/* Loading Overlay - only show when actively loading */}
          {isEditMode && isLoadingEstimate && (
            <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Loading estimate data...
                </p>
              </div>
            </div>
          )}
          
          {/* Top Bar */}
          <div className="w-full min-h-[72px] flex flex-col sm:flex-row items-start sm:items-center bg-white px-3 sm:px-4 md:px-[18px] py-3 sm:py-4 rounded-t-xl border-b border-[#E3E8EF] shadow-[0px_1px_6px_0px_rgba(0,0,0,0.05)] gap-3 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              data-testid="button-back-to-estimates"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="ml-4 font-inter font-medium text-[20px] leading-[24px] text-[#121926]">
              Create Estimate
            </h1>

            <div className="flex gap-3 ml-auto">
              {tenant?.id && <EstimateSettingsPanel tenantId={tenant.id} />}
              <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                <HelpCircle className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>

          <form id="estimate-form" onSubmit={handleSubmit}>
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Title and Ref No. Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      Estimate
                    </h1>
                  </div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div>
                    <Label htmlFor="invoiceNumber">Ref No.</Label>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
                        {estimateSettings?.estimateNumberPrefix || "EST"}
                      </span>
                      <Input
                        id="invoiceNumber"
                        data-testid="input-estimate-number"
                        value={estimateNumberOnly}
                        onChange={(e) => {
                          const numberPart = e.target.value;
                          setEstimateNumberOnly(numberPart);
                          const prefix = estimateSettings?.estimateNumberPrefix || "EST";
                          setFormData((prev) => ({
                            ...prev,
                            invoiceNumber: numberPart ? `${prefix}${numberPart}` : "",
                          }));
                        }}
                        placeholder="001"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Title and Valid Until Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <Label htmlFor="title">
                      Title <span className="text-gray-900 dark:text-white">*</span>
                    </Label>
                    <AutocompleteInput
                      id="title"
                      suggestions={estimateTitleSuggestions}
                      allowCustomValue={true}
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
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <DatePicker
                      value={formData.validUntil}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          validUntil: date,
                        }))
                      }
                      placeholder="Select date"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Lead & Customer Selection Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="leadId">Lead (Optional)</Label>
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
                      value={formData.selectedLeadId ? formData.selectedLeadId : "none"}
                      onValueChange={handleLeadSelection}
                      placeholder="Select lead"
                      searchPlaceholder="Search..."
                      emptyText="No leads found."
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerId">Customer (Optional)</Label>
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
                      value={formData.selectedCustomerId ? formData.selectedCustomerId : "none"}
                      onValueChange={handleCustomerSelection}
                      placeholder="Select customer"
                      searchPlaceholder="Search..."
                      emptyText="No customers found."
                    />
                  </div>
                </div>

                {/* Customer Information Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customerName">
                      Customer Name <span className="text-gray-900 dark:text-white">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                      required
                      placeholder="John Doe"
                      data-testid="input-customer-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">
                      Email <span className="text-gray-900 dark:text-white">*</span>
                    </Label>
                    <Input
                      id="customerEmail"
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
                      data-testid="input-customer-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerPhone: e.target.value,
                        }))
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Line Items Section with Toggle */}
                <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        addLineItem();
                        setShowLineItems(true);
                      }}
                      className="gap-1 h-8 px-3 text-xs"
                      data-testid="button-add-line-item"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Line Item
                    </Button>
                    {itineraries.length > 0 && (
                      <Select value="" onValueChange={(v) => { const it = itineraries.find((i: any) => String(i.id) === v); if (it) addLineItemFromItinerary(it); }}>
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue placeholder="Add from Itinerary" />
                        </SelectTrigger>
                        <SelectContent>
                          {itineraries.map((it: any) => (
                            <SelectItem key={it.id} value={String(it.id)}>
                              {it.title || `Itinerary ${it.id}`} ({(it.clientPrice ?? it.client_price ?? 0).toFixed(0)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {formData.lineItems.length > 0 && (
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
                    )}
                  </div>
                </div>

                {showLineItems && formData.lineItems.length > 0 && (
                  <div className="border rounded-lg overflow-x-auto">
                    <div className="min-w-[1300px]">
                      {/* Table Header */}
                      <div 
                        className="top-0 z-[100] grid gap-2 p-3 font-medium text-sm border-b bg-gray-50 dark:bg-gray-800" 
                        style={{ 
                          gridTemplateColumns: gridTemplate,
                          backgroundColor: 'rgb(249, 250, 251)',
                          // position: 'sticky',
                          top: 0,
                          zIndex: 100,
                          minWidth: '1300px',
                          width: '100%',
                          willChange: 'transform'
                        }}
                      >
                        <div className="text-center flex items-center justify-center">#</div>
                        <div className="flex items-center">Category</div>
                        <div className="flex items-center">Service</div>
                        <div className="flex items-center">Qty</div>
                        <div className="flex items-center">Price</div>
                        <div className="flex items-center">Tax Rate</div>
                        <div className="flex items-center">Discount</div>
                        <div className="flex items-center">Total</div>
                        <div></div>
                      </div>

                      {/* Table Body */}
                      <div>
                        {formData.lineItems.map((item, index) => (
                          <div
                            key={index}
                            className="grid gap-2 p-3 border-b last:border-b-0"
                            style={{ gridTemplateColumns: gridTemplate }}
                          >
                          <div className="flex items-center justify-center">
                            <span className="font-medium text-sm">{index + 1}</span>
                          </div>

                          <div className="flex items-center">
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
                            />
                          </div>

                          <div className="flex items-center">
                            <Input
                              value={item.itemName || item.description || ""}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "itemName",
                                  e.target.value,
                                )
                              }
                              placeholder="Service description"
                            />
                          </div>

                          <div className="flex items-center">
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
                              type="number"
                              min="1"
                            />
                          </div>

                          <div className="flex items-center">
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
                              placeholder="0.00"
                            />
                          </div>

                          <div className="flex items-center">
                            <Select
                              value={(item.taxRateId && item.taxRateId !== "") ? item.taxRateId.toString() : "none"}
                              onValueChange={(value) =>
                                updateLineItem(index, "taxRateId", value === "none" ? "" : value)
                              }
                            >
                              <SelectTrigger>
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
                          </div>

                          <div className="flex items-center">
                            <Input
                              value={item.discount?.toString() || "0"}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "discount",
                                  e.target.value,
                                )
                              }
                              onKeyDown={handleNumericKeyDown}
                              placeholder="0"
                            />
                          </div>

                          <div className="flex items-center">
                            <Input
                              readOnly
                              value={`${currencySymbol}${item.totalPrice.toFixed(2)}`}
                              className="text-gray-600 dark:text-gray-400 cursor-not-allowed"
                            />
                          </div>

                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                              type="button"
                              className="h-8 w-8 p-0 text-gray-900 dark:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
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

                {(attachments.length > 0 || existingAttachments.length > 0) && (
                  <div className="mt-3 space-y-2">
                    {/* Display new attachments (File objects) */}
                    {attachments.map((file, index) => (
                      <div
                        key={`new-${index}`}
                        className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          {file.type === 'application/pdf' ? (
                            <FileText className="h-4 w-4 text-gray-900 dark:text-white" />
                          ) : (
                            <Image className="h-4 w-4 text-gray-900 dark:text-white" />
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
                          <Trash2 className="h-3.5 w-3.5 text-gray-900 dark:text-white" />
                        </Button>
                      </div>
                    ))}
                    {/* Display existing attachments from database */}
                    {existingAttachments.map((attachment, index) => (
                      <div
                        key={`existing-${index}`}
                        className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          {attachment.mimetype === 'application/pdf' ? (
                            <FileText className="h-4 w-4 text-gray-900 dark:text-white" />
                          ) : (
                            <Image className="h-4 w-4 text-gray-900 dark:text-white" />
                          )}
                          <div>
                            <a
                              href={attachment.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {attachment.filename}
                            </a>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              {attachment.size ? `${(attachment.size / 1024).toFixed(2)} KB` : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExistingAttachments(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-900 dark:text-white" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

                {/* Pricing & Payment - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {/* Left Side - Input Fields */}
                  <div className="space-y-4">
                    {/* Show these fields only when there are no line items */}
                    {formData.lineItems.length === 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="totalPrice">Total Price ({currencySymbol})</Label>
                            <Input
                              id="totalPrice"
                              value={formData.manualTotalPrice}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  manualTotalPrice: e.target.value,
                                }))
                              }
                              onKeyDown={handleNumericKeyDown}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="discountPercentage">Discount (%)</Label>
                            <Input
                              id="discountPercentage"
                              value={formData.discountPercentage}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  discountPercentage: e.target.value,
                                }))
                              }
                              onKeyDown={handleNumericKeyDown}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {estimateSettings?.showTax !== false && (
                          <div>
                            <Label htmlFor="taxRate">Tax Rate</Label>
                            <Select
                              value={formData.manualTaxRateId || "none"}
                              onValueChange={(value) => {
                                if (value === "none") {
                                  setFormData((prev) => ({ ...prev, manualTaxRateId: "" }));
                                } else {
                                  setFormData((prev) => ({ ...prev, manualTaxRateId: value }));
                                }
                              }}
                            >
                              <SelectTrigger>
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
                          </div>
                        )}
                      </>
                    )}

                    {/* Tax Inclusive/Exclusive Toggle */}
                    {estimateSettings?.showTax !== false && (
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

                    {estimateSettings?.showDeposit !== false && (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <Label htmlFor="depositRequired">Require Deposit</Label>
                        <Switch
                          id="depositRequired"
                          checked={formData.depositRequired}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              depositRequired: checked,
                            }))
                          }
                        />
                      </div>
                    )}

                    {formData.depositRequired && estimateSettings?.showDeposit !== false && (
                      <div>
                        <Label htmlFor="depositPercentage">Deposit (%)</Label>
                        <Input
                          id="depositPercentage"
                          value={formData.depositPercentage}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              depositPercentage: e.target.value,
                            }))
                          }
                          onKeyDown={handleNumericKeyDown}
                          placeholder="e.g., 50"
                        />
                      </div>
                    )}

                    {estimateSettings?.showPaymentTerms !== false && (
                      <div>
                        <Label htmlFor="paymentTerms">Payment Terms</Label>
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
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Side - Summary */}
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal:</span>
                          <span className="text-base font-semibold text-gray-900 dark:text-white">
                            {currencySymbol}{totals.subtotal.toFixed(2)}
                          </span>
                        </div>
                        {estimateSettings?.showDiscount !== false && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Discount:</span>
                            <span className="text-base font-semibold text-gray-900 dark:text-white">
                              -{currencySymbol}{totals.discountAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {estimateSettings?.showTax !== false && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tax:</span>
                            <span className="text-base font-semibold text-gray-900 dark:text-white">
                              {currencySymbol}{isTaxInclusive ? "0.00" : totals.taxAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-3 border-gray-300 dark:border-gray-600 mt-2">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {currencySymbol}{totals.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes - Left Side */}
                {estimateSettings?.showNotes !== false && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Add any additional notes or special instructions here..."
                        rows={3}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div></div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-10 px-6"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="estimate-form"
                disabled={createMutation.isPending}
                className="h-10 px-6 text-white"
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Creating..." : "Create Estimate"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Estimate Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">Estimate Preview</DialogTitle>
                <DialogDescription className="mt-1">
                  Review your estimate before saving. All estimate data will be displayed as shown below.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!previewEstimateData) return;
                    try {
                      // Import dynamically to avoid SSR issues
                      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
                        import('jspdf'),
                        import('html2canvas')
                      ]);
                      
                      const templateElement = document.querySelector('[data-estimate-template]');
                      if (!templateElement) {
                        toast({
                          title: "Error",
                          description: "Could not find estimate template",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      const canvas = await html2canvas(templateElement as HTMLElement);
                      const imgData = canvas.toDataURL("image/png");
                      const pdf = new jsPDF("p", "mm", "a4");
                      const pdfWidth = pdf.internal.pageSize.getWidth();
                      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                      
                      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
                      pdf.save(`Estimate-${previewEstimateData.estimateNumber}.pdf`);
                      
                      toast({
                        title: "Success",
                        description: "PDF downloaded successfully",
                      });
                    } catch (error) {
                      console.error("PDF download error:", error);
                      toast({
                        title: "Error",
                        description: "Failed to download PDF",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {previewEstimateData && (
              <div data-estimate-template>
                <ModernEstimateTemplate data={previewEstimateData} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t px-6 pb-6">
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
              disabled={createMutation.isPending}
              className=""
            >
              {createMutation.isPending ? "Creating..." : "Create Estimate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

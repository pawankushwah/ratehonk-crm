import { useState, useRef, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plus,
  Send,
  FileText,
  DollarSign,
  Calendar,
  Users,
  Trash2,
  Download,
  Eye,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  IndianRupee,
  BarChart3,
  Grid3X3,
  List,
  Search,
  MessageCircle,
  Pencil,
  FileSpreadsheet,
  ChevronDown,
  Upload,
  FileDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/layout";
import { EstimatePreview } from "@/components/estimates/estimate-preview";
import { EmailEstimateDialog } from "@/components/estimates/email-estimate-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { useDefaultCurrency } from "@/hooks/use-default-currency";
import { DateFilter } from "@/components/ui/date-filter";
import { buildDateFilters } from "@/lib/date-filter-helpers";
import { EnhancedTable, TableColumn } from "@/components/ui/enhanced-table";
import { useLocation } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import EstimateAnalytics from "./EstimateAnalytics";

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

interface Estimate {
  id: string;
  estimateNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface FullEstimate extends Estimate {
  title: string;
  customerPhone?: string;
  customerAddress?: string;
  description?: string;
  subtotal: string;
  discountType?: string;
  discountValue?: string;
  discountAmount?: string;
  taxRate?: string;
  taxAmount?: string;
  depositRequired?: boolean;
  depositAmount?: string;
  depositPercentage?: string;
  paymentTerms?: string;
  notes?: string;
  validUntil?: string;
  lineItems?: LineItem[];
  attachments?: Array<{
    filename: string;
    path: string;
    size: number;
    mimetype: string;
  }>;
}

export default function Estimates() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const defaultCurrency = useDefaultCurrency();

  // Fetch estimate settings
  const { data: estimateSettings = {
    estimateNumberStart: 1,
    defaultCurrency: "USD",
    estimateNumberPrefix: "EST",
    defaultGstSettingId: null,
    showTax: true,
    showDiscount: true,
    showNotes: true,
    showDeposit: true,
    showPaymentTerms: true,
  } } = useQuery({
    queryKey: ["/api/estimate-settings", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      const response = await fetch(`/api/estimate-settings/${tenant.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch estimate settings");
      const result = await response.json();
      return result.data || result;
    },
    enabled: !!tenant?.id,
  });

  // Get currency symbol helper
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
      CHF: "CHF",
    };
    return symbols[currencyCode] || currencyCode;
  };

  // Get default currency from estimate settings
  const settingsCurrency = estimateSettings?.defaultCurrency || defaultCurrency || "USD";

  // State management
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [previewEstimate, setPreviewEstimate] = useState<FullEstimate | null>(
    null
  );
  const [emailEstimate, setEmailEstimate] = useState<Estimate | null>(null);
  const [whatsappEstimate, setWhatsappEstimate] = useState<Estimate | null>(
    null
  );
  const [showAnalyticsSheet, setShowAnalyticsSheet] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const previewRef = useRef<{ downloadPDF: () => void } | null>(null);

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Import handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = [".csv", ".xlsx", ".xls"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: "Error",
          description: "Please select a CSV or Excel file (.csv, .xlsx, .xls)",
          variant: "destructive",
        });
        return;
      }
      setImportFile(file);
    }
  };

  const handleDownloadSampleFile = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/estimates/import/sample`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download sample file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "estimates-import-sample.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Sample file downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download sample file",
        variant: "destructive",
      });
    }
  };

  const handleImportEstimates = async () => {
    if (!importFile || !tenant?.id) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("tenantId", tenant.id.toString());

      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/estimates/import`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to import estimates");
      }

      toast({
        title: "Success",
        description: `Successfully imported ${result.imported || 0} estimates`,
      });

      // Refresh estimates list
      queryClient.invalidateQueries({
        queryKey: ["estimates", tenant.id],
      });

      setImportDialogOpen(false);
      setImportFile(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import estimates",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Export estimates handler - CSV
  const handleExportEstimatesCSV = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/estimates/export?format=csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export estimates");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estimates-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Estimates exported to CSV successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export estimates",
        variant: "destructive",
      });
    }
  };

  // Export estimates handler - Excel
  const handleExportEstimatesExcel = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/estimates/export?format=xlsx`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export estimates");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estimates-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Estimates exported to Excel successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export estimates",
        variant: "destructive",
      });
    }
  };

  // Export estimates handler - PDF
  const handleExportEstimatesPDF = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/estimates/export?format=pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export estimates");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estimates-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Estimates exported to PDF successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export estimates",
        variant: "destructive",
      });
    }
  };

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  // Form data state
  const [formData, setFormData] = useState<EstimateFormData>({
    title: "",
    selectedLeadId: "",
    selectedCustomerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    invoiceNumber: "",
    currency: defaultCurrency,
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
    queryFn: async () => {
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      const response = await fetch(`api/customers?tenantId=${tenant?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch customers");
      const result = await response.json();
      return Array.isArray(result)
        ? result
        : result.customers || result.data || result.rows || [];
    },
  });

  // Fetch leads
  const { data: leads = [] } = useQuery<any[]>({
    queryKey: [`api/leads`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      const response = await fetch(`api/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.leads || [];
    },
  });

  // Fetch lead types for categories
  const { data: leadTypes = [] } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/lead-types`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      const response = await fetch(`/api/tenants/${tenant?.id}/lead-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.leadTypes || [];
    },
  });

  // Fetch tenant settings for company info
  const { data: tenantSettings } = useQuery({
    queryKey: ["/api/tenant/settings"],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      const response = await fetch(`/api/tenant/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Map frontend column keys to database column names
  const getSortColumnName = (columnKey: string): string => {
    const columnMap: Record<string, string> = {
      estimateNumber: "estimate_number",
      customerName: "customer_name",
      createdAt: "created_at",
      totalAmount: "total_amount",
      status: "status",
    };
    return columnMap[columnKey] || columnKey;
  };

  // Handle sort change
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to desc
      setSortColumn(columnKey);
      setSortDirection("desc");
    }
  };

  // Fetch estimates with search, status, date filters, sorting, and pagination
  const { data: estimatesResponse, isLoading } = useQuery<{
    data: Estimate[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: [
      `/api/estimates`,
      searchTerm,
      statusFilter,
      dateFilter,
      currentPage,
      pageSize,
      customDateFrom,
      customDateTo,
      sortColumn,
      sortDirection,
    ],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const dateFilters = buildDateFilters(
        dateFilter,
        customDateFrom,
        customDateTo,
      );
      console.log("🔍 Fetching estimates with filters:", {
        searchTerm,
        statusFilter,
        dateFilters,
        sortColumn,
        sortDirection,
      });
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");

      // Build query parameters for all filters
      const queryParams = new URLSearchParams();
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }
      if (statusFilter && statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }
      if (dateFilters?.startDate) {
        queryParams.append("startDate", dateFilters.startDate);
      }
      if (dateFilters?.endDate) {
        queryParams.append("endDate", dateFilters.endDate);
      }
      if (dateFilters?.filterType) {
        queryParams.append("filterType", dateFilters.filterType);
      }
      // Add sorting parameters
      if (sortColumn) {
        queryParams.append("sortBy", getSortColumnName(sortColumn));
        queryParams.append("sortOrder", sortDirection);
      }
      // Add pagination parameters
      queryParams.append("page", currentPage.toString());
      queryParams.append("pageSize", pageSize.toString());

      const url = queryParams.toString()
        ? `/api/estimates?${queryParams.toString()}`
        : `/api/estimates`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        return {
          data: [],
          pagination: {
            page: currentPage,
            pageSize: pageSize,
            total: 0,
            totalPages: 0,
          },
        };
      }
      const result = await response.json();
      
      // Handle both old format (array) and new format (object with data and pagination)
      if (Array.isArray(result)) {
        return {
          data: result,
          pagination: {
            page: currentPage,
            pageSize: pageSize,
            total: result.length,
            totalPages: Math.ceil(result.length / pageSize),
          },
        };
      }
      
      // New format with pagination
      return {
        data: result.data || result.estimates || [],
        pagination: result.pagination || {
          page: currentPage,
          pageSize: pageSize,
          total: result.data?.length || 0,
          totalPages: Math.ceil((result.data?.length || 0) / pageSize),
        },
      };
    },
    refetchOnMount: true, // Refetch when component mounts (navigation)
    staleTime: 0, // Always consider data stale, so it refetches when navigating to the page
  });

  // Extract estimates and pagination from response
  const estimates = estimatesResponse?.data || [];
  const pagination = estimatesResponse?.pagination || {
    page: currentPage,
    pageSize: pageSize,
    total: 0,
    totalPages: 0,
  };

  // Function to fetch full estimate details for preview
  const fetchFullEstimate = async (
    estimateId: string,
  ): Promise<FullEstimate> => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("auth_token");
    const response = await fetch(`/api/estimates/${estimateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch estimate details");
    return response.json();
  };

  // Handle estimate preview
  const handlePreviewEstimate = async (estimate: Estimate) => {
    try {
      const fullEstimate = await fetchFullEstimate(estimate.id);
      setPreviewEstimate(fullEstimate);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load estimate details for preview",
        variant: "destructive",
      });
      console.error("Error loading estimate for preview:", error);
    }
  };

  // Get travel categories from lead types
  const getTravelCategories = () => {
    if (leadTypes && Array.isArray(leadTypes) && leadTypes.length > 0) {
      return leadTypes
        .map(
          (lt: any) =>
            lt.name || lt.type_name || lt.typeName || `Lead Type ${lt.id}`
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
      // Reset fields when no customer selected
      setFormData((prev) => ({
        ...prev,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
      }));
    }
  };

  // Handle lead selection and auto-populate
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
      // Reset fields when no lead selected
      setFormData((prev) => ({
        ...prev,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
      }));
    }
  };

  // Line item management
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
  const totals = {
    subtotal: formData.lineItems.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0
    ),
    discountAmount:
      formData.lineItems.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0
      ) *
      (parseFloat(formData.discountPercentage) / 100),
    taxAmount:
      formData.lineItems.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0
      ) *
      (parseFloat(formData.taxPercentage) / 100),
    get total() {
      return this.subtotal - this.discountAmount + this.taxAmount;
    },
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
          totalAmount: totals.total,
          tenantId: tenant?.id,
        }),
      });
      if (!response.ok) throw new Error("Failed to create estimate");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Estimate created successfully" });
      setShowCreateDialog(false);
      setFormData({
        title: "",
        selectedLeadId: "",
        selectedCustomerId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        invoiceNumber: "",
        currency: defaultCurrency,
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
      queryClient.invalidateQueries({ queryKey: [`/api/estimates`] });
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

  const handleDownloadPDF = async (estimate: Estimate | FullEstimate) => {
    try {
      // Fetch full estimate details for PDF generation
      const fullEstimate = await fetchFullEstimate(estimate.id);

      // Dynamically import PDF libraries
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      toast({
        title: "Generating PDF",
        description: "Please wait...",
      });

      // Create a hidden container for rendering the preview
      const hiddenContainer = document.createElement("div");
      hiddenContainer.style.position = "absolute";
      hiddenContainer.style.left = "-9999px";
      hiddenContainer.style.top = "0";
      hiddenContainer.style.width = "210mm"; // A4 width
      hiddenContainer.style.backgroundColor = "#ffffff";
      document.body.appendChild(hiddenContainer);

      // Get tenant settings for company info
      const companyInfo = tenantSettings
        ? {
            name:
              (tenantSettings as any)?.companyName ||
              (tenant as any)?.name ||
              "",
            address: (tenantSettings as any)?.address || (tenantSettings as any)?.companyAddress || "",
            phone: (tenantSettings as any)?.companyPhone || "",
            email: (tenantSettings as any)?.companyEmail || "",
            logo:
              (tenantSettings as any)?.logo ||
              (tenantSettings as any)?.companyLogo ||
              (fullEstimate as any)?.logoUrl,
          }
        : undefined;

      // Render the preview component in the hidden container using React 18 createRoot
      const React = await import("react");
      const ReactDOM = await import("react-dom/client");
      const root = ReactDOM.createRoot(hiddenContainer);

      root.render(
        React.createElement(EstimatePreview, {
          estimate: fullEstimate as any,
          companyInfo: companyInfo,
          hideActions: true,
        })
      );

      // Wait for the component to render and images to load
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Find the preview content element
      const previewElement = hiddenContainer.querySelector(
        "[data-estimate-preview-content]"
      ) as HTMLElement;

      if (!previewElement) {
        root.unmount();
        document.body.removeChild(hiddenContainer);
        throw new Error("Preview content not found");
      }

      // Generate PDF from the rendered content
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: false,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page PDF
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Estimate-${fullEstimate.estimateNumber || estimate.id}.pdf`);

      // Clean up: unmount React component and remove container
      root.unmount();
      setTimeout(() => {
        if (document.body.contains(hiddenContainer)) {
          document.body.removeChild(hiddenContainer);
        }
      }, 100);

      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update estimate status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      estimateId,
      status,
    }: {
      estimateId: number;
      status: string;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/estimates/${estimateId}/status`,
        { status }
      );
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      // Update preview estimate if it's the same one
      if (
        previewEstimate &&
        Number(previewEstimate.id) === variables.estimateId
      ) {
        setPreviewEstimate({ ...previewEstimate, status: variables.status });
      }
      toast({
        title: "Success",
        description: `Estimate status updated to ${variables.status}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update estimate status",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (estimateId: number, newStatus: string) => {
    updateStatusMutation.mutate({ estimateId, status: newStatus });
  };


  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: "secondary",
      sent: "default",
      viewed: "outline",
      accepted: "success",
      rejected: "destructive",
    };
    return (
      <Badge
        variant={variants[status] || "secondary"}
        className="capitalize px-2 py-1 text-xs"
      >
        {status}
      </Badge>
    );
  };

  const [, navigate] = useLocation();

  // Handle WhatsApp send
  const handleSendWhatsApp = async (estimate: Estimate | FullEstimate) => {
    const customerPhone = (estimate as any).customerPhone;
    if (!customerPhone) {
      toast({
        title: "Error",
        description: "Customer phone number is not available",
        variant: "destructive",
      });
      return;
    }

    // Generate WhatsApp message
    const message =
      `*Estimate ${estimate.estimateNumber}*\n\n` +
      `Dear ${estimate.customerName},\n\n` +
      `Please find your estimate details:\n` +
      `- Estimate Number: ${estimate.estimateNumber}\n` +
      `- Total Amount: $${estimate.totalAmount}\n` +
      `- Status: ${estimate.status || "Draft"}\n\n` +
      `Please review the estimate and let us know if you have any questions.\n\n` +
      `Thank you for your business!`;

    // Create WhatsApp link
    const phoneNumber = customerPhone.replace(/[^0-9]/g, "");
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in new tab
    window.open(whatsappLink, "_blank");

    toast({
      title: "WhatsApp Opened",
      description: "WhatsApp chat opened in new window",
    });
  };

  // Column definitions for the enhanced table
  const estimateColumns: TableColumn<Estimate>[] = [
    {
      key: "estimateNumber",
      label: "Estimate #",
      sortable: true,
      render: (value) => (
        <div className="font-medium flex items-center">
          {value || `EST-${value}`}
        </div>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (customerName, estimate) => (
        <div className="flex flex-col">
          <div className="font-medium">{customerName || "Unknown"}</div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <Mail className="h-3 w-3 mr-1" />
            {estimate.customerEmail || ""}
          </div>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (createdAt) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span>
            {createdAt ? new Date(createdAt).toLocaleDateString() : "-"}
          </span>
        </div>
      ),
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      sortable: true,
      render: (totalAmount, estimate) => {
        // Get currency from estimate if available, otherwise use settings default
        const estimateData = estimate as any;
        const currency = estimateData.currency || settingsCurrency;
        const currencySymbol = getCurrencySymbol(currency);
        
        return (
          <div className="flex items-center font-semibold">
            <span className="mr-1">{currencySymbol}</span>
            <span>
              {totalAmount
                ? parseFloat(totalAmount.toString()).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0.00"}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (status, estimate) => {
        const statusConfig = estimateStatuses.find((s) => s.value === status);
        const currentStatus = status || "draft";
        const badgeVariant =
          currentStatus === "rejected"
            ? "destructive"
            : currentStatus === "draft"
              ? "secondary"
              : "default";
        const badgeColor = statusConfig?.color || "bg-gray-100 text-gray-800";

        return (
          <Select
            value={currentStatus}
            onValueChange={(value) =>
              handleStatusChange(Number(estimate.id), value)
            }
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger
              className={`w-auto h-7 px-2 border-0 ${badgeColor} hover:opacity-80 cursor-pointer`}
            >
              <SelectValue>
                <span className="text-xs font-medium">
                  {statusConfig?.label || currentStatus}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-right",
      render: (_, estimate) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePreviewEstimate(estimate)}
            title="Preview Estimate"
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Invalidate the query cache for this estimate to force a fresh fetch
              queryClient.invalidateQueries({
                queryKey: ["/api/estimates", estimate.id],
              });
              navigate(`/estimates/edit/${estimate.id}`);
            }}
            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
            title="Edit Estimate"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEmailEstimate(estimate)}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
            title="Send Email"
          >
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setWhatsappEstimate(estimate)}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
            title="Send WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadPDF(estimate)}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Define estimate statuses first
  const estimateStatuses = [
    { value: "all", label: "All Status" },
    { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
    { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-800" },
    {
      value: "viewed",
      label: "Viewed",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "accepted",
      label: "Accepted",
      color: "bg-green-100 text-green-800",
    },
    { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
    { value: "expired", label: "Expired", color: "bg-gray-100 text-gray-800" },
  ];

  // Calculate analytics data - must be before any conditional returns
  const analytics = useMemo(() => {
    const totalValue = estimates.reduce(
      (sum, est) => sum + parseFloat(est.totalAmount?.toString() || "0"),
      0
    );
    const acceptedValue = estimates
      .filter((est) => est.status === "accepted")
      .reduce(
        (sum, est) => sum + parseFloat(est.totalAmount?.toString() || "0"),
        0
      );
    const pendingValue = estimates
      .filter((est) => ["draft", "sent", "viewed"].includes(est.status || ""))
      .reduce(
        (sum, est) => sum + parseFloat(est.totalAmount?.toString() || "0"),
        0
      );
    const conversionRate =
      pagination.total > 0
        ? (estimates.filter((est) => est.status === "accepted").length /
            pagination.total) *
          100
        : 0;

    return {
      totalEstimates: estimates.length,
      totalValue,
      acceptedValue,
      pendingValue,
      conversionRate,
    };
  }, [estimates]);

  // Prepare chart data
  const chartData = useMemo(() => {
    // Status distribution for pie chart
    const statusData = estimateStatuses
      .map((status) => ({
        name: status.label,
        value: estimates.filter((est) => est.status === status.value).length,
        color:
          status.value === "draft"
            ? "#9CA3AF"
            : status.value === "sent"
              ? "#3B82F6"
              : status.value === "viewed"
                ? "#F59E0B"
                : status.value === "accepted"
                  ? "#10B981"
                  : status.value === "rejected"
                    ? "#EF4444"
                    : "#6B7280",
      }))
      .filter((item) => item.value > 0);

    // Monthly value trends for bar chart
    const monthlyData = estimates.reduce(
      (acc, est) => {
        const month = new Date(est.createdAt).toLocaleDateString("en", {
          month: "short",
          year: "numeric",
        });
        const existing = acc.find((item) => item.month === month);
        if (existing) {
          existing.value += parseFloat(est.totalAmount?.toString() || "0");
          existing.count += 1;
        } else {
          acc.push({
            month,
            value: parseFloat(est.totalAmount?.toString() || "0"),
            count: 1,
          });
        }
        return acc;
      },
      [] as Array<{ month: string; value: number; count: number }>
    );

    return { statusData, monthlyData };
  }, [estimates, estimateStatuses]);

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
  //     </div>
  //   );
  // }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 space-y-6 w-full max-w-none">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Estimates</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage professional estimates for your customers
              </p>
            </div>
            <div className="flex gap-3">
              {/* Import Button */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setImportDialogOpen(true)}
                title="Import Estimates"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    title="Export Estimates"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportEstimatesPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportEstimatesCSV}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportEstimatesExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Analytics Button */}
              <Sheet
                open={showAnalyticsSheet}
                onOpenChange={setShowAnalyticsSheet}
              >
                <SheetTrigger asChild>
                  <Button variant="outline" size="lg" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="!w-1/2 !max-w-none">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Estimate Analytics
                    </SheetTitle>

                    <SheetDescription>
                      Comprehensive overview of your estimate performance and
                      metrics
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-6 overflow-y-auto h-[calc(100vh-120px)]">
                    <EstimateAnalytics
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* New Estimate Button */}
              <Link href="/estimates/create">
                <Button
                  size="lg"
                  className="gap-2"
                  data-testid="button-new-estimate"
                >
                  <Plus className="w-4 h-4" />
                  New Estimate
                </Button>
              </Link>
            </div>
          </div>

          {/* New Estimate Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl font-semibold">
                  Create Estimate
                </DialogTitle>
                <DialogDescription>
                  Fill in the details to generate a professional estimate with
                  branding and terms
                </DialogDescription>
              </DialogHeader>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Estimate Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Website Development Project"
                    required
                    className="mt-1"
                  />
                </div>

                {/* Lead and Customer Selection */}
                <Card className="border rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Lead & Customer Selection
                    </CardTitle>
                    <CardDescription>
                      Select an existing lead or customer to auto-populate
                      contact information (both optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Lead (Optional)</Label>
                      <Select
                        value={formData.selectedLeadId}
                        onValueChange={handleLeadSelection}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a lead" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No lead selected</SelectItem>
                          {leads.map((lead: any) => (
                            <SelectItem
                              key={lead.id}
                              value={lead.id.toString()}
                            >
                              {lead.name ||
                                lead.firstName + " " + lead.lastName ||
                                lead.leadName ||
                                `Lead ${lead.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Customer (Optional)</Label>
                      <Select
                        value={formData.selectedCustomerId}
                        onValueChange={handleCustomerSelection}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            No customer selected
                          </SelectItem>
                          {customers.map((customer: any) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              {customer.name ||
                                customer.firstName + " " + customer.lastName ||
                                `Customer ${customer.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Info */}
                <Card className="border rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Customer Information
                    </CardTitle>
                    <CardDescription>
                      {formData.selectedLeadId
                        ? "Auto-populated from selected lead"
                        : formData.selectedCustomerId
                          ? "Auto-populated from selected customer"
                          : "Enter customer details manually"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Customer Name</Label>
                      <Input
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customerName: e.target.value,
                          }))
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
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
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customerPhone: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Ref No.</Label>
                      <Input
                        value={formData.invoiceNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            invoiceNumber: e.target.value,
                          }))
                        }
                        placeholder="e.g., INV-001"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select
                        value={formData.currency || defaultCurrency}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, currency: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valid Until</Label>
                      <Input
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            validUntil: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Line Items */}
                <Card className="rounded-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Line Items</CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addLineItem}
                      className="gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.lineItems.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-xl space-y-4 bg-muted/30"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* <div>
                            <Label>Item</Label>
                            <Input
                              value={item.itemName}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "itemName",
                                  e.target.value,
                                )
                              }
                              required
                            />
                          </div> */}
                          <div>
                            <Label>Services</Label>
                            <Select
                              value={item.leadCategory}
                              onValueChange={(value) =>
                                updateLineItem(index, "leadCategory", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {getTravelCategories().map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Qty</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Item Price</Label>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "unitPrice",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Tax</Label>
                            <Input
                              type="number"
                              value={item.tax}
                              onChange={(e) =>
                                updateLineItem(index, "tax", e.target.value)
                              }
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Discount</Label>
                            <Input
                              type="number"
                              value={item.discount}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "discount",
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label>Total</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                readOnly
                                value={`${getCurrencySymbol(formData.currency || settingsCurrency)}${item.totalPrice.toFixed(2)}`}
                                className="bg-muted"
                              />
                              {formData.lineItems.length > 1 && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeLineItem(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Optional details"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Totals + Terms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          value={formData.discountPercentage}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              discountPercentage: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Tax (%)</Label>
                        <Input
                          type="number"
                          value={formData.taxPercentage}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              taxPercentage: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="pt-4 border-t space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{getCurrencySymbol(formData.currency || settingsCurrency)}{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Discount:</span>
                          <span>-{getCurrencySymbol(formData.currency || settingsCurrency)}{totals.discountAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{getCurrencySymbol(formData.currency || settingsCurrency)}{totals.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-primary">
                          <span>Total:</span>
                          <span>{getCurrencySymbol(formData.currency || settingsCurrency)}{totals.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Terms</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.depositRequired}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              depositRequired: e.target.checked,
                            }))
                          }
                        />
                        <Label>Require Deposit</Label>
                      </div>
                      {formData.depositRequired && (
                        <div>
                          <Label>Deposit (%)</Label>
                          <Input
                            type="number"
                            value={formData.depositPercentage}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                depositPercentage: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                      <div>
                        <Label>Payment Terms</Label>
                        <Select
                          value={formData.paymentTerms}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              paymentTerms: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">
                              Due Immediately
                            </SelectItem>
                            <SelectItem value="net7">Net 7 Days</SelectItem>
                            <SelectItem value="net30">Net 30 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {createMutation.isPending
                      ? "Creating..."
                      : "Create Estimate"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter Estimates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                  <Input
                    placeholder="Search estimates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-9 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {estimateStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DateFilter
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  customDateFrom={customDateFrom}
                  setCustomDateFrom={setCustomDateFrom}
                  customDateTo={customDateTo}
                  setCustomDateTo={setCustomDateTo}
                />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="text-xs text-gray-500">
                  {pagination.total > 0 ? (
                    <>
                      Total: {pagination.total} estimate
                      {pagination.total !== 1 ? "s" : ""}
                    </>
                  ) : (
                    <>No estimates found</>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Estimates List</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedTable
                data={estimates}
                columns={estimateColumns}
                isLoading={isLoading}
                showPagination={false}
                emptyMessage="No estimates found. Create your first estimate to get started."
                externalSort={{
                  sortColumn: sortColumn,
                  sortDirection: sortDirection,
                  onSort: handleSort,
                }}
              />
              {/* Pagination Controls - Below table like invoices */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, pagination.total)} of{" "}
                    {pagination.total} estimates
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pageSize" className="text-sm text-gray-500">
                      Show:
                    </Label>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(parseInt(value));
                        setCurrentPage(1); // Reset to first page when changing page size
                      }}
                    >
                      <SelectTrigger id="pageSize" className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {pagination.totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            // Show all pages if 5 or fewer
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            // Show first 5 pages
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.totalPages - 2) {
                            // Show last 5 pages
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            // Show pages around current page
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="min-w-[2.5rem]"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= pagination.totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview and Email Dialogs - Moved outside main content for proper modal display */}
          {previewEstimate && (
            <Dialog
              open={!!previewEstimate}
              onOpenChange={(open) => {
                if (!open) {
                  setPreviewEstimate(null);
                }
              }}
            >
              <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-xl font-semibold">
                        Estimate Preview - {previewEstimate?.estimateNumber}
                      </DialogTitle>
                      <DialogDescription className="mt-1">
                        Preview of estimate for {previewEstimate?.customerName}
                      </DialogDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Status Change Dropdown */}
                      <Select
                        value={previewEstimate.status || "draft"}
                        onValueChange={(value) =>
                          handleStatusChange(Number(previewEstimate.id), value)
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="viewed">Viewed</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Action Buttons */}
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (previewRef.current) {
                            previewRef.current.downloadPDF();
                          } else {
                            handleDownloadPDF(previewEstimate);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                      <Button
                        onClick={() => {
                          setEmailEstimate(previewEstimate as any);
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Mail className="h-4 w-4" />
                        Send Email
                      </Button>
                      <Button
                        onClick={() => {
                          if (previewEstimate) {
                            handleSendWhatsApp(previewEstimate as any);
                          }
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Send WhatsApp
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <EstimatePreview
                    ref={previewRef as any}
                    estimate={previewEstimate as any}
                    hideActions={true}
                    companyInfo={{
                      name:
                        (tenantSettings as any)?.companyName ||
                        (tenant as any)?.name ||
                        "Your Company Name",
                      logo:
                        (tenantSettings as any)?.logo ||
                        (tenantSettings as any)?.companyLogo ||
                        (previewEstimate as any)?.logoUrl,
                      address: (tenantSettings as any)?.address || (tenantSettings as any)?.companyAddress,
                      phone: (tenantSettings as any)?.companyPhone,
                      email: (tenantSettings as any)?.companyEmail,
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

          {emailEstimate && (
            <EmailEstimateDialog
              estimate={emailEstimate as any}
              open={!!emailEstimate}
              onOpenChange={(open) => !open && setEmailEstimate(null)}
            />
          )}
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Estimates</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import estimates. The file should contain columns: Customer Name, Customer Email, Customer Phone, Date, Valid Until, Total Amount, Currency, Status, etc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="import-file">Select File</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSampleFile}
                  className="text-xs"
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  Download Sample CSV
                </Button>
              </div>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="mt-2"
              />
              {importFile && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {importFile.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setImportFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportEstimates}
              disabled={!importFile || isImporting}
            >
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Calendar,
  Users,
  Edit,
  Eye,
  FileText,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  Download,
  Receipt,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  Trash2,
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  FileSpreadsheet,
  ChevronDown,
  Upload,
  FileDown,
  MoreVertical,
  Copy,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { EnhancedTable, TableColumn } from "@/components/ui/enhanced-table";
import type { Invoice } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { CreateFollowUpDialog } from "@/components/follow-ups/CreateFollowUpDialog";
import {
  ModernTemplate,
  InvoiceData,
} from "@/components/invoices/invoice-templates";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateFilter } from "@/components/ui/date-filter";
import { buildDateFilters } from "@/lib/date-filter-helpers";
import InvoiceAnalyticsSheet from "./InvoiceAnalyticsSheet";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { directCustomersApi } from "@/lib/direct-customers-api";
import { useDebounce } from "@/hooks/use-debounce";

const invoiceStatuses = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
  {
    value: "partial",
    label: "Partially Paid",
    color: "bg-blue-100 text-blue-800",
  },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-800" },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800",
  },
  {
    value: "void",
    label: "Void",
    color: "bg-purple-100 text-purple-800",
  },
];

export default function Invoices() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  // Local filter states (not applied until "Apply Filters" is clicked)
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState("all");
  const [localCustomerFilter, setLocalCustomerFilter] = useState<string[]>([]);
  const [localVendorFilter, setLocalVendorFilter] = useState<string>("all");
  const [localProviderFilter, setLocalProviderFilter] = useState<string>("all");
  const [localLeadTypeFilter, setLocalLeadTypeFilter] = useState<string>("all");
  const [localDateFilter, setLocalDateFilter] = useState("all");
  const [localCustomDateFrom, setLocalCustomDateFrom] = useState<Date | null>(
    null
  );
  const [localCustomDateTo, setLocalCustomDateTo] = useState<Date | null>(null);

  // Applied filter states (used for API calls)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [leadTypeFilter, setLeadTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  // Read pagination from URL on mount
  const getInitialPage = () => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get("page");
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) return page;
    }
    return 1;
  };

  const getInitialPageSize = () => {
    const params = new URLSearchParams(window.location.search);
    const pageSizeParam = params.get("pageSize");
    if (pageSizeParam) {
      const size = parseInt(pageSizeParam, 10);
      if (!isNaN(size) && size > 0) return size;
    }
    return 10;
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [pageSize, setPageSize] = useState(getInitialPageSize);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [selectedInvoiceForFollowUp, setSelectedInvoiceForFollowUp] = useState<any>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isCancellationChargeDialogOpen, setIsCancellationChargeDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ invoiceId: number; status: string } | null>(null);
  const [cancellationChargeAmount, setCancellationChargeAmount] = useState("");
  const [cancellationChargeNotes, setCancellationChargeNotes] = useState("");
  const [showCancellationChargeFields, setShowCancellationChargeFields] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [invoiceToDuplicate, setInvoiceToDuplicate] = useState<any>(null);
  const [duplicateCustomerId, setDuplicateCustomerId] = useState<string>("");
  const [duplicateCustomerSearch, setDuplicateCustomerSearch] = useState("");
  const debouncedDuplicateCustomerSearch = useDebounce(duplicateCustomerSearch, 500);
  const isInitialMount = useRef(true);

  // Helper function to update URL parameters
  const updateURLParams = (page: number, size: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());
    params.set("pageSize", size.toString());
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  };

  // Helper function to get pagination params for navigation
  const getPaginationParams = () => {
    return `?page=${currentPage}&pageSize=${pageSize}`;
  };

  // Helper function to reset to page 1 and update URL
  const resetToPageOne = () => {
    setCurrentPage(1);
    updateURLParams(1, pageSize);
  };

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
      const response = await fetch(`/api/tenants/${tenant.id}/invoices/import/sample`, {
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
      a.download = "invoices-import-sample.csv";
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

  const handleImportInvoices = async () => {
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
      const response = await fetch(`/api/tenants/${tenant.id}/invoices/import`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to import invoices");
      }

      toast({
        title: "Success",
        description: `Successfully imported ${result.imported || 0} invoices`,
      });

      // Refresh invoices list
      queryClient.invalidateQueries({
        queryKey: ["invoices", tenant.id],
      });

      setImportDialogOpen(false);
      setImportFile(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import invoices",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Export invoices handler - CSV
  const handleExportInvoicesCSV = async () => {
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
      const response = await fetch(`/api/tenants/${tenant.id}/invoices/export?format=csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export invoices");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Invoices exported to CSV successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export invoices",
        variant: "destructive",
      });
    }
  };

  // Export invoices handler - Excel
  const handleExportInvoicesExcel = async () => {
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
      const response = await fetch(`/api/tenants/${tenant.id}/invoices/export?format=xlsx`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export invoices");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Invoices exported to Excel successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export invoices",
        variant: "destructive",
      });
    }
  };

  // Export invoices handler - PDF
  const handleExportInvoicesPDF = async () => {
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
      const response = await fetch(`/api/tenants/${tenant.id}/invoices/export?format=pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export invoices");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Invoices exported to PDF successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export invoices",
        variant: "destructive",
      });
    }
  };
  const [lineItems, setLineItems] = useState([
    {
      travelCategory: "",
      vendor: "",
      itemTitle: "",
      invoiceNumber: "",
      voucherNumber: "",
      quantity: 1,
      unitPrice: 0,
      sellingPrice: 0,
      purchasePrice: 0,
      tax: 0,
      totalAmount: 0,
    },
  ]);

  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("pending");

  // Edit form states
  const [editLineItems, setEditLineItems] = useState<any[]>([]);
  const [editDiscountAmount, setEditDiscountAmount] = useState(0);
  const [editAmountPaid, setEditAmountPaid] = useState(0);
  const [editPaymentStatus, setEditPaymentStatus] = useState("pending");

  // Handle adding new line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        travelCategory: "",
        vendor: "",
        itemTitle: "",
        invoiceNumber: "",
        voucherNumber: "",
        quantity: 1,
        unitPrice: 0,
        sellingPrice: 0,
        purchasePrice: 0,
        tax: 0,
        totalAmount: 0,
      },
    ]);
  };

  // Handle removing line item
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Handle line item field changes
  const updateLineItem = (index: number, field: string, value: any) => {
    if (!lineItems || index < 0 || index >= lineItems.length) return;

    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate total amount for this line item
    const item = updatedItems[index];
    const sellingPrice = parseFloat(item.sellingPrice?.toString() || "0") || 0;
    const quantity = parseInt(item.quantity?.toString() || "1") || 1;
    const tax = parseFloat(item.tax?.toString() || "0") || 0;
    const total = sellingPrice * quantity + tax;
    updatedItems[index].totalAmount = total;

    setLineItems(updatedItems);
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    if (!lineItems || lineItems.length === 0) return 0;
    return lineItems.reduce(
      (total, item) => total + (item.totalAmount || 0),
      0
    );
  };

  // Calculate payment summary values
  const calculatePaymentSummary = () => {
    const totalAmount = calculateGrandTotal();
    const finalAmount = totalAmount - discountAmount;
    const remaining = finalAmount - amountPaid;

    return {
      totalAmount,
      discountAmount,
      finalAmount,
      remaining,
      amountPaid,
    };
  };

  // Handle booking selection and auto-populate fields
  const handleBookingSelection = (bookingId: string) => {
    console.log("🎯 Booking selection - ID:", bookingId);
    setSelectedBookingId(bookingId);

    if (bookingId && bookingId !== "none") {
      const selectedBooking = bookings.find(
        (b) => b.id.toString() === bookingId
      );
      console.log("🎯 Selected booking data:", selectedBooking);

      if (selectedBooking) {
        // Auto-populate customer
        setSelectedCustomerId(selectedBooking.customerId?.toString() || "");

        // Auto-populate dates if available
        setTimeout(() => {
          const issueDateInput = document.querySelector(
            'input[name="issueDate"]'
          ) as HTMLInputElement;
          const dueDateInput = document.querySelector(
            'input[name="dueDate"]'
          ) as HTMLInputElement;

          if (issueDateInput) {
            issueDateInput.value = new Date().toISOString().split("T")[0]; // Today's date for issue
          }

          if (selectedBooking.travelDate && dueDateInput) {
            const travelDate = new Date(selectedBooking.travelDate);
            const dueDate = new Date(
              travelDate.getTime() - 7 * 24 * 60 * 60 * 1000
            ); // 7 days before travel
            dueDateInput.value = dueDate.toISOString().split("T")[0];
          }
        }, 100);

        // Auto-populate first line item - ALWAYS populate something from booking
        const newLineItems = [...lineItems];
        console.log("🎯 Current line items before update:", newLineItems);

        // Get booking amount - try different field names
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

        console.log(
          "🎯 Booking amount:",
          bookingAmount,
          "Passengers:",
          bookingPassengers,
          "Package:",
          bookingPackage
        );

        // Calculate prices
        const totalAmount = parseFloat(bookingAmount) || 0;
        const unitPrice = totalAmount / bookingPassengers || 0;
        const purchasePrice = unitPrice * 0.8; // Assume 20% margin
        const taxRate = 0.18; // 18% GST
        const taxAmount = totalAmount * taxRate;

        newLineItems[0] = {
          ...newLineItems[0],
          travelCategory: getTravelCategories()[0] || "Tour Package", // Use first lead type or fallback
          itemTitle:
            bookingPackage ||
            `Booking ${selectedBooking.bookingNumber || selectedBooking.booking_number || selectedBooking.id}`,
          quantity: bookingPassengers,
          unitPrice: unitPrice,
          sellingPrice: unitPrice,
          purchasePrice: purchasePrice,
          invoiceNumber:
            selectedBooking.bookingNumber ||
            selectedBooking.booking_number ||
            `BK-${selectedBooking.id}`,
          voucherNumber:
            selectedBooking.voucherNumber ||
            selectedBooking.voucher_number ||
            `V-${selectedBooking.id}`,
          tax: taxAmount,
          totalAmount: totalAmount,
        };

        console.log("🎯 Updated line items:", newLineItems);
        setLineItems(newLineItems);

        // Auto-populate payment section
        const bookingStatus =
          selectedBooking.status ||
          selectedBooking.booking_status ||
          "confirmed";
        const bookingPaidAmount =
          selectedBooking.paidAmount || selectedBooking.paid_amount || 0;
        const bookingDiscount =
          selectedBooking.discountAmount ||
          selectedBooking.discount_amount ||
          0;

        console.log(
          "🎯 Payment data - Status:",
          bookingStatus,
          "Paid:",
          bookingPaidAmount,
          "Discount:",
          bookingDiscount
        );

        // Set payment status based on booking status
        let paymentStatusValue = "pending";
        if (bookingStatus === "paid" || bookingStatus === "completed") {
          paymentStatusValue = "paid";
        } else if (
          parseFloat(bookingPaidAmount) > 0 &&
          parseFloat(bookingPaidAmount) < totalAmount
        ) {
          paymentStatusValue = "partial";
        } else if (bookingStatus === "cancelled") {
          paymentStatusValue = "pending";
        }

        setPaymentStatus(paymentStatusValue);
        setAmountPaid(parseFloat(bookingPaidAmount) || 0);
        setDiscountAmount(parseFloat(bookingDiscount) || 0);

        console.log(
          "🎯 Payment fields updated - Status:",
          paymentStatusValue,
          "Amount Paid:",
          bookingPaidAmount,
          "Discount:",
          bookingDiscount
        );
      }
    } else {
      setSelectedCustomerId("");
      // Reset line items to default
      setLineItems([
        {
          travelCategory: "",
          vendor: "",
          itemTitle: "",
          invoiceNumber: "",
          voucherNumber: "",
          quantity: 1,
          unitPrice: 0,
          sellingPrice: 0,
          purchasePrice: 0,
          tax: 0,
          totalAmount: 0,
        },
      ]);
    }
  };

  // Travel categories for dropdown - show lead types only
  const getTravelCategories = () => {
    console.log("🏷️ Lead types data:", leadTypes);

    // Use lead types as primary categories
    const leadTypeCategories = leadTypes.map((lt: any) => {
      console.log("🏷️ Processing lead type:", lt);
      return lt.name || lt.type_name || lt.typeName || `Lead Type ${lt.id}`;
    });

    console.log("🏷️ Final travel categories:", leadTypeCategories);

    // If no lead types, fallback to preset categories
    if (leadTypeCategories.length === 0) {
      return [
        "Flight",
        "Hotel",
        "Transport",
        "Tour Package",
        "Visa Services",
        "Insurance",
        "Meals",
        "Activities",
        "Other Services",
      ];
    }

    return leadTypeCategories;
  };

  // Download PDF handler
  const handleDownloadPDF = async (invoice: any) => {
    try {
      // Get currency symbol helper
      const getCurrencySymbol = (currencyCode: string): string => {
        const symbols: { [key: string]: string } = {
          USD: "$",
          INR: "₹",
          EUR: "€",
          GBP: "£",
          JPY: "¥",
          AUD: "A$",
          CAD: "C$",
          CHF: "CHF",
          CNY: "¥",
          SGD: "S$",
          HKD: "HK$",
          NZD: "NZ$",
        };
        return symbols[currencyCode] || currencyCode;
      };

      // Parse line items
      const invoiceData = invoice as any;
      let lineItems: any[] = [];

      if (invoiceData.lineItems) {
        if (typeof invoiceData.lineItems === "string") {
          try {
            lineItems = JSON.parse(invoiceData.lineItems);
          } catch (e) {
            console.warn("Failed to parse line items:", e);
          }
        } else if (Array.isArray(invoiceData.lineItems)) {
          lineItems = invoiceData.lineItems;
        }
      }

      if (lineItems.length === 0) {
        if (invoiceData.line_items) {
          if (typeof invoiceData.line_items === "string") {
            try {
              lineItems = JSON.parse(invoiceData.line_items);
            } catch (e) {
              console.warn("Failed to parse line_items:", e);
            }
          } else if (Array.isArray(invoiceData.line_items)) {
            lineItems = invoiceData.line_items;
          }
        } else if (invoiceData.items && Array.isArray(invoiceData.items)) {
          lineItems = invoiceData.items;
        }
      }

      // Get customer data
      const customer = customers.find((c) => c.id === invoice.customerId);

      // Get company info from tenant
      const companyName = tenant?.companyName || "Company Name";
      const companyEmail = tenant?.contactEmail || "company@example.com";
      const companyPhone = tenant?.contactPhone || "";

      // Get currency symbol
      const currency = invoice.currency || "USD";
      const currencySymbol = getCurrencySymbol(currency);

      // Prepare invoice data for template
      const pdfData: any = {
        invoiceNumber: invoice.invoiceNumber || `INV-${invoice.id}`,
        issueDate: invoice.issueDate || new Date().toISOString().split("T")[0],
        dueDate: invoice.dueDate || new Date().toISOString().split("T")[0],
        customerName: customer?.name || customer?.customerName || "Customer",
        customerEmail: customer?.email || customer?.customerEmail || "",
        customerPhone: customer?.phone || customer?.customerPhone || "",
        customerAddress: customer?.address || customer?.customerAddress || "",
        companyName: companyName,
        companyEmail: companyEmail,
        companyPhone: companyPhone,
        companyAddress: tenant?.address || "",
        items:
          lineItems.length > 0
            ? lineItems
                .map((item, index) => {
                  const sellingPrice = parseFloat(
                    item.sellingPrice?.toString() ||
                      item.unitPrice?.toString() ||
                      item.price?.toString() ||
                      "0"
                  );
                  const quantity = parseInt(
                    item.quantity?.toString() || item.qty?.toString() || "1"
                  );
                  const totalAmount = parseFloat(
                    item.totalAmount?.toString() ||
                      item.totalPrice?.toString() ||
                      item.amount?.toString() ||
                      "0"
                  );

                  let description =
                    item.itemTitle?.trim() || item.description?.trim();
                  if (!description && item.travelCategory) {
                    description = item.travelCategory;
                  }
                  if (!description && item.name) {
                    description = item.name;
                  }
                  if (!description) {
                    description = `Item ${index + 1}`;
                  }

                  const calculatedTotal =
                    totalAmount > 0 ? totalAmount : sellingPrice * quantity;

                  return {
                    description: description,
                    quantity: quantity || 1,
                    unitPrice: sellingPrice || 0,
                    totalPrice: calculatedTotal || 0,
                  };
                })
                .filter((item) => item !== null)
            : [
                {
                  description: "No line items available",
                  quantity: 1,
                  unitPrice: 0,
                  totalPrice: 0,
                },
              ],
        subtotal: parseFloat(
          (invoiceData.subtotal || invoiceData.totalAmount || 0).toString()
        ),
        taxAmount: parseFloat((invoiceData.taxAmount || 0).toString()),
        discountAmount: parseFloat(
          (invoiceData.discountAmount || 0).toString()
        ),
        totalAmount: parseFloat(invoice.totalAmount || 0),
        currency: currencySymbol,
        notes: invoice.notes || undefined,
        paymentTerms: invoiceData.paymentTerms || undefined,
        paymentStatus: invoiceData.status || invoice.status || "pending",
        paidAmount: parseFloat((invoiceData.paidAmount || 0).toString()),
      };

      // Create a temporary div with the invoice HTML
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "800px";
      tempDiv.style.padding = "40px";
      tempDiv.style.backgroundColor = "#ffffff";
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
            <div>
              <h1 style="font-size: 28px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">${pdfData.companyName}</h1>
              <p style="color: #6b7280; margin-bottom: 4px;">${pdfData.companyEmail}</p>
              ${pdfData.companyPhone ? `<p style="color: #6b7280; margin-bottom: 4px;">${pdfData.companyPhone}</p>` : ""}
              ${pdfData.companyAddress ? `<p style="color: #6b7280; margin-bottom: 4px;">${pdfData.companyAddress}</p>` : ""}
            </div>
            <div style="text-align: right;">
              <div style="margin-bottom: 8px;">
                <h2 style="font-size: 24px; font-weight: 600; color: #3b82f6; margin: 0 0 8px 0; display: inline-block;">INVOICE</h2>
                ${pdfData.paymentStatus?.toLowerCase() === "paid" ? `<span style="display: inline-block; margin-left: 12px; padding: 6px 14px; border-radius: 4px; font-size: 11px; font-weight: 700; background-color: #10b981; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">PAID</span>` : ""}
              </div>
              <p style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">#${pdfData.invoiceNumber}</p>
              <p style="color: #6b7280; margin-bottom: 4px;">Date: ${formatDate(pdfData.issueDate)}</p>
              ${pdfData.paymentStatus?.toLowerCase() !== "paid" ? `<p style="color: #6b7280; margin-bottom: 4px;">Due: ${formatDate(pdfData.dueDate)}</p>` : ""}
            </div>
          </div>

          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">Bill To:</h3>
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
              <p style="font-weight: 600; margin-bottom: 4px;">${pdfData.customerName}</p>
              <p style="color: #6b7280; margin-bottom: 4px;">${pdfData.customerEmail}</p>
              ${pdfData.customerPhone ? `<p style="color: #6b7280; margin-bottom: 4px;">${pdfData.customerPhone}</p>` : ""}
              ${pdfData.customerAddress ? `<p style="color: #6b7280; margin-bottom: 4px;">${pdfData.customerAddress}</p>` : ""}
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Description</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Unit Price</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${pdfData.items
                .map(
                  (item: any) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px;">${item.description}</td>
                  <td style="padding: 12px; text-align: center;">${item.quantity}</td>
                  <td style="padding: 12px; text-align: right;">${pdfData.currency} ${item.unitPrice.toFixed(2)}</td>
                  <td style="padding: 12px; text-align: right;">${pdfData.currency} ${item.totalPrice.toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
            <div style="width: 300px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span>Subtotal:</span>
                <span>${pdfData.currency} ${pdfData.subtotal.toFixed(2)}</span>
              </div>
              ${
                pdfData.discountAmount > 0
                  ? `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #059669;">
                  <span>Discount:</span>
                  <span>-${pdfData.currency} ${pdfData.discountAmount.toFixed(2)}</span>
                </div>
              `
                  : ""
              }
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span>Tax:</span>
                <span>${pdfData.currency} ${pdfData.taxAmount.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 16px 0; margin-top: 12px; border-top: 2px solid #3b82f6; border-bottom: 2px solid #3b82f6;">
                <span style="font-size: 18px; font-weight: 700;">Total:</span>
                <span style="font-size: 18px; font-weight: 700;">${pdfData.currency} ${pdfData.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${
            pdfData.paymentStatus?.toLowerCase() !== "paid" &&
            pdfData.paymentTerms
              ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 40px;">
              <h4 style="font-weight: 600; margin-bottom: 8px;">Payment Terms:</h4>
              <p style="color: #6b7280;">${pdfData.paymentTerms}</p>
            </div>
          `
              : ""
          }

          ${
            pdfData.notes
              ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 40px;">
              <h4 style="font-weight: 600; margin-bottom: 8px;">Notes:</h4>
              <div style="color: #6b7280;">${pdfData.notes}</div>
            </div>
          `
              : ""
          }
        </div>
      `;

      document.body.appendChild(tempDiv);

      // Generate PDF using html2canvas and jsPDF
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(tempDiv, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page PDFs
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      // Clean up temporary element
      document.body.removeChild(tempDiv);

      // Download PDF
      pdf.save(`invoice-${pdfData.invoiceNumber || invoice.id}.pdf`);

      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully!",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Send invoice email handler
  const handleSendEmail = async (invoice: any) => {
    try {
      const response = await fetch(
        `/api/tenants/${tenant?.id}/invoices/${invoice.id}/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Invoice sent to customer successfully!`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Send invoice via WhatsApp handler
  const handleSendWhatsApp = async (invoice: any) => {
    try {
      const response = await fetch(
        `/api/tenants/${tenant?.id}/invoices/${invoice.id}/whatsapp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.whatsappLink) {
          // Open WhatsApp link in new tab
          window.open(data.whatsappLink, "_blank");
          toast({
            title: "Success",
            description: `WhatsApp link opened. Please send the message to complete.`,
          });
        } else {
          toast({
            title: "Success",
            description: `WhatsApp message prepared successfully!`,
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send WhatsApp message");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to send WhatsApp message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Status badge utility function
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return {
          label: "Paid",
          color: "bg-green-100 text-green-800 border-green-200",
        };
      case "pending":
        return {
          label: "Pending",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "partial":
        return {
          label: "Partially Paid",
          color: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "overdue":
        return {
          label: "Overdue",
          color: "bg-red-100 text-red-800 border-red-200",
        };
      case "draft":
        return {
          label: "Draft",
          color: "bg-gray-100 text-gray-800 border-gray-200",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "bg-gray-100 text-gray-800 border-gray-200",
        };
      case "void":
        return {
          label: "Void",
          color: "bg-purple-100 text-purple-800 border-purple-200",
        };
      default:
        return {
          label: status || "Unknown",
          color: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  // Fetch customers for dropdown
  const {
    data: customers = [],
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: [`customers-tenant-${tenant?.id}`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/customers?action=get-customers&tenantId=${tenant?.id}&all=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      const result = await response.json();

      // Handle different response formats
      let customerData = [];
      if (Array.isArray(result)) {
        customerData = result;
      } else if (result.customers && Array.isArray(result.customers)) {
        customerData = result.customers;
      } else if (result.data && Array.isArray(result.data)) {
        customerData = result.data;
      } else if (result.rows && Array.isArray(result.rows)) {
        customerData = result.rows;
      }

      return customerData;
    },
  });

  // Fetch vendors for dropdown
  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/vendors`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.vendors || [];
    },
  });

  // Fetch service providers for dropdown (filtered by lead type)
  const { data: serviceProviders = [] } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/service-providers`, leadTypeFilter],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const url =
        leadTypeFilter && leadTypeFilter !== "all"
          ? `/api/tenants/${tenant?.id}/service-providers?leadTypeId=${leadTypeFilter}`
          : `/api/tenants/${tenant?.id}/service-providers`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.providers || [];
    },
  });

  // Fetch lead types for dropdown
  const {
    data: leadTypes = [],
    isLoading: leadTypesLoading,
    error: leadTypesError,
  } = useQuery<any[]>({
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

  console.log("🏷️ Lead types query state:", {
    leadTypes,
    loading: leadTypesLoading,
    error: leadTypesError,
    tenantId: tenant?.id,
  });

  // Fetch bookings for dropdown
  const { data: bookings = [] } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/bookings`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const result = await response.json();
      return Array.isArray(result) ? result : result.bookings || [];
    },
  });

  // Fetch invoices with filters and pagination
  const {
    data: invoicesResponse,
    isLoading,
    error,
  } = useQuery<{
    data: Invoice[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: [
      `/api/tenants/${tenant?.id}/invoices`,
      currentPage,
      pageSize,
      statusFilter,
      customerFilter,
      vendorFilter,
      providerFilter,
      leadTypeFilter,
      searchTerm,
      dateFilter,
      customDateFrom,
      customDateTo,
      sortBy,
      sortOrder,
    ],
    enabled: !!tenant?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const token = auth.getToken();
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("pageSize", pageSize.toString());

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (customerFilter && customerFilter.length > 0) {
        customerFilter.forEach((customerId) => {
          params.append("customerId", customerId);
        });
      }
      if (vendorFilter && vendorFilter !== "all") {
        params.append("vendorId", vendorFilter);
      }
      if (providerFilter && providerFilter !== "all") {
        params.append("providerId", providerFilter);
      }
      if (leadTypeFilter && leadTypeFilter !== "all") {
        params.append("leadTypeId", leadTypeFilter);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      // Build date filters from date filter state
      const dateFilters = buildDateFilters(
        dateFilter,
        customDateFrom,
        customDateTo
      );
      if (dateFilters) {
        params.append("startDate", dateFilters.startDate);
        params.append("endDate", dateFilters.endDate);
      }

      if (sortBy) {
        params.append("sortBy", sortBy);
        params.append("sortOrder", sortOrder);
      }

      const response = await fetch(
        `/api/tenants/${tenant?.id}/invoices?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );
      if (!response.ok) {
        console.error("Invoices API Error:", response.status);
        return {
          data: [],
          pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        };
      }
      const result = await response.json();

      // Handle both old format (array) and new format (object with data and pagination)
      let invoicesData: Invoice[] = [];
      let paginationData = { page: 1, pageSize: 10, total: 0, totalPages: 0 };

      if (Array.isArray(result)) {
        invoicesData = result;
        paginationData = {
          page: 1,
          pageSize: result.length,
          total: result.length,
          totalPages: 1,
        };
      } else {
        invoicesData = result.data || [];
        paginationData = result.pagination || {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        };
      }

      // Return invoices as-is from API (backend handles all filtering including void status)
      return {
        data: invoicesData,
        pagination: paginationData,
      };
    },
  });

  const invoices = invoicesResponse?.data || [];
  const pagination = invoicesResponse?.pagination || {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  };

  // Helper function to get currency symbol
  const getCurrencySymbol = (currencyCode: string): string => {
    const symbols: { [key: string]: string } = {
      USD: "$",
      INR: "₹",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      AUD: "A$",
      CAD: "C$",
      CHF: "CHF",
      CNY: "¥",
      SGD: "S$",
      HKD: "HK$",
      NZD: "NZ$",
    };
    return symbols[currencyCode] || currencyCode;
  };

  // Helper function to format date as dd-mm-yyyy
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "-";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "-";

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // Update invoice status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      invoiceId,
      status,
      hasCancellationCharge,
      cancellationChargeAmount,
      cancellationChargeNotes,
    }: {
      invoiceId: number;
      status: string;
      hasCancellationCharge?: boolean;
      cancellationChargeAmount?: number;
      cancellationChargeNotes?: string;
    }) => {
      const token = auth.getToken();
      const updateData: any = { status };
      
      if (status === "cancelled" && hasCancellationCharge) {
        updateData.hasCancellationCharge = true;
        updateData.cancellationChargeAmount = cancellationChargeAmount || 0;
        updateData.cancellationChargeNotes = cancellationChargeNotes || "";
      } else if (status === "cancelled") {
        updateData.hasCancellationCharge = false;
        updateData.cancellationChargeAmount = 0;
        updateData.cancellationChargeNotes = "";
      }
      
      const response = await fetch(
        `/api/tenants/${tenant?.id}/invoices/${invoiceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update invoice status: ${response.status} - ${errorText}`
        );
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Invoice status has been updated successfully.",
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices`],
      });
      
      // Reset cancellation charge dialog state
      setIsCancellationChargeDialogOpen(false);
      setPendingStatusChange(null);
      setCancellationChargeAmount("");
      setCancellationChargeNotes("");
      setShowCancellationChargeFields(false);
    },
    onError: (error: any) => {
      toast({
        title: "Status Update Failed",
        description:
          error.message || "Failed to update invoice status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/tenants/${tenant?.id}/invoices/${invoiceId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete invoice: ${response.status} - ${errorText}`
        );
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice Deleted",
        description: "Invoice has been deleted successfully.",
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices`],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description:
          error.message || "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle delete confirmation
  const handleDeleteInvoice = (invoiceId: number) => {
    if (window.confirm("Are you sure you want to delete this invoice? This will also delete all related expenses.")) {
      deleteInvoiceMutation.mutate(invoiceId);
    }
  };

  // Column definitions for the enhanced table
  const invoiceColumns: TableColumn<Invoice>[] = [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      sortable: true,
      render: (value, invoice) => {
        const invoiceData = invoice as any;
        const isCancelled = invoiceData.status === "cancelled";
        return (
          <button
            onClick={() => {
              if (!isCancelled) {
                navigate(`/invoice-edit/${invoice.id}${getPaginationParams()}`);
              }
            }}
            disabled={isCancelled}
            className={`font-medium ${
              isCancelled
                ? "text-gray-400 cursor-not-allowed no-underline"
                : "text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            }`}
          >
            {value || `INV-${invoice.id}`}
          </button>
        );
      },
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (customerName, invoice) => {
        const customer = customers.find((c) => c.id === invoice.customerId);
        const displayName = customerName || customer?.name || "Unknown";
        const customerId = invoice.customerId;
        
        return (
          <div className="flex flex-col">
            {customerId ? (
              <button
                onClick={() => {
                  navigate(`/customers/${customerId}`);
                }}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
              >
                {displayName}
              </button>
            ) : (
              <div className="font-medium">{displayName}</div>
            )}
            <div className="text-sm text-gray-500 flex items-center mt-1">
              <Mail className="h-3 w-3 mr-1" />
              {customer?.email || ""}
            </div>
          </div>
        );
      },
    },
    // Booking column hidden as per request
    // {
    //   key: "bookingNumber",
    //   label: "Booking",
    //   sortable: true,
    //   render: (_, invoice) => {
    //     const booking = bookings.find((b) => b.id === invoice.bookingId);
    //     return (
    //       <div className="flex flex-col">
    //         <div className="font-medium">
    //           {booking ? booking.bookingNumber || `BK-${booking.id}` : "-"}
    //         </div>
    //         {booking && (
    //           <div className="text-sm text-gray-500 flex items-center mt-1">
    //             <Calendar className="h-3 w-3 mr-1" />
    //             {booking.travelDate
    //               ? new Date(booking.travelDate).toLocaleDateString()
    //               : "No date"}
    //           </div>
    //         )}
    //       </div>
    //     );
    //   },
    // },
    {
      key: "invoiceVoucherNumbers",
      label: "Invoice/Voucher #",
      sortable: false,
      render: (_, invoice) => {
        const invoiceData = invoice as any;
        let lineItems: any[] = [];

        // Parse line items
        if (invoiceData.lineItems) {
          if (typeof invoiceData.lineItems === "string") {
            try {
              lineItems = JSON.parse(invoiceData.lineItems);
            } catch (e) {
              console.warn("Failed to parse line items:", e);
            }
          } else if (Array.isArray(invoiceData.lineItems)) {
            lineItems = invoiceData.lineItems;
          }
        }

        // Extract invoice/voucher numbers from line items
        const numbers = lineItems
          .map((item) => item.invoiceNumber || item.voucherNumber)
          .filter((num) => num && num.trim() !== "");

        if (numbers.length === 0) {
          return <div className="text-gray-400">-</div>;
        }

        return (
          <div className="flex flex-col gap-1">
            {numbers.slice(0, 3).map((num, idx) => (
              <div key={idx} className="text-sm font-medium">
                {num}
              </div>
            ))}
            {numbers.length > 3 && (
              <div className="text-xs text-gray-500">
                +{numbers.length - 3} more
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "issueDate",
      label: "Issue Date",
      sortable: true,
      render: (issueDate) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span>{formatDate(issueDate)}</span>
        </div>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      render: (dueDate, invoice) => {
        const isOverdue =
          invoice.status === "overdue" ||
          (invoice.status === "pending" &&
            dueDate &&
            new Date(dueDate) < new Date());
        return (
          <div className="flex items-center">
            <Clock
              className={`h-4 w-4 mr-2 ${isOverdue ? "text-red-400" : "text-gray-400"}`}
            />
            <span className={isOverdue ? "text-red-600 font-medium" : ""}>
              {formatDate(dueDate)}
            </span>
          </div>
        );
      },
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      sortable: true,
      render: (totalAmount, invoice) => {
        const invoiceData = invoice as any;
        const currency = invoiceData.currency || "USD";
        const currencySymbol = getCurrencySymbol(currency);
        return (
          <div className="flex items-center font-semibold">
            <span className="mr-1">{currencySymbol}</span>
            <span>
              {totalAmount
                ? parseFloat(totalAmount.toString()).toLocaleString()
                : "0"}
            </span>
          </div>
        );
      },
    },
    {
      key: "paidAmount",
      label: "Amount Paid",
      sortable: true,
      render: (_, invoice) => {
        const invoiceData = invoice as any;
        const paidAmount = invoiceData.paidAmount || 0;
        const currency = invoiceData.currency || "USD";
        const currencySymbol = getCurrencySymbol(currency);
        return (
          <div className="flex items-center font-semibold">
            <span className="mr-1">{currencySymbol}</span>
            <span>{parseFloat(paidAmount.toString()).toLocaleString()}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (status, invoice) => {
        // Use the status from the API - don't auto-detect to override explicit status
        const invoiceData = invoice as any;
        const paidAmount = parseFloat(
          invoiceData.paidAmount?.toString() ||
            invoiceData.amountPaid?.toString() ||
            "0"
        );
        const totalAmount = parseFloat(
          invoiceData.totalAmount?.toString() || "0"
        );

        // Only auto-detect if status is missing/null/undefined, not when explicitly set
        let displayStatus = status;
        if (!displayStatus) {
          // Auto-detect status only when status is not set at all
          if (paidAmount > 0 && paidAmount < totalAmount) {
            displayStatus = "partial";
          } else if (paidAmount >= totalAmount && totalAmount > 0) {
            displayStatus = "paid";
          } else {
            displayStatus = "pending";
          }
        }

        const statusConfig = getStatusBadge(displayStatus);
        return (
          <Select
            value={displayStatus || "pending"}
            onValueChange={(newStatus) => {
              // If changing to cancelled, show cancellation charge dialog
              if (newStatus === "cancelled") {
                setPendingStatusChange({ invoiceId: invoice.id, status: newStatus });
                setIsCancellationChargeDialogOpen(true);
                setCancellationChargeAmount("");
                setCancellationChargeNotes("");
                setShowCancellationChargeFields(false);
              } else {
                // For other status changes, update directly
                updateStatusMutation.mutate({
                  invoiceId: invoice.id,
                  status: newStatus,
                });
              }
            }}
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger
              className={`w-[140px] h-8 ${statusConfig.color} border-0`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {invoiceStatuses.map((statusOption) => (
                <SelectItem key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </SelectItem>
              ))}
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
      render: (_, invoice) => (
        <div className="flex justify-end items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedInvoice(invoice);
              setIsViewDialogOpen(true);
            }}
            title="View Invoice"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                title="More Actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  const invoiceData = invoice as any;
                  if (invoiceData.status !== "cancelled") {
                    navigate(`/invoice-edit/${invoice.id}${getPaginationParams()}`);
                  }
                }}
                disabled={(invoice as any).status === "cancelled"}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Invoice
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedInvoiceForFollowUp(invoice);
                  setFollowUpDialogOpen(true);
                }}
              >
                <Target className="h-4 w-4 mr-2" />
                Add Follow-Up
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownloadPDF(invoice)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSendEmail(invoice)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSendWhatsApp(invoice)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Send WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setInvoiceToDuplicate(invoice);
                  setDuplicateCustomerId(invoice.customerId?.toString() || "");
                  setDuplicateCustomerSearch(""); // Reset search when opening
                  setIsDuplicateDialogOpen(true);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Reissue Invoice
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteInvoice(invoice.id)}
                className="text-red-600"
                disabled={deleteInvoiceMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  // Reset to page 1 when applied filters change (but not on initial mount if URL params exist)
  useEffect(() => {
    // Skip reset on initial mount if URL has pagination params
    if (isInitialMount.current) {
      const params = new URLSearchParams(window.location.search);
      if (params.has("page") || params.has("pageSize")) {
        isInitialMount.current = false;
        return; // Don't reset if we're loading from URL params
      }
      isInitialMount.current = false;
      return; // Don't reset on initial mount even without URL params (let initial state handle it)
    }
    
    // Only reset if filters actually changed (not on initial mount)
    resetToPageOne();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    statusFilter,
    customerFilter,
    vendorFilter,
    providerFilter,
    leadTypeFilter,
    searchTerm,
  ]);

  // Map column keys to API field names
  const getApiFieldName = (columnKey: string): string => {
    const fieldMap: { [key: string]: string } = {
      invoiceNumber: "invoice_number",
      customerName: "customer_id", // Will need to sort by customer name via join
      issueDate: "issue_date",
      dueDate: "due_date",
      totalAmount: "total_amount",
      paidAmount: "paid_amount",
      status: "status",
    };
    return fieldMap[columnKey] || columnKey;
  };

  // Map API field names back to column keys for icon display
  const getColumnKeyFromApiField = (apiField: string): string | null => {
    const reverseMap: { [key: string]: string } = {
      invoice_number: "invoiceNumber",
      customer_id: "customerName",
      issue_date: "issueDate",
      due_date: "dueDate",
      total_amount: "totalAmount",
      paid_amount: "paidAmount",
      status: "status",
      created_at: "created_at",
    };
    return reverseMap[apiField] || null;
  };

  // Handle column sorting
  const handleSort = (columnKey: string) => {
    const apiField = getApiFieldName(columnKey);
    if (sortBy === apiField) {
      // Toggle sort order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort column
      setSortBy(apiField);
      setSortOrder("asc");
    }
    resetToPageOne(); // Reset to first page when sorting changes
  };

  // Auto-update date filters when dateFilter changes (for predefined ranges)
  useEffect(() => {
    if (dateFilter && dateFilter !== "all" && dateFilter !== "custom") {
      const dateFilters = buildDateFilters(dateFilter, null, null);
      if (dateFilters) {
        setCustomDateFrom(new Date(dateFilters.startDate));
        setCustomDateTo(new Date(dateFilters.endDate));
        setLocalCustomDateFrom(new Date(dateFilters.startDate));
        setLocalCustomDateTo(new Date(dateFilters.endDate));
      }
    } else if (dateFilter === "all") {
      setCustomDateFrom(null);
      setCustomDateTo(null);
      setLocalCustomDateFrom(null);
      setLocalCustomDateTo(null);
    }
  }, [dateFilter]);

  // Apply filters function
  const handleApplyFilters = () => {
    setSearchTerm(localSearchTerm);
    setStatusFilter(localStatusFilter);
    setCustomerFilter([...localCustomerFilter]);
    setVendorFilter(localVendorFilter);
    setProviderFilter(localProviderFilter);
    setLeadTypeFilter(localLeadTypeFilter);
    setDateFilter(localDateFilter);
    setCustomDateFrom(localCustomDateFrom);
    setCustomDateTo(localCustomDateTo);
    resetToPageOne();
  };

  // Reset filters function
  const handleResetFilters = () => {
    setLocalSearchTerm("");
    setLocalStatusFilter("all");
    setLocalCustomerFilter([]);
    setLocalVendorFilter("all");
    setLocalProviderFilter("all");
    setLocalLeadTypeFilter("all");
    setLocalDateFilter("all");
    setLocalCustomDateFrom(null);
    setLocalCustomDateTo(null);
    setSearchTerm("");
    setStatusFilter("all");
    setCustomerFilter([]);
    setVendorFilter("all");
    setProviderFilter("all");
    setLeadTypeFilter("all");
    setDateFilter("all");
    setCustomDateFrom(null);
    setCustomDateTo(null);
    resetToPageOne();
  };

  // Multi-select customer component
  const MultiSelectCustomer = ({
    customers,
    selectedCustomers,
    onSelectionChange,
  }: {
    customers: any[];
    selectedCustomers: string[];
    onSelectionChange: (selected: string[]) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCustomers = customers.filter((customer) => {
      if (!searchQuery) return true;
      const name = (customer.name || customer.customerName || "").toLowerCase();
      const email = (customer.email || "").toLowerCase();
      return (
        name.includes(searchQuery.toLowerCase()) ||
        email.includes(searchQuery.toLowerCase())
      );
    });

    const toggleCustomer = (customerId: string) => {
      if (selectedCustomers.includes(customerId)) {
        onSelectionChange(selectedCustomers.filter((id) => id !== customerId));
      } else {
        onSelectionChange([...selectedCustomers, customerId]);
      }
    };

    const displayText =
      selectedCustomers.length === 0
        ? "Customer"
        : selectedCustomers.length === 1
          ? customers.find((c) => c.id.toString() === selectedCustomers[0])
              ?.name ||
            customers.find((c) => c.id.toString() === selectedCustomers[0])
              ?.customerName ||
            "1 selected"
          : `${selectedCustomers.length} selected`;

    return (
      <div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-9 text-sm"
            >
              <span className="truncate text-xs">{displayText}</span>
              <Search className="ml-2 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search customers..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No customers found.</CommandEmpty>
                <CommandGroup>
                  {filteredCustomers.map((customer) => {
                    const isSelected = selectedCustomers.includes(
                      customer.id.toString()
                    );
                    return (
                      <CommandItem
                        key={customer.id}
                        onSelect={() => toggleCustomer(customer.id.toString())}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <div>
                            {customer.name ||
                              customer.customerName ||
                              "Unknown"}
                          </div>
                          {customer.email && (
                            <div className="text-xs text-gray-500">
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedCustomers.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedCustomers.map((customerId) => {
              const customer = customers.find(
                (c) => c.id.toString() === customerId
              );
              return (
                <span
                  key={customerId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs"
                >
                  {customer?.name || customer?.customerName || "Unknown"}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectionChange(
                        selectedCustomers.filter((id) => id !== customerId)
                      );
                    }}
                    className="hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Fetch customers for duplicate dialog with search
  const { data: duplicateCustomers = [] } = useQuery({
    queryKey: [`duplicate-customers-${tenant?.id}`, debouncedDuplicateCustomerSearch],
    enabled: !!tenant?.id && isDuplicateDialogOpen,
    queryFn: async () => {
      const result = await directCustomersApi.getCustomers(tenant?.id!, {
        search: debouncedDuplicateCustomerSearch || undefined,
        limit: 50,
      });
      return Array.isArray(result) ? result : result?.data || [];
    },
  });

  // Fetch the selected customer separately if not in search results
  const { data: selectedDuplicateCustomer } = useQuery({
    queryKey: [`duplicate-selected-customer-${duplicateCustomerId}`],
    enabled: 
      !!duplicateCustomerId && 
      !!tenant?.id && 
      isDuplicateDialogOpen &&
      !duplicateCustomers.find((c: any) => c.id?.toString() === duplicateCustomerId),
    queryFn: async () => {
      try {
        return await directCustomersApi.getCustomer(tenant?.id!, parseInt(duplicateCustomerId));
      } catch (error) {
        console.error("Error fetching selected customer:", error);
        return null;
      }
    },
  });

  // Merge selected customer with duplicate customers list
  const allDuplicateCustomers = useMemo(() => {
    const customersList = [...duplicateCustomers];
    
    // Add selected customer if it exists and is not already in the list
    if (selectedDuplicateCustomer) {
      const exists = customersList.find((c: any) => c.id === selectedDuplicateCustomer.id);
      if (!exists) {
        customersList.unshift(selectedDuplicateCustomer);
      }
    }
    
    return customersList;
  }, [duplicateCustomers, selectedDuplicateCustomer]);

  // Get customer options for duplicate dialog
  const allDuplicateCustomerOptions = useMemo(() => {
    return allDuplicateCustomers.map((customer: any) => {
      const name = customer.name || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Unknown";
      // Include email and phone in label for searchability, but keep name clean for display
      const searchLabel = [name];
      if (customer.email) searchLabel.push(customer.email);
      if (customer.phone) searchLabel.push(customer.phone);
      return {
        value: customer.id?.toString() || "",
        label: searchLabel.join(" | "), // Include all for search
        email: customer.email,
        phone: customer.phone,
      };
    });
  }, [allDuplicateCustomers]);

  // Note: We no longer need to fetch invoice data for duplication
  // The backend API handles fetching and duplicating all data directly from the database

  // Duplicate invoice mutation - uses new backend API
  const duplicateInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceId, customerId }: { invoiceId: number; customerId: string }) => {
      const token = auth.getToken();

      const response = await fetch(
        `/api/tenants/${tenant?.id}/invoices/${invoiceId}/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customerId: parseInt(customerId),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to reissue invoice: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = `${errorMessage} - ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Invoice Reissued Successfully",
        description: `New invoice ${result.invoice?.invoiceNumber || "created"} has been created with all related data.`,
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices`],
      });
      
      setIsDuplicateDialogOpen(false);
      setInvoiceToDuplicate(null);
      setDuplicateCustomerId("");
      setDuplicateCustomerSearch("");
    },
    onError: (error: any) => {
      toast({
        title: "Invoice Reissue Failed",
        description:
          error.message || "Failed to reissue invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle duplicate confirmation
  const handleDuplicateConfirm = () => {
    if (!invoiceToDuplicate || !duplicateCustomerId) {
      toast({
        title: "Error",
        description: "Please select a customer for the reissue invoice.",
        variant: "destructive",
      });
      return;
    }

    duplicateInvoiceMutation.mutate({
      invoiceId: invoiceToDuplicate.id,
      customerId: duplicateCustomerId,
    });
  };

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create invoice: ${response.status} - ${errorText}`
        );
      }

      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Invoice Created Successfully",
        description: `New invoice ${result.invoiceNumber || "created"} has been added.`,
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices`],
      });
      setIsCreateDialogOpen(false);

      // Reset line items and form state
      setLineItems([
        {
          travelCategory: "",
          vendor: "",
          itemTitle: "",
          invoiceNumber: "",
          voucherNumber: "",
          quantity: 1,
          unitPrice: 0,
          sellingPrice: 0,
          purchasePrice: 0,
          tax: 0,
          totalAmount: 0,
        },
      ]);
      setSelectedBookingId("");
      setSelectedCustomerId("");
      setDiscountAmount(0);
      setAmountPaid(0);
      setPaymentStatus("pending");
    },
    onError: (error: any) => {
      toast({
        title: "Invoice Creation Failed",
        description:
          error.message || "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission for creating invoice
  const handleCreateInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const grandTotal = calculateGrandTotal();

    const invoiceData = {
      tenantId: tenant?.id,
      customerId: parseInt(selectedCustomerId),
      bookingId:
        selectedBookingId &&
        selectedBookingId !== "" &&
        selectedBookingId !== "none"
          ? parseInt(selectedBookingId)
          : null,
      invoiceNumber:
        (formData.get("invoiceNumber") as string) || `INV-${Date.now()}`,
      issueDate: formData.get("issueDate") as string,
      dueDate: formData.get("dueDate") as string,
      totalAmount: calculatePaymentSummary().finalAmount,
      paidAmount: amountPaid,
      subtotal: grandTotal,
      taxAmount: lineItems.reduce((total, item) => total + item.tax, 0),
      discountAmount: discountAmount,
      status: paymentStatus,
      currency: (formData.get("currency") as string) || "INR",
      notes: (formData.get("notes") as string) || "",
      paymentTerms: (formData.get("paymentTerms") as string) || "30 days",
      lineItems: lineItems,
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  if (error) {
    return (
      <Layout>
        <div className="p-4 sm:p-8 w-full">
          <Card className="border-red-200">
            <CardContent className="text-center py-12">
              <div className="text-red-500 mb-4">⚠️ Error Loading Invoices</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Unable to load invoices data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error.message ||
                  "There was an error loading the invoices. Please try again."}
              </p>
              <Button
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: [`/api/tenants/${tenant?.id}/invoices`],
                  })
                }
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }




  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Invoices
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your travel service invoices and payments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              title="Import Invoices"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  title="Export Invoices"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportInvoicesPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportInvoicesCSV}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportInvoicesExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <InvoiceAnalyticsSheet
              isAnalyticsOpen={isAnalyticsOpen}
              setIsAnalyticsOpen={setIsAnalyticsOpen}
            />

            <Link href={`/invoice-create${getPaginationParams()}`}>
              <Button data-testid="button-create-invoice">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyFilters();
              }}
            >
              <div className="space-y-3">
                {/* First Row: Search and Date Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                    <Input
                      placeholder="Search invoice number and voucher number"
                      value={localSearchTerm}
                      onChange={(e) => setLocalSearchTerm(e.target.value)}
                      className="pl-7 h-9 text-sm"
                    />
                  </div>
                  <DateFilter
                    dateFilter={localDateFilter}
                    setDateFilter={(value) => {
                      setLocalDateFilter(value);
                      setDateFilter(value);
                      resetToPageOne();
                    }}
                    customDateFrom={localCustomDateFrom}
                    setCustomDateFrom={(date) => {
                      setLocalCustomDateFrom(date);
                      setCustomDateFrom(date);
                      setDateFilter("custom");
                      setLocalDateFilter("custom");
                      resetToPageOne();
                    }}
                    customDateTo={localCustomDateTo}
                    setCustomDateTo={(date) => {
                      setLocalCustomDateTo(date);
                      setCustomDateTo(date);
                      setDateFilter("custom");
                      setLocalDateFilter("custom");
                      resetToPageOne();
                    }}
                  />
                </div>

                {/* Second Row: Status, Customer, Services, Vendor, Provider */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <Select
                    value={localStatusFilter}
                    onValueChange={(value) => {
                      setLocalStatusFilter(value);
                      setStatusFilter(value);
                      resetToPageOne();
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {invoiceStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="min-w-0">
                    <MultiSelectCustomer
                      customers={customers}
                      selectedCustomers={localCustomerFilter}
                      onSelectionChange={(selected) => {
                        setLocalCustomerFilter(selected);
                        setCustomerFilter([...selected]);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <Select
                    value={localLeadTypeFilter}
                    onValueChange={(value) => {
                      setLocalLeadTypeFilter(value);
                      setLeadTypeFilter(value);
                      resetToPageOne();
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {leadTypes.map((leadType) => (
                        <SelectItem
                          key={leadType.id}
                          value={leadType.id.toString()}
                        >
                          {leadType.name || leadType.leadTypeName || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={localVendorFilter}
                    onValueChange={(value) => {
                      setLocalVendorFilter(value);
                      setVendorFilter(value);
                      resetToPageOne();
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem
                          key={vendor.id}
                          value={vendor.id.toString()}
                        >
                          {vendor.name || vendor.vendorName || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={localProviderFilter}
                    onValueChange={(value) => {
                      setLocalProviderFilter(value);
                      setProviderFilter(value);
                      resetToPageOne();
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {serviceProviders.map((provider) => (
                        <SelectItem
                          key={provider.id}
                          value={provider.id.toString()}
                        >
                          {provider.name || provider.providerName || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="text-xs text-gray-500">
                  Showing {invoices.length} of {pagination.total} invoices
                  {pagination.totalPages > 1 &&
                    ` (Page ${pagination.page} of ${pagination.totalPages})`}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-8 text-xs"
                  >
                    Reset
                  </Button>
                  <Button type="submit" size="sm" className="h-8 text-xs">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice List</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedTable
              data={invoices}
              columns={invoiceColumns}
              isLoading={isLoading}
              showPagination={false}
              emptyMessage="No invoices found. Create your first invoice to get started."
              externalSort={{
                sortColumn: sortBy ? getColumnKeyFromApiField(sortBy) : null,
                sortDirection: sortOrder,
                onSort: handleSort,
              }}
            />
            {/* Backend Pagination Controls */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, pagination.total)} of{" "}
                  {pagination.total} invoices
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="pageSize" className="text-sm text-gray-500">
                    Show:
                  </Label>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      const newSize = parseInt(value);
                      setPageSize(newSize);
                      setCurrentPage(1); // Reset to first page when changing page size
                      updateURLParams(1, newSize);
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
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      updateURLParams(newPage, pageSize);
                    }}
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
                            onClick={() => {
                              setCurrentPage(pageNum);
                              updateURLParams(pageNum, pageSize);
                            }}
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
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new invoice for your customer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bookingId">Booking (Optional)</Label>
                <Select
                  name="bookingId"
                  value={selectedBookingId}
                  onValueChange={handleBookingSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No booking selected</SelectItem>
                    {bookings && bookings.length > 0
                      ? bookings.map((booking) => (
                          <SelectItem
                            key={booking.id}
                            value={booking.id.toString()}
                          >
                            {booking.bookingNumber || `BK-${booking.id}`} -{" "}
                            {booking.customerName || "Unknown Customer"}
                            {booking.travelDate &&
                              ` (${new Date(booking.travelDate).toLocaleDateString()})`}
                          </SelectItem>
                        ))
                      : null}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="customerId">Customer</Label>
                <Select
                  name="customerId"
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers && customers.length > 0
                      ? customers.map((customer) => (
                          <SelectItem
                            key={customer.id}
                            value={customer.id.toString()}
                          >
                            {customer.name ||
                              `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                              "Unnamed Customer"}
                          </SelectItem>
                        ))
                      : null}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  name="invoiceNumber"
                  placeholder={`INV-${Date.now()}`}
                  defaultValue={`INV-${Date.now()}`}
                />
              </div>
              <div>
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  name="issueDate"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  name="dueDate"
                  type="date"
                  defaultValue={
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0]
                  }
                  required
                />
              </div>
            </div>

            {/* Booking Line Items Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Booking Line Items</h3>

              {lineItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Travel Category *</Label>
                      <Select
                        value={item.travelCategory}
                        onValueChange={(value) =>
                          updateLineItem(index, "travelCategory", value)
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
                      <Label>Vendor</Label>
                      <Select
                        value={item.vendor}
                        onValueChange={(value) =>
                          updateLineItem(index, "vendor", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            No vendor selected
                          </SelectItem>
                          {vendors && vendors.length > 0
                            ? vendors.map((vendor) => (
                                <SelectItem
                                  key={vendor.id}
                                  value={vendor.id.toString()}
                                >
                                  {vendor.companyName ||
                                    vendor.name ||
                                    "Unnamed Vendor"}
                                </SelectItem>
                              ))
                            : null}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Item Title *</Label>
                      <Input
                        value={item.itemTitle}
                        onChange={(e) =>
                          updateLineItem(index, "itemTitle", e.target.value)
                        }
                        placeholder="Enter item title"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Invoice Number</Label>
                      <Input
                        value={item.invoiceNumber}
                        onChange={(e) =>
                          updateLineItem(index, "invoiceNumber", e.target.value)
                        }
                        placeholder="Enter invoice number (optional)"
                      />
                    </div>

                    <div>
                      <Label>Voucher Number</Label>
                      <Input
                        value={item.voucherNumber}
                        onChange={(e) =>
                          updateLineItem(index, "voucherNumber", e.target.value)
                        }
                        placeholder="Enter voucher number (optional)"
                      />
                    </div>

                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
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
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label>Selling Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.sellingPrice}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "sellingPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label>Purchase Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.purchasePrice}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "purchasePrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tax</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.tax}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "tax",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label>Total Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.totalAmount.toFixed(2)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center">
                <Button type="button" variant="outline" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line Item
                </Button>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Grand Total:</span>
                  <span>₹{calculateGrandTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment & Special Requests Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <span className="mr-2">💰</span> Payment & Special Requests
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discountAmount">Discount Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) =>
                      setDiscountAmount(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="amountPaid">Amount Paid</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) =>
                      setAmountPaid(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Payment history will track all payments
                  </p>
                </div>

                <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={paymentStatus}
                    onValueChange={setPaymentStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partially Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Payment history tracks when user paid
                  </p>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">
                  Payment Summary
                </h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Amount:</p>
                    <p className="font-semibold">
                      ₹{calculatePaymentSummary().totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Discount:</p>
                    <p className="font-semibold text-green-600">
                      -₹{calculatePaymentSummary().discountAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Final Amount:</p>
                    <p className="font-semibold text-blue-600">
                      ₹{calculatePaymentSummary().finalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining:</p>
                    <p className="font-semibold text-red-600">
                      ₹{calculatePaymentSummary().remaining.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select name="currency" defaultValue="INR">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  name="paymentTerms"
                  placeholder="30 days"
                  defaultValue="30 days"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea name="notes" placeholder="Additional notes..." />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createInvoiceMutation.isPending}>
                {createInvoiceMutation.isPending
                  ? "Creating..."
                  : "Create Invoice"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog - Preview */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              View invoice details as it appears to customers.
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice &&
            (() => {
              // Get currency symbol helper
              const getCurrencySymbol = (currencyCode: string): string => {
                const symbols: { [key: string]: string } = {
                  USD: "$",
                  INR: "₹",
                  EUR: "€",
                  GBP: "£",
                  JPY: "¥",
                  AUD: "A$",
                  CAD: "C$",
                  CHF: "CHF",
                  CNY: "¥",
                  SGD: "S$",
                  HKD: "HK$",
                  NZD: "NZ$",
                };
                return symbols[currencyCode] || currencyCode;
              };

              // Parse line items
              const invoiceData = selectedInvoice as any;
              let lineItems: any[] = [];

              // Try multiple ways to get line items
              if (invoiceData.lineItems) {
                if (typeof invoiceData.lineItems === "string") {
                  try {
                    lineItems = JSON.parse(invoiceData.lineItems);
                  } catch (e) {
                    console.warn("Failed to parse line items:", e);
                  }
                } else if (Array.isArray(invoiceData.lineItems)) {
                  lineItems = invoiceData.lineItems;
                }
              }

              // Also check for line_items (snake_case) or items
              if (lineItems.length === 0) {
                if (invoiceData.line_items) {
                  if (typeof invoiceData.line_items === "string") {
                    try {
                      lineItems = JSON.parse(invoiceData.line_items);
                    } catch (e) {
                      console.warn("Failed to parse line_items:", e);
                    }
                  } else if (Array.isArray(invoiceData.line_items)) {
                    lineItems = invoiceData.line_items;
                  }
                } else if (
                  invoiceData.items &&
                  Array.isArray(invoiceData.items)
                ) {
                  lineItems = invoiceData.items;
                }
              }

              console.log("📋 Parsed line items for preview:", lineItems);

              // Get customer data
              const customer = customers.find(
                (c) => c.id === selectedInvoice.customerId
              );

              // Get company info from tenant
              const companyName = tenant?.companyName || "Company Name";
              const companyEmail =
                tenant?.contactEmail || "company@example.com";
              const companyPhone = tenant?.contactPhone || "";

              // Get currency symbol
              const currency = selectedInvoice.currency || "USD";
              const currencySymbol = getCurrencySymbol(currency);

              // Prepare invoice data for template
              const previewData: InvoiceData = {
                invoiceNumber:
                  selectedInvoice.invoiceNumber || `INV-${selectedInvoice.id}`,
                issueDate:
                  selectedInvoice.issueDate ||
                  new Date().toISOString().split("T")[0],
                dueDate:
                  selectedInvoice.dueDate ||
                  new Date().toISOString().split("T")[0],
                customerName:
                  customer?.name || customer?.customerName || "Customer",
                customerEmail: customer?.email || customer?.customerEmail || "",
                customerPhone: customer?.phone || customer?.customerPhone || "",
                customerAddress:
                  customer?.address || customer?.customerAddress || "",
                companyName: companyName,
                companyEmail: companyEmail,
                companyPhone: companyPhone,
                companyAddress: tenant?.address || "",
                items:
                  lineItems.length > 0
                    ? (lineItems
                        .map((item, index) => {
                          const sellingPrice = parseFloat(
                            item.sellingPrice?.toString() ||
                              item.unitPrice?.toString() ||
                              item.price?.toString() ||
                              "0"
                          );
                          const quantity = parseInt(
                            item.quantity?.toString() ||
                              item.qty?.toString() ||
                              "1"
                          );
                          const totalAmount = parseFloat(
                            item.totalAmount?.toString() ||
                              item.totalPrice?.toString() ||
                              item.amount?.toString() ||
                              "0"
                          );
                          const hasTitle =
                            item.itemTitle && item.itemTitle.trim() !== "";
                          const hasPrice = sellingPrice > 0;
                          const hasTotal = totalAmount > 0;
                          const hasCategory =
                            item.travelCategory &&
                            item.travelCategory.trim() !== "";
                          const hasDescription =
                            item.description && item.description.trim() !== "";

                          // Include items that have any meaningful data
                          if (
                            !hasTitle &&
                            !hasPrice &&
                            !hasTotal &&
                            !hasCategory &&
                            !hasDescription
                          ) {
                            return null;
                          }

                          // Build description from available data
                          let description =
                            item.itemTitle?.trim() || item.description?.trim();
                          if (!description && hasCategory) {
                            description = item.travelCategory;
                          }
                          if (!description && item.name) {
                            description = item.name;
                          }
                          if (!description) {
                            description = `Item ${index + 1}`;
                          }

                          // Calculate total if not provided
                          const calculatedTotal =
                            totalAmount > 0
                              ? totalAmount
                              : sellingPrice * quantity;

                          return {
                            description: description,
                            quantity: quantity || 1,
                            unitPrice: sellingPrice || 0,
                            totalPrice: calculatedTotal || 0,
                            invoiceNumber:
                              item.invoiceNumber ||
                              item.invoice_number ||
                              undefined,
                            voucherNumber:
                              item.voucherNumber ||
                              item.voucher_number ||
                              undefined,
                          };
                        })
                        .filter((item) => item !== null) as {
                        description: string;
                        quantity: number;
                        unitPrice: number;
                        totalPrice: number;
                        invoiceNumber?: string;
                        voucherNumber?: string;
                      }[])
                    : [
                        // Fallback: show at least one item if no line items found
                        {
                          description: "No line items available",
                          quantity: 1,
                          unitPrice: 0,
                          totalPrice: 0,
                        },
                      ],
                subtotal: parseFloat(
                  (
                    invoiceData.subtotal ||
                    invoiceData.totalAmount ||
                    0
                  ).toString()
                ),
                taxAmount: parseFloat((invoiceData.taxAmount || 0).toString()),
                discountAmount: parseFloat(
                  (invoiceData.discountAmount || 0).toString()
                ),
                totalAmount: parseFloat(selectedInvoice.totalAmount || 0),
                currency: currencySymbol,
                notes: selectedInvoice.notes || undefined,
                paymentTerms: invoiceData.paymentTerms || undefined,
                paymentStatus:
                  invoiceData.status || selectedInvoice.status || "pending",
                paidAmount: parseFloat(
                  (invoiceData.paidAmount || 0).toString()
                ),
                cancellationChargeAmount: invoiceData.hasCancellationCharge 
                  ? parseFloat((invoiceData.cancellationChargeAmount || 0).toString())
                  : undefined,
                cancellationChargeNotes: invoiceData.cancellationChargeNotes || undefined,
                installments: invoiceData.installments || undefined,
              };

              return (
                <div className="mt-4">
                  <ModernTemplate data={previewData} />
                  <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPDF(selectedInvoice)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSendEmail(selectedInvoice)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSendWhatsApp(selectedInvoice)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Send WhatsApp
                    </Button>
                    <Button onClick={() => setIsViewDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog - Same as Create Form */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Update the invoice details below.
            </DialogDescription>
          </DialogHeader>
          {editingInvoice && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                const grandTotal = editLineItems.reduce(
                  (total, item) => total + (item.totalAmount || 0),
                  0
                );
                const finalAmount = grandTotal - editDiscountAmount;

                const invoiceData = {
                  ...editingInvoice,
                  invoiceNumber:
                    (formData.get("invoiceNumber") as string) ||
                    editingInvoice.invoiceNumber,
                  customerId: parseInt(formData.get("customerId") as string),
                  issueDate: formData.get("issueDate") as string,
                  dueDate: formData.get("dueDate") as string,
                  totalAmount: finalAmount,
                  paidAmount: editAmountPaid,
                  subtotal: grandTotal,
                  taxAmount: editLineItems.reduce(
                    (total, item) => total + (item.tax || 0),
                    0
                  ),
                  discountAmount: editDiscountAmount,
                  status: editPaymentStatus,
                  currency: (formData.get("currency") as string) || "INR",
                  notes: (formData.get("notes") as string) || "",
                  paymentTerms:
                    (formData.get("paymentTerms") as string) || "30 days",
                  lineItems: editLineItems,
                };

                try {
                  const token = auth.getToken();
                  const response = await fetch(
                    `/api/tenants/${tenant?.id}/invoices/${editingInvoice.id}`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(invoiceData),
                    }
                  );

                  if (response.ok) {
                    queryClient.invalidateQueries({
                      queryKey: [`/api/tenants/${tenant?.id}/invoices`],
                    });
                    setIsEditDialogOpen(false);
                    toast({
                      title: "Invoice Updated",
                      description: "Invoice has been updated successfully.",
                    });
                  } else {
                    throw new Error("Failed to update invoice");
                  }
                } catch (error) {
                  toast({
                    title: "Update Failed",
                    description: "Failed to update invoice. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bookingId">Booking (Optional)</Label>
                  <Select
                    name="bookingId"
                    defaultValue={
                      editingInvoice.bookingId?.toString() || "none"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select booking" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No booking selected</SelectItem>
                      {bookings && bookings.length > 0
                        ? bookings.map((booking) => (
                            <SelectItem
                              key={booking.id}
                              value={booking.id.toString()}
                            >
                              {booking.bookingNumber || `BK-${booking.id}`} -{" "}
                              {booking.customerName || "Unknown Customer"}
                              {booking.travelDate &&
                                ` (${new Date(booking.travelDate).toLocaleDateString()})`}
                            </SelectItem>
                          ))
                        : null}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customerId">Customer</Label>
                  <Select
                    name="customerId"
                    defaultValue={editingInvoice.customerId?.toString()}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers && customers.length > 0
                        ? customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              {customer.name ||
                                `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                                "Unnamed Customer"}
                            </SelectItem>
                          ))
                        : null}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    name="invoiceNumber"
                    defaultValue={
                      editingInvoice.invoiceNumber || `INV-${editingInvoice.id}`
                    }
                    placeholder="INV-001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    name="issueDate"
                    type="date"
                    defaultValue={
                      editingInvoice.issueDate
                        ? new Date(editingInvoice.issueDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    name="dueDate"
                    type="date"
                    defaultValue={
                      editingInvoice.dueDate
                        ? new Date(editingInvoice.dueDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    required
                  />
                </div>
              </div>

              {/* Line Items Section - Same as Create Form */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Line Items</h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setEditLineItems([
                        ...editLineItems,
                        {
                          travelCategory: "",
                          vendor: "",
                          itemTitle: "",
                          invoiceNumber: "",
                          voucherNumber: "",
                          quantity: 1,
                          unitPrice: 0,
                          sellingPrice: 0,
                          purchasePrice: 0,
                          tax: 0,
                          totalAmount: 0,
                        },
                      ]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>

                {editLineItems.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Item #{index + 1}</h4>
                      {editLineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newItems = editLineItems.filter(
                              (_, i) => i !== index
                            );
                            setEditLineItems(newItems);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Travel Category *</Label>
                        <Select
                          value={item.travelCategory}
                          onValueChange={(value) => {
                            const newItems = [...editLineItems];
                            newItems[index].travelCategory = value;
                            setEditLineItems(newItems);
                          }}
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
                        <Label>Vendor</Label>
                        <Select
                          value={item.vendor}
                          onValueChange={(value) => {
                            const newItems = [...editLineItems];
                            newItems[index].vendor = value;
                            setEditLineItems(newItems);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              No vendor selected
                            </SelectItem>
                            {vendors && vendors.length > 0
                              ? vendors.map((vendor) => (
                                  <SelectItem
                                    key={vendor.id}
                                    value={vendor.id.toString()}
                                  >
                                    {vendor.companyName ||
                                      vendor.name ||
                                      "Unnamed Vendor"}
                                  </SelectItem>
                                ))
                              : null}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Item Title *</Label>
                        <Input
                          value={item.itemTitle}
                          onChange={(e) => {
                            const newItems = [...editLineItems];
                            newItems[index].itemTitle = e.target.value;
                            setEditLineItems(newItems);
                          }}
                          placeholder="Enter item title"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Invoice Number</Label>
                        <Input
                          value={item.invoiceNumber}
                          onChange={(e) => {
                            const newItems = [...editLineItems];
                            newItems[index].invoiceNumber = e.target.value;
                            setEditLineItems(newItems);
                          }}
                          placeholder="Enter invoice number (optional)"
                        />
                      </div>

                      <div>
                        <Label>Voucher Number</Label>
                        <Input
                          value={item.voucherNumber}
                          onChange={(e) => {
                            const newItems = [...editLineItems];
                            newItems[index].voucherNumber = e.target.value;
                            setEditLineItems(newItems);
                          }}
                          placeholder="Enter voucher number (optional)"
                        />
                      </div>

                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...editLineItems];
                            newItems[index].quantity =
                              parseInt(e.target.value) || 1;
                            // Recalculate total
                            newItems[index].totalAmount =
                              (newItems[index].sellingPrice || 0) *
                              (parseInt(e.target.value) || 1);
                            setEditLineItems(newItems);
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Unit Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice || ""}
                          onChange={(e) => {
                            const newItems = [...editLineItems];
                            newItems[index].unitPrice =
                              parseFloat(e.target.value) || 0;
                            setEditLineItems(newItems);
                          }}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label>Selling Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.sellingPrice || ""}
                          onChange={(e) => {
                            const newItems = [...editLineItems];
                            const sellingPrice =
                              parseFloat(e.target.value) || 0;
                            newItems[index].sellingPrice = sellingPrice;
                            newItems[index].totalAmount =
                              sellingPrice * (newItems[index].quantity || 1);
                            setEditLineItems(newItems);
                          }}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label>Purchase Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.purchasePrice || ""}
                          onChange={(e) => {
                            const newItems = [...editLineItems];
                            newItems[index].purchasePrice =
                              parseFloat(e.target.value) || 0;
                            setEditLineItems(newItems);
                          }}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tax Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.tax || ""}
                          onChange={(e) => {
                            const newItems = [...editLineItems];
                            newItems[index].tax =
                              parseFloat(e.target.value) || 0;
                            setEditLineItems(newItems);
                          }}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label>Total Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.totalAmount || ""}
                          onChange={(e) => {
                            const newItems = [...editLineItems];
                            newItems[index].totalAmount =
                              parseFloat(e.target.value) || 0;
                            setEditLineItems(newItems);
                          }}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Grand Total:</span>
                    <span>
                      ₹
                      {editLineItems
                        .reduce(
                          (total, item) => total + (item.totalAmount || 0),
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment & Special Requests Section - Same as Create Form */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="mr-2">💰</span> Payment & Special Requests
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="discountAmount">Discount Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editDiscountAmount || ""}
                      onChange={(e) =>
                        setEditDiscountAmount(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="amountPaid">Amount Paid</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editAmountPaid || ""}
                      onChange={(e) =>
                        setEditAmountPaid(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Payment history will track all payments
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select
                      value={editPaymentStatus}
                      onValueChange={setEditPaymentStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partially Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Payment history tracks when user paid
                    </p>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3">
                    Payment Summary
                  </h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Amount:</p>
                      <p className="font-semibold">
                        ₹
                        {editLineItems
                          .reduce(
                            (total, item) => total + (item.totalAmount || 0),
                            0
                          )
                          .toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Discount:</p>
                      <p className="font-semibold text-green-600">
                        -₹{editDiscountAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Final Amount:</p>
                      <p className="font-semibold text-blue-600">
                        ₹
                        {(
                          editLineItems.reduce(
                            (total, item) => total + (item.totalAmount || 0),
                            0
                          ) - editDiscountAmount
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Remaining:</p>
                      <p className="font-semibold text-red-600">
                        ₹
                        {(
                          editLineItems.reduce(
                            (total, item) => total + (item.totalAmount || 0),
                            0
                          ) -
                          editDiscountAmount -
                          editAmountPaid
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    name="currency"
                    defaultValue={editingInvoice.currency || "INR"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    name="paymentTerms"
                    placeholder="30 days"
                    defaultValue={editingInvoice.paymentTerms || "30 days"}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  name="notes"
                  placeholder="Additional notes..."
                  defaultValue={editingInvoice.notes || ""}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Follow-Up Dialog */}
      {selectedInvoiceForFollowUp && (
        <CreateFollowUpDialog
          open={followUpDialogOpen}
          onOpenChange={(open) => {
            setFollowUpDialogOpen(open);
            if (!open) {
              setSelectedInvoiceForFollowUp(null);
            }
          }}
          relatedTableName="invoices"
          relatedTableId={selectedInvoiceForFollowUp.id}
          relatedEntityName={
            selectedInvoiceForFollowUp.invoiceNumber
              ? `Invoice #${selectedInvoiceForFollowUp.invoiceNumber}`
              : `Invoice #${selectedInvoiceForFollowUp.id}`
          }
        />
      )}

      {/* Cancellation Charge Dialog */}
      <Dialog open={isCancellationChargeDialogOpen} onOpenChange={setIsCancellationChargeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Cancellation Charge?</DialogTitle>
            <DialogDescription>
              Do you want to apply cancellation charges to this invoice?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={showCancellationChargeFields ? "default" : "outline"}
                onClick={() => {
                  setShowCancellationChargeFields(true);
                  if (!cancellationChargeAmount || cancellationChargeAmount === "") {
                    setCancellationChargeAmount("0");
                  }
                }}
                className="flex-1"
              >
                Yes, Apply Charge
              </Button>
              <Button
                variant={!showCancellationChargeFields ? "default" : "outline"}
                onClick={() => {
                  setShowCancellationChargeFields(false);
                  setCancellationChargeAmount("");
                  setCancellationChargeNotes("");
                }}
                className="flex-1"
              >
                No Charge
              </Button>
            </div>
            
            {showCancellationChargeFields && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="cancellation-charge-amount">Cancellation Charge Amount</Label>
                  <Input
                    id="cancellation-charge-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cancellationChargeAmount}
                    onChange={(e) => setCancellationChargeAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cancellation-charge-notes">Notes (Optional)</Label>
                  <Textarea
                    id="cancellation-charge-notes"
                    value={cancellationChargeNotes}
                    onChange={(e) => setCancellationChargeNotes(e.target.value)}
                    placeholder="Enter reason or notes for cancellation charge..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCancellationChargeDialogOpen(false);
                  setPendingStatusChange(null);
                  setCancellationChargeAmount("");
                  setCancellationChargeNotes("");
                  setShowCancellationChargeFields(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (pendingStatusChange) {
                    const hasCharge = cancellationChargeAmount !== "" && parseFloat(cancellationChargeAmount) > 0;
                    updateStatusMutation.mutate({
                      invoiceId: pendingStatusChange.invoiceId,
                      status: pendingStatusChange.status,
                      hasCancellationCharge: hasCharge,
                      cancellationChargeAmount: hasCharge ? parseFloat(cancellationChargeAmount) : 0,
                      cancellationChargeNotes: cancellationChargeNotes,
                    });
                  }
                }}
                disabled={updateStatusMutation.isPending || (cancellationChargeAmount !== "" && (!cancellationChargeAmount || parseFloat(cancellationChargeAmount) < 0))}
              >
                {updateStatusMutation.isPending ? "Updating..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Invoices</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import invoices. The file should contain columns: Invoice Number, Customer Name, Customer Email, Voucher Number, Issue Date, Due Date, Total Amount, Amount Paid, Currency, Status, etc.
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
              onClick={handleImportInvoices}
              disabled={!importFile || isImporting}
            >
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reissue Invoice Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reissue Invoice</DialogTitle>
            <DialogDescription>
              Create a copy of invoice{" "}
              {invoiceToDuplicate?.invoiceNumber || invoiceToDuplicate?.id
                ? `#${invoiceToDuplicate.invoiceNumber || invoiceToDuplicate.id}`
                : ""}
              . You can change the customer if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-customer">Customer *</Label>
              <AutocompleteInput
                suggestions={allDuplicateCustomerOptions}
                value={duplicateCustomerId}
                onValueChange={(value) => {
                  setDuplicateCustomerId(value);
                }}
                onSearch={setDuplicateCustomerSearch}
                placeholder="Search customer by name, phone or email"
                emptyText="No customers found"
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDuplicateDialogOpen(false);
                  setInvoiceToDuplicate(null);
                  setDuplicateCustomerId("");
                  setDuplicateCustomerSearch("");
                }}
                disabled={duplicateInvoiceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDuplicateConfirm}
                disabled={
                  !duplicateCustomerId ||
                  duplicateInvoiceMutation.isPending
                }
              >
                {duplicateInvoiceMutation.isPending ? "Reissuing..." : "Yes, Reissue"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

import { useState, useEffect } from "react";
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
import { ModernTemplate, InvoiceData } from "@/components/invoices/invoice-templates";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const invoiceStatuses = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
  { value: "partial", label: "Partially Paid", color: "bg-blue-100 text-blue-800" },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-800" },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800",
  },
];

export default function Invoices() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  // Local filter states (not applied until "Apply Filters" is clicked)
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState("all");
  const [localCustomerFilter, setLocalCustomerFilter] = useState<string[]>([]);
  const [localVendorFilter, setLocalVendorFilter] = useState<string>("all");
  const [localProviderFilter, setLocalProviderFilter] = useState<string>("all");
  const [localLeadTypeFilter, setLocalLeadTypeFilter] = useState<string>("all");
  
  // Applied filter states (used for API calls)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [leadTypeFilter, setLeadTypeFilter] = useState<string>("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
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
      0,
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
        (b) => b.id.toString() === bookingId,
      );
      console.log("🎯 Selected booking data:", selectedBooking);

      if (selectedBooking) {
        // Auto-populate customer
        setSelectedCustomerId(selectedBooking.customerId?.toString() || "");

        // Auto-populate dates if available
        setTimeout(() => {
          const issueDateInput = document.querySelector(
            'input[name="issueDate"]',
          ) as HTMLInputElement;
          const dueDateInput = document.querySelector(
            'input[name="dueDate"]',
          ) as HTMLInputElement;

          if (issueDateInput) {
            issueDateInput.value = new Date().toISOString().split("T")[0]; // Today's date for issue
          }

          if (selectedBooking.travelDate && dueDateInput) {
            const travelDate = new Date(selectedBooking.travelDate);
            const dueDate = new Date(
              travelDate.getTime() - 7 * 24 * 60 * 60 * 1000,
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
          bookingPackage,
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
          bookingDiscount,
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
          bookingDiscount,
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
      const response = await fetch(
        `/api/tenants/${tenant?.id}/invoices/${invoice.id}/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Invoice PDF downloaded successfully!",
        });
      } else {
        throw new Error("Failed to download PDF");
      }
    } catch (error) {
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
        },
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
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.whatsappLink) {
          // Open WhatsApp link in new tab
          window.open(data.whatsappLink, '_blank');
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
        description: error.message || "Failed to send WhatsApp message. Please try again.",
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
        `/api/customers?action=get-customers&tenantId=${tenant?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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
      const url = leadTypeFilter && leadTypeFilter !== "all"
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
  } = useQuery<{ data: Invoice[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>({
    queryKey: [`/api/tenants/${tenant?.id}/invoices`, currentPage, pageSize, statusFilter, customerFilter, vendorFilter, providerFilter, leadTypeFilter, searchTerm],
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

      const response = await fetch(
        `/api/tenants/${tenant?.id}/invoices?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        },
      );
      if (!response.ok) {
        console.error("Invoices API Error:", response.status);
        return { data: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
      }
      const result = await response.json();
      
      // Handle both old format (array) and new format (object with data and pagination)
      if (Array.isArray(result)) {
        return { data: result, pagination: { page: 1, pageSize: result.length, total: result.length, totalPages: 1 } };
      }
      return result;
    },
  });

  const invoices = invoicesResponse?.data || [];
  const pagination = invoicesResponse?.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 0 };

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

  // Column definitions for the enhanced table
  const invoiceColumns: TableColumn<Invoice>[] = [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      sortable: true,
      render: (value, invoice) => (
        <div className="font-medium">{value || `INV-${invoice.id}`}</div>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (customerName, invoice) => (
        <div className="flex flex-col">
          <div className="font-medium">
            {customerName ||
              customers.find((c) => c.id === invoice.customerId)?.name ||
              "Unknown"}
          </div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <Mail className="h-3 w-3 mr-1" />
            {customers.find((c) => c.id === invoice.customerId)?.email || ""}
          </div>
        </div>
      ),
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
          <span>
            {issueDate ? new Date(issueDate).toLocaleDateString() : "-"}
          </span>
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
          (invoice.status === "pending" && new Date(dueDate) < new Date());
        return (
          <div className="flex items-center">
            <Clock
              className={`h-4 w-4 mr-2 ${isOverdue ? "text-red-400" : "text-gray-400"}`}
            />
            <span className={isOverdue ? "text-red-600 font-medium" : ""}>
              {dueDate ? new Date(dueDate).toLocaleDateString() : "-"}
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
          <div className="flex items-center font-semibold text-green-600">
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
        // Determine status based on paidAmount vs totalAmount if status is not explicitly set
        const invoiceData = invoice as any;
        const paidAmount = parseFloat(invoiceData.paidAmount?.toString() || invoiceData.amountPaid?.toString() || "0");
        const totalAmount = parseFloat(invoiceData.totalAmount?.toString() || "0");
        
        let displayStatus = status;
        if (!displayStatus || displayStatus === "pending") {
          // Auto-detect partial payment
          if (paidAmount > 0 && paidAmount < totalAmount) {
            displayStatus = "partial";
          } else if (paidAmount >= totalAmount && totalAmount > 0) {
            displayStatus = "paid";
          }
        }
        
        const statusConfig = getStatusBadge(displayStatus);
        return (
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-right",
      render: (_, invoice) => (
        <div className="flex justify-end space-x-2">
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Navigate to invoice create page with invoice ID for editing
              navigate(`/invoice-create/${invoice.id}`);
            }}
            title="Edit Invoice"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadPDF(invoice)}
            className="text-blue-600 hover:text-blue-700"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSendEmail(invoice)}
            className="text-green-600 hover:text-green-700"
            title="Send Email"
          >
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSendWhatsApp(invoice)}
            className="text-green-600 hover:text-green-700"
            title="Send WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Reset to page 1 when applied filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, customerFilter, vendorFilter, providerFilter, leadTypeFilter, searchTerm]);

  // Apply filters function
  const handleApplyFilters = () => {
    setSearchTerm(localSearchTerm);
    setStatusFilter(localStatusFilter);
    setCustomerFilter([...localCustomerFilter]);
    setVendorFilter(localVendorFilter);
    setProviderFilter(localProviderFilter);
    setLeadTypeFilter(localLeadTypeFilter);
    setCurrentPage(1);
  };

  // Reset filters function
  const handleResetFilters = () => {
    setLocalSearchTerm("");
    setLocalStatusFilter("all");
    setLocalCustomerFilter([]);
    setLocalVendorFilter("all");
    setLocalProviderFilter("all");
    setLocalLeadTypeFilter("all");
    setSearchTerm("");
    setStatusFilter("all");
    setCustomerFilter([]);
    setVendorFilter("all");
    setProviderFilter("all");
    setLeadTypeFilter("all");
    setCurrentPage(1);
  };

  // Multi-select customer component
  const MultiSelectCustomer = ({ customers, selectedCustomers, onSelectionChange }: {
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
      return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    });

    const toggleCustomer = (customerId: string) => {
      if (selectedCustomers.includes(customerId)) {
        onSelectionChange(selectedCustomers.filter((id) => id !== customerId));
      } else {
        onSelectionChange([...selectedCustomers, customerId]);
      }
    };

    const displayText = selectedCustomers.length === 0
      ? "Customer"
      : selectedCustomers.length === 1
      ? customers.find((c) => c.id.toString() === selectedCustomers[0])?.name || 
        customers.find((c) => c.id.toString() === selectedCustomers[0])?.customerName || 
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
                    const isSelected = selectedCustomers.includes(customer.id.toString());
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
                          <div>{customer.name || customer.customerName || "Unknown"}</div>
                          {customer.email && (
                            <div className="text-xs text-gray-500">{customer.email}</div>
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
              const customer = customers.find((c) => c.id.toString() === customerId);
              return (
                <span
                  key={customerId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs"
                >
                  {customer?.name || customer?.customerName || "Unknown"}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectionChange(selectedCustomers.filter((id) => id !== customerId));
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
          `Failed to create invoice: ${response.status} - ${errorText}`,
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

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate analytics data
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.totalAmount?.toString() || "0"),
    0
  );
  const paidAmount = invoices.reduce(
    (sum, inv) => sum + parseFloat((inv as any).paidAmount?.toString() || "0"),
    0
  );
  const pendingAmount = invoices.reduce((sum, inv) => {
    const total = parseFloat(inv.totalAmount?.toString() || "0");
    const paid = parseFloat((inv as any).paidAmount?.toString() || "0");
    return sum + Math.max(0, total - paid);
  }, 0);
  const collectionRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // Chart data
  const statusData = invoiceStatuses.map((status) => ({
    name: status.label,
    count: invoices.filter((inv) => inv.status === status.value).length,
    color: status.value === "paid" ? "#10b981" : status.value === "pending" ? "#f59e0b" : status.value === "overdue" ? "#ef4444" : "#6b7280"
  }));

  const monthlyData = invoices.reduce((acc: any[], inv) => {
    const date = new Date(inv.issueDate || Date.now());
    const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    const existing = acc.find(item => item.month === monthYear);
    const amount = parseFloat(inv.totalAmount?.toString() || "0");
    const paid = parseFloat((inv as any).paidAmount?.toString() || "0");
    
    if (existing) {
      existing.total += amount;
      existing.paid += paid;
      existing.pending += (amount - paid);
    } else {
      acc.push({
        month: monthYear,
        total: amount,
        paid: paid,
        pending: amount - paid
      });
    }
    return acc;
  }, []).slice(-6);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'];

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
            <Sheet open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" data-testid="button-analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[600px] sm:max-w-[600px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Invoice Analytics</SheetTitle>
                  <SheetDescription>
                    Overview of your invoice metrics and trends
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            Total Invoices
                          </p>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {totalInvoices}
                          </p>
                        </div>
                        <Receipt className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                            Total Amount
                          </p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                            ₹{totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <IndianRupee className="h-8 w-8 text-purple-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Paid Amount
                          </p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            ₹{paidAmount.toLocaleString()}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                            Pending
                          </p>
                          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                            ₹{pendingAmount.toLocaleString()}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-500" />
                      </div>
                    </div>
                  </div>

                  {/* Collection Rate */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Collection Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold text-cyan-600">{collectionRate}%</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-cyan-600 h-4 rounded-full transition-all"
                              style={{ width: `${collectionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Invoice Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, count }) => `${name}: ${count}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {statusData.map((status, index) => (
                          <div key={status.name} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {status.name}
                              </span>
                            </div>
                            <Badge>{status.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Trends */}
                  {monthlyData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Monthly Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="total" fill="#8b5cf6" name="Total Amount" />
                            <Bar dataKey="paid" fill="#10b981" name="Paid Amount" />
                            <Bar dataKey="pending" fill="#f59e0b" name="Pending Amount" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Payment Timeline */}
                  {monthlyData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Payment Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="Total" strokeWidth={2} />
                            <Line type="monotone" dataKey="paid" stroke="#10b981" name="Paid" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
            <Link href="/invoice-create">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  placeholder="Search..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="pl-7 h-9 text-sm"
                />
              </div>
              <Select
                value={localStatusFilter}
                onValueChange={setLocalStatusFilter}
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
              <div className="min-w-[150px]">
                <MultiSelectCustomer
                  customers={customers}
                  selectedCustomers={localCustomerFilter}
                  onSelectionChange={setLocalCustomerFilter}
                />
              </div>
              <Select
                value={localLeadTypeFilter}
                onValueChange={setLocalLeadTypeFilter}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Lead Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lead Types</SelectItem>
                  {leadTypes.map((leadType) => (
                    <SelectItem key={leadType.id} value={leadType.id.toString()}>
                      {leadType.name || leadType.leadTypeName || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={localVendorFilter}
                onValueChange={setLocalVendorFilter}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name || vendor.vendorName || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={localProviderFilter}
                onValueChange={setLocalProviderFilter}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {serviceProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name || provider.providerName || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
             
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="text-xs text-gray-500">
                Showing {invoices.length} of {pagination.total} invoices
                {pagination.totalPages > 1 && ` (Page ${pagination.page} of ${pagination.totalPages})`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 text-xs"
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyFilters}
                  className="h-8 text-xs"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
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
            />
            {/* Backend Pagination Controls */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} invoices
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
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
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
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="min-w-[2.5rem]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
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
                            parseInt(e.target.value) || 1,
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
                            parseFloat(e.target.value) || 0,
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
                            parseFloat(e.target.value) || 0,
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
                            parseFloat(e.target.value) || 0,
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
                            parseFloat(e.target.value) || 0,
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
          {selectedInvoice && (() => {
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
              } else if (invoiceData.items && Array.isArray(invoiceData.items)) {
                lineItems = invoiceData.items;
              }
            }
            
            console.log("📋 Parsed line items for preview:", lineItems);

            // Get customer data
            const customer = customers.find(
              (c) => c.id === selectedInvoice.customerId,
            );

            // Get company info from tenant
            const companyName = tenant?.companyName || "Company Name";
            const companyEmail = tenant?.contactEmail || "company@example.com";
            const companyPhone = tenant?.contactPhone || "";

            // Get currency symbol
            const currency = selectedInvoice.currency || "USD";
            const currencySymbol = getCurrencySymbol(currency);

            // Prepare invoice data for template
            const previewData: InvoiceData = {
              invoiceNumber: selectedInvoice.invoiceNumber || `INV-${selectedInvoice.id}`,
              issueDate: selectedInvoice.issueDate || new Date().toISOString().split("T")[0],
              dueDate: selectedInvoice.dueDate || new Date().toISOString().split("T")[0],
              customerName: customer?.name || customer?.customerName || "Customer",
              customerEmail: customer?.email || customer?.customerEmail || "",
              customerPhone: customer?.phone || customer?.customerPhone || "",
              customerAddress: customer?.address || customer?.customerAddress || "",
              companyName: companyName,
              companyEmail: companyEmail,
              companyPhone: companyPhone,
              companyAddress: tenant?.address || "",
              items: lineItems.length > 0
                ? lineItems
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
                      const hasTitle = item.itemTitle && item.itemTitle.trim() !== "";
                      const hasPrice = sellingPrice > 0;
                      const hasTotal = totalAmount > 0;
                      const hasCategory = item.travelCategory && item.travelCategory.trim() !== "";
                      const hasDescription = item.description && item.description.trim() !== "";
                      
                      // Include items that have any meaningful data
                      if (!hasTitle && !hasPrice && !hasTotal && !hasCategory && !hasDescription) {
                        return null;
                      }
                      
                      // Build description from available data
                      let description = item.itemTitle?.trim() || item.description?.trim();
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
                      const calculatedTotal = totalAmount > 0 
                        ? totalAmount 
                        : (sellingPrice * quantity);
                      
                      return {
                        description: description,
                        quantity: quantity || 1,
                        unitPrice: sellingPrice || 0,
                        totalPrice: calculatedTotal || 0,
                        invoiceNumber: item.invoiceNumber || item.invoice_number || undefined,
                        voucherNumber: item.voucherNumber || item.voucher_number || undefined,
                      };
                    })
                    .filter((item) => item !== null) as { description: string; quantity: number; unitPrice: number; totalPrice: number; invoiceNumber?: string; voucherNumber?: string; }[]
                : [
                    // Fallback: show at least one item if no line items found
                    {
                      description: "No line items available",
                      quantity: 1,
                      unitPrice: 0,
                      totalPrice: 0,
                    }
                  ],
              subtotal: parseFloat((invoiceData.subtotal || invoiceData.totalAmount || 0).toString()),
              taxAmount: parseFloat((invoiceData.taxAmount || 0).toString()),
              discountAmount: parseFloat((invoiceData.discountAmount || 0).toString()),
              totalAmount: parseFloat(selectedInvoice.totalAmount || 0),
              currency: currencySymbol,
              notes: selectedInvoice.notes || undefined,
              paymentTerms: invoiceData.paymentTerms || undefined,
              paymentStatus: invoiceData.status || selectedInvoice.status || "pending",
              paidAmount: parseFloat((invoiceData.paidAmount || 0).toString()),
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
                  <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
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
                  0,
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
                    0,
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
                    },
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
                              (_, i) => i !== index,
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
                          0,
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
                            0,
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
                            0,
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
                            0,
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
    </Layout>
  );
}

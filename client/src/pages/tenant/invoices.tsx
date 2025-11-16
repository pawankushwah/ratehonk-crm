import { useState } from "react";
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
import { Link } from "wouter";

const invoiceStatuses = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
        throw new Error("Failed to send email");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
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

  // Fetch invoices
  const {
    data: invoices = [],
    isLoading,
    error,
  } = useQuery<Invoice[]>({
    queryKey: [`/api/tenants/${tenant?.id}/invoices`],
    enabled: !!tenant?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const token = auth.getToken();
      const timestamp = Date.now();
      const response = await fetch(
        `/api/tenants/${tenant?.id}/invoices?_t=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        },
      );
      if (!response.ok) {
        console.error("Invoices API Error:", response.status);
        return [];
      }
      const result = await response.json();
      return Array.isArray(result) ? result : result.invoices || [];
    },
  });

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
    {
      key: "bookingNumber",
      label: "Booking",
      sortable: true,
      render: (_, invoice) => {
        const booking = bookings.find((b) => b.id === invoice.bookingId);
        return (
          <div className="flex flex-col">
            <div className="font-medium">
              {booking ? booking.bookingNumber || `BK-${booking.id}` : "-"}
            </div>
            {booking && (
              <div className="text-sm text-gray-500 flex items-center mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                {booking.travelDate
                  ? new Date(booking.travelDate).toLocaleDateString()
                  : "No date"}
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
      render: (totalAmount) => (
        <div className="flex items-center font-semibold">
          <IndianRupee className="h-4 w-4 mr-1 text-gray-400" />
          <span>
            {totalAmount
              ? parseFloat(totalAmount.toString()).toLocaleString()
              : "0"}
          </span>
        </div>
      ),
    },
    {
      key: "paidAmount",
      label: "Amount Paid",
      sortable: true,
      render: (_, invoice) => {
        const invoiceData = invoice as any;
        const paidAmount = invoiceData.paidAmount || 0;
        return (
          <div className="flex items-center font-semibold text-green-600">
            <IndianRupee className="h-4 w-4 mr-1 text-gray-400" />
            <span>{parseFloat(paidAmount.toString()).toLocaleString()}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (status) => {
        const statusConfig = getStatusBadge(status);
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
              console.log("🔍 Edit Invoice - Raw invoice data:", invoice);
              setEditingInvoice(invoice);
              // Initialize edit states with invoice data using type assertion
              const invoiceData = invoice as any;
              const lineItemsData =
                invoiceData.lineItems &&
                Array.isArray(invoiceData.lineItems) &&
                invoiceData.lineItems.length > 0
                  ? invoiceData.lineItems
                  : [
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
                    ];
              console.log(
                "🔍 Edit Invoice - Line items to set:",
                lineItemsData,
              );
              setEditLineItems(lineItemsData);
              setEditDiscountAmount(
                parseFloat(invoiceData.discountAmount?.toString() || "0"),
              );
              setEditAmountPaid(
                parseFloat(invoiceData.paidAmount?.toString() || "0"),
              );
              setEditPaymentStatus(invoiceData.status || "pending");
              setIsEditDialogOpen(true);
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
        </div>
      ),
    },
  ];

  // Filter invoices based on search term and status
  const filteredInvoices = invoices.filter((invoice) => {
    const searchableText = (
      (invoice.invoiceNumber || `INV-${invoice.id}`) +
      " " +
      (invoice.customerName || "") +
      " " +
      (customers.find((c) => c.id === invoice.customerId)?.name || "") +
      " " +
      (customers.find((c) => c.id === invoice.customerId)?.email || "") +
      " " +
      (invoice.notes || "")
    ).toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <CardHeader>
            <CardTitle>Filter Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {invoiceStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-500 flex items-center">
                Showing {filteredInvoices.length} of {invoices.length}{" "}
                invoices
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
              data={filteredInvoices}
              columns={invoiceColumns}
              searchTerm={searchTerm}
              isLoading={isLoading}
              showPagination={true}
              pageSize={10}
              emptyMessage="No invoices found. Create your first invoice to get started."
            />
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

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="grid grid-cols-2 gap-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Invoice #{selectedInvoice.invoiceNumber || `INV-${selectedInvoice.id}`}
                  </h2>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>Issue Date:</strong>{" "}
                      {selectedInvoice.issueDate
                        ? new Date(selectedInvoice.issueDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Due Date:</strong>{" "}
                      {selectedInvoice.dueDate
                        ? new Date(selectedInvoice.dueDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <Badge className={getStatusBadge(selectedInvoice.status).color}>
                        {getStatusBadge(selectedInvoice.status).label}
                      </Badge>
                    </p>
                    <p>
                      <strong>Currency:</strong> {selectedInvoice.currency || "INR"}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  {(() => {
                    const customer = customers.find(
                      (c) => c.id === selectedInvoice.customerId,
                    );
                    return customer ? (
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{customer.name || "N/A"}</p>
                        {customer.email && <p>{customer.email}</p>}
                        {customer.phone && <p>{customer.phone}</p>}
                        {customer.address && <p>{customer.address}</p>}
                        {(customer.city || customer.state || customer.country) && (
                          <p>
                            {customer.city || ""}
                            {customer.city && customer.state ? ", " : ""}
                            {customer.state || ""}
                            {customer.country ? `, ${customer.country}` : ""}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Customer not found</p>
                    );
                  })()}
                </div>
              </div>

              {/* Line Items Section */}
              {(() => {
                const invoiceData = selectedInvoice as any;
                console.log("🔍 Preview Dialog - Invoice data:", invoiceData);
                console.log("🔍 Preview Dialog - Line items raw:", invoiceData.lineItems);
                
                let lineItems = [];
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
                
                console.log("🔍 Preview Dialog - Parsed line items:", lineItems);

                return lineItems.length > 0 ? (
                  <div>
                    <h3 className="font-semibold mb-3">Line Items</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">#</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Item</th>
                            <th className="px-4 py-2 text-right text-sm font-medium">Quantity</th>
                            <th className="px-4 py-2 text-right text-sm font-medium">Unit Price</th>
                            <th className="px-4 py-2 text-right text-sm font-medium">Tax</th>
                            <th className="px-4 py-2 text-right text-sm font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {lineItems.map((item: any, index: number) => (
                            <tr key={index}>
                              <td className="px-4 py-2">{index + 1}</td>
                              <td className="px-4 py-2">
                                {item.itemTitle || item.description || "N/A"}
                              </td>
                              <td className="px-4 py-2 text-right">{item.quantity || 1}</td>
                              <td className="px-4 py-2 text-right">
                                {selectedInvoice.currency === "USD" ? "$" : "₹"}
                                {parseFloat(item.sellingPrice || item.unitPrice || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {selectedInvoice.currency === "USD" ? "$" : "₹"}
                                {parseFloat(item.tax || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                {selectedInvoice.currency === "USD" ? "$" : "₹"}
                                {parseFloat(item.totalAmount || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Payment Summary Section */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  {selectedInvoice.bookingId && (
                    <div className="mb-4">
                      <Label className="mb-2 block">Linked Booking</Label>
                      {(() => {
                        const booking = bookings.find(
                          (b) => b.id === selectedInvoice.bookingId,
                        );
                        return booking ? (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium">
                              {booking.bookingNumber || `BK-${booking.id}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              Customer: {booking.customerName || "Unknown"} | Travel Date:{" "}
                              {booking.travelDate
                                ? new Date(booking.travelDate).toLocaleDateString()
                                : "Not set"}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Booking not found</p>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">
                        {selectedInvoice.currency === "USD" ? "$" : "₹"}
                        {parseFloat(
                          (selectedInvoice as any).subtotal ||
                            selectedInvoice.totalAmount ||
                            0,
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {(selectedInvoice as any).discountAmount &&
                      parseFloat((selectedInvoice as any).discountAmount.toString()) > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount:</span>
                          <span className="font-medium">
                            -{selectedInvoice.currency === "USD" ? "$" : "₹"}
                            {parseFloat(
                              (selectedInvoice as any).discountAmount.toString(),
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                    {(selectedInvoice as any).taxAmount &&
                      parseFloat((selectedInvoice as any).taxAmount.toString()) > 0 && (
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span className="font-medium">
                            {selectedInvoice.currency === "USD" ? "$" : "₹"}
                            {parseFloat(
                              (selectedInvoice as any).taxAmount.toString(),
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                    <div className="flex justify-between border-t pt-2 font-bold text-lg">
                      <span>Total Amount:</span>
                      <span>
                        {selectedInvoice.currency === "USD" ? "$" : "₹"}
                        {parseFloat(selectedInvoice.totalAmount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {(selectedInvoice as any).paidAmount &&
                      parseFloat((selectedInvoice as any).paidAmount.toString()) > 0 && (
                        <>
                          <div className="flex justify-between text-green-600 border-t pt-2">
                            <span>Amount Paid:</span>
                            <span className="font-medium">
                              {selectedInvoice.currency === "USD" ? "$" : "₹"}
                              {parseFloat(
                                (selectedInvoice as any).paidAmount.toString(),
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Balance Due:</span>
                            <span>
                              {selectedInvoice.currency === "USD" ? "$" : "₹"}
                              {(
                                parseFloat(selectedInvoice.totalAmount || 0) -
                                parseFloat((selectedInvoice as any).paidAmount.toString())
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </>
                      )}
                  </div>
                </div>
              </div>

              {/* Notes and Payment Terms */}
              {(selectedInvoice.notes || (selectedInvoice as any).paymentTerms) && (
                <div className="space-y-3">
                  {selectedInvoice.notes && (
                    <div>
                      <Label className="mb-2 block">Notes</Label>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg">
                        {selectedInvoice.notes}
                      </p>
                    </div>
                  )}
                  {(selectedInvoice as any).paymentTerms && (
                    <div>
                      <Label className="mb-2 block">Payment Terms</Label>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg">
                        {(selectedInvoice as any).paymentTerms}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 border-t pt-4">
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
                <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
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

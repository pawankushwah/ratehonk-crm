import { useState, useEffect } from "react";
import { Link } from "wouter";
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
  Plane,
  Hotel,
  Car,
  Package,
  Building2,
  Sparkles,
  Tag,
  Settings,
  Clock,
  Download,
  List,
  Grid,
  BarChart3,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { EnhancedTable, TableColumn } from "@/components/ui/enhanced-table";
import { TravelBookingForm } from "@/components/booking/travel-booking-form";
import type { Booking } from "@/lib/types";
import { DateFilter } from "@/components/ui/date-filter";
import { buildDateFilters } from "@/lib/date-filter-helpers";

const bookingStatuses = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    color: "bg-green-100 text-green-800",
  },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
  {
    value: "completed",
    label: "Completed",
    color: "bg-blue-100 text-blue-800",
  },
];

const paymentStatuses = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "partial",
    label: "Partial",
    color: "bg-orange-100 text-orange-800",
  },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
];

export default function Bookings() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // Date filter state
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Reset to page 1 when filters change
  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // Reset page when search or filters change
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, statusFilter, dateFilter, customDateFrom, customDateTo]);

  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  // Analytics popup state
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // View booking handler
  const handleViewBooking = (bookingId: any) => {
    const booking = bookings?.find((b: any) => b.id === parseInt(bookingId));
    if (booking) {
      setSelectedBooking(booking);
      setIsViewDialogOpen(true);
    }
  };

  // Download receipt handler
  const handleDownloadReceipt = async (booking: any) => {
    try {
      // Download receipt/invoice for the booking
      const response = await fetch(
        `/api/tenants/${tenant?.id}/bookings/${booking.id}/receipt`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        // Create download link for PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `booking-receipt-${booking.bookingNumber || booking.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Receipt downloaded successfully!",
        });
      } else {
        throw new Error("Failed to download receipt");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Send confirmation email handler
  const handleSendConfirmation = async (booking: any) => {
    try {
      // Send confirmation email to customer
      const response = await fetch(
        `/api/tenants/${tenant?.id}/bookings/${booking.id}/send-confirmation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            customerEmail: booking.customerEmail,
            customerName: booking.customerName,
          }),
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Confirmation email sent to ${booking.customerName || booking.customerEmail}!`,
        });
      } else {
        throw new Error("Failed to send confirmation");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send confirmation email. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Status badge utility function for consistent status display
  const getStatusBadge = (status: string, type: "booking" | "payment") => {
    if (type === "booking") {
      switch (status?.toLowerCase()) {
        case "confirmed":
          return {
            label: "Confirmed",
            color: "bg-green-100 text-green-800 border-green-200",
          };
        case "pending":
          return {
            label: "Pending",
            color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          };
        case "cancelled":
          return {
            label: "Cancelled",
            color: "bg-red-100 text-red-800 border-red-200",
          };
        case "completed":
          return {
            label: "Completed",
            color: "bg-blue-100 text-blue-800 border-blue-200",
          };
        default:
          return {
            label: status || "Unknown",
            color: "bg-gray-100 text-gray-800 border-gray-200",
          };
      }
    } else {
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
        case "partially_paid":
        case "partial":
          return {
            label: "Partial",
            color: "bg-orange-100 text-orange-800 border-orange-200",
          };
        case "failed":
          return {
            label: "Failed",
            color: "bg-red-100 text-red-800 border-red-200",
          };
        case "refunded":
          return {
            label: "Refunded",
            color: "bg-purple-100 text-purple-800 border-purple-200",
          };
        default:
          return {
            label: status || "Unknown",
            color: "bg-gray-100 text-gray-800 border-gray-200",
          };
      }
    }
  };

  // Fetch customers for dropdown using working debug route
  const {
    data: customers = [],
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: [`customers-tenant-${tenant?.id}`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      console.log("🔍 Bookings: Fetching customers for tenant:", tenant?.id);
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/customers?action=get-customers&tenantId=${tenant?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        console.error(
          "🔍 Bookings: Failed to fetch customers:",
          response.status,
          response.statusText,
        );
        throw new Error("Failed to fetch customers");
      }
      const result = await response.json();
      console.log("🔍 Bookings: Raw API response:", result);
      console.log("🔍 Bookings: Is array?", Array.isArray(result));

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

      console.log("🔍 Bookings: Processed customer data:", customerData);
      return customerData;
    },
  });

  // Fetch packages for dropdown
  const { data: packages = [] } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/packages`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/packages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch packages");
      return response.json();
    },
  });

  const {
    data: rawBookings = [],
    isLoading,
    error,
  } = useQuery<any[]>({
    queryKey: [
      `/api/tenants/${tenant?.id}/bookings`,
      searchTerm,
      statusFilter,
      dateFilter,
      customDateFrom,
      customDateTo,
      currentPage,
      itemsPerPage,
    ],
    enabled: !!tenant?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 3000,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const dateFilters = buildDateFilters(
        dateFilter,
        customDateFrom,
        customDateTo,
      );
      console.log("🔍 Fetching bookings with filters:", {
        searchTerm,
        statusFilter,
        dateFilters,
        currentPage,
        itemsPerPage,
      });
      const token = auth.getToken();

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
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", itemsPerPage.toString());

      const finalUrl = `/api/tenants/${tenant?.id}/bookings?${queryParams.toString()}`;

      const response = await fetch(finalUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });
      if (!response.ok) {
        console.error("Bookings API Error:", response.status);
        return [];
      }
      const result = await response.json();

      // Handle paginated response structure
      if (result && typeof result === "object" && "data" in result) {
        setTotalItems(result.total || 0);
        console.log(
          `📋 Bookings fetched:`,
          result.data.length,
          "Total:",
          result.total,
        );
        return result.data;
      }

      // Fallback for array response
      if (Array.isArray(result)) {
        setTotalItems(result.length);
        return result;
      }

      return [];
    },
  });

  // No client-side filtering needed - server returns filtered data
  const bookings = rawBookings;

  // Column definitions for the enhanced table
  const bookingColumns: TableColumn<Booking>[] = [
    {
      key: "bookingNumber",
      label: "Booking #",
      sortable: true,
      render: (value, booking) => (
        <div className="font-medium">{value || `BK-${booking.id}`}</div>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (customerName, booking) => (
        <div className="flex flex-col">
          <div className="font-medium">
            {customerName ||
              customers.find((c: any) => c.id === booking.customerId)?.name ||
              "Unknown"}
          </div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <Mail className="h-3 w-3 mr-1" />
            {booking.customerEmail ||
              customers.find((c: any) => c.id === booking.customerId)?.email ||
              ""}
          </div>
        </div>
      ),
    },
    {
      key: "packageName",
      label: "Package",
      sortable: true,
      render: (packageName, booking) => (
        <div className="flex flex-col">
          <div className="font-medium">
            {packageName ||
              packages.find((p: any) => p.id === booking.packageId)?.name ||
              "Custom"}
          </div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            {booking.packageDestination ||
              packages.find((p: any) => p.id === booking.packageId)
                ?.destination ||
              ""}
          </div>
        </div>
      ),
    },
    {
      key: "travelDate",
      label: "Travel Date",
      sortable: true,
      render: (travelDate) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span>
            {travelDate ? new Date(travelDate).toLocaleDateString() : "-"}
          </span>
        </div>
      ),
    },
    {
      key: "travelers",
      label: "Travelers",
      sortable: true,
      render: (travelers) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2 text-gray-400" />
          <span>{travelers || 0}</span>
        </div>
      ),
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      sortable: true,
      render: (totalAmount) => (
        <div className="flex items-center font-semibold">
          <IndianRupee className="h-4 w-4 mr-1 text-gray-400" />
          <span>
            {totalAmount ? parseFloat(totalAmount).toLocaleString() : "0"}
          </span>
        </div>
      ),
    },
    {
      key: "amountPaid",
      label: "Amount Paid",
      sortable: true,
      render: (amountPaid) => (
        <div className="flex items-center font-semibold text-green-600">
          <IndianRupee className="h-4 w-4 mr-1 text-gray-400" />
          <span>
            {amountPaid ? parseFloat(amountPaid).toLocaleString() : "0"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (status) => {
        const statusConfig = getStatusBadge(status, "booking");
        return (
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        );
      },
    },
    {
      key: "paymentStatus",
      label: "Payment",
      sortable: true,
      render: (paymentStatus) => {
        const statusConfig = getStatusBadge(paymentStatus, "payment");
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
      render: (_, booking) => (
        <div className="flex justify-end space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedBooking(booking);
              setIsViewDialogOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingBooking(booking);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const token = auth.getToken();
                const response = await fetch(
                  `/api/tenants/${tenant?.id}/bookings/${booking.id}/create-invoice`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  },
                );

                if (response.ok) {
                  const result = await response.json();
                  toast({
                    title: "Success",
                    description: result.updated
                      ? "Invoice updated successfully"
                      : "Invoice created successfully",
                  });
                  queryClient.invalidateQueries({
                    queryKey: [`/api/tenants/${tenant?.id}/invoices`],
                  });
                } else {
                  throw new Error("Failed to create/update invoice");
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to create/update invoice",
                  variant: "destructive",
                });
              }
            }}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Pagination calculations using totalItems from API metadata
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // COMPREHENSIVE FIX: Create booking using tenant-specific API with fallback to SQL
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = auth.getToken();
      console.log("🚀 Creating booking with comprehensive approach:", data);

      // Generate unique booking number
      const bookingNumber = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Prepare clean booking data
      const bookingData = {
        tenantId: tenant?.id,
        customerId: parseInt(data.customerId),
        leadTypeId: parseInt(data.leadTypeId),
        bookingNumber,
        status: data.status || "pending",
        travelers: parseInt(data.travelers) || 1,
        travelDate: data.travelDate,
        totalAmount: parseFloat(data.totalAmount) || 0,
        amountPaid: parseFloat(data.amountPaid) || 0,
        paymentStatus: data.paymentStatus || "pending",
        specialRequests: data.specialRequests || null,
        leadId: data.leadId ? parseInt(data.leadId) : null,
        packageId: data.packageId ? parseInt(data.packageId) : null,
        lineItems: data.lineItems || [],
      };

      console.log("🚀 Attempting booking creation with data:", bookingData);

      // Use REST API endpoint
      const response = await fetch(`/api/tenants/${tenant?.id}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Booking creation failed:",
          response.status,
          errorText,
        );
        throw new Error(
          `Failed to create booking: ${response.status} - ${errorText.substring(0, 200)}`,
        );
      }

      const result = await response.json();
      console.log("✅ Booking creation successful:", result);

      // Return the booking data from the API response
      return result.booking || result;
    },
    onSuccess: (result) => {
      console.log("✅ Booking creation successful:", result);
      toast({
        title: "Booking Created Successfully",
        description: `New booking ${result.booking_number || result.bookingNumber || "created"} has been added to your system.`,
      });

      // COMPREHENSIVE REFRESH STRATEGY - Force immediate list update
      console.log("🔄 Forcing booking list refresh after creation...");

      // 1. Clear existing cache completely
      queryClient.removeQueries({
        queryKey: [`/api/tenants/${tenant?.id}/bookings`],
      });

      // 2. Invalidate and refetch immediately
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/bookings`],
      });
      queryClient.refetchQueries({
        queryKey: [`/api/tenants/${tenant?.id}/bookings`],
      });

      // 3. Close dialog first to prevent UI blocking
      setIsCreateDialogOpen(false);

      // 4. Multiple delayed refreshes to ensure list updates
      setTimeout(() => {
        console.log("🔄 First delayed refresh...");
        queryClient.invalidateQueries({
          queryKey: [`/api/tenants/${tenant?.id}/bookings`],
        });
        queryClient.refetchQueries({
          queryKey: [`/api/tenants/${tenant?.id}/bookings`],
        });
      }, 500);

      setTimeout(() => {
        console.log("🔄 Second delayed refresh...");
        queryClient.invalidateQueries({
          queryKey: [`/api/tenants/${tenant?.id}/bookings`],
        });
      }, 2000);
    },
    onError: (error: any) => {
      console.error("❌ Booking creation error:", error);
      const errorMessage =
        error.message ||
        "Failed to create booking. Please check your data and try again.";

      // Extract meaningful error from HTML response if present
      let displayMessage = errorMessage;
      if (errorMessage.includes("<!DOCTYPE")) {
        displayMessage =
          "Server error occurred. Please refresh the page and try again.";
      } else if (errorMessage.includes("UNDEFINED_VALUE")) {
        displayMessage =
          "Data validation error. Please check all required fields are filled correctly.";
      }

      toast({
        title: "Booking Creation Failed",
        description: displayMessage,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for creating booking
  const handleFormSubmit = (formData: any) => {
    console.log("📝 Form submitted with data:", formData);

    // Use the form data directly since TravelBookingForm already collects all data
    createBookingMutation.mutate(formData);
  };

  const handleCreateBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const bookingData = {
      customerId: parseInt(formData.get("customerId") as string),
      packageId: parseInt(formData.get("packageId") as string),
      bookingNumber: `BK${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      travelDate: formData.get("travelDate") as string,
      travelers: parseInt(formData.get("travelers") as string),
      totalAmount: formData.get("totalAmount") as string,
      amountPaid: (formData.get("amountPaid") as string) || "0.00",
      paymentType: (formData.get("paymentType") as string) || "partial",
      status: (formData.get("status") as string) || "pending",
      paymentStatus: (formData.get("paymentStatus") as string) || "pending",
      specialRequests: (formData.get("specialRequests") as string) || null,
    };

    createBookingMutation.mutate(bookingData);
  };

  if (error) {
    return (
      <Layout>
        <div className="p-4 sm:p-8 w-full">
          <Card className="border-red-200">
            <CardContent className="text-center py-12">
              <div className="text-red-500 mb-4">⚠️ Error Loading Bookings</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Unable to load bookings data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error.message ||
                  "There was an error loading the bookings. Please try again."}
              </p>
              <Button
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: [`/api/tenants/${tenant?.id}/bookings`],
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

  return (
    <Layout>
      <div className="p-4 sm:p-8 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Bookings ({bookings.length})
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage travel bookings and reservations - Real-time updates every
              3 seconds
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-white border-cyan-200 text-cyan-700 hover:bg-cyan-50"
              onClick={() => setIsAnalyticsOpen(true)}
              data-testid="button-analytics"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Link href="/bookings/create">
              <Button className="w-full sm:w-auto" data-testid="button-create-booking">
                <Plus className="h-4 w-4 mr-2" />
                Create Booking
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mb-6">
          <Link href="/packages">
            <Button
              variant="outline"
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Package className="h-4 w-4 mr-2" />
              Packages
            </Button>
          </Link>
          <Link href="/invoices">
            <Button
              variant="outline"
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Invoice & Billing
            </Button>
          </Link>
          <Link href="/vendors">
            <Button
              variant="outline"
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Supplier Management
            </Button>
          </Link>
          <Link href="/booking-recommendations">
            <Button
              variant="outline"
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Recommendations
            </Button>
          </Link>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by booking number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {bookingStatuses.map((status) => (
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

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 border rounded-full bg-white p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9"
              onClick={() => setViewMode("list")}
              data-testid="button-list-view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9"
              onClick={() => setViewMode("card")}
              data-testid="button-card-view"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conditional Rendering: Table or Card View */}
        {viewMode === "list" ? (
          /* Enhanced Table with Pagination and Sorting */
          <EnhancedTable
            data={bookings}
            columns={bookingColumns}
            searchTerm={searchTerm}
            showPagination={false}
            pageSize={itemsPerPage}
            emptyMessage={
              searchTerm || statusFilter !== "all"
                ? "No bookings match your search criteria."
                : "No bookings found. Create your first booking to get started."
            }
            isLoading={isLoading}
          />
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking: any) => (
              <Card
                key={booking.id}
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {booking.bookingNumber || `BK-${booking.id}`}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {booking.customerName ||
                          customers.find(
                            (c: any) => c.id === booking.customerId,
                          )?.name ||
                          "Unknown"}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Badge
                        className={
                          getStatusBadge(booking.status, "booking").color
                        }
                      >
                        {getStatusBadge(booking.status, "booking").label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Package Information */}
                  <div className="flex items-center text-sm">
                    <Package className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">
                      {booking.packageName ||
                        packages.find((p: any) => p.id === booking.packageId)
                          ?.name ||
                        "Custom"}
                    </span>
                  </div>

                  {/* Destination */}
                  {(booking.packageDestination ||
                    packages.find((p: any) => p.id === booking.packageId)
                      ?.destination) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {booking.packageDestination ||
                          packages.find((p: any) => p.id === booking.packageId)
                            ?.destination}
                      </span>
                    </div>
                  )}

                  {/* Travel Date */}
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>
                      {booking.travelDate
                        ? new Date(booking.travelDate).toLocaleDateString()
                        : "Date TBD"}
                    </span>
                  </div>

                  {/* Travelers */}
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{booking.travelers || 0} travelers</span>
                  </div>

                  {/* Email */}
                  {(booking.customerEmail ||
                    customers.find((c: any) => c.id === booking.customerId)
                      ?.email) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">
                        {booking.customerEmail ||
                          customers.find(
                            (c: any) => c.id === booking.customerId,
                          )?.email}
                      </span>
                    </div>
                  )}

                  {/* Payment Information */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Amount:</span>
                      <div className="flex items-center font-semibold">
                        <IndianRupee className="h-4 w-4 mr-1 text-gray-400" />
                        <span>
                          {booking.totalAmount
                            ? parseFloat(booking.totalAmount).toLocaleString()
                            : "0"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Amount Paid:</span>
                      <div className="flex items-center font-semibold text-green-600">
                        <IndianRupee className="h-4 w-4 mr-1 text-gray-400" />
                        <span>
                          {booking.amountPaid
                            ? parseFloat(booking.amountPaid).toLocaleString()
                            : "0"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Payment Status:
                      </span>
                      <Badge
                        className={
                          getStatusBadge(booking.paymentStatus, "payment").color
                        }
                      >
                        {getStatusBadge(booking.paymentStatus, "payment").label}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsViewDialogOpen(true);
                      }}
                      data-testid={`button-view-booking-${booking.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditingBooking(booking);
                        setIsEditDialogOpen(true);
                      }}
                      data-testid={`button-edit-booking-${booking.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                {totalItems} bookings
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[2.5rem]"
                      data-testid={`button-page-${pageNum}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Premium Booking Details Modal */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/30">
            <DialogHeader className="border-b border-cyan-100 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    🎫 Booking Overview
                  </DialogTitle>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-gray-700">
                      {selectedBooking?.bookingNumber ||
                        `BK-${selectedBooking?.id}`}
                    </span>
                    {selectedBooking && (
                      <Badge
                        className={`${getStatusBadge(selectedBooking.status, "booking").color} text-sm px-3 py-1`}
                      >
                        {
                          getStatusBadge(selectedBooking.status, "booking")
                            .label
                        }
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-semibold text-gray-700">
                    {selectedBooking?.createdAt
                      ? new Date(selectedBooking.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {selectedBooking && (
              <div className="space-y-6 pt-6">
                {/* Hero Section with Key Details */}
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-90" />
                      <p className="text-cyan-100 text-sm">Customer</p>
                      <p className="font-bold text-lg">
                        {selectedBooking.customerName || "N/A"}
                      </p>
                    </div>
                    <div className="text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-90" />
                      <p className="text-cyan-100 text-sm">Travel Date</p>
                      <p className="font-bold text-lg">
                        {selectedBooking.travelDate
                          ? new Date(
                              selectedBooking.travelDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-90" />
                      <p className="text-cyan-100 text-sm">Travelers</p>
                      <p className="font-bold text-lg">
                        {selectedBooking.travelers || 0} People
                      </p>
                    </div>
                    <div className="text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-90" />
                      <p className="text-cyan-100 text-sm">Destination</p>
                      <p className="font-bold text-lg">
                        {selectedBooking.packageDestination || "Custom"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Summary with Visual Progress */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-emerald-100 rounded-full">
                        <IndianRupee className="h-6 w-6 text-emerald-600" />
                      </div>
                      Financial Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">
                          Total Amount
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          ₹
                          {selectedBooking.totalAmount
                            ? parseFloat(
                                selectedBooking.totalAmount,
                              ).toLocaleString()
                            : "0"}
                        </p>
                      </div>
                      <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">
                          Amount Paid
                        </p>
                        <p className="text-3xl font-bold text-emerald-600">
                          ₹
                          {selectedBooking.amountPaid
                            ? parseFloat(
                                selectedBooking.amountPaid,
                              ).toLocaleString()
                            : "0"}
                        </p>
                      </div>
                      <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">
                          Balance Due
                        </p>
                        <p className="text-3xl font-bold text-red-500">
                          ₹
                          {selectedBooking.totalAmount &&
                          selectedBooking.amountPaid
                            ? (
                                parseFloat(selectedBooking.totalAmount) -
                                parseFloat(selectedBooking.amountPaid)
                              ).toLocaleString()
                            : "0"}
                        </p>
                      </div>
                    </div>

                    {/* Payment Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Payment Progress
                        </span>
                        <Badge
                          className={
                            getStatusBadge(
                              selectedBooking.paymentStatus,
                              "payment",
                            ).color
                          }
                        >
                          {
                            getStatusBadge(
                              selectedBooking.paymentStatus,
                              "payment",
                            ).label
                          }
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              selectedBooking.totalAmount &&
                              selectedBooking.amountPaid
                                ? Math.min(
                                    (parseFloat(selectedBooking.amountPaid) /
                                      parseFloat(selectedBooking.totalAmount)) *
                                      100,
                                    100,
                                  )
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedBooking.totalAmount &&
                        selectedBooking.amountPaid
                          ? `${Math.round((parseFloat(selectedBooking.amountPaid) / parseFloat(selectedBooking.totalAmount)) * 100)}% paid`
                          : "0% paid"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer & Contact Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {selectedBooking.customerName
                              ? selectedBooking.customerName
                                  .charAt(0)
                                  .toUpperCase()
                              : "N"}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">
                              {selectedBooking.customerName || "N/A"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Customer ID: {selectedBooking.customerId}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 pt-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              {selectedBooking.customerEmail || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              {selectedBooking.customerPhone || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              Category: {selectedBooking.leadTypeName || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Plane className="h-5 w-5 text-purple-600" />
                        </div>
                        Travel Package Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <p className="font-semibold text-lg text-gray-800">
                            {selectedBooking.packageName || "Custom Package"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Package ID: {selectedBooking.packageId || "Custom"}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              {selectedBooking.packageDestination ||
                                "Custom Destination"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              Travel Date:{" "}
                              {selectedBooking.travelDate
                                ? new Date(
                                    selectedBooking.travelDate,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              {selectedBooking.travelers || 0} Travelers
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Travel Details & Booking Data */}
                {(selectedBooking.bookingData ||
                  selectedBooking.dynamicData) && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full">
                          <Package className="h-5 w-5 text-amber-600" />
                        </div>
                        Travel Details & Booking Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Full-Width Travel Booking Details */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Plane className="h-5 w-5 text-blue-600" />
                          Travel Booking Details
                        </h4>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl">
                          {selectedBooking.bookingData ? (
                            (() => {
                              let bookingInfo;
                              try {
                                bookingInfo =
                                  typeof selectedBooking.bookingData ===
                                  "string"
                                    ? JSON.parse(selectedBooking.bookingData)
                                    : selectedBooking.bookingData;
                              } catch {
                                return (
                                  <div className="text-gray-700 text-sm whitespace-pre-wrap">
                                    {String(selectedBooking.bookingData)}
                                  </div>
                                );
                              }

                              // Handle structured booking data with proper array/object rendering
                              if (
                                typeof bookingInfo === "object" &&
                                bookingInfo !== null
                              ) {
                                const renderValue = (
                                  value: any,
                                ): string | JSX.Element => {
                                  if (Array.isArray(value)) {
                                    // Handle arrays like passengers, lineItems
                                    if (value.length === 0) return "None";
                                    return (
                                      <div className="space-y-2">
                                        {value.map((item, index) => (
                                          <div
                                            key={index}
                                            className="bg-white p-3 rounded-lg border border-blue-200"
                                          >
                                            {typeof item === "object" &&
                                            item !== null ? (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                {Object.entries(item).map(
                                                  ([subKey, subValue]) => (
                                                    <div
                                                      key={subKey}
                                                      className="flex justify-between"
                                                    >
                                                      <span className="font-medium text-blue-700">
                                                        {subKey
                                                          .replace(
                                                            /([A-Z])/g,
                                                            " $1",
                                                          )
                                                          .replace(
                                                            /^./,
                                                            (str) =>
                                                              str.toUpperCase(),
                                                          )
                                                          .replace(/_/g, " ")}
                                                        :
                                                      </span>
                                                      <span className="text-gray-700">
                                                        {String(subValue)}
                                                      </span>
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-gray-700">
                                                {String(item)}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  } else if (
                                    typeof value === "object" &&
                                    value !== null
                                  ) {
                                    // Handle nested objects
                                    return (
                                      <div className="space-y-1">
                                        {Object.entries(value).map(
                                          ([subKey, subValue]) => (
                                            <div
                                              key={subKey}
                                              className="text-sm"
                                            >
                                              <span className="font-medium text-blue-700">
                                                {subKey
                                                  .replace(/([A-Z])/g, " $1")
                                                  .replace(/^./, (str) =>
                                                    str.toUpperCase(),
                                                  )
                                                  .replace(/_/g, " ")}
                                                :
                                              </span>
                                              <span className="ml-2 text-gray-700">
                                                {String(subValue)}
                                              </span>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    );
                                  } else {
                                    return String(value);
                                  }
                                };

                                const renderBookingInfo = (
                                  data: any,
                                  depth = 0,
                                ) => {
                                  const items = [];

                                  for (const [key, value] of Object.entries(
                                    data,
                                  )) {
                                    if (
                                      typeof value === "object" &&
                                      value !== null
                                    ) {
                                      // Handle nested objects and arrays with special styling
                                      items.push(
                                        <div key={key} className="mb-6">
                                          <div className="font-semibold text-blue-800 text-base mb-3 border-b-2 border-blue-300 pb-2">
                                            {key
                                              .replace(/([A-Z])/g, " $1")
                                              .replace(/^./, (str) =>
                                                str.toUpperCase(),
                                              )
                                              .replace(/_/g, " ")}
                                          </div>
                                          <div className="ml-4">
                                            {renderValue(value)}
                                          </div>
                                        </div>,
                                      );
                                    } else {
                                      // Handle simple key-value pairs
                                      items.push(
                                        <div
                                          key={key}
                                          className="grid grid-cols-1 md:grid-cols-4 gap-3 py-2 border-b border-blue-100 last:border-b-0"
                                        >
                                          <div className="font-medium text-blue-700 text-sm">
                                            {key
                                              .replace(/([A-Z])/g, " $1")
                                              .replace(/^./, (str) =>
                                                str.toUpperCase(),
                                              )
                                              .replace(/_/g, " ")}
                                          </div>
                                          <div className="col-span-3 text-gray-700 text-sm">
                                            {renderValue(value)}
                                          </div>
                                        </div>,
                                      );
                                    }
                                  }
                                  return items;
                                };

                                return (
                                  <div className="space-y-4">
                                    {renderBookingInfo(bookingInfo)}
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-gray-700 text-sm whitespace-pre-wrap">
                                    {String(bookingInfo)}
                                  </div>
                                );
                              }
                            })()
                          ) : (
                            <div className="text-center text-gray-500 py-8">
                              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p className="text-lg">
                                No booking details available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional Information if available */}
                      {selectedBooking.dynamicData && (
                        <div className="mt-8">
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-emerald-600" />
                            Additional Information
                          </h4>
                          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl">
                            {(() => {
                              let dynamicInfo;
                              try {
                                dynamicInfo =
                                  typeof selectedBooking.dynamicData ===
                                  "string"
                                    ? JSON.parse(selectedBooking.dynamicData)
                                    : selectedBooking.dynamicData;
                              } catch {
                                return (
                                  <div className="text-gray-700 text-sm whitespace-pre-wrap">
                                    {String(selectedBooking.dynamicData)}
                                  </div>
                                );
                              }

                              if (
                                typeof dynamicInfo === "object" &&
                                dynamicInfo !== null
                              ) {
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(dynamicInfo).map(
                                      ([key, value]) => (
                                        <div
                                          key={key}
                                          className="flex justify-between py-1"
                                        >
                                          <span className="font-medium text-emerald-700 text-sm">
                                            {key
                                              .replace(/([A-Z])/g, " $1")
                                              .replace(/^./, (str) =>
                                                str.toUpperCase(),
                                              )
                                              .replace(/_/g, " ")}
                                            :
                                          </span>
                                          <span className="text-gray-700 text-sm">
                                            {Array.isArray(value)
                                              ? value.join(", ")
                                              : String(value)}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-gray-700 text-sm whitespace-pre-wrap">
                                    {String(dynamicInfo)}
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Travel Summary Stats if available */}
                      {(selectedBooking.bookingData ||
                        selectedBooking.dynamicData) && (
                        <div className="mt-8">
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-purple-600" />
                            Travel Summary
                          </h4>
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                  {selectedBooking.travelers || 0}
                                </div>
                                <p className="text-sm text-gray-600">
                                  Travelers
                                </p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                  {selectedBooking.travelDate
                                    ? Math.ceil(
                                        (new Date(
                                          selectedBooking.travelDate,
                                        ).getTime() -
                                          new Date().getTime()) /
                                          (1000 * 60 * 60 * 24),
                                      )
                                    : "?"}
                                </div>
                                <p className="text-sm text-gray-600">
                                  Days until travel
                                </p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                  {selectedBooking.packageDestination?.split(
                                    ",",
                                  ).length || 1}
                                </div>
                                <p className="text-sm text-gray-600">
                                  Destinations
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Special Requests & Notes */}
                {selectedBooking.specialRequests && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-lg">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-rose-100 rounded-full">
                          <FileText className="h-5 w-5 text-rose-600" />
                        </div>
                        Special Requests & Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border-l-4 border-amber-400">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {selectedBooking.specialRequests}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Booking Timeline */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <Clock className="h-5 w-5 text-gray-600" />
                      </div>
                      Booking Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            Booking Created
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedBooking.createdAt
                              ? new Date(
                                  selectedBooking.createdAt,
                                ).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      {selectedBooking.updatedAt &&
                        selectedBooking.updatedAt !==
                          selectedBooking.createdAt && (
                          <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg">
                            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                Last Updated
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  selectedBooking.updatedAt,
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                      <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            Travel Date
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedBooking.travelDate
                              ? new Date(
                                  selectedBooking.travelDate,
                                ).toLocaleDateString()
                              : "To be confirmed"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-4 pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => {
                      setEditingBooking(selectedBooking);
                      setIsViewDialogOpen(false);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Booking
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => handleDownloadReceipt(selectedBooking)}
                  >
                    <Download className="h-4 w-4" />
                    Download Receipt
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-white hover:bg-purple-50 border-purple-200 text-purple-700 hover:text-purple-800 transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => handleSendConfirmation(selectedBooking)}
                  >
                    <Mail className="h-4 w-4" />
                    Send Confirmation
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Booking Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Edit Booking -{" "}
                {editingBooking?.bookingNumber || `BK-${editingBooking?.id}`}
              </DialogTitle>
              <DialogDescription>
                Update booking details and travel information.
              </DialogDescription>
            </DialogHeader>
            {editingBooking && (
              <TravelBookingForm
                booking={editingBooking}
                tenantId={tenant?.id?.toString() || ""}
                onSubmit={async (data) => {
                  try {
                    console.log(
                      "🔍 Submitting booking update with data:",
                      data,
                    );
                    console.log(
                      "🔍 Original booking being edited:",
                      editingBooking,
                    );
                    const token = auth.getToken();
                    const response = await fetch(
                      `/api/tenants/${tenant?.id}/bookings/${editingBooking.id}`,
                      {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          ...data,
                          bookingData: JSON.stringify(data.passengers || []),
                          dynamicData: JSON.stringify(data.lineItems || []),
                        }),
                      },
                    );

                    if (response.ok) {
                      toast({
                        title: "Success",
                        description: "Booking updated successfully!",
                      });
                      setIsEditDialogOpen(false);
                      setEditingBooking(null);
                      queryClient.invalidateQueries({
                        queryKey: [`/api/tenants/${tenant?.id}/bookings`],
                      });
                    } else {
                      throw new Error("Failed to update booking");
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description:
                        "Failed to update booking. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingBooking(null);
                }}
                isLoading={false}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Analytics Slide-out Panel */}
        {isAnalyticsOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity duration-300"
              onClick={() => setIsAnalyticsOpen(false)}
            />

            {/* Analytics Panel - 50% width, slide from right */}
            <div className="ml-auto w-1/2 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-cyan-50 to-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-100">
                      <BarChart3 className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Booking Analytics
                      </h2>
                      <p className="text-sm text-gray-600">
                        Overview of booking performance and trends
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAnalyticsOpen(false)}
                    className="rounded-full hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Total Bookings
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {bookings.length}
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-blue-100">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Confirmed
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              {
                                bookings.filter((b) => b.status === "confirmed")
                                  .length
                              }
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-green-100">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Pending
                            </p>
                            <p className="text-2xl font-bold text-yellow-600">
                              {
                                bookings.filter((b) => b.status === "pending")
                                  .length
                              }
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-yellow-100">
                            <Clock className="h-5 w-5 text-yellow-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Total Revenue
                            </p>
                            <p className="text-2xl font-bold text-cyan-600">
                              ₹
                              {bookings
                                .reduce(
                                  (sum, b) =>
                                    sum +
                                    (parseFloat(b.totalAmount || "0") || 0),
                                  0,
                                )
                                .toLocaleString()}
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-cyan-100">
                            <IndianRupee className="h-5 w-5 text-cyan-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Status Distribution Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        Booking Status Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bookingStatuses.map((status) => {
                          const count = bookings.filter(
                            (b) => b.status === status.value,
                          ).length;
                          const percentage =
                            bookings.length > 0
                              ? (count / bookings.length) * 100
                              : 0;
                          return (
                            <div
                              key={status.value}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <Badge className={status.color}>
                                  {status.label}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {count} bookings
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700 w-10">
                                  {percentage.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Status Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        Payment Status Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {paymentStatuses.map((status) => {
                          const count = bookings.filter(
                            (b) => b.paymentStatus === status.value,
                          ).length;
                          const percentage =
                            bookings.length > 0
                              ? (count / bookings.length) * 100
                              : 0;
                          return (
                            <div
                              key={status.value}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <Badge className={status.color}>
                                  {status.label}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {count} payments
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700 w-10">
                                  {percentage.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        Recent Bookings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bookings.slice(0, 5).map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                                <Package className="h-4 w-4 text-cyan-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {booking.bookingNumber || `BK-${booking.id}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {booking.customerName ||
                                    booking.customerEmail}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                ₹
                                {parseFloat(
                                  booking.totalAmount || "0",
                                ).toLocaleString()}
                              </p>
                              <Badge
                                className={
                                  getStatusBadge(booking.status, "booking")
                                    .color
                                }
                              >
                                {
                                  getStatusBadge(booking.status, "booking")
                                    .label
                                }
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { TravelBookingForm } from "@/components/booking/travel-booking-form";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { EnhancedTable, TableColumn } from "@/components/ui/enhanced-table";
import type { Booking } from "@/lib/types";

interface BookingTableProps {
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

// Force hot reload - BookingTable component updated with new layout
export default function BookingTable({
  customerId,
  customerEmail,
  customerPhone,
  customerName,
}: BookingTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
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
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.customers || [];
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
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch all bookings for tenant with customer filtering
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: [`customer-bookings`, tenant?.id, customerId],
    enabled: !!tenant?.id && !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    queryFn: async () => {
      const token = auth.getToken();
      const url = `/api/tenants/${tenant?.id}/bookings${customerId ? `?customerId=${customerId}` : ""}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) return [];
      const result = await response.json();
      const allBookings = Array.isArray(result)
        ? result
        : result.bookings || [];

      // Client-side filtering as backup (more precise filtering)
      return allBookings.filter((booking: any) => {
        // Primary filtering by customer ID (exact match)
        if (customerId && booking.customerId) {
          return Number(booking.customerId) === Number(customerId);
        }
        // Fallback filtering if customerId is missing but other fields match
        return (
          (customerEmail && booking.customerEmail === customerEmail) ||
          (customerPhone && booking.customerPhone === customerPhone)
        );
      });
    },
  });

  // Status badge utility function
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

  // Column definitions matching main bookings page
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
              "Custom Package"}
          </div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            N/A
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
            {travelDate
              ? new Date(travelDate).toLocaleDateString()
              : "10/09/2025"}
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
          <span>{travelers || 1}</span>
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
            {totalAmount ? parseFloat(totalAmount).toLocaleString() : "5,200"}
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
            {amountPaid ? parseFloat(amountPaid).toLocaleString() : "2,000"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (status) => {
        const statusConfig = getStatusBadge(status || "confirmed", "booking");
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
        const statusConfig = getStatusBadge(
          paymentStatus || "partial",
          "payment",
        );
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

  // Filter bookings based on search term and status
  const filteredBookings = bookings.filter((booking) => {
    const searchableText = (
      (booking.bookingNumber || `BK-${booking.id}`) +
      " " +
      (booking.customerName || "") +
      " " +
      (booking.customerEmail || "") +
      " " +
      (booking.packageName || "") +
      " " +
      (booking.packageDestination || "")
    ).toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      booking.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = auth.getToken();
      console.log("🚀 Creating booking with customer data:", data);

      // Generate unique booking number
      const bookingNumber = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Prepare clean booking data
      const bookingData = {
        tenantId: tenant?.id,
        bookingNumber,
        customerId: data.customerId,
        customerName: customerName,
        customerEmail: customerEmail,
        packageId: data.packageId,
        leadId: data.leadId,
        leadTypeId: data.leadTypeId,
        travelers: data.travelers,
        travelDate: data.travelDate,
        totalAmount: data.totalAmount,
        amountPaid: data.amountPaid || 0,
        paymentStatus: data.paymentStatus || "pending",
        status: data.status || "pending",
        specialRequests: data.specialRequests,
        bookingData: data.bookingData,
        dynamicData: data.dynamicData,
        passengers: data.passengers,
      };

      // Use REST API endpoint with properly structured bookingData
      const response = await fetch(`/api/tenants/${tenant?.id}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error("Failed to create booking");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`customer-bookings`, tenant?.id, customerId],
      });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        {/* Title and Create Button Row - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {customerName}'s Bookings
          </h3>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-[#0BBCD6] hover:bg-[#0A9BB8] text-white font-medium shadow-md flex-shrink-0"
            size="sm"
            data-testid="button-new-booking"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Search and Filter Row - Responsive */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by booking number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-bookings"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-full sm:w-[180px]"
              data-testid="select-status-filter"
            >
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Booking Table */}
      <div
        data-testid="customer-bookings-table"
        className="bg-white rounded-2xl shadow-md overflow-hidden"
      >
        <div className="overflow-x-auto">
          <EnhancedTable
            data={filteredBookings}
            columns={bookingColumns}
            isLoading={isLoading}
            emptyMessage={`No bookings found for ${customerName}`}
            className=""
          />
        </div>
      </div>

      {/* Create Booking Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Create New Booking for {customerName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TravelBookingForm
              booking={{
                customerId: customerId || "",
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone,
              }}
              tenantId={tenant?.id?.toString() || ""}
              onSubmit={(data) => {
                createBookingMutation.mutate(data);
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createBookingMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Booking Number
                  </label>
                  <p className="text-lg font-semibold">
                    {selectedBooking.bookingNumber ||
                      `BK-${selectedBooking.id}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <Badge
                    className={
                      getStatusBadge(selectedBooking.status, "booking").color
                    }
                  >
                    {getStatusBadge(selectedBooking.status, "booking").label}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Travel Date
                  </label>
                  <p>
                    {selectedBooking.travelDate
                      ? new Date(
                          selectedBooking.travelDate,
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Travelers
                  </label>
                  <p>{selectedBooking.travelers || 0} passengers</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Total Amount
                  </label>
                  <p className="text-lg font-semibold">
                    ₹
                    {selectedBooking.totalAmount
                      ? parseFloat(selectedBooking.totalAmount).toLocaleString()
                      : "0"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Amount Paid
                  </label>
                  <p className="text-lg font-semibold text-green-600">
                    ₹
                    {selectedBooking.amountPaid
                      ? parseFloat(selectedBooking.amountPaid).toLocaleString()
                      : "0"}
                  </p>
                </div>
              </div>
              {selectedBooking.specialRequests && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Special Requests
                  </label>
                  <p className="mt-1 text-gray-700">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Edit Booking for {customerName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TravelBookingForm
              booking={editingBooking}
              tenantId={tenant?.id?.toString() || ""}
              onSubmit={(data) => {
                // Handle edit submission
                createBookingMutation.mutate(data);
              }}
              onCancel={() => setIsEditDialogOpen(false)}
              isLoading={createBookingMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

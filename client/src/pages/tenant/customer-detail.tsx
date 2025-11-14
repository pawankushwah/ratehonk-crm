import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  Settings,
  HelpCircle,
  Bell,
  Plus,
  Phone,
  Mail,
  FileText,
  Folder,
  Receipt,
  MessageCircle,
  MoreHorizontal,
  User,
  MapPin,
  Globe,
  Calendar,
  Activity,
  PhoneCall,
  File,
  CreditCard,
  UserPlus,
  Send,
  CalendarDays,
  FileCheck,
  DollarSign,
  Award,
  Paperclip,
  StickyNote,
  Clock,
  Users,
  IndianRupee,
  Eye,
  Edit,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Package,
  UserCheck,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/components/auth/auth-provider";
import { directCustomersApi } from "@/lib/direct-customers-api";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/auth";
import type { Customer, Booking } from "../../../shared/schema";
import CustomerNotesModal from "@/CustomerModal/CustomerNotesModal";
import CustomerActivityModal from "@/CustomerModal/CustomerActivityModal";
import CustomerCallModal from "@/CustomerModal/CustomerCallModal";
import CustomerEmailModal from "@/CustomerModal/CustomerEmailModal";
import FilesDocumentsTable from "@/customerTable/FilesDocumentsTable";
import { ActivityDataPopup } from "@/components/ActivityDataPopup";
import { EnhancedTable, TableColumn } from "@/components/ui/enhanced-table";
import { TravelBookingForm } from "@/components/booking/travel-booking-form";
import { useToast } from "@/hooks/use-toast";
import { ZoomPhoneEmbed } from "@/components/zoom/zoom-phone-embed";
import { CallLogsSection } from "@/components/customer/call-logs-section";
import { WhatsAppMessageDialog } from "@/components/customer/whatsapp-message-dialog";

export default function CustomerDetail() {
  const { customerId } = useParams();
  const { tenant, user } = useAuth();
  const [activeTab, setActiveTab] = useState("notes");
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(true);
  const [organizationDetailsOpen, setOrganizationDetailsOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Modal states
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [activityPopupOpen, setActivityPopupOpen] = useState(false);
  const [selectedActivityTable, setSelectedActivityTable] = useState<{
    tableName: string | null;
    tableId: number | null;
  }>({ tableName: null, tableId: null });
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);
  const [isViewBookingOpen, setIsViewBookingOpen] = useState(false);
  const [isEditBookingOpen, setIsEditBookingOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editableItem, setEditableItem] = useState(null);
  const [isZoomPhoneOpen, setIsZoomPhoneOpen] = useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);

  // Helper functions for activity display
  const getActivityIcon = (activityType: number) => {
    const iconMap = {
      1: UserPlus, // Customer Created
      2: Mail, // Email Sent
      3: PhoneCall, // Call Made
      4: CalendarDays, // Meeting Scheduled
      5: Activity, // WhatsApp Message / Follow-up
      6: Send, // Proposal Sent
      7: FileCheck, // Contract Signed
      8: DollarSign, // Payment Received
      9: Award, // Project Completed
      10: FileText, // Other
      11: CalendarDays, // Booking Created
      12: FileText, // Invoice Created
    };
    return iconMap[activityType as keyof typeof iconMap] || FileText;
  };

  const getActivityTypeLabel = (activityType: number) => {
    const labelMap = {
      1: "Customer Created",
      2: "Email Sent",
      3: "Call Made",
      4: "Meeting Scheduled",
      5: "WhatsApp Message",
      6: "Proposal Sent",
      7: "Contract Signed",
      8: "Payment Received",
      9: "Project Completed",
      10: "Other",
      11: "Booking Created",
      12: "Invoice Created",
    };
    return labelMap[activityType as keyof typeof labelMap] || "Unknown";
  };

  const getActivityStatusLabel = (activityStatus: number) => {
    return activityStatus === 1 ? "Completed" : "Pending";
  };

  const getActivityStatusColor = (activityStatus: number) => {
    return activityStatus === 1
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-orange-100 text-orange-800 border-orange-200";
  };

  // Status badge utility function for consistent booking status display
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

  // Customer Analytics Component
  const CustomerAnalytics = ({
    customerId,
    customer,
    bookings,
  }: {
    customerId: string;
    customer: any;
    bookings: any[];
  }) => {
    // Fetch customer-specific analytics
    const { data: customerAnalytics, isLoading: analyticsLoading } = useQuery({
      queryKey: [
        `/api/tenants/${tenant?.id}/customers/${customerId}/analytics`,
      ],
      enabled: !!customerId && !!tenant?.id,
      staleTime: 0,
    });

    const analytics = customerAnalytics || {};

    // Use API data if available, fallback to client-side calculations
    const summary = analytics.summary || {};
    const totalBookings = summary.totalBookings ?? (bookings || []).length;
    const totalRevenue =
      summary.totalRevenue ??
      (bookings || []).reduce(
        (sum, booking) => sum + (Number(booking.totalAmount) || 0),
        0,
      );
    const avgBookingValue =
      summary.avgBookingValue ??
      (totalBookings > 0 ? totalRevenue / totalBookings : 0);
    const totalDueAmount = summary.totalDueAmount ?? 0;

    // Use API payment status data if available, fallback to bookings
    const paymentStatusData =
      analytics.paymentStatusArray ||
      Object.entries(
        analytics.paymentStatus ||
          (bookings || []).reduce((acc, booking) => {
            const status = booking.paymentStatus || "pending";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {}),
      ).map(([status, count]) => ({
        name: status,
        value: count as number,
        color:
          status === "paid"
            ? "#10b981"
            : status === "pending"
              ? "#f59e0b"
              : "#ef4444",
      }));

    // Use API monthly trends if available, fallback to client calculation
    const monthlyData = analytics.monthlyTrends || [];

    // If no API data, calculate from bookings as fallback
    if (monthlyData.length === 0 && bookings && bookings.length > 0) {
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString("en-US", { month: "short" });

        const monthBookings = bookings.filter((booking) => {
          const bookingDate = new Date(booking.createdAt);
          return (
            bookingDate.getMonth() === date.getMonth() &&
            bookingDate.getFullYear() === date.getFullYear()
          );
        });

        monthlyData.push({
          month,
          bookings: monthBookings.length,
          revenue: monthBookings.reduce(
            (sum, b) => sum + (Number(b.totalAmount) || 0),
            0,
          ),
        });
      }
    }

    if (analyticsLoading) {
      return (
        <div className="p-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Customer Analytics
          </h3>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalBookings}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Due Amount</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${totalDueAmount.toLocaleString()}
                  </p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Customer Since</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(customer?.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Booking Trend */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Booking Trend (6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis dataKey="month" className="text-sm" />
                    <YAxis className="text-sm" />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === "bookings"
                          ? `${value} bookings`
                          : `$${value.toLocaleString()}`,
                        name === "bookings" ? "Bookings" : "Revenue",
                      ]}
                    />
                    <Bar
                      dataKey="bookings"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status Distribution */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {paymentStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No payment data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-sm" />
                  <YAxis
                    className="text-sm"
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: "#10b981", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Fetch customer details
  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: [`customer-detail-${customerId}`],
    enabled: !!customerId && !!tenant?.id,
    queryFn: async () => {
      return await directCustomersApi.getCustomer(
        tenant?.id!,
        parseInt(customerId!),
      );
    },
  });

  // Fetch customer notes from API
  const {
    data: notesData,
    isLoading: notesLoading,
    refetch: refetchNotes,
  } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/customers/${customerId}/notes`],
    enabled: !!customerId && !!tenant?.id && activeTab === "notes",
    staleTime: 0,
  });

  // Fetch customer activities from API
  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/customers/${customerId}/activities`],
    enabled: !!customerId && !!tenant?.id && activeTab === "activity",
    staleTime: 0,
  });

  // Fetch customer emails from API
  const {
    data: emailsData,
    isLoading: emailsLoading,
    refetch: refetchEmails,
  } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/customers/${customerId}/emails`],
    enabled: !!customerId && !!tenant?.id && activeTab === "email",
    staleTime: 0,
  });

  // Fetch customer call logs from API
  const {
    data: callsData,
    isLoading: callsLoading,
    refetch: refetchCalls,
  } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/customers/${customerId}/calls`],
    enabled: !!customerId && !!tenant?.id && activeTab === "call",
    staleTime: 0,
  });

  // Fetch customer WhatsApp messages from API
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/customers/${customerId}/whatsapp-messages`],
    enabled: !!customerId && !!tenant?.id && activeTab === "messages",
    staleTime: 0,
  });

  // Fetch customer bookings from API
  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery<Booking[]>({
    queryKey: [`/api/tenants/${tenant?.id}/bookings`],
    enabled:
      !!customerId &&
      !!tenant?.id &&
      (activeTab === "bookings" || activeTab === "analytics"),
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const result = await response.json();
      const allBookings = Array.isArray(result)
        ? result
        : result.bookings || [];
      // Filter bookings for this customer
      return allBookings.filter(
        (booking: any) => booking.customerId === parseInt(customerId!),
      );
    },
  });

  // Fetch customers and packages for booking form
  const { data: customers = [] } = useQuery({
    queryKey: [`customers-tenant-${tenant?.id}`],
    enabled: !!tenant?.id && activeTab === "bookings",
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/customers?action=get-customers&tenantId=${tenant?.id}`,
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

  const { data: packages = [] } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/packages`],
    enabled: !!tenant?.id && activeTab === "bookings",
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/packages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Process API response data - server returns arrays directly, not nested objects
  const notes = Array.isArray(notesData)
    ? notesData
    : (notesData as any)?.notes || [];
  const activities = Array.isArray(activitiesData)
    ? activitiesData
    : (activitiesData as any)?.activities || [];
  const emails = Array.isArray(emailsData)
    ? emailsData
    : (emailsData as any)?.emails || [];
  const calls = Array.isArray(callsData)
    ? callsData
    : (callsData as any)?.calls || [];
  const messages = Array.isArray(messagesData)
    ? messagesData
    : (messagesData as any)?.messages || [];
  const bookings = bookingsData || [];

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      if (!customerId || !user?.id || !tenant?.id) {
        throw new Error("Missing required customer ID, user ID, or tenant ID");
      }

      const notePayload = {
        ...noteData,
        customerId: parseInt(customerId),
        tenantId: tenant.id,
        userId: user.id,
      };

      return apiRequest(
        "POST",
        `/api/tenants/${tenant.id}/customers/${customerId}/notes`,
        notePayload,
      );
    },
    onSuccess: () => {
      refetchNotes();
      setIsNotesModalOpen(false);
      setEditableItem(null);
      toast({
        title: "Success",
        description: "Note created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create note",
        variant: "destructive",
      });
    },
  });

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      if (!customerId || !user?.id || !tenant?.id) {
        throw new Error("Missing required customer ID, user ID, or tenant ID");
      }

      const activityPayload = {
        ...activityData,
        customerId: parseInt(customerId),
        tenantId: tenant.id,
        userId: user.id,
      };

      return apiRequest(
        "POST",
        `/api/tenants/${tenant.id}/customers/${customerId}/activities`,
        activityPayload,
      );
    },
    onSuccess: () => {
      refetchActivities();
      setIsActivityModalOpen(false);
      setEditableItem(null);
      toast({
        title: "Success",
        description: "Activity created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create activity",
        variant: "destructive",
      });
    },
  });

  // Create call mutation
  const createCallMutation = useMutation({
    mutationFn: async (callData: any) => {
      if (!customerId || !user?.id || !tenant?.id) {
        throw new Error("Missing required customer ID, user ID, or tenant ID");
      }

      const callPayload = {
        ...callData,
        customerId: parseInt(customerId),
        tenantId: tenant.id,
        userId: user.id,
      };

      return apiRequest(
        "POST",
        `/api/tenants/${tenant.id}/customers/${customerId}/calls`,
        callPayload,
      );
    },
    onSuccess: () => {
      refetchCalls();
      setIsCallModalOpen(false);
      setEditableItem(null);
      toast({
        title: "Success",
        description: "Call log created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create call log",
        variant: "destructive",
      });
    },
  });

  // Create email mutation
  const createEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      if (!customerId || !user?.id || !tenant?.id) {
        throw new Error("Missing required customer ID, user ID, or tenant ID");
      }

      const emailPayload = {
        ...emailData,
        customerId: parseInt(customerId),
        tenantId: tenant.id,
        userId: user.id,
      };

      return apiRequest(
        "POST",
        `/api/tenants/${tenant.id}/customers/${customerId}/emails`,
        emailPayload,
      );
    },
    onSuccess: () => {
      refetchEmails();
      setIsEmailModalOpen(false);
      setEditableItem(null);
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  // Column definitions for the booking table
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
              setIsViewBookingOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingBooking(booking);
              setIsEditBookingOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = auth.getToken();

      // Generate unique booking number
      const bookingNumber = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Prepare booking data with customer ID pre-filled
      const bookingData = {
        ...data,
        customerId: parseInt(customerId!),
        tenantId: tenant?.id,
        bookingNumber,
      };

      const response = await fetch(`/api/tenants/${tenant?.id}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create booking: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Booking Created Successfully",
        description: `New booking ${result.booking_number || result.bookingNumber || "created"} has been added.`,
      });

      refetchBookings();
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/bookings`],
      });
      setIsCreateBookingOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Booking Creation Failed",
        description:
          error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle booking form submission
  const handleBookingFormSubmit = (formData: any) => {
    createBookingMutation.mutate(formData);
  };

  // Handle modal save actions
  const handleNoteSave = (data: any, mode: string) => {
    createNoteMutation.mutate(data);
  };

  const handleActivitySave = (data: any, mode: string) => {
    createActivityMutation.mutate(data);
  };

  const handleCallSave = (data: any, mode: string) => {
    createCallMutation.mutate(data);
  };

  const handleEmailSave = (data: any, mode: string) => {
    createEmailMutation.mutate(data);
  };

  const renderTabContent = () => {
    if (activeTab === "notes") {
      if (notes.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notes added for this customer yet</p>
            <p className="text-sm mt-1">
              Click "Add Note" to create your first note
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {notes.map((note: any, index: number) => (
            <div key={note.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 border-2 border-blue-200">
                  <StickyNote className="w-5 h-5 text-blue-600" />
                </div>
                {index < notes.length - 1 && (
                  <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                )}
              </div>

              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {note.noteTitle || note.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${
                          note.noteType === "important"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }`}
                      >
                        {note.noteType || "general"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">
                      {new Date(note.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {note.noteContent || note.details ? (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {note.noteContent || note.details}
                    </p>
                  </div>
                ) : null}

                {note.attachment && (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                        {note.attachment}
                      </span>
                    </div>
                  </div>
                )}

                {note.reminder && (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">
                        Reminder Set
                      </span>
                    </div>
                    {note.reminderDate && (
                      <p className="text-xs text-gray-600 ml-6">
                        📅 {new Date(note.reminderDate).toLocaleDateString()} at{" "}
                        {new Date(note.reminderDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 ml-6">
                      🎯{" "}
                      {note.reminderAuto
                        ? "For you"
                        : `For ${note.reminderEmail || "someone else"}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "activity") {
      if (activities.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No activities recorded for this customer yet</p>
            <p className="text-sm mt-1">
              Click "Add Activity" to create your first activity
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {activities.map((activity: any, index: number) => {
            const ActivityIcon = getActivityIcon(activity.activityType);
            const isCompleted = activity.activityStatus === 1;

            return (
              <div key={activity.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-100 border-2 border-green-200"
                        : "bg-orange-100 border-2 border-orange-200"
                    }`}
                  >
                    <ActivityIcon
                      className={`w-5 h-5 ${
                        isCompleted ? "text-green-600" : "text-orange-600"
                      }`}
                    />
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                <div 
                  className={`flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${
                    activity.activityTableId && activity.activityTableName
                      ? "cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                      : ""
                  }`}
                  onClick={() => {
                    console.log("🔍 Activity clicked:", {
                      activityId: activity.id,
                      activityTableId: activity.activityTableId,
                      activityTableName: activity.activityTableName,
                      hasTableData: !!(activity.activityTableId && activity.activityTableName),
                    });
                    if (activity.activityTableId && activity.activityTableName) {
                      setSelectedActivityTable({
                        tableName: activity.activityTableName,
                        tableId: activity.activityTableId,
                      });
                      setActivityPopupOpen(true);
                      console.log("✅ Popup should open now");
                    } else {
                      console.log("⚠️ Activity has no table data, popup not opening");
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getActivityStatusColor(activity.activityStatus)}`}
                      >
                        {getActivityStatusLabel(activity.activityStatus)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {getActivityTypeLabel(activity.activityType)}
                      </span>
                      {activity.activityTableId && activity.activityTableName && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          View Details
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {new Date(activity.activityDate).toLocaleDateString()}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(activity.activityDate).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2">
                    {activity.activityTitle}
                  </h4>

                  {activity.activityDescription && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {activity.activityDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === "call") {
      if (calls.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <PhoneCall className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No call logs recorded for this customer yet</p>
            <p className="text-sm mt-1">
              Click "Add Call" to log your first call
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {calls.map((callLog: any, index: number) => {
            const isOutbound = callLog.callType === "outbound";
            const isCompleted = callLog.status === "completed";

            return (
              <div key={callLog.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-100 border-2 border-green-200"
                        : "bg-red-100 border-2 border-red-200"
                    }`}
                  >
                    <PhoneCall
                      className={`w-5 h-5 ${
                        isCompleted ? "text-green-600" : "text-red-600"
                      }`}
                    />
                  </div>
                  {index < calls.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          isOutbound
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-purple-100 text-purple-800 border-purple-200"
                        }`}
                      >
                        {isOutbound ? "Outbound" : "Inbound"}
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          isCompleted
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                      >
                        {callLog.status || "Unknown"}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {new Date(callLog.startedAt).toLocaleDateString()}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(callLog.startedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {callLog.caller_number && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Mobile Number :- {callLog.caller_number}
                      </p>
                    </div>
                  )}

                  {callLog.duration && (
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {callLog.duration}{" "}
                        {callLog.duration === 1 ? "minute" : "minutes"}
                      </span>
                    </div>
                  )}

                  {callLog.notes && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {callLog.notes}
                      </p>
                    </div>
                  )}
                  {callLog.followUpRequired && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Follow Up :- {callLog.followUpDateTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === "messages") {
      if (messages.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No WhatsApp messages sent to this customer yet</p>
            <p className="text-sm mt-1">
              Click "Send WhatsApp" button to send your first message
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {messages.map((msg: any, index: number) => {
            const isText = msg.messageType === "text";
            const statusColor = msg.status === "sent" ? "green" : msg.status === "failed" ? "red" : "gray";

            return (
              <div key={msg.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center bg-${statusColor}-100 border-2 border-${statusColor}-200`}
                  >
                    <MessageCircle className={`w-5 h-5 text-${statusColor}-600`} />
                  </div>
                  {index < messages.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Send className={`w-4 h-4 text-${statusColor}-600`} />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {isText ? "Text Message" : `Media Message (${msg.mediaType})`}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            To: {msg.recipientNumber}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize bg-${statusColor}-100 text-${statusColor}-800 border-${statusColor}-200`}>
                            {msg.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">
                        {new Date(msg.sentAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {isText && msg.textContent && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.textContent}
                      </p>
                    </div>
                  )}

                  {!isText && msg.mediaUrl && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <File className="w-4 h-4 text-gray-400" />
                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View {msg.mediaType}
                        </a>
                      </div>
                      {msg.mediaCaption && (
                        <p className="text-gray-600 text-sm leading-relaxed mt-2">
                          {msg.mediaCaption}
                        </p>
                      )}
                    </div>
                  )}

                  {msg.sentByName && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          Sent by: {msg.sentByName}
                        </span>
                      </div>
                    </div>
                  )}

                  {msg.deviceNumber && (
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        Device: {msg.deviceNumber}
                      </span>
                    </div>
                  )}

                  <div className="mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(msg.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === "bookings") {
      if (bookings.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No bookings created for this customer yet</p>
            <p className="text-sm mt-1">
              Click "Create Booking" to create your first booking
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <EnhancedTable
            data={bookings}
            columns={bookingColumns}
            isLoading={bookingsLoading}
          />
        </div>
      );
    } else if (activeTab === "email") {
      if (emails.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No emails sent to this customer yet</p>
            <p className="text-sm mt-1">
              Click "Add Email" to send your first email
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {emails.map((email: any, index: number) => {
            const isDelivered = email.status === "sent";

            return (
              <div key={email.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isDelivered
                        ? "bg-green-100 border-green-200"
                        : "bg-orange-100 border-orange-200"
                    }`}
                  >
                    <Mail
                      className={`w-5 h-5 ${
                        isDelivered ? "text-green-600" : "text-orange-600"
                      }`}
                    />
                  </div>
                  {index < emails.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Send
                        className={`w-4 h-4 ${
                          isDelivered ? "text-green-600" : "text-orange-600"
                        }`}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {email.subject}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            To: {email.email}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              isDelivered
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-orange-100 text-orange-800 border-orange-200"
                            }`}
                          >
                            {email.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {new Date(email.sentAt).toLocaleDateString()}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(email.sentAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {email.body && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {email.body}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if (activeTab === "files") {
      return <FilesDocumentsTable customerId={customerId} />;
    }
    // else if (activeTab === "calls") {
    //   return <CallLogsSection customerId={parseInt(customerId)} />;
    // }
    else if (activeTab === "analytics") {
      return (
        <CustomerAnalytics
          customerId={customerId}
          customer={customer}
          bookings={bookings}
        />
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 bg-[#f1f4f9] p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 m-2">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout>
        <div className="flex-1 bg-[#f1f4f9] p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 m-2">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 mb-4">
                Customer not found
              </h1>
              <Link href="/customers">
                <Button>Back to Customers</Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const displayName =
    `${customer.firstName} ${customer.lastName}`.trim() || customer.email;

  return (
    <Layout>
      <div className="flex-1 bg-[#f1f4f9] p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 m-2 overflow-hidden">
          {/* Header with back button */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <Link
                href="/customers"
                className="bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200"
              >
                Customer
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">{displayName}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={customer.profilePicture || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">
                    {displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {displayName}
                  </h1>
                  <p className="text-gray-600">{customer.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Active Customer
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {customer.phone && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setIsZoomPhoneOpen(true)}
                    title="Open Zoom Phone"
                    data-testid="button-zoom-call-header"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call with Zoom
                  </Button>
                )}
                {customer.phone && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setIsWhatsAppDialogOpen(true)}
                    title="Send WhatsApp Message"
                    data-testid="button-send-whatsapp"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send WhatsApp
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex flex-col lg:flex-row h-[calc(100vh-300px)]">
            {/* Left Sidebar */}
            <div className="w-full lg:w-80 border-r border-gray-200 overflow-y-auto">
              {/* Customer Details */}
              <div className="p-4 border-b border-gray-200">
                <Collapsible
                  open={customerDetailsOpen}
                  onOpenChange={setCustomerDetailsOpen}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                    <span className="font-medium text-gray-900">
                      Customer Details
                    </span>
                    {customerDetailsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Phone</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">
                              {customer.phone || "+91 78981 64395"}
                            </span>
                            {customer.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-blue-50"
                                onClick={() => setIsZoomPhoneOpen(true)}
                                title="Open Zoom Phone"
                                aria-label="Open Zoom Phone"
                                data-testid="button-zoom-call"
                              >
                                <Phone className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email</span>
                          <span className="text-gray-900">
                            {customer.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address</span>
                          <span className="text-gray-900">
                            {customer.address || "Not provided"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Member Since</span>
                          <span className="text-gray-900">
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Status</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              customer.status === "active"
                                ? "bg-green-100 text-green-800"
                                : customer.status === "inactive"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {customer.status || "Active"}
                          </span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Total Bookings</span>
                          <span className="text-gray-900 font-medium">
                            {bookings?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Customer ID</span>
                          <span className="text-gray-900 font-mono text-xs">
                            #{customer.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <div className="flex items-center justify-between p-4">
                  <div className="flex overflow-x-auto">
                    {[
                      "notes",
                      "activity",
                      "email",
                      "call",
                      "messages",
                      "bookings",
                      // "calls",
                      "analytics",
                      "files",
                    ].map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          setActiveTab(item);
                          // Refetch data when tab is clicked
                          if (item === "notes") refetchNotes();
                          if (item === "activity") refetchActivities();
                          if (item === "email") refetchEmails();
                          if (item === "call") refetchCalls();
                          if (item === "messages") refetchMessages();
                          if (item === "bookings" || item === "analytics")
                            refetchBookings();
                        }}
                        className={`px-4 py-2 capitalize whitespace-nowrap text-sm md:text-base ${
                          activeTab === item
                            ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === "notes" && (
                      <Button
                        size="sm"
                        onClick={() => setIsNotesModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="button-add-note"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Note
                      </Button>
                    )}
                    {activeTab === "activity" && (
                      <Button
                        size="sm"
                        onClick={() => setIsActivityModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-add-activity"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Activity
                      </Button>
                    )}
                    {activeTab === "call" && (
                      <Button
                        size="sm"
                        onClick={() => setIsCallModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                        data-testid="button-add-call"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Call
                      </Button>
                    )}

                    {activeTab === "bookings" && (
                      <Button
                        size="sm"
                        onClick={() => setIsCreateBookingOpen(true)}
                        className="bg-cyan-600 hover:bg-cyan-700"
                        data-testid="button-create-booking"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create Booking
                      </Button>
                    )}
                    {activeTab === "email" && (
                      <Button
                        size="sm"
                        onClick={() => setIsEmailModalOpen(true)}
                        className="bg-orange-600 hover:bg-orange-700"
                        data-testid="button-add-email"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Send Email
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CustomerNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setEditableItem(null);
        }}
        onSave={handleNoteSave}
        editableNote={editableItem}
        isLoading={createNoteMutation.isPending}
      />

      <CustomerActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setEditableItem(null);
        }}
        onSave={handleActivitySave}
        editableActivity={editableItem}
        isLoading={createActivityMutation.isPending}
      />

      <CustomerCallModal
        isOpen={isCallModalOpen}
        onClose={() => {
          setIsCallModalOpen(false);
          setEditableItem(null);
        }}
        onSave={handleCallSave}
        editableCall={editableItem}
        isLoading={createCallMutation.isPending}
      />

      <CustomerEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setEditableItem(null);
        }}
        onSave={handleEmailSave}
        editableEmail={editableItem}
        customerEmail={customer.email}
        isLoading={createEmailMutation.isPending}
      />

      {/* Booking Modals */}
      <Dialog open={isCreateBookingOpen} onOpenChange={setIsCreateBookingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
          </DialogHeader>
          <TravelBookingForm
            tenantId={tenant?.id?.toString() || ""}
            onSubmit={handleBookingFormSubmit}
            onCancel={() => setIsCreateBookingOpen(false)}
            isLoading={createBookingMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewBookingOpen} onOpenChange={setIsViewBookingOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Booking Number
                  </label>
                  <p className="mt-1">
                    {selectedBooking.bookingNumber ||
                      `BK-${selectedBooking.id}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Travel Date
                  </label>
                  <p className="mt-1">
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
                  <p className="mt-1">{selectedBooking.travelers || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Total Amount
                  </label>
                  <p className="mt-1">
                    ₹
                    {selectedBooking.totalAmount
                      ? parseFloat(selectedBooking.totalAmount).toLocaleString()
                      : "0"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <p className="mt-1">
                    <Badge
                      className={
                        getStatusBadge(selectedBooking.status, "booking").color
                      }
                    >
                      {getStatusBadge(selectedBooking.status, "booking").label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Payment Status
                  </label>
                  <p className="mt-1">
                    <Badge
                      className={
                        getStatusBadge(selectedBooking.paymentStatus, "payment")
                          .color
                      }
                    >
                      {
                        getStatusBadge(selectedBooking.paymentStatus, "payment")
                          .label
                      }
                    </Badge>
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

      <Dialog open={isEditBookingOpen} onOpenChange={setIsEditBookingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          <TravelBookingForm
            booking={editingBooking}
            tenantId={tenant?.id?.toString() || ""}
            onSubmit={handleBookingFormSubmit}
            onCancel={() => setIsEditBookingOpen(false)}
            isLoading={createBookingMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Zoom Phone Smart Embed */}
      <ZoomPhoneEmbed
        isOpen={isZoomPhoneOpen}
        onClose={() => setIsZoomPhoneOpen(false)}
        customerPhone={customer.phone}
        customerName={displayName}
      />

      {/* WhatsApp Message Dialog */}
      <WhatsAppMessageDialog
        open={isWhatsAppDialogOpen}
        onOpenChange={setIsWhatsAppDialogOpen}
        customerPhone={customer.phone}
        customerName={displayName}
        customerId={parseInt(customerId || "0")}
      />

      {/* Activity Data Popup */}
      <ActivityDataPopup
        isOpen={activityPopupOpen}
        onClose={() => {
          setActivityPopupOpen(false);
          setSelectedActivityTable({ tableName: null, tableId: null });
        }}
        tableName={selectedActivityTable.tableName}
        tableId={selectedActivityTable.tableId}
        tenantId={tenant?.id}
      />
    </Layout>
  );
}

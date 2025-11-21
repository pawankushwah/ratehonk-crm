import React, { useState, useEffect } from "react";
import { flushSync } from "react-dom";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ClipboardList,
  Loader2,
  GripVertical,
  Trash2,
  X,
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

// Consulation Form Types and Constants
type ConsulationFieldType =
  | "title"
  | "text"
  | "price"
  | "textarea"
  | "phone"
  | "image"
  | "file";

interface ConsulationField {
  id: string;
  label: string;
  type: ConsulationFieldType;
  required?: boolean;
  defaultValue?: string; // Default value for the field
}

const DEFAULT_CONSULATION_FIELDS: ConsulationField[] = [
  {
    id: "consulation-title",
    label: "Consulation Title",
    type: "title",
    required: true,
  },
  {
    id: "consulation-price",
    label: "Consulation Price",
    type: "price",
  },
  {
    id: "consulation-phone",
    label: "Phone Number",
    type: "phone",
  },
  {
    id: "consulation-description",
    label: "Additional Notes",
    type: "textarea",
  },
];

const FIELD_TYPE_LABELS: Record<ConsulationFieldType, string> = {
  title: "Title (Large Text)",
  text: "Short Text",
  price: "Price",
  textarea: "Text Area",
  phone: "Phone Number",
  image: "Image Upload",
  file: "File Upload (PDF & Images)",
};

const createDefaultConsulationFields = (): ConsulationField[] =>
  DEFAULT_CONSULATION_FIELDS.map((field) => ({ ...field }));

const generateFieldId = () =>
  `consulation-${Math.random().toString(36).substring(2, 10)}`;

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
  const [editableItem, setEditableItem] = useState<any>(null);
  const [isZoomPhoneOpen, setIsZoomPhoneOpen] = useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [isSendingConsulationForm, setIsSendingConsulationForm] =
    useState(false);
  const [showSendFormOptions, setShowSendFormOptions] = useState(false);
  const [selectedFormType, setSelectedFormType] = useState<'consulation' | 'payment' | 'both' | null>(null);
  const [showDeliveryMethodOptions, setShowDeliveryMethodOptions] = useState(false);
  const [isConsulationFormOpen, setIsConsulationFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [consulationDefaultValues, setConsulationDefaultValues] = useState<Record<string, string>>({});
  const [paymentDefaultValues, setPaymentDefaultValues] = useState<Record<string, string>>({});
  const [consulationFields, setConsulationFields] = useState<
    ConsulationField[]
  >(() => createDefaultConsulationFields());
  const [paymentFields, setPaymentFields] = useState<
    ConsulationField[]
  >(() => createDefaultConsulationFields());
  const [hasLoadedConsulationTemplate, setHasLoadedConsulationTemplate] =
    useState(false);
  const [hasLoadedPaymentTemplate, setHasLoadedPaymentTemplate] =
    useState(false);
  const consulationStorageKey = tenant?.id
    ? `consulation-form-template-${tenant.id}`
    : null;
  const paymentStorageKey = tenant?.id
    ? `payment-form-template-${tenant.id}`
    : null;
  const [selectedConsulationSubmissionId, setSelectedConsulationSubmissionId] = useState<number | null>(null);
  const [selectedPaymentSubmissionId, setSelectedPaymentSubmissionId] = useState<number | null>(null);
  const [viewingSubmissionImage, setViewingSubmissionImage] = useState<{ url: string; name: string } | null>(null);
  const [isNavigatingToConsulationForm, setIsNavigatingToConsulationForm] = useState(false);

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
      12: "Consulation Form Submitted",
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

    const analytics: any = customerAnalytics || {};

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
                        {paymentStatusData.map(
                          (
                            entry: { name: string; value: number; color: string },
                            index: number,
                          ) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ),
                        )}
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

  // Prefetch consulation form submissions immediately when customer loads
  useEffect(() => {
    if (customerId && tenant?.id && !isLoading) {
      // Prefetch both consulation and payment form submissions in the background for instant navigation
      queryClient.prefetchQuery({
        queryKey: ["consulation-form-submissions", customerId, tenant.id, "consulation"],
        queryFn: async () => {
          const token = auth.getToken();
          const response = await fetch(
            `/api/tenants/${tenant.id}/customers/${customerId}/consulation-form-submissions?formType=consulation`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (!response.ok) throw new Error("Failed to fetch consulation form submissions");
          const data = await response.json();
          return data.submissions || [];
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      });
      queryClient.prefetchQuery({
        queryKey: ["consulation-form-submissions", customerId, tenant.id, "payment"],
        queryFn: async () => {
          const token = auth.getToken();
          const response = await fetch(
            `/api/tenants/${tenant.id}/customers/${customerId}/consulation-form-submissions?formType=payment`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (!response.ok) throw new Error("Failed to fetch payment form submissions");
          const data = await response.json();
          return data.submissions || [];
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      });
    }
  }, [customerId, tenant?.id, isLoading, queryClient]);

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

  // Fetch consulation form submissions from API
  // Always enabled to pre-load data for instant navigation
  const {
    data: consulationSubmissions = [],
    isLoading: isLoadingConsulationSubmissions,
    refetch: refetchConsulationSubmissions,
  } = useQuery({
    queryKey: ["consulation-form-submissions", customerId, tenant?.id, "consulation"],
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/tenants/${tenant?.id}/customers/${customerId}/consulation-form-submissions?formType=consulation`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch consulation form submissions");
      const data = await response.json();
      return data.submissions || [];
    },
    // Always enabled when we have customerId and tenantId for instant navigation
    enabled: !!customerId && !!tenant?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes for better performance
  });

  // Fetch payment form submissions from API
  // Always enabled to pre-load data for instant navigation
  const {
    data: paymentSubmissions = [],
    isLoading: isLoadingPaymentSubmissions,
    refetch: refetchPaymentSubmissions,
  } = useQuery({
    queryKey: ["consulation-form-submissions", customerId, tenant?.id, "payment"],
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/tenants/${tenant?.id}/customers/${customerId}/consulation-form-submissions?formType=payment`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch payment form submissions");
      const data = await response.json();
      return data.submissions || [];
    },
    // Always enabled when we have customerId and tenantId for instant navigation
    enabled: !!customerId && !!tenant?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes for better performance
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

  // Load consulation form template
  useEffect(() => {
    if (
      !tenant?.id ||
      hasLoadedConsulationTemplate ||
      typeof window === "undefined"
    ) {
      return;
    }

    const loadConsulationFields = async () => {
      try {
        // First, try to load from database
        try {
          const response = await apiRequest(
            "GET",
            `/api/tenants/${tenant.id}/consulation-form?formType=consulation`,
            {}
          );
          const data = await response.json();
          if (data?.fields && Array.isArray(data.fields) && data.fields.length > 0) {
            setConsulationFields(data.fields);
            // Load default values if available
            if (data?.defaultValues && typeof data.defaultValues === 'object') {
              setConsulationDefaultValues(data.defaultValues);
              console.log("📋 Loaded default values:", data.defaultValues);
            } else {
              setConsulationDefaultValues({});
            }
            // Also save to localStorage as backup
            if (consulationStorageKey) {
              localStorage.setItem(
                consulationStorageKey,
                JSON.stringify(data.fields)
              );
            }
            setHasLoadedConsulationTemplate(true);
            return;
          }
        } catch (dbError) {
          console.log("No form template in database, checking localStorage");
        }

        // Fallback to localStorage
        if (consulationStorageKey) {
          const stored = localStorage.getItem(consulationStorageKey);
          if (stored) {
            setConsulationFields(JSON.parse(stored) as ConsulationField[]);
          } else {
            setConsulationFields(createDefaultConsulationFields());
          }
        } else {
          setConsulationFields(createDefaultConsulationFields());
        }
      } catch (error) {
        console.warn("Failed to load consulation form template:", error);
        setConsulationFields(createDefaultConsulationFields());
      } finally {
        setHasLoadedConsulationTemplate(true);
      }
    };

    loadConsulationFields();
  }, [tenant?.id, hasLoadedConsulationTemplate, consulationStorageKey]);

  // Load payment form template
  useEffect(() => {
    if (
      !tenant?.id ||
      hasLoadedPaymentTemplate ||
      typeof window === "undefined"
    ) {
      return;
    }

    const loadPaymentFields = async () => {
      try {
        // First, try to load from database
        try {
          const response = await apiRequest(
            "GET",
            `/api/tenants/${tenant.id}/consulation-form?formType=payment`,
            {}
          );
          const data = await response.json();
          if (data?.fields && Array.isArray(data.fields) && data.fields.length > 0) {
            setPaymentFields(data.fields);
            // Load default values if available
            if (data?.defaultValues && typeof data.defaultValues === 'object') {
              setPaymentDefaultValues(data.defaultValues);
              console.log("📋 Loaded payment form default values:", data.defaultValues);
            } else {
              setPaymentDefaultValues({});
            }
            // Also save to localStorage as backup
            if (paymentStorageKey) {
              localStorage.setItem(
                paymentStorageKey,
                JSON.stringify(data.fields)
              );
            }
            setHasLoadedPaymentTemplate(true);
            return;
          }
        } catch (dbError) {
          console.log("No payment form template in database, checking localStorage");
        }

        // Fallback to localStorage
        if (paymentStorageKey) {
          const stored = localStorage.getItem(paymentStorageKey);
          if (stored) {
            setPaymentFields(JSON.parse(stored) as ConsulationField[]);
          } else {
            setPaymentFields(createDefaultConsulationFields());
          }
        } else {
          setPaymentFields(createDefaultConsulationFields());
        }
      } catch (error) {
        console.warn("Failed to load payment form template:", error);
        setPaymentFields(createDefaultConsulationFields());
      } finally {
        setHasLoadedPaymentTemplate(true);
      }
    };

    loadPaymentFields();
  }, [tenant?.id, hasLoadedPaymentTemplate, paymentStorageKey]);

  // Save consulation fields to localStorage when they change
  useEffect(() => {
    if (
      !consulationStorageKey ||
      !hasLoadedConsulationTemplate ||
      typeof window === "undefined"
    ) {
      return;
    }

    localStorage.setItem(
      consulationStorageKey,
      JSON.stringify(consulationFields),
    );
  }, [consulationFields, consulationStorageKey, hasLoadedConsulationTemplate]);

  // Save payment fields to localStorage when they change
  useEffect(() => {
    if (
      !paymentStorageKey ||
      !hasLoadedPaymentTemplate ||
      typeof window === "undefined"
    ) {
      return;
    }

    localStorage.setItem(
      paymentStorageKey,
      JSON.stringify(paymentFields),
    );
  }, [paymentFields, paymentStorageKey, hasLoadedPaymentTemplate]);

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
      // Also invalidate customer activities to show the new note activity
      queryClient.invalidateQueries({ queryKey: ["customer-activities", customerId, tenant?.id] });
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
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Attachment:</span>
                      </div>
                      {(() => {
                        const attachmentPath = note.attachment;
                        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachmentPath);
                        const fileName = attachmentPath.split('/').pop() || attachmentPath;
                        const attachmentUrl = attachmentPath.startsWith('http') 
                          ? attachmentPath 
                          : attachmentPath.startsWith('/') 
                            ? `${window.location.origin}${attachmentPath}`
                            : `${window.location.origin}/${attachmentPath}`;
                        
                        return (
                          <div className="ml-6">
                            {isImage ? (
                              <div className="space-y-2">
                                <img
                                  src={attachmentUrl}
                                  alt={fileName}
                                  className="max-w-xs max-h-48 rounded-lg border border-gray-200 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(attachmentUrl, '_blank')}
                                  onError={(e) => {
                                    // If image fails to load, show file link instead
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                      parent.innerHTML = `
                                        <a href="${attachmentUrl}" target="_blank" rel="noopener noreferrer" class="text-sm text-blue-600 hover:underline">
                                          ${fileName}
                                        </a>
                                      `;
                                    }
                                  }}
                                />
                                <a
                                  href={attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline block"
                                >
                                  {fileName}
                                </a>
                              </div>
                            ) : (
                              <a
                                href={attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <File className="w-4 h-4" />
                                {fileName}
                              </a>
                            )}
                          </div>
                        );
                      })()}
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
                    (activity.activityTableId && activity.activityTableName) ||
                    activity.activityType === 12
                      ? "cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                      : ""
                  }`}
                  style={{
                    cursor: (activity.activityTableId && activity.activityTableName) ||
                      activity.activityType === 12
                      ? "pointer"
                      : "default"
                  }}
                  onClick={(e) => {
                    // Prevent default and stop propagation
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Guard against rapid clicks
                    if (isNavigatingToConsulationForm) {
                      return;
                    }
                    
                    // Ensure activityTableId is a number for proper comparison
                    const activityTableId = activity.activityTableId 
                      ? (typeof activity.activityTableId === 'string' 
                          ? parseInt(activity.activityTableId, 10) 
                          : activity.activityTableId)
                      : null;
                    
                    // Check if this is a form submission activity (consulation or payment)
                    const isFormSubmissionActivity = 
                      activity.activityType === 12 ||
                      (activity.activityTableName === "consulation_form_submissions" && activityTableId);
                    
                    if (isFormSubmissionActivity) {
                      setIsNavigatingToConsulationForm(true);
                      
                      // Get submission ID - use activityTableId if available
                      let submissionId = activityTableId;
                      let isPaymentForm = false;
                      
                      // If no submission ID, try to find the most recent submission matching the activity date
                      if (!submissionId) {
                        // Check both consulation and payment submissions
                        const allConsulationSubs = consulationSubmissions.length > 0 
                          ? consulationSubmissions 
                          : (queryClient.getQueryData(["consulation-form-submissions", customerId, tenant?.id, "consulation"]) as any[]) || [];
                        const allPaymentSubs = paymentSubmissions.length > 0 
                          ? paymentSubmissions 
                          : (queryClient.getQueryData(["consulation-form-submissions", customerId, tenant?.id, "payment"]) as any[]) || [];
                        const allSubmissions = [...allConsulationSubs, ...allPaymentSubs];
                        
                        if (allSubmissions.length > 0) {
                          const activityDate = new Date(activity.activityDate);
                          const closestSubmission = allSubmissions.reduce((closest: any, current: any) => {
                            const currentDate = new Date(current.createdAt);
                            const closestDate = closest ? new Date(closest.createdAt) : null;
                            const currentDiff = Math.abs(currentDate.getTime() - activityDate.getTime());
                            const closestDiff = closestDate ? Math.abs(closestDate.getTime() - activityDate.getTime()) : Infinity;
                            return currentDiff < closestDiff ? current : closest;
                          });
                          if (closestSubmission) {
                            submissionId = closestSubmission.id;
                            // Check if it's a payment form by checking formType or by checking which array it came from
                            isPaymentForm = closestSubmission.formType === 'payment' || 
                                           allPaymentSubs.some((s: any) => s.id === closestSubmission.id);
                          }
                        }
                      } else {
                        // Check if the submission with this ID is a payment form
                        const paymentSub = paymentSubmissions.find((s: any) => s.id === submissionId);
                        const consulationSub = consulationSubmissions.find((s: any) => s.id === submissionId);
                        if (paymentSub && !consulationSub) {
                          isPaymentForm = true;
                        } else if (paymentSub || consulationSub) {
                          // If found in both or need to check formType
                          isPaymentForm = (paymentSub || consulationSub)?.formType === 'payment';
                        }
                      }
                      
                      // Use flushSync to force immediate DOM update for instant navigation
                      flushSync(() => {
                        if (isPaymentForm) {
                          // Set the selected payment submission ID FIRST
                          setSelectedPaymentSubmissionId(submissionId);
                          // Then switch to payment-form tab
                          setActiveTab("payment-form");
                        } else {
                          // Set the selected consulation submission ID FIRST
                          setSelectedConsulationSubmissionId(submissionId);
                          // Then switch to consulation-form tab
                          setActiveTab("consulation-form");
                        }
                      });
                      
                      // Reset navigation guard after a short delay
                      setTimeout(() => {
                        setIsNavigatingToConsulationForm(false);
                      }, 300);
                    } else if (activityTableId && activity.activityTableName) {
                      // For other activities, open the popup as before
                      setSelectedActivityTable({
                        tableName: activity.activityTableName,
                        tableId: activityTableId,
                      });
                      setActivityPopupOpen(true);
                    }
                  }}
                >
                  <div 
                    className="flex items-start justify-between mb-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getActivityStatusColor(activity.activityStatus)}`}
                      >
                        {getActivityStatusLabel(activity.activityStatus)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {getActivityTypeLabel(activity.activityType)}
                      </span>
                      {((activity.activityTableId && activity.activityTableName) ||
                        activity.activityType === 12) && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {activity.activityTableName === "consulation_form_submissions" || activity.activityType === 12
                            ? "View Submission" 
                            : "View Details"}
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
      return <FilesDocumentsTable customerId={safeCustomerId} />;
    } else if (activeTab === "consulation-form") {
      if (isLoadingConsulationSubmissions) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        );
      }

      // Filter submissions if a specific one is selected
      const displayedSubmissions = selectedConsulationSubmissionId
        ? consulationSubmissions.filter((sub: any) => {
            // Ensure both values are numbers for comparison
            const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : sub.id;
            const selectedId = typeof selectedConsulationSubmissionId === 'string' 
              ? parseInt(selectedConsulationSubmissionId, 10) 
              : selectedConsulationSubmissionId;
            const matches = subId === selectedId;
            if (!matches && selectedConsulationSubmissionId) {
              console.log("🔍 Submission filter mismatch:", {
                subId,
                subIdType: typeof subId,
                selectedId,
                selectedIdType: typeof selectedId,
                allSubIds: consulationSubmissions.map((s: any) => s.id),
              });
            }
            return matches;
          })
        : consulationSubmissions;

      if (displayedSubmissions.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>
              {selectedConsulationSubmissionId
                ? "Consulation form submission not found"
                : "No consulation form submissions found for this customer"}
            </p>
            {selectedConsulationSubmissionId && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setSelectedConsulationSubmissionId(null)}
              >
                Show All Submissions
              </Button>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {selectedConsulationSubmissionId && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-600">
                  Showing specific submission
                </Badge>
                <span className="text-sm text-gray-600">
                  Submission ID: {selectedConsulationSubmissionId}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedConsulationSubmissionId(null)}
              >
                Show All Submissions
              </Button>
            </div>
          )}
          {displayedSubmissions.map((submission: any) => {
            const formFields = submission.formFields || [];
            const responses = submission.responses || {};

            return (
              <Card key={submission.id} className="border border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Consulation Form Submission
                    </CardTitle>
                    <div className="text-sm text-gray-500">
                      <CalendarDays className="w-4 h-4 inline mr-1" />
                      {new Date(submission.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {formFields.map((field: any) => {
                      const responseValue = responses[field.id] || "";
                      if (!responseValue) return null;

                      return (
                        <div key={field.id} className="border-b border-gray-100 pb-4 last:border-0">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <div className="mt-1">
                            {field.type === "textarea" ? (
                              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                                {responseValue}
                              </p>
                            ) : field.type === "image" ? (
                              <div className="mt-2">
                                {(() => {
                                  // Parse comma-separated image URLs
                                  const imageUrls = responseValue
                                    .split(",")
                                    .map((url: string) => url.trim())
                                    .filter((url: string) => url && url.length > 0);
                                  
                                  if (imageUrls.length === 0) {
                                    return (
                                      <p className="text-sm text-gray-500 italic">No images uploaded</p>
                                    );
                                  }

                                  return (
                                    <div className="space-y-3">
                                      <div className="text-sm text-gray-600 font-medium">
                                        {imageUrls.length} {imageUrls.length === 1 ? "Image" : "Images"}:
                                      </div>
                                      <div className="flex flex-wrap gap-3">
                                        {imageUrls.map((imageUrl: string, index: number) => {
                                          // Extract filename from URL
                                          const urlParts = imageUrl.split("/");
                                          const filename = urlParts[urlParts.length - 1] || `Image ${index + 1}`;
                                          
                                          // Normalize URL for display
                                          const normalizedUrl = imageUrl.startsWith('http') || imageUrl.startsWith('https')
                                            ? imageUrl
                                            : imageUrl.startsWith('/')
                                              ? imageUrl
                                              : `/${imageUrl}`;

                                          return (
                                            <div
                                              key={index}
                                              className="relative group cursor-pointer"
                                              onClick={() => setViewingSubmissionImage({ url: normalizedUrl, name: filename })}
                                            >
                                              <div className="relative">
                                                <img
                                                  src={normalizedUrl}
                                                  alt={`${field.label} - Image ${index + 1}`}
                                                  className="w-32 h-32 object-cover rounded-md border-2 border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                                                  onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "/placeholder-image.png";
                                                  }}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-md flex items-center justify-center">
                                                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                              </div>
                                              <p className="text-xs text-gray-600 mt-1 text-center max-w-[128px] truncate">
                                                Image {index + 1}: {filename.length > 20 ? filename.substring(0, 20) + "..." : filename}
                                              </p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : field.type === "file" ? (
                              <div className="mt-2">
                                {(() => {
                                  // Parse comma-separated file URLs
                                  const fileUrls = responseValue
                                    .split(",")
                                    .map((url: string) => url.trim())
                                    .filter((url: string) => url && url.length > 0);
                                  
                                  if (fileUrls.length === 0) {
                                    return (
                                      <p className="text-sm text-gray-500 italic">No files uploaded</p>
                                    );
                                  }

                                  return (
                                    <div className="space-y-3">
                                      <div className="text-sm text-gray-600 font-medium">
                                        {fileUrls.length} {fileUrls.length === 1 ? "File" : "Files"}:
                                      </div>
                                      <div className="flex flex-wrap gap-3">
                                        {fileUrls.map((fileUrl: string, index: number) => {
                                          // Extract filename from URL
                                          const urlParts = fileUrl.split("/");
                                          const filename = urlParts[urlParts.length - 1] || `File ${index + 1}`;
                                          const isPdf = filename.toLowerCase().endsWith('.pdf');
                                          
                                          // Normalize URL for display
                                          const normalizedUrl = fileUrl.startsWith('http') || fileUrl.startsWith('https')
                                            ? fileUrl
                                            : fileUrl.startsWith('/')
                                              ? fileUrl
                                              : `/${fileUrl}`;

                                          return (
                                            <div
                                              key={index}
                                              className="relative group cursor-pointer"
                                              onClick={() => setViewingSubmissionImage({ url: normalizedUrl, name: filename })}
                                            >
                                              <div className="relative">
                                                {isPdf ? (
                                                  <div className="w-32 h-32 bg-red-50 border-2 border-red-200 rounded-md hover:border-red-400 transition-all shadow-sm hover:shadow-md flex items-center justify-center">
                                                    <div className="text-center p-2">
                                                      <FileText className="h-12 w-12 text-red-600 mx-auto mb-1" />
                                                      <p className="text-xs text-red-700 font-medium">PDF</p>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <img
                                                    src={normalizedUrl}
                                                    alt={`${field.label} - ${isPdf ? 'PDF' : 'Image'} ${index + 1}`}
                                                    className="w-32 h-32 object-cover rounded-md border-2 border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                                                    onError={(e) => {
                                                      (e.target as HTMLImageElement).src = "/placeholder-image.png";
                                                    }}
                                                  />
                                                )}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-md flex items-center justify-center">
                                                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                              </div>
                                              <p className="text-xs text-gray-600 mt-1 text-center max-w-[128px] truncate">
                                                {isPdf ? 'PDF' : 'Image'} {index + 1}: {filename.length > 20 ? filename.substring(0, 20) + "..." : filename}
                                              </p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                                {responseValue}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      );
    } else if (activeTab === "payment-form") {
      if (isLoadingPaymentSubmissions) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        );
      }

      // Filter submissions if a specific one is selected
      const displayedSubmissions = selectedPaymentSubmissionId
        ? paymentSubmissions.filter((sub: any) => {
            // Ensure both values are numbers for comparison
            const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : sub.id;
            const selectedId = typeof selectedPaymentSubmissionId === 'string' 
              ? parseInt(selectedPaymentSubmissionId, 10) 
              : selectedPaymentSubmissionId;
            const matches = subId === selectedId;
            if (!matches && selectedPaymentSubmissionId) {
              console.log("🔍 Payment submission filter mismatch:", {
                subId,
                subIdType: typeof subId,
                selectedId,
                selectedIdType: typeof selectedId,
                allSubIds: paymentSubmissions.map((s: any) => s.id),
              });
            }
            return matches;
          })
        : paymentSubmissions;

      if (displayedSubmissions.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>
              {selectedPaymentSubmissionId
                ? "Payment form submission not found"
                : "No payment form submissions found for this customer"}
            </p>
            {selectedPaymentSubmissionId && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setSelectedPaymentSubmissionId(null)}
              >
                Show All Submissions
              </Button>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {selectedPaymentSubmissionId && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-600">
                  Showing specific submission
                </Badge>
                <span className="text-sm text-gray-600">
                  Submission ID: {selectedPaymentSubmissionId}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPaymentSubmissionId(null)}
              >
                Show All Submissions
              </Button>
            </div>
          )}
          {displayedSubmissions.map((submission: any) => {
            const formFields = submission.formFields || [];
            const responses = submission.responses || {};

            return (
              <Card key={submission.id} className="border border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Payment Form Submission
                    </CardTitle>
                    <div className="text-sm text-gray-500">
                      <CalendarDays className="w-4 h-4 inline mr-1" />
                      {new Date(submission.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {formFields.map((field: any) => {
                      const responseValue = responses[field.id] || "";
                      if (!responseValue) return null;

                      return (
                        <div key={field.id} className="border-b border-gray-100 pb-4 last:border-0">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <div className="mt-1">
                            {field.type === "textarea" ? (
                              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                                {responseValue}
                              </p>
                            ) : field.type === "image" ? (
                              <div className="mt-2">
                                {(() => {
                                  // Parse comma-separated image URLs
                                  const imageUrls = responseValue
                                    .split(",")
                                    .map((url: string) => url.trim())
                                    .filter((url: string) => url && url.length > 0);
                                  
                                  if (imageUrls.length === 0) {
                                    return (
                                      <p className="text-sm text-gray-500 italic">No images uploaded</p>
                                    );
                                  }

                                  return (
                                    <div className="space-y-3">
                                      <div className="text-sm text-gray-600 font-medium">
                                        {imageUrls.length} {imageUrls.length === 1 ? "Image" : "Images"}:
                                      </div>
                                      <div className="flex flex-wrap gap-3">
                                        {imageUrls.map((imageUrl: string, index: number) => {
                                          // Extract filename from URL
                                          const urlParts = imageUrl.split("/");
                                          const filename = urlParts[urlParts.length - 1] || `Image ${index + 1}`;
                                          
                                          // Normalize URL for display
                                          const normalizedUrl = imageUrl.startsWith('http') || imageUrl.startsWith('https')
                                            ? imageUrl
                                            : imageUrl.startsWith('/')
                                              ? imageUrl
                                              : `/${imageUrl}`;

                                          return (
                                            <div
                                              key={index}
                                              className="relative group cursor-pointer"
                                              onClick={() => setViewingSubmissionImage({ url: normalizedUrl, name: filename })}
                                            >
                                              <div className="relative">
                                                <img
                                                  src={normalizedUrl}
                                                  alt={`${field.label} - Image ${index + 1}`}
                                                  className="w-32 h-32 object-cover rounded-md border-2 border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                                                  onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "/placeholder-image.png";
                                                  }}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-md flex items-center justify-center">
                                                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                              </div>
                                              <p className="text-xs text-gray-600 mt-1 text-center max-w-[128px] truncate">
                                                Image {index + 1}: {filename.length > 20 ? filename.substring(0, 20) + "..." : filename}
                                              </p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : field.type === "file" ? (
                              <div className="mt-2">
                                {(() => {
                                  // Parse comma-separated file URLs
                                  const fileUrls = responseValue
                                    .split(",")
                                    .map((url: string) => url.trim())
                                    .filter((url: string) => url && url.length > 0);
                                  
                                  if (fileUrls.length === 0) {
                                    return (
                                      <p className="text-sm text-gray-500 italic">No files uploaded</p>
                                    );
                                  }

                                  return (
                                    <div className="space-y-3">
                                      <div className="text-sm text-gray-600 font-medium">
                                        {fileUrls.length} {fileUrls.length === 1 ? "File" : "Files"}:
                                      </div>
                                      <div className="flex flex-wrap gap-3">
                                        {fileUrls.map((fileUrl: string, index: number) => {
                                          // Extract filename from URL
                                          const urlParts = fileUrl.split("/");
                                          const filename = urlParts[urlParts.length - 1] || `File ${index + 1}`;
                                          const isPdf = filename.toLowerCase().endsWith('.pdf');
                                          
                                          // Normalize URL for display
                                          const normalizedUrl = fileUrl.startsWith('http') || fileUrl.startsWith('https')
                                            ? fileUrl
                                            : fileUrl.startsWith('/')
                                              ? fileUrl
                                              : `/${fileUrl}`;

                                          return (
                                            <div
                                              key={index}
                                              className="relative group cursor-pointer"
                                              onClick={() => setViewingSubmissionImage({ url: normalizedUrl, name: filename })}
                                            >
                                              <div className="relative">
                                                {isPdf ? (
                                                  <div className="w-32 h-32 bg-red-50 border-2 border-red-200 rounded-md hover:border-red-400 transition-all shadow-sm hover:shadow-md flex items-center justify-center">
                                                    <div className="text-center p-2">
                                                      <FileText className="h-12 w-12 text-red-600 mx-auto mb-1" />
                                                      <p className="text-xs text-red-700 font-medium">PDF</p>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <img
                                                    src={normalizedUrl}
                                                    alt={`${field.label} - ${isPdf ? 'PDF' : 'Image'} ${index + 1}`}
                                                    className="w-32 h-32 object-cover rounded-md border-2 border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                                                    onError={(e) => {
                                                      (e.target as HTMLImageElement).src = "/placeholder-image.png";
                                                    }}
                                                  />
                                                )}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-md flex items-center justify-center">
                                                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                              </div>
                                              <p className="text-xs text-gray-600 mt-1 text-center max-w-[128px] truncate">
                                                {isPdf ? 'PDF' : 'Image'} {index + 1}: {filename.length > 20 ? filename.substring(0, 20) + "..." : filename}
                                              </p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                                {responseValue}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      );
    }
    // else if (activeTab === "calls") {
    //   return <CallLogsSection customerId={parseInt(customerId)} />;
    // }
    else if (activeTab === "analytics") {
      return (
        <CustomerAnalytics
          customerId={safeCustomerId}
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
  const safeCustomerId = customerId ?? "";
  const canSendConsulationForm = Boolean(customer.email || customer.phone);
  const canSendEmail = Boolean(customer.email);
  const canSendWhatsApp = Boolean(customer.phone);
  
  const handleSendForm = async (formType: 'consulation' | 'payment' | 'both', method: 'email' | 'whatsapp' | 'both') => {
    if (!tenant?.id || !customerId) {
      toast({
        title: "Unable to send form",
        description: "Missing tenant or customer information.",
        variant: "destructive",
      });
      return;
    }

    // Validate method availability
    if (method === 'email' && !canSendEmail) {
      toast({
        title: "Cannot send email",
        description: "Customer does not have an email address.",
        variant: "destructive",
      });
      return;
    }
    if (method === 'whatsapp' && !canSendWhatsApp) {
      toast({
        title: "Cannot send WhatsApp",
        description: "Customer does not have a phone number.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSendingConsulationForm(true);
      setShowDeliveryMethodOptions(false);
      setShowSendFormOptions(false);
      setSelectedFormType(null);
      
      // Send forms based on formType
      const formsToSend: ('consulation' | 'payment')[] = 
        formType === 'both' ? ['consulation', 'payment'] : [formType];
      
      const results: { formType: string; emailSent: boolean; whatsappSent: boolean }[] = [];
      
      for (const form of formsToSend) {
        const response: any = await apiRequest(
          "POST",
          `/api/tenants/${tenant.id}/customers/${customerId}/send-consulation-form`,
          { method, formType: form },
        );

        results.push({
          formType: form,
          emailSent: response?.sent?.email || false,
          whatsappSent: response?.sent?.whatsapp || false,
        });
      }

      const allEmailSent = results.every(r => r.emailSent);
      const allWhatsappSent = results.every(r => r.whatsappSent);
      const formNames = formsToSend.map(f => f === 'consulation' ? 'Consulation' : 'Payment').join(' & ');

      toast({
        title: `${formNames} form${formsToSend.length > 1 ? 's' : ''} sent`,
        description: [
          allEmailSent ? "Email sent" : null,
          allWhatsappSent ? "WhatsApp sent" : null,
        ]
          .filter(Boolean)
          .join(" • ") || "Form link delivered.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send form",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingConsulationForm(false);
    }
  };

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
                      .map((n: string) => n[0])
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConsulationFormOpen(true)}
                  className="bg-white"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Set Consulation Form
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaymentFormOpen(true)}
                  className="bg-white"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Set Payment Form
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={() => setShowSendFormOptions(true)}
                  disabled={isSendingConsulationForm || !canSendConsulationForm}
                  title={
                    canSendConsulationForm
                      ? "Send form via email, WhatsApp, or both"
                      : "Customer needs an email or phone number"
                  }
                >
                  {isSendingConsulationForm ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ClipboardList className="h-4 w-4 mr-2" />
                  )}
                  Send Form
                </Button>
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
                      "consulation-form",
                      "payment-form",
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
                          if (item === "consulation-form") {
                            // Clear selected submission when manually switching to consulation-form tab
                            setSelectedConsulationSubmissionId(null);
                            refetchConsulationSubmissions();
                          }
                          if (item === "payment-form") {
                            // Clear selected submission when manually switching to payment-form tab
                            setSelectedPaymentSubmissionId(null);
                            refetchPaymentSubmissions();
                          }
                        }}
                        className={`px-4 py-2 capitalize whitespace-nowrap text-sm md:text-base ${
                          activeTab === item
                            ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {item.replace("-", " ")}
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
        tenantId={tenant?.id}
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

      {/* Send Form Options Dialog - Step 1: Choose Form Type */}
      <Dialog open={showSendFormOptions} onOpenChange={(open) => {
        setShowSendFormOptions(open);
        if (!open) {
          setSelectedFormType(null);
          setShowDeliveryMethodOptions(false);
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Send Form</DialogTitle>
            <DialogDescription>
              Choose which form(s) you want to send
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedFormType('consulation');
                setShowSendFormOptions(false);
                setShowDeliveryMethodOptions(true);
              }}
              className="w-full justify-start h-auto py-4"
              disabled={isSendingConsulationForm}
            >
              <ClipboardList className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Send Consulation Form</div>
                <div className="text-xs text-gray-500">Send consulation form to customer</div>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedFormType('payment');
                setShowSendFormOptions(false);
                setShowDeliveryMethodOptions(true);
              }}
              className="w-full justify-start h-auto py-4"
              disabled={isSendingConsulationForm}
            >
              <CreditCard className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Send Payment Form</div>
                <div className="text-xs text-gray-500">Send payment form to customer</div>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedFormType('both');
                setShowSendFormOptions(false);
                setShowDeliveryMethodOptions(true);
              }}
              className="w-full justify-start h-auto py-4"
              disabled={isSendingConsulationForm}
            >
              <ClipboardList className="h-5 w-5 mr-3" />
              <CreditCard className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Send Both Forms</div>
                <div className="text-xs text-gray-500">Send both consulation and payment forms</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Form Options Dialog - Step 2: Choose Delivery Method */}
      <Dialog open={showDeliveryMethodOptions} onOpenChange={(open) => {
        setShowDeliveryMethodOptions(open);
        if (!open && !showSendFormOptions) {
          setSelectedFormType(null);
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Send {selectedFormType === 'both' ? 'Both Forms' : selectedFormType === 'payment' ? 'Payment Form' : 'Consulation Form'}
            </DialogTitle>
            <DialogDescription>
              Choose how you want to send the form
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            {canSendEmail && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSendForm(selectedFormType!, 'email')}
                className="w-full justify-start h-auto py-4"
                disabled={isSendingConsulationForm}
              >
                <Mail className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Send via Email</div>
                  <div className="text-xs text-gray-500">Send form link to {customer.email}</div>
                </div>
              </Button>
            )}
            {canSendWhatsApp && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSendForm(selectedFormType!, 'whatsapp')}
                className="w-full justify-start h-auto py-4"
                disabled={isSendingConsulationForm}
              >
                <MessageCircle className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Send via WhatsApp</div>
                  <div className="text-xs text-gray-500">Send form link to {customer.phone}</div>
                </div>
              </Button>
            )}
            {canSendEmail && canSendWhatsApp && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSendForm(selectedFormType!, 'both')}
                className="w-full justify-start h-auto py-4"
                disabled={isSendingConsulationForm}
              >
                <Mail className="h-5 w-5 mr-3" />
                <MessageCircle className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Send via Both</div>
                  <div className="text-xs text-gray-500">Send form link to email and WhatsApp</div>
                </div>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowDeliveryMethodOptions(false);
                setShowSendFormOptions(true);
              }}
              className="w-full mt-2"
            >
              ← Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consulation Form Dialog */}
      <ConsulationFormDialog
        isOpen={isConsulationFormOpen}
        onOpenChange={setIsConsulationFormOpen}
        fields={consulationFields}
        onFieldsChange={setConsulationFields}
        defaultValues={consulationDefaultValues}
        tenantId={tenant?.id}
        customerId={customerId ? parseInt(customerId) : undefined}
        consulationStorageKey={consulationStorageKey}
        onDefaultValuesChange={setConsulationDefaultValues}
        formType="consulation"
      />

      {/* Payment Form Dialog */}
      <ConsulationFormDialog
        isOpen={isPaymentFormOpen}
        onOpenChange={setIsPaymentFormOpen}
        fields={paymentFields}
        onFieldsChange={setPaymentFields}
        defaultValues={paymentDefaultValues}
        tenantId={tenant?.id}
        customerId={customerId ? parseInt(customerId) : undefined}
        consulationStorageKey={paymentStorageKey}
        onDefaultValuesChange={setPaymentDefaultValues}
        formType="payment"
      />

      {/* Image Viewing Dialog for Submission Images */}
      <Dialog open={!!viewingSubmissionImage} onOpenChange={() => setViewingSubmissionImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingSubmissionImage?.name || "File Preview"}</DialogTitle>
          </DialogHeader>
          {viewingSubmissionImage && (() => {
            const isPdf = viewingSubmissionImage.name.toLowerCase().endsWith('.pdf') || 
                         viewingSubmissionImage.url.toLowerCase().endsWith('.pdf');
            const normalizedUrl = viewingSubmissionImage.url.startsWith('http') || viewingSubmissionImage.url.startsWith('https')
              ? viewingSubmissionImage.url
              : viewingSubmissionImage.url.startsWith('/')
                ? viewingSubmissionImage.url
                : `/${viewingSubmissionImage.url}`;
            
            return (
              <div className="flex items-center justify-center p-4">
                {isPdf ? (
                  <div className="w-full h-[70vh] flex flex-col items-center justify-center">
                    <iframe
                      src={normalizedUrl}
                      className="w-full h-full border rounded-md"
                      title={viewingSubmissionImage.name}
                      onError={() => {
                        console.error("PDF load error:", normalizedUrl);
                      }}
                    />
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => window.open(normalizedUrl, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Open PDF in New Tab
                      </Button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={normalizedUrl}
                    alt={viewingSubmissionImage.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-md"
                    onError={(e) => {
                      console.error("Image load error:", normalizedUrl);
                      (e.target as HTMLImageElement).src = "/placeholder-image.png";
                    }}
                    onLoad={() => {
                      console.log("Image loaded successfully:", normalizedUrl);
                    }}
                  />
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

    </Layout>
  );
}

// Consulation Form Dialog Component
interface ConsulationFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fields: ConsulationField[];
  onFieldsChange: (next: ConsulationField[]) => void;
  defaultValues?: Record<string, string>;
  tenantId?: number;
  customerId?: number;
  consulationStorageKey?: string | null;
  onDefaultValuesChange?: (values: Record<string, string>) => void;
  formType?: "consulation" | "payment";
}

function ConsulationFormDialog({
  isOpen,
  onOpenChange,
  fields,
  onFieldsChange,
  defaultValues = {},
  tenantId,
  customerId,
  consulationStorageKey,
  onDefaultValuesChange,
  formType = "consulation",
}: ConsulationFormDialogProps) {
  const { toast } = useToast();
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] =
    useState<ConsulationFieldType>("text");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [defaultImageFiles, setDefaultImageFiles] = useState<Record<string, File[]>>({});
  const [defaultImagePreviews, setDefaultImagePreviews] = useState<Record<string, string[]>>({});
  const [defaultImageUrls, setDefaultImageUrls] = useState<Record<string, string[]>>({});
  const [defaultFileFiles, setDefaultFileFiles] = useState<Record<string, File[]>>({});
  const [defaultFilePreviews, setDefaultFilePreviews] = useState<Record<string, string[]>>({});
  const [defaultFileUrls, setDefaultFileUrls] = useState<Record<string, string[]>>({});
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

  // Fetch invoices for the customer
  const { data: invoices = [] } = useQuery({
    queryKey: ["customer-invoices", customerId, tenantId],
    queryFn: async () => {
      if (!tenantId || !customerId) return [];
      const token = auth.getToken();
      const response = await fetch(
        `/api/tenants/${tenantId}/invoices`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) return [];
      const data = await response.json();
      const allInvoices = Array.isArray(data) ? data : (data.invoices || []);
      // Filter invoices for this customer
      return allInvoices.filter((inv: any) => 
        (inv.customerId === customerId) || 
        (inv.customer_id === customerId)
      );
    },
    enabled: !!tenantId && !!customerId && isOpen,
  });

  // Load default values when dialog opens (only once per open)
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Reset initialization when defaultValues change (so we can reload with new values)
  useEffect(() => {
    if (isOpen) {
      setHasInitialized(false);
    }
  }, [defaultValues, isOpen]);
  
  useEffect(() => {
    if (!isOpen) {
      // Reset initialization flag when dialog closes
      setHasInitialized(false);
      return;
    }
    
    // Only initialize once when dialog opens
    if (hasInitialized) return;
    
    setFormValues((prev) => {
      const nextValues: Record<string, string> = {};
      const nextImageFiles: Record<string, File[]> = {};
      const nextImagePreviews: Record<string, string[]> = {};
      const nextImageUrls: Record<string, string[]> = {};
      const nextFileFiles: Record<string, File[]> = {};
      const nextFilePreviews: Record<string, string[]> = {};
      const nextFileUrls: Record<string, string[]> = {};
      
      fields.forEach((field) => {
        // Get default value from props (loaded from database) or from field.defaultValue
        // Check if the key exists in defaultValues (even if value is empty string)
        const defaultValue = field.id in defaultValues 
          ? defaultValues[field.id] 
          : (field.defaultValue || "");
        
        if (field.type === "image") {
          // For image fields, initialize with default URLs if available
          // Check if defaultValue exists and is not empty (empty string means cleared)
          if (defaultValue && defaultValue.trim().length > 0) {
            // Split and filter URLs, removing duplicates
            const urls = defaultValue.split(",")
              .map((url: string) => url.trim())
              .filter((url: string) => url && url.length > 0)
              .filter((url: string, index: number, self: string[]) => self.indexOf(url) === index); // Remove duplicates
            nextImageUrls[field.id] = urls;
            // Show image names from URLs
            const imageNames = urls.map((url: string, index: number) => {
              const urlParts = url.split("/");
              const filename = urlParts[urlParts.length - 1] || `Image ${index + 1}`;
              return `Image ${index + 1} ${filename}`;
            }).join(", ");
            nextValues[field.id] = imageNames;
            // Ensure defaultImageFiles is empty for database-loaded images
            nextImageFiles[field.id] = [];
            nextImagePreviews[field.id] = [];
          } else {
            // Empty string or no value - field was cleared
            nextImageFiles[field.id] = [];
            nextImagePreviews[field.id] = [];
            nextImageUrls[field.id] = [];
            nextValues[field.id] = "";
          }
        } else if (field.type === "file") {
          // For file fields, initialize with default URLs if available
          if (defaultValue && defaultValue.trim().length > 0) {
            const urls = defaultValue.split(",")
              .map((url: string) => url.trim())
              .filter((url: string) => url && url.length > 0)
              .filter((url: string, index: number, self: string[]) => self.indexOf(url) === index);
            nextFileUrls[field.id] = urls;
            // Show file names from URLs
            const fileNames = urls.map((url: string, index: number) => {
              const urlParts = url.split("/");
              const filename = urlParts[urlParts.length - 1] || `File ${index + 1}`;
              const isPdf = filename.toLowerCase().endsWith('.pdf');
              return `${isPdf ? 'PDF' : 'Image'} ${index + 1} ${filename}`;
            }).join(", ");
            nextValues[field.id] = fileNames;
            nextFileFiles[field.id] = [];
            nextFilePreviews[field.id] = [];
          } else {
            nextFileFiles[field.id] = [];
            nextFilePreviews[field.id] = [];
            nextFileUrls[field.id] = [];
            nextValues[field.id] = "";
          }
        } else {
          // For other fields, use default value from database
          // Use defaultValue if it exists (even if empty string), otherwise use prev value
          nextValues[field.id] = defaultValue !== undefined && defaultValue !== null ? defaultValue : (prev[field.id] || "");
        }
      });
      
      setDefaultImageFiles(nextImageFiles);
      setDefaultImagePreviews(nextImagePreviews);
      setDefaultImageUrls(nextImageUrls);
      setDefaultFileFiles(nextFileFiles);
      setDefaultFilePreviews(nextFilePreviews);
      setDefaultFileUrls(nextFileUrls);
      setHasInitialized(true);
      
      console.log("📋 Initialized form values from defaults:", nextValues);
      return nextValues;
    });
  }, [fields, defaultValues, isOpen, hasInitialized]);

  // Reload default values when dialog opens to ensure we have latest data
  useEffect(() => {
    if (!isOpen || !tenantId) return;
    
    const reloadDefaultValues = async () => {
      try {
        const response = await apiRequest(
          "GET",
          `/api/tenants/${tenantId}/consulation-form?formType=${formType || "consulation"}`,
          {}
        );
        const data = await response.json();
        if (data?.defaultValues && typeof data.defaultValues === 'object' && onDefaultValuesChange) {
          onDefaultValuesChange(data.defaultValues);
        }
      } catch (error) {
        console.warn("Failed to reload default values when opening dialog:", error);
      }
    };
    
    reloadDefaultValues();
  }, [isOpen, tenantId, formType, onDefaultValuesChange]);

  // Reset selected invoice when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedInvoiceId("");
    }
  }, [isOpen]);

  // Handle invoice selection and auto-fill form
  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    
    if (!invoiceId || invoiceId === "" || invoiceId === "none") {
      // Clear form if "None" is selected
      setFormValues({});
      // Clear default values from fields
      onFieldsChange(
        fields.map((field) => ({
          ...field,
          defaultValue: "",
        }))
      );
      return;
    }

    const invoice = invoices.find((inv: any) => 
      (inv.id?.toString() === invoiceId) || 
      (inv.invoiceNumber === invoiceId) ||
      (inv.invoice_number === invoiceId)
    );

    if (!invoice) {
      toast({
        title: "Invoice not found",
        description: "Selected invoice could not be found.",
        variant: "destructive",
      });
      return;
    }

    // Auto-fill form fields based on invoice data
    const autoFilledValues: Record<string, string> = {};
    
    fields.forEach((field) => {
      const fieldLabel = field.label.toLowerCase();
      
      // Match field labels to invoice data
      if (fieldLabel.includes("title") || fieldLabel.includes("name") || fieldLabel.includes("invoice")) {
        autoFilledValues[field.id] = invoice.invoiceNumber || invoice.invoice_number || `INV-${invoice.id}` || "";
      } else if (fieldLabel.includes("price") || fieldLabel.includes("amount") || fieldLabel.includes("total") || fieldLabel.includes("cost")) {
        const amount = invoice.totalAmount || invoice.total_amount || invoice.amount || 0;
        autoFilledValues[field.id] = amount.toString();
      } else if (fieldLabel.includes("phone") || fieldLabel.includes("mobile") || fieldLabel.includes("contact")) {
        // Try to get phone from invoice or customer
        autoFilledValues[field.id] = invoice.customerPhone || invoice.phone || invoice.customer_phone || "";
      } else if (fieldLabel.includes("description") || fieldLabel.includes("notes") || fieldLabel.includes("details") || fieldLabel.includes("note")) {
        autoFilledValues[field.id] = invoice.notes || invoice.description || invoice.note || "";
      } else if (fieldLabel.includes("date") && !fieldLabel.includes("due")) {
        const date = invoice.issueDate || invoice.issue_date || invoice.createdAt || invoice.created_at;
        if (date) {
          autoFilledValues[field.id] = new Date(date).toLocaleDateString();
        }
      } else if (fieldLabel.includes("due") && fieldLabel.includes("date")) {
        const dueDate = invoice.dueDate || invoice.due_date;
        if (dueDate) {
          autoFilledValues[field.id] = new Date(dueDate).toLocaleDateString();
        }
      } else if (fieldLabel.includes("subtotal") || fieldLabel.includes("sub-total")) {
        const subtotal = invoice.subtotal || invoice.sub_total || 0;
        autoFilledValues[field.id] = subtotal.toString();
      } else if (fieldLabel.includes("tax") || fieldLabel.includes("vat")) {
        const tax = invoice.taxAmount || invoice.tax_amount || invoice.tax || 0;
        autoFilledValues[field.id] = tax.toString();
      } else if (fieldLabel.includes("discount")) {
        const discount = invoice.discountAmount || invoice.discount_amount || invoice.discount || 0;
        autoFilledValues[field.id] = discount.toString();
      } else if (fieldLabel.includes("status") || fieldLabel.includes("state")) {
        autoFilledValues[field.id] = invoice.status || invoice.paymentStatus || "";
      } else if (fieldLabel.includes("currency")) {
        autoFilledValues[field.id] = invoice.currency || "INR";
      }
    });

    // Update form values with auto-filled data
    setFormValues((prev) => ({
      ...prev,
      ...autoFilledValues,
    }));

    // Also update field defaultValues
    onFieldsChange(
      fields.map((field) => ({
        ...field,
        defaultValue: autoFilledValues[field.id] || field.defaultValue || "",
      }))
    );

    toast({
      title: "Invoice data loaded",
      description: "Form fields have been auto-filled with invoice data.",
    });
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) {
      toast({
        title: "Field label required",
        description: "Please provide a label for the new field.",
        variant: "destructive",
      });
      return;
    }

    const newField: ConsulationField = {
      id: generateFieldId(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: false,
    };

    onFieldsChange([...fields, newField]);
    setNewFieldLabel("");
    setNewFieldType("text");
  };

  const handleFieldChange = (
    fieldId: string,
    key: keyof ConsulationField,
    value: ConsulationField[keyof ConsulationField],
  ) => {
    const updated = fields.map((field) =>
      field.id === fieldId ? { ...field, [key]: value } : field,
    );
    onFieldsChange(updated);
  };

  const handleRemoveField = (fieldId: string) => {
    onFieldsChange(fields.filter((field) => field.id !== fieldId));
    setFormValues((prev) => {
      const { [fieldId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleValueChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    // Update the field's defaultValue
    onFieldsChange(
      fields.map((field) =>
        field.id === fieldId ? { ...field, defaultValue: value } : field
      )
    );
  };

  const handleImageChange = async (fieldId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    console.log("📸 handleImageChange called:", {
      fieldId,
      selectedFilesCount: fileArray.length,
      existingFilesCount: (defaultImageFiles[fieldId] || []).length,
      existingUrlsCount: (defaultImageUrls[fieldId] || []).length,
    });
    
    const newFiles = [...(defaultImageFiles[fieldId] || []), ...fileArray];
    setDefaultImageFiles((prev) => ({ ...prev, [fieldId]: newFiles }));

    // Create preview URLs
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
    setDefaultImagePreviews((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...newPreviews],
    }));

    // Upload images and get URLs
    try {
      const formData = new FormData();
      fileArray.forEach((file) => {
        formData.append('attachments', file);
      });

      const token = auth.getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const uploadResponse = await fetch('/api/consulation-form/upload-images', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ message: 'Failed to upload files' }));
        throw new Error(errorData.message || 'Failed to upload files');
      }

      const uploadResult = await uploadResponse.json();
      const uploadedFiles = uploadResult.files || [];
      const uploadedUrls = uploadedFiles
        .filter((f: any) => f.path)
        .map((f: any) => f.path);

      // Only add URLs that don't already exist to prevent duplicates
      const existingUrls = defaultImageUrls[fieldId] || [];
      const uniqueNewUrls = uploadedUrls.filter((url: string) => !existingUrls.includes(url));
      const newUrls = [...existingUrls, ...uniqueNewUrls];
      setDefaultImageUrls((prev) => ({ ...prev, [fieldId]: newUrls }));

      // Remove uploaded files from defaultImageFiles since they're now represented by URLs
      // Use functional updates to ensure we're working with the latest state
      setDefaultImageFiles((prev) => {
        const currentFiles = prev[fieldId] || [];
        const filesToKeep = currentFiles.slice(0, currentFiles.length - fileArray.length);
        console.log("📸 After upload - removing files:", {
          fieldId,
          currentFilesCount: currentFiles.length,
          uploadedFilesCount: fileArray.length,
          filesToKeepCount: filesToKeep.length,
          newUrlsCount: newUrls.length,
        });
        return { ...prev, [fieldId]: filesToKeep };
      });
      
      // Also remove their preview URLs
      setDefaultImagePreviews((prev) => {
        const currentPreviews = prev[fieldId] || [];
        const previewsToKeep = currentPreviews.slice(0, currentPreviews.length - newPreviews.length);
        // Revoke the preview URLs for uploaded files
        newPreviews.forEach((previewUrl) => {
          URL.revokeObjectURL(previewUrl);
        });
        return { ...prev, [fieldId]: previewsToKeep };
      });

      // Update form value - only show URL names (since files are now uploaded)
      const urlNames = newUrls.map((url, index) => {
        const urlParts = url.split("/");
        const filename = urlParts[urlParts.length - 1] || `Image ${index + 1}`;
        return `Image ${index + 1}: ${filename}`;
      });
      const allNames = urlNames.join(", ");
      setFormValues((prev) => ({ ...prev, [fieldId]: allNames }));
      
      // Update field defaultValue with URLs
      const allUrls = newUrls.join(", ");
      onFieldsChange(
        fields.map((field) =>
          field.id === fieldId ? { ...field, defaultValue: allUrls } : field
        )
      );
    } catch (error: any) {
      console.error(`Error uploading image for field ${fieldId}:`, error);
      toast({
        title: "Upload Error",
        description: `Failed to upload images: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async (fieldId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    console.log("📄 handleFileChange called:", {
      fieldId,
      selectedFilesCount: fileArray.length,
      existingFilesCount: (defaultFileFiles[fieldId] || []).length,
      existingUrlsCount: (defaultFileUrls[fieldId] || []).length,
    });
    
    const newFiles = [...(defaultFileFiles[fieldId] || []), ...fileArray];
    setDefaultFileFiles((prev) => ({ ...prev, [fieldId]: newFiles }));

    // Create preview URLs for images only (PDFs will use a placeholder)
    const newPreviews = fileArray.map((file) => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      } else {
        // For PDFs, we'll use a placeholder or the file icon
        return '';
      }
    });
    setDefaultFilePreviews((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...newPreviews],
    }));

    // Upload files and get URLs
    try {
      const formData = new FormData();
      fileArray.forEach((file) => {
        formData.append('attachments', file);
      });

      const token = auth.getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const uploadResponse = await fetch('/api/consulation-form/upload-images', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ message: 'Failed to upload files' }));
        throw new Error(errorData.message || 'Failed to upload files');
      }

      const uploadResult = await uploadResponse.json();
      const uploadedFiles = uploadResult.files || [];
      const uploadedUrls = uploadedFiles
        .filter((f: any) => f.path)
        .map((f: any) => f.path);

      // Only add URLs that don't already exist to prevent duplicates
      const existingUrls = defaultFileUrls[fieldId] || [];
      const uniqueNewUrls = uploadedUrls.filter((url: string) => !existingUrls.includes(url));
      const newUrls = [...existingUrls, ...uniqueNewUrls];
      setDefaultFileUrls((prev) => ({ ...prev, [fieldId]: newUrls }));

      // Remove uploaded files from defaultFileFiles since they're now represented by URLs
      setDefaultFileFiles((prev) => {
        const currentFiles = prev[fieldId] || [];
        const filesToKeep = currentFiles.slice(0, currentFiles.length - fileArray.length);
        return { ...prev, [fieldId]: filesToKeep };
      });
      
      // Also remove their preview URLs
      setDefaultFilePreviews((prev) => {
        const currentPreviews = prev[fieldId] || [];
        const previewsToKeep = currentPreviews.slice(0, currentPreviews.length - newPreviews.length);
        // Revoke the preview URLs for uploaded files
        newPreviews.forEach((previewUrl) => {
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }
        });
        return { ...prev, [fieldId]: previewsToKeep };
      });

      // Update form value - show file names
      const urlNames = newUrls.map((url, index) => {
        const urlParts = url.split("/");
        const filename = urlParts[urlParts.length - 1] || `File ${index + 1}`;
        const isPdf = filename.toLowerCase().endsWith('.pdf');
        return `${isPdf ? 'PDF' : 'Image'} ${index + 1}: ${filename}`;
      });
      const allNames = urlNames.join(", ");
      setFormValues((prev) => ({ ...prev, [fieldId]: allNames }));
      
      // Update field defaultValue with URLs
      const allUrls = newUrls.join(", ");
      onFieldsChange(
        fields.map((field) =>
          field.id === fieldId ? { ...field, defaultValue: allUrls } : field
        )
      );
    } catch (error: any) {
      console.error(`Error uploading file for field ${fieldId}:`, error);
      toast({
        title: "Upload Error",
        description: `Failed to upload files: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const removeDefaultFile = (fieldId: string, index: number) => {
    const currentFiles = defaultFileFiles[fieldId] || [];
    const currentPreviews = defaultFilePreviews[fieldId] || [];
    const currentUrls = defaultFileUrls[fieldId] || [];
    
    // Determine if we're removing a file or a URL
    if (index < currentFiles.length) {
      // Removing a file
      const newFiles = [...currentFiles];
      const newPreviews = [...currentPreviews];
      
      // Revoke preview URL
      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index]);
      }
      
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      
      setDefaultFileFiles((prev) => ({ ...prev, [fieldId]: newFiles }));
      setDefaultFilePreviews((prev) => ({ ...prev, [fieldId]: newPreviews }));
      
      // Update form value
      const fileNames = newFiles.map((file, idx) => {
        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        return `${isPdf ? 'PDF' : 'Image'} ${idx + 1} ${file.name}`;
      });
      const urlNames = currentUrls.map((url, idx) => {
        const urlParts = url.split("/");
        const filename = urlParts[urlParts.length - 1] || `File ${newFiles.length + idx + 1}`;
        const isPdf = filename.toLowerCase().endsWith('.pdf');
        return `${isPdf ? 'PDF' : 'Image'} ${newFiles.length + idx + 1} ${filename}`;
      });
      const allNames = [...fileNames, ...urlNames].join(", ");
      setFormValues((prev) => ({ ...prev, [fieldId]: allNames || "" }));
      
      // Update field defaultValue
      const allUrls = currentUrls.join(", ");
      onFieldsChange(
        fields.map((field) =>
          field.id === fieldId ? { ...field, defaultValue: allUrls || "" } : field
        )
      );
    } else {
      // Removing a URL
      const urlIndex = index - currentFiles.length;
      const newUrls = [...currentUrls];
      newUrls.splice(urlIndex, 1);
      
      setDefaultFileUrls((prev) => ({ ...prev, [fieldId]: newUrls }));
      
      // Update form value
      const fileNames = currentFiles.map((file, idx) => {
        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        return `${isPdf ? 'PDF' : 'Image'} ${idx + 1} ${file.name}`;
      });
      const urlNames = newUrls.map((url, idx) => {
        const urlParts = url.split("/");
        const filename = urlParts[urlParts.length - 1] || `File ${currentFiles.length + idx + 1}`;
        const isPdf = filename.toLowerCase().endsWith('.pdf');
        return `${isPdf ? 'PDF' : 'Image'} ${currentFiles.length + idx + 1} ${filename}`;
      });
      const allNames = [...fileNames, ...urlNames].join(", ");
      setFormValues((prev) => ({ ...prev, [fieldId]: allNames || "" }));
      
      // Update field defaultValue
      const allUrls = newUrls.join(", ");
      onFieldsChange(
        fields.map((field) =>
          field.id === fieldId ? { ...field, defaultValue: allUrls || "" } : field
        )
      );
    }
  };

  const removeDefaultImage = (fieldId: string, index: number) => {
    const currentFiles = defaultImageFiles[fieldId] || [];
    const currentPreviews = defaultImagePreviews[fieldId] || [];
    const currentUrls = defaultImageUrls[fieldId] || [];
    
    // Determine if we're removing a file or a URL
    // Files come first, then URLs
    if (index < currentFiles.length) {
      // Removing a file
      const newFiles = [...currentFiles];
      const newPreviews = [...currentPreviews];
      
      // Revoke preview URL
      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index]);
      }
      
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      
      setDefaultImageFiles((prev) => ({ ...prev, [fieldId]: newFiles }));
      setDefaultImagePreviews((prev) => ({ ...prev, [fieldId]: newPreviews }));
      
      // Update form value with remaining files and URLs
      const fileNames = newFiles.map((file, idx) => `Image ${idx + 1} ${file.name}`);
      const urlNames = currentUrls.map((url, idx) => {
        const urlParts = url.split("/");
        const filename = urlParts[urlParts.length - 1] || `Image ${newFiles.length + idx + 1}`;
        return `Image ${newFiles.length + idx + 1} ${filename}`;
      });
      const allNames = [...fileNames, ...urlNames].join(", ");
      setFormValues((prev) => ({ ...prev, [fieldId]: allNames || "" }));
      
      // Update field defaultValue (URLs only, files are uploaded on save)
      const allUrls = currentUrls.join(", ");
      onFieldsChange(
        fields.map((field) =>
          field.id === fieldId ? { ...field, defaultValue: allUrls || "" } : field
        )
      );
    } else {
      // Removing a URL
      const urlIndex = index - currentFiles.length;
      const newUrls = [...currentUrls];
      newUrls.splice(urlIndex, 1);
      
      setDefaultImageUrls((prev) => ({ ...prev, [fieldId]: newUrls }));
      
      // Update form value
      const fileNames = currentFiles.map((file, idx) => `Image ${idx + 1} ${file.name}`);
      const urlNames = newUrls.map((url, idx) => {
        const urlParts = url.split("/");
        const filename = urlParts[urlParts.length - 1] || `Image ${currentFiles.length + idx + 1}`;
        return `Image ${currentFiles.length + idx + 1} ${filename}`;
      });
      const allNames = [...fileNames, ...urlNames].join(", ");
      setFormValues((prev) => ({ ...prev, [fieldId]: allNames || "" }));
      
      // Update field defaultValue
      const allUrls = newUrls.join(", ");
      onFieldsChange(
        fields.map((field) =>
          field.id === fieldId ? { ...field, defaultValue: allUrls || "" } : field
        )
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fields.length === 0) {
      toast({
        title: "No fields configured",
        description:
          `Please add at least one field before saving the ${formType === "payment" ? "payment" : "consulation"} form.`,
        variant: "destructive",
      });
      return;
    }

    if (!tenantId) {
      toast({
        title: "Error",
        description: "Tenant information not available.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, upload any new image files for image fields
      const uploadedImageUrls: Record<string, string[]> = {};
      const uploadedFileUrls: Record<string, string[]> = {};
      for (const field of fields) {
        if (field.type === "image" && defaultImageFiles[field.id] && defaultImageFiles[field.id].length > 0) {
          try {
            const formData = new FormData();
            defaultImageFiles[field.id].forEach((file) => {
              formData.append('attachments', file);
            });

            const uploadResponse = await fetch('/api/consulation-form/upload-images', {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => ({ message: 'Failed to upload files' }));
              throw new Error(errorData.message || 'Failed to upload files');
            }

            const uploadResult = await uploadResponse.json();
            const uploadedFiles = uploadResult.files || [];
            uploadedImageUrls[field.id] = uploadedFiles
              .filter((f: any) => f.path)
              .map((f: any) => f.path);
          } catch (error: any) {
            console.error(`Error uploading images for field ${field.id}:`, error);
            toast({
              title: "Upload Error",
              description: `Failed to upload images for ${field.label}: ${error.message}`,
              variant: "destructive",
            });
            return; // Don't save if image upload fails
          }
        } else if (field.type === "file" && defaultFileFiles[field.id] && defaultFileFiles[field.id].length > 0) {
          try {
            const formData = new FormData();
            defaultFileFiles[field.id].forEach((file) => {
              formData.append('attachments', file);
            });

            const uploadResponse = await fetch('/api/consulation-form/upload-images', {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => ({ message: 'Failed to upload files' }));
              throw new Error(errorData.message || 'Failed to upload files');
            }

            const uploadResult = await uploadResponse.json();
            const uploadedFiles = uploadResult.files || [];
            uploadedFileUrls[field.id] = uploadedFiles
              .filter((f: any) => f.path)
              .map((f: any) => f.path);
          } catch (error: any) {
            console.error(`Error uploading files for field ${field.id}:`, error);
            toast({
              title: "Upload Error",
              description: `Failed to upload files for ${field.label}: ${error.message}`,
              variant: "destructive",
            });
            return; // Don't save if file upload fails
          }
        }
      }

      // Extract default values from formValues and combine with uploaded image URLs
      // Always include all fields, even if empty (to allow clearing defaults)
      console.log("📝 Current formValues before extracting defaults:", formValues);
      const defaultValues: Record<string, string> = {};
      fields.forEach((field) => {
        if (field.type === "image") {
          // For image fields, combine existing URLs with newly uploaded URLs
          const existingUrls = defaultImageUrls[field.id] || [];
          const newUrls = uploadedImageUrls[field.id] || [];
          const allUrls = [...existingUrls, ...newUrls].filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
          // Always save image URLs, even if empty (to allow clearing)
          defaultValues[field.id] = allUrls.join(", ");
        } else if (field.type === "file") {
          // For file fields, combine existing URLs with newly uploaded URLs
          const existingUrls = defaultFileUrls[field.id] || [];
          const newUrls = uploadedFileUrls[field.id] || [];
          const allUrls = [...existingUrls, ...newUrls].filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
          // Always save file URLs, even if empty (to allow clearing)
          defaultValues[field.id] = allUrls.join(", ");
        } else {
          // For other fields, use the value from formValues (always save, even if empty)
          const currentValue = formValues[field.id] || "";
          defaultValues[field.id] = currentValue;
        }
      });
      
      // Clean fields - remove defaultValue from field objects (store separately)
      const cleanFields = fields.map((field) => {
        const { defaultValue, ...cleanField } = field;
        return cleanField;
      });
      
      console.log("💾 Saving fields and default values:", {
        fieldsCount: cleanFields.length,
        defaultValuesCount: Object.keys(defaultValues).length,
        defaultValues: defaultValues,
      });
      
      // Save to database
      const response = await apiRequest(
        "POST",
        `/api/tenants/${tenantId}/consulation-form/template`,
        { 
          fields: cleanFields,
          defaultValues: defaultValues,
          formType: formType || "consulation"
        }
      );
      const data = await response.json();

      if (data?.success) {
        // Also save to localStorage as backup
        if (consulationStorageKey) {
          localStorage.setItem(
            consulationStorageKey,
            JSON.stringify(fields)
          );
        }

        // Update parent component's default values state with the saved values
        // This ensures that when the dialog reopens, it shows the correct (possibly empty) values
        if (onDefaultValuesChange) {
          onDefaultValuesChange(defaultValues);
        }

        // Also reload from database to ensure we have the latest data
        // This is important to handle any server-side processing of empty values
        try {
          const reloadResponse = await apiRequest(
            "GET",
            `/api/tenants/${tenantId}/consulation-form?formType=${formType || "consulation"}`,
            {}
          );
          const reloadData = await reloadResponse.json();
          if (reloadData?.defaultValues && typeof reloadData.defaultValues === 'object') {
            if (onDefaultValuesChange) {
              onDefaultValuesChange(reloadData.defaultValues);
            }
          }
        } catch (reloadError) {
          console.warn("Failed to reload default values after save:", reloadError);
          // Continue anyway - we've already updated the state with what we saved
        }

        toast({
          title: `${formType === "payment" ? "Payment" : "Consulation"} form saved`,
          description:
            `Your ${formType === "payment" ? "payment" : "consulation"} form layout has been saved successfully.`,
        });
        onOpenChange(false);
      } else {
        throw new Error(data?.message || "Failed to save form");
      }
    } catch (error: any) {
      console.error("Error saving consulation form:", error);
      toast({
        title: "Failed to save form",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const reorderFields = (
    list: ConsulationField[],
    sourceId: string,
    targetId: string,
  ) => {
    const updated = [...list];
    const fromIndex = updated.findIndex((field) => field.id === sourceId);
    const toIndex = updated.findIndex((field) => field.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      return list;
    }
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    return updated;
  };

  const handleDragStart = (fieldId: string) => {
    setDraggedFieldId(fieldId);
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    targetFieldId: string,
  ) => {
    event.preventDefault();
    if (!draggedFieldId || draggedFieldId === targetFieldId) {
      return;
    }
    const reordered = reorderFields(fields, draggedFieldId, targetFieldId);
    onFieldsChange(reordered);
    setDraggedFieldId(targetFieldId);
  };

  const renderFieldInput = (field: ConsulationField) => {
    const commonProps = {
      id: field.id,
      value: formValues[field.id] || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        handleValueChange(field.id, e.target.value),
    };

    switch (field.type) {
      case "title":
        return <Input placeholder="Title" {...commonProps} />;
      case "price":
        return (
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            {...commonProps}
          />
        );

      case "textarea":
        return (
          <Textarea
            placeholder="Enter details"
            value={formValues[field.id] || ""}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            className="min-h-[100px]"
          />
        );
      case "phone":
        return (
          <Input
            type="tel"
            placeholder="+1 (555) 123-4567"
            {...commonProps}
          />
        );
      case "image":
        const imageUrls = defaultImageUrls[field.id] || [];
        const imagePreviews = defaultImagePreviews[field.id] || [];
        const imageFiles = defaultImageFiles[field.id] || [];
        return (
          <div className="space-y-3">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageChange(field.id, e.target.files)}
            />
            <p className="text-xs text-gray-500">
              You can select multiple images
            </p>
            {(imageUrls.length > 0 || imageFiles.length > 0) && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 font-medium">
                  Default Images ({imageUrls.length + imageFiles.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {imageFiles.map((file, index) => (
                    <div
                      key={`file-${index}`}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const previewUrl = imagePreviews[index];
                          if (previewUrl) {
                            setViewingImage({ url: previewUrl, name: file.name });
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Image {index + 1}: {file.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDefaultImage(field.id, index)}
                        className="text-red-500 hover:text-red-700"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {imageUrls.map((url, index) => {
                    const urlParts = url.split("/");
                    const filename = urlParts[urlParts.length - 1] || `Image ${imageFiles.length + index + 1}`;
                    const normalizedUrl = url.startsWith('http') || url.startsWith('https')
                      ? url
                      : url.startsWith('/')
                        ? url
                        : `/${url}`;
                    return (
                      <div
                        key={`url-${index}`}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                      >
                        <button
                          type="button"
                          onClick={() => setViewingImage({ url: normalizedUrl, name: filename })}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          Image {imageFiles.length + index + 1}: {filename.length > 30 ? filename.substring(0, 30) + "..." : filename}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDefaultImage(field.id, imageFiles.length + index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Remove ${filename}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      case "file":
        const fileUrls = defaultFileUrls[field.id] || [];
        const filePreviews = defaultFilePreviews[field.id] || [];
        const fileFiles = defaultFileFiles[field.id] || [];
        return (
          <div className="space-y-3">
            <Input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={(e) => handleFileChange(field.id, e.target.files)}
            />
            <p className="text-xs text-gray-500">
              You can select multiple images and PDFs
            </p>
            {(fileUrls.length > 0 || fileFiles.length > 0) && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 font-medium">
                  Default Files ({fileUrls.length + fileFiles.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {fileFiles.map((file, index) => {
                    const isPdf = file.name.toLowerCase().endsWith('.pdf');
                    const previewUrl = filePreviews[index];
                    return (
                      <div
                        key={`file-${index}`}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (previewUrl) {
                              setViewingImage({ url: previewUrl, name: file.name });
                            } else {
                              // For PDFs, we'll need to handle differently
                              setViewingImage({ url: URL.createObjectURL(file), name: file.name });
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {isPdf ? 'PDF' : 'Image'} {index + 1}: {file.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDefaultFile(field.id, index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                  {fileUrls.map((url, index) => {
                    const urlParts = url.split("/");
                    const filename = urlParts[urlParts.length - 1] || `File ${fileFiles.length + index + 1}`;
                    const isPdf = filename.toLowerCase().endsWith('.pdf');
                    const normalizedUrl = url.startsWith('http') || url.startsWith('https')
                      ? url
                      : url.startsWith('/')
                        ? url
                        : `/${url}`;
                    return (
                      <div
                        key={`url-${index}`}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                      >
                        <button
                          type="button"
                          onClick={() => setViewingImage({ url: normalizedUrl, name: filename })}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {isPdf ? 'PDF' : 'Image'} {fileFiles.length + index + 1}: {filename.length > 30 ? filename.substring(0, 30) + "..." : filename}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDefaultFile(field.id, fileFiles.length + index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Remove ${filename}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <Input placeholder="Enter value" {...commonProps} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{formType === "payment" ? "Set Payment Form" : "Set Consulation Form"}</DialogTitle>
          <DialogDescription>
            Build a custom {formType === "payment" ? "payment" : "consulation"} form with dynamic fields. These fields
            are stored locally for your tenant.
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Selection (Optional) */}
        {customerId && invoices.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Select Invoice (Optional)
            </label>
           
            <Select value={selectedInvoiceId} onValueChange={handleInvoiceSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an invoice to auto-fill form..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {invoices.map((invoice: any) => {
                  const invoiceNumber = invoice.invoiceNumber || invoice.invoice_number || `INV-${invoice.id}`;
                  const invoiceAmount = invoice.totalAmount || invoice.total_amount || invoice.amount || 0;
                  const invoiceDate = invoice.issueDate || invoice.issue_date || invoice.createdAt;
                  const dateStr = invoiceDate ? new Date(invoiceDate).toLocaleDateString() : "";
                  return (
                    <SelectItem key={invoice.id} value={invoice.id?.toString() || invoiceNumber}>
                      {invoiceNumber} {dateStr ? `(${dateStr})` : ""} - ₹{invoiceAmount.toLocaleString()}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Form Layout Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="Field label (e.g., Session Title)"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Select
                      value={newFieldType}
                      onValueChange={(value) =>
                        setNewFieldType(value as ConsulationFieldType)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose field type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FIELD_TYPE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddField}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                  {fields.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-500">
                      No fields yet. Add one to start building your form.
                    </div>
                  ) : (
                    fields.map((field) => (
                      <div
                        key={field.id}
                        className={`border rounded-lg p-4 space-y-3 bg-white ${draggedFieldId === field.id
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200"
                          }`}
                        draggable
                        onDragStart={() => handleDragStart(field.id)}
                        onDragOver={(event) => handleDragOver(event, field.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-gray-500">
                            <GripVertical className="h-4 w-4" />
                            <span className="text-xs uppercase tracking-wide">
                              Drag
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveField(field.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        <Input
                          value={field.label}
                          onChange={(e) =>
                            handleFieldChange(
                              field.id,
                              "label",
                              e.target.value,
                            )
                          }
                        />

                        <div className="flex items-center justify-between gap-3">
                          <Select
                            value={field.type}
                            onValueChange={(value) =>
                              handleFieldChange(
                                field.id,
                                "type",
                                value as ConsulationFieldType,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(FIELD_TYPE_LABELS).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!!field.required}
                              onCheckedChange={(checked) =>
                                handleFieldChange(field.id, "required", checked)
                              }
                            />
                            <span className="text-sm text-gray-600">
                              Required
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                  <CardTitle className="text-base">
                    {formType === "payment" ? "Payment" : "Consulation"} Form Preview
                  </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
                  {fields.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Add fields on the left to preview the consulation form.
                    </p>
                  ) : (
                    fields.map((field) => (
                      <div
                        key={field.id}
                        className={`space-y-2 ${["title", "price"].includes(field.type) ? "" : "md:col-span-2"
                          }`}
                      >

                        <label
                          htmlFor={field.id}
                          className="text-sm font-medium text-gray-700 flex items-center gap-1"
                        >
                          {field.label}
                          {field.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        {field.type === "image" && (defaultImageUrls[field.id]?.length > 0 || defaultImageFiles[field.id]?.length > 0) ? (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600 font-medium">
                              Default Images ({(defaultImageUrls[field.id]?.length || 0) + (defaultImageFiles[field.id]?.length || 0)}):
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {/* Show files that haven't been uploaded yet */}
                              {defaultImageFiles[field.id]?.map((file, index) => (
                                <div
                                  key={`preview-file-${index}`}
                                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const previewUrl = defaultImagePreviews[field.id]?.[index];
                                      if (previewUrl) {
                                        setViewingImage({ url: previewUrl, name: file.name });
                                      }
                                    }}
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                  >
                                    Image {index + 1}: {file.name}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeDefaultImage(field.id, index);
                                    }}
                                    className="text-red-500 hover:text-red-700 ml-1"
                                    aria-label={`Remove ${file.name}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              {/* Show URLs (uploaded images) */}
                              {defaultImageUrls[field.id]?.map((url, index) => {
                                const urlParts = url.split("/");
                                const filename = urlParts[urlParts.length - 1] || `Image ${(defaultImageFiles[field.id]?.length || 0) + index + 1}`;
                                const imageIndex = (defaultImageFiles[field.id]?.length || 0) + index + 1;
                                return (
                                  <div
                                    key={`preview-url-${index}`}
                                    className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const normalizedUrl = url.startsWith('http') || url.startsWith('https')
                                          ? url
                                          : url.startsWith('/')
                                            ? url
                                            : `/${url}`;
                                        setViewingImage({ url: normalizedUrl, name: filename });
                                      }}
                                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                    >
                                      Image {imageIndex}: {filename.length > 20 ? filename.substring(0, 20) + "..." : filename}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeDefaultImage(field.id, (defaultImageFiles[field.id]?.length || 0) + index);
                                      }}
                                      className="text-red-500 hover:text-red-700 ml-1"
                                      aria-label={`Remove ${filename}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-gray-500">
                              Click image names to view. These are default values that will be pre-filled in the form.
                            </p>
                          </div>
                        ) : (
                          renderFieldInput(field)
                        )}
                      </div>
                    ))
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={fields.length === 0}
                  >
                    Save {formType === "payment" ? "Payment" : "Consulation"} Form
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
      
      {/* Image Viewing Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingImage?.name || "File Preview"}</DialogTitle>
          </DialogHeader>
          {viewingImage && (
            <div className="flex items-center justify-center p-4">
              <img
                src={viewingImage.url.startsWith('http') || viewingImage.url.startsWith('https') 
                  ? viewingImage.url 
                  : viewingImage.url.startsWith('/') 
                    ? viewingImage.url 
                    : `/${viewingImage.url}`}
                alt={viewingImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded-md"
                onError={(e) => {
                  console.error("Image load error:", viewingImage.url);
                  (e.target as HTMLImageElement).src = "/placeholder-image.png";
                }}
                onLoad={() => {
                  console.log("Image loaded successfully:", viewingImage.url);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

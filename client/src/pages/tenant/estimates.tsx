import { useState, useRef, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/layout";
import { EstimatePreview } from "@/components/estimates/estimate-preview";
import { EmailEstimateDialog } from "@/components/estimates/email-estimate-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { DateFilter } from "@/components/ui/date-filter";
import { buildDateFilters } from "@/lib/date-filter-helpers";
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
}

export default function Estimates() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [previewEstimate, setPreviewEstimate] = useState<FullEstimate | null>(
    null,
  );
  const [emailEstimate, setEmailEstimate] = useState<Estimate | null>(null);
  const [showAnalyticsSheet, setShowAnalyticsSheet] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

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
    currency: "USD",
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

  // Fetch estimates with search, status, and date filters
  const { data: estimates = [], isLoading } = useQuery<Estimate[]>({
    queryKey: [
      `/api/estimates`,
      searchTerm,
      statusFilter,
      dateFilter,
      customDateFrom,
      customDateTo,
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

      const url = queryParams.toString()
        ? `/api/estimates?${queryParams.toString()}`
        : `/api/estimates`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.estimates || [];
    },
  });

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
      0,
    ),
    discountAmount:
      formData.lineItems.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0,
      ) *
      (parseFloat(formData.discountPercentage) / 100),
    taxAmount:
      formData.lineItems.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0,
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
        currency: "USD",
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

  const handleDownloadPDF = async (estimate: Estimate) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      const response = await fetch(`/api/estimates/${estimate.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `estimate-${estimate.estimateNumber}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
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
      0,
    );
    const acceptedValue = estimates
      .filter((est) => est.status === "accepted")
      .reduce(
        (sum, est) => sum + parseFloat(est.totalAmount?.toString() || "0"),
        0,
      );
    const pendingValue = estimates
      .filter((est) => ["draft", "sent", "viewed"].includes(est.status || ""))
      .reduce(
        (sum, est) => sum + parseFloat(est.totalAmount?.toString() || "0"),
        0,
      );
    const conversionRate =
      estimates.length > 0
        ? (estimates.filter((est) => est.status === "accepted").length /
            estimates.length) *
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
      [] as Array<{ month: string; value: number; count: number }>,
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
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 font-medium">
                              Total
                            </p>
                            <p className="text-xl font-bold text-blue-700">
                              {analytics.totalEstimates}
                            </p>
                          </div>
                          <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium">
                              Accepted
                            </p>
                            <p className="text-xl font-bold text-green-700">
                              ${analytics.acceptedValue.toLocaleString()}
                            </p>
                          </div>
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-600 font-medium">
                              Total Value
                            </p>
                            <p className="text-xl font-bold text-purple-700">
                              ${analytics.totalValue.toLocaleString()}
                            </p>
                          </div>
                          <DollarSign className="h-6 w-6 text-purple-500" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-cyan-600 font-medium">
                              Conv. Rate
                            </p>
                            <p className="text-xl font-bold text-cyan-700">
                              {analytics.conversionRate.toFixed(1)}%
                            </p>
                          </div>
                          <AlertTriangle className="h-6 w-6 text-cyan-500" />
                        </div>
                      </div>
                    </div>

                    {/* Status Distribution Pie Chart */}
                    {chartData.statusData.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Status Distribution
                          </CardTitle>
                          <CardDescription>
                            Breakdown of estimates by status
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartData.statusData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                  }
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {chartData.statusData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Monthly Value Trends Bar Chart */}
                    {chartData.monthlyData.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Monthly Value Trends
                          </CardTitle>
                          <CardDescription>
                            Estimate values by month
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis
                                  tickFormatter={(value) =>
                                    `$${value.toLocaleString()}`
                                  }
                                />
                                <Tooltip
                                  formatter={(value: any) => [
                                    `$${Number(value).toLocaleString()}`,
                                    "Value",
                                  ]}
                                  labelFormatter={(label) => `Month: ${label}`}
                                />
                                <Bar
                                  dataKey="value"
                                  fill="#3B82F6"
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Status Breakdown List */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Detailed Status Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {estimateStatuses.map((status) => {
                            const count = estimates.filter(
                              (est) => est.status === status.value,
                            ).length;
                            const value = estimates
                              .filter((est) => est.status === status.value)
                              .reduce(
                                (sum, est) =>
                                  sum +
                                  parseFloat(
                                    est.totalAmount?.toString() || "0",
                                  ),
                                0,
                              );
                            return (
                              <div
                                key={status.value}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge className={status.color}>
                                    {status.label}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    {count} estimates
                                  </span>
                                </div>
                                <span className="font-semibold text-gray-900">
                                  ${value.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Filters Section */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by estimate number, customer name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-estimates"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {estimateStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <DateFilter
                  value={dateFilter}
                  onChange={setDateFilter}
                  customDateFrom={customDateFrom}
                  customDateTo={customDateTo}
                  onCustomDateFromChange={setCustomDateFrom}
                  onCustomDateToChange={setCustomDateTo}
                />
              </div>
            </CardContent>
          </Card>

          {/* New Estimate Button - Separate Row */}
          <div className="flex justify-end">
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
                        value={formData.currency}
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
                                  parseInt(e.target.value) || 1,
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
                                  e.target.value,
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
                                  e.target.value,
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
                                value={`$${item.totalPrice.toFixed(2)}`}
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
                                e.target.value,
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
                          <span>${totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Discount:</span>
                          <span>-${totals.discountAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>${totals.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-primary">
                          <span>Total:</span>
                          <span>${totals.total.toFixed(2)}</span>
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

          {/* Estimates Grid */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Estimates List</CardTitle>
                  <CardDescription>
                    {estimates.length === 0
                      ? "No estimates found. Create your first estimate to get started."
                      : `Showing ${estimates.length} estimate${estimates.length !== 1 ? "s" : ""}`}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Search Filter */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search estimates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 pl-9"
                      data-testid="input-search-estimates"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger
                      className="w-40"
                      data-testid="select-status-filter"
                    >
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      {estimateStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date Filter */}
                  <DateFilter
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    customDateFrom={customDateFrom}
                    setCustomDateFrom={setCustomDateFrom}
                    customDateTo={customDateTo}
                    setCustomDateTo={setCustomDateTo}
                  />

                  {/* View Toggle */}
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant={viewMode === "card" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("card")}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {estimates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No estimates
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new estimate.
                  </p>
                  <div className="mt-6">
                    <Link href="/estimates/create">
                      <Button data-testid="button-new-estimate-empty">
                        <Plus className="mr-2 h-4 w-4" />
                        New Estimate
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {estimates.map((estimate) => (
                    <Card
                      key={estimate.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold">
                            {estimate.estimateNumber}
                          </CardTitle>
                          {getStatusBadge(estimate.status)}
                        </div>
                        <CardDescription className="text-sm">
                          {estimate.customerName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 font-medium text-green-600">
                            <DollarSign className="w-4 h-4" />$
                            {estimate.totalAmount}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(estimate.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span className="truncate">
                            {estimate.customerEmail}
                          </span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handlePreviewEstimate(estimate)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => setEmailEstimate(estimate)}
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            Email
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPDF(estimate)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* List View Header */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-md font-medium text-sm text-gray-700">
                    <div className="col-span-2">Estimate #</div>
                    <div className="col-span-2">Customer</div>
                    <div className="col-span-2">Email</div>
                    <div className="col-span-1">Amount</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                  {/* List View Items */}
                  {estimates.map((estimate) => (
                    <div
                      key={estimate.id}
                      className="grid grid-cols-12 gap-4 px-4 py-3 bg-white border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="col-span-2 font-medium">
                        {estimate.estimateNumber}
                      </div>
                      <div className="col-span-2 truncate">
                        {estimate.customerName}
                      </div>
                      <div className="col-span-2 truncate text-sm text-gray-600">
                        {estimate.customerEmail}
                      </div>
                      <div className="col-span-1 font-semibold text-green-600">
                        ${estimate.totalAmount}
                      </div>
                      <div className="col-span-1">
                        {getStatusBadge(estimate.status)}
                      </div>
                      <div className="col-span-2 text-sm text-gray-600">
                        {new Date(estimate.createdAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewEstimate(estimate)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setEmailEstimate(estimate)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(estimate)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview and Email Dialogs - Moved outside main content for proper modal display */}
          {previewEstimate && (
            <Dialog
              open={!!previewEstimate}
              onOpenChange={(open) => !open && setPreviewEstimate(null)}
            >
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Estimate Preview - {previewEstimate?.estimateNumber}
                  </DialogTitle>
                  <DialogDescription>
                    Preview of estimate for {previewEstimate?.customerName}
                  </DialogDescription>
                </DialogHeader>
                <EstimatePreview estimate={previewEstimate as any} />
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
    </Layout>
  );
}

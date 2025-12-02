import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EnhancedTable, TableColumn } from "@/components/ui/enhanced-table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/layout";
import { DateFilter } from "@/components/ui/date-filter";
import { buildDateFilters } from "@/lib/date-filter-helpers";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { 
  Plus, DollarSign, Receipt, Building2, Calendar, CreditCard, 
  Search, Filter, Grid, List, MoreHorizontal, Trash2, 
  Edit, Eye, CheckCircle, XCircle, AlertCircle, Clock,
  Download, FileText, Tag, TrendingUp, Users, Package,
  MapPin, Wallet, Calculator, RefreshCw, Archive, BarChart3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Expense {
  id: number;
  expense_number?: string | null;
  title: string;
  description?: string;
  quantity?: number;
  amount: string;
  currency: string;
  category: string;
  subcategory?: string;
  expenseDate: string;
  paymentMethod: string;
  paymentReference?: string;
  vendorId?: number;
  vendorName?: string;
  leadTypeId?: number;
  leadTypeName?: string;
  leadTypeColor?: string;
  expenseType?: string;
  receiptUrl?: string;
  taxAmount: string;
  taxRate: string;
  amountPaid?: string | number;
  amountDue?: string | number;
  isReimbursable: boolean;
  isRecurring: boolean;
  recurringFrequency?: string;
  status: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: number;
  createdByName?: string;
}

interface Vendor {
  id: number;
  name: string;
  status: string;
}

interface LeadType {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  displayOrder: number;
}

const EXPENSE_CATEGORIES = [
  { value: "travel", label: "Travel & Transportation", icon: "🚗", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "office", label: "Office Supplies", icon: "🏢", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
  { value: "marketing", label: "Marketing & Advertising", icon: "📢", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "software", label: "Software & Tools", icon: "💻", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "meals", label: "Meals & Entertainment", icon: "🍽️", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "training", label: "Training & Education", icon: "📚", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  { value: "equipment", label: "Equipment & Hardware", icon: "⚙️", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "communication", label: "Communication", icon: "📞", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  { value: "utilities", label: "Utilities", icon: "⚡", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "other", label: "Other", icon: "📦", color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" }
];

const EXPENSE_TYPES = [
  { value: "purchase", label: "Purchase", description: "One-time purchase" },
  { value: "lease", label: "Lease", description: "Monthly lease payment" },
  { value: "rental", label: "Rental", description: "Temporary rental" },
  { value: "subscription", label: "Subscription", description: "Recurring subscription" },
  { value: "service", label: "Service", description: "Professional service" }
];

const PAYMENT_METHODS = [
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "debit_card", label: "Debit Card", icon: CreditCard },
  { value: "bank_transfer", label: "Bank Transfer", icon: Building2 },
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "check", label: "Check", icon: FileText },
  { value: "petty_cash", label: "Petty Cash", icon: Receipt }
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: Clock },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle },
  { value: "paid", label: "Paid", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: DollarSign }
];

export default function Expenses() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAnalyticsSheet, setShowAnalyticsSheet] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "USD",
    category: "",
    subcategory: "",
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: "credit_card",
    paymentReference: "",
    vendorId: "none",
    leadTypeId: "none",
    expenseType: "purchase",
    receiptUrl: "",
    taxAmount: "0",
    taxRate: "0",
    isReimbursable: false,
    isRecurring: false,
    recurringFrequency: "",
    status: "pending",
    tags: [] as string[],
    notes: "",
  });

  // Map frontend column keys to database column names
  const getSortColumnName = (columnKey: string): string => {
    const columnMap: Record<string, string> = {
      title: "title",
      category: "category",
      amount: "amount",
      status: "status",
      expenseDate: "expense_date",
      vendorName: "vendor_name",
      createdAt: "created_at",
    };
    return columnMap[columnKey] || columnKey;
  };

  // Handle sort change
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to desc
      setSortColumn(columnKey);
      setSortDirection('desc');
    }
  };

  // Fetch expenses with comprehensive filtering, pagination, and sorting
  const { data: rawExpenses = [], isLoading, error } = useQuery<any[]>({
    queryKey: [
      "/api/expenses",
      searchQuery,
      statusFilter,
      categoryFilter,
      dateFilter,
      customDateFrom,
      customDateTo,
      currentPage,
      itemsPerPage,
      sortColumn,
      sortDirection,
    ],
    queryFn: async () => {
      const dateFilters = buildDateFilters(dateFilter, customDateFrom, customDateTo);
      console.log("🔍 Fetching expenses with filters:", {
        searchQuery,
        statusFilter,
        categoryFilter,
        dateFilters,
        currentPage,
        itemsPerPage,
      });
      
      // Build query parameters for all filters
      const queryParams = new URLSearchParams();
      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }
      if (statusFilter && statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }
      if (categoryFilter && categoryFilter !== "all") {
        queryParams.append("category", categoryFilter);
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
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", itemsPerPage.toString());
      
      // Add sorting parameters
      if (sortColumn) {
        queryParams.append("sortBy", getSortColumnName(sortColumn));
        queryParams.append("sortOrder", sortDirection);
      }
      
      const url = queryParams.toString() 
        ? `/api/expenses?${queryParams.toString()}`
        : `/api/expenses`;
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) return [];
      const result = await response.json();
      
      // Handle paginated response structure
      if (result && typeof result === "object" && "data" in result && "pagination" in result) {
        setTotalItems(result.pagination?.total || 0);
        return result.data;
      }

      // Handle old paginated response structure (with total at root)
      if (result && typeof result === "object" && "data" in result) {
        setTotalItems(result.total || 0);
        return result.data;
      }

      // If it's a direct array, set total to array length
      if (Array.isArray(result)) {
        setTotalItems(result.length);
        return result;
      }

      // Fallback for other response formats
      const expenses = result.expenses || [];
      setTotalItems(expenses.length);
      return expenses;
    },
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: leadTypes = [] } = useQuery<LeadType[]>({
    queryKey: ["/api/lead-types"],
  });

  // Helper function to normalize tags to an array
  const normalizeTags = (tags: any): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // If it's not JSON, treat as comma-separated string
        return tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      }
    }
    return [];
  };

  // Transform and filter expenses
  const expenses = rawExpenses
    .map((expense: any) => ({
      id: expense.id,
      expense_number: expense.expense_number,
      title: expense.title,
      description: expense.description,
      quantity: expense.quantity,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      subcategory: expense.subcategory,
      expenseDate: expense.expense_date,
      paymentMethod: expense.payment_method,
      paymentReference: expense.payment_reference,
      vendorId: expense.vendor_id,
      vendorName: expense.vendor_name,
      leadTypeId: expense.lead_type_id,
      leadTypeName: expense.lead_type_name,
      leadTypeColor: expense.lead_type_color,
      expenseType: expense.expense_type,
      receiptUrl: expense.receipt_url,
      taxAmount: expense.tax_amount,
      taxRate: expense.tax_rate,
      amountPaid: expense.amount_paid,
      amountDue: expense.amount_due,
      isReimbursable: expense.is_reimbursable,
      isRecurring: expense.is_recurring,
      recurringFrequency: expense.recurring_frequency,
      status: expense.status,
      approvedBy: expense.approved_by,
      approvedAt: expense.approved_at,
      rejectionReason: expense.rejection_reason,
      tags: normalizeTags(expense.tags),
      notes: expense.notes,
      createdAt: new Date(expense.created_at),
      updatedAt: expense.updated_at ? new Date(expense.updated_at) : undefined,
      createdBy: expense.created_by,
      createdByName: expense.created_by_name,
    }));

  // Pagination calculations now use totalItems from API metadata
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // No client-side slicing needed - server returns current page data

  // Calculate stats
  const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const reimbursableAmount = expenses
    .filter(exp => exp.isReimbursable)
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const pendingCount = expenses.filter(exp => exp.status === 'pending').length;
  const approvedCount = expenses.filter(exp => exp.status === 'approved').length;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("💰 Creating expense:", data);
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error creating expense:", error);
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => {
      console.log("💰 Updating expense:", id, data);
      return apiRequest("PUT", `/api/expenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setEditingExpense(null);
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error updating expense:", error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ expenseId, status }: { expenseId: number; status: string }) => {
      const token = auth.getToken();
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update expense status: ${response.status} - ${errorText}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Expense status has been updated successfully.",
      });

      queryClient.invalidateQueries({
        queryKey: ["/api/expenses"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Status Update Failed",
        description:
          error.message || "Failed to update expense status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      amount: "",
      currency: "USD",
      category: "",
      subcategory: "",
      expenseDate: new Date().toISOString().split('T')[0],
      paymentMethod: "credit_card",
      paymentReference: "",
      vendorId: "none",
      leadTypeId: "none",
      expenseType: "purchase",
      receiptUrl: "",
      taxAmount: "0",
      taxRate: "0",
      isReimbursable: false,
      isRecurring: false,
      recurringFrequency: "",
      status: "pending",
      tags: [],
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      vendorId: formData.vendorId && formData.vendorId !== "none" ? parseInt(formData.vendorId) : null,
      leadTypeId: formData.leadTypeId && formData.leadTypeId !== "none" ? parseInt(formData.leadTypeId) : null,
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (expense: Expense) => {
    // Invalidate the query cache for this expense to force a fresh fetch
    queryClient.invalidateQueries({
      queryKey: ["/api/expenses", expense.id],
    });
    // Navigate to expense create page with ID for editing
    navigate(`/expenses/create/${expense.id}`);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: string, currency: string = "USD") => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(num);
  };

  const getCategoryConfig = (category: string) => {
    return EXPENSE_CATEGORIES.find(cat => cat.value === category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
  };

  const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const getPaymentMethodConfig = (method: string) => {
    return PAYMENT_METHODS.find(pm => pm.value === method) || PAYMENT_METHODS[0];
  };

  // Column definitions for the enhanced table
  const expenseColumns: TableColumn<Expense>[] = [
    {
      key: "title",
      label: "Expense Details",
      sortable: true,
      render: (title, expense) => (
        <div className="space-y-1">
          <div className="font-medium">{title}</div>
          {expense.description && (
            <div className="text-sm text-muted-foreground">
              {expense.description.length > 50 
                ? `${expense.description.substring(0, 50)}...` 
                : expense.description
              }
            </div>
          )}
          {Array.isArray(expense.tags) && expense.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {expense.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {expense.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{expense.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (category) => {
        const categoryConfig = getCategoryConfig(category);
        return (
          <Badge className={categoryConfig.color}>
            <span className="mr-1">{categoryConfig.icon}</span>
            {categoryConfig.label}
          </Badge>
        );
      },
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (amount, expense) => (
        <div className="space-y-1">
          <div className="font-medium">
            {formatCurrency(amount, expense.currency)}
          </div>
          {expense.isReimbursable && (
            <Badge variant="outline" className="text-xs">
              Reimbursable
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (status, expense) => {
        const statusConfig = getStatusConfig(status || "pending");
        return (
          <Select
            value={status || "pending"}
            onValueChange={(value) => {
              updateStatusMutation.mutate({
                expenseId: expense.id,
                status: value,
              });
            }}
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger className={`w-[140px] h-8 ${statusConfig.color} border-0`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((statusOption) => (
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
      key: "expenseDate",
      label: "Date",
      sortable: true,
      render: (expenseDate) => (
        <div className="text-sm">
          {expenseDate 
            ? new Date(expenseDate).toLocaleDateString() 
            : "N/A"}
        </div>
      ),
    },
    {
      key: "vendorName",
      label: "Vendor",
      sortable: true,
      render: (vendorName) => (
        vendorName ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{vendorName}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No vendor</span>
        )
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-right",
      render: (_, expense) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedExpense(expense);
              setShowDetailsDialog(true);
            }}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(expense)}
            title="Edit Expense"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {expense.receiptUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(expense.receiptUrl, '_blank')}
              className="text-blue-600 hover:text-blue-700"
              title="Download Receipt"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(expense.id)}
            className="text-red-600 hover:text-red-700"
            title="Delete Expense"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Card className="p-6">
            <CardContent className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Error Loading Expenses</h3>
              <p className="text-red-600 dark:text-red-400 mt-2">Failed to load expense data. Please try again.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/expenses"] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 w-full space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Expense Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track, manage, and analyze your business expenses efficiently
            </p>
          </div>
          <div className="flex gap-3">
            {/* Analytics Button */}
            <Sheet open={showAnalyticsSheet} onOpenChange={setShowAnalyticsSheet}>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="!w-1/2 !max-w-none overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Expense Analytics
                  </SheetTitle>
                  <SheetDescription>
                    Comprehensive overview of your expense performance and metrics
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Expenses</p>
                          <p className="text-xl font-bold text-blue-700">{formatCurrency(totalAmount.toString())}</p>
                        </div>
                        <DollarSign className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-yellow-600 font-medium">Pending</p>
                          <p className="text-xl font-bold text-yellow-700">{pendingCount}</p>
                        </div>
                        <Clock className="h-6 w-6 text-yellow-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">Approved</p>
                          <p className="text-xl font-bold text-green-700">{approvedCount}</p>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Reimbursable</p>
                          <p className="text-xl font-bold text-purple-700">{formatCurrency(reimbursableAmount.toString())}</p>
                        </div>
                        <Receipt className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Status Distribution Chart */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Pending', value: pendingCount, fill: '#EAB308' },
                              { name: 'Approved', value: approvedCount, fill: '#22C55E' },
                              { name: 'Rejected', value: expenses.filter(exp => exp.status === 'rejected').length, fill: '#EF4444' },
                              { name: 'Paid', value: expenses.filter(exp => exp.status === 'paid').length, fill: '#3B82F6' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Category Distribution Chart */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={EXPENSE_CATEGORIES.map(category => ({
                            name: category.label.split(' & ')[0],
                            value: expenses.filter(exp => exp.category === category.value).length,
                            amount: expenses.filter(exp => exp.category === category.value).reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
                          })).filter(item => item.value > 0)}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [name === 'value' ? `${value} expenses` : `$${value}`, name === 'value' ? 'Count' : 'Amount']} />
                          <Bar dataKey="value" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <Link href="/expenses/create">
              <Button 
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg"
                data-testid="button-add-expense"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </Link>
          </div>
        </div>


        {/* Filters and Search Section */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses, vendors, descriptions..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      <span className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map(status => (
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
            
            <div className="flex items-center gap-2">
              {/* <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button> */}
              {/* <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button> */}
            </div>
          </div>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle>Expense List</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedTable
              data={expenses}
              columns={expenseColumns}
              isLoading={isLoading}
              showPagination={false}
              emptyMessage="No expenses found. Create your first expense to get started."
              externalSort={{
                sortColumn: sortColumn,
                sortDirection: sortDirection,
                onSort: handleSort,
              }}
            />
            {/* Backend Pagination Controls */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} expenses
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="pageSize" className="text-sm text-gray-500">
                    Show:
                  </Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1); // Reset to first page when changing page size
                    }}
                  >
                    <SelectTrigger id="pageSize" className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {totalPages > 1 && (
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        // Show all pages if 5 or fewer
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        // Show first 5 pages
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // Show last 5 pages
                        pageNum = totalPages - 4 + i;
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
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grid View - keeping for now but can be removed if not needed */}
        {viewMode === "grid" && expenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expenses Grid View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {expenses.map((expense) => {
                  const categoryConfig = getCategoryConfig(expense.category);
                  const statusConfig = getStatusConfig(expense.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <Card key={expense.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{expense.title}</CardTitle>
                            <Badge className={categoryConfig.color} variant="secondary">
                              <span className="mr-1">{categoryConfig.icon}</span>
                              {categoryConfig.label}
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(expense.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">
                              {formatCurrency(expense.amount, expense.currency)}
                            </span>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          
                          {expense.description && (
                            <p className="text-sm text-muted-foreground">
                              {expense.description.length > 80 
                                ? `${expense.description.substring(0, 80)}...` 
                                : expense.description
                              }
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {expense.expenseDate 
                              ? new Date(expense.expenseDate).toLocaleDateString() 
                              : "N/A"}
                          </div>
                          
                          {expense.vendorName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              {expense.vendorName}
                            </div>
                          )}
                          
                          {Array.isArray(expense.tags) && expense.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {expense.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {expense.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{expense.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Expense Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? "Edit Expense" : "Create New Expense"}
              </DialogTitle>
              <DialogDescription>
                {editingExpense 
                  ? "Update the expense details below."
                  : "Fill in the details to add a new expense to your records."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Expense Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter expense title"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.currency} 
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        required
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter expense description"
                    rows={3}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Categorization */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Categorization</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            <span className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              {category.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Input
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="Enter subcategory"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expenseType">Expense Type</Label>
                    <Select 
                      value={formData.expenseType} 
                      onValueChange={(value) => setFormData({ ...formData, expenseType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Date and Payment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Date & Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expenseDate">Expense Date *</Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={formData.expenseDate}
                      onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(method => {
                          const Icon = method.icon;
                          return (
                            <SelectItem key={method.value} value={method.value}>
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {method.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentReference">Payment Reference</Label>
                    <Input
                      id="paymentReference"
                      value={formData.paymentReference}
                      onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                      placeholder="Transaction ID, check number, etc."
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Associations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Associations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendorId">Vendor</Label>
                    <Select 
                      value={formData.vendorId} 
                      onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No vendor</SelectItem>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="leadTypeId">Lead Type</Label>
                    <Select 
                      value={formData.leadTypeId} 
                      onValueChange={(value) => setFormData({ ...formData, leadTypeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No lead type</SelectItem>
                        {leadTypes.map(leadType => (
                          <SelectItem key={leadType.id} value={leadType.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: leadType.color }}
                              />
                              {leadType.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Tax Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tax Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxAmount">Tax Amount</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.taxAmount}
                      onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isReimbursable">Reimbursable Expense</Label>
                      <div className="text-sm text-muted-foreground">
                        This expense should be reimbursed to the employee
                      </div>
                    </div>
                    <Switch
                      id="isReimbursable"
                      checked={formData.isReimbursable}
                      onCheckedChange={(checked) => setFormData({ ...formData, isReimbursable: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isRecurring">Recurring Expense</Label>
                      <div className="text-sm text-muted-foreground">
                        This is a recurring expense that happens regularly
                      </div>
                    </div>
                    <Switch
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
                    />
                  </div>
                  
                  {formData.isRecurring && (
                    <div className="space-y-2">
                      <Label htmlFor="recurringFrequency">Recurring Frequency</Label>
                      <Select 
                        value={formData.recurringFrequency} 
                        onValueChange={(value) => setFormData({ ...formData, recurringFrequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiptUrl">Receipt URL</Label>
                    <Input
                      id="receiptUrl"
                      type="url"
                      value={formData.receiptUrl}
                      onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                      placeholder="https://example.com/receipt.pdf"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes about this expense"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              {/* Submit Actions */}
              <div className="flex items-center justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingExpense(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editingExpense ? "Updating..." : "Creating..."}
                    </div>
                  ) : (
                    editingExpense ? "Update Expense" : "Create Expense"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Expense Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Expense Details</DialogTitle>
              <DialogDescription>
                Complete information about this expense
              </DialogDescription>
            </DialogHeader>
            
            {selectedExpense && (
              <div className="space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedExpense.title}</h3>
                    {selectedExpense.description && (
                      <p className="text-muted-foreground mt-1">{selectedExpense.description}</p>
                    )}
                    {selectedExpense.expense_number && (
                      <p className="text-sm text-muted-foreground mt-1">Expense Number: {selectedExpense.expense_number}</p>
                    )}
                  </div>
                  <Badge className={getStatusConfig(selectedExpense.status).color}>
                    {getStatusConfig(selectedExpense.status).label}
                  </Badge>
                </div>
                
                {/* Financial Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Amount</span>
                      </div>
                      <div className="text-xl font-bold">
                        {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {selectedExpense.quantity && selectedExpense.quantity > 1 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Quantity</span>
                        </div>
                        <div className="text-xl font-bold">
                          {selectedExpense.quantity}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {selectedExpense.amountPaid !== undefined && selectedExpense.amountPaid !== null && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Amount Paid</span>
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(selectedExpense.amountPaid.toString(), selectedExpense.currency)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {selectedExpense.amountDue !== undefined && selectedExpense.amountDue !== null && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium">Amount Due</span>
                        </div>
                        <div className="text-xl font-bold text-orange-600">
                          {formatCurrency(selectedExpense.amountDue.toString(), selectedExpense.currency)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {/* Category and Type */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Category</span>
                      </div>
                      <Badge className={getCategoryConfig(selectedExpense.category).color}>
                        <span className="mr-1">{getCategoryConfig(selectedExpense.category).icon}</span>
                        {getCategoryConfig(selectedExpense.category).label}
                      </Badge>
                      {selectedExpense.subcategory && (
                        <div className="text-sm text-muted-foreground mt-2">
                          Subcategory: {selectedExpense.subcategory}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Expense Type</span>
                      </div>
                      <div className="text-sm capitalize">{selectedExpense.expenseType || "purchase"}</div>
                      {selectedExpense.isReimbursable && (
                        <Badge variant="outline" className="mt-2">
                          Reimbursable
                        </Badge>
                      )}
                      {selectedExpense.isRecurring && (
                        <Badge variant="outline" className="mt-2 ml-2">
                          Recurring {selectedExpense.recurringFrequency && `(${selectedExpense.recurringFrequency})`}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Details Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Expense Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Expense Date:</span>
                        <span className="ml-2">{new Date(selectedExpense.expenseDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="font-medium">Payment Method:</span>
                        <span className="ml-2 capitalize">{selectedExpense.paymentMethod.replace(/_/g, ' ')}</span>
                      </div>
                      {selectedExpense.paymentReference && (
                        <div>
                          <span className="font-medium">Payment Reference:</span>
                          <span className="ml-2">{selectedExpense.paymentReference}</span>
                        </div>
                      )}
                      {selectedExpense.vendorName && (
                        <div>
                          <span className="font-medium">Vendor:</span>
                          <span className="ml-2">{selectedExpense.vendorName}</span>
                        </div>
                      )}
                      {selectedExpense.leadTypeName && (
                        <div>
                          <span className="font-medium">Lead Type:</span>
                          <span className="ml-2 flex items-center gap-2">
                            {selectedExpense.leadTypeColor && (
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: selectedExpense.leadTypeColor }}
                              />
                            )}
                            {selectedExpense.leadTypeName}
                          </span>
                        </div>
                      )}
                      {selectedExpense.createdByName && (
                        <div>
                          <span className="font-medium">Created By:</span>
                          <span className="ml-2">{selectedExpense.createdByName}</span>
                        </div>
                      )}
                      {selectedExpense.createdAt && (
                        <div>
                          <span className="font-medium">Created At:</span>
                          <span className="ml-2">{new Date(selectedExpense.createdAt).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedExpense.updatedAt && (
                        <div>
                          <span className="font-medium">Updated At:</span>
                          <span className="ml-2">{new Date(selectedExpense.updatedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Tax Information */}
                {(parseFloat(selectedExpense.taxAmount?.toString() || "0") > 0 || parseFloat(selectedExpense.taxRate?.toString() || "0") > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tax Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Tax Rate:</span>
                          <span className="ml-2">{selectedExpense.taxRate}%</span>
                        </div>
                        <div>
                          <span className="font-medium">Tax Amount:</span>
                          <span className="ml-2">{formatCurrency(selectedExpense.taxAmount, selectedExpense.currency)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Approval Information */}
                {(selectedExpense.status === "approved" || selectedExpense.status === "rejected") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Approval Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {selectedExpense.approvedAt && (
                          <div>
                            <span className="font-medium">Approved At:</span>
                            <span className="ml-2">{new Date(selectedExpense.approvedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {selectedExpense.approvedBy && (
                          <div>
                            <span className="font-medium">Approved By:</span>
                            <span className="ml-2">User ID: {selectedExpense.approvedBy}</span>
                          </div>
                        )}
                        {selectedExpense.rejectionReason && (
                          <div className="col-span-2">
                            <span className="font-medium">Rejection Reason:</span>
                            <p className="mt-1 text-muted-foreground">{selectedExpense.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Receipt */}
                {selectedExpense.receiptUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Receipt</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <a 
                        href={selectedExpense.receiptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        View Receipt
                      </a>
                    </CardContent>
                  </Card>
                )}
                
                {/* Tags */}
                {selectedExpense.tags && selectedExpense.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        {selectedExpense.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Notes */}
                {selectedExpense.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="text-sm text-muted-foreground prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedExpense.notes }}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-900">
                  <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setShowDetailsDialog(false);
                    handleEdit(selectedExpense);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Expense
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
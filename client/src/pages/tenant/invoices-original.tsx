import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedTable, TableColumn } from "@/components/ui/enhanced-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertInvoiceSchema,
  type Invoice,
  type InsertInvoice,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Package,
  Download,
  Filter,
  MoreHorizontal,
  Clock,
  Receipt,
  Palette,
  Upload,
  File,
  Image,
  FileSpreadsheet,
  MessageCircle,
} from "lucide-react";
import { z } from "zod";
import TemplateSelector from "@/components/invoices/template-selector";
import { InvoiceData } from "@/components/invoices/invoice-templates";

const passengerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  medicalConditions: z.string().optional(),
  seatPreference: z.string().optional(),
  specialRequests: z.string().optional(),
  isMainPassenger: z.boolean().default(false),
});

const itemSchema = z.object({
  itemName: z.string(),
  description: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  purchasePrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  voucherNo: z.string().optional(),
  invoiceNo: z.string().optional(),
  leadId: z.number().optional().nullable(),
  vendorId: z.number().optional().nullable(),
  totalPrice: z.number().min(0),
  tax: z.number().min(0).optional(),
});

const invoiceFormSchema = z.object({
  tenantId: z.number(),
  customerId: z.number().min(1, "Please select a customer"),
  leadId: z.number().optional().nullable(),
  vendorId: z.number().optional().nullable(),
  leadTypeId: z.number().optional().nullable(),
  bookingId: z.number().optional().nullable(),
  packageId: z.number().optional().nullable(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  status: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  totalAmount: z.number().min(0),
  paidAmount: z.number().min(0).optional(),
  purchasePrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  currency: z.string(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  specialRequests: z.string().optional(),
  paidAt: z.date().optional(),
  travelCategory: z.string().optional(),
  travelDate: z.string().optional(),
  bookingStatus: z.string().optional(),
  paymentStatus: z.string().default("pending"),
  voucherNo: z.string().optional(),
  travelers: z.number().min(1, "At least one traveler is required"),
  bookingData: z.record(z.any()).optional(),
  dynamicData: z.record(z.any()).optional(),
  passengers: z
    .array(passengerSchema)
    .min(1, "At least one passenger is required"),
  items: z.array(itemSchema).optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

const invoiceStatuses = [
  {
    value: "draft",
    label: "Draft",
    color: "bg-gray-100 text-gray-800",
    icon: FileText,
  },
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  {
    value: "paid",
    label: "Paid",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  {
    value: "overdue",
    label: "Overdue",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800",
    icon: FileText,
  },
];

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState([
    {
      itemName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      voucherNo: "",
      invoiceNo: "",
      leadId: null,
      vendorId: null,
      totalPrice: 0,
      tax: 0,
    },
  ]);
  const [passengers, setPassengers] = useState([
    {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      nationality: "",
      passportNumber: "",
      email: "",
      phone: "",
      seatPreference: "",
      dietaryRestrictions: "",
      specialRequests: "",
      isMainPassenger: true,
    },
  ]);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [invoiceForPDF, setInvoiceForPDF] = useState<InvoiceData | null>(null);
  const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<
    number | null
  >(null);

  // Import functionality state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>("");
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  // Preview and verification state
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Debug function to test preview
  const testPreview = () => {
    const testData = [
      {
        invoiceNumber: "TEST-001",
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        totalAmount: 1000,
        status: "pending",
        currency: "USD",
        isDuplicate: false,
        customerMatch: null,
      },
    ];
    setPreviewData(testData);
    setIsPreviewDialogOpen(true);
    console.log("🧪 Test preview opened with data:", testData);
  };

  // Handle URL parameters for highlighting specific invoices
  const [location] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.split("?")[1] || "");
    const highlightParam = urlParams.get("highlight");
    if (highlightParam) {
      const invoiceId = parseInt(highlightParam);
      if (!isNaN(invoiceId)) {
        setHighlightedInvoiceId(invoiceId);
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedInvoiceId(null), 3000);
      }
    }
  }, [location]);

  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get customers using working debug route API
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: [`direct-customers-${tenant?.id}`],
    queryFn: async () => {
      if (!tenant?.id) throw new Error("No tenant ID");

      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!token) throw new Error("No auth token");

      console.log("🔍 Invoices: Fetching customers for tenant:", tenant.id);

      const response = await fetch(
        `/api/customers?action=get-customers&tenantId=${tenant.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }

      const data = await response.json();
      console.log("🔍 Invoices: Customers response:", {
        type: typeof data,
        isArray: Array.isArray(data),
        hasCustomersField: "customers" in data,
        sampleName: data[0]?.name || data.customers?.[0]?.name || "No name",
      });

      // Handle both direct array and wrapped formats
      const customerList = Array.isArray(data) ? data : data.customers || [];
      return customerList;
    },
    enabled: !!tenant?.id,
    retry: 2,
    staleTime: 60000,
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      tenantId: tenant?.id || 1,
      customerId: 1,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      status: "draft",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      subtotal: "0",
      taxAmount: "0",
      discountAmount: "0",
      totalAmount: "0",
      currency: "USD",
      paymentTerms: "30 days",
      notes: "",
    },
  });

  // Get invoices data using original tenant API endpoint
  const {
    data: invoices = [],
    isLoading,
    error: invoicesError,
  } = useQuery<Invoice[]>({
    queryKey: [`/api/tenants/${tenant?.id}/invoices`],
    queryFn: async () => {
      if (!tenant?.id) throw new Error("No tenant ID");

      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!token) throw new Error("No auth token");

      console.log("🔍 Invoices: Fetching invoices for tenant:", tenant.id);

      const response = await fetch(`/api/tenants/${tenant.id}/invoices`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("🔍 Invoices: Fetch failed:", error);
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }

      const data = await response.json();
      console.log("🔍 Invoices: Response received:", {
        type: typeof data,
        isArray: Array.isArray(data),
        keys: Object.keys(data),
        length: Array.isArray(data) ? data.length : "N/A",
        sampleCustomerName: data[0]?.customerName || "No customer name",
      });

      return Array.isArray(data) ? data : [];
    },
    enabled: !!tenant?.id,
    retry: 3,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Get invoice stats
  const {
    data: stats = {
      totalInvoices: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      totalDraft: 0,
      overdueCount: 0,
      draftCount: 0,
    },
  } = useQuery<{
    totalInvoices: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    totalDraft: number;
    overdueCount: number;
    draftCount: number;
  }>({
    queryKey: [`/api/tenants/${tenant?.id}/invoices/stats`],
    enabled: !!tenant?.id,
  });

  const filteredInvoices = (Array.isArray(invoices) ? invoices : []).filter(
    (invoice) => {
      if (!invoice) return false;
      const matchesSearch =
        (invoice.invoiceNumber || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (invoice.customerName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (invoice.notes || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    },
  );

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const invoiceData = {
        ...data,
        issueDate: new Date(data.issueDate).toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
        items: items.filter((item) => item.description.trim() !== ""),
      };

      return apiRequest(
        "POST",
        `/api/tenants/${tenant?.id}/invoices`,
        invoiceData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices/stats`],
      });
      setIsCreateDialogOpen(false);
      form.reset();
      setItems([{ description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
      toast({
        title: "Invoice Created",
        description: "Invoice has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedInvoice) throw new Error("No invoice selected");

      const invoiceData = {
        ...data,
        issueDate: new Date(data.issueDate).toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
      };

      return apiRequest(
        "PUT",
        `/api/tenants/${tenant?.id}/invoices/${selectedInvoice.id}`,
        invoiceData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices/stats`],
      });
      setIsEditDialogOpen(false);
      setSelectedInvoice(null);
      form.reset();
      toast({
        title: "Invoice Updated",
        description: "Invoice has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      return apiRequest(
        "DELETE",
        `/api/tenants/${tenant?.id}/invoices/${invoiceId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices/stats`],
      });
      toast({
        title: "Invoice Deleted",
        description: "Invoice has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const importInvoicesMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest(
        "POST",
        `/api/tenants/${tenant?.id}/invoices/import`,
        formData,
      );
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices/stats`],
      });
      setIsImportDialogOpen(false);
      setImportFile(null);
      setImportType("");
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.count} invoice(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import invoices",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = invoiceStatuses.find((s) => s.value === status);
    return (
      statusConfig || {
        color: "bg-gray-100 text-gray-800",
        label: status,
        icon: FileText,
      }
    );
  };

  const calculateItemTotal = (
    index: number,
    field: "quantity" | "unitPrice",
    value: number,
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index].totalPrice =
      newItems[index].quantity * newItems[index].unitPrice;
    setItems(newItems);

    // Update form totals as strings
    const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = 0.1; // 10% tax
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    form.setValue("subtotal", subtotal.toFixed(2));
    form.setValue("taxAmount", taxAmount.toFixed(2));
    form.setValue("totalAmount", totalAmount.toFixed(2));
  };

  const addItem = () => {
    setItems([
      ...items,
      { description: "", quantity: 1, unitPrice: 0, totalPrice: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  // Convert invoice to template data format

  const convertInvoiceToTemplateData = (invoice: Invoice): InvoiceData => {
    const customer = customers.find((c) => c.id === invoice.customerId);
    const safeParse = (value: any) => parseFloat(value?.toString() || "0");

    return {
      invoiceNumber: invoice.invoiceNumber || "",
      issueDate:
        typeof invoice.issueDate === "string"
          ? invoice.issueDate
          : invoice.issueDate
            ? invoice.issueDate.toISOString()
            : new Date().toISOString(),
      dueDate:
        typeof invoice.dueDate === "string"
          ? invoice.dueDate
          : invoice.dueDate
            ? invoice.dueDate.toISOString()
            : new Date().toISOString(),
      customerName: customer
        ? customer.name ||
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          "Unnamed Customer"
        : "Unknown Customer",
      customerEmail: customer?.email || "",
      customerPhone: customer?.phone || "",
      customerAddress: customer?.address || "",
      companyName: tenant?.companyName || "Your Company",
      companyEmail: tenant?.contactEmail || "",
      companyPhone: tenant?.contactPhone || "",
      companyAddress: tenant?.address || "",
      companyLogo: tenant?.logo || "",
      items: [
        {
          description: "Services rendered",
          quantity: 1,
          unitPrice: safeParse(invoice.subtotal),
          totalPrice: safeParse(invoice.subtotal),
        },
      ],
      subtotal: safeParse(invoice.subtotal),
      taxAmount: safeParse(invoice.taxAmount),
      discountAmount: safeParse(invoice.discountAmount),
      totalAmount: safeParse(invoice.totalAmount),
      currency: invoice.currency || "INR",
      notes: invoice.notes || "",
      paymentTerms: invoice.paymentTerms || "",
    };
  };

  const handleGeneratePDF = (invoice: Invoice) => {
    const templateData = convertInvoiceToTemplateData(invoice);
    setInvoiceForPDF(templateData);
    setIsTemplateSelectorOpen(true);
  };

  const handleShareWhatsApp = (invoice: Invoice) => {
    const customer = customers.find((c) => c.id === invoice.customerId);
    const customerName = customer
      ? customer.name ||
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
        "Valued Customer"
      : "Valued Customer";

    const message = `Hello ${customerName}!

Your invoice details:
📄 Invoice #${invoice.invoiceNumber}
💰 Amount: ${invoice.currency} ${parseFloat(invoice.totalAmount.toString()).toLocaleString()}
📅 Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
📊 Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}

${invoice.notes ? `\nNotes: ${invoice.notes}` : ""}

Thank you for your business!
${tenant?.companyName || "Our Company"}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    // Open WhatsApp in a new window/tab
    window.open(whatsappUrl, "_blank");
  };

  // Import functionality handlers
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);

      // Determine import type based on file extension
      const extension = file.name.toLowerCase().split(".").pop();
      switch (extension) {
        case "csv":
          setImportType("csv");
          break;
        case "xlsx":
        case "xls":
        case "xl":
          setImportType("excel");
          break;
        case "xml":
          setImportType("xml");
          break;
        case "pdf":
          setImportType("pdf");
          break;
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
          setImportType("image");
          break;
        default:
          setImportType("unknown");
      }
    }
  };

  const processImport = async () => {
    if (!importFile || !tenant?.id) return;

    setIsProcessingImport(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("type", importType);

      const response = await fetch(
        `/api/tenants/${tenant.id}/invoices/import`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        },
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.count || 1} invoice(s)`,
        });

        // Refresh the invoices list
        queryClient.invalidateQueries({
          queryKey: [`/api/tenants/${tenant.id}/invoices`],
        });

        // Close import dialog and reset state
        setIsImportDialogOpen(false);
        setImportFile(null);
        setImportType("");
      } else {
        throw new Error(result.message || "Import failed");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description:
          error.message ||
          "Failed to import invoice. Please check the file format and try again.",
      });
    } finally {
      setIsProcessingImport(false);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    form.reset({
      tenantId: invoice.tenantId,
      customerId: invoice.customerId,
      bookingId: invoice.bookingId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate
        ? new Date(invoice.issueDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      subtotal: invoice.subtotal.toString(),
      taxAmount: invoice.taxAmount.toString(),
      discountAmount: invoice.discountAmount.toString(),
      totalAmount: invoice.totalAmount.toString(),
      paidAmount: invoice.paidAmount?.toString() || "0",
      currency: invoice.currency,
      notes: invoice.notes || "",
      paymentTerms: invoice.paymentTerms || undefined,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (invoice: Invoice) => {
    if (
      window.confirm(
        `Are you sure you want to delete invoice ${invoice.invoiceNumber}?`,
      )
    ) {
      deleteInvoiceMutation.mutate(invoice.id);
    }
  };

  // Define table columns with sorting and rendering
  const invoiceColumns: TableColumn<Invoice>[] = [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      sortable: true,
      render: (invoiceNumber) => (
        <div className="font-medium">{invoiceNumber}</div>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (_, invoice) => {
        const customer = customers.find((c) => c.id === invoice.customerId);
        return (
          <div>
            <p className="font-medium">
              {customer
                ? customer.name ||
                  `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                  "Unnamed Customer"
                : "Unknown Customer"}
            </p>
            {customer?.email && (
              <p className="text-sm text-gray-600">{customer.email}</p>
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
        <span>{new Date(issueDate).toLocaleDateString()}</span>
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
          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
            {new Date(dueDate).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: "totalAmount",
      label: "Amount",
      sortable: true,
      render: (totalAmount, invoice) => (
        <div>
          <p className="font-medium">${totalAmount.toLocaleString()}</p>
          {invoice.paidAmount &&
            parseFloat(invoice.paidAmount.toString()) > 0 && (
              <p className="text-sm text-green-600">
                ${invoice.paidAmount.toLocaleString()} paid
              </p>
            )}
        </div>
      ),
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
            onClick={() => handleGeneratePDF(invoice)}
            title="Generate PDF"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleShareWhatsApp(invoice)}
            className="text-green-600 hover:text-green-700"
            title="Share on WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(invoice)}
            title="Edit Invoice"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(invoice)}
            title="Delete Invoice"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleCreateNew = () => {
    // Reset form with fresh defaults
    form.reset({
      tenantId: tenant?.id || 1,
      customerId: customers.length > 0 ? customers[0].id : 1,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      status: "draft",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      subtotal: "0",
      taxAmount: "0",
      discountAmount: "0",
      totalAmount: "0",
      currency: "USD",
      paymentTerms: "30 days",
      notes: "",
    });
    setItems([{ description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    setSelectedInvoice(null);
    setIsEditDialogOpen(false);
    setIsCreateDialogOpen(true);
  };

  // Import handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);

      // Auto-detect file type
      const extension = file.name.split(".").pop()?.toLowerCase();
      const supportedFormats = ["csv", "xml"];

      if (extension && supportedFormats.includes(extension)) {
        setImportType(extension);
      } else {
        setImportType("");
        toast({
          variant: "destructive",
          title: "Unsupported File Format",
          description: `Please select: ${supportedFormats.join(", ")} files`,
        });
      }
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile || !tenant?.id) {
      toast({
        title: "Missing Information",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    const fileExtension = importFile.name.toLowerCase().split(".").pop();
    const allowedExtensions = ["csv", "xml", "xls", "xlsx", "xl"];

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      toast({
        variant: "destructive",
        title: "Unsupported File Format",
        description: `Supported formats: ${allowedExtensions.join(", ")}`,
      });
      return;
    }

    setIsProcessingImport(true);

    try {
      let processedInvoices = [];

      // Handle Excel files via server-side parsing
      if (["xls", "xlsx", "xl"].includes(fileExtension)) {
        console.log("📊 Processing Excel file via server...");

        const formData = new FormData();
        formData.append("file", importFile);
        formData.append("tenantId", tenant.id.toString());

        const response = await fetch("/api/parse-invoice-file", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token") || localStorage.getItem("token")}`,
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to parse Excel file");
        }

        processedInvoices = result.data?.invoices || [];
        console.log(
          `📊 Server parsed ${processedInvoices.length} invoices from Excel`,
        );
      } else {
        // Handle CSV/XML files via client-side parsing
        console.log("📄 Processing CSV/XML file client-side...");

        const { parseInvoiceFile, processInvoiceData } = await import(
          "@/lib/file-parser"
        );
        const parsedData = await parseInvoiceFile(importFile);
        const existingCustomers = customers || [];
        processedInvoices = processInvoiceData(parsedData, existingCustomers);
      }

      // Check for duplicates
      const existingInvoiceNumbers = invoices.map(
        (inv: any) => inv.invoiceNumber,
      );
      const processedWithDuplicates = processedInvoices.map((inv: any) => ({
        ...inv,
        isDuplicate: existingInvoiceNumbers.includes(inv.invoiceNumber),
        _isDuplicate: existingInvoiceNumbers.includes(inv.invoiceNumber),
        _duplicateAction: "skip",
        sourceFile: importFile.name,
        fileType: fileExtension,
      }));

      console.log("📋 Processed invoices:", processedWithDuplicates);

      if (processedWithDuplicates.length === 0) {
        throw new Error("No valid invoice data found in the file");
      }

      // Show preview dialog
      setPreviewData(processedWithDuplicates);
      setIsImportDialogOpen(false);

      setTimeout(() => {
        setIsPreviewDialogOpen(true);
      }, 100);

      toast({
        title: "File Processed Successfully",
        description: `Found ${processedInvoices.length} invoice records. Ready for preview and import.`,
      });
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description:
          error.message ||
          "Failed to process file. Please check the format and try again.",
      });
    } finally {
      setIsProcessingImport(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!tenant?.id || previewData.length === 0) return;

    setIsProcessingImport(true);
    try {
      const response = await fetch(`/api/invoice-import/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          invoices: previewData,
          tenantId: tenant.id,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const { summary } = result;
        let description = `Successfully processed ${summary.total} invoice(s)`;
        if (summary.created > 0) description += `, ${summary.created} created`;
        if (summary.updated > 0) description += `, ${summary.updated} updated`;
        if (summary.skipped > 0) description += `, ${summary.skipped} skipped`;

        toast({
          title: "Import Completed",
          description,
        });

        // Refresh the invoices list
        queryClient.invalidateQueries({
          queryKey: [`/api/tenants/${tenant.id}/invoices`],
        });

        // Reset state
        setIsPreviewDialogOpen(false);
        setPreviewData([]);
        setImportFile(null);
        setImportType("");
      } else {
        throw new Error(result.message || "Import failed");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "Failed to import invoices.",
      });
    } finally {
      setIsProcessingImport(false);
    }
  };

  const handleEditPreviewItem = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...previewData[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const updatedData = [...previewData];
      updatedData[editingIndex] = { ...editForm };
      setPreviewData(updatedData);
      setEditingIndex(null);
      setEditForm({});
    }
  };

  const handleDeletePreviewItem = (index: number) => {
    const updatedData = previewData.filter((_, i) => i !== index);
    setPreviewData(updatedData);
  };

  const onSubmit = async (data: InvoiceFormData) => {
    // Convert string amounts to numbers for API
    const processedData = {
      ...data,
      subtotal: parseFloat(data.subtotal),
      taxAmount: parseFloat(data.taxAmount),
      discountAmount: parseFloat(data.discountAmount),
      totalAmount: parseFloat(data.totalAmount),
      paidAmount: data.paidAmount ? parseFloat(data.paidAmount) : 0,
    };

    if (isEditDialogOpen && selectedInvoice) {
      updateInvoiceMutation.mutate(processedData);
    } else {
      createInvoiceMutation.mutate(processedData);
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-8 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Invoices
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and track your travel service invoices
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Dialog
              open={isImportDialogOpen}
              onOpenChange={setIsImportDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Import Invoices</span>
                  <span className="sm:hidden">Import</span>
                </Button>
              </DialogTrigger>
            </Dialog>
            <Button
              variant="secondary"
              size="sm"
              onClick={testPreview}
              className="w-full sm:w-auto"
            >
              Test Preview
            </Button>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Create Invoice</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Import Preview Dialog */}
        <Dialog
          open={isPreviewDialogOpen}
          onOpenChange={setIsPreviewDialogOpen}
        >
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Imported Invoice Data</DialogTitle>
              <DialogDescription>
                Please review the imported data below. You can edit items,
                choose duplicate actions, or remove items before confirming the
                import.
                {previewData.filter((inv) => inv.isDuplicate).length > 0 && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm text-red-800">
                      <strong>Duplicates Detected:</strong>{" "}
                      {previewData.filter((inv) => inv.isDuplicate).length}{" "}
                      invoice(s) already exist. Choose an action for each
                      duplicate in the "Duplicate Action" column.
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Preview Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {previewData.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Invoices
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      $
                      {previewData
                        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Value
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {
                        previewData.filter(
                          (inv) => !inv.invoiceNumber || !inv.totalAmount,
                        ).length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Need Review
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={
                    previewData.filter((inv) => inv.isDuplicate).length > 0
                      ? "border-red-200"
                      : ""
                  }
                >
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {previewData.filter((inv) => inv.isDuplicate).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Duplicates Found
                    </div>
                    {previewData.filter((inv) => inv.isDuplicate).length >
                      0 && (
                      <div className="text-xs text-red-600 mt-1">
                        Action required
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader className="bg-[#EEF2F6] border-b-2">
                    <TableRow>
                      <TableHead className="w-12 text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                        Invoice Number
                      </TableHead>
                      <TableHead className="w-12 text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                        Customer
                      </TableHead>
                      <TableHead className="w-12 text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                        Total Amount
                      </TableHead>
                      <TableHead className="w-12 text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                        Status
                      </TableHead>
                      <TableHead className="w-12 text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                        Date
                      </TableHead>
                      <TableHead className="w-12 text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                        Duplicate Action
                      </TableHead>
                      <TableHead className="w-12 text-left px-6 py-3 text-[#364152] font-[500] text-[15px] ">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((invoice, index) => (
                      <TableRow
                        key={index}
                        className={cn(
                          !invoice.invoiceNumber || !invoice.totalAmount
                            ? "bg-yellow-50"
                            : "",
                          invoice.isDuplicate ? "bg-red-50 border-red-200" : "",
                        )}
                      >
                        <TableCell>
                          {editingIndex === index ? (
                            <Input
                              value={editForm.invoiceNumber || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  invoiceNumber: e.target.value,
                                })
                              }
                              placeholder="Invoice number"
                            />
                          ) : (
                            <div className="font-medium">
                              <span
                                className={
                                  !invoice.invoiceNumber ? "text-red-500" : ""
                                }
                              >
                                {invoice.invoiceNumber || "Missing"}
                              </span>
                              {invoice._isDuplicate && (
                                <Badge
                                  variant="destructive"
                                  className="ml-2 text-xs"
                                >
                                  Duplicate
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Select
                              value={editForm.customerId?.toString() || "1"}
                              onValueChange={(value) =>
                                setEditForm({
                                  ...editForm,
                                  customerId: parseInt(value),
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {customers.map((customer) => (
                                  <SelectItem
                                    key={customer.id}
                                    value={customer.id.toString()}
                                  >
                                    {customer.name ||
                                      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                                      "Unnamed Customer"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            // Show customerDisplayName from import or find customer by ID
                            invoice.customerDisplayName ||
                            (() => {
                              const customer = customers.find(
                                (c) => c.id === invoice.customerId,
                              );
                              return customer
                                ? customer.name ||
                                    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                                    "Unnamed Customer"
                                : "Customer not found";
                            })()
                          )}
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Input
                              type="number"
                              value={editForm.totalAmount || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  totalAmount: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="0.00"
                            />
                          ) : (
                            <span
                              className={
                                !invoice.totalAmount ? "text-red-500" : ""
                              }
                            >
                              ${(invoice.totalAmount || 0).toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Select
                              value={editForm.status || "pending"}
                              onValueChange={(value) =>
                                setEditForm({ ...editForm, status: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {invoiceStatuses.map((status) => (
                                  <SelectItem
                                    key={status.value}
                                    value={status.value}
                                  >
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">
                              {invoice.status || "pending"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Input
                              type="date"
                              value={editForm.issueDate || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  issueDate: e.target.value,
                                })
                              }
                            />
                          ) : (
                            invoice.issueDate ||
                            new Date().toISOString().split("T")[0]
                          )}
                        </TableCell>
                        <TableCell>
                          {invoice._isDuplicate ? (
                            <Select
                              value={invoice._duplicateAction || "skip"}
                              onValueChange={(value) => {
                                const updatedData = [...previewData];
                                updatedData[index] = {
                                  ...invoice,
                                  _duplicateAction: value,
                                };
                                setPreviewData(updatedData);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="skip">
                                  Skip (ignore)
                                </SelectItem>
                                <SelectItem value="update">
                                  Update existing
                                </SelectItem>
                                <SelectItem value="duplicate">
                                  Create duplicate
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              New invoice
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingIndex === index ? (
                              <>
                                <Button size="sm" onClick={handleSaveEdit}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingIndex(null)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditPreviewItem(index)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeletePreviewItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {previewData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No invoice data to preview. Please try a different file.
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPreviewDialogOpen(false);
                  setPreviewData([]);
                  setIsImportDialogOpen(true);
                }}
              >
                Back to Import
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={previewData.length === 0 || isProcessingImport}
              >
                {isProcessingImport
                  ? "Importing..."
                  : `Confirm Import (${previewData.length} invoices)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invoices
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalInvoices || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Edit className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                ${(stats.totalDraft || 0).toLocaleString()}
              </div>
              {stats.draftCount > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {stats.draftCount} draft{stats.draftCount !== 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(stats.totalPaid || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ${(stats.totalPending || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${(stats.totalOverdue || 0).toLocaleString()}
              </div>
              {stats.overdueCount > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {stats.overdueCount} invoice
                  {stats.overdueCount !== 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div>
          <div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative flex-1 max-w-sm">
                  {" "}
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
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
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {invoicesError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Failed to load invoices. Please try refreshing the page.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  A list of all invoices including their status and amounts.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EnhancedTable
              data={filteredInvoices}
              columns={invoiceColumns}
              searchTerm={searchTerm}
              isLoading={isLoading}
              showPagination={true}
              pageSize={10}
              emptyMessage={
                searchTerm || statusFilter !== "all"
                  ? "No invoices found matching your criteria."
                  : "No invoices yet. Create your first invoice to start billing customers."
              }
            />
          </CardContent>
        </Card>

        {/* Create/Edit Invoice Dialog */}
        <Dialog
          open={isCreateDialogOpen || isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedInvoice(null);
              form.reset();
              setItems([
                { description: "", quantity: 1, unitPrice: 0, totalPrice: 0 },
              ]);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditDialogOpen ? "Edit Invoice" : "Create New Invoice"}
              </DialogTitle>
              <DialogDescription>
                {isEditDialogOpen
                  ? "Update the invoice details below."
                  : "Fill in the details to create a new invoice."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Basic Invoice Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Basic Invoice Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem
                                  key={customer.id}
                                  value={customer.id.toString()}
                                >
                                  {customer.name ||
                                    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                                    "Unnamed Customer"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="INV-2024-001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {invoiceStatuses.map((status) => (
                                <SelectItem
                                  key={status.value}
                                  value={status.value}
                                >
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="INR">INR</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Booking Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Booking Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="leadId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Lead reference" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Vendor reference" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Travel Category *
                      </label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select travel category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flight">Flight</SelectItem>
                          <SelectItem value="hotel">Hotel</SelectItem>
                          <SelectItem value="package">Package</SelectItem>
                          <SelectItem value="car">Car Rental</SelectItem>
                          <SelectItem value="cruise">Cruise</SelectItem>
                          <SelectItem value="rail">Rail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Travel Date *
                      </label>
                      <Input type="date" placeholder="dd-mm-yyyy" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Booking Status
                      </label>
                      <Select defaultValue="pending">
                        <SelectTrigger>
                          <SelectValue placeholder="Select booking status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                {!isEditDialogOpen && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Invoice Items</h3>
                      <Button type="button" variant="outline" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>

                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-4 items-end"
                      >
                        <div className="col-span-5">
                          <label className="text-sm font-medium">
                            Description
                          </label>
                          <Input
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].description = e.target.value;
                              setItems(newItems);
                            }}
                            placeholder="Item description"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Qty</label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              calculateItemTotal(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium">
                            Unit Price
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              calculateItemTotal(
                                index,
                                "unitPrice",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium">Total</label>
                          <Input
                            value={item.totalPrice.toFixed(2)}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="subtotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtotal</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 30 days" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Additional notes or comments..."
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setIsEditDialogOpen(false);
                      setSelectedInvoice(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createInvoiceMutation.isPending ||
                      updateInvoiceMutation.isPending
                    }
                  >
                    {isEditDialogOpen ? "Update Invoice" : "Create Invoice"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Import Invoices</DialogTitle>
              <DialogDescription>
                Upload and import invoices from various file formats
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv,.xml,.xls,.xlsx,.xl"
                  onChange={handleImportFile}
                  className="hidden"
                  id="invoice-file-input"
                />
                <div className="space-y-2">
                  {importFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        {importType === "image" && (
                          <Image className="h-8 w-8 text-blue-500" />
                        )}
                        {importType === "pdf" && (
                          <File className="h-8 w-8 text-red-500" />
                        )}
                        {importType === "excel" && (
                          <FileSpreadsheet className="h-8 w-8 text-green-500" />
                        )}
                        {importType === "csv" && (
                          <FileText className="h-8 w-8 text-purple-500" />
                        )}
                      </div>
                      <p className="text-sm font-medium">{importFile.name}</p>
                      <p className="text-xs text-gray-500">
                        Type: {importType.toUpperCase()} • Size:{" "}
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImportFile(null);
                          setImportType("");
                        }}
                      >
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Choose file to import
                        </h3>
                        <p className="text-sm text-gray-600">
                          Supported formats: CSV, XML, Excel (.xlsx, .xls, .xl),
                          Images, PDF
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          document.getElementById("invoice-file-input")?.click()
                        }
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Select File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* File Type Information */}
              {importType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {importType.toUpperCase()} Import Information
                  </h4>
                  <div className="text-sm text-blue-700">
                    {importType === "csv" && (
                      <p>
                        CSV data will be parsed with automatic column detection.
                        First row should contain headers for customer names,
                        invoice numbers, amounts, and dates.
                      </p>
                    )}
                    {importType === "xml" && (
                      <p>
                        XML data will be parsed for invoice elements. Supports
                        standard invoice XML formats with customer, amount, and
                        date information.
                      </p>
                    )}
                    {importType === "excel" && (
                      <p>
                        Excel data will be processed server-side with
                        intelligent column mapping. Supports .xls, .xlsx, and
                        .xl formats with automatic customer matching and invoice
                        data extraction.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setImportFile(null);
                  setImportType("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImportSubmit}
                disabled={!importFile || isProcessingImport}
              >
                {isProcessingImport ? "Processing..." : "Import"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Selector for PDF Generation */}
        {invoiceForPDF && (
          <TemplateSelector
            isOpen={isTemplateSelectorOpen}
            onClose={() => {
              setIsTemplateSelectorOpen(false);
              setInvoiceForPDF(null);
            }}
            invoiceData={invoiceForPDF}
          />
        )}
      </div>
    </Layout>
  );
}

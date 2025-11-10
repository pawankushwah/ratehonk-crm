import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  AutocompleteInput,
  AutocompleteOption,
} from "@/components/ui/autocomplete-input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Receipt,
  Bell,
  HelpCircle,
  Settings,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CustomerCreateForm } from "@/components/forms/customer-create-form";
import { VendorCreateForm } from "@/components/forms/vendor-create-form";
import { LeadTypeCreateForm } from "@/components/forms/lead-type-create-form";
import { ServiceProviderCreateForm } from "@/components/forms/service-provider-create-form";
import { InvoiceSettingsPanel } from "@/components/invoice-settings-panel";
import { DatePicker } from "@/components/ui/date-picker";

export default function InvoiceCreate() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [lineItems, setLineItems] = useState([
    {
      travelCategory: "",
      vendor: "",
      serviceProviderId: "",
      itemTitle: "",
      invoiceNumber: "",
      voucherNumber: "",
      quantity: "1",
      unitPrice: "",
      sellingPrice: "",
      purchasePrice: "",
      tax: "",
      totalAmount: 0,
    },
  ]);

  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [paymentTerms, setPaymentTerms] = useState("30");
  const [customDays, setCustomDays] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  
  // Payment reminder states
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState("weekly");
  const [reminderSpecificDate, setReminderSpecificDate] = useState("");

  // Payment installments states
  const [enableInstallments, setEnableInstallments] = useState(false);
  const [numberOfInstallments, setNumberOfInstallments] = useState("2");
  const [installmentFrequency, setInstallmentFrequency] = useState("monthly");

  // Tax states
  const [selectedTaxSettingId, setSelectedTaxSettingId] = useState("none");
  const [selectedTaxRateId, setSelectedTaxRateId] = useState("");
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);

  // Slide panel states
  const [isCustomerPanelOpen, setIsCustomerPanelOpen] = useState(false);
  const [isVendorPanelOpen, setIsVendorPanelOpen] = useState(false);
  const [isLeadTypePanelOpen, setIsLeadTypePanelOpen] = useState(false);
  const [isServiceProviderPanelOpen, setIsServiceProviderPanelOpen] =
    useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Manual expenses state
  const [manualExpenses, setManualExpenses] = useState<any[]>([]);

  // Notes state for rich text editor
  const [notesContent, setNotesContent] = useState("");

  // Fetch invoice settings
  const { data: invoiceSettings = {
    showTax: true,
    showDiscount: true,
    showNotes: true,
    showVoucherInvoice: true,
    showProvider: true,
    showVendor: true,
    showUnitPrice: true,
    defaultCurrency: "USD",
  } } = useQuery({
    queryKey: ["/api/invoice-settings", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const response = await fetch(`/api/invoice-settings/${tenant?.id}`);
      if (!response.ok) throw new Error("Failed to fetch settings");
      const result = await response.json();
      return result.data;
    },
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: [`customers-tenant-${tenant?.id}`],
    enabled: !!tenant?.id,
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

  // Fetch vendors
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

  // Fetch lead types
  const { data: leadTypes = [] } = useQuery<any[]>({
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

  // Fetch service providers
  const { data: serviceProviders = [] } = useQuery<any[]>({
    queryKey: [`/api/service-providers`, tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/tenants/${tenant?.id}/service-providers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

  // Fetch bookings
  const { data: bookings = [] } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/bookings`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result)
        ? result
        : result.data || result.bookings || [];
    },
  });

  // Fetch GST settings
  const { data: gstSettings = [] } = useQuery<any[]>({
    queryKey: ["/api/gst-settings"],
    enabled: !!tenant?.id,
  });

  // Fetch GST rates for selected setting
  const { data: gstRates = [] } = useQuery<any[]>({
    queryKey: ["/api/gst-rates", selectedTaxSettingId],
    enabled:
      !!tenant?.id && !!selectedTaxSettingId && selectedTaxSettingId !== "none",
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceData),
      });
      if (!response.ok) throw new Error("Failed to create invoice");
      return response.json();
    },
    onSuccess: async (data) => {
      // Create payment installments if enabled
      if (enableInstallments && data.invoice?.id) {
        try {
          const installments = calculateInstallments().map(inst => ({
            invoiceId: data.invoice.id,
            tenantId: tenant?.id,
            installmentNumber: inst.installmentNumber,
            amount: parseFloat(inst.amount),
            dueDate: inst.dueDate,
            status: 'pending',
            paidAmount: 0,
          }));

          const token = auth.getToken();
          const installmentResponse = await fetch('/api/payment-installments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
              invoiceId: data.invoice.id,
              tenantId: tenant?.id,
              installments 
            }),
          });

          if (!installmentResponse.ok) {
            throw new Error('Failed to create payment installments');
          }

          toast({
            title: "Invoice Created",
            description: "Invoice and payment installments created successfully.",
          });
        } catch (error) {
          toast({
            title: "Partial Success",
            description: "Invoice created but failed to create installments. Please add them manually.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invoice Created",
          description: "Invoice has been created successfully.",
        });
      }

      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/invoices`],
      });
      navigate("/invoices");
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper to allow only numeric input
  const handleNumericKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      ".",
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
    ];
    if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  // Get travel categories from lead types
  const getTravelCategories = (): AutocompleteOption[] => {
    const leadTypeCategories = leadTypes.map((lt: any) => ({
      value: lt.name || lt.type_name || lt.typeName || `Lead Type ${lt.id}`,
      label: lt.name || lt.type_name || lt.typeName || `Lead Type ${lt.id}`,
    }));

    const defaultCategories =
      leadTypeCategories.length === 0
        ? [
            { value: "Flight", label: "Flight" },
            { value: "Hotel", label: "Hotel" },
            { value: "Transport", label: "Transport" },
            { value: "Tour Package", label: "Tour Package" },
            { value: "Visa Services", label: "Visa Services" },
            { value: "Insurance", label: "Insurance" },
            { value: "Meals", label: "Meals" },
            { value: "Activities", label: "Activities" },
            { value: "Other Services", label: "Other Services" },
          ]
        : leadTypeCategories;

    return [
      { value: "create_new", label: "➕ Create New Travel Category" },
      ...defaultCategories,
    ];
  };

  // Get customer options
  const getCustomerOptions = (): AutocompleteOption[] => {
    const customerOptions = customers.map((customer: any) => {
      const name =
        customer.name ||
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
        "Unnamed Customer";
      const email = customer.email ? ` | ${customer.email}` : "";
      const phone = customer.phone ? ` | ${customer.phone}` : "";
      return {
        value: customer.id.toString(),
        label: `${name}${email}${phone}`,
      };
    });

    return [
      { value: "create_new", label: "➕ Create New Customer" },
      ...customerOptions,
    ];
  };

  // Get booking options
  const getBookingOptions = (): AutocompleteOption[] => {
    return [
      { value: "none", label: "No booking selected" },
      ...bookings.map((booking: any) => ({
        value: booking.id.toString(),
        label: `${booking.bookingNumber || `BK-${booking.id}`} - ${booking.customerName || "Unknown Customer"}${booking.travelDate ? ` (${new Date(booking.travelDate).toLocaleDateString()})` : ""}`,
      })),
    ];
  };

  // Get vendor options
  const getVendorOptions = (): AutocompleteOption[] => {
    return [
      { value: "create_new", label: "➕ Create New Vendor" },
      { value: "none", label: "No vendor selected" },
      ...vendors.map((vendor: any) => ({
        value: vendor.id.toString(),
        label: vendor.companyName || vendor.name || "Unnamed Vendor",
      })),
    ];
  };

  // Get service provider options filtered by lead type
  const getServiceProviderOptions = (
    leadTypeName: string,
  ): AutocompleteOption[] => {
    // Find the lead type ID by name
    const leadType = leadTypes.find(
      (lt: any) => (lt.name || lt.type_name || lt.typeName) === leadTypeName,
    );

    if (!leadType) {
      return [
        { value: "create_new", label: "➕ Create New Service Provider" },
        { value: "none", label: "Select lead type first" },
      ];
    }

    // Filter service providers by lead type ID
    const filteredProviders = serviceProviders.filter(
      (sp: any) => sp.leadTypeId === leadType.id,
    );

    return [
      { value: "create_new", label: "➕ Create New Service Provider" },
      { value: "none", label: "No service provider" },
      ...filteredProviders.map((sp: any) => ({
        value: sp.id.toString(),
        label: sp.name,
      })),
    ];
  };

  // Get payment status options
  const getPaymentStatusOptions = (): AutocompleteOption[] => {
    return [
      { value: "pending", label: "Pending" },
      { value: "paid", label: "Paid" },
      { value: "partial", label: "Partially Paid" },
      { value: "overdue", label: "Overdue" },
    ];
  };

  // Get currency options
  const getCurrencyOptions = (): AutocompleteOption[] => {
    return [
      { value: "INR", label: "INR (₹)" },
      { value: "USD", label: "USD ($)" },
      { value: "EUR", label: "EUR (€)" },
    ];
  };

  // Update line item
  const updateLineItem = (index: number, field: string, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate total amount
    const item = updatedItems[index];
    const sellingPrice = parseFloat(item.sellingPrice || "0");
    const quantity = parseInt(item.quantity || "1");
    const tax = parseFloat(item.tax || "0");
    updatedItems[index].totalAmount = sellingPrice * quantity + tax;

    setLineItems(updatedItems);
  };

  // Add line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        travelCategory: "",
        vendor: "",
        serviceProviderId: "",
        itemTitle: "",
        invoiceNumber: "",
        voucherNumber: "",
        quantity: "1",
        unitPrice: "",
        sellingPrice: "",
        purchasePrice: "",
        tax: "",
        totalAmount: 0,
      },
    ]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return lineItems.reduce(
      (total, item) => total + (item.totalAmount || 0),
      0,
    );
  };

  // Calculate payment installments
  const calculateInstallments = () => {
    if (!enableInstallments) return [];
    
    const totalAmount = calculateGrandTotal() - parseFloat(discountAmount || "0");
    const paidAmount = parseFloat(amountPaid || "0");
    const pendingAmount = totalAmount - paidAmount;
    
    if (pendingAmount <= 0) return [];
    
    const numInstallments = parseInt(numberOfInstallments);
    if (numInstallments <= 0) return [];
    
    const amountPerInstallment = pendingAmount / numInstallments;
    const installments = [];
    
    let currentDate = new Date(dueDate);
    
    for (let i = 0; i < numInstallments; i++) {
      installments.push({
        installmentNumber: i + 1,
        amount: amountPerInstallment.toFixed(2),
        dueDate: currentDate.toISOString().split("T")[0],
      });
      
      // Calculate next date based on frequency
      switch (installmentFrequency) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case "yearly":
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }
    
    return installments;
  };

  // Generate expenses from line items
  const generateExpenses = () => {
    return lineItems
      .filter(
        (item) => item.purchasePrice && parseFloat(item.purchasePrice) > 0,
      )
      .map((item, index) => {
        const leadType = leadTypes.find(
          (lt: any) =>
            (lt.name || lt.type_name || lt.typeName) === item.travelCategory,
        );

        const vendor = vendors.find(
          (v: any) => v.id.toString() === item.vendor,
        );

        return {
          itemIndex: index,
          title: item.itemTitle || `Expense for ${item.travelCategory}`,
          amount: parseFloat(item.purchasePrice || "0"),
          category: item.travelCategory || "General",
          vendorId: item.vendor !== "none" ? parseInt(item.vendor) : null,
          vendorName: vendor
            ? vendor.companyName || vendor.name
            : "Not specified",
          leadTypeId: leadType?.id || null,
          leadTypeName: item.travelCategory || "Not specified",
          expenseType: "purchase",
          quantity: parseInt(item.quantity || "1"),
          invoiceNumber: item.invoiceNumber,
          voucherNumber: item.voucherNumber,
        };
      });
  };

  // Add manual expense
  const addManualExpense = () => {
    setManualExpenses([
      ...manualExpenses,
      {
        title: "",
        amount: "",
        category: "",
        vendorId: "",
        quantity: "1",
        expenseType: "manual",
      },
    ]);
  };

  // Update manual expense
  const updateManualExpense = (index: number, field: string, value: any) => {
    const updated = [...manualExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setManualExpenses(updated);
  };

  // Remove manual expense
  const removeManualExpense = (index: number) => {
    setManualExpenses(manualExpenses.filter((_, i) => i !== index));
  };

  // Combine all expenses
  const getAllExpenses = () => {
    const autoExpenses = generateExpenses();
    const manualExpensesFormatted = manualExpenses.map((exp, idx) => ({
      ...exp,
      itemIndex: `M-${idx + 1}`,
      amount: parseFloat(exp.amount || "0"),
      quantity: parseInt(exp.quantity || "1"),
      vendorName: exp.vendorId
        ? vendors.find((v: any) => v.id.toString() === exp.vendorId)
            ?.companyName || "Unknown"
        : "Not specified",
    }));
    return [...autoExpenses, ...manualExpensesFormatted];
  };

  // Handle customer selection
  const handleCustomerSelection = (customerId: string) => {
    if (customerId === "create_new") {
      setIsCustomerPanelOpen(true);
    } else {
      setSelectedCustomerId(customerId);
    }
  };

  // Handle travel category selection
  const handleTravelCategorySelection = (value: string, index: number) => {
    if (value === "create_new") {
      setCurrentItemIndex(index);
      setIsLeadTypePanelOpen(true);
    } else {
      updateLineItem(index, "travelCategory", value);
    }
  };

  // Handle vendor selection
  const handleVendorSelection = (value: string, index: number) => {
    if (value === "create_new") {
      setCurrentItemIndex(index);
      setIsVendorPanelOpen(true);
    } else {
      updateLineItem(index, "vendor", value);
    }
  };

  // Handle service provider selection
  const handleServiceProviderSelection = (value: string, index: number) => {
    if (value === "create_new") {
      setCurrentItemIndex(index);
      setIsServiceProviderPanelOpen(true);
    } else {
      updateLineItem(index, "serviceProviderId", value);
    }
  };

  // Handle booking selection
  const handleBookingSelection = (bookingId: string) => {
    setSelectedBookingId(bookingId);

    if (bookingId && bookingId !== "none") {
      const selectedBooking = bookings.find(
        (b: any) => b.id.toString() === bookingId,
      );

      if (selectedBooking) {
        setSelectedCustomerId(selectedBooking.customerId?.toString() || "");

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

        const totalAmount = parseFloat(bookingAmount.toString()) || 0;
        const unitPrice = totalAmount / bookingPassengers || 0;
        const purchasePrice = unitPrice * 0.8;
        const taxAmount = totalAmount * 0.18;

        const newLineItems = [...lineItems];
        newLineItems[0] = {
          ...newLineItems[0],
          travelCategory: getTravelCategories()[1]?.value || "Tour Package",
          itemTitle:
            bookingPackage ||
            `Booking ${selectedBooking.bookingNumber || selectedBooking.booking_number || selectedBooking.id}`,
          quantity: bookingPassengers.toString(),
          unitPrice: unitPrice.toString(),
          sellingPrice: unitPrice.toString(),
          purchasePrice: purchasePrice.toString(),
          invoiceNumber:
            selectedBooking.bookingNumber ||
            selectedBooking.booking_number ||
            `BK-${selectedBooking.id}`,
          voucherNumber:
            selectedBooking.voucherNumber ||
            selectedBooking.voucher_number ||
            `V-${selectedBooking.id}`,
          tax: taxAmount.toString(),
          totalAmount: totalAmount,
        };

        setLineItems(newLineItems);

        const bookingPaidAmount =
          selectedBooking.paidAmount || selectedBooking.paid_amount || 0;
        const bookingDiscount =
          selectedBooking.discountAmount ||
          selectedBooking.discount_amount ||
          0;

        setAmountPaid(bookingPaidAmount.toString());
        setDiscountAmount(bookingDiscount.toString());
      }
    }
  };

  // Calculate due date based on invoice date and payment terms
  const calculateDueDate = (date: string, terms: string, custom: string = "") => {
    const baseDate = new Date(date);
    let daysToAdd = 0;

    if (terms === "custom") {
      daysToAdd = parseInt(custom) || 0;
    } else {
      daysToAdd = parseInt(terms) || 0;
    }

    const newDueDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return newDueDate.toISOString().split("T")[0];
  };

  // Handle invoice date change
  const handleInvoiceDateChange = (date: string) => {
    setInvoiceDate(date);
    const newDueDate = calculateDueDate(date, paymentTerms, customDays);
    setDueDate(newDueDate);
  };

  // Handle payment terms change
  const handlePaymentTermsChange = (terms: string) => {
    setPaymentTerms(terms);
    const newDueDate = calculateDueDate(invoiceDate, terms, customDays);
    setDueDate(newDueDate);
  };

  // Handle custom days change
  const handleCustomDaysChange = (days: string) => {
    setCustomDays(days);
    if (paymentTerms === "custom") {
      const newDueDate = calculateDueDate(invoiceDate, "custom", days);
      setDueDate(newDueDate);
    }
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const grandTotal = calculateGrandTotal();
    const discount = parseFloat(discountAmount || "0");
    const finalAmount = grandTotal - discount;

    const expenses = generateExpenses().map((expense) => ({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      subcategory: expense.category,
      vendorId: expense.vendorId,
      leadTypeId: expense.leadTypeId,
      expenseType: expense.expenseType,
      expenseDate: formData.get("issueDate") as string,
      paymentMethod: "bank_transfer",
      currency: formData.get("currency") as string,
      status: "pending",
      notes: `Auto-generated from invoice ${formData.get("invoiceNumber")} - ${expense.invoiceNumber || expense.voucherNumber || ""}`,
    }));

    const invoiceData = {
      invoiceNumber: formData.get("invoiceNumber") as string,
      customerId: parseInt(selectedCustomerId),
      bookingId:
        selectedBookingId && selectedBookingId !== "none"
          ? parseInt(selectedBookingId)
          : null,
      issueDate: formData.get("issueDate") as string,
      dueDate: formData.get("dueDate") as string,
      totalAmount: finalAmount,
      paidAmount: parseFloat(amountPaid || "0"),
      subtotal: grandTotal,
      taxAmount: lineItems.reduce(
        (total, item) => total + parseFloat(item.tax || "0"),
        0,
      ),
      discountAmount: discount,
      status: paymentStatus,
      currency: formData.get("currency") as string,
      notes: formData.get("notes") as string,
      paymentTerms: formData.get("paymentTerms") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      enableReminder,
      reminderFrequency: enableReminder ? reminderFrequency : null,
      reminderSpecificDate: enableReminder && reminderFrequency === "specific_date" ? reminderSpecificDate : null,
      lineItems: lineItems.map((item) => ({
        ...item,
        quantity: parseInt(item.quantity || "1"),
        unitPrice: parseFloat(item.unitPrice || "0"),
        sellingPrice: parseFloat(item.sellingPrice || "0"),
        purchasePrice: parseFloat(item.purchasePrice || "0"),
        tax: parseFloat(item.tax || "0"),
      })),
      expenses, // Include auto-generated expenses
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const [currency, setCurrency] = useState("INR");

  return (
    <Layout initialSidebarCollapsed={true}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="">
            <div className=" w-full h-[72px] flex items-center bg-white px-[18px] py-4 rounded-t-xl border-b border-[#E3E8EF] shadow-[0px_1px_6px_0px_rgba(0,0,0,0.05)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/invoices")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              {/* <h1 className="font-inter font-medium text-[20px] leading-[24px] text-[#121926]">
                  Leads
                </h1> */}

              <div className="flex gap-3 ml-auto">
                {" "}
                {tenant?.id && <InvoiceSettingsPanel tenantId={tenant.id} />}
                <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                  <HelpCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div
                  style={{ width: "8rem" }}
                  className="h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm"
                >
                  {/* <Bell className="h-5 w-5 text-gray-600" /> */}

                  {/* <Label htmlFor="currency">Currency *</Label> */}
                  <AutocompleteInput
                    data-testid="autocomplete-currency"
                    suggestions={getCurrencyOptions()}
                    value={currency}
                    onValueChange={setCurrency}
                    placeholder="Select currency..."
                    emptyText="No currency found"
                  />
                  <input type="hidden" name="currency" value={currency} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Invoice
                  </h1>
                  {/* <p className="text-gray-600 dark:text-gray-400">
              Fill in the details to create a new invoice
            </p> */}
                </div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input
                    data-testid="input-invoice-number"
                    name="invoiceNumber"
                    placeholder={`INV-${Date.now()}`}
                    defaultValue={`INV-${Date.now()}`}
                    required
                  />
                </div>
              </div>
              {/* Customer and Invoice Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <Label htmlFor="customerId">Customer *</Label>
                  <AutocompleteInput
                    data-testid="autocomplete-customer"
                    suggestions={getCustomerOptions()}
                    value={selectedCustomerId}
                    onValueChange={handleCustomerSelection}
                    placeholder="Search customer..."
                    emptyText="No customers found"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="issueDate">Invoice Date *</Label>
                  <DatePicker
                    value={invoiceDate}
                    onChange={handleInvoiceDateChange}
                    placeholder="Select invoice date"
                    className="w-full"
                  />
                  <input type="hidden" name="issueDate" value={invoiceDate} />
                </div>
              </div>

              {/* Payment Terms and Due Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <div className="flex items-center gap-1 mb-1.5">
                        <Label htmlFor="paymentTerms">Terms *</Label>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-blue-500 cursor-help" />
                        </TooltipTrigger>
                      </div>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Payment terms specify when payment is due. For example, "30 Days" means 
                          payment is due 30 days after the invoice date. "Due on Receipt" means 
                          immediate payment is expected.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Select
                    value={paymentTerms}
                    onValueChange={handlePaymentTermsChange}
                  >
                    <SelectTrigger data-testid="select-payment-terms">
                      <SelectValue placeholder="Select terms..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Due on Receipt</SelectItem>
                      <SelectItem value="15">15 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="paymentTerms" value={paymentTerms === "custom" ? `${customDays} days` : `${paymentTerms} days`} />
                </div>

                {paymentTerms === "custom" && (
                  <div>
                    <Label htmlFor="customDays">Custom Days *</Label>
                    <Input
                      data-testid="input-custom-days"
                      type="number"
                      value={customDays}
                      onChange={(e) => handleCustomDaysChange(e.target.value)}
                      placeholder="Enter number of days"
                      min="0"
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <DatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Select due date"
                    className="w-full"
                  />
                  <input type="hidden" name="dueDate" value={dueDate} />
                </div>
              </div>

              {/* Payment Method and Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue placeholder="Select method..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="petty_cash">Petty Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentStatus">Payment Status *</Label>
                  <Select
                    value={paymentStatus}
                    onValueChange={setPaymentStatus}
                  >
                    <SelectTrigger data-testid="select-payment-status">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partially Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment Reminder Section */}
              <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Payment Reminder
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="enableReminder" className="text-sm">
                      Enable Reminder
                    </Label>
                    <Switch
                      id="enableReminder"
                      checked={enableReminder}
                      onCheckedChange={setEnableReminder}
                      data-testid="switch-enable-reminder"
                    />
                  </div>
                </div>

                {enableReminder && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reminderFrequency">Reminder Frequency *</Label>
                      <Select
                        value={reminderFrequency}
                        onValueChange={setReminderFrequency}
                      >
                        <SelectTrigger data-testid="select-reminder-frequency">
                          <SelectValue placeholder="Select frequency..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="specific_date">Specific Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <input type="hidden" name="reminderFrequency" value={reminderFrequency} />
                    </div>

                    {reminderFrequency === "specific_date" && (
                      <div>
                        <Label htmlFor="reminderSpecificDate">Reminder Date *</Label>
                        <DatePicker
                          value={reminderSpecificDate}
                          onChange={setReminderSpecificDate}
                          placeholder="Select reminder date"
                          className="w-full"
                        />
                        <input type="hidden" name="reminderSpecificDate" value={reminderSpecificDate} />
                      </div>
                    )}

                    <div className="col-span-full">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {reminderFrequency === "daily" && "Customer will receive payment reminders every day until the invoice is paid."}
                        {reminderFrequency === "weekly" && "Customer will receive payment reminders every week until the invoice is paid."}
                        {reminderFrequency === "monthly" && "Customer will receive payment reminders every month until the invoice is paid."}
                        {reminderFrequency === "specific_date" && "Customer will receive a payment reminder on the selected date."}
                      </p>
                    </div>
                  </div>
                )}
                <input type="hidden" name="enableReminder" value={enableReminder.toString()} />
              </div>

              {/* Notes Section with Rich Text Editor */}
              {invoiceSettings?.showNotes && (
                <div className="border rounded-lg p-4">
                  <Label htmlFor="notes" className="text-lg font-semibold mb-3 block">
                    Notes
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Add any additional notes, attachments, or information. Supports text, images, videos, and paste functionality.
                  </p>
                  <div className="bg-white dark:bg-gray-900 rounded-lg" data-testid="rich-text-editor-notes">
                    <ReactQuill
                      theme="snow"
                      value={notesContent}
                      onChange={setNotesContent}
                      className="h-64"
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'color': [] }, { 'background': [] }],
                          [{ 'align': [] }],
                          ['link', 'image', 'video'],
                          ['clean']
                        ],
                      }}
                      formats={[
                        'header',
                        'bold', 'italic', 'underline', 'strike',
                        'list', 'bullet',
                        'color', 'background',
                        'align',
                        'link', 'image', 'video'
                      ]}
                      placeholder="Type your notes here... You can paste images directly or use the toolbar to add images, videos, and more."
                    />
                  </div>
                  <input type="hidden" name="notes" value={notesContent} />
                </div>
              )}

              {/* Line Items */}
              <div className="border rounded-lg overflow-hidden">
                {/* Table Header - Show labels only once */}
                <div className="grid grid-cols-12 gap-2 bg-gray-100 dark:bg-gray-800 p-3 font-medium text-sm">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-2">Category *</div>
                  {invoiceSettings?.showVendor && <div className="col-span-1">Vendor</div>}
                  {invoiceSettings?.showProvider && <div className="col-span-1">Provider</div>}
                  <div className="col-span-1">Pax *</div>
                  {invoiceSettings?.showUnitPrice && <div className="col-span-1">Unit Price *</div>}
                  <div className="col-span-1">Selling Pri *</div>
                  <div className="col-span-1">Purchase Pri *</div>
                  {invoiceSettings?.showTax && <div className="col-span-1">Tax</div>}
                  <div className="col-span-1">Amount</div>
                  {invoiceSettings?.showVoucherInvoice && <div className="col-span-1">Inv/Vou #</div>}
                  <div className="col-span-1"></div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <div className="col-span-1 flex items-center justify-center">
                        <span className="font-medium text-sm">{index + 1}</span>
                      </div>

                      <div className="col-span-2">
                        <AutocompleteInput
                          data-testid={`autocomplete-category-${index}`}
                          suggestions={getTravelCategories()}
                          value={item.travelCategory}
                          onValueChange={(value) =>
                            handleTravelCategorySelection(value, index)
                          }
                          placeholder="Select..."
                          emptyText="No categories found"
                        />
                      </div>

                      {invoiceSettings?.showVendor && (
                        <div className="col-span-1">
                          <AutocompleteInput
                            data-testid={`autocomplete-vendor-${index}`}
                            suggestions={getVendorOptions()}
                            value={item.vendor}
                            onValueChange={(value) =>
                              handleVendorSelection(value, index)
                            }
                            placeholder="Select..."
                            emptyText="No vendors found"
                          />
                        </div>
                      )}

                      {invoiceSettings?.showProvider && (
                        <div className="col-span-1">
                          <AutocompleteInput
                            data-testid={`autocomplete-service-provider-${index}`}
                            suggestions={getServiceProviderOptions(
                              item.travelCategory,
                            )}
                            value={item.serviceProviderId}
                            onValueChange={(value) =>
                              handleServiceProviderSelection(value, index)
                            }
                            placeholder="Select..."
                            emptyText="No providers found"
                          />
                        </div>
                      )}

                      <div className="col-span-1">
                        <Input
                          data-testid={`input-quantity-${index}`}
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(index, "quantity", e.target.value)
                          }
                          onKeyPress={handleNumericKeyPress}
                          placeholder="1"
                        />
                      </div>

                      {invoiceSettings?.showUnitPrice && (
                        <div className="col-span-1">
                          <Input
                            data-testid={`input-unit-price-${index}`}
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateLineItem(index, "unitPrice", e.target.value)
                            }
                            onKeyPress={handleNumericKeyPress}
                            placeholder="0"
                          />
                        </div>
                      )}

                      <div className="col-span-1">
                        <Input
                          data-testid={`input-selling-price-${index}`}
                          value={item.sellingPrice}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "sellingPrice",
                              e.target.value,
                            )
                          }
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0"
                        />
                      </div>

                      <div className="col-span-1">
                        <Input
                          data-testid={`input-purchase-price-${index}`}
                          value={item.purchasePrice}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "purchasePrice",
                              e.target.value,
                            )
                          }
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0"
                        />
                      </div>

                      {invoiceSettings?.showTax && (
                        <div className="col-span-1">
                          <Input
                            data-testid={`input-tax-${index}`}
                            value={item.tax}
                            onChange={(e) =>
                              updateLineItem(index, "tax", e.target.value)
                            }
                            onKeyPress={handleNumericKeyPress}
                            placeholder="0"
                          />
                        </div>
                      )}

                      <div className="col-span-1">
                        <Input
                          data-testid={`input-total-amount-${index}`}
                          value={item.totalAmount.toFixed(2)}
                          readOnly
                          className="bg-gray-100 dark:bg-gray-800"
                        />
                      </div>

                      {invoiceSettings?.showVoucherInvoice && (
                        <div className="col-span-1">
                          <Input
                            data-testid={`input-line-invoice-number-${index}`}
                            value={item.invoiceNumber}
                            onChange={(e) =>
                              updateLineItem(
                                index,
                                "invoiceNumber",
                                e.target.value,
                              )
                            }
                            placeholder="#"
                          />
                        </div>
                      )}

                      <div className="col-span-1 flex items-center justify-center">
                        {lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            data-testid={`button-remove-item-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLineItem}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line Item
                </Button>
              </div>
              {/* Auto-Generated Expenses Preview */}

              <div className="border-t pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Side - Tax and Discount Inputs */}
                  <div className="space-y-4">
                    {invoiceSettings?.showTax && (
                      <>
                        <div>
                          <Label htmlFor="taxSetting">Tax</Label>
                          <Select
                            value={selectedTaxSettingId}
                            onValueChange={(value) => {
                              setSelectedTaxSettingId(value);
                              setSelectedTaxRateId(""); // Reset rate when setting changes
                            }}
                          >
                            <SelectTrigger data-testid="select-tax-setting">
                              <SelectValue placeholder="Select tax configuration..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Tax</SelectItem>
                              {gstSettings.map((setting: any) => (
                                <SelectItem
                                  key={setting.id}
                                  value={setting.id.toString()}
                                >
                                  {setting.taxName} ({setting.country})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedTaxSettingId &&
                          selectedTaxSettingId !== "none" &&
                          gstRates.length > 0 && (
                            <div>
                              <Label htmlFor="taxRate">Tax Rate</Label>
                              <Select
                                value={selectedTaxRateId}
                                onValueChange={setSelectedTaxRateId}
                              >
                                <SelectTrigger data-testid="select-tax-rate">
                                  <SelectValue placeholder="Select tax rate..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {gstRates.map((rate: any) => (
                                    <SelectItem
                                      key={rate.id}
                                      value={rate.id.toString()}
                                    >
                                      {rate.rateName} ({rate.ratePercentage}%)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                        {selectedTaxRateId && (
                          <div>
                            <Label htmlFor="taxType">Tax Type</Label>
                            <Select
                              value={isTaxInclusive ? "inclusive" : "exclusive"}
                              onValueChange={(value) =>
                                setIsTaxInclusive(value === "inclusive")
                              }
                            >
                              <SelectTrigger data-testid="select-tax-type">
                                <SelectValue placeholder="Select tax type..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inclusive">
                                  Tax Inclusive
                                </SelectItem>
                                <SelectItem value="exclusive">
                                  Tax Exclusive
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    )}

                    {invoiceSettings?.showDiscount && (
                      <div>
                        <Label htmlFor="discountAmount">Discount Amount</Label>
                        <Input
                          data-testid="input-discount-amount"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          onKeyPress={handleNumericKeyPress}
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Side - Calculation Summary */}
                  <div className="border-l pl-6 space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Calculation Summary
                    </h3>
                    
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                      <span className="font-medium" data-testid="text-subtotal">
                        ₹{calculateGrandTotal().toFixed(2)}
                      </span>
                    </div>

                    {invoiceSettings?.showTax && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-700 dark:text-gray-300">Tax:</span>
                        <span className="font-medium" data-testid="text-tax">
                          ₹{lineItems.reduce(
                            (total, item) => total + parseFloat(item.tax || "0"),
                            0
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {invoiceSettings?.showDiscount && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-700 dark:text-gray-300">Discount:</span>
                        <span className="font-medium text-red-600" data-testid="text-discount">
                          -₹{parseFloat(discountAmount || "0").toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-3 bg-cyan-50 dark:bg-cyan-950/20 px-3 rounded-lg">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                      <span className="text-lg font-bold text-cyan-600" data-testid="text-total-amount">
                        ₹{(calculateGrandTotal() - parseFloat(discountAmount || "0")).toFixed(2)}
                      </span>
                    </div>

                    <div className="pt-2">
                      <Label htmlFor="amountPaid" className="mb-2 block">Amount Paid</Label>
                      <Input
                        data-testid="input-amount-paid"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        onKeyPress={handleNumericKeyPress}
                        placeholder="0"
                        className="text-lg font-medium"
                      />
                    </div>

                    {/* Payment Installments Section */}
                    <div className="pt-4 border-t mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label htmlFor="enableInstallments" className="text-sm font-semibold">
                          Enable Payment Installments
                        </Label>
                        <Switch
                          id="enableInstallments"
                          checked={enableInstallments}
                          onCheckedChange={setEnableInstallments}
                          data-testid="switch-enable-installments"
                        />
                      </div>

                      {enableInstallments && (
                        <div className="space-y-3 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Number of Installments</Label>
                              <Input
                                type="number"
                                min="2"
                                max="12"
                                value={numberOfInstallments}
                                onChange={(e) => setNumberOfInstallments(e.target.value)}
                                data-testid="input-number-installments"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Frequency</Label>
                              <Select
                                value={installmentFrequency}
                                onValueChange={setInstallmentFrequency}
                              >
                                <SelectTrigger data-testid="select-installment-frequency" className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Installment Preview */}
                          {calculateInstallments().length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-semibold mb-2">Installment Plan Preview</h4>
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left pb-2">#</th>
                                      <th className="text-left pb-2">Due Date</th>
                                      <th className="text-right pb-2">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {calculateInstallments().map((inst) => (
                                      <tr key={inst.installmentNumber} className="border-b last:border-0">
                                        <td className="py-2">{inst.installmentNumber}</td>
                                        <td className="py-2">{new Date(inst.dueDate).toLocaleDateString()}</td>
                                        <td className="py-2 text-right font-medium">₹{inst.amount}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <div className="mt-3 pt-2 border-t flex justify-between font-semibold">
                                  <span>Total Pending:</span>
                                  <span className="text-cyan-600">
                                    ₹{(calculateGrandTotal() - parseFloat(discountAmount || "0") - parseFloat(amountPaid || "0")).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {(generateExpenses().length > 0 || manualExpenses.length > 0) && (
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-cyan-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Expenses ({getAllExpenses().length})
                      </h3>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addManualExpense}
                      data-testid="button-add-manual-expense"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Manual Expense
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Auto-generated expenses from purchase prices and manually added expenses
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          <th className="px-4 py-2 text-left text-sm font-medium">
                            Item
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium">
                            Title
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium">
                            Category
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium">
                            Vendor
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium">
                            Qty
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-medium">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getAllExpenses().map((expense, idx) =>
                          expense.expenseType === "manual" ? (
                            <tr
                              key={idx}
                              className="border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20"
                            >
                              <td className="px-4 py-3 text-sm">
                                {expense.itemIndex}
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  value={expense.title}
                                  onChange={(e) =>
                                    updateManualExpense(
                                      parseInt(expense.itemIndex.split("-")[1]) - 1,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Expense title"
                                  className="h-8"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <AutocompleteInput
                                  suggestions={getTravelCategories().filter(
                                    (cat) => cat.value !== "create_new",
                                  )}
                                  value={expense.category}
                                  onValueChange={(value) =>
                                    updateManualExpense(
                                      parseInt(expense.itemIndex.split("-")[1]) - 1,
                                      "category",
                                      value,
                                    )
                                  }
                                  placeholder="Category"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <AutocompleteInput
                                  suggestions={getVendorOptions().filter(
                                    (v) => v.value !== "create_new",
                                  )}
                                  value={expense.vendorId}
                                  onValueChange={(value) =>
                                    updateManualExpense(
                                      parseInt(expense.itemIndex.split("-")[1]) - 1,
                                      "vendorId",
                                      value,
                                    )
                                  }
                                  placeholder="Vendor"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  value={expense.quantity}
                                  onChange={(e) =>
                                    updateManualExpense(
                                      parseInt(expense.itemIndex.split("-")[1]) - 1,
                                      "quantity",
                                      e.target.value,
                                    )
                                  }
                                  onKeyPress={handleNumericKeyPress}
                                  placeholder="1"
                                  className="h-8 w-16"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={expense.amount}
                                    onChange={(e) =>
                                      updateManualExpense(
                                        parseInt(expense.itemIndex.split("-")[1]) - 1,
                                        "amount",
                                        e.target.value,
                                      )
                                    }
                                    onKeyPress={handleNumericKeyPress}
                                    placeholder="0.00"
                                    className="h-8 w-24"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeManualExpense(
                                        parseInt(expense.itemIndex.split("-")[1]) - 1,
                                      )
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr
                              key={idx}
                              className="border-t border-gray-200 dark:border-gray-700"
                            >
                              <td className="px-4 py-3 text-sm">
                                #{expense.itemIndex + 1}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">
                                {expense.title}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                  {expense.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {expense.vendorName}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {expense.quantity}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-semibold">
                                {currency === "INR"
                                  ? "₹"
                                  : currency === "USD"
                                    ? "$"
                                    : "€"}
                                {expense.amount.toFixed(2)}
                              </td>
                            </tr>
                          ),
                        )}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-semibold bg-gray-50 dark:bg-gray-900">
                          <td
                            colSpan={5}
                            className="px-4 py-3 text-sm text-right"
                          >
                            Total Expenses:
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {currency === "INR"
                              ? "₹"
                              : currency === "USD"
                                ? "$"
                                : "€"}
                            {getAllExpenses()
                              .reduce((sum, exp) => sum + exp.amount, 0)
                              .toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Profit Calculation Section */}
                  <div className="mt-6 border-t-2 pt-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-green-600">💰</span> Profit Analysis
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Side - Values */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-800">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Total Invoice Amount:</span>
                            <span className="font-semibold text-lg">
                              {currency === "INR" ? "₹" : currency === "USD" ? "$" : "€"}
                              {(calculateGrandTotal() - parseFloat(discountAmount || "0")).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-800">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Total Expenses:</span>
                            <span className="font-semibold text-lg text-red-600">
                              -{currency === "INR" ? "₹" : currency === "USD" ? "$" : "€"}
                              {getAllExpenses()
                                .reduce((sum, exp) => sum + exp.amount, 0)
                                .toFixed(2)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-800">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Tax Amount:</span>
                            <span className="font-semibold text-lg text-blue-600">
                              {currency === "INR" ? "₹" : currency === "USD" ? "$" : "€"}
                              {lineItems.reduce(
                                (total, item) => total + parseFloat(item.tax || "0"),
                                0
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Right Side - Profit Display */}
                        <div className="flex items-center justify-center">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border-2 border-green-500 w-full">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">Net Profit</p>
                            <p className="text-3xl font-bold text-center text-green-600">
                              {currency === "INR" ? "₹" : currency === "USD" ? "$" : "€"}
                              {(
                                (calculateGrandTotal() - parseFloat(discountAmount || "0")) -
                                getAllExpenses().reduce((sum, exp) => sum + exp.amount, 0)
                              ).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                              (Invoice Amount - Expenses)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/invoices")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInvoiceMutation.isPending}
                  data-testid="button-create-invoice"
                >
                  {createInvoiceMutation.isPending
                    ? "Creating..."
                    : "Create Invoice"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Customer Create Slide Panel */}
      <Sheet open={isCustomerPanelOpen} onOpenChange={setIsCustomerPanelOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Customer</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CustomerCreateForm
              tenantId={tenant?.id?.toString() || ""}
              onSuccess={(customer) => {
                queryClient.invalidateQueries({
                  queryKey: [`customers-tenant-${tenant?.id}`],
                });
                setSelectedCustomerId(customer.id?.toString() || "");
                setIsCustomerPanelOpen(false);
                toast({
                  title: "Success",
                  description: "Customer created and selected",
                });
              }}
              onCancel={() => setIsCustomerPanelOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Vendor Create Slide Panel */}
      <Sheet open={isVendorPanelOpen} onOpenChange={setIsVendorPanelOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Vendor</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <VendorCreateForm
              onSuccess={(vendor) => {
                queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
                updateLineItem(
                  currentItemIndex,
                  "vendor",
                  vendor.id?.toString() || "",
                );
                setIsVendorPanelOpen(false);
                toast({
                  title: "Success",
                  description: "Vendor created and selected",
                });
              }}
              onCancel={() => setIsVendorPanelOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Lead Type Create Slide Panel */}
      <Sheet open={isLeadTypePanelOpen} onOpenChange={setIsLeadTypePanelOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Travel Category</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <LeadTypeCreateForm
              onSuccess={(leadType) => {
                queryClient.invalidateQueries({
                  queryKey: [`/api/tenants/${tenant?.id}/lead-types`],
                });
                updateLineItem(
                  currentItemIndex,
                  "travelCategory",
                  leadType.name || "",
                );
                setIsLeadTypePanelOpen(false);
                toast({
                  title: "Success",
                  description: "Travel category created and selected",
                });
              }}
              onCancel={() => setIsLeadTypePanelOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Service Provider Create Slide Panel */}
      <Sheet
        open={isServiceProviderPanelOpen}
        onOpenChange={setIsServiceProviderPanelOpen}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Service Provider</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ServiceProviderCreateForm
              preselectedLeadTypeId={
                lineItems[currentItemIndex]?.travelCategory
                  ? leadTypes
                      .find(
                        (lt: any) =>
                          lt.name ===
                          lineItems[currentItemIndex].travelCategory,
                      )
                      ?.id.toString()
                  : undefined
              }
              onSuccess={(provider) => {
                queryClient.invalidateQueries({
                  queryKey: [`/api/service-providers`, tenant?.id],
                });
                updateLineItem(
                  currentItemIndex,
                  "serviceProviderId",
                  provider.id?.toString() || "",
                );
                setIsServiceProviderPanelOpen(false);
                toast({
                  title: "Success",
                  description: "Service provider created and selected",
                });
              }}
              onCancel={() => setIsServiceProviderPanelOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}

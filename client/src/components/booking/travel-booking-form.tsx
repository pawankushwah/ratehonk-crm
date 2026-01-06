import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { SlidePanel } from "@/components/ui/slide-panel";
import { VendorCreateForm } from "@/components/forms/vendor-create-form";
import { LeadTypeCreateForm } from "@/components/forms/lead-type-create-form";
import { CustomerCreateForm } from "@/components/forms/customer-create-form";
import { LeadCreateForm } from "@/components/forms/lead-create-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Users,
  Plus,
  Trash2,
  Plane,
  Hotel,
  Car,
  MapPin,
  CreditCard,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { directLeadsApi } from "@/lib/direct-leads-api";
import { handleNumericKeyDown } from "@/lib/utils";

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
  frequentFlyerNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  roomPreference: z.string().optional(),
  bedPreference: z.string().optional(),
  driverLicenseNumber: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
});

const lineItemSchema = z.object({
  leadTypeId: z.string().min(1, "Travel category is required"),
  vendorId: z.string().optional(),
  itemTitle: z.string().min(1, "Item title is required"),
  packageId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  voucherNumber: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  purchasePrice: z.number().min(0, "Purchase price cannot be negative"),
  tax: z.number().min(0, "Tax cannot be negative").default(0),
  totalAmount: z.number().min(0, "Total amount cannot be negative"),
});

const bookingSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  leadId: z.string().optional(),
  leadTypeId: z.string().optional(),
  travelers: z.number().min(1, "At least one traveler is required"),
  bookingDate: z.string().min(1, "Booking date is required"),
  travelDate: z.string().min(1, "Travel date is required"),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
  discountAmount: z.number().min(0, "Discount cannot be negative").default(0),
  amountPaid: z.number().min(0, "Amount paid cannot be negative").default(0),
  paymentStatus: z.string().default("pending"),
  status: z.string().default("pending"),
  specialRequests: z.string().optional(),
  vendorId: z.string().optional(),
  passengers: z
    .array(passengerSchema)
    .min(1, "At least one passenger is required"),
  dynamicData: z.any().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface TravelBookingFormProps {
  booking?: any;
  tenantId: string;
  onSubmit: (data: BookingFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TravelBookingForm({
  booking,
  tenantId,
  onSubmit,
  onCancel,
  isLoading = false,
}: TravelBookingFormProps) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState(
    booking?.leadTypeId || "",
  );
  const [selectedLead, setSelectedLead] = useState(booking?.leadId || "");
  const [selectedLeadData, setSelectedLeadData] = useState<any>(null);
  const [isLeadTypePanelOpen, setIsLeadTypePanelOpen] = useState(false);
  const [isVendorPanelOpen, setIsVendorPanelOpen] = useState(false);
  const [isCustomerPanelOpen, setIsCustomerPanelOpen] = useState(false);
  const [isLeadPanelOpen, setIsLeadPanelOpen] = useState(false);

  const parseInitialBookingData = () => {
    if (!booking) return { passengers: [], lineItems: [] };

    let passengers = [];
    let lineItems = [];

    if (booking.bookingData) {
      try {
        const bookingDataParsed =
          typeof booking.bookingData === "string"
            ? JSON.parse(booking.bookingData)
            : booking.bookingData;

        if (Array.isArray(bookingDataParsed)) {
          passengers = bookingDataParsed;
        } else if (bookingDataParsed && bookingDataParsed.passengers) {
          passengers = bookingDataParsed.passengers;
        }
      } catch (error) {
        console.error("Error parsing bookingData:", error);
      }
    }

    if (booking.dynamicData) {
      try {
        const dynamicDataParsed =
          typeof booking.dynamicData === "string"
            ? JSON.parse(booking.dynamicData)
            : booking.dynamicData;

        if (Array.isArray(dynamicDataParsed)) {
          lineItems = dynamicDataParsed;
        } else if (dynamicDataParsed && dynamicDataParsed.lineItems) {
          lineItems = dynamicDataParsed.lineItems;
        }
      } catch (error) {
        console.error("Error parsing dynamicData:", error);
      }
    }

    if (passengers.length === 0 && booking.passengers) {
      passengers = Array.isArray(booking.passengers)
        ? booking.passengers
        : [booking.passengers];
    }

    if (lineItems.length === 0 && booking.lineItems) {
      lineItems = Array.isArray(booking.lineItems)
        ? booking.lineItems
        : [booking.lineItems];
    }

    if (passengers.length === 0) {
      passengers = [
        {
          firstName: "",
          lastName: "",
          isMainPassenger: true,
        },
      ];
    }

    if (lineItems.length === 0) {
      lineItems = [
        {
          leadTypeId: booking.leadTypeId?.toString() || "",
          vendorId: booking.vendorId?.toString() || "",
          itemTitle: booking.bookingNumber || "Travel Booking",
          packageId: booking.packageId?.toString() || "",
          invoiceNumber: booking.invoiceNo || "",
          voucherNumber: booking.voucherNo || "",
          quantity: 1,
          unitPrice: booking.totalAmount ? parseFloat(booking.totalAmount) : 0,
          sellingPrice: booking.sellingPrice
            ? parseFloat(booking.sellingPrice)
            : 0,
          purchasePrice: booking.purchasePrice
            ? parseFloat(booking.purchasePrice)
            : 0,
          tax: 0,
          totalAmount: booking.totalAmount
            ? parseFloat(booking.totalAmount)
            : 0,
        },
      ];
    }

    return { passengers, lineItems };
  };

  const { passengers: initialPassengers, lineItems: initialLineItems } =
    parseInitialBookingData();

  const [lineItems, setLineItems] = useState(
    initialLineItems.length > 0
      ? initialLineItems
      : [
          {
            leadTypeId: "",
            vendorId: "",
            itemTitle: "",
            packageId: "",
            invoiceNumber: "",
            voucherNumber: "",
            quantity: 1,
            unitPrice: 0,
            sellingPrice: 0,
            purchasePrice: 0,
            tax: 0,
            totalAmount: 0,
          },
        ],
  );

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerId: booking?.customerId?.toString() || "",
      leadTypeId: booking?.leadTypeId?.toString() || "",
      leadId: booking?.leadId?.toString() || "",
      bookingDate:
        booking?.bookingDate || new Date().toISOString().split("T")[0],
      vendorId: booking?.vendorId?.toString() || "",
      travelers: booking?.travelers || 1,
      travelDate: booking?.travelDate
        ? new Date(booking.travelDate).toISOString().split("T")[0]
        : "",
      discountAmount: booking?.discountAmount
        ? parseFloat(booking.discountAmount)
        : 0,
      amountPaid: booking?.amountPaid ? parseFloat(booking.amountPaid) : 0,
      paymentStatus: booking?.paymentStatus || "pending",
      status: booking?.status || "pending",
      specialRequests: booking?.specialRequests || "",
      lineItems:
        initialLineItems.length > 0
          ? initialLineItems
          : [
              {
                leadTypeId: "",
                vendorId: "",
                itemTitle: "",
                packageId: "",
                invoiceNumber: "",
                voucherNumber: "",
                quantity: 1,
                unitPrice: 0,
                sellingPrice: 0,
                purchasePrice: 0,
                tax: 0,
                totalAmount: 0,
              },
            ],
      passengers:
        initialPassengers.length > 0
          ? initialPassengers
          : [
              {
                firstName: "",
                lastName: "",
                isMainPassenger: true,
              },
            ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "passengers",
  });

  const { data: customers = [] } = useQuery({
    queryKey: [`customers-tenant-${tenantId}`],
    enabled: !!tenantId,
    queryFn: async () => {
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/customers?action=get-customers&tenantId=${tenantId}&all=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        return [];
      }
      const result = await response.json();
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

  const { data: travelCategories = [] } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/lead-types`],
    enabled: !!tenantId,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/tenants/${tenantId}/lead-types`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch travel categories");
      const result = await response.json();
      return Array.isArray(result) ? result : result.leadTypes || [];
    },
  });

  const { data: dynamicFields = [] } = useQuery({
    queryKey: [`booking-dynamic-fields-${tenantId}`],
    enabled: !!tenantId,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/tenants/${tenantId}/dynamic-fields`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.filter((field: any) => field.show_in_bookings !== false);
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: [`leads-tenant-${tenantId}-won`],
    enabled: !!tenantId,
    queryFn: async () => {
      const result = await directLeadsApi.getLeads(parseInt(tenantId));
      const allLeads = Array.isArray(result) ? result : [];
      return allLeads.filter((lead: any) => lead.status === "closed_won");
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: [`vendors-tenant-${tenantId}`],
    enabled: !!tenantId,
    queryFn: async () => {
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      const response = await fetch("/api/vendors", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        return [];
      }
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: travelPackages = [] } = useQuery({
    queryKey: [`travel-packages-${tenantId}`],
    enabled: !!tenantId,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(
        `/api/tenants/${tenantId}/packages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : result.packages || [];
    },
  });

  useEffect(() => {
    const passengersCount = fields.length;
    form.setValue("travelers", passengersCount);
  }, [fields.length, form]);

  useEffect(() => {
    form.setValue("lineItems", lineItems);
  }, [lineItems, form]);

  useEffect(() => {
    if (booking && initialLineItems.length > 0) {
      setLineItems(initialLineItems);
    }
  }, [booking, initialLineItems]);

  useEffect(() => {
    if (booking) {
      form.reset({
        customerId: booking.customerId?.toString() || "",
        leadTypeId: booking.leadTypeId?.toString() || "",
        leadId: booking.leadId?.toString() || "",
        bookingDate:
          booking.bookingDate || new Date().toISOString().split("T")[0],
        vendorId: booking.vendorId?.toString() || "",
        travelers: booking.travelers || 1,
        travelDate: booking.travelDate
          ? new Date(booking.travelDate).toISOString().split("T")[0]
          : "",
        discountAmount: booking.discountAmount
          ? parseFloat(booking.discountAmount)
          : 0,
        amountPaid: booking.amountPaid ? parseFloat(booking.amountPaid) : 0,
        paymentStatus: booking.paymentStatus || "pending",
        status: booking.status || "pending",
        specialRequests: booking.specialRequests || "",
        lineItems:
          initialLineItems.length > 0
            ? initialLineItems
            : [
                {
                  leadTypeId: "",
                  vendorId: "",
                  itemTitle: "",
                  packageId: "",
                  invoiceNumber: "",
                  voucherNumber: "",
                  quantity: 1,
                  unitPrice: 0,
                  sellingPrice: 0,
                  purchasePrice: 0,
                  tax: 0,
                  totalAmount: 0,
                },
              ],
        passengers:
          initialPassengers.length > 0
            ? initialPassengers
            : [
                {
                  firstName: "",
                  lastName: "",
                  isMainPassenger: true,
                },
              ],
      });
      setSelectedCategory(booking.leadTypeId?.toString() || "");
      setSelectedLead(booking.leadId?.toString() || "");
    }
  }, [booking, form, initialLineItems, initialPassengers]);

  useEffect(() => {
    if (selectedCategory) {
      form.setValue("leadTypeId", selectedCategory);
    }
  }, [selectedCategory, form]);

  useEffect(() => {
    if (selectedLead && leads.length > 0) {
      const lead = leads.find((l: any) => l.id.toString() === selectedLead);
      if (lead) {
        setSelectedLeadData(lead);
        if (lead.convertedToCustomerId) {
          form.setValue("customerId", lead.convertedToCustomerId.toString());
        } else if (lead.email && customers.length > 0) {
          const matchingCustomer = customers.find(
            (customer: any) =>
              customer.email &&
              customer.email.toLowerCase() === lead.email.toLowerCase(),
          );
          if (matchingCustomer) {
            form.setValue("customerId", matchingCustomer.id.toString());
          }
        }
        if (lead.leadTypeId) {
          form.setValue("leadTypeId", lead.leadTypeId.toString());
          setSelectedCategory(lead.leadTypeId.toString());
        }
      }
    } else {
      setSelectedLeadData(null);
    }
  }, [selectedLead, leads, customers, form]);

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      "Flight Booking": <Plane className="h-4 w-4" />,
      "Hotel Booking": <Hotel className="h-4 w-4" />,
      "Car Rental": <Car className="h-4 w-4" />,
      "Event Booking": <Calendar className="h-4 w-4" />,
      "Package Tour": <MapPin className="h-4 w-4" />,
      "Travel Package": <MapPin className="h-4 w-4" />,
    };
    return iconMap[categoryName] || <MapPin className="h-4 w-4" />;
  };

  const addPassenger = () => {
    append({
      firstName: "",
      lastName: "",
      isMainPassenger: false,
    });
  };

  const removePassenger = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        leadTypeId: "",
        vendorId: "",
        itemTitle: "",
        packageId: "",
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

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_: any, i: number) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    if (field === "quantity" || field === "unitPrice" || field === "tax") {
      const quantity = updated[index].quantity || 0;
      const unitPrice = updated[index].unitPrice || 0;
      const tax = updated[index].tax || 0;
      updated[index].totalAmount = quantity * unitPrice + tax;
    }
    setLineItems(updated);
  };

  const calculateTotalAmount = () => {
    return lineItems.reduce((sum: number, item: any) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const tax = item.tax || 0;
      return sum + quantity * unitPrice + tax;
    }, 0);
  };

  const selectedCategoryData = travelCategories.find(
    (cat: any) => cat.id.toString() === selectedCategory,
  );
  const selectedCategoryName = selectedCategoryData?.name || "";

  const getRelevantFieldsForCategory = () => {
    const categoryName = selectedCategoryName.toLowerCase();
    const allBasicFields = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "gender",
      "nationality",
      "email",
      "phone",
      "dietaryRestrictions",
      "medicalConditions",
      "specialRequests",
    ];

    if (categoryName.includes("flight") || categoryName.includes("plane")) {
      return [
        ...allBasicFields,
        "passportNumber",
        "passportExpiry",
        "frequentFlyerNumber",
        "emergencyContactName",
        "emergencyContactPhone",
        "seatPreference",
      ];
    } else if (categoryName.includes("hotel")) {
      return [
        ...allBasicFields,
        "roomPreference",
        "bedPreference",
        "passportNumber",
        "passportExpiry",
      ];
    } else if (categoryName.includes("car") || categoryName.includes("rental")) {
      return [
        ...allBasicFields,
        "driverLicenseNumber",
        "licenseExpiryDate",
        "passportNumber",
      ];
    } else {
      return allBasicFields;
    }
  };

  const relevantFields = getRelevantFieldsForCategory();

  const renderDynamicField = (field: any, passengerIndex?: number) => {
    const fieldName = passengerIndex !== undefined
      ? `passengers.${passengerIndex}.${field.field_name}`
      : `dynamicData.${field.field_name}`;

    switch (field.field_type) {
      case "text":
      case "email":
      case "url":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type={field.field_type}
                    placeholder={field.placeholder || ""}
                    {...formField}
                    className="mt-1.5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "number":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={field.placeholder || ""}
                    {...formField}
                    onChange={(e) =>
                      formField.onChange(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1.5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "textarea":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={field.placeholder || ""}
                    {...formField}
                    className="mt-1.5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "select":
        const options = field.options || [];
        const selectOptions = Array.isArray(options)
          ? options.map((opt: string) => ({ value: opt, label: opt }))
          : [];
        
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Combobox
                    options={selectOptions}
                    value={formField.value}
                    onValueChange={formField.onChange}
                    placeholder={field.placeholder || `Select ${field.label}`}
                    emptyText="No options available"
                    className="mt-1.5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "date":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input type="date" {...formField} className="mt-1.5" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "checkbox":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName as any}
            render={({ field: formField }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={formField.value}
                    onChange={(e) => formField.onChange(e.target.checked)}
                    className="h-4 w-4"
                  />
                </FormControl>
                <FormLabel className="!mt-0">{field.label}</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  const leadOptions = [
    {
      value: "create_new_lead",
      label: "+ Create New Lead",
      icon: <Plus className="h-4 w-4 text-cyan-600" />,
    },
    { value: "", label: "No lead selected" },
    ...leads.map((lead: any) => ({
      value: lead.id.toString(),
      label: `${lead.firstName} ${lead.lastName} - ${lead.email}`,
    })),
  ];

  const customerOptions = [
    {
      value: "create_new_customer",
      label: "+ Create New Customer",
      icon: <Plus className="h-4 w-4 text-cyan-600" />,
    },
    ...customers.map((customer: any) => ({
      value: customer.id.toString(),
      label: `${customer.name} - ${customer.email}`,
    })),
  ];

  const travelCategoryOptions = [
    {
      value: "create_new",
      label: "+ Create New Lead Type",
      icon: <Plus className="h-4 w-4 text-cyan-600" />,
    },
    ...travelCategories.map((category: any) => ({
      value: category.id.toString(),
      label: category.name,
      icon: getCategoryIcon(category.name),
    })),
  ];

  const vendorOptions = [
    {
      value: "create_new",
      label: "+ Create New Vendor",
      icon: <Plus className="h-4 w-4 text-cyan-600" />,
    },
    { value: "", label: "No vendor" },
    ...vendors.map((vendor: any) => ({
      value: vendor.id.toString(),
      label: `${vendor.name} - ${vendor.email}`,
    })),
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
  ];

  const paymentStatusOptions = [
    { value: "pending", label: "Pending" },
    { value: "partial", label: "Partial" },
    { value: "paid", label: "Paid" },
  ];

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  const seatPreferenceOptions = [
    { value: "window", label: "Window" },
    { value: "aisle", label: "Aisle" },
    { value: "middle", label: "Middle" },
    { value: "no_preference", label: "No Preference" },
  ];

  const roomPreferenceOptions = [
    { value: "single", label: "Single" },
    { value: "double", label: "Double" },
    { value: "twin", label: "Twin" },
    { value: "suite", label: "Suite" },
  ];

  const bedPreferenceOptions = [
    { value: "king", label: "King" },
    { value: "queen", label: "Queen" },
    { value: "twin", label: "Twin" },
    { value: "sofa_bed", label: "Sofa Bed" },
  ];

  const packageOptions = travelPackages.map((pkg: any) => ({
    value: pkg.id.toString(),
    label: pkg.name,
  }));

  const handleLeadTypeChange = (value: string, field: any) => {
    if (value === "create_new") {
      setIsLeadTypePanelOpen(true);
    } else {
      field.onChange(value);
      setSelectedCategory(value);
    }
  };

  const handleVendorChange = (value: string, field: any) => {
    if (value === "create_new") {
      setIsVendorPanelOpen(true);
    } else {
      field.onChange(value);
    }
  };

  const handleCustomerChange = (value: string, field: any) => {
    if (value === "create_new_customer") {
      setIsCustomerPanelOpen(true);
    } else {
      field.onChange(value);
    }
  };

  const handleLeadSelectionChange = (value: string) => {
    if (value === "create_new_lead") {
      setIsLeadPanelOpen(true);
    } else {
      setSelectedLead(value);
    }
  };

  const handleLineItemVendorChange = (index: number, value: string) => {
    if (value === "create_new") {
      setIsVendorPanelOpen(true);
    } else {
      updateLineItem(index, "vendorId", value);
    }
  };

  const handleLineItemLeadTypeChange = (index: number, value: string) => {
    if (value === "create_new") {
      setIsLeadTypePanelOpen(true);
    } else {
      updateLineItem(index, "leadTypeId", value);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-6">
              <Label>Lead (Optional)</Label>
              <Combobox
                options={leadOptions}
                value={selectedLead}
                onValueChange={handleLeadSelectionChange}
                placeholder="Select lead (optional)"
                emptyText="No won leads found"
                className="mt-1.5"
              />
            </div>

            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-6">
                  <FormLabel>Customer *</FormLabel>
                  <FormControl>
                    <Combobox
                      options={customerOptions}
                      value={field.value}
                      onValueChange={(value: string) => handleCustomerChange(value, field)}
                      placeholder="Select customer"
                      emptyText="No customers found"
                      className="mt-1.5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leadTypeId"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-6">
                  <FormLabel>Travel Category *</FormLabel>
                  <FormControl>
                    <Combobox
                      options={travelCategoryOptions}
                      value={field.value}
                      onValueChange={(value: string) => handleLeadTypeChange(value, field)}
                      placeholder="Select travel category"
                      emptyText="No categories found"
                      className="mt-1.5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-6">
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <Combobox
                      options={vendorOptions}
                      value={field.value}
                      onValueChange={(value: string) => handleVendorChange(value, field)}
                      placeholder="Select vendor (optional)"
                      emptyText="No vendors found"
                      className="mt-1.5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bookingDate"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-6">
                  <FormLabel>Booking Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="mt-1.5" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="travelDate"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-6">
                  <FormLabel>Travel Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="mt-1.5" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-6">
                  <FormLabel>Booking Status</FormLabel>
                  <FormControl>
                    <Combobox
                      options={statusOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select status"
                      className="mt-1.5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h3 className="font-medium">
                Passenger Details ({fields.length}{" "}
                {fields.length === 1 ? "Passenger" : "Passengers"})
              </h3>
              {selectedCategoryName && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCategoryName} Fields
                </Badge>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPassenger}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Passenger
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  Passenger {index + 1}
                  {form.watch(`passengers.${index}.isMainPassenger`) && (
                    <Badge variant="secondary">Main Passenger</Badge>
                  )}
                </h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePassenger(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-12 gap-3">
                {relevantFields.includes("firstName") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.firstName`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter first name"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("lastName") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.lastName`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter last name"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("dateOfBirth") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.dateOfBirth`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="mt-1.5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("gender") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.gender`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Combobox
                            options={genderOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select gender"
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("nationality") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.nationality`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter nationality"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("email") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.email`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter email"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("phone") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.phone`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter phone number"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("passportNumber") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.passportNumber`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Passport Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter passport number"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("passportExpiry") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.passportExpiry`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Passport Expiry</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="mt-1.5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("frequentFlyerNumber") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.frequentFlyerNumber`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Frequent Flyer Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter frequent flyer number"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("emergencyContactName") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.emergencyContactName`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter emergency contact name"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("emergencyContactPhone") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.emergencyContactPhone`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Emergency Contact Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter emergency contact phone"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("seatPreference") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.seatPreference`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Seat Preference</FormLabel>
                        <FormControl>
                          <Combobox
                            options={seatPreferenceOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select seat preference"
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("roomPreference") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.roomPreference`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Room Preference</FormLabel>
                        <FormControl>
                          <Combobox
                            options={roomPreferenceOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select room preference"
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("bedPreference") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.bedPreference`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Bed Preference</FormLabel>
                        <FormControl>
                          <Combobox
                            options={bedPreferenceOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select bed preference"
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("driverLicenseNumber") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.driverLicenseNumber`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>Driver License Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter driver license number"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("licenseExpiryDate") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.licenseExpiryDate`}
                    render={({ field }) => (
                      <FormItem className="col-span-12 md:col-span-6">
                        <FormLabel>License Expiry Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="mt-1.5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("dietaryRestrictions") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.dietaryRestrictions`}
                    render={({ field }) => (
                      <FormItem className="col-span-12">
                        <FormLabel>Dietary Restrictions</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter dietary restrictions"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("medicalConditions") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.medicalConditions`}
                    render={({ field }) => (
                      <FormItem className="col-span-12">
                        <FormLabel>Medical Conditions</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter medical conditions"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {relevantFields.includes("specialRequests") && (
                  <FormField
                    control={form.control}
                    name={`passengers.${index}.specialRequests`}
                    render={({ field }) => (
                      <FormItem className="col-span-12">
                        <FormLabel>Special Requests</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter special requests"
                            {...field}
                            className="mt-1.5"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {dynamicFields
                  .filter((df: any) => df.show_in_bookings)
                  .map((df: any) => (
                    <div key={df.id} className="col-span-12 md:col-span-6">
                      {renderDynamicField(df, index)}
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <div className="mt-6 mb-3 flex items-center justify-between">
            <h3 className="font-medium">Booking Line Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          {lineItems.map((item: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Item {index + 1}</h4>
                {lineItems.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6">
                  <Label>Travel Category *</Label>
                  <Combobox
                    options={travelCategoryOptions}
                    value={item.leadTypeId}
                    onValueChange={(value: string) =>
                      handleLineItemLeadTypeChange(index, value)
                    }
                    placeholder="Select category"
                    emptyText="No categories found"
                    className="mt-1.5"
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <Label>Vendor</Label>
                  <Combobox
                    options={vendorOptions}
                    value={item.vendorId}
                    onValueChange={(value: string) => handleLineItemVendorChange(index, value)}
                    placeholder="Select vendor (optional)"
                    emptyText="No vendors found"
                    className="mt-1.5"
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <Label>Item Title *</Label>
                  <Input
                    value={item.itemTitle}
                    onChange={(e) =>
                      updateLineItem(index, "itemTitle", e.target.value)
                    }
                    placeholder="Enter item title"
                    className="mt-1.5"
                  />
                </div>

                {packageOptions.length > 0 && (
                  <div className="col-span-12 md:col-span-6">
                    <Label>Package</Label>
                    <Combobox
                      options={packageOptions}
                      value={item.packageId}
                      onValueChange={(value: string) =>
                        updateLineItem(index, "packageId", value)
                      }
                      placeholder="Select package (optional)"
                      emptyText="No packages found"
                      className="mt-1.5"
                    />
                  </div>
                )}

                <div className="col-span-12 md:col-span-6">
                  <Label>Invoice Number</Label>
                  <Input
                    value={item.invoiceNumber}
                    onChange={(e) =>
                      updateLineItem(index, "invoiceNumber", e.target.value)
                    }
                    placeholder="Enter invoice number"
                    className="mt-1.5"
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <Label>Voucher Number</Label>
                  <Input
                    value={item.voucherNumber}
                    onChange={(e) =>
                      updateLineItem(index, "voucherNumber", e.target.value)
                    }
                    placeholder="Enter voucher number"
                    className="mt-1.5"
                  />
                </div>

                <div className="col-span-12 md:col-span-4">
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
                    onKeyDown={handleNumericKeyDown}
                    className="mt-1.5"
                  />
                </div>

                <div className="col-span-12 md:col-span-4">
                  <Label>Unit Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateLineItem(
                        index,
                        "unitPrice",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    onKeyDown={handleNumericKeyDown}
                    className="mt-1.5"
                  />
                </div>

                <div className="col-span-12 md:col-span-4">
                  <Label>Tax</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.tax}
                    onChange={(e) =>
                      updateLineItem(index, "tax", parseFloat(e.target.value) || 0)
                    }
                    onKeyDown={handleNumericKeyDown}
                    className="mt-1.5"
                  />
                </div>

                <div className="col-span-12 md:col-span-4">
                  <Label>Selling Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.sellingPrice}
                    onChange={(e) =>
                      updateLineItem(
                        index,
                        "sellingPrice",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    onKeyDown={handleNumericKeyDown}
                    className="mt-1.5"
                  />
                </div>

                <div className="col-span-12 md:col-span-4">
                  <Label>Purchase Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.purchasePrice}
                    onChange={(e) =>
                      updateLineItem(
                        index,
                        "purchasePrice",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    onKeyDown={handleNumericKeyDown}
                    className="mt-1.5"
                  />
                </div>

                <div className="col-span-12 md:col-span-4">
                  <Label>Total Amount</Label>
                  <Input
                    type="number"
                    value={item.totalAmount}
                    readOnly
                    className="mt-1.5 bg-gray-100 dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          ))}

          {selectedLeadData && selectedLeadData.travelDetails && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Travel Details from Lead
              </h3>
              <div className="grid grid-cols-12 gap-3">
                {Object.entries(selectedLeadData.travelDetails).map(
                  ([key, value]: [string, any]) => (
                    <div key={key} className="col-span-12 md:col-span-6">
                      <Label className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </Label>
                      <p className="mt-1 text-sm">{value || "N/A"}</p>
                    </div>
                  ),
                )}
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-3">
                <strong>Note:</strong> These travel details are automatically
                populated from the selected lead. They reflect the original
                inquiry information and travel preferences.
              </p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment & Special Requests
            </h3>

            <div className="grid grid-cols-12 gap-3">
              <FormField
                control={form.control}
                name="discountAmount"
                render={({ field }) => (
                  <FormItem className="col-span-12 md:col-span-4">
                    <FormLabel>Discount Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        onKeyDown={handleNumericKeyDown}
                        className="mt-1.5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amountPaid"
                render={({ field }) => (
                  <FormItem className="col-span-12 md:col-span-4">
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        onKeyDown={handleNumericKeyDown}
                        className="mt-1.5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem className="col-span-12 md:col-span-4">
                    <FormLabel>Payment Status</FormLabel>
                    <FormControl>
                      <Combobox
                        options={paymentStatusOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select status"
                        className="mt-1.5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-3">
              <h4 className="font-medium mb-2">Payment Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-300">
                    Total Amount:
                  </span>
                  <div className="font-medium">
                    ₹{calculateTotalAmount().toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">
                    Discount:
                  </span>
                  <div className="font-medium text-green-600">
                    -₹{form.watch("discountAmount")?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">
                    Final Amount:
                  </span>
                  <div className="font-medium text-blue-600">
                    ₹
                    {(
                      calculateTotalAmount() -
                      (form.watch("discountAmount") || 0)
                    ).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">
                    Remaining:
                  </span>
                  <div className="font-medium text-red-600">
                    ₹
                    {(
                      calculateTotalAmount() -
                      (form.watch("discountAmount") || 0) -
                      (form.watch("amountPaid") || 0)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="specialRequests"
              render={({ field }) => (
                <FormItem className="mt-3">
                  <FormLabel>Special Requests / Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requests, notes, or important information for this booking"
                      rows={4}
                      {...field}
                      className="mt-1.5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[140px]"
            >
              {isLoading
                ? "Saving..."
                : booking
                  ? "Update Booking"
                  : "Create Booking"}
            </Button>
          </div>
        </form>
      </Form>

      <SlidePanel
        isOpen={isLeadTypePanelOpen}
        onClose={() => setIsLeadTypePanelOpen(false)}
        title="Create New Lead Type"
      >
        <LeadTypeCreateForm
          onSuccess={(leadType) => {
            form.setValue("leadTypeId", leadType.id.toString());
            setSelectedCategory(leadType.id.toString());
            setIsLeadTypePanelOpen(false);
            queryClient.invalidateQueries({
              queryKey: [`/api/tenants/${tenantId}/lead-types`],
            });
          }}
          onCancel={() => setIsLeadTypePanelOpen(false)}
        />
      </SlidePanel>

      <SlidePanel
        isOpen={isVendorPanelOpen}
        onClose={() => setIsVendorPanelOpen(false)}
        title="Create New Vendor"
      >
        <VendorCreateForm
          onSuccess={(vendor) => {
            form.setValue("vendorId", vendor.id.toString());
            setIsVendorPanelOpen(false);
            queryClient.invalidateQueries({
              queryKey: [`vendors-tenant-${tenantId}`],
            });
          }}
          onCancel={() => setIsVendorPanelOpen(false)}
        />
      </SlidePanel>

      <SlidePanel
        isOpen={isCustomerPanelOpen}
        onClose={() => setIsCustomerPanelOpen(false)}
        title="Create New Customer"
      >
        <CustomerCreateForm
          tenantId={tenantId}
          onSuccess={(customer) => {
            form.setValue("customerId", customer.id.toString());
            setIsCustomerPanelOpen(false);
            queryClient.invalidateQueries({
              queryKey: [`customers-tenant-${tenantId}`],
            });
          }}
          onCancel={() => setIsCustomerPanelOpen(false)}
        />
      </SlidePanel>

      <SlidePanel
        isOpen={isLeadPanelOpen}
        onClose={() => setIsLeadPanelOpen(false)}
        title="Create New Lead"
      >
        <LeadCreateForm
          tenantId={tenantId}
          onSuccess={(lead) => {
            setSelectedLead(lead.id.toString());
            setIsLeadPanelOpen(false);
            queryClient.invalidateQueries({
              queryKey: [`leads-tenant-${tenantId}-won`],
            });
          }}
          onCancel={() => setIsLeadPanelOpen(false)}
        />
      </SlidePanel>
    </div>
  );
}

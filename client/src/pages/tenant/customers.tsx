import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import { useDebounce } from "@/hooks/use-debounce";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  Eye,
  MoreHorizontal,
  BarChart3,
  Settings,
  HelpCircle,
  Bell,
  X,
  Users,
  Globe,
  MapPin,
  ChevronLeft,
  ChevronDown,
  Phone,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { EnhancedCustomerForm } from "@/components/customer/enhanced-customer-form";
import { directCustomersApi } from "@/lib/direct-customers-api";
import type { Customer } from "@shared/schema";
import { Link } from "wouter";
import { ZoomPhoneEmbed } from "@/components/zoom/zoom-phone-embed";
import { format } from "date-fns";
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
  LineChart,
  Line,
  Legend,
} from "recharts";
import image1 from "../../assets/Nav icon.png";
import { DateFilter } from "@/components/ui/date-filter";
import { buildDateFilters } from "@/lib/date-filter-helpers";

const statusFilters = [
  { value: "all", label: "View all" },
  { value: "new", label: "New" },
  { value: "pending", label: "Pending" },
  { value: "previous", label: "Previous" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const priorityFilters = [
  { value: "all", label: "All priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const typeFilters = [
  { value: "all", label: "All types" },
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
  { value: "corporate", label: "Corporate" },
  { value: "government", label: "Government" },
];

const sourceFilters = [
  { value: "all", label: "All sources" },
  { value: "website", label: "Website" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter" },
  { value: "google", label: "Google" },
  { value: "referral", label: "Referral" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "trade show", label: "Trade Show" },
  { value: "advertisement", label: "Advertisement" },
  { value: "other", label: "Other" },
];

export default function Customers() {
  const { tenant } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  // Debounce search term to avoid multiple API calls while typing
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Reset to page 1 when debounced search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);
  
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  // Additional filters similar to leads page
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );
  const [isZoomDialogOpen, setIsZoomDialogOpen] = useState(false);
  const [customerToCall, setCustomerToCall] = useState<Customer | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check if user has permission to view this page
  if (!canView("customers")) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You don't have permission to view customers.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const { data: customers = [], isLoading } = useQuery({
    queryKey: [
      `customers-tenant-${tenant?.id}`,
      debouncedSearchTerm, // Use debounced search term instead of raw searchTerm
      selectedFilter,
      dateFilter,
      // priorityFilter,
      typeFilter,
      // sourceFilter,
      currentPage,
      itemsPerPage,
      customDateFrom?.toISOString() ?? null,
      customDateTo?.toISOString() ?? null,
    ],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const dateFilters = buildDateFilters(
        dateFilter,
        customDateFrom,
        customDateTo,
      );
      const offset = (currentPage - 1) * itemsPerPage;

      const filters = {
        ...dateFilters,
        search: debouncedSearchTerm, // Use debounced search term for API call
        status: selectedFilter,
        priority: priorityFilter,
        type: typeFilter,
        source: sourceFilter,
        page: currentPage,
        limit: itemsPerPage,
        offset: offset,
      };

      console.log(
        "🔍 Fetching customers with ALL filters + pagination:",
        filters,
      );
      const result = await directCustomersApi.getCustomers(
        tenant?.id!,
        filters,
      );

      // Handle paginated response
      if (result && typeof result === "object" && "data" in result) {
        setTotalItems(result.total || 0);
        return result.data;
      }

      // If it's a direct array, set total to array length
      if (Array.isArray(result)) {
        setTotalItems(result.length);
        return result;
      }

      return [];
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 1,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000,
  });

  const [formValidationErrors, setFormValidationErrors] = useState<Record<string, string>>({});

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      return directCustomersApi.createCustomer(tenant?.id!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`customers-tenant-${tenant?.id}`],
      });
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      setFormValidationErrors({}); // Clear validation errors on success
    },
    onError: (error: any) => {
      // Check if this is a validation error
      if (error.validationErrors && Object.keys(error.validationErrors).length > 0) {
        // Set validation errors to be passed to the form
        setFormValidationErrors(error.validationErrors);
        
        // Show toast with validation message
        const errorMessages = Object.values(error.validationErrors).join(", ");
        toast({
          title: "Validation Error",
          description: errorMessages,
          variant: "destructive",
        });
      } else {
        // Regular error
        toast({
          title: "Error",
          description: error.message || "Failed to create customer",
          variant: "destructive",
        });
        setFormValidationErrors({});
      }
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return directCustomersApi.updateCustomer(tenant?.id!, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`customers-tenant-${tenant?.id}`],
      });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      setIsDialogOpen(false);
      setEditingCustomer(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      return directCustomersApi.deleteCustomer(tenant?.id!, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`customers-tenant-${tenant?.id}`],
      });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statusFilters.find((s) => s.value === status);
    const displayStatus = statusConfig?.label || status;

    switch (status.toLowerCase()) {
      case "new":
        return {
          label: displayStatus,
          color: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "previous":
        return {
          label: displayStatus,
          color: "bg-orange-100 text-orange-800 border-orange-200",
        };
      case "old":
        return {
          label: displayStatus,
          color: "bg-orange-100 text-orange-800 border-orange-200",
        };
      case "pending":
        return {
          label: displayStatus,
          color: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "active":
        return {
          label: displayStatus,
          color: "bg-green-100 text-green-800 border-green-200",
        };
      case "inactive":
        return {
          label: displayStatus,
          color: "bg-gray-100 text-gray-800 border-gray-200",
        };
      default:
        return {
          label: displayStatus,
          color: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const getInitials = (customer: Customer) => {
    const name =
      customer.name ||
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    return (
      name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase() || "C"
    );
  };

  const getDisplayName = (customer: Customer) => {
    return (
      customer.name ||
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
      "Unknown"
    );
  };

  const onSubmit = (data: any) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const handleEdit = (customer: Customer) => {
    console.log("🔍 Edit customer clicked, customer data:", customer);
    console.log("🔍 Customer fields:", {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      country: customer.country,
      state: customer.state,
      city: customer.city,
      status: customer.status,
      crm_status: customer.crm_status,
    });
    setEditingCustomer(customer);
    setFormValidationErrors({}); // Clear validation errors when opening dialog
    setIsDialogOpen(true);
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Layout>
      <div className="flex-1 bg-[#F6F6F6] p-1 mt-0">
        {/* Main Card Container */}
        <div className=" rounded-lg shadow-sm mx-2 my-2">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="">
              <div className=" w-full h-[72px] flex items-center bg-white px-[18px] py-4 rounded-t-xl border-b border-[#E3E8EF] shadow-[0px_1px_6px_0px_rgba(0,0,0,0.05)]">
                {/* Title */}
                <h1 className="font-inter font-medium text-[20px] leading-[24px] text-[#121926]">
                  Customer Management
                </h1>

                {/* Right Icons */}
                <div className="flex gap-3 ml-auto">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                    <Link href="/dynamic-fields">
                      <Settings className="h-5 w-5 text-gray-600" />
                    </Link>
                  </div>
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                    <Link href="/support">
                      <HelpCircle className="h-5 w-5 text-gray-600" />
                    </Link>
                  </div>
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                    <Bell className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-6 mt-5">
            {/* Left Side - Customer Management + Chevron + Customers */}
            <div className="flex items-center p-2">
              <img
                src={image1}
                alt="logo"
                className="w-6 h-6 object-cover rounded-md"
              />
              <span className="bg-gray-100 px-1 py-2 rounded-md">
                Customer Management
              </span>
              {/* <ChevronRight className="h-4 w-4" />

              <div className="flex items-center gap-2 w-auto h-[36px] px-3 py-[6px] rounded-md border border-[rgba(36,99,235,0.6)] bg-[#EEF3FF]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_55_4802)">
                    <path
                      d="M12 1V5C12 5.26522 12.1054 5.51957 12.2929 5.70711C12.4804 5.89464 12.7348 6 13 6H17"
                      stroke="#101828"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 19H5C4.46957 19 3.96086 18.7893 3.58579 18.4142C3.21071 18.0391 3 17.5304 3 17V3C3 2.46957 3.21071 1.96086 3.58579 1.58579C3.96086 1.21071 4.46957 1 5 1H12L17 6V17C17 17.5304 16.7893 18.0391 16.4142 18.4142C16.0391 18.7893 15.5304 19 15 19Z"
                      stroke="#101828"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 9V15"
                      stroke="#101828"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 12H13"
                      stroke="#101828"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_55_4802">
                      <rect width="20" height="20" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                <span className="text-[#101828] text-sm font-medium">
                  Customers
                </span>
              </div> */}
            </div>

            {/* Right Side - Add Customer Button */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="bg-white"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button
                className="
    w-[166px] h-[36px] 
    bg-[#0E76BC] hover:bg-[#0C5F96] 
    text-white text-sm font-medium
    rounded-md 
    flex items-center gap-2
    px-5 py-2
    shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]
  "
                size="sm"
                onClick={() => {
                  setEditingCustomer(null);
                  setFormValidationErrors({}); // Clear validation errors when opening dialog
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 " />
                Add Customer
              </Button>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="mb-6 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md w-[370px] h-[32px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search Customers"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="w-full h-full pl-10 pr-[14px] py-[4px] 
               bg-white border border-[#E3E8EF] 
               rounded-[6px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] 
               text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                    data-testid="input-search-customers"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <DateFilter
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    customDateFrom={customDateFrom}
                    setCustomDateFrom={setCustomDateFrom}
                    customDateTo={customDateTo}
                    setCustomDateTo={setCustomDateTo}
                  />

                  {/* Status Filter */}
                  <Select
                    value={selectedFilter}
                    onValueChange={setSelectedFilter}
                  >
                    <SelectTrigger
                      className="w-32"
                      data-testid="select-status-filter"
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusFilters.map((filter) => (
                        <SelectItem key={filter.value} value={filter.value}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Priority Filter */}
                  {/* <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger
                      className="w-32"
                      data-testid="select-priority-filter"
                    >
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityFilters.map((filter) => (
                        <SelectItem key={filter.value} value={filter.value}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}

                  {/* Type Filter */}
                  {/* <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger
                      className="w-32"
                      data-testid="select-type-filter"
                    >
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeFilters.map((filter) => (
                        <SelectItem key={filter.value} value={filter.value}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}

                  {/* Source Filter */}
                  {/* <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-32" data-testid="select-source-filter">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceFilters.map((filter) => (
                        <SelectItem key={filter.value} value={filter.value}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#EEF2F6] h-[44px] border-b border-[#E4E7EC] rounded-2xl shadow-md">
                  <TableHead className="px-[20px] pr-[8px] py-[12px] text-left text-sm font-medium text-[#121926] first:rounded-tl-lg first:rounded-bl-lg">
                    Customer Name
                  </TableHead>
                  <TableHead className="px-[20px] pr-[8px] py-[12px] text-left text-sm font-medium text-[#121926]">
                    Phone
                  </TableHead>
                  <TableHead className="px-[20px] pr-[8px] py-[12px] text-center text-sm font-medium text-[#121926]">
                    Status
                  </TableHead>
                  <TableHead className="px-[20px] pr-[8px] py-[12px] text-left text-sm font-medium text-[#121926]">
                    Notes
                  </TableHead>
                  <TableHead className="px-[20px] pr-[8px] py-[12px] text-left text-sm font-medium text-[#121926]">
                    Date Added
                  </TableHead>
                  <TableHead className="px-[20px] pr-[8px] py-[12px] text-center text-sm font-medium text-[#121926] last:rounded-tr-lg last:rounded-br-lg">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => {
                    const statusConfig = getStatusBadge(
                      customer.crm_status || customer.status || "new",
                    );
                    console.log(
                      customer.crm_status,
                      customer.status,
                      statusConfig,
                      "statusConfig",
                    );
                    return (
                      <TableRow
                        key={customer.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                        data-testid={`row-customer-${customer.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${getDisplayName(customer)}`}
                                alt={getDisplayName(customer)}
                              />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {getInitials(customer)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <div className="font-medium text-gray-900">
                                {getDisplayName(customer)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-900 text-left">
                          {customer.phone || "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`${statusConfig.color} border`}
                          >
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 max-w-xs truncate text-left">
                          {customer.notes || "No notes"}
                        </TableCell>
                        <TableCell className="text-gray-600 text-left">
                          {customer.createdAt
                            ? format(new Date(customer.createdAt), "dd MMM yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCustomerToCall(customer);
                                setIsZoomDialogOpen(true);
                              }}
                              className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                              data-testid={`button-call-${customer.id}`}
                              title="Call with Zoom"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Link href={`/customers/${customer.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-view-${customer.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(customer)}
                                >
                                  Edit Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDelete(customer)}
                                >
                                  Delete Customer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Items per page:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger
                      className="w-20"
                      data-testid="select-items-per-page"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className="text-sm text-gray-600"
                    data-testid="text-pagination-info"
                  >
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}{" "}
                    - {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                    {totalItems} results
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage <= 1}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, currentPage + 2);

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={
                                currentPage === i ? "default" : "outline"
                              }
                              onClick={() => setCurrentPage(i)}
                              className="w-8 h-8 p-0"
                              data-testid={`button-page-${i}`}
                            >
                              {i}
                            </Button>,
                          );
                        }
                        return pages;
                      })()}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage >= totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Update the customer information below."
                : "Fill in the customer information below."}
            </DialogDescription>
          </DialogHeader>
          <EnhancedCustomerForm
            customer={editingCustomer}
            tenantId={tenant?.id!}
            onSubmit={onSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setFormValidationErrors({}); // Clear errors when dialog closes
            }}
            isLoading={
              createCustomerMutation.isPending ||
              updateCustomerMutation.isPending
            }
            serverErrors={formValidationErrors}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (customerToDelete) {
                  deleteCustomerMutation.mutate(customerToDelete.id);
                }
              }}
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Sidebar */}
      {showAnalytics && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAnalytics(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full bg-white shadow-2xl transform transition-transform duration-300 z-50 w-full sm:w-[700px] md:w-[850px] lg:w-[1000px]">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Customer Analytics
              </h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto h-full bg-gray-50">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Customers Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">
                        Total Customers
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        {customers.length}
                      </p>
                      <p className="text-blue-100 text-xs mt-1">All time</p>
                    </div>
                    <div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
                      <Users className="h-8 w-8" />
                    </div>
                  </div>
                </div>

                {/* Previous Month Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">
                        Previous Month
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        {
                          customers.filter((customer) => {
                            const dateStr =
                              customer.createdAt || customer.created_at;
                            if (!dateStr) return false;

                            const customerDate = new Date(dateStr);
                            const now = new Date();
                            const lastMonthStart = new Date(
                              now.getFullYear(),
                              now.getMonth() - 1,
                              1,
                            );
                            const currentMonthStart = new Date(
                              now.getFullYear(),
                              now.getMonth(),
                              1,
                            );

                            return (
                              customerDate >= lastMonthStart &&
                              customerDate < currentMonthStart
                            );
                          }).length
                        }
                      </p>
                      <p className="text-green-100 text-xs mt-1">
                        Last 30 days
                      </p>
                    </div>
                    <div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
                      <Globe className="h-8 w-8" />
                    </div>
                  </div>
                </div>

                {/* Current Month Card */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">
                        Current Month
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        {
                          customers.filter((customer) => {
                            const dateStr =
                              customer.createdAt || customer.created_at;
                            if (!dateStr) return false;

                            const customerDate = new Date(dateStr);
                            const now = new Date();
                            const currentMonth = new Date(
                              now.getFullYear(),
                              now.getMonth(),
                              1,
                            );

                            return customerDate >= currentMonth;
                          }).length
                        }
                      </p>
                      <p className="text-purple-100 text-xs mt-1">This month</p>
                    </div>
                    <div className="p-3 bg-purple-400 bg-opacity-30 rounded-full">
                      <MapPin className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Growth Chart */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Monthly Customer Growth
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={(() => {
                        const months = [];
                        for (let i = 11; i >= 0; i--) {
                          const date = new Date();
                          date.setMonth(date.getMonth() - i);
                          const monthStart = new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            1,
                          );
                          const monthEnd = new Date(
                            date.getFullYear(),
                            date.getMonth() + 1,
                            0,
                          );

                          const count = customers.filter((customer) => {
                            const dateStr =
                              customer.createdAt || customer.created_at;
                            if (!dateStr) return false;
                            const customerDate = new Date(dateStr);
                            return (
                              customerDate >= monthStart &&
                              customerDate <= monthEnd
                            );
                          }).length;

                          months.push({
                            month: date.toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            }),
                            customers: count,
                          });
                        }
                        return months;
                      })()}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        stroke="#6b7280"
                        fontSize={12}
                        tick={{ fill: "#6b7280" }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tick={{ fill: "#6b7280" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="customers"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Customer Status Distribution Bar Chart */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Customer Status Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={statusFilters.slice(1).map((filter) => {
                          const count = customers.filter(
                            (customer) =>
                              (
                                customer.crm_status || customer.status
                              )?.toLowerCase() === filter.value,
                          ).length;
                          return {
                            status: filter.label,
                            count: count,
                            percentage:
                              customers.length > 0
                                ? ((count / customers.length) * 100).toFixed(1)
                                : 0,
                          };
                        })}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="status"
                          stroke="#6b7280"
                          fontSize={12}
                          tick={{ fill: "#6b7280" }}
                        />
                        <YAxis
                          stroke="#6b7280"
                          fontSize={12}
                          tick={{ fill: "#6b7280" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Customer Status Pie Chart */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Status Breakdown
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusFilters
                            .slice(1)
                            .map((filter, index) => {
                              const count = customers.filter(
                                (customer) =>
                                  (
                                    customer.crm_status || customer.status
                                  )?.toLowerCase() === filter.value,
                              ).length;
                              const colors = [
                                "#3b82f6",
                                "#10b981",
                                "#f59e0b",
                                "#ef4444",
                                "#8b5cf6",
                              ];
                              return {
                                name: filter.label,
                                value: count,
                                color: colors[index % colors.length],
                              };
                            })
                            .filter((item) => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusFilters.slice(1).map((filter, index) => {
                            const colors = [
                              "#3b82f6",
                              "#10b981",
                              "#f59e0b",
                              "#ef4444",
                              "#8b5cf6",
                            ];
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={colors[index % colors.length]}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Customer Details Section */}
              {/* <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Customer Details
                </h3>
                <div className="space-y-4">
                  {customers.slice(0, 5).map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${getDisplayName(customer)}`}
                            alt={getDisplayName(customer)}
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {getInitials(customer)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {getDisplayName(customer)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            getStatusBadge(
                              customer.crm_status || customer.status || "new",
                            ).color
                          }
                        >
                          {
                            getStatusBadge(
                              customer.crm_status || customer.status || "new",
                            ).label
                          }
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
          </div>
        </>
      )}

      {/* Zoom Phone Dialog */}
      <ZoomPhoneEmbed
        isOpen={isZoomDialogOpen}
        onClose={() => {
          setIsZoomDialogOpen(false);
          setCustomerToCall(null);
        }}
        customerPhone={customerToCall?.phone || undefined}
        customerName={getDisplayName(customerToCall || {} as Customer)}
      />
    </Layout>
  );
}
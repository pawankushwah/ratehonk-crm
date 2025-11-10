import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
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
  Download,
  Grid3X3,
  List,
  Calendar,
  BarChart3,
  Kanban,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Zap,
  Share2,
  Target,
  Users,
  Bot,
  Bell,
  HelpCircle,
  Settings,
  Phone,
  Video,
  Settings2,
  Clock,
  Grid,
  CalendarDays,
} from "lucide-react";
import {
  FaGoogle,
  FaFacebook,
  FaTwitter,
  FaYoutube,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { FlexibleLeadForm } from "@/components/lead/flexible-lead-form";
import { directLeadsApi } from "@/lib/direct-leads-api";
import type { Lead } from "@/lib/types";
import { usePermissions } from "@/hooks/use-permissions";
import KanbanBoard from "./KanbanBoard";
import Analytics from "./analytics";
import image1 from "../../assets/Nav icon.png";

import image2 from "../../assets/gmail.png";
import image3 from "../../assets/integrate.png";
import image4 from "../../assets/inte2.png";
import image5 from "../../assets/inte3.png";
import image6 from "../../assets/automate.png";
import NotesModal, { NoteItem } from "@/LeadsModal/NotesModal";
import CallModal, { CallItem } from "@/LeadsModal/CallModal";
import ActivityModal, { ActivityItem } from "@/LeadsModal/ActivityModal";
import EmailModal, { EmailItem } from "@/LeadsModal/EmailModal";
import LeadDetails from "./LeadDetails";

const leadStatuses = [
  {
    value: "new",
    label: "New",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "contacted",
    label: "Contacted",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  {
    value: "qualified",
    label: "Qualified",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    value: "proposal",
    label: "Proposal",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    value: "negotiation",
    label: "Negotiation",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    value: "closed_won",
    label: "Closed Won",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    value: "closed_lost",
    label: "Closed Lost",
    color: "bg-red-100 text-red-800 border-red-200",
  },
];

const viewModes = [
  { key: "grid", icon: Grid, label: "Grid" },
  { key: "list", icon: List, label: "List" },
  { key: "timeline", icon: Clock, label: "Timeline" },
  { key: "calendar", icon: Calendar, label: "Calendar" },
  { key: "kanban", icon: Kanban, label: "Kanban" },
];

export default function Leads() {
  const [notes, setNotes] = useState([]);
  const [calls, setCalls] = useState([]);
  const [activities, setActivities] = useState([]);
  const [emails, setEmails] = useState([]);
  // Common states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableItem, setEditableItem] = useState(null);
  const [openItemId, setOpenItemId] = useState(null);

  const [draggedIndex, setDraggedIndex] = useState(null);

  // Save Note (Add or Edit)
  const getCurrentData = () => {
    if (tab === "notes") return [notes, setNotes];
    if (tab === "call") return [calls, setCalls];
    if (tab === "email") return [emails, setEmails];
    return [activities, setActivities];
  };
  const handleSaveItem = (item, mode) => {
    const [data, setData] = getCurrentData();
    if (mode === "edit") {
      setData(data.map((i) => (i.id === item.id ? item : i)));
    } else {
      setData([...data, item]);
    }
    setEditableItem(null);
  };

  // Edit Item
  const handleEditItem = (item) => {
    setEditableItem(item);
    setIsModalOpen(true);
  };

  // Delete Item
  const handleDeleteItem = (id) => {
    const [data, setData] = getCurrentData();
    setData(data.filter((i) => i.id !== id));
  };
  const getModalComponent = () => {
    if (tab === "notes") {
      return (
        <NotesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
          editableNote={editableItem}
        />
      );
    } else if (tab === "call") {
      return (
        <CallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
          editableCall={editableItem}
        />
      );
    } else if (tab === "activity") {
      return (
        <ActivityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
          editableActivity={editableItem}
        />
      );
    } else if (tab === "email") {
      return (
        <EmailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
          editableEmail={editableItem}
        />
      );
    }
  };

  // Get correct list based on active tab
  const getListComponent = () => {
    const data =
      tab === "notes"
        ? notes
        : tab === "call"
          ? calls
          : tab === "email"
            ? emails
            : activities;

    if (tab === "notes") {
      return data.map((item) => (
        <NoteItem
          key={item.id}
          note={item}
          isOpen={openItemId === item.id}
          onToggle={() =>
            setOpenItemId(openItemId === item.id ? null : item.id)
          }
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />
      ));
    } else if (tab === "call") {
      return data.map((item) => (
        <CallItem
          key={item.id}
          call={item}
          isOpen={openItemId === item.id}
          onToggle={() =>
            setOpenItemId(openItemId === item.id ? null : item.id)
          }
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />
      ));
    } else if (tab === "activity") {
      return data.map((item) => (
        // <ActivityItem
        //   key={item.id}
        //   activity={item}
        //   isOpen={openItemId === item.id}
        //   onToggle={() =>
        //     setOpenItemId(openItemId === item.id ? null : item.id)
        //   }
        //   onEdit={handleEditItem}
        //   onDelete={handleDeleteItem}
        // />
        <ActivityItem
          key={item.id}
          activity={item}
          index={item.id}
          isOpen={openItemId === item.id}
          onToggle={() =>
            setOpenItemId(openItemId === item.id ? null : item.id)
          }
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />
      ));
    } else if (tab === "email") {
      return data.map((item) => (
        <EmailItem
          key={item.id}
          email={item}
          isOpen={openItemId === item.id}
          onToggle={() =>
            setOpenItemId(openItemId === item.id ? null : item.id)
          }
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />
      ));
    }
  };

  const { tenant, user } = useAuth();

  const { canView, canCreate, canEdit, canDelete } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState("list");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [opens, setOpens] = useState(false);
  const [tab, setTab] = useState("notes");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);


  // Helper function to convert date filter states to API format
  const buildDateFilters = () => {
    if (dateFilter === "all") return undefined;
    
    if (dateFilter === "custom" && customDateFrom && customDateTo) {
      return {
        startDate: customDateFrom.toISOString().split("T")[0],
        endDate: customDateTo.toISOString().split("T")[0],
        filterType: dateFilter
      };
    }
    
    if (dateFilter !== "custom") {
      const dateRange = getDateRange(dateFilter);
      return {
        startDate: dateRange.start.toISOString().split("T")[0],
        endDate: dateRange.end.toISOString().split("T")[0],
        filterType: dateFilter
      };
    }
    
    return undefined;
  };

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: [`leads-tenant-${tenant?.id}`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const dateFilters = buildDateFilters();
      console.log("🔍 Fetching leads with date filters:", dateFilters);
      const result = await directLeadsApi.getLeads(tenant?.id!, dateFilters);
      return Array.isArray(result) ? result : [];
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 1,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000,
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const requestData = {
        ...data,
        tenantId: tenant?.id,
        userId: user?.id,
        name: `${data.firstName} ${data.lastName}`,
      };
      return directLeadsApi.createLead(tenant?.id!, requestData);
    },
    onSuccess: (newLead) => {
      const currentLeads =
        (queryClient.getQueryData([`leads-tenant-${tenant?.id}`]) as Lead[]) ||
        [];
      const updatedLeads = [...currentLeads, newLead];
      queryClient.setQueryData([`leads-tenant-${tenant?.id}`], updatedLeads);
      queryClient.invalidateQueries({
        queryKey: [`leads-tenant-${tenant?.id}`],
      });

      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      setIsDialogOpen(false);
      setEditingLead(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return directLeadsApi.updateLead(tenant?.id!, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`leads-tenant-${tenant?.id}`],
      });
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      setIsDialogOpen(false);
      setEditingLead(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead",
        variant: "destructive",
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      return directLeadsApi.deleteLead(tenant?.id!, leadId);
    },
    onSuccess: (_, leadId) => {
      // Remove the deleted lead from the cache
      const currentLeads =
        (queryClient.getQueryData([`leads-tenant-${tenant?.id}`]) as Lead[]) ||
        [];
      const updatedLeads = currentLeads.filter((lead) => lead.id !== leadId);
      queryClient.setQueryData([`leads-tenant-${tenant?.id}`], updatedLeads);

      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead",
        variant: "destructive",
      });
    },
  });

  // Check if user has permission to view this page
  if (!canView("leads")) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You don't have permission to view leads.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = leadStatuses.find((s) => s.value === status);
    return statusConfig || leadStatuses[0];
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "L";
  };

  // Date filtering helper functions
  const getDateRange = (filter: string) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    switch (filter) {
      case "today":
        return { from: startOfToday, to: new Date() };
      case "this_week":
        const startOfWeek = new Date(startOfToday);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
        return { from: startOfWeek, to: new Date() };
      case "this_month":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: startOfMonth, to: new Date() };
      case "this_year":
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return { from: startOfYear, to: new Date() };
      case "custom":
        return { from: customDateFrom, to: customDateTo };
      default:
        return null;
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchTerm === "" ||
      `${lead.firstName} ${lead.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;

    // Date filtering logic
    let matchesDate = true;
    if (dateFilter !== "all") {
      const dateRange = getDateRange(dateFilter);
      if (dateRange && dateRange.from && dateRange.to && lead.createdAt) {
        const leadDate = new Date(lead.createdAt);
        matchesDate = leadDate >= dateRange.from && leadDate <= dateRange.to;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  console.log("Filtered Leads:", filteredLeads);
  const onSubmit = (data: any) => {
    if (editingLead) {
      updateLeadMutation.mutate({ id: editingLead.id, data });
    } else {
      createLeadMutation.mutate(data);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    try {
      await directLeadsApi.updateLead(tenant?.id!, leadId, {
        status: newStatus,
      });
      queryClient.invalidateQueries({
        queryKey: [`leads-tenant-${tenant?.id}`],
      });
      toast({
        title: "Status Updated",
        description: "Lead status has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="flex-1 bg-[#F6F6F6] rounded-2xl p-1 mt-1">
        {/* Main Card Container */}
        <div className="rounded-lg shadow-sm mx-2 my-2">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="">
              <div className=" w-full h-[72px] flex items-center bg-white px-[18px] py-4 rounded-t-xl border-b border-[#E3E8EF] shadow-[0px_1px_6px_0px_rgba(0,0,0,0.05)]">
                <h1 className="font-inter font-medium text-[20px] leading-[24px] text-[#121926]">
                  Lead Management
                </h1>

                <div className="flex gap-3 ml-auto">
                  {" "}
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                    <Settings className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
                    <HelpCircle className="h-5 w-5 text-gray-600" />
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
                Lead Management
              </span>
              <ChevronRight className="h-4 w-4" />

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
                  Leads
                </span>
              </div>
            </div>

            {/* Right Side - Add Customer Button */}
            <div className="flex gap-3">
              <Button variant="outline" className="bg-white">
                <Link href="/social-integrations" className="flex items-center">
                  {/* <Share2 className="h-4 w-4 mr-2" /> */}
                  <img
                    src={image3}
                    alt="logo"
                    className="w-6 h-6 object-cover rounded-md"
                  />
                  Integrate
                  <div className="flex ">
                    {/* <FaGoogle className="h-3 w-3" />
                    <FaFacebook className="h-3 w-3" />
                    <Target className="h-3 w-3" /> */}
                    <img src={image2} alt="logo" className="w-5 h-5  mt-1" />

                    <img src={image4} alt="logo" className="w-5 h-5 mt-1" />
                    <img src={image5} alt="logo" className="w-5 h-5 mt-1" />
                  </div>
                </Link>
              </Button>
              <Link href="/lead-sync">
                <Button variant="outline" className="bg-white">
                  {/* <Bot className="h-4 w-4 mr-2" /> */}
                  <img
                    src={image6}
                    alt="logo"
                    className="w-6 h-6 object-cover rounded-md"
                  />
                  Automate
                </Button>
              </Link>
              <Link href="/lead-types">
                <Button variant="outline" size="icon" className="bg-white">
                  <Filter className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/lead-sync">
                <Button variant="outline" size="icon" className="bg-white">
                  <Download className="h-4 w-4" />
                </Button>
              </Link>
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
                  setEditingLead(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>

          {/* Search and View Options */}
          <div className=" border-gray-200 mb-6 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search Leads"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                  className="pl-10 bg-white border-gray-300"
                />
              </div>
                {/* Date Filter Controls */}
                <div className="flex items-center space-x-2">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[160px]" data-testid="select-date-range">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this_week">This week</SelectItem>
                      <SelectItem value="this_month">This month</SelectItem>
                      <SelectItem value="this_year">This year</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>

                  {dateFilter === "custom" && (
                    <div className="flex items-center space-x-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "w-[180px] justify-start text-left font-normal", 
                              !customDateFrom && "text-muted-foreground"
                            )} 
                            data-testid="button-date-from"
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {customDateFrom ? format(customDateFrom, "LLL dd, y") : "From date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DatePickerCalendar 
                            mode="single" 
                            selected={customDateFrom ?? undefined} 
                            onSelect={(d) => { setCustomDateFrom(d ?? null); setDateFilter("custom"); }} 
                            initialFocus 
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "w-[180px] justify-start text-left font-normal", 
                              !customDateTo && "text-muted-foreground"
                            )} 
                            data-testid="button-date-to"
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {customDateTo ? format(customDateTo, "LLL dd, y") : "To date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DatePickerCalendar 
                            mode="single" 
                            selected={customDateTo ?? undefined} 
                            onSelect={(d) => { setCustomDateTo(d ?? null); setDateFilter("custom"); }} 
                            initialFocus 
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

              <div className="flex items-center space-x-2 border rounded-full bg-white p-1">
                {viewModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <Button
                      key={mode.key}
                      variant={viewMode === mode.key ? "default" : "ghost"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setViewMode(mode.key)}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Table */}
          {(viewMode === "list" || viewMode === "calendar") && (
            <div className="bg-white rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow
                    className="
        bg-[#EEF2F6]
        h-[44px]
        border-b border-[#E4E7EC]
        rounded-2xl
         shadow-md
      "
                  >
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg
            
            "
                    >
                      Customer Name
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg
            
            "
                    >
                      Phone
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg
            
            "
                    >
                      Source
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg
            
            "
                    >
                      Type
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg"
                    >
                      Score
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg
          "
                    >
                      Priority
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg
            
            "
                    >
                      Status
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg
            
            "
                    >
                      Date Added
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg
            
            "
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        Loading leads...
                      </TableCell>
                    </TableRow>
                  ) : filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-gray-500"
                      >
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => {
                      const statusConfig = getStatusBadge(lead.status);
                      return (
                        <TableRow
                          key={lead.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${lead.firstName} ${lead.lastName}`}
                                  alt={`${lead.firstName} ${lead.lastName}`}
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {getInitials(lead.firstName, lead.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {lead.firstName} {lead.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {lead.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {lead.phone || "Unknown"}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {lead.source || "Unknown"}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {(lead as any).leadTypeName || "Flight Booking"}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {(lead as any).score || "Unknown"}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {(lead as any).priority || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={lead.status}
                              onValueChange={(newStatus: string) =>
                                handleStatusChange(Number(lead.id), newStatus)
                              }
                            >
                              <SelectTrigger className="w-24 h-8 border-0 bg-transparent p-0">
                                <Badge
                                  className={`${statusConfig.color} text-xs font-medium border`}
                                >
                                  ● {statusConfig.label}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {leadStatuses.map((status) => (
                                  <SelectItem
                                    key={status.value}
                                    value={status.value}
                                  >
                                    <Badge
                                      className={`${status.color} text-xs border`}
                                    >
                                      ● {status.label}
                                    </Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {/* <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setOpen(true);
                                }}
                              >
                                <Eye className="w-6 h-6 text-gray-600" />
                              </Button> */}

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setOpen(true);
                                }}
                              >
                                <Eye className="w-6 h-6 text-gray-600" />
                              </Button>

                              {/* Lead Details Drawer */}
                              {selectedLead && (
                                <LeadDetails
                                  lead={selectedLead}
                                  open={open}
                                  setOpen={setOpen}
                                />
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(lead)}
                                  >
                                    Edit Lead
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      setLeadToDelete(lead);
                                      setDeleteConfirmOpen(true);
                                    }}
                                  >
                                    Delete Lead
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const phone = lead.phone?.replace(
                                        /\D/g,
                                        "",
                                      );
                                      if (!phone) {
                                        toast({
                                          title: "Error",
                                          description:
                                            "Lead phone number is not available for WhatsApp sharing.",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      const message = encodeURIComponent(
                                        `Hello ${lead.firstName} ${lead.lastName},\n\nHere are your lead details:\nEmail: ${lead.email || "N/A"}\nPhone: ${lead.phone || "N/A"}\nStatus: ${lead.status || "N/A"}`,
                                      );
                                      const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
                                      window.open(whatsappUrl, "_blank");
                                    }}
                                  >
                                    <FaWhatsapp className="mr-2 inline-block" />
                                    Share on WhatsApp
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
            </div>
          )}
          {/*KanbanBoard table  */}
          {viewMode === "grid" && (
            <KanbanBoard
              leads={filteredLeads}
              onStatusChange={handleStatusChange}
              onViewLead={handleEdit}
            />
          )}

          {viewMode === "timeline" && (
            <Analytics
              leads={filteredLeads}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      </div>

      {/* Lead Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLead ? "Edit Lead" : "Add New Lead"}
            </DialogTitle>
            <DialogDescription>
              {editingLead
                ? "Update the lead information below."
                : "Fill in the lead information below."}
            </DialogDescription>
          </DialogHeader>
          <FlexibleLeadForm
            lead={editingLead}
            tenantId={tenant?.id!}
            userId={user?.id!}
            onSubmit={onSubmit}
            onCancel={() => setIsDialogOpen(false)}
            isLoading={
              createLeadMutation.isPending || updateLeadMutation.isPending
            }
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the lead "
              {leadToDelete?.firstName} {leadToDelete?.lastName}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setLeadToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (leadToDelete) {
                  deleteLeadMutation.mutate(leadToDelete.id);
                  setDeleteConfirmOpen(false);
                  setLeadToDelete(null);
                }
              }}
              disabled={deleteLeadMutation.isPending}
            >
              {deleteLeadMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </Layout>
  );
}

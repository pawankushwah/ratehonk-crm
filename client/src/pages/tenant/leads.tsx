import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Label } from "@/components/ui/label";
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
  Upload,
  FileDown,
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
  Settings,
  Phone,
  Video,
  Settings2,
  Clock,
  Grid,
  CalendarDays,
  X,
  FileText,
  FileSpreadsheet,
  ChevronDown,
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
import { CreateFollowUpDialog } from "@/components/follow-ups/CreateFollowUpDialog";
import { LeadManagementSettingsPanel } from "@/components/leads/LeadManagementSettingsPanel";
import type { Lead } from "@/lib/types";
import { usePermissions } from "@/hooks/use-permissions";
import KanbanBoard from "./KanbanBoard";
import LeadsAnalytics from "@/components/leads/leads-analytics";
import image1 from "../../assets/Nav icon.png";
import { ZoomPhoneEmbed } from "@/components/zoom/zoom-phone-embed";

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

// Assigned User Cell Component
function AssignedUserCell({ 
  lead, 
  tenantId, 
  onAssignmentChange 
}: { 
  lead: any; 
  tenantId?: number;
  onAssignmentChange: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch users for dropdown
  const { data: users = [] } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/users`],
    queryFn: async () => {
      if (!tenantId) return [];
      const res = await fetch(`/api/tenants/${tenantId}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.filter((u: any) => u.isActive) : [];
    },
    enabled: !!tenantId,
  });

  const handleAssignmentChange = async (newUserId: string) => {
    if (!tenantId || !user?.id) return;
    
    const userId = newUserId === "none" ? null : parseInt(newUserId);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/leads/${lead.id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          userId: userId,
          reason: "manual_assignment",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update assignment");
      }

      toast({
        title: "Success",
        description: userId ? "Lead assigned successfully" : "Lead unassigned successfully",
      });
      
      onAssignmentChange();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update assignment",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const assignedUserName = (lead as any).assignedUserName || 
    (lead.assignedUserId && users.find((u: any) => u.id === lead.assignedUserId) 
      ? `${users.find((u: any) => u.id === lead.assignedUserId).firstName} ${users.find((u: any) => u.id === lead.assignedUserId).lastName}`
      : null);

  return (
    <Select
      value={lead.assignedUserId?.toString() || "none"}
      onValueChange={handleAssignmentChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-[160px] h-8 border-gray-300">
        <SelectValue placeholder="Unassigned">
          {assignedUserName || "Unassigned"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Unassigned</SelectItem>
        {users.map((u: any) => (
          <SelectItem key={u.id} value={u.id.toString()}>
            {u.firstName} {u.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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
  // { key: "calendar", icon: Calendar, label: "Calendar" },
  // { key: "kanban", icon: Kanban, label: "Kanban" },
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
  
  // Follow-up dialog state
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<any>(null);
  
  // Lead management settings panel state
  const [isLeadSettingsPanelOpen, setIsLeadSettingsPanelOpen] = useState(false);

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
  const [, setLocation] = useLocation();

  const { canView, canCreate, canEdit, canDelete, isLoading: permissionsLoading } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
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
  const [isZoomDialogOpen, setIsZoomDialogOpen] = useState(false);
  const [leadToCall, setLeadToCall] = useState<Lead | null>(null);

  // Import/Export state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const today = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (dateFilter) {
      case "today":
        start = new Date();
        start.setHours(0, 0, 0, 0);

        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;

      case "this_week": {
        const currentDay = today.getDay(); // Sunday=0, Monday=1
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Monday start
        start = new Date(today);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }

      case "this_month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case "this_year":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;

      case "custom":
      case "all":
      default:
        // don't auto-update in these cases
        return;
    }

    setCustomDateFrom(start);
    setCustomDateTo(end);
  }, [dateFilter]);

  const formatDate = (date: Date) => date.toLocaleDateString("en-CA");

  const buildDateFilters = () => {
    if (dateFilter === "all") return undefined;

    if (dateFilter === "custom") {
      if (!customDateFrom || !customDateTo) return undefined;

      // 🔎 Validation: end must be >= start
      if (customDateTo < customDateFrom) {
        console.warn("❌ Invalid date range: End date is before start date.");
        return undefined; // ⛔️ stop API call
      }

      return {
        startDate: formatDate(customDateFrom),
        endDate: formatDate(customDateTo),
        filterType: dateFilter,
      };
    }

    // other filters (today, this_week, etc.)
    if (customDateFrom && customDateTo) {
      return {
        startDate: formatDate(customDateFrom),
        endDate: formatDate(customDateTo),
        filterType: dateFilter,
      };
    }

    return undefined;
  };

  // State for dynamic type-specific filters
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});

  // Fetch lead types for filter dropdown
  const { data: leadTypes = [] } = useQuery<any[]>({
    queryKey: ["lead-types", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenant?.id}/lead-types`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        console.error("Failed to fetch lead types:", response.status);
        throw new Error("Failed to fetch lead types");
      }
      return response.json();
    },
  });

  // Fetch lead type fields when a specific type is selected
  const { data: leadTypeFields = [] } = useQuery<any[]>({
    queryKey: ["lead-type-fields", tenant?.id, typeFilter],
    enabled: !!tenant?.id && !!typeFilter && typeFilter !== "all",
    queryFn: async () => {
      const response = await fetch(
        `/api/tenants/${tenant?.id}/lead-types/${typeFilter}/fields`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) {
        console.error("Failed to fetch lead type fields:", response.status);
        return [];
      }
      return response.json();
    },
  });

  // Clear dynamic filters when lead type changes
  useEffect(() => {
    setDynamicFilters({});
  }, [typeFilter]);

  // Separate query for Kanban view (all leads, no pagination)
  const { data: kanbanLeads = [], isLoading: isLoadingKanban } = useQuery<Lead[]>({
    queryKey: [
      "kanban-leads",
      tenant?.id,
      searchTerm,
      statusFilter,
      dateFilter,
      priorityFilter,
      typeFilter,
      sourceFilter,
      customDateFrom,
      customDateTo,
      dynamicFilters,
    ],
    enabled: !!tenant?.id && viewMode === "grid", // Only fetch when in Kanban view
    queryFn: async ({ queryKey }) => {
      const [
        ,
        tenantId,
        search,
        status,
        date,
        priority,
        type,
        source,
        ,
        ,
        dynFilters,
      ] = queryKey;

      const dateFilters = buildDateFilters(date);
      const allFilters = {
        ...dateFilters,
        search: search?.trim() || undefined,
        status: status !== "all" ? status : undefined,
        priority: priority !== "all" ? priority : undefined,
        type: type !== "all" ? type : undefined,
        source: source !== "all" ? source : undefined,
        // Add dynamic type-specific filters
        ...(dynFilters && Object.keys(dynFilters).length > 0
          ? { typeSpecificFilters: JSON.stringify(dynFilters) }
          : {}),
      };

      // Remove undefined values
      Object.keys(allFilters).forEach(
        (key) => allFilters[key] === undefined && delete allFilters[key],
      );

      console.log("🔍 Kanban API - Fetching all leads with filters:", allFilters);

      const result = await directLeadsApi.getKanbanLeads(tenantId!, allFilters);
      
      console.log("🔍 Kanban API - Response:", result.data?.length || 0, "leads");
      
      return result.data || [];
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000,
  });

  // Regular query for table/list view (with pagination)
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: [
      "leads",
      tenant?.id,
      searchTerm,
      statusFilter,
      dateFilter,
      priorityFilter,
      typeFilter,
      sourceFilter,
      customDateFrom,
      customDateTo,
      currentPage,
      itemsPerPage,
      dynamicFilters,
      viewMode, // Include viewMode to separate queries
    ],
    enabled: !!tenant?.id && viewMode !== "grid", // Don't fetch when in Kanban view
    queryFn: async ({ queryKey }) => {
      const [
        ,
        tenantId,
        search,
        status,
        date,
        priority,
        type,
        source,
        ,
        ,
        page,
        itemsPerPageValue,
        dynFilters,
      ] = queryKey;

      const dateFilters = buildDateFilters(date);
      const allFilters = {
        ...dateFilters,
        search: search?.trim() || undefined,
        status: status !== "all" ? status : undefined,
        priority: priority !== "all" ? priority : undefined,
        type: type !== "all" ? type : undefined,
        source: source !== "all" ? source : undefined,
        page: page || 1,
        limit: itemsPerPageValue || 10,
        offset: ((page || 1) - 1) * (itemsPerPageValue || 10),
        // Add dynamic type-specific filters
        ...(dynFilters && Object.keys(dynFilters).length > 0
          ? { typeSpecificFilters: JSON.stringify(dynFilters) }
          : {}),
      };

      // Remove undefined values
      Object.keys(allFilters).forEach(
        (key) => allFilters[key] === undefined && delete allFilters[key],
      );

      console.log("🔍 Backend filters with pagination:", allFilters);

      const result = await directLeadsApi.getLeads(tenantId!, allFilters);

      console.log("🔍 Leads Query - API Response:", result);
      console.log("🔍 Leads Query - Response type:", typeof result);
      console.log("🔍 Leads Query - Has 'data'?", "data" in (result || {}));
      console.log("🔍 Leads Query - Has 'pagination'?", result && typeof result === "object" && "pagination" in result);

      // Handle pagination response
      if (result && typeof result === "object" && "data" in result) {
        const leadsData = Array.isArray(result.data) ? result.data : [];
        
        // New format: { data: [], pagination: { total, page, limit, etc. } }
        if (result.pagination && typeof result.pagination === "object") {
          let total = result.pagination.total || 0;
          // If total is 0 but we have data, use data length as fallback
          if (total === 0 && leadsData.length > 0) {
            console.warn("🔍 Warning: API returned total=0 but we have", leadsData.length, "leads. Using data length as fallback.");
            total = leadsData.length;
          }
          console.log("🔍 Setting totalItems from pagination:", total, "(from pagination.total:", result.pagination.total, ", data length:", leadsData.length, ")");
          setTotalItems(total);
          return leadsData;
        }
        // Old format: { data: [], total: number }
        if ("total" in result && typeof result.total === "number") {
          let total = result.total || 0;
          // If total is 0 but we have data, use data length as fallback
          if (total === 0 && leadsData.length > 0) {
            console.warn("🔍 Warning: API returned total=0 but we have", leadsData.length, "leads. Using data length as fallback.");
            total = leadsData.length;
          }
          console.log("🔍 Setting totalItems from result.total:", total);
          setTotalItems(total);
          return leadsData;
        }
        // Just data array in object - use data length
        console.log("🔍 Setting totalItems from data length:", leadsData.length);
        setTotalItems(leadsData.length);
        return leadsData;
      }

      // Fallback: array response (old format)
      if (Array.isArray(result)) {
        console.log("🔍 Setting totalItems from array length:", result.length);
        setTotalItems(result.length);
        return result;
      }

      console.warn("🔍 Unexpected response format:", result);
      setTotalItems(0);
      return [];
    },
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

  // Export leads handler - CSV
  const handleExportLeadsCSV = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/leads/export?format=csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export leads");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Leads exported to CSV successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export leads",
        variant: "destructive",
      });
    }
  };

  // Export leads handler - Excel
  const handleExportLeadsExcel = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/leads/export?format=xlsx`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export leads");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Leads exported to Excel successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export leads",
        variant: "destructive",
      });
    }
  };

  // Export leads handler - PDF
  const handleExportLeadsPDF = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/leads/export?format=pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export leads");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Leads exported to PDF successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export leads",
        variant: "destructive",
      });
    }
  };

  // Import leads handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(fileExtension || "")) {
        toast({
          title: "Invalid file",
          description: "Please select a CSV or Excel file",
          variant: "destructive",
        });
        return;
      }
      setImportFile(file);
    }
  };

  const handleDownloadSampleFile = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "Tenant ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/leads/import/sample`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download sample file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads-import-sample.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Sample file downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download sample file",
        variant: "destructive",
      });
    }
  };

  const handleImportLeads = async () => {
    if (!importFile || !tenant?.id) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("tenantId", tenant.id.toString());

      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(`/api/tenants/${tenant.id}/leads/import`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to import leads");
      }

      toast({
        title: "Success",
        description: `Successfully imported ${result.imported || 0} leads`,
      });

      // Refresh leads list
      queryClient.invalidateQueries({
        queryKey: ["leads", tenant.id],
      });

      setImportDialogOpen(false);
      setImportFile(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import leads",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

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
  // Wait for permissions to load before checking
  if (!permissionsLoading && !canView("leads")) {
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
  
  // Show loading state while permissions are being fetched
  if (permissionsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
            </div>
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
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

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
    console.log("searchinggggggg");
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

  console.log("Filtered Leads:", leads);
  const onSubmit = (data: any) => {
    if (editingLead) {
      updateLeadMutation.mutate({ id: editingLead.id, data });
    } else {
      createLeadMutation.mutate(data);
    }
  };

  const handleEdit = (lead: Lead) => {
    setLocation(`/leads/${lead.id}/edit`);
  };

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    try {
      await directLeadsApi.updateLead(tenant?.id!, leadId, {
        status: newStatus,
      });
      // Invalidate both regular leads query and kanban leads query
      queryClient.invalidateQueries({
        queryKey: [`leads-tenant-${tenant?.id}`],
      });
      queryClient.invalidateQueries({
        queryKey: ["kanban-leads", tenant?.id],
      });
      // Also invalidate the main leads query
      queryClient.invalidateQueries({
        queryKey: ["leads"],
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

  console.log("Lead Filters:", typeFilter, leadTypeFields);

  return (
    <SubscriptionGuard requiredMenuItem="leads">
      <Layout>
        <div className="flex-1 bg-[#F6F6F6] rounded-2xl p-1 mt-1">
        {/* Main Card Container */}
        <div className="rounded-lg shadow-sm mx-2 my-2">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="">
              <div className=" w-full h-[72px] flex items-center bg-white px-[18px] py-4 rounded-t-xl border-b border-[#E3E8EF] shadow-[0px_1px_6px_0px_rgba(0,0,0,0.05)]">
                <h1 className="font-inter font-medium text-[20px] leading-[24px] text-[#121926]">
                  Leads
                </h1>

                <div className="flex gap-3 ml-auto">
                  {" "}
                  <button
                    onClick={() => setIsLeadSettingsPanelOpen(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm hover:bg-gray-50 cursor-pointer"
                    title="Lead Management Settings"
                  >
                    <Settings className="h-5 w-5 text-gray-600" />
                  </button>
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
              <span className="bg-gray-100 px-1 py-2 rounded-md">Leads</span>
              {/* <ChevronRight className="h-4 w-4" /> */}

              {/* <div className="flex items-center gap-2 w-auto h-[36px] px-3 py-[6px] rounded-md border border-[rgba(36,99,235,0.6)] bg-[#EEF3FF]">
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
              </div> */}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white"
                    title="Export Leads"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportLeadsPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportLeadsCSV}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportLeadsExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                className="bg-white"
                onClick={() => setImportDialogOpen(true)}
                title="Import Leads"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Link href="/leads/create">
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
                  data-testid="button-add-lead"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and View Options */}
          <div className=" border-gray-200 mb-6 p-4">
            <div className="flex items-center justify-end">
              {viewMode !== "timeline" && (
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
                      <SelectTrigger
                        className="w-[160px]"
                        data-testid="select-date-range"
                      >
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
                              {customDateFrom
                                ? format(customDateFrom, "LLL dd, y")
                                : "From date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <DatePickerCalendar
                              mode="single"
                              selected={customDateFrom ?? undefined}
                              onSelect={(d) => {
                                setCustomDateFrom(d ?? null);
                                setDateFilter("custom");
                              }}
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
                              {customDateTo
                                ? format(customDateTo, "LLL dd, y")
                                : "To date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <DatePickerCalendar
                              mode="single"
                              selected={customDateTo ?? undefined}
                              onSelect={(d) => {
                                setCustomDateTo(d ?? null);
                                setDateFilter("custom");
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger
                        className="w-[160px] bg-transparent border-gray-300"
                        data-testid="select-type-filter"
                      >
                        <SelectValue placeholder="Lead Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {leadTypes.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Lead Status Filter */}
                    {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger
                      className="w-[160px]"
                      data-testid="select-status-filter"
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      {leadStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}

                    {/* Priority Filter */}
                    {/* <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger
                      className="w-[160px]"
                      data-testid="select-priority-filter"
                    >
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select> */}

                    {/* Type Filter */}
                    {/* <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger
                      className="w-[160px]"
                      data-testid="select-type-filter"
                    >
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                    </SelectContent>
                  </Select> */}

                    {/* Source Filter */}
                    {/* <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger
                      className="w-[160px]"
                      data-testid="select-source-filter"
                    >
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="trade_show">Trade Show</SelectItem>
                      <SelectItem value="advertisement">
                        Advertisement
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select> */}
                  </div>
                </div>
              )}

             
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

          {/* Dynamic Type-Specific Filters Section */}
          {typeFilter && typeFilter !== "all" && leadTypeFields.length > 0 && (
            <div className="bg-white rounded-lg border p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  Filters for{" "}
                  {leadTypes.find((t) => String(t.id) === typeFilter)?.name}:
                </span>
                {leadTypeFields.map((field: any) => {
                  const fieldValue = dynamicFilters[field.fieldName] || "";

                  // Render different input types based on field type
                  if (
                    field.fieldType === "select" ||
                    field.fieldType === "dropdown"
                  ) {
                    let options: string[] = [];
                    if (field.fieldOptions) {
                      try {
                        // Try parsing as JSON first (database stores as JSON array)
                        options =
                          typeof field.fieldOptions === "string"
                            ? JSON.parse(field.fieldOptions)
                            : field.fieldOptions;
                      } catch {
                        // Fallback to comma-separated if not JSON
                        options =
                          typeof field.fieldOptions === "string"
                            ? field.fieldOptions
                                .split(",")
                                .map((opt: string) => opt.trim())
                            : [];
                      }
                    }

                    return (
                      <Select
                        key={field.id}
                        value={fieldValue || "all"}
                        onValueChange={(value) => {
                          setDynamicFilters((prev) => ({
                            ...prev,
                            [field.fieldName]: value === "all" ? "" : value,
                          }));
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={field.fieldLabel} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            All {field.fieldLabel}
                          </SelectItem>
                          {options.map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  } else if (field.fieldType === "date") {
                    return (
                      <Popover key={field.id}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[180px] justify-start text-left font-normal",
                              !fieldValue && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {fieldValue
                              ? format(new Date(fieldValue), "LLL dd, y")
                              : field.fieldLabel}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DatePickerCalendar
                            mode="single"
                            selected={
                              fieldValue ? new Date(fieldValue) : undefined
                            }
                            onSelect={(d) => {
                              setDynamicFilters((prev) => ({
                                ...prev,
                                [field.fieldName]: d
                                  ? d.toISOString().split("T")[0]
                                  : "",
                              }));
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  } else if (field.fieldType === "boolean") {
                    return (
                      <Select
                        key={field.id}
                        value={fieldValue || "all"}
                        onValueChange={(value) => {
                          setDynamicFilters((prev) => ({
                            ...prev,
                            [field.fieldName]: value === "all" ? "" : value,
                          }));
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={field.fieldLabel} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            All {field.fieldLabel}
                          </SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    );
                  } else {
                    // Text, number, textarea - all use input
                    return (
                      <Input
                        key={field.id}
                        type={field.fieldType === "number" ? "number" : "text"}
                        placeholder={field.fieldLabel}
                        value={fieldValue}
                        onChange={(e) => {
                          setDynamicFilters((prev) => ({
                            ...prev,
                            [field.fieldName]: e.target.value,
                          }));
                        }}
                        className="w-[180px] bg-white border-gray-300"
                      />
                    );
                  }
                })}

                {Object.keys(dynamicFilters).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDynamicFilters({})}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}

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
                      <div className="flex h-10 items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-[160px] bg-transparent border-gray-300">
                        Customer Name
                      </div>
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg

            "
                    >
                      <Select
                        value={sourceFilter}
                        onValueChange={setSourceFilter}
                      >
                        <SelectTrigger
                          className="w-[160px] bg-transparent border-gray-300"
                          data-testid="select-source-filter"
                        >
                          <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sources</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="trade_show">Trade Show</SelectItem>
                          <SelectItem value="advertisement">
                            Advertisement
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg

            "
                    >
                      <div className="flex h-10 items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-[160px] bg-transparent border-gray-300">
                        Travel Categories
                      </div>
                      {/* <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger
                          className="w-[160px] bg-transparent border-gray-300"
                          data-testid="select-type-filter"
                        >
                          <SelectValue placeholder="Lead Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          {leadTypes.map((type) => (
                            <SelectItem key={type.id} value={String(type.id)}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select> */}
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg"
                    >
                      <div className="flex h-10 items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-[160px] bg-transparent border-gray-300">
                        Score
                      </div>
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg
          "
                    >
                      <Select
                        value={priorityFilter}
                        onValueChange={setPriorityFilter}
                      >
                        <SelectTrigger
                          className="w-[160px] bg-transparent border-gray-300"
                          data-testid="select-priority-filter"
                        >
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All priority</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead
                      className="
                      px-[20px] pr-[8px] py-[12px]
                      text-left
                      text-sm font-medium text-[#121926]
                      first:rounded-tl-lg first:rounded-bl-lg
                      "
                    >
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger
                          className="w-[160px] bg-transparent border-gray-300"
                          data-testid="select-status-filter"
                        >
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All status</SelectItem>
                          {leadStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg

            "
                    >
                      <div className="flex h-10 items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-[160px] bg-transparent border-gray-300">
                        Assigned User
                      </div>
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg

            "
                    >
                      <div className="flex h-10 items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-[160px] bg-transparent border-gray-300">
                        Date Added
                      </div>
                    </TableHead>
                    <TableHead
                      className="
              px-[20px] pr-[8px] py-[12px]
              text-left
              text-sm font-medium text-[#121926]
              first:rounded-tl-lg first:rounded-bl-lg

            "
                    >
                      <div className="flex h-10 items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-[160px] bg-transparent border-gray-300">
                        Actions
                      </div>
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
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-gray-500"
                      >
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => {
                      const statusConfig = getStatusBadge(lead.status);
                      return (
                        <TableRow
                          key={lead.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <TableCell className="px-[20px] pr-[8px] py-[12px] text-left">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${lead.first_name} ${lead.lastName}`}
                                  alt={`${lead.first_name} ${lead.last_name}`}
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {getInitials(lead.first_name, lead.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {lead.first_name} {lead.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {lead.email}
                                </div>
                                {lead.phone && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    📞 {lead.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-[20px] pr-[8px] py-[12px] text-gray-600 text-left">
                            {lead.source || "Unknown"}
                          </TableCell>
                          <TableCell className="px-[20px] pr-[8px] py-[12px] text-gray-600 text-left">
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="cursor-help hover:text-cyan-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 rounded px-1 underline decoration-dotted"
                                    type="button"
                                    aria-label={`View details for ${(lead as any).leadTypeName || lead.typeSpecificData ? "lead category" : "General"}`}
                                    onClick={() =>
                                      console.log(
                                        "Lead data:",
                                        lead,
                                        "typeSpecificData:",
                                        lead.typeSpecificData
                                      )
                                    }
                                  >
                                    {(lead as any).leadTypeName || "General"}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-md p-4 bg-white border border-gray-200 shadow-xl z-50"
                                  sideOffset={5}
                                >
                                  <div className="space-y-2">
                                    <div className="font-semibold text-sm text-gray-900 border-b border-gray-200 pb-2 mb-2">
                                      {(lead as any).leadTypeName || "General"}{" "}
                                      - Details
                                    </div>
                                    {lead.typeSpecificData &&
                                    typeof lead.typeSpecificData === "object" &&
                                    Object.keys(lead.typeSpecificData).length >
                                      0 ? (
                                      <div className="space-y-2 text-xs">
                                        {Object.entries(
                                          lead.typeSpecificData
                                        ).map(([key, value]) => (
                                          <div
                                            key={key}
                                            className="flex justify-between gap-4 py-1"
                                          >
                                            <span className="font-medium text-gray-700">
                                              {key
                                                .split("_")
                                                .map(
                                                  (word) =>
                                                    word
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                    word.slice(1).toLowerCase()
                                                )
                                                .join(" ")}
                                              :
                                            </span>
                                            <span className="text-gray-900 text-right font-normal">
                                              {(() => {
                                                if (
                                                  key === "dateRange" &&
                                                  typeof value === "object" &&
                                                  value?.from &&
                                                  value?.to
                                                ) {
                                                  return `${format(new Date(value.from), "PPP")} → ${format(
                                                    new Date(value.to),
                                                    "PPP"
                                                  )}`;
                                                }

                                                if (
                                                  (key === "activities") &&
                                                  Array.isArray(value)
                                                ) {
                                                  return (
                                                    <div className="flex flex-col text-right">
                                                      {value.map((a, i) => (
                                                        <span key={i}>
                                                          {a.name} –{" "}
                                                          {a.datetime
                                                            ? format(
                                                                new Date(
                                                                  a.datetime
                                                                ),
                                                                "PPP p"
                                                              )
                                                            : "No time"}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  );
                                                }

                                                if (
                                                  typeof value === "object" &&
                                                  value !== null
                                                ) {
                                                  return JSON.stringify(value);
                                                }
                                                return value ?? "N/A";
                                              })()}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-500 italic py-2">
                                        No additional details available for this
                                        lead type
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="px-[20px] pr-[8px] py-[12px] text-gray-600 text-center">
                            {(lead as any).score || "Unknown"}
                          </TableCell>
                          <TableCell className="px-[20px] pr-[8px] py-[12px] text-gray-600 text-center">
                            {(lead as any).priority || "Unknown"}
                          </TableCell>
                          <TableCell className="px-[20px] pr-[8px] py-[12px] text-center">
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
                          <TableCell className="px-[20px] pr-[8px] py-[12px] text-gray-600 text-left">
                            <AssignedUserCell 
                              lead={lead} 
                              tenantId={tenant?.id}
                              onAssignmentChange={() => {
                                queryClient.invalidateQueries({
                                  queryKey: [`leads-tenant-${tenant?.id}`],
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell className="px-[20px] pr-[8px] py-[12px] text-gray-600 text-left">
                            {lead.created_at
                              ? format(new Date(lead.created_at), "dd MMM yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell className="px-[20px] pr-[8px] py-[12px] text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setLeadToCall(lead);
                                  setIsZoomDialogOpen(true);
                                }}
                                className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 h-8 w-8 p-0"
                                data-testid={`button-call-${lead.id}`}
                                title="Call with Zoom"
                              >
                                <Phone className="h-4 w-4" />
                              </Button>

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
                                    onClick={() => {
                                      setSelectedLeadForFollowUp(lead);
                                      setFollowUpDialogOpen(true);
                                    }}
                                  >
                                    <Target className="mr-2 h-4 w-4" />
                                    Add Follow-Up
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
                                        ""
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
                                        `Hello ${lead.firstName} ${lead.lastName},\n\nHere are your lead details:\nEmail: ${lead.email || "N/A"}\nPhone: ${lead.phone || "N/A"}\nStatus: ${lead.status || "N/A"}`
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

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
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
                  <span className="text-sm text-gray-700">
                    of {totalItems} results
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || totalItems === 0}
                    data-testid="button-previous-page"
                  >
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {(() => {
                      const totalPages = Math.ceil(totalItems / itemsPerPage);
                      console.log("🔍 Pagination Debug - totalItems:", totalItems, "itemsPerPage:", itemsPerPage, "totalPages:", totalPages, "currentPage:", currentPage);
                      
                      // Show pagination if we have items or if we're on a page > 1
                      if (totalPages === 0 && totalItems === 0 && currentPage === 1) {
                        return null; // Don't show pagination if no items and on first page
                      }
                      
                      // Ensure at least 1 page if we have items
                      const effectiveTotalPages = totalPages > 0 ? totalPages : (totalItems > 0 ? 1 : 0);
                      
                      if (effectiveTotalPages === 0) {
                        return null;
                      }
                      
                      const maxVisiblePages = 5;
                      const pages = [];

                      for (
                        let i = 0;
                        i < Math.min(maxVisiblePages, effectiveTotalPages);
                        i++
                      ) {
                        let pageNumber;
                        if (effectiveTotalPages <= maxVisiblePages) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= effectiveTotalPages - 2) {
                          pageNumber = effectiveTotalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }

                        pages.push(
                          <Button
                            key={pageNumber}
                            variant={
                              currentPage === pageNumber ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className="w-8 h-8 p-0"
                            data-testid={`button-page-${pageNumber}`}
                          >
                            {pageNumber}
                          </Button>
                        );
                      }
                      return pages;
                    })()}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const totalPages = Math.ceil(totalItems / itemsPerPage);
                      setCurrentPage(Math.min(totalPages, currentPage + 1));
                    }}
                    disabled={
                      totalItems === 0 || currentPage >= Math.ceil(totalItems / itemsPerPage)
                    }
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
          {/*KanbanBoard table  */}
          {viewMode === "grid" && (
            <KanbanBoard
              leads={kanbanLeads}
              onStatusChange={handleStatusChange}
              onViewLead={handleEdit}
            />
          )}

          {viewMode === "timeline" && (
            <LeadsAnalytics onStatusChange={handleStatusChange} />
          )}
        </div>
      </div>

      {/* Lead Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

      {/* Zoom Phone Dialog */}
      <ZoomPhoneEmbed
        isOpen={isZoomDialogOpen}
        onClose={() => {
          setIsZoomDialogOpen(false);
          setLeadToCall(null);
        }}
        customerPhone={leadToCall?.phone || undefined}
        customerName={
          leadToCall
            ? `${leadToCall.firstName} ${leadToCall.lastName}`
            : undefined
        }
      />

      {/* Follow-Up Dialog */}
      {selectedLeadForFollowUp && (
        <CreateFollowUpDialog
          open={followUpDialogOpen}
          onOpenChange={(open) => {
            setFollowUpDialogOpen(open);
            if (!open) {
              setSelectedLeadForFollowUp(null);
            }
          }}
          relatedTableName="leads"
          relatedTableId={selectedLeadForFollowUp.id}
          relatedEntityName={
            selectedLeadForFollowUp.name ||
            `${selectedLeadForFollowUp.firstName || ""} ${selectedLeadForFollowUp.lastName || ""}`.trim() ||
            selectedLeadForFollowUp.email
          }
        />
      )}

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Leads</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import leads. The file should contain columns: First Name, Last Name, Email, Phone, Source, Status, Priority, etc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="import-file">Select File</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSampleFile}
                  className="text-xs"
                >
                  <FileDown className="h-3 w-3 mr-1" />
                  Download Sample CSV
                </Button>
              </div>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="mt-2"
              />
              {importFile && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {importFile.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setImportFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportLeads}
              disabled={!importFile || isImporting}
            >
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <LeadManagementSettingsPanel
        open={isLeadSettingsPanelOpen}
        onOpenChange={setIsLeadSettingsPanelOpen}
      />
    </Layout>
    </SubscriptionGuard>
  );
}

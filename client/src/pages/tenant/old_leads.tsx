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
} from "lucide-react";
import {
  FaGoogle,
  FaFacebook,
  FaTwitter,
  FaYoutube,
  FaLinkedinIn,
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

const leadStatuses = [
  {
    value: "new",
    label: "New",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "old",
    label: "Old",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    value: "pending",
    label: "Pending",
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
    value: "converted",
    label: "Converted",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    value: "lost",
    label: "Lost",
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
  const { tenant } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState("list");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [opens, setOpens] = useState(false);
  const [tab, setTab] = useState("notes");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [activeTab, setActiveTab] = useState("personal");

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: [`leads-tenant-${tenant?.id}`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const result = await directLeadsApi.getLeads(tenant?.id!);
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

    return matchesSearch && matchesStatus;
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

              <div className="flex items-center space-x-2 border rounded-full bg-white p-1">
                {viewModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <Button
                      key={mode.key}
                      variant={viewMode === mode.key ? "default" : "none"}
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
                                handleStatusChange(lead.id, newStatus)
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
                                  <DropdownMenuItem className="text-red-600">
                                    Delete Lead
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
            onSubmit={onSubmit}
            initialData={editingLead}
            isLoading={
              createLeadMutation.isPending || updateLeadMutation.isPending
            }
          />
        </DialogContent>
      </Dialog>

      {/* View Details Modal Open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl transform transition-transform duration-300 z-50
    ${open ? "translate-x-0" : "translate-x-full"}
    w-full sm:w-[600px] md:w-[750px] lg:w-[900px]`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg md:text-xl font-semibold">Lead Details</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-y-auto">
          {/* Left Profile Card */}
          <div className="w-full md:w-1/3 border-b md:border-r p-4 flex flex-col items-center">
            {/* Tabs Personal / Company */}

            <div className="flex  items-center ml-2 flex-wrap border-b border-[#CDD5DF] w-[290px] h-[37px]">
              {/* Personal Tab */}
              <h1
                onClick={() => setActiveTab("personal")}
                className={`
          w-[116px] h-[36px]
          flex items-center justify-center
          px-7 cursor-pointer
          text-sm md:text-base
          rounded-t-[18px] border border-[#CDD5DF] border-b-0
          ${
            activeTab === "personal"
              ? "bg-[#0873BB] text-white"
              : "bg-white text-[#0873BB]"
          }
        `}
              >
                Personal
              </h1>

              {/* Company Tab */}
              <h1
                onClick={() => setActiveTab("company")}
                className={`
          w-[116px] h-[36px]
          flex items-center justify-center
          px-7 cursor-pointer
          text-sm md:text-base
          rounded-t-[18px] border border-[#CDD5DF] border-b-0
          ${
            activeTab === "company"
              ? "bg-[#0873BB] text-white"
              : "bg-white text-[#0873BB]"
          }
        `}
              >
                Company
              </h1>
            </div>

            {/* Profile Info */}
            {/* <div className="flex items-center justify-between gap-3 w-full flex-wrap mt-4">
              <img
                src="https://via.placeholder.com/100"
                alt="profile"
                className="w-16 h-16 border rounded-full object-cover"
              />

              <div className="min-w-0 flex-1">
                <h3 className="text-base md:text-lg font-semibold truncate">
                  
                  {selectedLead?.name || "-"}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 truncate">
                 
                 
                  {selectedLead?.email || "-"}
                </p>
              </div>

              <span className="text-xl">
                <Phone className="w-6 h-6 text-gray-600" />
              </span>
            </div> */}

            <div className="flex items-center justify-between gap-4 w-full flex-wrap mt-4 p-3 bg-white ">
              {/* Profile Image */}
              <img
                src="https://via.placeholder.com/100"
                alt="profile"
                className="w-16 h-16 border-2 border-gray-200 rounded-full object-cover shadow-sm"
              />

              {/* Name & Email */}
              <div className="min-w-0 flex-1">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 truncate">
                  {selectedLead?.name || "-"}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 truncate">
                  {selectedLead?.email || "-"}
                </p>
              </div>

              {/* Phone Icon */}
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer transition">
                <Phone className="w-5 h-5 text-gray-600" />
              </span>
            </div>

            <hr className="my-1 w-full" />

            {/* Status */}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap mb-4">
              <h1 className="border rounded-md px-2 py-1 text-sm">Request</h1>
              <h1 className="border rounded-md px-2 py-1 text-sm">
                In Progress
              </h1>
              <h1 className="border rounded-md px-2 py-1 text-sm">Closed</h1>
            </div>

            {/* Details */}
            <div className="w-full mt-4 space-y-2 text-xs md:text-sm mt-5">
              {/* Details */}
              <div className="flex justify-between">
                <span className="font-semibold">Position:</span>
                <span>{selectedLead?.status || "CMO"}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold">Address:</span>
                <span>{selectedLead?.city || "-"}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold">Phone:</span>
                <span>{selectedLead?.phone || "-"}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold">Email:</span>
                <span> {selectedLead?.email || "-"}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold">GSTIN:</span>
                <span>ABCD12345678</span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold">Member Since:</span>
                <span>12 Oct 2024</span>
              </div>

              {/* Social Icons */}
              <div className="flex justify-start gap-3 mt-4">
                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaYoutube className="w-3 h-3 md:w-5 md:h-5 text-red-600 hover:scale-110 transition-transform" />
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/917898164395"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedinIn className="w-3 h-3 md:w-5 md:h-5 text-blue-600 hover:scale-110 transition-transform" />
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaFacebook className="w-3 h-3 md:w-5 md:h-5 text-blue-600 hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>

            <button className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm md:text-base">
              Proceed →
            </button>
          </div>

          {/* Right Section */}
          <div className="flex-1 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b overflow-x-auto">
              {["notes", "activity", "email"].map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`px-4 py-2 capitalize whitespace-nowrap text-sm md:text-base ${
                    tab === item
                      ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 overflow-y-auto flex-1 text-sm md:text-base">
              {tab === "notes" && (
                <div>
                  <p className="text-gray-700 mb-4 border rounded-sm p-3">
                    {/* Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. */}
                    {selectedLead?.notes || "-"}
                  </p>

                  <div>
                    <select className="border rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base">
                      <option value="focus">Focus</option>
                    </select>
                  </div>

                  {/* Timeline */}

                  <div className="space-y-6 mt-4 relative">
                    {/* Phone Note */}
                    <div className="flex items-start gap-3 relative">
                      {/* Left Side Timeline */}
                      <div className="flex flex-col items-center">
                        {/* Circle Icon */}
                        <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black-600 bg-white">
                          <Phone className="w-5 h-5 text-black-600" />
                        </div>
                        {/* Vertical Line */}
                        <div className="w-px h-full bg-red"></div>
                        <div className="flex-1 h-0.5 bg-red"></div>
                      </div>

                      {/* Content */}
                      <div className="border rounded-lg p-3 flex-1">
                        <h4 className="font-semibold text-black text-sm md:text-base">
                          <span className="border rounded-xl px-1 bg-green-600 text-white">
                            ✔{" "}
                          </span>{" "}
                          &nbsp;&nbsp;Lorem ipsum dolor sit amet
                        </h4>
                        <p className="text-xs text-gray-400">August 14, 2025</p>
                        <p className="text-sm mt-1 text-gray-600">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit.
                        </p>
                      </div>
                    </div>

                    {/* Video Note */}
                    <div className="flex items-start gap-3 relative">
                      {/* Left Side Timeline */}
                      <div className="flex flex-col items-center">
                        {/* Circle Icon */}
                        <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black-600 bg-white">
                          <Video className="w-5 h-5 text-black-600" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="border rounded-lg p-3 flex-1">
                        <h4 className="font-semibold text-sm md:text-base">
                          Lorem ipsum dolor sit amet
                        </h4>
                        <p className="text-xs text-gray-400">August 14, 2025</p>
                        <p className="text-sm mt-1 text-gray-600">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "activity" && (
                <p className="text-gray-700">
                  Activity details will come here.
                </p>
              )}

              {tab === "email" && (
                <p className="text-gray-700">Email details will come here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

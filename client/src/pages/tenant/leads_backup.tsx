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
  // ... all the state variables and functions remain the same ...
  
  // ALL EXISTING CODE REMAINS THE SAME UNTIL THE SEARCH AND VIEW OPTIONS SECTION

  console.log("leads", image1);
  
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

          {/* Search and View Options - CORRECTED STRUCTURE */}
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
              </div>
              {/* VIEW MODE TABS - NOW ON THE RIGHT SIDE AS A SEPARATE SIBLING */}
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

          {/* Rest of the component remains the same... */}
        </div>
      </div>
    </Layout>
  );
}
// statusFilter.tsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/lib/types";
import countIcon from "../../assets/count125.svg";
import AddIcon from "../../assets/AddIcon.svg";
import Arrow from "../../assets/Arrow.svg";
import { Phone, Video } from "lucide-react";
import { FaFacebook, FaLinkedinIn, FaYoutube } from "react-icons/fa";
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

const priorityColors = [
  {
    value: "low",
    label: "Low",
    color: "",
    badgeColor: "bg-green-100 text-green-800 border-green-200",
  },
  {
    value: "medium",
    label: "Medium",
    color: "",
    badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  {
    value: "high",
    label: "High",
    color: "",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    value: "urgent",
    label: "Urgent",
    color: "",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
  },
];

interface KanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: number, newStatus: string) => void;
  onViewLead: (lead: Lead) => void;
}

export default function KanbanBoard({
  leads,
  onStatusChange,
  onViewLead,
}: KanbanBoardProps) {
  const [dragging, setDragging] = useState<{ leadId: number | null }>({
    leadId: null,
  });
console.log("Leads in KanbanBoard:", leads);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("notes");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleDragStart = (leadId: number) => {
    setDragging({ leadId });
  };

  const handleDrop = (status: string) => {
    if (dragging.leadId === null) return;
    onStatusChange(dragging.leadId, status);
    setDragging({ leadId: null });
  };

  const handleAddClick = (status: string) => {
    console.log(`Add icon clicked for: ${status}`);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "L";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = leadStatuses.find((s) => s.value === status);
    return statusConfig || leadStatuses[0];
  };

  const getPriorityConfig = (priority: string) => {
    const priorityConfig = priorityColors.find((p) => p.value === priority?.toLowerCase());
    return priorityConfig || priorityColors[0]; // Default to low if not found
  };

  return (
    <div className="mt-8 px-4">
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"> */}
      {/* <div className="flex overflow-x-auto space-x-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"> */}
      {/* <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"> */}
      <div className="flex space-x-4 overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {leadStatuses.map((status) => {
          const leadsInStatus = leads.filter(
            (lead) => lead.status === status.value
          );

          return (
            <Card
              key={status.value}
              className="min-w-[280px] max-w-[320px] w-[300px] bg-white shadow-md rounded-xl border border-gray-200 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status.value)}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-3 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-[#101828] font-medium text-[15px]">
                    {status.label}
                  </h3>
                  <img src={countIcon} alt="Count" className="w-6 h-6" />
                </div>
                <img
                  src={AddIcon}
                  alt="Add"
                  className="w-7 h-7 cursor-pointer"
                  onClick={() => handleAddClick(status.value)}
                />
              </div>

              {/* Color Bar */}
              <div className={`h-1 w-full rounded-t ${status.color}`}></div>

              {/* Leads List */}
              <CardContent className="space-y-3 p-3 overflow-hidden">
                {leadsInStatus.length > 0 ? (
                  leadsInStatus.map((lead) => {
                    const statusConfig = getStatusBadge(lead.status);
                    const priorityConfig = getPriorityConfig(lead.priority);
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        onClick={() => {
                          setSelectedLead(lead);
                          setOpen(true);
                        }}
                        className="w-full max-w-[260px] h-[100px] bg-white border border-gray-300 rounded-lg flex flex-col p-4 gap-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-300 mx-auto"
                        style={{ boxSizing: 'border-box' }}
                      >
                        {/* First Row - Name and Chevron */}
                        <div className="flex justify-between items-center min-w-0">
                          <span className="text-[15px] font-normal text-gray-700 truncate flex-1 min-w-0">
                            {lead.name || "Unknown"}
                          </span>
                          <div className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-400 ml-2 flex-shrink-0">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="text-gray-600"
                            >
                              <path
                                d="M9 18L15 12L9 6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Second Row - Email and Priority Badge */}
                        <div className="flex justify-between items-center min-w-0">
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[14px] font-semibold text-gray-900 uppercase truncate">
                              {lead.email}
                            </span>
                            <span className="text-[12px] font-normal text-gray-600 truncate">
                              Score: {lead.score || "N/A"}
                            </span>
                          </div>
                          <Badge
                            className={`${priorityConfig.badgeColor} text-xs font-medium px-2 py-1 rounded-md shadow-sm ml-2 flex-shrink-0`}
                          >
                            {priorityConfig.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 text-center">No leads yet</p>
                    <p className="text-xs text-gray-400 text-center mt-1">Add your first lead to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* View Details Modal Open */}
      {selectedLead && <LeadDetails lead={selectedLead} open={open} setOpen={setOpen} />}
      </div>
    </div>
  );
}

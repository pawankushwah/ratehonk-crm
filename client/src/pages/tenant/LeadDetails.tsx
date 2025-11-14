import React, { useState, useEffect } from "react";
import { 
  User, Phone, ChevronDown, ChevronUp, Mail, Calendar, MessageSquare, 
  Video, Users, FileText, Target, CheckCircle, AlertCircle, Plus,
  CreditCard, Clock, UserPlus, Send, PhoneCall, CalendarDays,
  FileCheck, DollarSign, Award, Paperclip, StickyNote, Star, MessageCircle, File
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Lead } from "@/lib/types";
import NotesModalNew from "@/LeadsModal/NotesModalNew";
import CallModal, { CallItem } from "@/LeadsModal/CallModal";
import ActivityModal, { ActivityItem } from "@/LeadsModal/ActivityModal";
import EmailModalNew from "@/LeadsModal/EmailModalNew";
import { useAuth } from "@/components/auth/auth-provider";
import { WhatsAppMessageDialog } from "@/components/customer/whatsapp-message-dialog";
import { ActivityDataPopup } from "@/components/ActivityDataPopup";

interface LeadDetailsProps {
  lead: Lead | null;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function LeadDetails({ lead, open, setOpen }: LeadDetailsProps) {
  const [tab, setTab] = useState("notes");
  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();
  const [activityPopupOpen, setActivityPopupOpen] = useState(false);
  const [selectedActivityTable, setSelectedActivityTable] = useState<{
    tableName: string | null;
    tableId: number | null;
  }>({ tableName: null, tableId: null });

  // Helper functions for activity display
  const getActivityIcon = (activityType: number) => {
    const iconMap = {
      1: UserPlus,      // Lead Created
      2: Mail,          // Email Sent
      3: PhoneCall,     // Call Made
      4: CalendarDays,  // Meeting Scheduled
      5: MessageCircle, // WhatsApp Message Sent
      6: Send,          // Proposal Sent
      7: FileCheck,     // Contract Signed
      8: DollarSign,    // Payment Received
      9: Award,         // Project Completed
      10: FileText,     // Other
      11: FileText,     // Booking Created
      12: FileText      // Invoice Created
    };
    return iconMap[activityType as keyof typeof iconMap] || FileText;
  };

  const getActivityTypeLabel = (activityType: number) => {
    const labelMap = {
      1: "Lead Created",
      2: "Email Sent",
      3: "Call Made",
      4: "Meeting Scheduled",
      5: "WhatsApp Message Sent",
      6: "Proposal Sent",
      7: "Contract Signed",
      8: "Payment Received",
      9: "Project Completed",
      10: "Other",
      11: "Booking Created",
      12: "Invoice Created"
    };
    return labelMap[activityType as keyof typeof labelMap] || "Unknown";
  };

  const getActivityStatusLabel = (activityStatus: number) => {
    return activityStatus === 1 ? "Completed" : "Pending";
  };

  const getActivityStatusColor = (activityStatus: number) => {
    return activityStatus === 1 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-orange-100 text-orange-800 border-orange-200";
  };
  
  // Modal states for non-database tabs
  const [calls, setCalls] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);

  // Fetch real activities from API
  const { data: activitiesData, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: [`/api/tenants/${lead?.tenantId}/leads/${lead?.id}/activities`],
    enabled: !!lead?.id && open, // Only fetch when lead is available and modal is open
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch real notes from API
  const { data: notesData, isLoading: notesLoading, refetch: refetchNotes } = useQuery({
    queryKey: [`/api/tenants/${lead?.tenantId}/leads/${lead?.id}/notes`],
    enabled: !!lead?.id && open, // Only fetch when lead is available and modal is open
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch real emails from API
  const { data: emailsData, isLoading: emailsLoading, refetch: refetchEmails } = useQuery({
    queryKey: [`/api/tenants/${lead?.tenantId}/leads/${lead?.id}/emails`],
    enabled: !!lead?.id && open, // Only fetch when lead is available and modal is open
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch real call logs from API
  const { data: callsData, isLoading: callsLoading, refetch: refetchCalls } = useQuery({
    queryKey: [`/api/tenants/${lead?.tenantId}/leads/${lead?.id}/calls`],
    enabled: !!lead?.id && open, // Only fetch when lead is available and modal is open
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch WhatsApp messages from API
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: [`/api/tenants/${lead?.tenantId}/leads/${lead?.id}/whatsapp-messages`],
    enabled: !!lead?.id && open, // Only fetch when lead is available and modal is open
    staleTime: 0, // Always fetch fresh data
  });

  const activities = (activitiesData as any)?.activities || [];
  const notes = (notesData as any)?.notes || [];
  const emailsFromApi = (emailsData as any)?.emails || [];
  const callsFromApi = (callsData as any)?.calls || [];
  const messages = (messagesData as any) || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableItem, setEditableItem] = useState(null);
  const [openItemId, setOpenItemId] = useState(null);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      // Validate required IDs are available
      if (!lead?.id || !user?.id || !(lead?.tenantId || tenant?.id)) {
        throw new Error("Missing required lead ID, user ID, or tenant ID");
      }

      // Include all required IDs in the request payload
      const activityPayload = {
        ...activityData,
        leadId: lead.id,
        tenantId: lead.tenantId || tenant?.id,
        userId: user.id
      };
      
      console.log("🔥 Frontend - Sending activity data:", activityPayload);
      return await apiRequest("POST", `/api/tenants/${lead.tenantId}/leads/${lead.id}/activities`, activityPayload);
    },
    onSuccess: () => {
      // Invalidate and refetch activities
      queryClient.invalidateQueries({ 
        queryKey: [`/api/tenants/${lead?.tenantId}/leads/${lead?.id}/activities`] 
      });
      refetchActivities();
      // Close modal on success
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error("❌ Failed to create activity:", error);
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      // Validate required IDs are available
      if (!lead?.id || !user?.id || !(lead?.tenantId || tenant?.id)) {
        throw new Error("Missing required lead ID, user ID, or tenant ID");
      }

      // Include all required IDs in the request payload
      const notePayload = {
        ...noteData,
        leadId: lead.id,
        tenantId: lead.tenantId || tenant?.id,
        userId: user.id
      };
      
      console.log("🔥 Frontend - Sending note data:", notePayload);
      return await apiRequest("POST", `/api/tenants/${lead.tenantId}/leads/${lead.id}/notes`, notePayload);
    },
    onSuccess: () => {
      // Invalidate and refetch notes
      queryClient.invalidateQueries({ 
        queryKey: [`/api/tenants/${lead?.tenantId}/leads/${lead?.id}/notes`] 
      });
      refetchNotes();
      // Close modal on success
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error("❌ Failed to create note:", error);
    },
  });

  // Toggle states for sidebar sections
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    contact: true,
    location: true,
    management: true,
    assignment: true,
    activity: true,
    travelDetails: true,
    systemInfo: false,
    notes: true
  });

  const toggleSection = (section: string) => {
    setToggleStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get current data based on active tab
  const getCurrentData = (): [any[], (data: any[]) => void] => {
    if (tab === "call") return [calls, setCalls];
    if (tab === "email") return [emails, setEmails];
    return [[], () => {}]; // Notes and Activities are read-only from API
  };

  // Save Item (Add or Edit)
  const handleSaveItem = (item: any, mode: string) => {
    // Handle activity creation via API
    if (tab === "activity" && mode !== "edit") {
      console.log("🔍 Creating activity with data:", item);
      createActivityMutation.mutate(item);
      return;
    }

    // Handle note creation via API
    if (tab === "notes" && mode !== "edit") {
      console.log("🔍 Creating note with data:", item);
      createNoteMutation.mutate(item);
      return;
    }

    // Handle other tabs with local state
    const [data, setData] = getCurrentData();
    if (mode === "edit") {
      setData(data.map((i: any) => (i.id === item.id ? item : i)));
    } else {
      setData([...data, item]);
    }
    setEditableItem(null);
  };

  // Edit Item
  const handleEditItem = (item: any) => {
    setEditableItem(item);
    setIsModalOpen(true);
  };

  // Delete Item
  const handleDeleteItem = (id: any) => {
    const [data, setData] = getCurrentData();
    setData(data.filter((i: any) => i.id !== id));
  };

  // Get Modal Component based on active tab
  const getModalComponent = () => {
    if (tab === "notes") {
      return (
        <NotesModalNew
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
          editableNote={editableItem}
          isLoading={createNoteMutation.isPending}
        />
      );
    } else if (tab === "call") {
      return (
        <CallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          leadId={lead?.id || 0}
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
          isLoading={createActivityMutation.isPending}
        />
      );
    } else if (tab === "email") {
      return (
        <EmailModalNew
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          leadId={lead?.id || 0}
          leadEmail={lead?.email}
        />
      );
    }
  };

  // Get List Component based on active tab
  const getListComponent = () => {
    const data = tab === "call" ? callsFromApi : tab === "email" ? emails : [];

    // Show loading state for activities
    if (tab === "activity" && activitiesLoading) {
      return <div className="text-center py-8 text-gray-500">Loading activities...</div>;
    }

    // Show loading state for notes
    if (tab === "notes" && notesLoading) {
      return <div className="text-center py-8 text-gray-500">Loading notes...</div>;
    }

    // Show loading state for emails
    if (tab === "email" && emailsLoading) {
      return <div className="text-center py-8 text-gray-500">Loading emails...</div>;
    }

    // Show loading state for calls
    if (tab === "call" && callsLoading) {
      return <div className="text-center py-8 text-gray-500">Loading calls...</div>;
    }

    // Show activities data
    if (tab === "activity") {
      if (activities.length === 0) {
        return <div className="text-center py-8 text-gray-500">No activities found for this lead.</div>;
      }
      
      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {activities.map((activity: any, index: number) => {
            const ActivityIcon = getActivityIcon(activity.activityType);
            const activityTypeLabel = getActivityTypeLabel(activity.activityType);
            const statusLabel = getActivityStatusLabel(activity.activityStatus);
            const statusColor = getActivityStatusColor(activity.activityStatus);
            
            return (
              <div key={activity.id} className="flex gap-4">
                {/* Left side - Icon with timeline */}
                <div className="flex flex-col items-center">
                  {/* Activity Type Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.activityStatus === 1 
                      ? 'bg-green-100 border-2 border-green-200' 
                      : 'bg-orange-100 border-2 border-orange-200'
                  }`}>
                    <ActivityIcon className={`w-5 h-5 ${
                      activity.activityStatus === 1 ? 'text-green-600' : 'text-orange-600'
                    }`} />
                  </div>
                  {/* Dotted line connector */}
                  {index < activities.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                {/* Right side - Activity Card */}
                <div 
                  className={`flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${
                    activity.activityTableId && activity.activityTableName
                      ? "cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                      : ""
                  }`}
                  onClick={() => {
                    console.log("🔍 Lead Activity clicked:", {
                      activityId: activity.id,
                      activityTableId: activity.activityTableId,
                      activityTableName: activity.activityTableName,
                      hasTableData: !!(activity.activityTableId && activity.activityTableName),
                    });
                    if (activity.activityTableId && activity.activityTableName) {
                      setSelectedActivityTable({
                        tableName: activity.activityTableName,
                        tableId: activity.activityTableId,
                      });
                      setActivityPopupOpen(true);
                      console.log("✅ Popup should open now");
                    } else {
                      console.log("⚠️ Activity has no table data, popup not opening");
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Activity Type Icon (smaller) */}
                      <ActivityIcon className={`w-4 h-4 ${
                        activity.activityStatus === 1 ? 'text-green-600' : 'text-orange-600'
                      }`} />
                      <div>
                        <h4 className="font-semibold text-gray-900">{activity.activityTitle}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{activityTypeLabel}</span>
                          <span className="text-gray-300">•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                            {statusLabel}
                          </span>
                          {activity.activityTableId && activity.activityTableName && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              View Details
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {new Date(activity.activityDate).toLocaleDateString()}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(activity.activityDate).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {activity.activityDescription && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">{activity.activityDescription}</p>
                    </div>
                  )}

                  {/* User info if available */}
                  {activity.userName && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Created by {activity.userName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Show notes data with timeline style
    if (tab === "notes") {
      if (notes.length === 0) {
        return <div className="text-center py-8 text-gray-500">No notes found for this lead.</div>;
      }
      
      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {notes.map((note: any, index: number) => {
            const NoteTypeIcon = note.noteType === "important" ? Star : 
                                 note.noteType === "reminder" ? AlertCircle :
                                 note.noteType === "follow-up" ? Target : StickyNote;
            const isImportant = note.isImportant;
            
            return (
              <div key={note.id} className="flex gap-4">
                {/* Left side - Icon with timeline */}
                <div className="flex flex-col items-center">
                  {/* Note Type Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isImportant 
                      ? 'bg-yellow-100 border-yellow-200' 
                      : 'bg-blue-100 border-blue-200'
                  }`}>
                    <NoteTypeIcon className={`w-5 h-5 ${
                      isImportant ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                  </div>
                  {/* Dotted line connector */}
                  {index < notes.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                {/* Right side - Note Card */}
                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Note Type Icon (smaller) */}
                      <NoteTypeIcon className={`w-4 h-4 ${
                        isImportant ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <div>
                        <h4 className="font-semibold text-gray-900">{note.noteTitle}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 capitalize">{note.noteType}</span>
                          {isImportant && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                Important
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(note.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {note.noteContent && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">{note.noteContent}</p>
                    </div>
                  )}

                  {/* Attachment Display */}
                  {note.attachment && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                          {note.attachment}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Reminder Display */}
                  {note.reminder && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-700">Reminder Set</span>
                      </div>
                      {note.reminderDate && (
                        <p className="text-xs text-gray-600 ml-6">
                          📅 {new Date(note.reminderDate).toLocaleDateString()} at {new Date(note.reminderDate).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 ml-6">
                        🎯 {note.reminderAuto ? 'For you' : `For ${note.reminderEmail || 'someone else'}`}
                      </p>
                    </div>
                  )}

                  {/* User info if available */}
                  {note.userName && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Created by {note.userName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (tab === "call") {
      if (callsFromApi.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <PhoneCall className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No call logs recorded for this lead yet</p>
            <p className="text-sm mt-1">Click "Add Call" to log your first call</p>
          </div>
        );
      }

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {callsFromApi.map((callLog: any, index: number) => {
            const isOutbound = callLog.callType === 'outbound';
            const isCompleted = callLog.status === 'completed';
            
            return (
              <div key={callLog.id} className="flex gap-4">
                {/* Left side - Icon with timeline */}
                <div className="flex flex-col items-center">
                  {/* Call Type Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-100 border-2 border-green-200' 
                      : 'bg-red-100 border-2 border-red-200'
                  }`}>
                    <PhoneCall className={`w-5 h-5 ${
                      isCompleted ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  {/* Dotted line connector */}
                  {index < callsFromApi.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                {/* Right side - Call Card */}
                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Call Direction */}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        isOutbound 
                          ? 'bg-blue-100 text-blue-800 border-blue-200' 
                          : 'bg-purple-100 text-purple-800 border-purple-200'
                      }`}>
                        {isOutbound ? 'Outbound' : 'Inbound'}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        isCompleted 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {callLog.status || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {new Date(callLog.createdAt).toLocaleDateString()}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(callLog.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Call Duration */}
                  {callLog.duration && (
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {callLog.duration} {callLog.duration === 1 ? 'minute' : 'minutes'}
                      </span>
                    </div>
                  )}
                  
                  {/* Call Notes */}
                  {callLog.notes && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">{callLog.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if (tab === "email") {
      if (emailsFromApi.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No emails sent to this lead yet</p>
            <p className="text-sm mt-1">Click "Add Email" to send your first email</p>
          </div>
        );
      }
      
      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {emailsFromApi.map((email: any, index: number) => {
            const isDelivered = email.status === 'sent';
            
            return (
              <div key={email.id} className="flex gap-4">
                {/* Left side - Icon with timeline */}
                <div className="flex flex-col items-center">
                  {/* Email Status Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isDelivered 
                      ? 'bg-green-100 border-green-200' 
                      : 'bg-orange-100 border-orange-200'
                  }`}>
                    <Mail className={`w-5 h-5 ${
                      isDelivered ? 'text-green-600' : 'text-orange-600'
                    }`} />
                  </div>
                  {/* Dotted line connector */}
                  {index < emailsFromApi.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                {/* Right side - Email Card */}
                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Email Icon (smaller) */}
                      <Send className={`w-4 h-4 ${
                        isDelivered ? 'text-green-600' : 'text-orange-600'
                      }`} />
                      <div>
                        <h4 className="font-semibold text-gray-900">{email.subject}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">To: {email.email}</span>
                          <span className="text-gray-300">•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            isDelivered 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-orange-100 text-orange-800 border-orange-200'
                          }`}>
                            {email.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {new Date(email.sentAt).toLocaleDateString()}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(email.sentAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {email.body && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {email.body.length > 200 
                          ? `${email.body.substring(0, 200)}...` 
                          : email.body
                        }
                      </p>
                    </div>
                  )}

                  {/* Sender info */}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      From: {email.fromEmail}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (tab === "messages") {
      if (messages.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No WhatsApp messages sent to this lead yet</p>
            <p className="text-sm mt-1">
              Click "Send WhatsApp" button to send your first message
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {messages.map((msg: any, index: number) => {
            const isText = msg.messageType === "text";
            const statusColor = msg.status === "sent" ? "green" : msg.status === "failed" ? "red" : "gray";

            return (
              <div key={msg.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center bg-${statusColor}-100 border-2 border-${statusColor}-200`}
                  >
                    <MessageCircle className={`w-5 h-5 text-${statusColor}-600`} />
                  </div>
                  {index < messages.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Send className={`w-4 h-4 text-${statusColor}-600`} />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {isText ? "Text Message" : `Media Message (${msg.mediaType})`}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            To: {msg.recipientNumber}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize bg-${statusColor}-100 text-${statusColor}-800 border-${statusColor}-200`}>
                            {msg.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">
                        {new Date(msg.sentAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {isText && msg.textContent && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.textContent}
                      </p>
                    </div>
                  )}

                  {!isText && msg.mediaUrl && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <File className="w-4 h-4 text-gray-400" />
                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View {msg.mediaType}
                        </a>
                      </div>
                      {msg.mediaCaption && (
                        <p className="text-gray-600 text-sm leading-relaxed mt-2">
                          {msg.mediaCaption}
                        </p>
                      )}
                    </div>
                  )}

                  {msg.sentByName && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          Sent by: {msg.sentByName}
                        </span>
                      </div>
                    </div>
                  )}

                  {msg.deviceNumber && (
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        Device: {msg.deviceNumber}
                      </span>
                    </div>
                  )}

                  <div className="mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(msg.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  };

  // Section Header Component with Toggle
  const SectionHeader = ({ title, isOpen, onToggle }: { title: string; isOpen: boolean; onToggle: () => void }) => (
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between font-semibold text-gray-800 border-b pb-1 hover:bg-gray-50 p-1 rounded transition-colors"
    >
      <h4>{title}</h4>
      {isOpen ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
  );

  if (!lead) return null;

  return (
    <>
      {open && (
        <div
        //   className="fixed inset-0 bg-black/40 z-40"
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

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Left Profile Card - Scrollable */}
          <div className="w-full md:w-1/3 border-b md:border-r flex flex-col">
            <div className="p-4 flex flex-col items-center border-b">
              {/* Profile Info */}
              <div className="flex items-center justify-between gap-3 w-full flex-wrap">
                <div className="w-16 h-16 border rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base md:text-lg font-semibold truncate">
                    {lead.name || `${lead.firstName} ${lead.lastName}` || "-"}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 truncate">
                    {lead.email || "-"}
                  </p>
                </div>
                <span className="text-xl">
                  <Phone className="w-6 h-6 text-gray-600" />
                </span>
              </div>

              {/* Current Status */}
              <div className="flex items-center justify-center mt-6 mb-2">
                <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                  lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                  lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                  lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                  lead.status === 'converted' ? 'bg-purple-100 text-purple-800' :
                  lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {lead.status || 'New'}
                </span>
              </div>
            </div>

            {/* Scrollable Details Section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs md:text-sm">
              {/* Contact Information */}
              <div className="space-y-2">
                <SectionHeader 
                  title="Contact Information" 
                  isOpen={toggleStates.contact} 
                  onToggle={() => toggleSection('contact')} 
                />
                {toggleStates.contact && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span>{lead.phone || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span>{lead.email || "-"}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Location Information */}
              <div className="space-y-2">
                <SectionHeader 
                  title="Location" 
                  isOpen={toggleStates.location} 
                  onToggle={() => toggleSection('location')} 
                />
                {toggleStates.location && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Country:</span>
                      <span>{lead.country || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">State:</span>
                      <span>{lead.state || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">City:</span>
                      <span>{lead.city || "-"}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Lead Management */}
              <div className="space-y-2">
                <SectionHeader 
                  title="Lead Management" 
                  isOpen={toggleStates.management} 
                  onToggle={() => toggleSection('management')} 
                />
                {toggleStates.management && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Source:</span>
                      <span className="capitalize">{lead.source || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Priority:</span>
                      <span className={`capitalize px-2 py-1 rounded-full text-xs ${
                        lead.priority === 'high' ? 'bg-red-100 text-red-800' :
                        lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        lead.priority === 'low' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{lead.priority || "Medium"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Budget Range:</span>
                      <span>{lead.budgetRange || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Lead Score:</span>
                      <span className="font-semibold text-blue-600">{lead.score || 0}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Assignment Information */}
              <div className="space-y-2">
                <SectionHeader 
                  title="Assignment" 
                  isOpen={toggleStates.assignment} 
                  onToggle={() => toggleSection('assignment')} 
                />
                {toggleStates.assignment && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Assigned User ID:</span>
                      <span>{(lead as any).assignedUserId || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Assigned By:</span>
                      <span>{(lead as any).assignedBy || "-"}</span>
                    </div>
                    {(lead as any).assignedAt && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Assigned Date:</span>
                        <span>{new Date((lead as any).assignedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Activity Tracking */}
              <div className="space-y-2">
                <SectionHeader 
                  title="Activity" 
                  isOpen={toggleStates.activity} 
                  onToggle={() => toggleSection('activity')} 
                />
                {toggleStates.activity && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email Opens:</span>
                      <span>{lead.emailOpens || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email Clicks:</span>
                      <span>{lead.emailClicks || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Website Visits:</span>
                      <span>{lead.websiteVisits || 0}</span>
                    </div>
                    {lead.lastContactDate && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Last Contact:</span>
                        <span>{new Date(lead.lastContactDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Type Specific Data */}
              {lead.typeSpecificData && Object.keys(lead.typeSpecificData).length > 0 && (
                <div className="space-y-2">
                  <SectionHeader 
                    title="Travel Details" 
                    isOpen={toggleStates.travelDetails} 
                    onToggle={() => toggleSection('travelDetails')} 
                  />
                  {toggleStates.travelDetails && (
                    <>
                      {Object.entries(lead.typeSpecificData).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                          </span>
                          <span>{typeof value === 'object' ? JSON.stringify(value) : String(value || "-")}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* System Information */}
              <div className="space-y-2">
                <SectionHeader 
                  title="System Info" 
                  isOpen={toggleStates.systemInfo} 
                  onToggle={() => toggleSection('systemInfo')} 
                />
                {toggleStates.systemInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Lead ID:</span>
                      <span>#{lead.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Tenant ID:</span>
                      <span>{lead.tenantId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Lead Type ID:</span>
                      <span>{lead.leadTypeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Created:</span>
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Updated:</span>
                      <span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Notes Section */}
              {lead.notes && (
                <div className="space-y-2">
                  <SectionHeader 
                    title="Notes" 
                    isOpen={toggleStates.notes} 
                    onToggle={() => toggleSection('notes')} 
                  />
                  {toggleStates.notes && (
                    <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {lead.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Section (Tabs) - Fixed Position */}
          <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center justify-between border-b">
              <div className="flex overflow-x-auto">
                {["notes", "activity", "email", "call", "messages"].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setTab(item);
                      // Refetch data when tabs are clicked
                      if (item === "activity") {
                        refetchActivities();
                      }
                      if (item === "messages") {
                        refetchMessages();
                      }
                    }}
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
              
              {/* Add Button in Header */}
              <div className="px-4">
                <Button
                  onClick={() => {
                    if (tab === "messages") {
                      setIsWhatsAppDialogOpen(true);
                    } else {
                      setEditableItem(null);
                      setIsModalOpen(true);
                    }
                  }}
                  size="sm"
                  className={`${
                    tab === "notes"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : tab === "call"
                      ? "bg-green-600 hover:bg-green-700"
                      : tab === "email"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : tab === "messages"
                      ? "bg-cyan-600 hover:bg-cyan-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  } text-white flex items-center gap-2`}
                >
                  <Plus className="w-4 h-4" />
                  {tab === "notes" 
                    ? "Add Note" 
                    : tab === "call" 
                    ? "Add Call" 
                    : tab === "email" 
                    ? "Add Email"
                    : tab === "messages"
                    ? "Send WhatsApp"
                    : "Add Activity"}
                </Button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Dynamic Modal */}
              {getModalComponent()}

              {/* Dynamic List with Scrolling */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-h-full">
                  {getListComponent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Message Dialog */}
      {lead && (
        <WhatsAppMessageDialog
          open={isWhatsAppDialogOpen}
          onOpenChange={setIsWhatsAppDialogOpen}
          recipientType="lead"
          recipientId={lead.id}
          recipientName={lead.name || `${lead.firstName} ${lead.lastName}`}
          recipientPhone={lead.mobile || lead.phone || ""}
          onSuccess={() => {
            refetchMessages();
            refetchActivities();
          }}
        />
      )}

      {/* Activity Data Popup */}
      <ActivityDataPopup
        isOpen={activityPopupOpen}
        onClose={() => {
          setActivityPopupOpen(false);
          setSelectedActivityTable({ tableName: null, tableId: null });
        }}
        tableName={selectedActivityTable.tableName}
        tableId={selectedActivityTable.tableId}
        tenantId={tenant?.id}
      />
    </>
  );
}
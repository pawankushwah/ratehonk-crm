import React, { useState, useEffect } from "react";
import { 
  User, Phone, ChevronDown, ChevronUp, Mail, Calendar, MessageSquare, 
  Video, Users, FileText, Target, CheckCircle, AlertCircle, Plus,
  CreditCard, Clock, UserPlus, Send, PhoneCall, CalendarDays,
  FileCheck, DollarSign, Award, Paperclip, StickyNote, Star, MessageCircle, File, Activity
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Lead } from "@/lib/types";
import NotesModalNew from "@/LeadsModal/NotesModalNew";
import CallModal from "@/LeadsModal/CallModal";
import ActivityModal from "@/LeadsModal/ActivityModal";
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
  

  // Get tenant ID with fallback
  const tenantId = lead?.tenantId || tenant?.id;

  // Fetch real activities from API
  const { data: activitiesData, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/leads/${lead?.id}/activities`],
    queryFn: async () => {
      if (!tenantId || !lead?.id) return null;
      const response = await apiRequest("GET", `/api/tenants/${tenantId}/leads/${lead.id}/activities`);
      return await response.json();
    },
    enabled: !!lead?.id && !!tenantId && open, // Only fetch when lead is available and modal is open
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch real notes from API
  const { data: notesData, isLoading: notesLoading, refetch: refetchNotes } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/leads/${lead?.id}/notes`],
    queryFn: async () => {
      if (!tenantId || !lead?.id) return null;
      const response = await apiRequest("GET", `/api/tenants/${tenantId}/leads/${lead.id}/notes`);
      return await response.json();
    },
    enabled: !!lead?.id && !!tenantId && open, // Only fetch when lead is available and modal is open
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch real emails from API
  const { data: emailsData, isLoading: emailsLoading, refetch: refetchEmails } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/leads/${lead?.id}/emails`],
    queryFn: async () => {
      if (!tenantId || !lead?.id) return null;
      const response = await apiRequest("GET", `/api/tenants/${tenantId}/leads/${lead.id}/emails`);
      return await response.json();
    },
    enabled: !!lead?.id && !!tenantId && open, // Only fetch when lead is available and modal is open
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch real call logs from API
  const { data: callsData, isLoading: callsLoading, refetch: refetchCalls } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/leads/${lead?.id}/calls`],
    queryFn: async () => {
      if (!tenantId || !lead?.id) return null;
      const response = await apiRequest("GET", `/api/tenants/${tenantId}/leads/${lead.id}/calls`);
      return await response.json();
    },
    enabled: !!lead?.id && !!tenantId && open, // Only fetch when lead is available and modal is open
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch WhatsApp messages from API
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/leads/${lead?.id}/whatsapp-messages`],
    queryFn: async () => {
      if (!tenantId || !lead?.id) return null;
      const response = await apiRequest("GET", `/api/tenants/${tenantId}/leads/${lead.id}/whatsapp-messages`);
      return await response.json();
    },
    enabled: !!lead?.id && !!tenantId && open, // Only fetch when lead is available and modal is open
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Force refetch when modal opens
  useEffect(() => {
    if (open && lead?.id && tenantId) {
      // Invalidate all queries to force fresh fetch
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenantId}/leads/${lead.id}/activities`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenantId}/leads/${lead.id}/notes`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenantId}/leads/${lead.id}/emails`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenantId}/leads/${lead.id}/calls`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenantId}/leads/${lead.id}/whatsapp-messages`],
      });
    }
  }, [open, lead?.id, tenantId, queryClient]);

  // Extract data from API responses
  const activities = React.useMemo(() => {
    if (!activitiesData) return [];
    console.log("🔍 Activities Data:", activitiesData);
    if (activitiesData?.success && (activitiesData as any)?.activities) {
      const result = (activitiesData as any).activities;
      console.log("✅ Extracted activities:", result);
      return result;
    }
    if (Array.isArray(activitiesData)) {
      console.log("✅ Activities is array:", activitiesData);
      return activitiesData;
    }
    console.log("⚠️ No activities found");
    return [];
  }, [activitiesData]);

  const notes = React.useMemo(() => {
    if (!notesData) return [];
    console.log("🔍 Notes Data:", notesData);
    if (notesData?.success && (notesData as any)?.notes) {
      const result = (notesData as any).notes;
      console.log("✅ Extracted notes:", result);
      return result;
    }
    if (Array.isArray(notesData)) {
      console.log("✅ Notes is array:", notesData);
      return notesData;
    }
    console.log("⚠️ No notes found");
    return [];
  }, [notesData]);

  const emailsFromApi = React.useMemo(() => {
    if (!emailsData) return [];
    console.log("🔍 Emails Data:", emailsData);
    if (emailsData?.success && (emailsData as any)?.emails) {
      const result = (emailsData as any).emails;
      console.log("✅ Extracted emails:", result);
      return result;
    }
    if (Array.isArray(emailsData)) {
      console.log("✅ Emails is array:", emailsData);
      return emailsData;
    }
    console.log("⚠️ No emails found");
    return [];
  }, [emailsData]);

  const callsFromApi = React.useMemo(() => {
    if (!callsData) return [];
    console.log("🔍 Calls Data:", callsData);
    if (callsData?.success && (callsData as any)?.calls) {
      const result = (callsData as any).calls;
      console.log("✅ Extracted calls:", result);
      return result;
    }
    if (Array.isArray(callsData)) {
      console.log("✅ Calls is array:", callsData);
      return callsData;
    }
    console.log("⚠️ No calls found");
    return [];
  }, [callsData]);

  const messages = React.useMemo(() => {
    if (!messagesData) return [];
    if (Array.isArray(messagesData)) {
      return messagesData;
    }
    if ((messagesData as any)?.messages) {
      return (messagesData as any).messages;
    }
    if ((messagesData as any)?.data) {
      return (messagesData as any).data;
    }
    return [];
  }, [messagesData]);
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
      const finalTenantId = lead.tenantId || tenant?.id;
      const activityPayload = {
        ...activityData,
        leadId: lead.id,
        tenantId: finalTenantId,
        userId: user.id
      };
      
      console.log("🔥 Frontend - Sending activity data:", activityPayload);
      return await apiRequest("POST", `/api/tenants/${finalTenantId}/leads/${lead.id}/activities`, activityPayload);
    },
    onSuccess: () => {
      // Invalidate and refetch activities
      const finalTenantId = lead?.tenantId || tenant?.id;
      queryClient.invalidateQueries({ 
        queryKey: [`/api/tenants/${finalTenantId}/leads/${lead?.id}/activities`] 
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
      const finalTenantId = lead.tenantId || tenant?.id;
      const notePayload = {
        ...noteData,
        leadId: lead.id,
        tenantId: finalTenantId,
        userId: user.id
      };
      
      console.log("🔥 Frontend - Sending note data:", notePayload);
      return await apiRequest("POST", `/api/tenants/${finalTenantId}/leads/${lead.id}/notes`, notePayload);
    },
    onSuccess: () => {
      // Invalidate and refetch notes
      const finalTenantId = lead?.tenantId || tenant?.id;
      queryClient.invalidateQueries({ 
        queryKey: [`/api/tenants/${finalTenantId}/leads/${lead?.id}/notes`] 
      });
      refetchNotes();
      // Close modal on success
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error("❌ Failed to create note:", error);
    },
  });

  // Create email mutation
  const createEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      if (!lead?.id || !user?.id || !(lead?.tenantId || tenant?.id)) {
        throw new Error("Missing required lead ID, user ID, or tenant ID");
      }

      const finalTenantId = lead.tenantId || tenant?.id;
      const emailPayload = {
        ...emailData,
        leadId: lead.id,
        tenantId: finalTenantId,
        userId: user.id,
      };

      return apiRequest(
        "POST",
        `/api/tenants/${finalTenantId}/leads/${lead.id}/emails`,
        emailPayload
      );
    },
    onSuccess: () => {
      const finalTenantId = lead?.tenantId || tenant?.id;
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${finalTenantId}/leads/${lead?.id}/emails`],
      });
      refetchEmails();
      setIsModalOpen(false);
      setEditableItem(null);
    },
    onError: (error) => {
      console.error("❌ Failed to create email:", error);
    },
  });

  const handleEmailSave = (data: any, mode: string) => {
    createEmailMutation.mutate(data);
  };

  // Create call mutation
  const createCallMutation = useMutation({
    mutationFn: async (callData: any) => {
      if (!lead?.id || !user?.id || !(lead?.tenantId || tenant?.id)) {
        throw new Error("Missing required lead ID, user ID, or tenant ID");
      }

      const finalTenantId = lead.tenantId || tenant?.id;
      const callPayload = {
        ...callData,
        leadId: lead.id,
        tenantId: finalTenantId,
        userId: user.id,
      };

      return apiRequest(
        "POST",
        `/api/tenants/${finalTenantId}/leads/${lead.id}/calls`,
        callPayload
      );
    },
    onSuccess: () => {
      const finalTenantId = lead?.tenantId || tenant?.id;
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${finalTenantId}/leads/${lead?.id}/calls`],
      });
      refetchCalls();
      setIsModalOpen(false);
      setEditableItem(null);
    },
    onError: (error) => {
      console.error("❌ Failed to create call:", error);
    },
  });

  const handleCallSave = (data: any, mode: string) => {
    createCallMutation.mutate(data);
  };

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

  // Save Item (Add or Edit)
  const handleSaveItem = (item: any, mode: string) => {
    // Handle activity creation via API
    if (tab === "activity") {
      console.log("🔍 Creating activity with data:", item);
      createActivityMutation.mutate(item);
      return;
    }

    // Handle note creation via API
    if (tab === "notes") {
      console.log("🔍 Creating note with data:", item);
      createNoteMutation.mutate(item);
      return;
    }
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
          onClose={() => {
            setIsModalOpen(false);
            setEditableItem(null);
          }}
          onSave={handleCallSave}
          editableCall={editableItem}
          leadId={lead?.id || 0}
          isLoading={createCallMutation.isPending}
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
          onClose={() => {
            setIsModalOpen(false);
            setEditableItem(null);
          }}
          onSave={handleEmailSave}
          editableEmail={editableItem}
          leadEmail={lead?.email}
          isLoading={createEmailMutation.isPending}
        />
      );
    }
  };

  // Get List Component based on active tab
  const getListComponent = () => {
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

    // Show activities data - matching customer details format
    if (tab === "activity") {
      if (activities.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No activities recorded for this lead yet</p>
            <p className="text-sm mt-1">
              Click "Add Activity" to create your first activity
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {activities.map((activity: any, index: number) => {
            const ActivityIcon = getActivityIcon(activity.activityType);
            const isCompleted = activity.activityStatus === 1;

            return (
              <div key={activity.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-100 border-2 border-green-200"
                        : "bg-orange-100 border-2 border-orange-200"
                    }`}
                  >
                    <ActivityIcon
                      className={`w-5 h-5 ${
                        isCompleted ? "text-green-600" : "text-orange-600"
                      }`}
                    />
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                <div 
                  className={`flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${
                    activity.activityTableId && activity.activityTableName
                      ? "cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                      : ""
                  }`}
                  onClick={() => {
                    if (activity.activityTableId && activity.activityTableName) {
                      setSelectedActivityTable({
                        tableName: activity.activityTableName,
                        tableId: activity.activityTableId,
                      });
                      setActivityPopupOpen(true);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getActivityStatusColor(activity.activityStatus)}`}
                      >
                        {getActivityStatusLabel(activity.activityStatus)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {getActivityTypeLabel(activity.activityType)}
                      </span>
                      {activity.activityTableId && activity.activityTableName && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          View Details
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {new Date(activity.activityDate).toLocaleDateString()}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(activity.activityDate).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2">
                    {activity.activityTitle}
                  </h4>

                  {activity.activityDescription && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {activity.activityDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Show notes data with timeline style - matching customer details format
    if (tab === "notes") {
      if (notes.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notes added for this lead yet</p>
            <p className="text-sm mt-1">
              Click "Add Note" to create your first note
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {notes.map((note: any, index: number) => (
            <div key={note.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 border-2 border-blue-200">
                  <StickyNote className="w-5 h-5 text-blue-600" />
                </div>
                {index < notes.length - 1 && (
                  <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                )}
              </div>

              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {note.noteTitle || note.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${
                          note.noteType === "important"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }`}
                      >
                        {note.noteType || "general"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">
                      {new Date(note.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {note.noteContent || note.details ? (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {note.noteContent || note.details}
                    </p>
                  </div>
                ) : null}

                {note.attachment && (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Attachment:</span>
                      </div>
                      {(() => {
                        const attachmentPath = note.attachment;
                        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachmentPath);
                        const fileName = attachmentPath.split('/').pop() || attachmentPath;
                        const attachmentUrl = attachmentPath.startsWith('http') 
                          ? attachmentPath 
                          : attachmentPath.startsWith('/') 
                            ? `${window.location.origin}${attachmentPath}`
                            : `${window.location.origin}/${attachmentPath}`;
                        
                        return (
                          <div className="ml-6">
                            {isImage ? (
                              <div className="space-y-2">
                                <img
                                  src={attachmentUrl}
                                  alt={fileName}
                                  className="max-w-xs max-h-48 rounded-lg border border-gray-200 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(attachmentUrl, '_blank')}
                                  onError={(e) => {
                                    // If image fails to load, show file link instead
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                      parent.innerHTML = `
                                        <a href="${attachmentUrl}" target="_blank" rel="noopener noreferrer" class="text-sm text-blue-600 hover:underline">
                                          ${fileName}
                                        </a>
                                      `;
                                    }
                                  }}
                                />
                                <a
                                  href={attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline block"
                                >
                                  {fileName}
                                </a>
                              </div>
                            ) : (
                              <a
                                href={attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <File className="w-4 h-4" />
                                {fileName}
                              </a>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {note.reminder && (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">
                        Reminder Set
                      </span>
                    </div>
                    {note.reminderDate && (
                      <p className="text-xs text-gray-600 ml-6">
                        📅 {new Date(note.reminderDate).toLocaleDateString()} at{" "}
                        {new Date(note.reminderDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 ml-6">
                      🎯{" "}
                      {note.reminderAuto
                        ? "For you"
                        : `For ${note.reminderEmail || "someone else"}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (tab === "call") {
      if (callsFromApi.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <PhoneCall className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No call logs recorded for this lead yet</p>
            <p className="text-sm mt-1">
              Click "Add Call" to log your first call
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {callsFromApi.map((callLog: any, index: number) => (
            <div key={callLog.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 border-2 border-blue-200">
                  <PhoneCall className="w-5 h-5 text-blue-600" />
                </div>
                {index < callsFromApi.length - 1 && (
                  <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                )}
              </div>

              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {callLog.callType === "outbound" ? "Outbound Call" : "Inbound Call"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(callLog.createdAt || callLog.callDate).toLocaleDateString()}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200 capitalize">
                        {callLog.status || "completed"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">
                      {new Date(callLog.createdAt || callLog.callDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {callLog.caller_number && (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Mobile Number :- {callLog.caller_number}
                    </p>
                  </div>
                )}

                {callLog.duration && (
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {callLog.duration}{" "}
                      {callLog.duration === 1 ? "minute" : "minutes"}
                    </span>
                  </div>
                )}

                {callLog.notes && (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {callLog.notes}
                    </p>
                  </div>
                )}
                {callLog.followUpRequired && (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Follow Up :- {callLog.followUpDateTime}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (tab === "email") {
      if (emailsFromApi.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No emails sent to this lead yet</p>
            <p className="text-sm mt-1">
              Click "Send Email" to send your first email
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {emailsFromApi.map((email: any, index: number) => {
            const isDelivered = email.status === "sent";

            return (
              <div key={email.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isDelivered
                        ? "bg-green-100 border-green-200"
                        : "bg-orange-100 border-orange-200"
                    }`}
                  >
                    <Mail
                      className={`w-5 h-5 ${
                        isDelivered ? "text-green-600" : "text-orange-600"
                      }`}
                    />
                  </div>
                  {index < emailsFromApi.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Send
                        className={`w-4 h-4 ${
                          isDelivered ? "text-green-600" : "text-orange-600"
                        }`}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {email.subject}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            To: {email.email}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              isDelivered
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-orange-100 text-orange-800 border-orange-200"
                            }`}
                          >
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
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {email.body && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {email.body}
                      </p>
                    </div>
                  )}
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      statusColor === "green"
                        ? "bg-green-100 border-2 border-green-200"
                        : statusColor === "red"
                        ? "bg-red-100 border-2 border-red-200"
                        : "bg-gray-100 border-2 border-gray-200"
                    }`}
                  >
                    <MessageCircle
                      className={`w-5 h-5 ${
                        statusColor === "green"
                          ? "text-green-600"
                          : statusColor === "red"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    />
                  </div>
                  {index < messages.length - 1 && (
                    <div className="w-px h-8 border-l-2 border-dashed border-gray-300 mt-2"></div>
                  )}
                </div>

                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Send
                        className={`w-4 h-4 ${
                          statusColor === "green"
                            ? "text-green-600"
                            : statusColor === "red"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {isText ? "Text Message" : `Media Message (${msg.mediaType})`}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            To: {msg.recipientNumber}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${
                              statusColor === "green"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : statusColor === "red"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
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
          w-full sm:w-[800px] md:w-[1000px] lg:w-[1300px] xl:w-[1400px]`}
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
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <div className="flex items-center justify-between p-4">
                <div className="flex overflow-x-auto">
                  {["notes", "activity", "email", "call", "messages"].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setTab(item);
                      // Refetch data when tab is clicked
                      if (item === "notes") refetchNotes();
                      if (item === "activity") refetchActivities();
                      if (item === "email") refetchEmails();
                      if (item === "call") refetchCalls();
                      if (item === "messages") refetchMessages();
                    }}
                    className={`px-4 py-2 capitalize whitespace-nowrap text-sm md:text-base ${
                      tab === item
                        ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {item}
                  </button>
                ))}
                </div>

                <div className="flex items-center gap-2">
                  {tab === "notes" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditableItem(null);
                        setIsModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-add-note"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Note
                    </Button>
                  )}
                  {tab === "activity" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditableItem(null);
                        setIsModalOpen(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-add-activity"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Activity
                    </Button>
                  )}
                  {tab === "call" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditableItem(null);
                        setIsModalOpen(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                      data-testid="button-add-call"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Call
                    </Button>
                  )}
                  {tab === "email" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditableItem(null);
                        setIsModalOpen(true);
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                      data-testid="button-add-email"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Send Email
                    </Button>
                  )}
                  {tab === "messages" && (
                    <Button
                      size="sm"
                      onClick={() => setIsWhatsAppDialogOpen(true)}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-send-whatsapp"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Send WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {getListComponent()}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {getModalComponent()}

      {/* WhatsApp Message Dialog */}
      {lead && (
        <WhatsAppMessageDialog
          open={isWhatsAppDialogOpen}
          onOpenChange={setIsWhatsAppDialogOpen}
          recipientType="lead"
          recipientId={lead.id}
          recipientName={lead.name || `${lead.firstName} ${lead.lastName}`}
          recipientPhone={lead.mobile || lead.phone || ""}
          tenantId={tenantId}
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
        tenantId={tenantId}
      />
    </>
  );
}
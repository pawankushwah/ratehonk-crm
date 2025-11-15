import React, { useState, useEffect } from "react";
import { X, Loader2, Mail, Phone, FileText, Calendar, Clock, User, Download, ExternalLink, MessageCircle, Image, Video, Music, File, StickyNote, Paperclip } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActivityDataPopupProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string | null;
  tableId: number | null;
  tenantId?: number;
}

export function ActivityDataPopup({
  isOpen,
  onClose,
  tableName,
  tableId,
  tenantId,
}: ActivityDataPopupProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tableName && tableId) {
      fetchData();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, tableName, tableId, tenantId]);

  const fetchData = async () => {
    if (!tableName || !tableId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tableName,
        tableId: tableId.toString(),
      });
      if (tenantId) {
        params.append("tenantId", tenantId.toString());
      }

      const response = await apiRequest(
        "GET",
        `/api/activity-table-data?${params.toString()}`
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Failed to fetch data");
      }
    } catch (err: any) {
      console.error("Error fetching activity data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return String(dateString);
    }
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let color = "";

    if (statusLower.includes("sent") || statusLower.includes("completed") || statusLower === "delivered") {
      variant = "default";
      color = "bg-green-100 text-green-800 border-green-200";
    } else if (statusLower.includes("failed") || statusLower === "missed") {
      variant = "destructive";
      color = "bg-red-100 text-red-800 border-red-200";
    } else if (statusLower === "pending" || statusLower === "opened") {
      variant = "secondary";
      color = "bg-yellow-100 text-yellow-800 border-yellow-200";
    }

    return (
      <Badge className={color}>
        {status}
      </Badge>
    );
  };

  const renderEmailDetails = () => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        {/* Email Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {data.subject || "No Subject"}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(data.status)}
                <span className="text-sm text-gray-500">
                  {formatDate(data.sent_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Email Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                To
              </label>
              <div className="text-sm text-gray-900 mt-1">{data.email || "N/A"}</div>
            </div>
            {data.from_email && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  From
                </label>
                <div className="text-sm text-gray-900 mt-1">{data.from_email}</div>
              </div>
            )}
            {data.delivered_at && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Delivered
                </label>
                <div className="text-sm text-gray-900 mt-1">{formatDate(data.delivered_at)}</div>
              </div>
            )}
            {data.opened_at && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Opened
                </label>
                <div className="text-sm text-gray-900 mt-1">{formatDate(data.opened_at)}</div>
              </div>
            )}
            {data.clicked_at && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Clicked
                </label>
                <div className="text-sm text-gray-900 mt-1">{formatDate(data.clicked_at)}</div>
              </div>
            )}
          </div>

          {/* Email Body */}
          {data.body && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Message
              </label>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap break-words">
                {data.body}
              </div>
            </div>
          )}

          {/* Attachments */}
          {data.attachments && (() => {
            let attachmentsArray: Array<{filename: string; path: string; mimetype?: string; size?: number}> = [];
            try {
              if (typeof data.attachments === 'string') {
                attachmentsArray = JSON.parse(data.attachments);
              } else if (Array.isArray(data.attachments)) {
                attachmentsArray = data.attachments;
              }
            } catch (e) {
              console.error("Error parsing attachments:", e);
            }

            if (attachmentsArray.length > 0) {
              const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
              
              return (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 block">
                    Attachments ({attachmentsArray.length})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attachmentsArray.map((attachment: any, index: number) => {
                      const filename = attachment.filename || attachment.name || `attachment-${index + 1}`;
                      const path = attachment.path || attachment.url || attachment.href;
                      const isImage = imageExtensions.some(ext => 
                        filename.toLowerCase().endsWith(ext)
                      ) || (attachment.mimetype && attachment.mimetype.startsWith('image/'));

                      return (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                          {isImage && path ? (
                            <div className="relative">
                              <img
                                src={path}
                                alt={filename}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  // If image fails to load, show file icon instead
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const parent = (e.target as HTMLImageElement).parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-48 bg-gray-100 flex items-center justify-center">
                                        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                        </svg>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                              <FileText className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          <div className="p-3">
                            <p className="text-sm font-medium text-gray-900 truncate" title={filename}>
                              {filename}
                            </p>
                            {attachment.size && (
                              <p className="text-xs text-gray-500 mt-1">
                                {(attachment.size / 1024).toFixed(2)} KB
                              </p>
                            )}
                            {path && (
                              <a
                                href={path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Error Message */}
          {data.error_message && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {data.error_message}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCallLogDetails = () => {
    if (!data) return null;

    // Debug: Log the actual data structure
    console.log("📞 Call log data:", data);

    // Determine call direction from call_type or direction field
    const callDirection = data.direction || 
                         (data.call_type === "incoming" ? "inbound" : 
                          data.call_type === "outgoing" ? "outbound" : 
                          data.call_type === "inbound" ? "inbound" : 
                          data.call_type === "outbound" ? "outbound" : 
                          "outbound");
    const isIncoming = callDirection === "inbound" || callDirection === "incoming" || data.call_type === "incoming";
    
    // Get phone number from various possible fields
    const phoneNumber = data.caller_number || data.phoneNumber || data.callee_number || "N/A";

    return (
      <div className="space-y-6">
        {/* Call Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {isIncoming ? "Incoming" : "Outgoing"} Call
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(data.status)}
                {data.duration && (
                  <span className="text-sm text-gray-500">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {formatDuration(data.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Call Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            {/* Phone Number - show caller_number, phoneNumber, or callee_number */}
            {phoneNumber && phoneNumber !== "N/A" && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Phone Number
                </label>
                <div className="text-sm text-gray-900 mt-1">
                  {data.caller_name ? `${data.caller_name} ` : ""}
                  {phoneNumber}
                </div>
              </div>
            )}
            {data.caller_number && data.callee_number && data.caller_number !== data.callee_number && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {isIncoming ? "Recipient Number" : "Caller Number"}
                </label>
                <div className="text-sm text-gray-900 mt-1">
                  {data.callee_name ? `${data.callee_name} ` : ""}
                  {data.callee_number}
                </div>
              </div>
            )}
            {data.call_type && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Call Type
                </label>
                <div className="text-sm text-gray-900 mt-1 capitalize">
                  {data.call_type === "incoming" ? "Incoming" : 
                   data.call_type === "outgoing" ? "Outgoing" : 
                   data.call_type}
                </div>
              </div>
            )}
            {data.direction && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Direction
                </label>
                <div className="text-sm text-gray-900 mt-1 capitalize">
                  {data.direction === "inbound" ? "Incoming" : 
                   data.direction === "outbound" ? "Outgoing" : 
                   data.direction}
                </div>
              </div>
            )}
            {data.started_at && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Started
                </label>
                <div className="text-sm text-gray-900 mt-1">{formatDate(data.started_at)}</div>
              </div>
            )}
            {data.ended_at && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Ended
                </label>
                <div className="text-sm text-gray-900 mt-1">{formatDate(data.ended_at)}</div>
              </div>
            )}
            {data.answer_time && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Answered
                </label>
                <div className="text-sm text-gray-900 mt-1">{formatDate(data.answer_time)}</div>
              </div>
            )}
            {data.recording_duration && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recording Duration
                </label>
                <div className="text-sm text-gray-900 mt-1">{formatDuration(data.recording_duration)}</div>
              </div>
            )}
            {/* Show follow-up fields if they exist */}
            {data.followUpDateTime && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Follow Up Date
                </label>
                <div className="text-sm text-gray-900 mt-1">{formatDate(data.followUpDateTime)}</div>
              </div>
            )}
            {data.followUpRequired !== null && data.followUpRequired !== undefined && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Follow Up Required
                </label>
                <div className="text-sm text-gray-900 mt-1">
                  {data.followUpRequired ? "Yes" : "No"}
                </div>
              </div>
            )}
          </div>

          {/* Recording URL */}
          {data.recording_url && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Call Recording
              </label>
              <a
                href={data.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
                Listen to Recording
              </a>
            </div>
          )}

          {/* Notes */}
          {data.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Notes
              </label>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap break-words">
                {data.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWhatsAppMessageDetails = () => {
    if (!data) return null;

    const isMedia = data.message_type === "media";
    const mediaIcon = data.media_type === "image" ? Image :
                     data.media_type === "video" ? Video :
                     data.media_type === "audio" ? Music : File;

    return (
      <div className="space-y-6">
        {/* WhatsApp Message Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                WhatsApp Message
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(data.status)}
                <span className="text-sm text-gray-500">
                  {formatDate(data.sent_at)}
                </span>
                {data.message_type && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 capitalize">
                    {data.message_type}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Message Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            {data.recipient_number && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  To
                </label>
                <div className="text-sm text-gray-900 mt-1">
                  {data.recipient_name ? `${data.recipient_name} ` : ""}
                  {data.recipient_number}
                </div>
              </div>
            )}
            {data.delivered_at && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Delivered
                </label>
                <div className="text-sm text-gray-900 mt-1">{formatDate(data.delivered_at)}</div>
              </div>
            )}
            {data.read_at && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Read
                </label>
                <div className="text-sm text-gray-900 mt-1">{formatDate(data.read_at)}</div>
              </div>
            )}
            {data.external_message_id && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Message ID
                </label>
                <div className="text-sm text-gray-900 mt-1 font-mono text-xs">{data.external_message_id}</div>
              </div>
            )}
          </div>

          {/* Text Message Content */}
          {data.message_type === "text" && data.text_content && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Message
              </label>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap break-words">
                {data.text_content}
              </div>
            </div>
          )}

          {/* Media Message Content */}
          {isMedia && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 block">
                Media
              </label>
              <div className="space-y-4">
                {data.media_type && (
                  <div className="flex items-center gap-2">
                    {React.createElement(mediaIcon, { className: "w-5 h-5 text-gray-600" })}
                    <span className="text-sm text-gray-900 capitalize">{data.media_type}</span>
                  </div>
                )}
                {data.media_url && (
                  <div>
                    {data.media_type === "image" ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={data.media_url}
                          alt="WhatsApp media"
                          className="w-full max-h-96 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-48 bg-gray-100 flex items-center justify-center">
                                  <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <a
                        href={data.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4" />
                        Download {data.media_type}
                      </a>
                    )}
                  </div>
                )}
                {data.media_caption && (
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap break-words">
                    <strong>Caption:</strong> {data.media_caption}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {data.error_message && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {data.error_message}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCustomerNoteDetails = () => {
    if (!data) return null;

    const attachmentPath = data.attachment;
    const isImage = attachmentPath && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachmentPath);
    const fileName = attachmentPath ? (attachmentPath.split('/').pop() || attachmentPath) : null;
    const attachmentUrl = attachmentPath 
      ? (attachmentPath.startsWith('http') 
          ? attachmentPath 
          : attachmentPath.startsWith('/') 
            ? `${window.location.origin}${attachmentPath}`
            : `${window.location.origin}/${attachmentPath}`)
      : null;

    return (
      <div className="space-y-6">
        {/* Note Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <StickyNote className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {data.title || data.noteTitle || "Untitled Note"}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {data.note_type && (
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200 capitalize">
                    {data.note_type}
                  </Badge>
                )}
                <span className="text-sm text-gray-500">
                  {formatDate(data.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Note Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            {data.details || data.noteContent ? (
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                  Note Content
                </label>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {data.details || data.noteContent}
                </div>
              </div>
            ) : null}
            {data.reminder && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Reminder
                </label>
                <div className="text-sm text-gray-900 mt-1">
                  {data.reminderDate ? formatDate(data.reminderDate) : "Set"}
                </div>
              </div>
            )}
            {data.reminder_email && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Reminder Email
                </label>
                <div className="text-sm text-gray-900 mt-1">{data.reminder_email}</div>
              </div>
            )}
          </div>

          {/* Attachment */}
          {attachmentPath && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 block">
                Attachment
              </label>
              <div className="space-y-2">
                {isImage ? (
                  <div className="space-y-2">
                    <img
                      src={attachmentUrl || ''}
                      alt={fileName || 'Attachment'}
                      className="max-w-xs max-h-48 rounded-lg border border-gray-200 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => attachmentUrl && window.open(attachmentUrl, '_blank')}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent && attachmentUrl) {
                          parent.innerHTML = `
                            <a href="${attachmentUrl}" target="_blank" rel="noopener noreferrer" class="text-sm text-blue-600 hover:underline">
                              ${fileName}
                            </a>
                          `;
                        }
                      }}
                    />
                    {attachmentUrl && (
                      <a
                        href={attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4" />
                        {fileName}
                      </a>
                    )}
                  </div>
                ) : (
                  attachmentUrl && (
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <File className="w-4 h-4" />
                      {fileName}
                    </a>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGenericDetails = () => {
    if (!data) return null;

    const formatKey = (key: string): string => {
      return key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    };

    const formatValue = (key: string, value: any): string => {
      if (value === null || value === undefined) return "N/A";
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (typeof value === "string" && (value.includes("T") || value.includes("Z"))) {
        try {
          return new Date(value).toLocaleString();
        } catch {
          return String(value);
        }
      }
      if (typeof value === "object") return JSON.stringify(value, null, 2);
      return String(value);
    };

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Record Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data).map(([key, value]) => {
              if (
                key === "password" ||
                key === "token" ||
                key.startsWith("_")
              ) {
                return null;
              }

              return (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {formatKey(key)}
                  </label>
                  <div className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200 break-words">
                    {formatValue(key, value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const getTitle = () => {
    if (tableName === "email_logs") return "Email Details";
    if (tableName === "call_logs") return "Call Details";
    if (tableName === "whatsapp_messages") return "WhatsApp Message Details";
    if (tableName === "customer_files") return "File Details";
    if (tableName === "customer_notes") return "Note Details";
    return tableName ? `${tableName.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} Details` : "Activity Details";
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getTitle()}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading data...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

              {!loading && !error && data && (
                <>
                  {tableName === "email_logs" && renderEmailDetails()}
                  {tableName === "call_logs" && renderCallLogDetails()}
                  {tableName === "whatsapp_messages" && renderWhatsAppMessageDetails()}
                  {tableName === "customer_notes" && renderCustomerNoteDetails()}
                  {tableName !== "email_logs" && tableName !== "call_logs" && tableName !== "whatsapp_messages" && tableName !== "customer_notes" && renderGenericDetails()}
                </>
              )}

          {!loading && !error && !data && (
            <div className="text-center py-8 text-gray-500">
              No data available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

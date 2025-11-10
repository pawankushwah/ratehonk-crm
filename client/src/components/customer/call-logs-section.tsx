import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Calendar, FileAudio, Pencil, Check, X } from "lucide-react";
import { format, formatDuration, intervalToDuration } from "date-fns";

interface CallLog {
  id: number;
  zoomCallId?: string;
  callType: string;
  direction?: string;
  callerNumber?: string;
  calleeNumber?: string;
  callerName?: string;
  calleeName?: string;
  status: string;
  duration?: number;
  recordingUrl?: string;
  recordingDuration?: number;
  startedAt: string;
  endedAt?: string;
  answerTime?: string;
  notes?: string;
  zoomAccountId?: number;
  zoomAccountLabel?: string;
}

interface CallLogsSectionProps {
  customerId: number;
}

export function CallLogsSection({ customerId }: CallLogsSectionProps) {
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const { data: callLogs, isLoading } = useQuery<CallLog[]>({
    queryKey: ["/api/zoom/call-logs/customer", customerId],
    enabled: !!customerId,
  });

  const getCallIcon = (callLog: CallLog) => {
    if (callLog.status === "missed") {
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    }
    if (callLog.direction === "inbound" || callLog.callType === "incoming") {
      return <PhoneIncoming className="h-4 w-4 text-green-600" />;
    }
    return <PhoneOutgoing className="h-4 w-4 text-blue-600" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      completed: { variant: "default", label: "Completed" },
      missed: { variant: "destructive", label: "Missed" },
      voicemail: { variant: "secondary", label: "Voicemail" },
      "no-answer": { variant: "outline", label: "No Answer" },
      busy: { variant: "outline", label: "Busy" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCallDuration = (seconds?: number) => {
    if (!seconds) return "0s";
    if (seconds < 60) return `${seconds}s`;
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    return formatDuration(duration, { format: ["hours", "minutes", "seconds"] });
  };

  const handleSaveNotes = async (callLogId: number) => {
    try {
      await fetch(`/api/zoom/call-logs/${callLogId}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ notes: notesValue }),
      });
      setEditingNotes(null);
      // Refetch call logs
      // queryClient.invalidateQueries(["/api/zoom/call-logs/customer", customerId]);
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading call logs...</div>
        </CardContent>
      </Card>
    );
  }

  if (!callLogs || callLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No call history available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Call History ({callLogs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {callLogs.map((callLog) => (
            <div
              key={callLog.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              data-testid={`call-log-${callLog.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getCallIcon(callLog)}</div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {callLog.direction === "inbound" || callLog.callType === "incoming"
                          ? callLog.callerName || callLog.callerNumber
                          : callLog.calleeName || callLog.calleeNumber}
                      </span>
                      {getStatusBadge(callLog.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(callLog.startedAt), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(callLog.startedAt), "h:mm a")}
                      </div>
                      {callLog.duration !== undefined && callLog.duration > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Duration:</span>
                          {formatCallDuration(callLog.duration)}
                        </div>
                      )}
                      {callLog.zoomAccountLabel && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-cyan-600" />
                          <span className="text-cyan-600 font-medium">{callLog.zoomAccountLabel}</span>
                        </div>
                      )}
                    </div>

                    {callLog.recordingUrl && (
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4 text-blue-600" />
                        <a
                          href={callLog.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Recording
                        </a>
                        {callLog.recordingDuration && (
                          <span className="text-sm text-gray-500">
                            ({formatCallDuration(callLog.recordingDuration)})
                          </span>
                        )}
                      </div>
                    )}

                    {editingNotes === callLog.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Add notes about this call..."
                          rows={3}
                          data-testid={`textarea-call-notes-${callLog.id}`}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveNotes(callLog.id)}
                            data-testid={`button-save-notes-${callLog.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingNotes(null);
                              setNotesValue("");
                            }}
                            data-testid={`button-cancel-notes-${callLog.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : callLog.notes ? (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-gray-700">{callLog.notes}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingNotes(callLog.id);
                              setNotesValue(callLog.notes || "");
                            }}
                            data-testid={`button-edit-notes-${callLog.id}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingNotes(callLog.id);
                          setNotesValue("");
                        }}
                        data-testid={`button-add-notes-${callLog.id}`}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Add Notes
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

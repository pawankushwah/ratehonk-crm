import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  PhoneCall,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  editableCall?: any;
}

const CallModal = ({ isOpen, onClose, leadId, editableCall }: CallModalProps) => {
  const [detail, setDetail] = useState("");
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [outcome, setOutcome] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { user, tenant } = useAuth();
  const queryClient = useQueryClient();

  // ✅ Populate fields if editing a call
  useEffect(() => {
    if (editableCall) {
      setDetail(editableCall.detail || "");
      setType(editableCall.type || "");
      setDuration(editableCall.duration || "");
      setPhoneNumber(editableCall.phoneNumber || "");
      setOutcome(editableCall.outcome || "");
      setFollowUpRequired(editableCall.followUpRequired || false);
      setFollowUpDate(editableCall.followUpDate || "");
    } else {
      setDetail("");
      setType("");
      setDuration("");
      setPhoneNumber("");
      setOutcome("");
      setFollowUpRequired(false);
      setFollowUpDate("");
    }
  }, [editableCall]);

  // Create call log mutation
  const saveCallMutation = useMutation({
    mutationFn: async (callData: {
      callType: string;
      status: string;
      duration?: number;
      notes: string;
    }) => {
      const url = `/api/tenants/${tenant?.id}/leads/${leadId}/calls`;
      console.log("📞 CallModal: Making API request to:", url);
      console.log("📞 CallModal: Call data:", callData);
      
      return apiRequest("POST", url, callData);
    },
    onSuccess: () => {
      // Invalidate and refetch calls
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/leads/${leadId}/calls`],
      });
      setShowSuccess(true);
      // Clear form
      setDetail("");
      setType("");
      setDuration("");
      setOutcome("");
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    },
  });

  const getCurrentDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!detail.trim() || !type) {
      return;
    }

    // Map form fields to API format
    const callData = {
      callType: type, // inbound/outbound/missed
      status: outcome || 'completed', // Use outcome as status
      duration: duration ? parseInt(duration) : undefined,
      notes: detail.trim(),
    };

    saveCallMutation.mutate(callData);
  };

  const handleFollowUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFollowUpRequired(checked);
    setFollowUpDate(checked ? getCurrentDateTime() : "");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg p-6 relative">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-semibold text-black mb-4">
          {editableCall ? "Edit Call" : "Add Call"}
        </h2>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Call log saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Detail */}
          <div>
            <label className="block text-sm font-medium text-black">Call Notes</label>
            <textarea
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Enter call notes or summary"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-black">Call Type</label>
            <select
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Select Type</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
              <option value="missed">Missed</option>
            </select>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-black">Phone Number</label>
            <input
              type="tel"
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-black">Duration (minutes)</label>
            <input
              type="number"
              min="0"
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Call duration in minutes"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Call Status */}
          <div>
            <label className="block text-sm font-medium text-black">Call Status</label>
            <select
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              <option value="">Select Status</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="no-answer">No Answer</option>
              <option value="voicemail">Left Voicemail</option>
              <option value="busy">Busy</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Follow-up Required */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="followUp"
              className="w-4 h-4"
              checked={followUpRequired}
              onChange={handleFollowUpChange}
            />
            <label htmlFor="followUp" className="text-black text-sm">
              Follow-up Required
            </label>
          </div>

          {followUpRequired && (
            <div>
              <label className="block text-sm font-medium text-black">
                Follow-up Date & Time
              </label>
              <input
                type="datetime-local"
                className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          )}

          {/* Error Message */}
          {saveCallMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                Failed to save call log. Please try again.
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={saveCallMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saveCallMutation.isPending || !detail.trim() || !type}
            >
              {saveCallMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editableCall ? "Update Call" : "Save Call"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CallItemProps {
  call: any;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (call: any) => void;
  onDelete: (id: any) => void;
}

/* ✅ CallItem Component with Edit & Delete */
export const CallItem = ({ call, isOpen, onToggle, onEdit, onDelete }: CallItemProps) => {
  const getCallTypeIcon = (type: string) => {
    switch (type) {
      case 'inbound': return '📞';
      case 'outbound': return '📱';
      case 'missed': return '📵';
      default: return '☎️';
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'completed': return 'text-green-600';
      case 'no-answer': return 'text-red-600';
      case 'voicemail': return 'text-yellow-600';
      case 'busy': return 'text-orange-600';
      case 'missed': return 'text-red-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-md transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-green-100">
            <PhoneCall className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-black text-base flex items-center gap-2">
              <span className="text-lg">{getCallTypeIcon(call.type)}</span>
              {call.type ? call.type.charAt(0).toUpperCase() + call.type.slice(1) : "Unknown Call"}
              {call.duration && <span className="text-sm text-gray-500">({call.duration}min)</span>}
            </h4>
            <p className="text-xs text-gray-500">
              {new Date(call.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-black" />
          ) : (
            <ChevronDown className="w-5 h-5 text-black" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 pl-1 border-t pt-3 space-y-2">
          <p className="text-sm text-black leading-relaxed">{call.detail}</p>
          {call.phoneNumber && (
            <p className="text-sm text-black font-medium">📞 {call.phoneNumber}</p>
          )}
          {call.outcome && (
            <p className={`text-sm font-medium ${getOutcomeColor(call.outcome)}`}>
              ✓ Status: {call.outcome.charAt(0).toUpperCase() + call.outcome.slice(1).replace('-', ' ')}
            </p>
          )}
          {call.followUpRequired && call.followUpDate && (
            <p className="text-sm text-black font-medium">
              📅 Follow-up: {new Date(call.followUpDate).toLocaleString()}
            </p>
          )}
          {/* Edit & Delete Buttons */}
          <div className="flex justify-end gap-0 mt-3">
            <button
              onClick={() => onEdit(call)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-black-700 text-xs"
            >
              <Pencil className="w-4 h-4" /> 
            </button>
            <button
              onClick={() => onDelete(call.id)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg  text-red-700 text-xs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallModal;
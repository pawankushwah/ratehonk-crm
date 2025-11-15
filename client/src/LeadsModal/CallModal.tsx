import React, { useState, useEffect } from "react";
import { X, PhoneCall, Clock, User } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Call Types to match lead call modal
const CALL_TYPES = [
  { value: "incoming", label: "Incoming" },
  { value: "outgoing", label: "Outgoing" },
  { value: "missed", label: "Missed" },
];

// Call Status to match lead call modal
const CALL_STATUS = [
  { value: "completed", label: "Completed" },
  { value: "missed", label: "Missed" },
  { value: "no_answer", label: "No answer" },
  { value: "left_voicemail", label: "Left Voicemail" },
  { value: "busy", label: "Busy" },
  { value: "failed", label: "Failed" },
];

// Validation schema to match database columns and lead form
const callFormSchema = z.object({
  callType: z.string().min(1, "Call type is required"),
  status: z.string().min(1, "Call status is required"),
  phoneNumber: z.string().optional(),
  duration: z.number().min(0, "Duration must be positive").optional(),
  notes: z.string().optional(),
  startedAt: z.string().min(1, "Call date is required"),
  followUpRequired: z.boolean().optional(),
  followUpDateTime: z.string().optional(),
});

type CallFormData = z.infer<typeof callFormSchema>;

export interface CallItem {
  id?: number;
  callType: string;
  status: string;
  phoneNumber?: string;
  duration?: number;
  notes?: string;
  startedAt: string;
  endedAt?: string;
  followUpRequired?: boolean;
  followUpDateTime?: string;
}

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CallFormData, mode: string) => void;
  editableCall?: CallItem;
  leadId?: number;
  isLoading?: boolean;
}

const CallModal: React.FC<CallModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editableCall,
  leadId,
  isLoading = false 
}) => {
  const form = useForm<CallFormData>({
    resolver: zodResolver(callFormSchema),
    defaultValues: {
      callType: "outgoing",
      status: "completed",
      phoneNumber: "",
      duration: 0,
      notes: "",
      startedAt: new Date().toISOString().slice(0, 16),
      followUpRequired: false,
      followUpDateTime: "",
    },
  });

  // Update form when editing
  useEffect(() => {
    if (editableCall) {
      form.reset({
        callType: editableCall.callType || "outgoing",
        status: editableCall.status || "completed",
        phoneNumber: editableCall.phoneNumber || "",
        duration: editableCall.duration || 0,
        notes: editableCall.notes || "",
        startedAt: editableCall.startedAt 
          ? new Date(editableCall.startedAt).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        followUpRequired: editableCall.followUpRequired || false,
        followUpDateTime: editableCall.followUpDateTime || "",
      });
    } else {
      form.reset({
        callType: "outgoing",
        status: "completed",
        phoneNumber: "",
        duration: 0,
        notes: "",
        startedAt: new Date().toISOString().slice(0, 16),
        followUpRequired: false,
        followUpDateTime: "",
      });
    }
  }, [editableCall, form]);

  const onSubmit = (data: CallFormData) => {
    onSave(data, editableCall ? "edit" : "create");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editableCall ? "Edit Lead Call Log" : "Add Lead Call Log"}
              </h2>
              <p className="text-sm text-gray-600">
                Record lead call details and notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Call Type */}
              <FormField
                control={form.control}
                name="callType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">Call Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select call type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CALL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Call Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">Call Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select call status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CALL_STATUS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="Enter phone number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Call Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        placeholder="Enter call duration"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Call Date */}
              <FormField
                control={form.control}
                name="startedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">Call Date & Time *</FormLabel>
                    <FormControl>
                      <input
                        type="datetime-local"
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Call Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">Call Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter call notes, outcomes, and follow-up actions"
                      rows={4}
                      {...field}
                      className="w-full resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Follow-up Required */}
            <FormField
              control={form.control}
              name="followUpRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-follow-up-required"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Follow-up Required
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Follow-up Date & Time - Show only if follow-up is required */}
            {form.watch("followUpRequired") && (
              <FormField
                control={form.control}
                name="followUpDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">Follow-up Date & Time</FormLabel>
                    <FormControl>
                      <input
                        type="datetime-local"
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        data-testid="input-follow-up-datetime"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? "Saving..." : editableCall ? "Update Call Log" : "Save Call Log"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

// Call Item component for displaying call logs
export const CallItem = ({ 
  call, 
  isOpen, 
  onToggle, 
  onEdit, 
  onDelete 
}: {
  call: any;
  isOpen: boolean;
  onToggle: () => void;
  onEdit?: (call: any) => void;
  onDelete?: (id: any) => void;
}) => {
  const getCallTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming': return '📞';
      case 'outgoing': return '📱';
      case 'missed': return '📵';
      default: return '☎️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'no_answer': 
      case 'missed': return 'text-red-600';
      case 'left_voicemail': return 'text-yellow-600';
      case 'busy': return 'text-orange-600';
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
              <span className="text-lg">{getCallTypeIcon(call.callType || call.type)}</span>
              {call.callType || call.type 
                ? (call.callType || call.type).charAt(0).toUpperCase() + (call.callType || call.type).slice(1) 
                : "Unknown Call"}
              {call.duration && <span className="text-sm text-gray-500">({call.duration}min)</span>}
            </h4>
            <p className="text-xs text-gray-500">
              {new Date(call.createdAt || call.startedAt || call.callDate).toLocaleString()}
            </p>
          </div>
        </div>
        <div>
          {isOpen ? (
            <X className="w-5 h-5 text-black" />
          ) : (
            <PhoneCall className="w-5 h-5 text-black" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 pl-1 border-t pt-3 space-y-2">
          {call.notes && (
            <p className="text-sm text-black leading-relaxed">{call.notes}</p>
          )}
          {call.phoneNumber && (
            <p className="text-sm text-black font-medium">📞 {call.phoneNumber}</p>
          )}
          {call.status && (
            <p className={`text-sm font-medium ${getStatusColor(call.status)}`}>
              ✓ Status: {call.status.charAt(0).toUpperCase() + call.status.slice(1).replace('_', ' ')}
            </p>
          )}
          {call.followUpRequired && call.followUpDateTime && (
            <p className="text-sm text-black font-medium">
              📅 Follow-up: {new Date(call.followUpDateTime).toLocaleString()}
            </p>
          )}
          {/* Edit & Delete Buttons */}
          <div className="flex justify-end gap-2 mt-3">
            {onEdit && (
              <button
                onClick={() => onEdit(call)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-blue-700 hover:bg-blue-50 text-xs"
              >
                <User className="w-4 h-4" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(call.id)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-red-700 hover:bg-red-50 text-xs"
              >
                <X className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallModal;

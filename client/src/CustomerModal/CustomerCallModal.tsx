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

interface CustomerCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CallFormData, mode: string) => void;
  editableCall?: CallItem;
  isLoading?: boolean;
}

const CustomerCallModal: React.FC<CustomerCallModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editableCall,
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
                {editableCall ? "Edit Customer Call Log" : "Add Customer Call Log"}
              </h2>
              <p className="text-sm text-gray-600">
                Record customer call details and notes
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

export default CustomerCallModal;
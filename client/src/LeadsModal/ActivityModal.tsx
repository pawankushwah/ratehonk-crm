import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, User, FileText } from "lucide-react";
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

// Activity Types based on database schema (activity_type: integer)
const ACTIVITY_TYPES = [
  { value: 1, label: "Lead Created" },
  { value: 2, label: "Email Sent" },
  { value: 11, label: "Whatsapp Sent" },
  { value: 3, label: "Call Made" },
  { value: 4, label: "Meeting Scheduled" },
  { value: 5, label: "Follow-up" },
  { value: 6, label: "Proposal Sent" },
  { value: 7, label: "Contract Signed" },
  { value: 8, label: "Payment Received" },
  { value: 9, label: "Project Completed" },
  { value: 10, label: "Other" },
];

// Activity Status based on database schema (activity_status: integer)
const ACTIVITY_STATUS = [
  { value: 0, label: "Pending" },
  { value: 1, label: "Completed" },
];

// Validation schema to match database columns
const activityFormSchema = z.object({
  activityType: z.number().min(1, "Activity type is required"),
  activityTitle: z.string().min(1, "Activity title is required"),
  activityDescription: z.string().optional(),
  activityStatus: z.number().min(0, "Activity status is required"),
  activityDate: z.string().min(1, "Activity date is required"),
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ActivityFormData, mode: string) => void;
  editableActivity?: any;
  isLoading?: boolean;
}

const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editableActivity,
  isLoading = false,
}) => {
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      activityType: 1,
      activityTitle: "",
      activityDescription: "",
      activityStatus: 1,
      activityDate: new Date().toISOString().slice(0, 16),
    },
  });

  // Update form when editing
  useEffect(() => {
    if (editableActivity) {
      form.reset({
        activityType: editableActivity.activityType || 1,
        activityTitle: editableActivity.activityTitle || "",
        activityDescription: editableActivity.activityDescription || "",
        activityStatus: editableActivity.activityStatus ?? 1,
        activityDate: editableActivity.activityDate
          ? new Date(editableActivity.activityDate).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
      });
    } else {
      form.reset({
        activityType: 1,
        activityTitle: "",
        activityDescription: "",
        activityStatus: 1,
        activityDate: new Date().toISOString().slice(0, 16),
      });
    }
  }, [editableActivity, form]);

  const onSubmit = (data: ActivityFormData) => {
    onSave(data, editableActivity ? "edit" : "create");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editableActivity
                  ? "Edit Lead Activity"
                  : "Add Lead Activity"}
              </h2>
              <p className="text-sm text-gray-600">
                Track lead interactions and activities
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-6 space-y-6"
          >
            {/* Activity Type */}
            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Activity Type *
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value.toString()}
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Activity Title */}
            <FormField
              control={form.control}
              name="activityTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Activity Title *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter activity title"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Activity Description */}
            <FormField
              control={form.control}
              name="activityDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Activity Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter activity description and details"
                      rows={4}
                      {...field}
                      className="w-full resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Activity Status */}
            <FormField
              control={form.control}
              name="activityStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Activity Status *
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACTIVITY_STATUS.map((status) => (
                        <SelectItem
                          key={status.value}
                          value={status.value.toString()}
                        >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Activity Date */}
            <FormField
              control={form.control}
              name="activityDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Activity Date *
                  </FormLabel>
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
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading
                  ? "Saving..."
                  : editableActivity
                    ? "Update Activity"
                    : "Save Activity"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

// Activity Item component for displaying activities
export const ActivityItem = ({ 
  activity, 
  isOpen, 
  onToggle, 
  onEdit, 
  onDelete,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging 
}: any) => {
  const getActivityTypeLabel = (typeId: number) => {
    const type = ACTIVITY_TYPES.find(t => t.value === typeId);
    return type ? type.label : 'Unknown';
  };

  const getStatusLabel = (statusId: number) => {
    return statusId === 1 ? 'Completed' : 'Pending';
  };

  const getStatusColor = (statusId: number) => {
    return statusId === 1 ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100';
  };

  return (
    <div
      className={`border rounded-lg p-4 mb-4 bg-white shadow-md transition-all duration-300 hover:shadow-lg ${
        isDragging ? "opacity-50 scale-[0.98]" : ""
      }`}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-blue-100">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-black text-base">
              {activity.activityTitle || activity.title || "Untitled Activity"}
            </h4>
            <p className="text-xs text-gray-500">
              {getActivityTypeLabel(activity.activityType || 1)} • {' '}
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(activity.activityStatus || 0)}`}>
                {getStatusLabel(activity.activityStatus || 0)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {activity.activityDate ? new Date(activity.activityDate).toLocaleDateString() : ''}
          </span>
          {isOpen ? (
            <X className="w-4 h-4 text-black" />
          ) : (
            <FileText className="w-4 h-4 text-black" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 pl-1 border-t pt-3 space-y-2">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-gray-600">
              Activity Details:
            </span>
            <span className="text-xs text-gray-500">
              {activity.activityDate ? new Date(activity.activityDate).toLocaleString() : ''}
            </span>
          </div>

          {activity.activityDescription && (
            <p className="text-sm text-black leading-relaxed">
              {activity.activityDescription}
            </p>
          )}

          {/* Edit & Delete Buttons */}
          <div className="flex justify-end gap-2 mt-3">
            {onEdit && (
              <button
                onClick={() => onEdit(activity)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-blue-700 hover:bg-blue-50 text-xs"
              >
                <User className="w-4 h-4" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(activity.id)}
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

export default ActivityModal;

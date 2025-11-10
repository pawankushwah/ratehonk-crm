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
  { value: 1, label: "Customer Created" },
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

interface CustomerActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ActivityFormData, mode: string) => void;
  editableActivity?: any;
  isLoading?: boolean;
}

const CustomerActivityModal: React.FC<CustomerActivityModalProps> = ({
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
                  ? "Edit Customer Activity"
                  : "Add Customer Activity"}
              </h2>
              <p className="text-sm text-gray-600">
                Track customer interactions and activities
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

export default CustomerActivityModal;

import React, { useState, useEffect } from "react";
import { X, StickyNote, FileText, AlertCircle, Star, Paperclip, Clock, Mail } from "lucide-react";
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

// Note Types based on database schema
const NOTE_TYPES = [
  { value: "general", label: "General" },
  { value: "important", label: "Important" },
  { value: "reminder", label: "Reminder" },
  { value: "follow-up", label: "Follow-up" },
];

// Validation schema to match database columns
const noteFormSchema = z.object({
  noteTitle: z.string().min(1, "Note title is required"),
  noteContent: z.string().optional(),
  noteType: z.string().default("general"),
  isImportant: z.boolean().default(false),
  attachment: z.string().optional(),
  reminder: z.boolean().default(false),
  reminderAuto: z.boolean().default(true),
  reminderEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  reminderDate: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NoteFormData, mode: string) => void;
  editableNote?: any;
  isLoading?: boolean;
}

const NotesModalNew: React.FC<NotesModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editableNote,
  isLoading = false 
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      noteTitle: "",
      noteContent: "",
      noteType: "general",
      isImportant: false,
      attachment: "",
      reminder: false,
      reminderAuto: true,
      reminderEmail: "",
      reminderDate: "",
    },
  });

  // Watch reminder and reminderAuto values to show/hide fields
  const watchReminder = form.watch("reminder");
  const watchReminderAuto = form.watch("reminderAuto");

  // Populate form when editing
  useEffect(() => {
    if (editableNote) {
      form.reset({
        noteTitle: editableNote.noteTitle || "",
        noteContent: editableNote.noteContent || "",
        noteType: editableNote.noteType || "general",
        isImportant: editableNote.isImportant || false,
        attachment: editableNote.attachment || "",
        reminder: editableNote.reminder || false,
        reminderAuto: editableNote.reminderAuto !== undefined ? editableNote.reminderAuto : true,
        reminderEmail: editableNote.reminderEmail || "",
        reminderDate: editableNote.reminderDate ? new Date(editableNote.reminderDate).toISOString().slice(0, 16) : "",
      });
    } else {
      form.reset({
        noteTitle: "",
        noteContent: "",
        noteType: "general",
        isImportant: false,
        attachment: "",
        reminder: false,
        reminderAuto: true,
        reminderEmail: "",
        reminderDate: "",
      });
    }
    setUploadedFile(null);
  }, [editableNote, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setUploadedFile(file);
    if (file) {
      form.setValue("attachment", file.name);
    } else {
      form.setValue("attachment", "");
    }
  };

  const onSubmit = (data: NoteFormData) => {
    console.log("🔥 Note form submitted with data:", data);
    
    // Process the form data
    const processedData = {
      ...data,
      // Convert reminderDate to ISO string if provided
      reminderDate: data.reminderDate ? new Date(data.reminderDate).toISOString() : null,
      // Clear reminderEmail if reminderAuto is true
      reminderEmail: data.reminderAuto ? "" : data.reminderEmail,
      // Handle file attachment (in a real app, you'd upload to a server)
      attachment: uploadedFile ? uploadedFile.name : data.attachment,
    };
    
    onSave(processedData, editableNote ? "edit" : "add");
    // Don't close here - let parent handle closing after API success
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-black z-10"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {editableNote ? "Edit Note" : "Add New Note"}
          </h2>
          <p className="text-sm text-gray-600">
            Track important information and observations about this lead
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Note Title */}
            <FormField
              control={form.control}
              name="noteTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    Note Title *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a descriptive title for this note" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note Content */}
            <FormField
              control={form.control}
              name="noteContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add detailed information, observations, or comments..."
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note Type */}
            <FormField
              control={form.control}
              name="noteType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Note Type
                  </FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select note type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NOTE_TYPES.map((type) => (
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

            {/* File Attachment */}
            <FormField
              control={form.control}
              name="attachment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachment
                  </FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileChange}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormControl>
                  {uploadedFile && (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {uploadedFile.name}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Important Flag */}
            <FormField
              control={form.control}
              name="isImportant"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Mark as Important
                    </FormLabel>
                    <p className="text-sm text-gray-600">
                      Important notes will be highlighted and given priority
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Reminder Checkbox */}
            <FormField
              control={form.control}
              name="reminder"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      Set Reminder
                    </FormLabel>
                    <p className="text-sm text-gray-600">
                      Enable reminder notification for this note
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Reminder Options - Only show if reminder is enabled */}
            {watchReminder && (
              <>
                {/* Reminder Auto */}
                <FormField
                  control={form.control}
                  name="reminderAuto"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Reminder For</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={field.value === true}
                              onChange={() => field.onChange(true)}
                              className="text-blue-600"
                            />
                            <span>Myself</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={field.value === false}
                              onChange={() => field.onChange(false)}
                              className="text-blue-600"
                            />
                            <span>Someone else</span>
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reminder Email - Only show if reminder is for someone else */}
                {!watchReminderAuto && (
                  <FormField
                    control={form.control}
                    name="reminderEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Reminder Email
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="Enter email address for reminder" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Reminder Date */}
                <FormField
                  control={form.control}
                  name="reminderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Reminder Date & Time
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : editableNote ? "Update Note" : "Create Note"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default NotesModalNew;
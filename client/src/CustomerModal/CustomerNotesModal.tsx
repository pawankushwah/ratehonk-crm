import React, { useState, useEffect, useRef } from "react";
import { X, StickyNote, FileText, AlertCircle, Star, Paperclip, Clock, Mail, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface CustomerNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NoteFormData, mode: string) => void;
  editableNote?: any;
  isLoading?: boolean;
}

const CustomerNotesModal: React.FC<CustomerNotesModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editableNote,
  isLoading = false 
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
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

  const reminderEnabled = form.watch("reminder");
  const reminderAuto = form.watch("reminderAuto");

  // Update form when editing
  useEffect(() => {
    if (editableNote) {
      form.reset({
        noteTitle: editableNote.noteTitle || editableNote.title || "",
        noteContent: editableNote.noteContent || editableNote.details || "",
        noteType: editableNote.noteType || "general",
        isImportant: editableNote.isImportant || false,
        attachment: editableNote.attachment || "",
        reminder: editableNote.reminder || false,
        reminderAuto: editableNote.reminderAuto ?? true,
        reminderEmail: editableNote.reminderEmail || "",
        reminderDate: editableNote.reminderDate ? new Date(editableNote.reminderDate).toISOString().slice(0, 16) : "",
      });
      if (editableNote.attachment) {
        setUploadedFilePath(editableNote.attachment);
      }
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
      setUploadedFile(null);
      setUploadedFilePath("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [editableNote, form]);

  const onSubmit = (data: NoteFormData) => {
    onSave(data, editableNote ? "edit" : "create");
  };

  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('attachments', file);

      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      const response = await fetch('/api/email-attachments/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload file' }));
        throw new Error(errorData.message || 'Failed to upload file');
      }

      const result = await response.json();
      const uploadedFiles = result.files || [];
      
      if (uploadedFiles.length === 0) {
        throw new Error('No file was uploaded');
      }
      
      const uploadedFile = uploadedFiles[0];
      if (uploadedFile.path) {
        setUploadedFilePath(uploadedFile.path);
        form.setValue("attachment", uploadedFile.path); // Store the path, not just filename
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } else {
        throw new Error('Uploaded file missing path');
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      setUploadedFile(null);
      form.setValue("attachment", "");
    } finally {
      setIsUploading(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editableNote ? "Edit Customer Note" : "Add Customer Note"}
              </h2>
              <p className="text-sm text-gray-600">
                Create a note to track customer information and reminders
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
            {/* Note Title */}
            <FormField
              control={form.control}
              name="noteTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">Note Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter note title" 
                      {...field}
                      className="w-full"
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
                  <FormLabel className="text-sm font-medium text-gray-900">Note Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter note details and information"
                      rows={4}
                      {...field}
                      className="w-full resize-none"
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
                  <FormLabel className="text-sm font-medium text-gray-900">Note Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">File Attachment</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="note-file-upload"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </div>
                ) : uploadedFile && uploadedFilePath ? (
                  <div className="space-y-2">
                    <Paperclip className="w-6 h-6 text-green-600 mx-auto" />
                    <p className="text-xs text-green-600 font-medium">✓ {uploadedFile.name}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadedFilePath("");
                        form.setValue("attachment", "");
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ) : editableNote?.attachment ? (
                  <div className="space-y-2">
                    <Paperclip className="w-6 h-6 text-blue-600 mx-auto" />
                    <p className="text-xs text-gray-600">{editableNote.attachment.split('/').pop()}</p>
                    <label
                      htmlFor="note-file-upload"
                      className="text-blue-600 hover:text-blue-800 cursor-pointer text-xs font-medium"
                    >
                      Change File
                    </label>
                  </div>
                ) : (
                  <>
                    <Paperclip className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload a file attachment</p>
                    <label
                      htmlFor="note-file-upload"
                      className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm font-medium"
                    >
                      Choose File
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Reminder Section */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-medium text-gray-900">Reminder Settings</h3>
              </div>
              
              <FormField
                control={form.control}
                name="reminder"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </FormControl>
                    <FormLabel className="text-sm text-gray-900 cursor-pointer">
                      Set a reminder for this note
                    </FormLabel>
                  </FormItem>
                )}
              />

              {reminderEnabled && (
                <div className="mt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="reminderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">Reminder Date & Time</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="reminderAuto"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-gray-900 cursor-pointer">
                          Remind me (uncheck to send to someone else)
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {!reminderAuto && (
                    <FormField
                      control={form.control}
                      name="reminderEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-900">Reminder Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input 
                                type="email"
                                placeholder="Enter email address for reminder"
                                {...field}
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>

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
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Saving..." : editableNote ? "Update Note" : "Save Note"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CustomerNotesModal;
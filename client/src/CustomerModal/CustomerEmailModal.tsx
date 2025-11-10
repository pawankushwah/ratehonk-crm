import React, { useState, useEffect } from "react";
import { X, Mail, Send, User, Paperclip, Trash2, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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
import { useToast } from "@/hooks/use-toast";

// Email Status based on database schema
const EMAIL_STATUS = [
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
  { value: "bounced", label: "Bounced" },
];

// Validation schema to match database columns
const emailFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
  htmlBody: z.string().optional(),
  status: z.string().min(1, "Email status is required"),
  contentType: z.enum(["plain", "html"]).default("plain"),
});

type EmailFormData = z.infer<typeof emailFormSchema>;

export interface EmailItem {
  id?: number;
  email: string;
  subject: string;
  body: string;
  status: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bounceReason?: string;
  errorMessage?: string;
}

interface CustomerEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmailFormData, mode: string) => void;
  editableEmail?: EmailItem;
  customerEmail?: string;
  isLoading?: boolean;
}

const CustomerEmailModal: React.FC<CustomerEmailModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editableEmail,
  customerEmail,
  isLoading = false 
}) => {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Array<{filename: string; path: string; size: number}>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [contentType, setContentType] = useState<"plain" | "html">("plain");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: customerEmail || "",
      subject: "",
      body: "",
      htmlBody: "",
      status: "sent",
      contentType: "plain",
    },
  });

  // Update form when editing
  useEffect(() => {
    if (editableEmail) {
      form.reset({
        email: editableEmail.email || customerEmail || "",
        subject: editableEmail.subject || "",
        body: editableEmail.body || "",
        htmlBody: (editableEmail as any).htmlBody || "",
        status: editableEmail.status || "sent",
        contentType: (editableEmail as any).htmlBody ? "html" : "plain",
      });
      setContentType((editableEmail as any).htmlBody ? "html" : "plain");
    } else {
      form.reset({
        email: customerEmail || "",
        subject: "",
        body: "",
        htmlBody: "",
        status: "sent",
        contentType: "plain",
      });
      setContentType("plain");
      setAttachments([]);
    }
  }, [editableEmail, customerEmail, form]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log("📎 No files selected");
      return;
    }

    console.log(`📎 Uploading ${files.length} file(s)...`);
    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('attachments', file);
      });

      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      const response = await fetch('/api/email-attachments/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload attachments' }));
        throw new Error(errorData.message || 'Failed to upload attachments');
      }

      const result = await response.json();
      const uploadedFiles = result.files || [];
      
      if (uploadedFiles.length === 0) {
        throw new Error('No files were uploaded');
      }
      
      setAttachments((prev) => [...prev, ...uploadedFiles]);
      
      console.log(`✅ Successfully uploaded ${uploadedFiles.length} file(s):`, uploadedFiles.map(f => f.filename));
      
      toast({
        title: "Success",
        description: `${uploadedFiles.length} file(s) uploaded successfully`,
      });
      
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload attachments",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: EmailFormData) => {
    const emailData = {
      ...data,
      attachments: attachments.map(a => ({ filename: a.filename, path: a.path })),
      htmlBody: contentType === "html" ? data.htmlBody : undefined,
    };
    onSave(emailData, editableEmail ? "edit" : "create");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editableEmail ? "Edit Customer Email" : "Send Customer Email"}
              </h2>
              <p className="text-sm text-gray-600">
                Compose and send emails to customers
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
              {/* Recipient Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">To (Email) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter recipient email"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select email status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMAIL_STATUS.map((status) => (
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

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">Subject *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter email subject"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Type Selector */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <label className="text-sm font-medium text-gray-900">Content Type:</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="plain"
                    checked={contentType === "plain"}
                    onChange={() => setContentType("plain")}
                    className="w-4 h-4 text-cyan-600"
                  />
                  <span className="text-sm text-gray-700">Plain Text</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="html"
                    checked={contentType === "html"}
                    onChange={() => setContentType("html")}
                    className="w-4 h-4 text-cyan-600"
                  />
                  <span className="text-sm text-gray-700">HTML</span>
                </label>
              </div>
            </div>

            {/* Email Body - Plain Text or HTML */}
            {contentType === "plain" ? (
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">Email Body *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Compose your email message..."
                        rows={8}
                        {...field}
                        className="w-full resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="htmlBody"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">Email Body (HTML) *</FormLabel>
                    <FormControl>
                      <div className="bg-white border border-gray-300 rounded-md">
                        <ReactQuill
                          theme="snow"
                          value={field.value || ""}
                          onChange={(value) => {
                            field.onChange(value);
                            form.setValue("body", value.replace(/<[^>]*>/g, '')); // Set plain text version
                          }}
                          placeholder="Compose your HTML email message..."
                          className="min-h-[200px]"
                          modules={{
                            toolbar: [
                              [{ 'header': [1, 2, 3, false] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                              [{ 'color': [] }, { 'background': [] }],
                              ['link', 'image'],
                              ['clean']
                            ],
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* File Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Attachments</label>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.jpg,.jpeg,.png,.gif"
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    className="flex items-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-4 h-4" />
                    {isUploading ? "Uploading..." : "Add Files"}
                  </Button>
                </div>
              </div>
              
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                          <p className="text-xs text-gray-500">
                            {(attachment.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email Preview */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Email Preview</h3>
              <div className="bg-white rounded border p-4 text-sm">
                <div className="border-b pb-2 mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>To: {form.watch("email") || "recipient@example.com"}</span>
                    <span>Status: {form.watch("status") || "sent"}</span>
                  </div>
                  <div className="font-medium text-gray-900">
                    {form.watch("subject") || "Email Subject"}
                  </div>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {form.watch("body") || "Email body content will appear here..."}
                </div>
              </div>
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
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {isLoading ? "Sending..." : editableEmail ? "Update Email" : "Send Email"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CustomerEmailModal;
import React, { useState, useEffect } from "react";
import { X, Mail, Send, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";

interface EmailModalNewProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  leadEmail?: string;
}

interface EmailData {
  id: number;
  leadId: number;
  email: string;
  subject: string;
  body: string;
  fromEmail: string;
  status: string;
  sentAt: string;
}

const EmailModalNew = ({ isOpen, onClose, leadId, leadEmail }: EmailModalNewProps) => {
  const [subject, setSubject] = useState("");
  const [toEmail, setToEmail] = useState(leadEmail || "");
  const [fromEmail, setFromEmail] = useState("");
  const [body, setBody] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { user, tenant } = useAuth();
  const queryClient = useQueryClient();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubject("");
      setToEmail(leadEmail || "");
      setFromEmail(user?.email || "");
      setBody("");
      setShowSuccess(false);
    }
  }, [isOpen, leadEmail, user?.email]);

  // Fetch existing emails for this lead
  const { data: emailsData, isLoading: isLoadingEmails } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/leads/${leadId}/emails`],
    enabled: isOpen && !!tenant?.id && !!leadId,
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: {
      email: string;
      subject: string;
      body: string;
      fromEmail: string;
    }) => {
      const url = `/api/tenants/${tenant?.id}/leads/${leadId}/emails`;
      console.log("📧 EmailModal: Making API request to:", url);
      console.log("📧 EmailModal: Email data:", emailData);
      
      return apiRequest("POST", url, emailData);
    },
    onSuccess: async () => {
      // Invalidate and refetch emails
      await queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/leads/${leadId}/emails`],
      });
      // Invalidate and refetch activities to show email activity (same as customer emails)
      await queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${tenant?.id}/leads/${leadId}/activities`],
      });
      // Force a refetch to ensure activities are updated
      await queryClient.refetchQueries({
        queryKey: [`/api/tenants/${tenant?.id}/leads/${leadId}/activities`],
      });
      setShowSuccess(true);
      // Clear form
      setSubject("");
      setBody("");
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !body.trim() || !toEmail.trim()) {
      return;
    }

    sendEmailMutation.mutate({
      email: toEmail,
      subject: subject.trim(),
      body: body.trim(),
      fromEmail: fromEmail || user?.email || "noreply@example.com",
    });
  };

  const emails = emailsData?.emails || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-lg flex overflow-hidden">
        
        {/* Email Form Section */}
        <div className="w-1/2 p-6 border-r border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Send Email
            </h2>
            <button
              className="text-gray-600 hover:text-gray-900"
              onClick={onClose}
            >
              <X size={22} />
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Email sent successfully!</span>
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* To Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Recipient email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                required
              />
            </div>

            {/* From Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sender email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={8}
                placeholder="Write your email content..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>

            {/* Error Message */}
            {sendEmailMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  Failed to send email. Please try again.
                </span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={sendEmailMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={sendEmailMutation.isPending || !subject.trim() || !body.trim() || !toEmail.trim()}
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Email History Section */}
        <div className="w-1/2 p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-600" />
            Email History ({emails.length})
          </h3>

          {isLoadingEmails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading emails...</span>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No emails sent yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {emails.map((email: EmailData) => (
                <EmailHistoryItem key={email.id} email={email} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Email History Item Component
const EmailHistoryItem = ({ email }: { email: EmailData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
              {email.subject}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              To: {email.email}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(email.sentAt).toLocaleString()}
            </p>
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${
            email.status === 'sent' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {email.status}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-600 space-y-1">
            <p><span className="font-medium">From:</span> {email.fromEmail}</p>
            {email.body && (
              <div>
                <span className="font-medium">Message:</span>
                <p className="mt-1 text-gray-800 bg-gray-50 p-2 rounded text-xs leading-relaxed">
                  {email.body}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailModalNew;
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Mail, 
  Search, 
  RefreshCw,
  Reply,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Send,
  X,
  Plus,
  Loader2,
  Bot,
  Wand2,
  Lightbulb,
  RotateCcw,
  Paperclip,
  Inbox,
  Send as SendIcon,
  FileText,
  MoreVertical,
  Settings,
  HelpCircle,
  Menu,
  CheckSquare,
  Square
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { GmailEmail, GmailIntegration } from "@shared/schema";

export default function GmailEmails() {
  const { toast } = useToast();
  const { tenant } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [replyMode, setReplyMode] = useState(false);
  const [composeMode, setComposeMode] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showEmailDetails, setShowEmailDetails] = useState(false); // For mobile view
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    body: "",
    attachments: [] as Array<{ name: string; url: string; size: number; type: string }>
  });
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allEmails, setAllEmails] = useState<GmailEmail[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showAIComposer, setShowAIComposer] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiLength, setAiLength] = useState("medium");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIImprovement, setShowAIImprovement] = useState(false);
  const [improvementType, setImprovementType] = useState("general");
  const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const observer = useRef<IntersectionObserver>();

  const EMAILS_PER_PAGE = 20;

  // Toggle email selection
  const toggleEmailSelection = (emailId: number) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  // Select all emails
  const selectAllEmails = () => {
    if (selectedEmails.size === displayEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(displayEmails.map(e => e.id)));
    }
  };

  // Check Gmail integration status
  const { data: gmailStatus, isLoading: statusLoading } = useQuery<GmailIntegration>({
    queryKey: [`/api/gmail/status/${tenant?.id}`],
    enabled: !!tenant?.id,
  });

  // Fetch Gmail emails using working endpoint with infinite scroll
  const { data: emailsResponse, isLoading: emailsLoading, refetch: refetchEmails } = useQuery<{
    emails: GmailEmail[];
    total: number;
    page: number;
    hasMore: boolean;
  }>({
    queryKey: [`/api/gmail/emails-working/${tenant?.id}`, currentPage, searchQuery],
    enabled: !!tenant?.id && !!gmailStatus?.isConnected,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Update emails list when new data arrives
  useEffect(() => {
    if (emailsResponse?.emails && Array.isArray(emailsResponse.emails)) {
      console.log('📧 Updating emails list:', {
        currentPage,
        emailsCount: emailsResponse.emails.length,
        total: emailsResponse.total,
        hasMore: emailsResponse.hasMore
      });
      
      if (currentPage === 1) {
        setAllEmails(emailsResponse.emails);
      } else {
        setAllEmails(prev => {
          // Avoid duplicates by checking email IDs
          const existingIds = new Set(prev.map(e => e.id));
          const newEmails = emailsResponse.emails.filter(e => !existingIds.has(e.id));
          return [...prev, ...newEmails];
        });
      }
      setHasMore(emailsResponse.hasMore !== false && emailsResponse.emails.length === EMAILS_PER_PAGE);
      setIsLoadingMore(false);
    } else if (emailsResponse && !emailsResponse.emails) {
      // If response exists but no emails array, clear the list
      console.warn('📧 Response received but no emails array:', emailsResponse);
      if (currentPage === 1) {
        setAllEmails([]);
      }
      setIsLoadingMore(false);
    }
  }, [emailsResponse, currentPage]);

  // Reset when search changes
  useEffect(() => {
    setCurrentPage(1);
    setAllEmails([]);
    setHasMore(true);
  }, [searchQuery]);

  // Fallback: Use emailsResponse.emails directly if allEmails is empty but response has data
  const allEmailsList = allEmails.length > 0 
    ? allEmails 
    : (emailsResponse?.emails && Array.isArray(emailsResponse.emails) ? emailsResponse.emails : []);

  // Filter emails based on active folder
  const filteredEmails = allEmailsList.filter((email: GmailEmail) => {
    switch (activeFolder) {
      case "starred":
        return email.isImportant === true;
      case "sent":
        // Show emails where the user's Gmail address is in the from_email field (sent by user)
        return gmailStatus?.gmailAddress && email.fromEmail?.toLowerCase() === gmailStatus.gmailAddress.toLowerCase();
      case "drafts":
        // Drafts are not stored in our system, so show empty
        return false;
      case "inbox":
      default:
        // Show all emails in inbox (received emails - where user is the recipient)
        // Exclude sent emails from inbox
        if (gmailStatus?.gmailAddress) {
          return email.fromEmail?.toLowerCase() !== gmailStatus.gmailAddress.toLowerCase();
        }
        return true;
    }
  });

  const displayEmails = filteredEmails;
  const totalEmails = filteredEmails.length;
  const totalPages = Math.ceil(totalEmails / EMAILS_PER_PAGE);

  // Infinite scroll intersection observer
  const lastEmailElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        setIsLoadingMore(true);
        setCurrentPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore]);

  // Sync emails mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/gmail/sync/${tenant?.id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Gmail emails synced successfully"
      });
      setCurrentPage(1);
      setAllEmails([]);
      refetchEmails();
    },
    onError: (error: any) => {
      console.log("🔍 Sync Error Details:", error);
      
      // Check for Gmail token expiration
      if (error.message && error.message.includes("Gmail access token expired")) {
        toast({
          title: "Gmail Access Expired",
          description: "Attempting to refresh your Gmail connection...",
          variant: "destructive"
        });
        
        // Try to refresh the token first
        refreshTokenMutation.mutate();
        return;
      }
      
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync Gmail emails",
        variant: "destructive"
      });
    }
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async (data: { emailId: string; replyText: string; subject: string; toEmail: string }) => {
      return await apiRequest("POST", `/api/gmail/reply/${tenant?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reply sent successfully"
      });
      setReplyMode(false);
      setReplyText("");
      setSelectedEmail(null);
    },
    onError: (error: any) => {
      console.log("🔍 Reply Error Details:", error);
      
      // Check for Gmail token expiration
      if (error.message && error.message.includes("Gmail access token expired")) {
        toast({
          title: "Gmail Access Expired",
          description: "Attempting to refresh your Gmail connection...",
          variant: "destructive"
        });
        
        // Try to refresh the token first
        refreshTokenMutation.mutate();
        return;
      }
      
      toast({
        title: "Reply Failed",
        description: error.message || "Failed to send reply",
        variant: "destructive"
      });
    }
  });

  // Token refresh mutation
  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/gmail/refresh-token/${tenant?.id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Gmail Connection Restored",
        description: "Your Gmail access has been refreshed successfully"
      });
      // Retry the failed operation
      syncMutation.mutate();
    },
    onError: (error: any) => {
      toast({
        title: "Token Refresh Failed",
        description: "Please reconnect your Gmail account in settings",
        variant: "destructive"
      });
      setTimeout(() => {
        window.location.href = "/settings/email";
      }, 2000);
    }
  });

  // AI compose email mutation
  const aiComposeMutation = useMutation({
    mutationFn: async (data: { prompt: string; context?: string; tone: string; length: string }) => {
      const response = await apiRequest("POST", `/api/gmail/ai-compose/${tenant?.id}`, data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data?.email) {
        setComposeData(prev => ({
          ...prev,
          subject: data.email.subject || prev.subject,
          body: data.email.body || prev.body
        }));
        setShowAIComposer(false);
        setAiPrompt("");
        setAiContext("");
        toast({
          title: "AI Email Generated",
          description: "Your email has been generated and populated in the compose form"
        });
      } else {
        throw new Error("Invalid AI email generation response");
      }
    },
    onError: (error: any) => {
      toast({
        title: "AI Generation Failed",
        description: error.message || "Failed to generate AI email",
        variant: "destructive"
      });
    }
  });

  // AI improve email mutation
  const aiImproveMutation = useMutation({
    mutationFn: async (data: { subject: string; body: string; improvementType: string }) => {
      const response = await apiRequest("POST", `/api/gmail/ai-improve/${tenant?.id}`, data);
      return await response.json();
    },
    onSuccess: (data: any) => {
        if (data?.improvement) {
          if (composeMode) {
            setComposeData(prev => ({
              ...prev,
              subject: data.improvement.improvedSubject || prev.subject,
              body: data.improvement.improvedBody || prev.body
            }));
          } else if (replyMode) {
            setReplyText(data.improvement.improvedBody || replyText);
          }
        setShowAIImprovement(false);
        toast({
          title: "Email Improved",
          description: "Your email has been enhanced with AI suggestions"
        });
      } else {
        throw new Error("Invalid AI improvement response");
      }
    },
    onError: (error: any) => {
      toast({
        title: "AI Improvement Failed",
        description: error.message || "Failed to improve email with AI",
        variant: "destructive"
      });
    }
  });

  // Upload attachments mutation
  const uploadAttachmentsMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('attachments', file);
      });
      
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/email-attachments/upload", {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return await response.json();
    },
  });

  // Compose email mutation
  const composeMutation = useMutation({
    mutationFn: async (emailData: { to: string; subject: string; body: string }) => {
      return await apiRequest("POST", `/api/gmail/compose/${tenant?.id}`, emailData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent successfully"
      });
      setComposeMode(false);
      setComposeData({ to: "", subject: "", body: "", attachments: [] });
      setAttachmentFiles([]);
    },
    onError: (error: any) => {
      console.log("🔍 Compose Error Details:", error);
      
      // Check for Gmail token expiration
      if (error.message && error.message.includes("Gmail access token expired")) {
        toast({
          title: "Gmail Access Expired",
          description: "Attempting to refresh your Gmail connection...",
          variant: "destructive"
        });
        
        // Try to refresh the token first
        refreshTokenMutation.mutate();
        return;
      }
      
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    }
  });

  const handleSync = async () => {
    setIsSyncing(true);
    await syncMutation.mutateAsync();
    setIsSyncing(false);
  };

  const handleSendReply = () => {
    if (!selectedEmail || !replyText.trim()) return;

    replyMutation.mutate({
      emailId: selectedEmail.gmailMessageId,
      replyText,
      subject: `Re: ${selectedEmail.subject}`,
      toEmail: selectedEmail.fromEmail
    });
  };

  const handleCompose = async () => {
    if (!composeData.to.trim() || !composeData.subject.trim() || !composeData.body.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Upload attachments first if any
    let uploadedAttachments = composeData.attachments;
    if (attachmentFiles.length > 0) {
      try {
        const uploadResult = await uploadAttachmentsMutation.mutateAsync(attachmentFiles);
        uploadedAttachments = uploadResult.files || [];
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to upload attachments. Email will be sent without attachments.",
          variant: "destructive"
        });
      }
    }

    composeMutation.mutate({
      ...composeData,
      attachments: uploadedAttachments
    });
  };


  // Delete selected emails
  const handleDelete = async () => {
    if (selectedEmails.size === 0 && !selectedEmail) {
      toast({
        title: "No emails selected",
        description: "Please select emails to delete",
        variant: "destructive"
      });
      return;
    }

    const emailsToDelete = selectedEmails.size > 0 ? selectedEmails : (selectedEmail ? new Set([selectedEmail.id]) : new Set());

    try {
      // Update local state - remove deleted emails
      setAllEmails(prev => prev.filter(email => !emailsToDelete.has(email.id)));
      setSelectedEmails(new Set());
      if (selectedEmail && emailsToDelete.has(selectedEmail.id)) {
        setSelectedEmail(null);
        setReplyMode(false);
      }
      toast({
        title: "Success",
        description: `${emailsToDelete.size} email(s) deleted`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete emails",
        variant: "destructive"
      });
    }
  };

  // Toggle star/important
  const handleToggleStar = async (email: GmailEmail) => {
    try {
      // Update local state
      setAllEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, isImportant: !e.isImportant } : e
      ));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail({ ...selectedEmail, isImportant: !selectedEmail.isImportant });
      }
      toast({
        title: "Success",
        description: email.isImportant ? "Removed from starred" : "Starred"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update star",
        variant: "destructive"
      });
    }
  };

  // Mark as read/unread
  const handleMarkAsRead = async (email: GmailEmail, markAsRead: boolean) => {
    try {
      // Update local state
      setAllEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, isRead: markAsRead } : e
      ));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail({ ...selectedEmail, isRead: markAsRead });
      }
      toast({
        title: "Success",
        description: markAsRead ? "Marked as read" : "Marked as unread"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update read status",
        variant: "destructive"
      });
    }
  };

  // Forward email
  const handleForward = () => {
    if (!selectedEmail) return;
    
    setComposeMode(true);
    setComposeData({
      to: "",
      subject: `Fwd: ${selectedEmail.subject || 'No Subject'}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${selectedEmail.fromName || selectedEmail.fromEmail}\nDate: ${formatDate(selectedEmail.receivedAt.toString())}\nSubject: ${selectedEmail.subject || 'No Subject'}\n\n${selectedEmail.bodyText || ''}`,
      attachments: []
    });
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Navigate to settings
  const handleSettings = () => {
    window.location.href = '/gmail-settings';
  };

  // Show help (can be a modal or link)
  const handleHelp = () => {
    toast({
      title: "Gmail Integration Help",
      description: "Use the sync button to load emails. Click on an email to view it. Use Compose to send new emails.",
    });
  };

  const handleAttachmentAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachmentFiles(prev => [...prev, ...files]);
      
      // Preview attachments
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setComposeData(prev => ({
            ...prev,
            attachments: [...prev.attachments, {
              name: file.name,
              url: reader.result as string,
              size: file.size,
              type: file.type
            }]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAttachmentRemove = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
    setComposeData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getEmailPreview = (email: GmailEmail) => {
    const text = email.bodyText || email.bodyHtml?.replace(/<[^>]*>/g, '') || '';
    return text.substring(0, 120) + (text.length > 120 ? '...' : '');
  };

  // Helper function to decode HTML entities and clean HTML
  const processHtmlContent = (html: string): string => {
    if (!html) return '';
    
    // Create a temporary div to decode HTML entities
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    let decodedHtml = tempDiv.textContent || tempDiv.innerText || html;
    
    // If it was already decoded, use original
    if (decodedHtml === html && html.includes('<')) {
      decodedHtml = html;
    } else if (decodedHtml !== html) {
      // If it was decoded, we need to use the original HTML
      decodedHtml = html;
    }
    
    return decodedHtml;
  };

  if (statusLoading) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!gmailStatus?.isConnected) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-6 w-6" />
                Gmail Integration Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You need to connect your Gmail account first to view emails.
              </p>
              <Button asChild>
                <a href="/settings/email">Go to Email Settings</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left Sidebar - Gmail Style */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} border-r bg-background transition-all duration-300 flex flex-col`}>
          {/* Compose Button */}
          <div className="p-4 border-b">
            <Button 
              onClick={() => setComposeMode(true)} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-full h-12 text-sm font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              {!sidebarCollapsed && "Compose"}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="space-y-1 px-2">
              <button
                onClick={() => {
                  setActiveFolder("inbox");
                  setCurrentPage(1);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-r-full text-sm font-medium transition-colors ${
                  activeFolder === "inbox" 
                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Inbox className="h-5 w-5" />
                {!sidebarCollapsed && (
                  <>
                    <span>Inbox</span>
                    {allEmailsList.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {allEmailsList.length}
                      </Badge>
                    )}
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setActiveFolder("starred");
                  setCurrentPage(1);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-r-full text-sm font-medium transition-colors ${
                  activeFolder === "starred" 
                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Star className="h-5 w-5" />
                {!sidebarCollapsed && (
                  <>
                    <span>Starred</span>
                    {allEmailsList.filter((e: GmailEmail) => e.isImportant).length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {allEmailsList.filter((e: GmailEmail) => e.isImportant).length}
                      </Badge>
                    )}
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveFolder("sent");
                  setCurrentPage(1);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-r-full text-sm font-medium transition-colors ${
                  activeFolder === "sent" 
                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <SendIcon className="h-5 w-5" />
                {!sidebarCollapsed && (
                  <>
                    <span>Sent</span>
                    {gmailStatus?.gmailAddress && (() => {
                      const sentCount = allEmailsList.filter((e: GmailEmail) => 
                        e.fromEmail?.toLowerCase() === gmailStatus.gmailAddress.toLowerCase()
                      ).length;
                      return sentCount > 0 ? (
                        <Badge variant="secondary" className="ml-auto">
                          {sentCount}
                        </Badge>
                      ) : null;
                    })()}
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveFolder("drafts");
                  setCurrentPage(1);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-r-full text-sm font-medium transition-colors ${
                  activeFolder === "drafts" 
                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <FileText className="h-5 w-5" />
                {!sidebarCollapsed && (
                  <>
                    <span>Drafts</span>
                    <Badge variant="secondary" className="ml-auto">0</Badge>
                  </>
                )}
              </button>

              {!sidebarCollapsed && (
                <div className="pt-4 px-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Labels</span>
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* Sync Button */}
          <div className="p-4 border-t">
            <Button 
              onClick={handleSync} 
              disabled={isSyncing}
              variant="ghost"
              className="w-full justify-start"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {!sidebarCollapsed && "Sync"}
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar - Search and Actions */}
          <div className="border-b bg-white dark:bg-gray-900 px-4 py-2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search Bar */}
            <div className="flex-1 relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search mail"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg"
              />
            </div>

            {/* Top Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="h-8 w-8 p-0"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Settings" onClick={handleSettings}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Help" onClick={handleHelp}>
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Email List and Viewer */}
          <div className="flex-1 flex overflow-hidden">
            {/* Email List - Gmail Style */}
            <div className={`${selectedEmail ? 'hidden lg:block w-96' : 'flex-1'} border-r bg-white dark:bg-gray-900 flex flex-col overflow-hidden`}>
              {/* Email List Header */}
              <div className="px-4 py-2 border-b flex items-center gap-2 bg-gray-50 dark:bg-gray-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllEmails}
                  className="h-8 w-8 p-0"
                >
                  {selectedEmails.size === displayEmails.length && displayEmails.length > 0 ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleDelete} title="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="flex-1" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentPage === 1 ? `1-${Math.min(displayEmails.length, EMAILS_PER_PAGE)}` : `${(currentPage - 1) * EMAILS_PER_PAGE + 1}-${Math.min(currentPage * EMAILS_PER_PAGE, totalEmails)}`} of {totalEmails}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Email List Items */}
              <ScrollArea className="flex-1">
                {emailsLoading && currentPage === 1 ? (
                  <div className="flex items-center justify-center p-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (!emailsResponse && !emailsLoading) ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No emails found</p>
                    <p className="text-sm mt-2">Click "Sync" to load your Gmail messages</p>
                  </div>
                ) : displayEmails.length === 0 && emailsResponse?.total === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No emails found</p>
                    {activeFolder === "drafts" && (
                      <p className="text-sm mt-2">Drafts are not currently stored in the system</p>
                    )}
                  </div>
                ) : displayEmails.length === 0 && emailsResponse?.total > 0 && activeFolder !== "drafts" ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
                    <p>Loading emails... ({emailsResponse.total} total)</p>
                  </div>
                ) : displayEmails.length === 0 && activeFolder === "drafts" ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No drafts</p>
                    <p className="text-sm mt-2">Drafts are not currently stored in the system</p>
                  </div>
                ) : displayEmails.length === 0 && activeFolder === "sent" ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <SendIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sent emails</p>
                    <p className="text-sm mt-2">Sent emails will appear here once you send emails through Gmail</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {displayEmails.map((email: GmailEmail, index) => (
                      <div
                        key={email.id}
                        ref={index === displayEmails.length - 1 ? lastEmailElementRef : null}
                        className={`flex items-start gap-2 px-2 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-l-4 ${
                          selectedEmail?.id === email.id 
                            ? 'bg-blue-50 dark:bg-blue-950/20 border-l-blue-500' 
                            : email.isRead 
                              ? 'border-l-transparent' 
                              : 'border-l-blue-500 bg-gray-50 dark:bg-gray-800/50'
                        }`}
                        onClick={(e) => {
                          // Don't select if clicking checkbox
                          if ((e.target as HTMLElement).closest('.email-checkbox')) {
                            return;
                          }
                          setSelectedEmail(email);
                          setShowEmailDetails(true);
                        }}
                      >
                        {/* Checkbox */}
                        <div 
                          className="email-checkbox flex items-center pt-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEmailSelection(email.id);
                          }}
                        >
                          <Checkbox
                            checked={selectedEmails.has(email.id)}
                            onCheckedChange={() => toggleEmailSelection(email.id)}
                            className="h-4 w-4"
                          />
                        </div>

                        {/* Star */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(email);
                          }}
                          className="pt-1"
                          title={email.isImportant ? "Unstar" : "Star"}
                        >
                          <Star 
                            className={`h-4 w-4 ${
                              email.isImportant 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-400 hover:text-yellow-400'
                            }`} 
                          />
                        </button>

                        {/* Email Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-sm truncate ${!email.isRead ? 'font-semibold' : 'font-medium'}`}>
                              {email.fromName || email.fromEmail}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {formatDate(email.receivedAt.toString())}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm truncate ${!email.isRead ? 'font-semibold' : ''}`}>
                              {email.subject || 'No Subject'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 truncate">
                            {getEmailPreview(email)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {isLoadingMore && (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">Loading more emails...</span>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Email Viewer - Gmail Style */}
            <div className={`${selectedEmail ? 'flex-1' : 'hidden lg:flex'} flex flex-col overflow-hidden bg-white dark:bg-gray-900`}>
              {selectedEmail ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Email Header */}
                  <div className="border-b px-6 py-4">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 lg:hidden" 
                            onClick={() => setSelectedEmail(null)}
                            title="Back"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <h2 className="text-xl font-normal break-words">
                            {selectedEmail.subject || 'No Subject'}
                          </h2>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedEmail.fromName || selectedEmail.fromEmail}</span>
                            <span className="text-gray-400">&lt;{selectedEmail.fromEmail}&gt;</span>
                          </div>
                          <span className="text-gray-400">{formatDate(selectedEmail.receivedAt.toString())}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 lg:hidden" 
                          onClick={() => setSelectedEmail(null)}
                          title="Close"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleDelete()}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleToggleStar(selectedEmail)}
                          title={selectedEmail.isImportant ? "Unstar" : "Star"}
                        >
                          <Star className={`h-4 w-4 ${selectedEmail.isImportant ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleMarkAsRead(selectedEmail, !selectedEmail.isRead)}
                          title={selectedEmail.isRead ? "Mark as unread" : "Mark as read"}
                        >
                          <Mail className={`h-4 w-4 ${!selectedEmail.isRead ? 'text-blue-500' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="More options">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hidden lg:flex" 
                          onClick={() => setSelectedEmail(null)}
                          title="Close"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hidden lg:flex" 
                          onClick={() => setSelectedEmail(null)}
                          title="Slide back"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReplyMode(true)}
                        className="rounded-full"
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full"
                        onClick={handleForward}
                      >
                        Forward
                      </Button>
                    </div>
                  </div>

                  {/* Email Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="email-content-wrapper" style={{ minHeight: '200px', width: '100%' }}>
                    {selectedEmail.bodyHtml ? (() => {
                      // Process HTML content - decode if needed
                      let htmlContent = processHtmlContent(selectedEmail.bodyHtml);
                      
                      // Check if it's a full HTML document
                      const isFullDocument = htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<html');
                      
                      if (isFullDocument) {
                        // Try to extract body content
                        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                        if (bodyMatch && bodyMatch[1]) {
                          htmlContent = bodyMatch[1];
                        } else {
                          // If no body tag, try to extract content between html tags
                          const htmlMatch = htmlContent.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
                          if (htmlMatch && htmlMatch[1]) {
                            // Remove head tag content if present
                            htmlContent = htmlMatch[1].replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
                          }
                        }
                      }
                      
                      // Create a complete HTML document for iframe
                      const fullHtmlDoc = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="utf-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            * {
                              box-sizing: border-box;
                            }
                            body {
                              margin: 0;
                              padding: 16px;
                              font-family: 'Roboto', 'RobotoDraft', 'Helvetica', 'Arial', sans-serif;
                              font-size: 14px;
                              line-height: 1.5;
                              color: #202124;
                              background-color: #fff;
                            }
                            img {
                              max-width: 100%;
                              height: auto;
                              display: block;
                            }
                            a {
                              color: #1a73e8;
                              text-decoration: none;
                            }
                            a:hover {
                              text-decoration: underline;
                            }
                            table {
                              border-collapse: collapse;
                              width: 100%;
                              max-width: 100%;
                            }
                            td, th {
                              padding: 8px;
                            }
                            p {
                              margin: 0 0 12px 0;
                            }
                            div {
                              max-width: 100%;
                            }
                          </style>
                        </head>
                        <body>
                          ${htmlContent}
                        </body>
                        </html>
                      `;
                      
                      return (
                        <iframe
                          srcDoc={fullHtmlDoc}
                          className="gmail-email-content"
                          style={{
                            width: '100%',
                            minHeight: '400px',
                            border: 'none',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            overflow: 'auto'
                          }}
                          sandbox="allow-same-origin"
                          title="Email content"
                          onLoad={(e) => {
                            // Auto-resize iframe to content height
                            const iframe = e.currentTarget;
                            try {
                              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                              if (iframeDoc) {
                                const height = Math.max(
                                  iframeDoc.body.scrollHeight,
                                  iframeDoc.body.offsetHeight,
                                  iframeDoc.documentElement.clientHeight,
                                  iframeDoc.documentElement.scrollHeight,
                                  iframeDoc.documentElement.offsetHeight
                                );
                                iframe.style.height = `${height + 32}px`;
                              }
                            } catch (err) {
                              // Cross-origin or other error, use default height
                              console.log('Could not auto-resize iframe:', err);
                            }
                          }}
                        />
                      );
                    })() : selectedEmail.bodyText ? (
                      <div 
                        className="gmail-email-content max-w-full whitespace-pre-wrap"
                        style={{
                          padding: '16px',
                          backgroundColor: '#fff',
                          color: '#202124',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          fontFamily: 'Roboto, RobotoDraft, Helvetica, Arial, sans-serif',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          borderRadius: '4px'
                        }}
                      >
                        {selectedEmail.bodyText}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-center py-8">
                        No content available for this email
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Reply Section */}
                  {replyMode && (
                    <div className="border-t px-6 py-4 bg-gray-50 dark:bg-gray-800">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Reply to: {selectedEmail.fromEmail}</label>
                          <Textarea
                            placeholder="Type your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={6}
                            className="bg-white dark:bg-gray-900"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={handleSendReply} 
                            disabled={replyMutation.isPending || !replyText.trim()}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                          >
                            {replyMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Send
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setReplyMode(false);
                              setReplyText("");
                            }}
                            className="rounded-full"
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowAIImprovement(true)}
                            disabled={aiImproveMutation.isPending || !replyText.trim()}
                            className="rounded-full"
                          >
                            <Wand2 className="w-4 h-4 mr-1" />
                            AI Improve
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Mail className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Select an email</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Choose an email from the list to view its content
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compose Modal - Gmail Style (Bottom Right) */}
      {composeMode && (
        <div className="fixed bottom-0 right-4 w-[600px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 shadow-2xl rounded-t-lg border border-gray-300 dark:border-gray-700 z-50 flex flex-col max-h-[80vh]">
          {/* Compose Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 dark:bg-gray-800 rounded-t-lg">
              <h3 className="text-sm font-medium">New Message</h3>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    // Minimize functionality can be added
                  }}
                >
                  <span className="text-xs">−</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setComposeMode(false);
                    setComposeData({ to: "", subject: "", body: "", attachments: [] });
                    setAttachmentFiles([]);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Compose Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-0">
                <div className="border-b pb-2 mb-2">
                  <Input
                    placeholder="To"
                    value={composeData.to}
                    onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                    className="border-0 focus-visible:ring-0 shadow-none px-0"
                  />
                </div>
                <div className="border-b pb-2 mb-2">
                  <Input
                    placeholder="Subject"
                    value={composeData.subject}
                    onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                    className="border-0 focus-visible:ring-0 shadow-none px-0"
                  />
                </div>
                <div className="pt-2">
                  <Textarea
                    placeholder="Compose email"
                    value={composeData.body}
                    onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                    rows={12}
                    className="border-0 focus-visible:ring-0 shadow-none resize-none"
                  />
                </div>
                
                {/* Attachments */}
                {composeData.attachments.length > 0 && (
                  <div className="px-4 py-2 space-y-2 border-t">
                    <div className="space-y-2">
                      {composeData.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{attachment.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(attachment.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAttachmentRemove(index)}
                            className="flex-shrink-0 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compose Footer */}
            <div className="border-t px-4 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleCompose}
                  disabled={composeMutation.isPending || uploadAttachmentsMutation.isPending || !composeData.to.trim() || !composeData.subject.trim() || !composeData.body.trim()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                >
                  {composeMutation.isPending || uploadAttachmentsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    onChange={handleAttachmentAdd}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  />
                  <Button variant="ghost" type="button" size="sm" className="h-8 w-8 p-0">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </label>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAIComposer(true)}
                  disabled={aiComposeMutation.isPending}
                  className="h-8 w-8 p-0"
                  title="AI Write"
                >
                  <Bot className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAIImprovement(true)}
                  disabled={aiImproveMutation.isPending || (!composeData.subject && !composeData.body)}
                  className="h-8 w-8 p-0"
                  title="AI Improve"
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => {
                setComposeMode(false);
                setComposeData({ to: "", subject: "", body: "", attachments: [] });
                setAttachmentFiles([]);
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

        {/* AI Composer Modal */}
        {showAIComposer && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-500" />
                    AI Email Writer
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowAIComposer(false);
                      setAiPrompt("");
                      setAiContext("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">What would you like to write about? *</label>
                  <Textarea
                    placeholder="e.g., Send a follow-up email to a customer about their inquiry..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Context (Optional)</label>
                  <Textarea
                    placeholder="e.g., Customer name is John, they inquired about vacation packages to Bali..."
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tone</label>
                    <Select value={aiTone} onValueChange={setAiTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Length</label>
                    <Select value={aiLength} onValueChange={setAiLength}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => aiComposeMutation.mutate({ 
                      prompt: aiPrompt, 
                      context: aiContext,
                      tone: aiTone,
                      length: aiLength
                    })}
                    disabled={!aiPrompt.trim() || aiComposeMutation.isPending}
                    className="flex-1"
                  >
                    {aiComposeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        Generate Email
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowAIComposer(false);
                      setAiPrompt("");
                      setAiContext("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Improvement Modal */}
        {showAIImprovement && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-purple-500" />
                    AI Email Improvement
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAIImprovement(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Improvement Type</label>
                  <Select value={improvementType} onValueChange={setImprovementType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Improvement</SelectItem>
                      <SelectItem value="tone">Adjust Tone</SelectItem>
                      <SelectItem value="concise">Make More Concise</SelectItem>
                      <SelectItem value="persuasive">Make More Persuasive</SelectItem>
                      <SelectItem value="formal">Make More Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Current Email Preview:</p>
                  <div className="space-y-1">
                    {composeMode && composeData.subject && (
                      <p className="text-sm"><strong>Subject:</strong> {composeData.subject.substring(0, 50)}...</p>
                    )}
                    <p className="text-sm">
                      <strong>Body:</strong> {
                        composeMode ? 
                          composeData.body.substring(0, 100) + (composeData.body.length > 100 ? '...' : '') :
                          replyText.substring(0, 100) + (replyText.length > 100 ? '...' : '')
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => aiImproveMutation.mutate({ 
                      subject: composeMode ? composeData.subject : '',
                      body: composeMode ? composeData.body : replyText,
                      improvementType
                    })}
                    disabled={aiImproveMutation.isPending}
                    className="flex-1"
                  >
                    {aiImproveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Improving...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Improve Email
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowAIImprovement(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    </Layout>
  );
}
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
  Archive,
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
  Paperclip
} from "lucide-react";
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
  const observer = useRef<IntersectionObserver>();

  const EMAILS_PER_PAGE = 20;

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
    if (emailsResponse?.emails) {
      if (currentPage === 1) {
        setAllEmails(emailsResponse.emails);
      } else {
        setAllEmails(prev => [...prev, ...emailsResponse.emails]);
      }
      setHasMore(emailsResponse.emails.length === EMAILS_PER_PAGE);
      setIsLoadingMore(false);
    }
  }, [emailsResponse, currentPage]);

  // Reset when search changes
  useEffect(() => {
    setCurrentPage(1);
    setAllEmails([]);
    setHasMore(true);
  }, [searchQuery]);

  const totalEmails = emailsResponse?.total || 0;
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
      <div className="container max-w-6xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gmail Emails</h1>
              <p className="text-muted-foreground">
                Connected to {gmailStatus.gmailAddress}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setComposeMode(true)} 
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Compose
            </Button>
            <Button 
              onClick={handleSync} 
              disabled={isSyncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Emails
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Email List */}
          <div className={`col-span-12 lg:col-span-5 space-y-4 ${showEmailDetails ? 'hidden lg:block' : ''}`}>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Email List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Emails</CardTitle>
                  <Badge variant="secondary">
                    {totalEmails} emails
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {emailsLoading && currentPage === 1 ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : allEmails.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      No emails found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {allEmails.map((email: GmailEmail, index) => (
                        <div
                          key={email.id}
                          ref={index === allEmails.length - 1 ? lastEmailElementRef : null}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedEmail?.id === email.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => {
                            setSelectedEmail(email);
                            setShowEmailDetails(true); // Show details panel on mobile
                          }}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">
                                  {email.fromName || email.fromEmail}
                                </span>
                                {email.isImportant && (
                                  <Star className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                              {!email.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            
                            <h4 className="font-medium text-sm line-clamp-1">
                              {email.subject || 'No Subject'}
                            </h4>
                          
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {getEmailPreview(email)}
                            </p>
                          
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(email.receivedAt.toString())}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isLoadingMore && (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading more emails...</span>
                        </div>
                      )}
                  </div>
                )}
                </ScrollArea>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Email Content */}
          <div className={`col-span-12 lg:col-span-7 ${!showEmailDetails ? 'hidden lg:block' : ''}`}>
            {selectedEmail ? (
              <Card className="h-fit">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <CardTitle className="text-lg break-words">
                        {selectedEmail.subject || 'No Subject'}
                      </CardTitle>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{selectedEmail.fromName || selectedEmail.fromEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{formatDate(selectedEmail.receivedAt.toString())}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEmail(null);
                        setShowEmailDetails(false); // Hide details panel on mobile
                        setReplyMode(false);
                        setReplyText("");
                      }}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Content */}
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

                  <Separator />

                  {/* Reply Section */}
                  <div className="space-y-4">
                    {!replyMode ? (
                      <Button 
                        onClick={() => setReplyMode(true)}
                        className="flex items-center gap-2"
                      >
                        <Reply className="h-4 w-4" />
                        Reply
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Reply to: {selectedEmail.fromEmail}</label>
                          <Textarea
                            placeholder="Type your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={6}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setShowAIImprovement(true)}
                              disabled={aiImproveMutation.isPending || !replyText.trim()}
                              className="flex-1"
                            >
                              <Wand2 className="w-4 h-4 mr-1" />
                              {aiImproveMutation.isPending ? "Improving..." : "AI Improve"}
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={handleSendReply} 
                              disabled={replyMutation.isPending || !replyText.trim()}
                              className="flex items-center gap-2 w-full sm:w-auto"
                            >
                              {replyMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              Send Reply
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setReplyMode(false);
                                setReplyText("");
                              }}
                              className="w-full sm:w-auto"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-fit">
                <CardContent className="flex items-center justify-center p-8">
                  <div className="text-center space-y-2">
                    <Mail className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-medium">Select an email</h3>
                    <p className="text-muted-foreground">
                      Choose an email from the list to view its content
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Compose Modal */}
        {composeMode && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl compose-modal">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Compose Email
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setComposeMode(false);
                      setComposeData({ to: "", subject: "", body: "", attachments: [] });
                      setAttachmentFiles([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <Input
                    placeholder="recipient@example.com"
                    value={composeData.to}
                    onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Email subject"
                    value={composeData.subject}
                    onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Type your message..."
                    value={composeData.body}
                    onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                    rows={10}
                  />
                </div>
                
                {/* Attachments */}
                {composeData.attachments.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Attachments</label>
                    <div className="space-y-2">
                      {composeData.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
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
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={handleAttachmentAdd}
                        className="hidden"
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      />
                      <Button variant="outline" type="button" className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Attach Files
                      </Button>
                    </label>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAIComposer(true)}
                      disabled={aiComposeMutation.isPending}
                      className="flex-1"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      {aiComposeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "AI Write"
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAIImprovement(true)}
                      disabled={aiImproveMutation.isPending || (!composeData.subject && !composeData.body)}
                      className="flex-1"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      {aiImproveMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Improving...
                        </>
                      ) : (
                        "AI Improve"
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Button 
                      onClick={handleCompose}
                      disabled={composeMutation.isPending || uploadAttachmentsMutation.isPending || !composeData.to.trim() || !composeData.subject.trim() || !composeData.body.trim()}
                      className="flex items-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {composeMutation.isPending || uploadAttachmentsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Email
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setComposeMode(false);
                        setComposeData({ to: "", subject: "", body: "", attachments: [] });
                        setAttachmentFiles([]);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      </div>
    </Layout>
  );
}
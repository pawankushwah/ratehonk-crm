import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmailCampaignSchema, type EmailCampaign, type InsertEmailCampaign } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Plus, Search, Mail, Users, TrendingUp, Clock, 
  Send, Edit, Copy, Trash2, Eye, BarChart3,
  Calendar, Target, Zap, MoreHorizontal, ExternalLink, RefreshCw
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { UsersIcon, Settings, TestTube } from "lucide-react";
import { EmailSettingsPanel } from "@/components/email/EmailSettingsPanel";
import { CampaignBuilder } from "@/components/campaigns/CampaignBuilder";

export default function EmailCampaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [isEmailSettingsPanelOpen, setIsEmailSettingsPanelOpen] = useState(false);
  
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertEmailCampaign>({
    resolver: zodResolver(insertEmailCampaignSchema),
    defaultValues: {
      tenantId: tenant?.id || 1,
      name: "",
      subject: "",
      content: "",
      type: "newsletter",
      status: "draft",
      targetAudience: "all_customers"
    }
  });

  const { data: campaigns = [], isLoading } = useQuery<EmailCampaign[]>({
    queryKey: [`/api/tenants/${tenant?.id}/email-campaigns`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tenants/${tenant?.id}/email-campaigns`);
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
    enabled: !!tenant?.id,
  });

  const { data: stats = {} } = useQuery<{
    totalCampaigns: number;
    totalSent: number;
    avgOpenRate: string;
    avgClickRate: string;
  }>({
    queryKey: [`/api/tenants/${tenant?.id}/email-campaigns/stats`],
    enabled: !!tenant?.id
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: InsertEmailCampaign) => {
      console.log("Creating campaign with data:", data);
      try {
        const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/email-campaigns`, data);
        const result = await response.json();
        console.log("Campaign creation response:", result);
        return result;
      } catch (error) {
        console.error("Campaign creation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Campaign created successfully:", data);
      // Force refetch of campaigns data
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns/stats`] });
      queryClient.refetchQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns`] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Campaign Created!",
        description: "Your email campaign has been created successfully."
      });
    },
    onError: (error: any) => {
      console.error("Campaign creation failed:", error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create email campaign",
        variant: "destructive"
      });
    }
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/email-campaigns/${campaignId}/send`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns/stats`] });
      toast({
        title: "Campaign Sent! 📧",
        description: "Your email campaign is being sent to subscribers."
      });
    }
  });

  const createAndSendCampaignMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const createResponse = await apiRequest("POST", `/api/tenants/${tenant?.id}/email-campaigns`, data);
      const campaign = await createResponse.json();
      await apiRequest("POST", `/api/tenants/${tenant?.id}/email-campaigns/${campaign.id}/send`);
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns/stats`] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Campaign Sent! 📧",
        description: "Your email campaign has been sent to all recipients."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send email campaign",
        variant: "destructive"
      });
    }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await apiRequest("DELETE", `/api/tenants/${tenant?.id}/email-campaigns/${campaignId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns/stats`] });
      toast({
        title: "Campaign Deleted",
        description: "Email campaign has been removed."
      });
    }
  });

  const duplicateCampaignMutation = useMutation({
    mutationFn: async (campaign: EmailCampaign) => {
      const duplicateData = {
        name: `${campaign.name} (Copy)`,
        subject: campaign.subject,
        content: campaign.content,
        type: campaign.type,
        status: "draft",
        targetAudience: campaign.targetAudience,
        recipientCount: campaign.recipientCount ?? 0,
      };
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/email-campaigns`, duplicateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns`] });
      toast({
        title: "Campaign Duplicated",
        description: "Campaign has been duplicated as a draft."
      });
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async (data: { campaignId: number; updates: Partial<InsertEmailCampaign> }) => {
      const response = await apiRequest("PUT", `/api/tenants/${tenant?.id}/email-campaigns/${data.campaignId}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns`] });
      setIsEditDialogOpen(false);
      setSelectedCampaign(null);
      toast({
        title: "Campaign Updated",
        description: "Campaign has been updated successfully."
      });
    }
  });

  const onSubmit = (data: InsertEmailCampaign) => {
    createCampaignMutation.mutate(data);
  };

  const filteredCampaigns = campaigns.filter((campaign: EmailCampaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "scheduled": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "draft": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "paused": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "welcome": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "booking_confirmation": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "follow_up": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "newsletter": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="rounded-lg shadow-sm mx-2 my-2">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="w-full h-[72px] flex items-center bg-white px-[18px] py-4 rounded-t-xl border-b border-[#E3E8EF] shadow-[0px_1px_6px_0px_rgba(0,0,0,0.05)]">
            <h1 className="font-inter font-medium text-[20px] leading-[24px] text-[#121926]">
              Email Campaigns
            </h1>
            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => setIsEmailSettingsPanelOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm hover:bg-gray-50 cursor-pointer"
                title="Email Settings"
              >
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Create Campaign Button */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch(`/api/tenants/${tenant?.id}/email-campaigns/create-dummy`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });
                  const result = await response.json();
                  if (response.ok) {
                    toast({
                      title: "Dummy Campaigns Created!",
                      description: `Successfully created ${result.campaigns?.length || 7} dummy campaigns for testing.`,
                    });
                    queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns`] });
                    queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-campaigns/stats`] });
                  } else {
                    toast({
                      title: "Error",
                      description: result.message || "Failed to create dummy campaigns",
                      variant: "destructive",
                    });
                  }
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to create dummy campaigns",
                    variant: "destructive",
                  });
                }
              }}
            >
              <TestTube className="mr-2 h-4 w-4" />
              Create Dummy Campaigns
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
           
            
            <DialogContent className="max-w-7xl max-h-[90vh] p-0 flex flex-col" aria-describedby={undefined}>
              <DialogHeader className="sr-only">
                <DialogTitle>Create campaign</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto min-h-0">
                <CampaignBuilder
                  onSave={(data) => {
                    // Transform CampaignBuilder data to InsertEmailCampaign format
                    const campaignData: any = {
                      tenantId: tenant?.id || 1,
                      name: data.name,
                      subject: data.subject || "",
                      content: data.content,
                      type: data.objective === "lead_generation" ? "welcome" : 
                            data.objective === "package_promotion" ? "newsletter" :
                            data.objective === "abandoned_inquiry" ? "follow_up" : "newsletter",
                      status: data.scheduledAt ? "scheduled" : "draft",
                      targetAudience: data.audienceType === "segment" && data.segmentId 
                        ? `segment_${data.segmentId}` 
                        : data.audienceType === "manual" && data.selectedRecipients?.length
                        ? "manual_selection"
                        : "all_customers",
                      scheduledAt: data.scheduledAt,
                      templateId: data.templateId,
                      channel: data.channel,
                      objective: data.objective,
                      fromName: data.fromName || undefined,
                      fromEmail: data.fromEmail || undefined,
                      replyTo: data.replyTo || undefined,
                      selectedRecipients: data.selectedRecipients || [],
                      recipientCount: data.recipientCount ?? (data.audienceType === "manual"
                        ? (data.selectedRecipients?.length || 0)
                        : 0),
                    };
                    createCampaignMutation.mutate(campaignData);
                  }}
                  onSend={(data) => {
                    const campaignData: any = {
                      tenantId: tenant?.id || 1,
                      name: data.name,
                      subject: data.subject || "",
                      content: data.content,
                      type: data.objective === "lead_generation" ? "welcome" : 
                            data.objective === "package_promotion" ? "newsletter" :
                            data.objective === "abandoned_inquiry" ? "follow_up" : "newsletter",
                      status: "draft",
                      targetAudience: data.audienceType === "segment" && data.segmentId 
                        ? `segment_${data.segmentId}` 
                        : data.audienceType === "manual" && data.selectedRecipients?.length
                        ? "manual_selection"
                        : "all_customers",
                      scheduledAt: data.scheduledAt,
                      templateId: data.templateId,
                      channel: data.channel,
                      objective: data.objective,
                      fromName: data.fromName || undefined,
                      fromEmail: data.fromEmail || undefined,
                      replyTo: data.replyTo || undefined,
                      selectedRecipients: data.selectedRecipients || [],
                      recipientCount: data.recipientCount ?? (data.audienceType === "manual"
                        ? (data.selectedRecipients?.length || 0)
                        : 0),
                    };
                    createAndSendCampaignMutation.mutate(campaignData);
                  }}
                  isLoading={createCampaignMutation.isPending || createAndSendCampaignMutation.isPending}
                />
              </div>
            </DialogContent>
          </Dialog>
          </div>
          
          <div className="flex flex-wrap items-center gap-3  p-4 rounded-lg shadow-sm">
      
      

      <Link href="/email-automations">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <Zap className="w-4 h-4" />
          Email Workflows
        </Button>
      </Link>

      <Link href="/email-ab-tests">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <Target className="w-4 h-4" />
          A/B Testing
        </Button>
      </Link>

      <Link href="/email-segments">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <UsersIcon className="w-4 h-4" />
          Audience Segments
        </Button>
      </Link>

    
      <Link href="/email-test">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <TestTube className="w-4 h-4" />
          Email Testing
        </Button>
      </Link>

      {/* <Link href="/gmail-emails">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <Mail className="w-4 h-4" />
          Gmail Integration
        </Button>
      </Link> */}
    </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Campaigns</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{(stats as any)?.totalCampaigns || 0}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Emails Sent</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{(stats as any)?.totalSent || 0}</p>
                </div>
                <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Open Rate</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{(stats as any)?.avgOpenRate || "0"}%</p>
                </div>
                <Eye className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Click Rate</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{(stats as any)?.avgClickRate || "0"}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campaigns Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Open Rate</TableHead>
                <TableHead>Click Rate</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-lg font-medium mb-1">No campaigns found</p>
                      <p className="text-sm">
                        {searchTerm || statusFilter !== "all" 
                          ? "Try adjusting your search or filter criteria"
                          : "Create your first email campaign to start engaging with customers"
                        }
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign: EmailCampaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="font-medium">{campaign.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{campaign.subject}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(campaign.type)}>
                        {campaign.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {campaign.status === "sent" ? (
                        <span title={`${campaign.recipientCount || 0} total recipients`}>
                          {(campaign as any).deliveredCount ?? campaign.recipientCount ?? 0} sent
                          {((campaign as any).failedCount ?? 0) > 0 && (
                            <span className="text-muted-foreground"> ({(campaign as any).failedCount} failed)</span>
                          )}
                        </span>
                      ) : (
                        campaign.recipientCount || 0
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.sentAt ? format(new Date(campaign.sentAt), "MMM d, yyyy") : '-'}
                    </TableCell>
                    <TableCell>
                      {campaign.openRate ? `${campaign.openRate}%` : '-'}
                    </TableCell>
                    <TableCell>
                      {campaign.clickRate ? `${campaign.clickRate}%` : '-'}
                    </TableCell>
                    <TableCell>
                      {campaign.createdAt ? format(new Date(campaign.createdAt), "MMM d, yyyy") : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setIsPreviewDialogOpen(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {campaign.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() => sendCampaignMutation.mutate(campaign.id)}
                              disabled={sendCampaignMutation.isPending}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send Now
                            </DropdownMenuItem>
                          )}
                          {campaign.status === "sent" && (
                            <DropdownMenuItem
                              onClick={() => sendCampaignMutation.mutate(campaign.id)}
                              disabled={sendCampaignMutation.isPending}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Resend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => duplicateCampaignMutation.mutate(campaign)}
                            disabled={duplicateCampaignMutation.isPending}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setIsAnalyticsDialogOpen(true);
                            }}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                            disabled={deleteCampaignMutation.isPending}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {filteredCampaigns.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No email campaigns found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first email campaign to start engaging with your travel customers"
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Campaign
                </Button>
              )}
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      
      <EmailSettingsPanel 
        open={isEmailSettingsPanelOpen} 
        onOpenChange={setIsEmailSettingsPanelOpen} 
      />

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0 flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="sr-only">
            <DialogTitle>Edit campaign</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {selectedCampaign && (
              <CampaignBuilder
                initialData={{
                  name: selectedCampaign.name,
                  channel: (selectedCampaign as any).channel || "email",
                  objective: (selectedCampaign as any).objective || 
                            (selectedCampaign.type === "welcome" ? "lead_generation" :
                            selectedCampaign.type === "newsletter" ? "package_promotion" :
                            selectedCampaign.type === "follow_up" ? "abandoned_inquiry" : "lead_generation"),
                  subject: selectedCampaign.subject,
                  content: selectedCampaign.content,
                  fromName: (selectedCampaign as any).fromName || "Vani Technologies Travel",
                  fromEmail: (selectedCampaign as any).fromEmail || "noreply@vanitechnologies.in",
                  replyTo: (selectedCampaign as any).replyTo || "support@vanitechnologies.in",
                  scheduledAt: selectedCampaign.scheduledAt ? new Date(selectedCampaign.scheduledAt) : undefined,
                  timezone: (selectedCampaign as any).timezone || "UTC",
                  segmentId: (selectedCampaign as any).segmentId,
                  templateId: (selectedCampaign as any).templateId,
                  internalNotes: (selectedCampaign as any).internalNotes,
                  selectedRecipients: (selectedCampaign as any).selectedRecipients || [],
                  audienceType: (selectedCampaign as any).audienceType || "manual",
                }}
                onSave={(data) => {
                  const recipientCount = data.recipientCount ?? (data.audienceType === "manual"
                    ? (data.selectedRecipients?.length || 0)
                    : 0);
                  updateCampaignMutation.mutate({
                    campaignId: selectedCampaign.id,
                    updates: {
                      name: data.name,
                      subject: data.subject,
                      content: data.content,
                      channel: data.channel,
                      objective: data.objective,
                      templateId: data.templateId,
                      scheduledAt: data.scheduledAt,
                      selectedRecipients: data.selectedRecipients,
                      recipientCount,
                      fromName: data.fromName || undefined,
                      fromEmail: data.fromEmail || undefined,
                      replyTo: data.replyTo || undefined,
                    },
                  });
                }}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCampaign(null);
                }}
                isLoading={updateCampaignMutation.isPending}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Campaign Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Preview</DialogTitle>
            <DialogDescription>
              Preview how your campaign will appear to recipients
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">From:</span>
                  <span className="ml-2">Vani Technologies Travel &lt;noreply@vanitechnologies.in&gt;</span>
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Subject:</span>
                  <span className="ml-2 font-semibold">{selectedCampaign.subject}</span>
                </div>
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-600">To:</span>
                  <span className="ml-2">recipient@example.com</span>
                </div>
              </div>
              <div className="border rounded-lg p-6 bg-white">
                <div 
                  className="prose max-w-none" 
                  dangerouslySetInnerHTML={{ __html: selectedCampaign.content }} 
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={isAnalyticsDialogOpen} onOpenChange={setIsAnalyticsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Analytics</DialogTitle>
            <DialogDescription>
              Detailed performance metrics for {selectedCampaign?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      {selectedCampaign.status === "sent" ? "Emails Sent" : "Recipients"}
                    </div>
                    <div className="text-2xl font-bold">
                      {(selectedCampaign as any).deliveredCount ?? selectedCampaign.recipientCount ?? 0}
                      {selectedCampaign.status === "sent" && ((selectedCampaign as any).failedCount ?? 0) > 0 && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          / {selectedCampaign.recipientCount} ({(selectedCampaign as any).failedCount} failed)
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Open Rate</div>
                    <div className="text-2xl font-bold">{selectedCampaign.openRate || "0"}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Click Rate</div>
                    <div className="text-2xl font-bold">{selectedCampaign.clickRate || "0"}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                    <div className="text-2xl font-bold">
                      <Badge className={getStatusColor(selectedCampaign.status)}>
                        {selectedCampaign.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Campaign Name:</span>
                    <span className="font-medium">{selectedCampaign.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <Badge variant="outline" className={getTypeColor(selectedCampaign.type)}>
                      {selectedCampaign.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <span>{selectedCampaign.createdAt ? format(new Date(selectedCampaign.createdAt), "MMM d, yyyy 'at' h:mm a") : '-'}</span>
                  </div>
                  {selectedCampaign.sentAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sent:</span>
                      <span>{format(new Date(selectedCampaign.sentAt), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                  )}
                  {selectedCampaign.scheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Scheduled:</span>
                      <span>{format(new Date(selectedCampaign.scheduledAt), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Performance chart will be displayed here</p>
                      <p className="text-sm">(Coming soon)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
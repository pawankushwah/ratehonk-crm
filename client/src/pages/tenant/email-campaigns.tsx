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
  Calendar, Target, Zap, MoreHorizontal
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { UsersIcon, Settings, TestTube } from "lucide-react";

export default function EmailCampaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  
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
      // Use the database-backed API endpoint
      const response = await fetch(`/api/tenants/${tenant?.id}/email-campaigns`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
    enabled: !!tenant?.id
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
      toast({
        title: "Campaign Sent! 📧",
        description: "Your email campaign is being sent to subscribers."
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
      toast({
        title: "Campaign Deleted",
        description: "Email campaign has been removed."
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
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Campaigns</h1>
            <p className="text-gray-600 dark:text-gray-300">Create and manage your email marketing campaigns</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
           
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Email Campaign</DialogTitle>
                <DialogDescription>
                  Design a beautiful email campaign to engage your travel customers
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Summer Travel Newsletter" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="welcome">Welcome Email</SelectItem>
                              <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                              <SelectItem value="follow_up">Follow Up</SelectItem>
                              <SelectItem value="newsletter">Newsletter</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Discover Amazing Travel Deals This Summer!" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select audience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all_customers">All Customers</SelectItem>
                            <SelectItem value="new_leads">New Leads</SelectItem>
                            <SelectItem value="recent_bookings">Recent Bookings</SelectItem>
                            <SelectItem value="newsletter_subscribers">Newsletter Subscribers</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write your email content here..." 
                            className="min-h-[200px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCampaignMutation.isPending}>
                      {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
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
                <TableHead>Open Rate</TableHead>
                <TableHead>Click Rate</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
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
                    <TableCell>{campaign.recipientCount || 0}</TableCell>
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
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
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
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
    </Layout>
  );
}
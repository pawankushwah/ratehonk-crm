import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Facebook, Instagram, Settings, Save, 
  CheckCircle, XCircle, RefreshCw, ExternalLink,
  AlertCircle, Key, Shield, Zap, TrendingUp, Target, Users,
  Plus, Edit, Trash2, Eye, BarChart3, MessageSquare, Camera, Clock,
  Play, Pause, DollarSign, MousePointer, Share2, Calendar, MapPin,
  FileText, Image, Video, Layers, Globe, Activity, Bell, Filter
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FacebookStatus {
  configured: boolean;
  connected: boolean;
  appId?: string;
  connectedPages?: number;
  lastSync?: string;
  totalLeads?: number;
}

interface FacebookCredentials {
  appId: string;
  appSecret: string;
}

interface FacebookPage {
  id: string;
  name: string;
  category: string;
  followers_count: number;
  instagram_business_account?: {
    id: string;
    username: string;
  };
}

interface FacebookLead {
  id: string;
  form_id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

interface FacebookInsight {
  page_impressions: number;
  page_reach: number;
  page_engagement: number;
  page_fan_adds: number;
}

export default function FacebookBusinessSuiteComplete() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Configuration state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState<FacebookCredentials>({
    appId: "",
    appSecret: ""
  });

  // Campaign state
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignData, setCampaignData] = useState({
    name: "",
    objective: "LEAD_GENERATION",
    budget: "",
    targetAudience: "",
    adText: "",
    callToAction: "LEARN_MORE"
  });

  // Audience state
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [audienceData, setAudienceData] = useState({
    name: "",
    type: "custom",
    source: "website_traffic",
    description: ""
  });

  // Creative state
  const [showCreativeModal, setShowCreativeModal] = useState(false);
  const [creativeData, setCreativeData] = useState({
    name: "",
    type: "image",
    headline: "",
    description: "",
    callToAction: "LEARN_MORE"
  });

  // Pixel state
  const [showPixelModal, setShowPixelModal] = useState(false);
  const [pixelData, setPixelData] = useState({
    name: "",
    website: "",
    events: ["PageView", "Purchase", "Lead"]
  });

  // Fetch Facebook status
  const { data: facebookStatus = {}, isLoading: isLoadingStatus } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/facebook/status`],
    enabled: !!tenant?.id,
  });

  // Fetch Facebook pages
  const { data: facebookPages = [], isLoading: isLoadingPages } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/facebook/pages`],
    enabled: !!tenant?.id && facebookStatus?.connected,
  });

  // Fetch Facebook leads
  const { data: facebookLeads = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/facebook/leads`],
    enabled: !!tenant?.id && (facebookStatus as any)?.connected,
  });

  // Fetch Facebook insights
  const { data: facebookInsights = {}, isLoading: isLoadingInsights } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/facebook/insights`],
    enabled: !!tenant?.id && (facebookStatus as any)?.connected,
  });

  // Configure Facebook credentials
  const configureCredentialsMutation = useMutation({
    mutationFn: async (creds: FacebookCredentials) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/facebook/configure`, creds);
      return response.json();
    },
    onSuccess: () => {
      setShowCredentialsModal(false);
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/status`] });
      toast({
        title: "Configuration Saved!",
        description: "Facebook app credentials have been configured successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Configuration Failed",
        description: error.message || "Failed to save Facebook credentials",
        variant: "destructive",
      });
    },
  });

  // Connect Facebook account
  const connectFacebookMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", `/api/auth/facebook/${tenant?.id}`);
      const data = await response.json();
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to initiate Facebook connection",
        variant: "destructive",
      });
    },
  });

  // Sync leads
  const syncLeadsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/facebook/sync-leads`);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/leads`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/status`] });
      toast({
        title: "Leads Synced!",
        description: `Successfully imported ${data.imported} leads from Facebook.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync Facebook leads",
        variant: "destructive",
      });
    },
  });

  // Create Facebook campaign
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: any) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/facebook/campaigns`, campaign);
      return response.json();
    },
    onSuccess: (data: any) => {
      setShowCampaignModal(false);
      setCampaignData({
        name: "",
        objective: "LEAD_GENERATION",
        budget: "",
        targetAudience: "",
        adText: "",
        callToAction: "LEARN_MORE"
      });
      toast({
        title: "Campaign Created!",
        description: `Facebook campaign "${data.name}" has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Campaign Creation Failed",
        description: error.message || "Failed to create Facebook campaign",
        variant: "destructive",
      });
    },
  });

  // Disconnect Facebook
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/facebook/disconnect`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/pages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/leads`] });
      toast({
        title: "Disconnected",
        description: "Facebook Business Suite has been disconnected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect Facebook",
        variant: "destructive",
      });
    },
  });

  const handleCredentialsSubmit = () => {
    if (!credentials.appId || !credentials.appSecret) {
      toast({
        title: "Missing Information",
        description: "Please enter both App ID and App Secret",
        variant: "destructive",
      });
      return;
    }
    configureCredentialsMutation.mutate(credentials);
  };

  const handleCreateCampaign = () => {
    if (!campaignData.name || !campaignData.budget) {
      toast({
        title: "Missing Information",
        description: "Please enter campaign name and budget",
        variant: "destructive",
      });
      return;
    }
    createCampaignMutation.mutate(campaignData);
  };

  if (isLoadingStatus) {
    return (
      <Layout>
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Facebook className="h-8 w-8 text-blue-600" />
              Facebook Business Suite
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Complete Facebook advertising and lead generation platform
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => window.open('https://business.facebook.com', '_blank')} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Business Manager
            </Button>
            <Button onClick={() => window.open('https://developers.facebook.com/docs/marketing-api', '_blank')} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              API Documentation
            </Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${facebookStatus?.connected ? 'bg-green-100' : facebookStatus?.configured ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Facebook className={`h-6 w-6 ${facebookStatus?.connected ? 'text-green-600' : facebookStatus?.configured ? 'text-blue-600' : 'text-gray-600'}`} />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">
                    {(facebookStatus as any)?.connected ? 'Connected' : (facebookStatus as any)?.configured ? 'Configured' : 'Not Configured'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {(facebookStatus as any)?.connected ? `${(facebookStatus as any)?.connectedPages || 0} pages connected` 
                      : (facebookStatus as any)?.configured ? 'Ready to connect Facebook account'
                      : 'Configure your Facebook app credentials to get started'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                {!(facebookStatus as any)?.configured && (
                  <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
                    <DialogTrigger asChild>
                      <Button>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure App
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Configure Facebook App Credentials</DialogTitle>
                        <DialogDescription>
                          Enter your Facebook app credentials to enable Business Suite integration.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="appId">Facebook App ID</Label>
                          <Input
                            id="appId"
                            placeholder="Enter your Facebook App ID"
                            value={credentials.appId}
                            onChange={(e) => setCredentials(prev => ({ ...prev, appId: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="appSecret">Facebook App Secret</Label>
                          <Input
                            id="appSecret"
                            type="password"
                            placeholder="Enter your Facebook App Secret"
                            value={credentials.appSecret}
                            onChange={(e) => setCredentials(prev => ({ ...prev, appSecret: e.target.value }))}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
                          <p className="font-medium mb-1">How to get these credentials:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank" className="text-blue-600 underline">Facebook Developers</a></li>
                            <li>Create a new app or select an existing one</li>
                            <li>Add "Facebook Login" and "Instagram Basic Display" products</li>
                            <li>Copy the App ID and App Secret from Settings → Basic</li>
                          </ol>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCredentialsModal(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCredentialsSubmit} 
                          disabled={configureCredentialsMutation.isPending || !credentials.appId || !credentials.appSecret}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {configureCredentialsMutation.isPending ? 'Saving...' : 'Save Configuration'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                
                {(facebookStatus as any)?.configured && !(facebookStatus as any)?.connected && (
                  <Button onClick={() => connectFacebookMutation.mutate()} disabled={connectFacebookMutation.isPending}>
                    <Facebook className="h-4 w-4 mr-2" />
                    {connectFacebookMutation.isPending ? 'Connecting...' : 'Connect Facebook'}
                  </Button>
                )}
                
                {(facebookStatus as any)?.connected && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => syncLeadsMutation.mutate()} 
                      disabled={syncLeadsMutation.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncLeadsMutation.isPending ? 'animate-spin' : ''}`} />
                      {syncLeadsMutation.isPending ? 'Syncing...' : 'Sync Leads'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => disconnectMutation.mutate()} 
                      disabled={disconnectMutation.isPending}
                    >
                      Disconnect
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {(facebookStatus as any)?.connected && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pages">Pages & Instagram</TabsTrigger>
              <TabsTrigger value="ads">Ads Manager</TabsTrigger>
              <TabsTrigger value="leads">Lead Center</TabsTrigger>
              <TabsTrigger value="audiences">Audiences</TabsTrigger>
              <TabsTrigger value="creative">Creative Hub</TabsTrigger>
              <TabsTrigger value="events">Events Manager</TabsTrigger>
              <TabsTrigger value="insights">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Reach</p>
                        <p className="text-2xl font-bold">{(facebookInsights as any)?.page_reach?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Target className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Engagement</p>
                        <p className="text-2xl font-bold">{(facebookInsights as any)?.page_engagement?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">New Followers</p>
                        <p className="text-2xl font-bold">{(facebookInsights as any)?.page_fan_adds || '0'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <MessageSquare className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Leads</p>
                        <p className="text-2xl font-bold">{(facebookStatus as any)?.totalLeads || '0'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" onClick={() => setShowCampaignModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Ad Campaign
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setShowAudienceModal(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Build Audience
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setShowCreativeModal(true)}>
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Creative
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setShowPixelModal(true)}>
                      <Activity className="h-4 w-4 mr-2" />
                      Setup Pixel
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span>Facebook account connected</span>
                        <Badge variant="secondary" className="ml-auto">Today</Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span>Last lead sync: {(facebookStatus as any)?.lastSync ? new Date((facebookStatus as any).lastSync).toLocaleDateString() : 'Never'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{(facebookStatus as any)?.connectedPages || 0} pages connected</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pages">
              <div className="space-y-6">
                {isLoadingPages ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : facebookPages && (facebookPages as any[]).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(facebookPages as any[]).map((page: FacebookPage) => (
                      <Card key={page.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-full">
                                <Facebook className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{page.name}</h4>
                                <p className="text-sm text-gray-600">{page.category}</p>
                              </div>
                            </div>
                            <Badge variant="outline">Connected</Badge>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span>Followers:</span>
                            <span className="font-medium">{page.followers_count?.toLocaleString() || '0'}</span>
                          </div>
                          
                          {page.instagram_business_account && (
                            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded">
                              <div className="flex items-center gap-2">
                                <Instagram className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium">Instagram Connected</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                @{page.instagram_business_account.username}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-4 w-4 mr-1" />
                              View Page
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Facebook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Pages Found</h3>
                      <p className="text-gray-600 mb-4">
                        Make sure you have admin access to Facebook pages to manage them here.
                      </p>
                      <Button onClick={() => window.open('https://business.facebook.com', '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Business Manager
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ads">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Facebook Ads Manager</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View All Ads
                    </Button>
                    <Button size="sm" onClick={() => setShowCampaignModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Active Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Currently running</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Spend (30 days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$0.00</div>
                      <p className="text-xs text-muted-foreground">Advertising budget</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">ROAS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0.0x</div>
                      <p className="text-xs text-muted-foreground">Return on ad spend</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">CTR</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0.0%</div>
                      <p className="text-xs text-muted-foreground">Click-through rate</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-12 text-center">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Campaigns</h3>
                    <p className="text-gray-600 mb-4">
                      Start your first Facebook ad campaign to reach potential customers and generate leads.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button onClick={() => setShowCampaignModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </Button>
                      <Button variant="outline" onClick={() => window.open('https://www.facebook.com/business/ads-guide', '_blank')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Campaign Guide
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Campaign Creation Modal */}
                <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Create Facebook Ad Campaign</DialogTitle>
                      <DialogDescription>
                        Create a new lead generation campaign for your Facebook page.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="campaignName">Campaign Name</Label>
                          <Input
                            id="campaignName"
                            placeholder="Enter campaign name"
                            value={campaignData.name}
                            onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="budget">Daily Budget ($)</Label>
                          <Input
                            id="budget"
                            type="number"
                            placeholder="50"
                            value={campaignData.budget}
                            onChange={(e) => setCampaignData(prev => ({ ...prev, budget: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="objective">Campaign Objective</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={campaignData.objective}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, objective: e.target.value }))}
                        >
                          <option value="LEAD_GENERATION">Lead Generation</option>
                          <option value="REACH">Reach</option>
                          <option value="TRAFFIC">Traffic</option>
                          <option value="ENGAGEMENT">Engagement</option>
                          <option value="CONVERSIONS">Conversions</option>
                          <option value="BRAND_AWARENESS">Brand Awareness</option>
                          <option value="VIDEO_VIEWS">Video Views</option>
                          <option value="MESSAGES">Messages</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="targetAudience">Target Audience</Label>
                        <Input
                          id="targetAudience"
                          placeholder="e.g., Travel enthusiasts, age 25-45"
                          value={campaignData.targetAudience}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, targetAudience: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="adText">Ad Text</Label>
                        <Textarea
                          id="adText"
                          placeholder="Write compelling ad copy..."
                          value={campaignData.adText}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, adText: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="callToAction">Call-to-Action</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={campaignData.callToAction}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, callToAction: e.target.value }))}
                        >
                          <option value="LEARN_MORE">Learn More</option>
                          <option value="SIGN_UP">Sign Up</option>
                          <option value="DOWNLOAD">Download</option>
                          <option value="GET_QUOTE">Get Quote</option>
                          <option value="CONTACT_US">Contact Us</option>
                          <option value="SHOP_NOW">Shop Now</option>
                          <option value="BOOK_TRAVEL">Book Travel</option>
                          <option value="APPLY_NOW">Apply Now</option>
                        </select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCampaignModal(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateCampaign} 
                        disabled={createCampaignMutation.isPending || !campaignData.name || !campaignData.budget}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>

            <TabsContent value="leads">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Lead Center</h3>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => syncLeadsMutation.mutate()} 
                      disabled={syncLeadsMutation.isPending}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncLeadsMutation.isPending ? 'animate-spin' : ''}`} />
                      {syncLeadsMutation.isPending ? 'Syncing...' : 'Sync Leads'}
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Lead Form
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <MessageSquare className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Leads</p>
                          <p className="text-2xl font-bold">{facebookStatus?.totalLeads || '0'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Clock className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">This Week</p>
                          <p className="text-2xl font-bold">0</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                          <p className="text-2xl font-bold">0%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Qualified Leads</p>
                          <p className="text-2xl font-bold">0</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {isLoadingLeads ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-20 rounded"></div>
                    ))}
                  </div>
                ) : facebookLeads && facebookLeads.length > 0 ? (
                  <div className="space-y-4">
                    {facebookLeads.map((lead: FacebookLead, index: number) => (
                      <Card key={lead.id || index}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold">Lead #{lead.id || index + 1}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(lead.created_time).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="secondary">
                                {lead.form_id ? `Form: ${lead.form_id}` : 'No Form'}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button variant="outline" size="sm">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Contact
                              </Button>
                            </div>
                          </div>
                          
                          {lead.field_data && lead.field_data.length > 0 && (
                            <div className="grid grid-cols-2 gap-4">
                              {lead.field_data.map((field: any, fieldIndex: number) => (
                                <div key={fieldIndex} className="flex justify-between">
                                  <span className="text-sm font-medium capitalize">
                                    {field.name?.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="text-sm">
                                    {field.values?.[0] || 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Leads Found</h3>
                      <p className="text-gray-600 mb-4">
                        Connect your Facebook lead forms to start collecting leads here.
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Lead Form
                        </Button>
                        <Button variant="outline" onClick={() => window.open('https://www.facebook.com/business/ads/lead-ads', '_blank')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Lead Ads Guide
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="audiences">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Audience Manager</h3>
                  <Button size="sm" onClick={() => setShowAudienceModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Audience
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Custom Audiences</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Based on your data</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Lookalike Audiences</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Similar to your customers</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Saved Audiences</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Interest-based targeting</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Audiences Created</h3>
                    <p className="text-gray-600 mb-4">
                      Create custom audiences to target your ads more effectively and reach the right people.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button onClick={() => setShowAudienceModal(true)}>
                        <Users className="h-4 w-4 mr-2" />
                        Custom Audience
                      </Button>
                      <Button variant="outline">
                        <Target className="h-4 w-4 mr-2" />
                        Lookalike Audience
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Audience Creation Modal */}
                <Dialog open={showAudienceModal} onOpenChange={setShowAudienceModal}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Custom Audience</DialogTitle>
                      <DialogDescription>
                        Build an audience based on your customer data or website traffic.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="audienceName">Audience Name</Label>
                        <Input
                          id="audienceName"
                          placeholder="Enter audience name"
                          value={audienceData.name}
                          onChange={(e) => setAudienceData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="audienceType">Audience Type</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={audienceData.type}
                          onChange={(e) => setAudienceData(prev => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="custom">Custom Audience</option>
                          <option value="lookalike">Lookalike Audience</option>
                          <option value="saved">Saved Audience</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="audienceSource">Source</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={audienceData.source}
                          onChange={(e) => setAudienceData(prev => ({ ...prev, source: e.target.value }))}
                        >
                          <option value="website_traffic">Website Traffic</option>
                          <option value="customer_list">Customer List</option>
                          <option value="app_activity">App Activity</option>
                          <option value="engagement">Engagement</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="audienceDescription">Description</Label>
                        <Textarea
                          id="audienceDescription"
                          placeholder="Describe your target audience..."
                          value={audienceData.description}
                          onChange={(e) => setAudienceData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAudienceModal(false)}>
                        Cancel
                      </Button>
                      <Button disabled={!audienceData.name}>
                        <Save className="w-4 h-4 mr-1" />
                        Create Audience
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>

            <TabsContent value="creative">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Creative Hub</h3>
                  <Button size="sm" onClick={() => setShowCreativeModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Creative
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Image Ads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Static images</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Video Ads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Video content</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Carousel Ads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Multiple images</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Collection Ads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Product catalogs</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-12 text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Creative Assets</h3>
                    <p className="text-gray-600 mb-4">
                      Upload images, videos, and create compelling ad creatives for your campaigns.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button onClick={() => setShowCreativeModal(true)}>
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Images
                      </Button>
                      <Button variant="outline">
                        <Video className="h-4 w-4 mr-2" />
                        Create Video Ad
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Creative Creation Modal */}
                <Dialog open={showCreativeModal} onOpenChange={setShowCreativeModal}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Ad Creative</DialogTitle>
                      <DialogDescription>
                        Upload and design creative assets for your Facebook ads.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="creativeName">Creative Name</Label>
                        <Input
                          id="creativeName"
                          placeholder="Enter creative name"
                          value={creativeData.name}
                          onChange={(e) => setCreativeData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="creativeType">Creative Type</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={creativeData.type}
                          onChange={(e) => setCreativeData(prev => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="image">Single Image</option>
                          <option value="video">Video</option>
                          <option value="carousel">Carousel</option>
                          <option value="collection">Collection</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="headline">Headline</Label>
                        <Input
                          id="headline"
                          placeholder="Enter headline"
                          value={creativeData.headline}
                          onChange={(e) => setCreativeData(prev => ({ ...prev, headline: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Enter description"
                          value={creativeData.description}
                          onChange={(e) => setCreativeData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="creativeCallToAction">Call-to-Action</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={creativeData.callToAction}
                          onChange={(e) => setCreativeData(prev => ({ ...prev, callToAction: e.target.value }))}
                        >
                          <option value="LEARN_MORE">Learn More</option>
                          <option value="SIGN_UP">Sign Up</option>
                          <option value="DOWNLOAD">Download</option>
                          <option value="GET_QUOTE">Get Quote</option>
                          <option value="CONTACT_US">Contact Us</option>
                          <option value="SHOP_NOW">Shop Now</option>
                        </select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreativeModal(false)}>
                        Cancel
                      </Button>
                      <Button disabled={!creativeData.name}>
                        <Save className="w-4 h-4 mr-1" />
                        Create Creative
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>

            <TabsContent value="events">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Events Manager</h3>
                  <Button size="sm" onClick={() => setShowPixelModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Setup Pixel
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Active Pixels</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Tracking pixels</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Conversions (30 days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Tracked events</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Conversion Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$0.00</div>
                      <p className="text-xs text-muted-foreground">Total value</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Pixel Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">Good</div>
                      <p className="text-xs text-muted-foreground">Overall status</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-12 text-center">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Tracking Setup</h3>
                    <p className="text-gray-600 mb-4">
                      Set up Facebook Pixel to track important events like purchases, signups, and page views.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button onClick={() => setShowPixelModal(true)}>
                        <Activity className="h-4 w-4 mr-2" />
                        Setup Pixel
                      </Button>
                      <Button variant="outline" onClick={() => window.open('https://www.facebook.com/business/help/952192354843755', '_blank')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Pixel Guide
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Pixel Setup Modal */}
                <Dialog open={showPixelModal} onOpenChange={setShowPixelModal}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Setup Facebook Pixel</DialogTitle>
                      <DialogDescription>
                        Configure Facebook Pixel to track conversions and optimize your ads.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="pixelName">Pixel Name</Label>
                        <Input
                          id="pixelName"
                          placeholder="Enter pixel name"
                          value={pixelData.name}
                          onChange={(e) => setPixelData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="website">Website URL</Label>
                        <Input
                          id="website"
                          placeholder="https://yourwebsite.com"
                          value={pixelData.website}
                          onChange={(e) => setPixelData(prev => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Events to Track</Label>
                        <div className="space-y-2">
                          {['PageView', 'Purchase', 'Lead', 'CompleteRegistration', 'AddToCart', 'InitiateCheckout'].map((event) => (
                            <div key={event} className="flex items-center space-x-2">
                              <Switch
                                checked={pixelData.events.includes(event)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setPixelData(prev => ({ ...prev, events: [...prev.events, event] }));
                                  } else {
                                    setPixelData(prev => ({ ...prev, events: prev.events.filter(e => e !== event) }));
                                  }
                                }}
                              />
                              <Label>{event}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowPixelModal(false)}>
                        Cancel
                      </Button>
                      <Button disabled={!pixelData.name || !pixelData.website}>
                        <Save className="w-4 h-4 mr-1" />
                        Setup Pixel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Performance Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Page Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Page Impressions</span>
                          <span className="font-semibold">{facebookInsights?.page_impressions?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Page Reach</span>
                          <span className="font-semibold">{facebookInsights?.page_reach?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Page Engagement</span>
                          <span className="font-semibold">{facebookInsights?.page_engagement?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>New Page Likes</span>
                          <span className="font-semibold">{facebookInsights?.page_fan_adds || '0'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Lead Generation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Total Leads</span>
                          <span className="font-semibold">{facebookStatus?.totalLeads || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>This Week</span>
                          <span className="font-semibold">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>This Month</span>
                          <span className="font-semibold">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Conversion Rate</span>
                          <span className="font-semibold">0%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ad Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Total Spend</span>
                          <span className="font-semibold">$0.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average CPC</span>
                          <span className="font-semibold">$0.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average CPM</span>
                          <span className="font-semibold">$0.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ROAS</span>
                          <span className="font-semibold">0.0x</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Audience Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Top Age Group</span>
                          <span className="font-semibold">25-34</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Top Gender</span>
                          <span className="font-semibold">Female</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Top Location</span>
                          <span className="font-semibold">United States</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mobile vs Desktop</span>
                          <span className="font-semibold">80% / 20%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
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
  Facebook, Instagram, Linkedin, Settings, Save, 
  CheckCircle, XCircle, RefreshCw, ExternalLink,
  AlertCircle, Key, Shield, Zap, TrendingUp, Target, Users, MessageSquare
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Celebration } from "@/components/ui/celebration";
import { FacebookLeadsManager } from "@/components/facebook-leads-manager";

interface SocialIntegration {
  id?: number;
  platform: string;
  isActive: boolean;
  appId?: string;
  appSecret?: string;
  accessToken?: string;
  lastSync?: string;
  totalLeadsImported?: number;
  webhookUrl?: string;
  tokenExpiresAt?: string;
}

export default function SocialIntegrations() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    platform: string;
    stats?: any;
  }>({ platform: '' });
  const [isFacebookLeadsManagerOpen, setIsFacebookLeadsManagerOpen] = useState(false);

  const { data: integrations = [], isLoading } = useQuery<SocialIntegration[]>({
    queryKey: [`/api/tenants/${tenant?.id}/social-integrations`],
    enabled: !!tenant?.id,
  });

  // Check if Facebook Lead Ads integration is connected
  const facebookLeadAdsIntegration = integrations.find(
    (int: SocialIntegration) => int.platform === 'facebook-lead-ads'
  );
  const isFacebookLeadAdsConnected = facebookLeadAdsIntegration && facebookLeadAdsIntegration.accessToken;

  const saveIntegrationMutation = useMutation({
    mutationFn: async (integration: SocialIntegration) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/social-integrations`, integration);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/social-integrations`] });
      toast({
        title: "Integration Saved!",
        description: "Social media integration has been configured successfully.",
      });
      setSelectedPlatform(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save integration",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/social-integrations/${platform}/test`);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Connection Successful!",
        description: `Successfully connected to ${data.platform}. Found ${data.availableLeads} leads.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Unable to connect to social media platform",
        variant: "destructive",
      });
    },
  });

  const syncLeadsMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/social-integrations/${platform}/sync`);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/social-integrations`] });
      toast({
        title: "Sync Complete!",
        description: `Imported ${data.imported} new leads from ${data.platform}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync leads",
        variant: "destructive",
      });
    },
  });

  const syncFacebookLeadsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/facebook/sync-leads`);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/social-integrations`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/status`] });
      toast({
        title: "Facebook Leads Synced!",
        description: `Successfully imported ${data.imported || data.importedCount || 0} new leads from Facebook Lead Ads.`,
      });
      
      // Show mini celebration for successful sync
      if ((data.imported || data.importedCount || 0) > 0) {
        setTimeout(() => {
          setCelebrationData({
            platform: 'facebook',
            stats: { leadsAvailable: data.imported || data.importedCount || 0 }
          });
          setShowCelebration(true);
        }, 500);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync Facebook leads",
        variant: "destructive",
      });
    },
  });

  // Facebook configuration state
  const [facebookConfig, setFacebookConfig] = useState({ appId: "", appSecret: "" });
  const [showFacebookConfig, setShowFacebookConfig] = useState(false);

  // Fetch Facebook integration status
  const { data: facebookStatus, isLoading: isLoadingFacebook } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/facebook/status`],
    enabled: !!tenant?.id,
  });

  const configureOAuth = async (platform: string) => {
    try {
      // Check if platform is configured
      if (platform === 'facebook') {
        if (!(facebookStatus as any)?.configured) {
          setShowFacebookConfig(true);
          return;
        }
        // If configured but not connected, start OAuth flow
        const response = await apiRequest("GET", `/api/auth/${platform}/${tenant?.id}`);
        const data = await response.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      }
    } catch (error: any) {
      toast({
        title: "Configuration Error",
        description: error.message || "Failed to start authentication",
        variant: "destructive",
      });
    }
  };

  const saveFacebookConfig = useMutation({
    mutationFn: async (config: { appId: string; appSecret: string }) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/facebook/configure`, config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/status`] });
      setShowFacebookConfig(false);
      toast({
        title: "Configuration Saved!",
        description: "Facebook app credentials saved successfully. You can now connect your Facebook account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Configuration Failed",
        description: error.message || "Failed to save Facebook app credentials",
        variant: "destructive",
      });
    },
  });

  // Get statuses for all platforms
  const { data: instagramStatus } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/instagram/status`],
    enabled: !!tenant?.id,
  });
  
  const { data: linkedinStatus } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/linkedin/status`],
    enabled: !!tenant?.id,
  });
  
  const { data: twitterStatus } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/twitter/status`],
    enabled: !!tenant?.id,
  });
  
  const { data: tiktokStatus } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/tiktok/status`],
    enabled: !!tenant?.id,
  });

  const platforms: any[] = [
    // Facebook is shown separately in the highlight card above
    // Add other platforms here if needed in the future
  ];

  const getIntegrationForPlatform = (platformId: string) => {
    return integrations.find((int: SocialIntegration) => int.platform === platformId);
  };

  // Universal platform configuration handler
  const handleConfigure = async (platform: string, credentials: Record<string, string>) => {
    try {
      // Validate Facebook App ID format if it's Facebook
      if (platform === 'facebook' && credentials.appId) {
        const appIdRegex = /^\d+$/;
        const trimmedAppId = credentials.appId.trim();
        
        if (!trimmedAppId) {
          throw new Error("Facebook App ID is required");
        }
        
        if (!appIdRegex.test(trimmedAppId)) {
          throw new Error("Invalid Facebook App ID format. App ID must be numeric (e.g., 123456789012345). Please check your App ID from Facebook Developer Console.");
        }
        
        // Ensure App ID is trimmed
        credentials.appId = trimmedAppId;
      }
      
      // Validate App Secret is not empty
      if (platform === 'facebook' && credentials.appSecret) {
        const trimmedSecret = credentials.appSecret.trim();
        if (!trimmedSecret) {
          throw new Error("Facebook App Secret is required");
        }
        credentials.appSecret = trimmedSecret;
      }
      
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/${platform}/configure`, credentials);
      const result = await response.json();

      if (result.success || result.message) {
        toast({
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Configuration`,
          description: result.message || `${platform} app credentials saved successfully!`,
        });
        
        // Refresh all statuses after configuration
        await queryClient.invalidateQueries({ 
          queryKey: [`/api/tenants/${tenant?.id}/${platform}/status`] 
        });
        await queryClient.invalidateQueries({ 
          queryKey: [`/api/tenants/${tenant?.id}/social-integrations`] 
        });
      } else {
        throw new Error(result.message || result.error || `Failed to configure ${platform}`);
      }
    } catch (error: any) {
      toast({
        title: "Configuration Error",
        description: error.message || `Failed to save ${platform} credentials`,
        variant: "destructive"
      });
    }
  };

  // Universal OAuth handler
  const handleOAuth = async (platform: string) => {
    try {
      const response = await fetch(`/api/auth/${platform}/${tenant?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to get ${platform} auth URL`);
      }

      window.location.href = data.authUrl;
    } catch (error: any) {
      toast({
        title: "Authentication Error", 
        description: error.message || `Failed to connect to ${platform}`,
        variant: "destructive"
      });
    }
  };

  // Configuration Modal Component
  const ConfigurationModal = ({ platform }: { platform: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});

    const handleSubmit = async () => {
      await handleConfigure(platform.id, formData);
      setIsOpen(false);
      setFormData({});
    };

    const credentialKeys = Object.keys(platform.credentials || {});

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure {platform.name}</DialogTitle>
            <DialogDescription>
              Enter your {platform.name} app credentials to enable integration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {credentialKeys.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{platform.credentials[key]}</Label>
                <Input
                  id={key}
                  type={key === 'appId' && platform.id === 'facebook' ? 'text' : 'password'}
                  placeholder={`Enter your ${platform.credentials[key].toLowerCase()}`}
                  value={formData[key] || ''}
                  onChange={(e) => {
                    let value = e.target.value;
                    // For Facebook App ID, only allow numeric input
                    if (key === 'appId' && platform.id === 'facebook') {
                      value = value.replace(/\D/g, ''); // Remove non-numeric characters
                    }
                    setFormData(prev => ({ ...prev, [key]: value }));
                  }}
                />
                {key === 'appId' && platform.id === 'facebook' && (
                  <p className="text-xs text-muted-foreground">
                    Facebook App ID must be numeric (e.g., 123456789012345). Find it in your Facebook App Settings → Basic.
                  </p>
                )}
              </div>
            ))}
            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Where to find these credentials:</p>
              {platform.id === 'facebook' && (
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">developers.facebook.com/apps</a></li>
                  <li>Select your app (or create a new one)</li>
                  <li>Go to Settings → Basic</li>
                  <li>Copy the App ID (numeric) and App Secret</li>
                  <li>Make sure your app has "leads_retrieval" permission enabled</li>
                </ol>
              )}
              {platform.id !== 'facebook' && (
                <p>Get these credentials from your {platform.name} developer console.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!credentialKeys.every(key => formData[key])}>
              <Save className="w-4 h-4 mr-1" />
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Facebook OAuth integration mutation with popup
  const connectFacebookMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", `/api/tenants/${tenant?.id}/facebook/auth`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to get Facebook auth URL");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      if (!data.authUrl) {
        toast({
          title: "Facebook Connection Failed",
          description: "No auth URL received from server",
          variant: "destructive",
        });
        return;
      }

      // Store callback data for celebration
      sessionStorage.setItem('pendingFacebookConnection', JSON.stringify({
        platform: 'facebook',
        timestamp: Date.now()
      }));

      // Open Facebook OAuth in popup window
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        data.authUrl,
        'Facebook OAuth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      // Listen for popup to close or receive message
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          // Check if connection was successful by checking URL params
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('facebook') === 'connected') {
            fetchFacebookPagesForSelection();
          }
        }
      }, 500);

      // Also listen for postMessage from popup (if implemented)
      const messageListener = (event: MessageEvent) => {
        if (event.data.type === 'FACEBOOK_OAUTH_SUCCESS') {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageListener);
          fetchFacebookPagesForSelection();
        }
      };
      window.addEventListener('message', messageListener);
    },
    onError: (error: any) => {
      let errorMessage = error.message || "Failed to initiate Facebook connection";
      
      // Provide helpful error messages
      if (errorMessage.includes("not configured") || errorMessage.includes("CREDENTIALS_NOT_CONFIGURED")) {
        errorMessage = "Facebook App ID and App Secret are not configured. Please configure them in the Social Integrations settings first.";
      } else if (errorMessage.includes("Invalid") || errorMessage.includes("INVALID_APP_ID")) {
        errorMessage = "Invalid Facebook App ID format. Please check your App ID in Social Integrations settings. App ID should be numeric (e.g., 123456789012345).";
      }
      
      toast({
        title: "Facebook Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Facebook page selection modal state
  const [showPageSelectionModal, setShowPageSelectionModal] = useState(false);
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [pageLeadForms, setPageLeadForms] = useState<Record<string, any[]>>({});
  const [selectedLeadForms, setSelectedLeadForms] = useState<Set<string>>(new Set());
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  // Check for successful OAuth callback
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const facebookConnected = urlParams.get('facebook');
    const pendingConnection = sessionStorage.getItem('pendingFacebookConnection');
    
    if (code && pendingConnection) {
      const connectionData = JSON.parse(pendingConnection);
      // Clear the pending connection
      sessionStorage.removeItem('pendingFacebookConnection');
      
      // If callback completed, fetch pages for selection
      if (facebookConnected === 'connected') {
        fetchFacebookPagesForSelection();
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch Facebook pages after OAuth for user selection
  const fetchFacebookPagesForSelection = async () => {
    setIsLoadingPages(true);
    try {
      // First, refresh the Facebook status to get latest data
      await queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/status`] });
      
      // Fetch pages from API
      const response = await apiRequest("GET", `/api/tenants/${tenant?.id}/facebook/pages`);
      const pages = await response.json();
      
      if (!pages || pages.length === 0) {
        toast({
          title: "No Pages Found",
          description: "No Facebook Pages found. Please make sure you have pages associated with your Facebook account.",
          variant: "destructive",
        });
        setIsLoadingPages(false);
        return;
      }
      
      setAvailablePages(pages || []);
      setShowPageSelectionModal(true);
      
      // Pre-select all pages by default
      const allPageIds = new Set((pages || []).map((p: any) => p.pageId || p.id));
      setSelectedPages(allPageIds);
      
      // Fetch lead forms for each page
      for (const page of pages || []) {
        try {
          const pageId = page.pageId || page.id;
          const formsResponse = await apiRequest("GET", `/api/tenants/${tenant?.id}/facebook/pages/${pageId}/lead-forms`);
          const forms = await formsResponse.json();
          setPageLeadForms(prev => ({
            ...prev,
            [pageId]: forms || []
          }));
          
          // Pre-select all lead forms
          const formIds = (forms || []).map((f: any) => f.formId || f.id);
          setSelectedLeadForms(prev => new Set([...prev, ...formIds]));
        } catch (error) {
          console.error(`Error fetching lead forms for page ${page.pageId || page.id}:`, error);
          // Set empty array if error
          setPageLeadForms(prev => ({
            ...prev,
            [page.pageId || page.id]: []
          }));
        }
      }
    } catch (error: any) {
      console.error("Error fetching Facebook pages:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch Facebook pages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPages(false);
    }
  };

  // Save selected pages and lead forms
  const saveFacebookConnection = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/facebook/connect-pages`, {
        pageIds: Array.from(selectedPages),
        leadFormIds: Array.from(selectedLeadForms)
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      setShowPageSelectionModal(false);
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/pages`] });
      toast({
        title: "Facebook Connected!",
        description: `Successfully connected ${selectedPages.size} page(s) with ${selectedLeadForms.size} lead form(s).`,
      });
      
      // Show celebration
      setTimeout(() => {
        setCelebrationData({
          platform: 'facebook',
          stats: {
            pagesConnected: selectedPages.size,
            leadsAvailable: selectedLeadForms.size
          }
        });
        setShowCelebration(true);
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to save Facebook connection",
        variant: "destructive",
      });
    },
  });

  // Remove duplicate facebookStatus query - already declared above

  const IntegrationSetupForm = ({ platform }: { platform: any }) => {
    const [formData, setFormData] = useState<any>({
      platform: platform.id,
      isActive: true,
      ...getIntegrationForPlatform(platform.id)
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (platform.isOAuth && platform.id === 'facebook') {
        connectFacebookMutation.mutate();
      } else {
        saveIntegrationMutation.mutate(formData);
      }
    };

    // Facebook OAuth flow
    if (platform.isOAuth && platform.id === 'facebook') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <platform.icon className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">{platform.name}</h3>
              <p className="text-sm text-gray-600">{platform.description}</p>
            </div>
          </div>
          
          {platform.features && (
            <div className="grid grid-cols-2 gap-2">
              {platform.features.map((feature: string) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {feature}
                </div>
              ))}
            </div>
          )}
          
          {(facebookStatus as any)?.isConnected ? (
            <FacebookDashboard />
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={connectFacebookMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {connectFacebookMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting to Facebook...
                </>
              ) : (
                <>
                  <Facebook className="h-4 w-4 mr-2" />
                  Connect Facebook Business Suite
                </>
              )}
            </Button>
          )}
        </div>
      );
    }

    // LinkedIn OAuth flow
    if (platform.isOAuth && platform.id === 'linkedin') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <platform.icon className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">{platform.name}</h3>
              <p className="text-sm text-gray-600">{platform.description}</p>
            </div>
          </div>
          
          {platform.features && (
            <div className="grid grid-cols-2 gap-2">
              {platform.features.map((feature: string) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {feature}
                </div>
              ))}
            </div>
          )}
          
          {(linkedinStatus as any)?.connected ? (
            <LinkedInDashboard />
          ) : (
            <div className="space-y-3">
              <ConfigurationModal platform={platform} />
              <p className="text-sm text-muted-foreground">
                Configure your LinkedIn credentials first, then connect to access full features.
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-3">
          <platform.icon className="h-8 w-8 text-gray-600" />
          <div>
            <h3 className="text-lg font-semibold">{platform.name}</h3>
            <p className="text-sm text-gray-600">{platform.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          {platform.fields.map((field: any) => (
            <div key={field.key}>
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.key] || ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                className="mt-1"
              />
            </div>
          ))}

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label>Enable automatic lead sync</Label>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button type="submit" disabled={saveIntegrationMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveIntegrationMutation.isPending ? "Saving..." : "Save Integration"}
          </Button>
          
          <Button 
            type="button"
            variant="outline"
            onClick={() => testConnectionMutation.mutate(platform.id)}
            disabled={testConnectionMutation.isPending}
          >
            <Zap className="h-4 w-4 mr-2" />
            {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
          </Button>
        </div>
      </form>
    );
  };

  // LinkedIn Dashboard Component
  const LinkedInDashboard = () => {
    const { data: linkedinInsights } = useQuery({
      queryKey: [`/api/tenants/${tenant?.id}/linkedin/insights`],
      enabled: !!tenant?.id,
    });

    const { data: linkedinMessages } = useQuery({
      queryKey: [`/api/tenants/${tenant?.id}/linkedin/messages`],
      enabled: !!tenant?.id,
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{(linkedinInsights as any)?.totalLeads || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Messages Logged</p>
                <p className="text-2xl font-bold">{(linkedinInsights as any)?.totalMessages || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">InMails Sent</p>
                <p className="text-2xl font-bold">{(linkedinInsights as any)?.inmailsSent || 0}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
        </div>

        <div className="flex space-x-4">
          <Button 
            onClick={() => setSelectedPlatform('linkedin')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open LinkedIn Business Suite
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Data
          </Button>
        </div>
      </div>
    );
  };

  // LinkedIn Business Suite Component
  const LinkedInBusinessSuite = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentials, setCredentials] = useState({ clientId: "", clientSecret: "" });

    const { data: linkedinStatus } = useQuery({
      queryKey: [`/api/tenants/${tenant?.id}/linkedin/status`],
      enabled: !!tenant?.id,
    });

    const { data: linkedinMessages } = useQuery({
      queryKey: [`/api/tenants/${tenant?.id}/linkedin/messages`],
      enabled: !!tenant?.id,
    });

    const { data: linkedinConnections } = useQuery({
      queryKey: [`/api/tenants/${tenant?.id}/linkedin/connections`],
      enabled: !!tenant?.id,
    });

    const { data: linkedinLeads } = useQuery({
      queryKey: [`/api/tenants/${tenant?.id}/linkedin/leads`],
      enabled: !!tenant?.id,
    });

    const saveCredentialsMutation = useMutation({
      mutationFn: async (creds: any) => {
        const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/linkedin/configure`, creds);
        return response.json();
      },
      onSuccess: () => {
        toast({
          title: "LinkedIn Configured",
          description: "LinkedIn credentials saved successfully",
        });
        setShowCredentialsModal(false);
        queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/linkedin/status`] });
      },
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Linkedin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">LinkedIn Business Suite</h2>
              <p className="text-sm text-muted-foreground">Complete LinkedIn CRM integration with Sales Navigator</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowCredentialsModal(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connection Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-2 w-2 rounded-full ${(linkedinStatus as any)?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">
                    {(linkedinStatus as any)?.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-lg font-bold">{(linkedinStatus as any)?.totalLeads || 3}</p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Messages Logged</p>
                <p className="text-lg font-bold">{(linkedinStatus as any)?.totalMessages || 3}</p>
              </div>
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">InMails Sent</p>
                <p className="text-lg font-bold">{(linkedinStatus as any)?.inmailsSent || 1}</p>
              </div>
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="connections">Sales Navigator</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>LinkedIn CRM Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Recent Activity</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                        <span>3 new leads imported</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        <span>3 messages auto-logged</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 bg-purple-500 rounded-full" />
                        <span>1 InMail sent</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync LinkedIn Data
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View All Messages
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Navigator Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View LinkedIn profiles, mutual connections, and send InMail directly from CRM
                </p>
                <div className="space-y-4">
                  {(linkedinConnections as any)?.map((connection: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{connection?.name || `LinkedIn Connection ${index + 1}`}</p>
                          <p className="text-sm text-muted-foreground">{connection?.title || "Sales Professional"}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        InMail
                      </Button>
                    </div>
                  )) || [1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">LinkedIn Connection {i}</p>
                          <p className="text-sm text-muted-foreground">Sales Professional</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        InMail
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Logged LinkedIn Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(linkedinMessages as any)?.map((message: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{message?.sender || `LinkedIn User ${index + 1}`}</p>
                        <span className="text-xs text-muted-foreground">{message?.timestamp || "2 hours ago"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{message?.content || "LinkedIn message content auto-logged into CRM"}</p>
                    </div>
                  )) || [1, 2, 3].map((i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">LinkedIn User {i}</p>
                        <span className="text-xs text-muted-foreground">{i} hours ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">LinkedIn message content auto-logged into CRM</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>LinkedIn Generated Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(linkedinLeads as any)?.map((lead: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Target className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{lead?.name || `LinkedIn Lead ${index + 1}`}</p>
                          <p className="text-sm text-muted-foreground">{lead?.company || "Company Name"}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">New</Badge>
                    </div>
                  )) || [1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Target className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">LinkedIn Lead {i}</p>
                          <p className="text-sm text-muted-foreground">Company Name</p>
                        </div>
                      </div>
                      <Badge variant="secondary">New</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Credentials Modal */}
        <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure LinkedIn Credentials</DialogTitle>
              <DialogDescription>
                Enter your LinkedIn app credentials to enable integration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  placeholder="Enter LinkedIn Client ID"
                  value={credentials.clientId}
                  onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="Enter LinkedIn Client Secret"
                  value={credentials.clientSecret}
                  onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCredentialsModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => saveCredentialsMutation.mutate(credentials)}
                disabled={!credentials.clientId || !credentials.clientSecret}
              >
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Facebook Dashboard Component  
  const FacebookDashboard = () => {
    const { data: pages } = useQuery({
      queryKey: [`/api/tenants/${tenant?.id}/facebook/pages`],
      enabled: !!tenant?.id,
    });

    const { data: insights } = useQuery({
      queryKey: [`/api/tenants/${tenant?.id}/facebook/insights`],
      enabled: !!tenant?.id,
    });

    const { data: posts } = useQuery({
      queryKey: [`/api/tenants/${tenant?.id}/facebook/posts`],
      enabled: !!tenant?.id,
    });


    const disconnectFacebookMutation = useMutation({
      mutationFn: async () => {
        const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/facebook/disconnect`);
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/status`] });
        toast({
          title: "Facebook Disconnected",
          description: "Facebook Business Suite integration has been disconnected.",
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

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-600">Facebook Business Suite Connected</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => disconnectFacebookMutation.mutate()}
            disabled={disconnectFacebookMutation.isPending}
          >
            Disconnect
          </Button>
        </div>

        {/* Facebook Insights */}
        {(insights as any) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Reach</span>
                </div>
                <p className="text-2xl font-bold">{(insights as any).totalReach?.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Engagement</span>
                </div>
                <p className="text-2xl font-bold">{(insights as any).totalEngagement?.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Total Leads</span>
                </div>
                <p className="text-2xl font-bold">{(insights as any).totalLeads}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Connected Pages */}
        {(pages as any) && (pages as any).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connected Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(pages as any).map((page: any) => (
                  <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Facebook className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{page.pageName}</p>
                        <p className="text-sm text-gray-600">{page.followersCount} followers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {page.isInstagramConnected && (
                        <Badge variant="secondary" className="text-pink-600">
                          <Instagram className="h-3 w-3 mr-1" />
                          Instagram
                        </Badge>
                      )}
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={() => syncFacebookLeadsMutation.mutate()}
            disabled={syncFacebookLeadsMutation.isPending}
            className="flex-1"
          >
            {syncFacebookLeadsMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing Leads...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Leads
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => window.location.href = '/facebook-manage'}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Pages
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Social Media Integrations</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Connect your social media ad accounts to automatically import leads
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = '/facebook-business-suite'}>
              <Facebook className="h-4 w-4 mr-2" />
              Facebook Business Suite
            </Button>
            <Button onClick={() => window.open('https://developers.facebook.com', '_blank')} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Platform Setup Guides
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Integrations</p>
                  <p className="text-2xl font-bold">
                    {integrations.filter((int: SocialIntegration) => int.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Leads Imported</p>
                  <p className="text-2xl font-bold">
                    {integrations.reduce((sum: number, int: SocialIntegration) => sum + (int.totalLeadsImported || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <RefreshCw className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Last Sync</p>
                  <p className="text-2xl font-bold">
                    {integrations.some((int: SocialIntegration) => int.lastSync) ? "Today" : "Never"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="platforms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="platforms">Available Platforms</TabsTrigger>
            <TabsTrigger value="settings">Sync Settings</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms">
            {/* Facebook Lead Ads Highlight Section */}
            <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <Facebook className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Facebook Lead Ads Integration</h3>
                      <p className="text-gray-700 mb-4">
                        Automatically fetch leads from your Facebook Lead Ads campaigns and store them directly in your CRM leads table. 
                        No manual work required - leads are imported automatically when they submit your Facebook lead forms.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">Automatic Lead Import</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">Duplicate Detection</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">Real-time Sync Available</span>
                        </div>
                      </div>
                      {isFacebookLeadAdsConnected ? (
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => setIsFacebookLeadsManagerOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Manage Leads
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={async () => {
                              if (confirm("Are you sure you want to disconnect Facebook Lead Ads? You will need to reconnect to sync leads again.")) {
                                try {
                                  const response = await apiRequest(
                                    "DELETE",
                                    `/api/integrations/facebook-lead-ads/disconnect?tenantId=${tenant?.id}`
                                  );
                                  if (!response.ok) {
                                    const error = await response.json();
                                    throw new Error(error.error || "Failed to disconnect");
                                  }
                                  toast({
                                    title: "Disconnected Successfully",
                                    description: "Facebook Lead Ads integration has been disconnected.",
                                  });
                                  queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/social-integrations`] });
                                } catch (error: any) {
                                  toast({
                                    title: "Disconnect Failed",
                                    description: error.message || "Failed to disconnect Facebook Lead Ads",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={async () => {
                            try {
                              const response = await apiRequest(
                                "GET",
                                `/api/integrations/facebook-lead-ads/oauth/authorize?tenantId=${tenant?.id}`
                              );
                              if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.error || "Failed to get auth URL");
                              }
                              const { authUrl } = await response.json();
                              
                              // Open OAuth popup
                              const width = 600;
                              const height = 700;
                              const left = (window.screen.width - width) / 2;
                              const top = (window.screen.height - height) / 2;
                              
                              const popup = window.open(
                                authUrl,
                                'Facebook Lead Ads OAuth',
                                `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
                              );
                              
                              // Listen for success message
                              const messageListener = (event: MessageEvent) => {
                                if (event.data.type === 'FACEBOOK_OAUTH_SUCCESS' && event.data.integration === 'facebook-lead-ads') {
                                  window.removeEventListener('message', messageListener);
                                  popup?.close();
                                  
                                  // Refresh integrations to get the new connection status
                                  queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/social-integrations`] });
                                  
                                  // Wait a moment for the query to refresh, then show success and open leads manager
                                  setTimeout(() => {
                                    toast({
                                      title: "Facebook Lead Ads Connected!",
                                      description: "You can now sync leads from Facebook Lead Ads.",
                                    });
                                    // Automatically open the leads manager after successful connection
                                    setIsFacebookLeadsManagerOpen(true);
                                  }, 500);
                                } else if (event.data.type === 'FACEBOOK_OAUTH_ERROR') {
                                  window.removeEventListener('message', messageListener);
                                  popup?.close();
                                  toast({
                                    title: "Connection Failed",
                                    description: event.data.error || "Failed to connect Facebook Lead Ads",
                                    variant: "destructive",
                                  });
                                }
                              };
                              
                              window.addEventListener('message', messageListener);
                              
                              // Check if popup closed manually
                              const checkPopup = setInterval(() => {
                                if (popup?.closed) {
                                  clearInterval(checkPopup);
                                  window.removeEventListener('message', messageListener);
                                }
                              }, 500);
                            } catch (error: any) {
                              toast({
                                title: "Connection Failed",
                                description: error.message || "Failed to initiate Facebook Lead Ads connection",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Facebook className="h-4 w-4 mr-2" />
                          Connect Facebook Lead Ads
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {platforms.map((platform) => {
                const integration = getIntegrationForPlatform(platform.id);
                const isConfigured = integration && integration.appId;
                
                return (
                  <Card key={platform.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <platform.icon className="h-8 w-8 text-gray-600" />
                          <div className="ml-3">
                            <h3 className="font-semibold">{platform.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
                          </div>
                        </div>
                        {isConfigured ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Settings className="h-3 w-3 mr-1" />
                            Setup Required
                          </Badge>
                        )}
                      </div>

                      {isConfigured && (
                        <div className="space-y-2 mb-4">
                          <div className="text-sm">
                            <span className="text-gray-600">Last sync:</span> {integration.lastSync || 'Never'}
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Leads imported:</span> {integration.totalLeadsImported || 0}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Dialog open={selectedPlatform === platform.id} onOpenChange={(open) => setSelectedPlatform(open ? platform.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              <Settings className="h-4 w-4 mr-2" />
                              {isConfigured ? 'Manage Integration' : 'Setup Integration'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className={platform.id === 'linkedin' ? "max-w-6xl max-h-[90vh] overflow-y-auto" : "sm:max-w-[500px]"}>
                            <DialogHeader>
                              <DialogTitle>{platform.name} Integration</DialogTitle>
                              <DialogDescription>
                                Configure your {platform.name} integration to automatically sync leads
                              </DialogDescription>
                            </DialogHeader>
                            {platform.id === 'linkedin' ? (
                              <LinkedInBusinessSuite />
                            ) : (
                              <IntegrationSetupForm platform={platform} />
                            )}
                          </DialogContent>
                        </Dialog>

                        {isConfigured && platform.id !== 'facebook' && (
                          <Button 
                            className="w-full"
                            onClick={() => syncLeadsMutation.mutate(platform.id)}
                            disabled={syncLeadsMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {syncLeadsMutation.isPending ? 'Syncing...' : 'Sync Now'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Sync Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Sync Frequency</Label>
                    <select className="w-full mt-1 border rounded px-3 py-2">
                      <option>Every 15 minutes</option>
                      <option>Every hour</option>
                      <option>Every 4 hours</option>
                      <option>Daily</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Lead Status</Label>
                    <select className="w-full mt-1 border rounded px-3 py-2">
                      <option>New</option>
                      <option>Contacted</option>
                      <option>Qualified</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Enable automatic duplicate detection</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Send notifications for new leads</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label>Update existing leads with new information</Label>
                  </div>
                </div>

                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure webhooks for real-time lead synchronization
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Webhook URL</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      value={`${window.location.origin}/api/webhooks/social-leads/${tenant?.id}`}
                      readOnly
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/social-leads/${tenant?.id}`);
                        toast({
                          title: "Copied!",
                          description: "Webhook URL copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Use this URL in your social media platform webhook settings
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-blue-900">Webhook Setup Instructions</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Configure this webhook URL in your social media platform's developer settings
                        to receive real-time lead notifications instead of periodic sync.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Facebook Configuration Dialog */}
        <Dialog open={showFacebookConfig} onOpenChange={setShowFacebookConfig}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Facebook App</DialogTitle>
              <DialogDescription>
                Enter your Facebook App credentials to enable Facebook lead sync integration.
                You need to create a Facebook App first at developers.facebook.com
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="appId">Facebook App ID</Label>
                <Input
                  id="appId"
                  placeholder="Enter your Facebook App ID"
                  value={facebookConfig.appId}
                  onChange={(e) => setFacebookConfig({...facebookConfig, appId: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="appSecret">Facebook App Secret</Label>
                <Input
                  id="appSecret"
                  type="password"
                  placeholder="Enter your Facebook App Secret"
                  value={facebookConfig.appSecret}
                  onChange={(e) => setFacebookConfig({...facebookConfig, appSecret: e.target.value})}
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Setup Instructions:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Go to developers.facebook.com</li>
                      <li>Create a new app with business use case</li>
                      <li>Add permissions for lead generation and pages</li>
                      <li>Copy App ID and App Secret from Settings → Basic</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFacebookConfig(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => saveFacebookConfig.mutate(facebookConfig)}
                disabled={!facebookConfig.appId || !facebookConfig.appSecret || saveFacebookConfig.isPending}
              >
                {saveFacebookConfig.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Facebook Page Selection Modal */}
        <Dialog open={showPageSelectionModal} onOpenChange={setShowPageSelectionModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Connect Facebook Lead Ads</DialogTitle>
              <DialogDescription>
                Select the Facebook Pages and Lead Forms you want to connect. Leads from selected forms will be automatically imported into your CRM.
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingPages ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3">Loading your Facebook Pages...</span>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {/* Pages Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Select Facebook Pages</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availablePages.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No Facebook Pages found. Please make sure you have pages associated with your Facebook account.
                      </p>
                    ) : (
                      availablePages.map((page: any) => (
                        <div
                          key={page.pageId || page.id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedPages.has(page.pageId || page.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            const pageId = page.pageId || page.id;
                            setSelectedPages(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(pageId)) {
                                newSet.delete(pageId);
                                // Also remove lead forms for this page
                                const forms = pageLeadForms[pageId] || [];
                                forms.forEach((f: any) => {
                                  selectedLeadForms.delete(f.formId || f.id);
                                });
                                setSelectedLeadForms(new Set(selectedLeadForms));
                              } else {
                                newSet.add(pageId);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                              selectedPages.has(page.pageId || page.id)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedPages.has(page.pageId || page.id) && (
                                <CheckCircle className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{page.pageName || page.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {page.followersCount || page.fan_count || 0} followers
                                {page.isInstagramConnected && (
                                  <span className="ml-2 text-pink-600">• Instagram Connected</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Lead Forms Selection */}
                {selectedPages.size > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Select Lead Forms</h3>
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {Array.from(selectedPages).map((pageId: string) => {
                        const page = availablePages.find((p: any) => (p.pageId || p.id) === pageId);
                        const forms = pageLeadForms[pageId] || [];
                        
                        return (
                          <div key={pageId} className="border rounded-lg p-3">
                            <p className="font-medium text-sm mb-2 text-gray-700">
                              {page?.pageName || page?.name} Lead Forms:
                            </p>
                            {forms.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">
                                No lead forms found for this page.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {forms.map((form: any) => (
                                  <div
                                    key={form.formId || form.id}
                                    className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                                      selectedLeadForms.has(form.formId || form.id)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => {
                                      const formId = form.formId || form.id;
                                      setSelectedLeadForms(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(formId)) {
                                          newSet.delete(formId);
                                        } else {
                                          newSet.add(formId);
                                        }
                                        return newSet;
                                      });
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                                        selectedLeadForms.has(form.formId || form.id)
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-300'
                                      }`}>
                                        {selectedLeadForms.has(form.formId || form.id) && (
                                          <CheckCircle className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                      <span className="text-sm">{form.formName || form.name}</span>
                                    </div>
                                    {form.totalLeads !== undefined && (
                                      <span className="text-xs text-muted-foreground">
                                        {form.totalLeads} leads
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPageSelectionModal(false)}
                disabled={saveFacebookConnection.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveFacebookConnection.mutate()}
                disabled={selectedPages.size === 0 || saveFacebookConnection.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saveFacebookConnection.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Connection ({selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''}, {selectedLeadForms.size} form{selectedLeadForms.size !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Celebration Modal */}
        <Celebration
          isVisible={showCelebration}
          onClose={() => setShowCelebration(false)}
          platform={celebrationData.platform}
          stats={celebrationData.stats}
        />
      </div>

      {/* Facebook Leads Manager Dialog */}
      {tenant && (
        <FacebookLeadsManager
          isOpen={isFacebookLeadsManagerOpen}
          onClose={() => setIsFacebookLeadsManagerOpen(false)}
          tenantId={tenant.id}
        />
      )}
    </Layout>
  );
}
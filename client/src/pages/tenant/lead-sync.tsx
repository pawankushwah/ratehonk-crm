import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  RefreshCw, Copy, ExternalLink, Globe, Facebook, 
  Instagram, Linkedin, TrendingUp, Users, Clock, 
  CheckCircle, AlertCircle, Code, Book
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function LeadSync() {
  const { tenant } = useAuth();
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  const { data: syncStats, isLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/leads/sync-stats`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/leads/sync-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch sync statistics");
      return response.json();
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const handleConfigureIntegration = (platform: string) => {
    switch (platform) {
      case "Facebook Ads":
      case "Instagram Ads":
        navigate("/social-integrations");
        break;
      case "LinkedIn Ads":
        navigate("/social-integrations");
        break;
      case "Website Forms":
        setIsApiDialogOpen(true);
        break;
      default:
        navigate("/social-integrations");
    }
  };

  const apiEndpoints = [
    {
      title: "Single Lead Sync",
      endpoint: `/api/tenants/${tenant?.id}/leads/sync`,
      description: "Perfect for real-time website form submissions",
      method: "POST"
    },
    {
      title: "Bulk Lead Import",
      endpoint: `/api/tenants/${tenant?.id}/leads/bulk-sync`,
      description: "Import multiple leads with deduplication options",
      method: "POST"
    }
  ];

  const integrationExamples = [
    {
      platform: "Website Forms",
      icon: Globe,
      description: "Auto-sync leads from contact forms, landing pages, and newsletter signups",
      status: "Available",
      color: "bg-green-100 text-green-800"
    },
    {
      platform: "Facebook Ads",
      icon: Facebook,
      description: "Import leads from Facebook lead generation campaigns",
      status: "Available",
      color: "bg-blue-100 text-blue-800"
    },
    {
      platform: "Instagram Ads",
      icon: Instagram,
      description: "Sync leads from Instagram advertising campaigns",
      status: "Available",
      color: "bg-pink-100 text-pink-800"
    },
    {
      platform: "LinkedIn Ads",
      icon: Linkedin,
      description: "Connect LinkedIn lead generation forms",
      status: "Available",
      color: "bg-blue-100 text-blue-800"
    }
  ];

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lead Sync & Integrations</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Automatically sync leads from external sources and social media platforms
            </p>
          </div>
          <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Code className="h-4 w-4 mr-2" />
                API Documentation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>API Integration Guide</DialogTitle>
                <DialogDescription>
                  Use these endpoints to sync leads from your website or external platforms
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Authentication</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <p className="text-sm">API Key: <code>{syncStats?.apiKey}</code></p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(syncStats?.apiKey || '')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy API Key
                    </Button>
                  </div>
                </div>

                {apiEndpoints.map((endpoint, index) => (
                  <div key={index}>
                    <h3 className="font-semibold mb-2">{endpoint.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                      <p className="text-sm font-mono">
                        {endpoint.method} {window.location.origin}{endpoint.endpoint}
                      </p>
                    </div>
                    
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                        Show example request
                      </summary>
                      <div className="mt-2 bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm">
                        <pre>{JSON.stringify({
                          apiKey: syncStats?.apiKey,
                          source: "Website Contact Form",
                          leads: [{
                            firstName: "John",
                            lastName: "Doe",
                            email: "john@example.com",
                            phone: "+1234567890",
                            notes: "Interested in European tours"
                          }]
                        }, null, 2)}</pre>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold">{syncStats?.totalLeads || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Last 30 Days</p>
                  <p className="text-2xl font-bold">{syncStats?.recentActivity?.last30Days || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Daily Average</p>
                  <p className="text-2xl font-bold">{syncStats?.recentActivity?.avgPerDay || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <RefreshCw className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sources</p>
                  <p className="text-2xl font-bold">
                    {Object.keys(syncStats?.sourceBreakdown || {}).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sources" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sources">Lead Sources</TabsTrigger>
            <TabsTrigger value="integrations">Available Integrations</TabsTrigger>
            <TabsTrigger value="settings">Sync Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Lead Sources Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {syncStats?.sourceBreakdown && Object.keys(syncStats.sourceBreakdown).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(syncStats.sourceBreakdown).map(([source, count]) => (
                      <div key={source} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{source}</h3>
                          <p className="text-sm text-gray-600">{count} leads</p>
                        </div>
                        <Badge variant="secondary">
                          {Math.round(((count as number) / syncStats.totalLeads) * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No lead sources yet</h3>
                    <p className="text-gray-600">Start syncing leads from external sources to see breakdown here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrationExamples.map((integration, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <integration.icon className="h-8 w-8 text-gray-600" />
                        <div className="ml-4">
                          <h3 className="font-semibold">{integration.platform}</h3>
                          <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                        </div>
                      </div>
                      <Badge className={integration.color}>
                        {integration.status}
                      </Badge>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setIsApiDialogOpen(true)}>
                        <Book className="h-4 w-4 mr-2" />
                        Setup Guide
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleConfigureIntegration(integration.platform)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Sync Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <div className="flex space-x-2">
                    <Input
                      value={syncStats?.apiKey || ''}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(syncStats?.apiKey || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Use this key to authenticate API requests from external sources
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Duplicate Handling</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Skip duplicate emails
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Update existing leads
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Default Settings</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm mb-1">Default Status</label>
                        <select className="w-full border rounded px-3 py-2">
                          <option>New</option>
                          <option>Contacted</option>
                          <option>Qualified</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <Button>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
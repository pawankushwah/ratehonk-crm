import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { 
  Link,
  Unlink,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Info,
  Shield,
  Mail,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";

export default function GmailSettings() {
  const { toast } = useToast();
  const { tenant } = useAuth();
  const [, setLocation] = useLocation();
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);

  // Fetch Gmail integration status
  const { data: gmailStatus, isLoading: gmailLoading, refetch: refetchGmailStatus } = useQuery({
    queryKey: [`/api/gmail/status/${tenant?.id}`],
    enabled: !!tenant?.id,
  }) as { data: any, isLoading: boolean, refetch: () => void };

  // Handle Gmail OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gmailParam = urlParams.get('gmail');
    const reason = urlParams.get('reason');

    if (gmailParam === 'connected') {
      toast({
        title: "Gmail Connected Successfully",
        description: "Your Gmail account has been linked to your CRM. You can now sync and manage emails.",
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh Gmail status
      refetchGmailStatus();
    } else if (gmailParam === 'error') {
      let errorMessage = "Failed to connect Gmail account. Please try again.";
      if (reason === 'auth_failed') {
        errorMessage = "Gmail authorization failed. Please ensure you grant all required permissions.";
      } else if (reason === 'missing_params') {
        errorMessage = "Invalid authorization response from Gmail. Please try connecting again.";
      } else if (reason === 'server_error') {
        errorMessage = "Server error during Gmail connection. Please try again later.";
      }
      
      toast({
        title: "Gmail Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, refetchGmailStatus]);

  // Gmail connection handlers
  const handleGmailConnect = async () => {
    setIsConnectingGmail(true);
    try {
      // Add debugging to check tenant ID
      console.log('📧 Gmail connect - tenant:', tenant);
      console.log('📧 Gmail connect - tenant ID:', tenant?.id);
      
      if (!tenant?.id) {
        throw new Error('No tenant ID available - please refresh and try again');
      }
      
      const url = `/api/gmail/connect/${tenant.id}`;
      console.log('📧 Gmail connect - URL:', url);
      
      const response = await apiRequest("POST", url, {});
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json(); // Parse JSON from Response object
      console.log('📧 Full Gmail connect response:', data);
      
      // Handle response properly - data should contain the authUrl
      if (data && data.authUrl && typeof data.authUrl === 'string') {
        console.log('📧 Gmail OAuth URL received:', data.authUrl);
        // Don't reset connection state here, let OAuth callback handle it
        window.location.href = data.authUrl;
      } else {
        console.error('📧 Invalid response data:', data);
        throw new Error('No valid OAuth URL received from server');
      }
    } catch (error: any) {
      console.error('📧 Gmail connect error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate Gmail connection",
        variant: "destructive",
      });
      setIsConnectingGmail(false);
    }
  };

  const handleGmailDisconnect = async () => {
    try {
      await apiRequest("DELETE", `/api/gmail/disconnect/${tenant?.id}`, {});
      refetchGmailStatus();
      toast({
        title: "Disconnected",
        description: "Gmail integration has been disconnected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect Gmail integration",
        variant: "destructive",
      });
    }
  };

  const handleGmailSync = async () => {
    try {
      console.log('📧 Starting Gmail sync for tenant:', tenant?.id);
      const response = await apiRequest("POST", `/api/gmail/sync/${tenant?.id}`, {});
      console.log('📧 Gmail sync response:', response);
      
      refetchGmailStatus();
      toast({
        title: "Success",
        description: "Gmail emails synced successfully",
      });
    } catch (error: any) {
      console.error('📧 Gmail sync error:', error);
      let errorMessage = "Failed to sync Gmail emails";
      
      if (error.message && error.message.includes("session has expired")) {
        errorMessage = error.message;
        // Redirect to login after showing error
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else if (error.message && error.message.includes("Gmail access token expired")) {
        errorMessage = "Gmail connection expired. Please reconnect your Gmail account.";
      } else if (error.message && error.message.includes("Gmail integration not found")) {
        errorMessage = "Gmail not connected. Please connect your Gmail account first.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setLocation("/shortcuts");
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg shadow-sm border border-gray-200 hover:shadow-md"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-red-500 to-blue-500 rounded-lg">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gmail Settings</h1>
            <p className="text-muted-foreground">
              Connect and manage your Gmail account integration
            </p>
          </div>
        </div>

        {/* Gmail Integration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Gmail Integration
            </CardTitle>
            <CardDescription>
              Connect your Gmail account to access emails within the portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {gmailLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : gmailStatus?.isConnected ? (
              <div className="space-y-4">
                {/* Connected Status */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100">
                        Gmail Connected
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Connected to {gmailStatus.gmailAddress}
                        {gmailStatus.lastSyncAt && (
                          <span className="ml-2">
                            • Last synced {new Date(gmailStatus.lastSyncAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleGmailSync}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sync Emails
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/gmail-emails" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Gmail Emails
                    </a>
                  </Button>
                  <Button
                    onClick={handleGmailDisconnect}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Unlink className="h-4 w-4" />
                    Disconnect
                  </Button>
                </div>

                {/* Sync Info */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                        Gmail Integration Features
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                        <li>• View Gmail emails within the portal</li>
                        <li>• Search and filter email messages</li>
                        <li>• Automatic email synchronization</li>
                        <li>• Secure OAuth2 authentication</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Not Connected Status */}
                <div className="text-center py-8">
                  <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connect Your Gmail Account</h3>
                  <p className="text-muted-foreground mb-6">
                    Integrate your Gmail account to view and manage emails directly within the portal
                  </p>
                  <Button
                    onClick={handleGmailConnect}
                    disabled={isConnectingGmail}
                    className="flex items-center gap-2"
                  >
                    {isConnectingGmail ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link className="h-4 w-4" />
                    )}
                    Connect Gmail Account
                  </Button>
                </div>

                {/* Security Info */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                        Secure OAuth2 Authentication
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        We use Google's secure OAuth2 protocol. Your Gmail password is never stored or shared. 
                        You can revoke access at any time from your Google Account settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


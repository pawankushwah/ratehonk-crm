import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertEmailConfigurationSchema, type EmailConfiguration } from "@shared/schema";
import { 
  Mail, 
  Settings, 
  Shield, 
  Server, 
  Eye, 
  MousePointer, 
  Send,
  CheckCircle,
  AlertCircle,
  Info,
  Link,
  Unlink,
  RefreshCw,
  ExternalLink
} from "lucide-react";

const emailConfigSchema = insertEmailConfigurationSchema.extend({
  tenantId: z.number(),
});

type EmailConfigFormData = z.infer<typeof emailConfigSchema>;

export default function EmailSettings() {
  const { toast } = useToast();
  const { tenant } = useAuth();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
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
  }, [toast]); // Removed refetchGmailStatus from dependencies to prevent error

  // Fetch current email configuration
  const { data: emailConfig, isLoading } = useQuery<EmailConfiguration>({
    queryKey: [`/api/email-configurations/${tenant?.id}`],
    enabled: !!tenant?.id,
  });

  const form = useForm<EmailConfigFormData>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      tenantId: tenant?.id || 0,
      senderName: "",
      senderEmail: "",
      replyToEmail: "",
      smtpHost: "",
      smtpPort: 587,
      smtpUsername: "",
      smtpPassword: "",
      smtpSecurity: "tls",
      isSmtpEnabled: false,
      dailySendLimit: 1000,
      bounceHandling: true,
      trackOpens: true,
      trackClicks: true,
      unsubscribeFooter: "",
      emailSignature: "",
      isActive: true,
    },
  });

  // Update form values when emailConfig is loaded
  useEffect(() => {
    if (emailConfig && tenant?.id) {
      console.log('📧 Populating form with loaded config:', emailConfig);
      
      // Handle both camelCase and snake_case field names from API
      const config = emailConfig as any;
      
      form.reset({
        tenantId: tenant.id,
        senderName: config.sender_name || config.senderName || "",
        senderEmail: config.sender_email || config.senderEmail || "",
        replyToEmail: config.reply_to_email || config.replyToEmail || "",
        smtpHost: config.smtp_host || config.smtpHost || "",
        smtpPort: config.smtp_port || config.smtpPort || 587,
        smtpUsername: config.smtp_username || config.smtpUsername || "",
        smtpPassword: config.smtp_password || config.smtpPassword || "",
        smtpSecurity: config.smtp_security || config.smtpSecurity || "tls",
        isSmtpEnabled: config.is_smtp_enabled ?? config.isSmtpEnabled ?? false,
        dailySendLimit: config.daily_send_limit || config.dailySendLimit || 1000,
        bounceHandling: config.bounce_handling ?? config.bounceHandling ?? true,
        trackOpens: config.track_opens ?? config.trackOpens ?? true,
        trackClicks: config.track_clicks ?? config.trackClicks ?? true,
        unsubscribeFooter: config.unsubscribe_footer || config.unsubscribeFooter || "",
        emailSignature: config.email_signature || config.emailSignature || "",
        isActive: config.is_active ?? config.isActive ?? true,
      });
      
      console.log('📧 Form populated with values');
    }
  }, [emailConfig, tenant?.id, form]);

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: EmailConfigFormData) => {
      console.log('📧 Saving email configuration:', data);
      return apiRequest("POST", "/api/email-configurations", data);
    },
    onSuccess: (response: any) => {
      console.log('📧 Email configuration saved successfully:', response);
      queryClient.invalidateQueries({ queryKey: [`/api/email-configurations/${tenant?.id}`] });
      toast({
        title: "Configuration Updated",
        description: "Your email settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error('📧 Email configuration save error:', error);
      // Check if data was saved despite error response
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/email-configurations/${tenant?.id}`] });
      }, 1000);
      
      toast({
        title: "Error",
        description: error?.message || "Failed to update email configuration.",
        variant: "destructive",
      });
    },
  });

  // Test SMTP connection
  const testSmtpConnection = async () => {
    setIsTestingConnection(true);
    try {
      const testPayload = {
        smtpHost: form.getValues("smtpHost"),
        smtpPort: form.getValues("smtpPort"),
        smtpUsername: form.getValues("smtpUsername"),
        smtpPassword: form.getValues("smtpPassword"),
        smtpSecurity: form.getValues("smtpSecurity"),
        senderEmail: form.getValues("senderEmail"), // Include sender email for test
      };
      
      console.log('📧 Testing SMTP with payload:', { ...testPayload, smtpPassword: '***' });
      
      const response = await apiRequest("POST", "/api/email-configurations/test-smtp", testPayload);
      const result = await response.json();
      
      toast({
        title: "Connection Successful",
        description: result.message || "SMTP configuration is working correctly.",
      });
    } catch (error: any) {
      console.error('📧 SMTP test error:', error);
      toast({
        title: "Connection Failed",
        description: error?.message || "Please check your SMTP settings and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

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

  const onSubmit = (data: EmailConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-8">
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
      <div className="container max-w-4xl mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Email Settings</h1>
            <p className="text-muted-foreground">
              Configure your email sending preferences and SMTP settings
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="sender" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="sender" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Sender Info
                </TabsTrigger>
                <TabsTrigger value="smtp" className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  SMTP Config
                </TabsTrigger>
                <TabsTrigger value="gmail" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Gmail
                </TabsTrigger>
                <TabsTrigger value="tracking" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Tracking
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* Sender Information Tab */}
              <TabsContent value="sender" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Sender Information
                    </CardTitle>
                    <CardDescription>
                      Configure how your emails appear to recipients
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="senderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sender Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Company Name" {...field} />
                            </FormControl>
                            <FormDescription>
                              The name that appears in recipients' inboxes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="senderEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sender Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="hello@paradisetravel.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              The email address emails are sent from
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="replyToEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reply-To Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="support@paradisetravel.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Where replies will be sent (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="emailSignature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Signature</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Best regards,&#10;Paradise Travel Team&#10;📞 +1 (555) 123-4567&#10;🌐 www.paradisetravel.com"
                              className="min-h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Automatically added to the end of all emails
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SMTP Configuration Tab */}
              <TabsContent value="smtp" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      SMTP Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure your mail server settings for reliable email delivery
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="isSmtpEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable SMTP</FormLabel>
                            <FormDescription>
                              Use custom SMTP server instead of default email service
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("isSmtpEnabled") && (
                      <div className="space-y-6 p-4 bg-muted/50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="smtpHost"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Host</FormLabel>
                                <FormControl>
                                  <Input placeholder="smtp.gmail.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="smtpPort"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Port</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="587" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="smtpUsername"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="your-email@gmail.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="smtpPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Password</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="••••••••••••" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="smtpSecurity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Security</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select security type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="tls">TLS</SelectItem>
                                    <SelectItem value="ssl">SSL</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={testSmtpConnection}
                            disabled={isTestingConnection || !form.watch("smtpHost")}
                            className="flex items-center gap-2"
                          >
                            {isTestingConnection ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Test Connection
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gmail Integration Tab */}
              <TabsContent value="gmail" className="space-y-6">
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
              </TabsContent>

              {/* Tracking & Analytics Tab */}
              <TabsContent value="tracking" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Email Tracking & Analytics
                    </CardTitle>
                    <CardDescription>
                      Configure email performance tracking and analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="trackOpens"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Track Email Opens
                              </FormLabel>
                              <FormDescription>
                                Monitor when recipients open your emails
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="trackClicks"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <MousePointer className="h-4 w-4" />
                                Track Link Clicks
                              </FormLabel>
                              <FormDescription>
                                Track when recipients click links in your emails
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bounceHandling"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Bounce Handling
                              </FormLabel>
                              <FormDescription>
                                Automatically handle bounced emails and maintain sender reputation
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Settings Tab */}
              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Advanced Settings
                    </CardTitle>
                    <CardDescription>
                      Configure sending limits and compliance settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="dailySendLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Send Limit</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1000" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum number of emails to send per day
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unsubscribeFooter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unsubscribe Footer</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="You received this email because you're subscribed to our travel updates. Click here to unsubscribe."
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Compliance footer automatically added to all emails
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                            Email Compliance Tips
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Always include unsubscribe links and your business address in emails to comply with regulations like CAN-SPAM and GDPR.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={updateConfigMutation.isPending}
                className="flex items-center gap-2"
              >
                {updateConfigMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Save Configuration
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
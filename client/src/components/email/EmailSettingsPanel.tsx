import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  Info
} from "lucide-react";

const emailConfigSchema = insertEmailConfigurationSchema.extend({
  tenantId: z.number(),
});

type EmailConfigFormData = z.infer<typeof emailConfigSchema>;

interface EmailSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailSettingsPanel({
  open,
  onOpenChange,
}: EmailSettingsPanelProps) {
  const { toast } = useToast();
  const { tenant } = useAuth();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Fetch current email configuration
  const { data: emailConfig, isLoading } = useQuery<EmailConfiguration>({
    queryKey: [`/api/email-configurations/${tenant?.id}`],
    enabled: !!tenant?.id && open,
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
    if (emailConfig && tenant?.id && open) {
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
    }
  }, [emailConfig, tenant?.id, form, open]);

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: EmailConfigFormData) => {
      return apiRequest("POST", "/api/email-configurations", data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/email-configurations/${tenant?.id}`] });
      toast({
        title: "Configuration Updated",
        description: "Your email settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
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
        senderEmail: form.getValues("senderEmail"),
      };
      
      const response = await apiRequest("POST", "/api/email-configurations/test-smtp", testPayload);
      const result = await response.json();
      
      toast({
        title: "Connection Successful",
        description: result.message || "SMTP configuration is working correctly.",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error?.message || "Please check your SMTP settings and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const onSubmit = (data: EmailConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Settings
          </SheetTitle>
          <SheetDescription>
            Configure your email sending preferences and SMTP settings
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              <Tabs defaultValue="sender" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="sender" className="flex items-center gap-2 text-xs">
                    <Mail className="h-3 w-3" />
                    Sender
                  </TabsTrigger>
                  <TabsTrigger value="smtp" className="flex items-center gap-2 text-xs">
                    <Server className="h-3 w-3" />
                    SMTP
                  </TabsTrigger>
                  <TabsTrigger value="tracking" className="flex items-center gap-2 text-xs">
                    <Eye className="h-3 w-3" />
                    Tracking
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="flex items-center gap-2 text-xs">
                    <Shield className="h-3 w-3" />
                    Advanced
                  </TabsTrigger>
                </TabsList>

                {/* Sender Information Tab */}
                <TabsContent value="sender" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Sender Information
                      </CardTitle>
                      <CardDescription>
                        Configure how your emails appear to recipients
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
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

                        <FormField
                          control={form.control}
                          name="emailSignature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Signature</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Best regards,&#10;Paradise Travel Team"
                                  className="min-h-20"
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
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* SMTP Configuration Tab */}
                <TabsContent value="smtp" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        SMTP Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure your mail server settings for reliable email delivery
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                          <div className="grid grid-cols-1 gap-4">
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
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tracking & Analytics Tab */}
                <TabsContent value="tracking" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Email Tracking & Analytics
                      </CardTitle>
                      <CardDescription>
                        Configure email performance tracking and analytics
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
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
                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Advanced Settings
                      </CardTitle>
                      <CardDescription>
                        Configure sending limits and compliance settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
              <div className="flex justify-end pt-4 border-t">
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
        )}
      </SheetContent>
    </Sheet>
  );
}


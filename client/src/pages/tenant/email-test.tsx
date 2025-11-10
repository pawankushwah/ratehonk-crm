import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, TestTube, CheckCircle, AlertCircle, Settings, Server } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/layout";

function EmailTestPageContent() {
  const [testEmail, setTestEmail] = useState("");
  const [useTenantSmtp, setUseTenantSmtp] = useState(true);
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
  const { toast } = useToast();

  // Get email campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/email-campaigns"]
  });

  // Get tenant email configuration to check if tenant SMTP is available
  const { data: emailConfig } = useQuery({
    queryKey: ["/api/email-configurations/1"]
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async ({ email, useTenantSmtp }: { email: string; useTenantSmtp: boolean }) => {
      return apiRequest("/api/test-email", {
        method: "POST",
        body: { email, useTenantSmtp }
      });
    },
    onSuccess: () => {
      toast({
        title: "Test email sent!",
        description: "Check your inbox for the test email.",
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email test failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    }
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, recipients }: { campaignId: number; recipients: string }) => {
      return apiRequest(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
        body: { recipients }
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Campaign sent successfully!",
        description: `Sent to ${data.successCount} recipients. ${data.failureCount} failed.`,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Campaign sending failed",
        description: error.message || "Failed to send campaign",
        variant: "destructive",
      });
    }
  });

  const handleTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address to test",
        variant: "destructive",
      });
      return;
    }

    // Check if tenant SMTP is enabled when trying to use it
    if (useTenantSmtp && (!emailConfig?.isSmtpEnabled || !emailConfig?.smtpHost)) {
      toast({
        title: "Tenant SMTP not configured",
        description: "Please configure your tenant SMTP settings first or use SaaS SMTP",
        variant: "destructive",
      });
      return;
    }

    testEmailMutation.mutate({ email: testEmail, useTenantSmtp });
  };

  const handleSendCampaign = (campaignId: number) => {
    sendCampaignMutation.mutate({
      campaignId,
      recipients: "all" // Send to all customers
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mail className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Email System Testing</h1>
      </div>

      {/* SMTP Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            SMTP Configuration Test
          </CardTitle>
          <CardDescription>
            Test your email configuration to ensure it's working properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SMTP Type Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="smtp-type"
                checked={useTenantSmtp}
                onCheckedChange={setUseTenantSmtp}
                disabled={!emailConfig?.isSmtpEnabled || !emailConfig?.smtpHost}
              />
              <Label htmlFor="smtp-type" className="flex items-center gap-2">
                {useTenantSmtp ? (
                  <>
                    <Settings className="h-4 w-4" />
                    Use Tenant SMTP Configuration
                  </>
                ) : (
                  <>
                    <Server className="h-4 w-4" />
                    Use SaaS SMTP (Hostinger)
                  </>
                )}
              </Label>
            </div>
            
            {/* SMTP Status Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-sm">
                <strong>Current SMTP:</strong>{" "}
                {useTenantSmtp ? (
                  emailConfig?.isSmtpEnabled && emailConfig?.smtpHost ? (
                    <span className="text-green-600 dark:text-green-400">
                      Tenant SMTP ({emailConfig.smtpHost}:{emailConfig.smtpPort})
                    </span>
                  ) : (
                    <span className="text-orange-600 dark:text-orange-400">
                      Tenant SMTP (Not Configured)
                    </span>
                  )
                ) : (
                  <span className="text-blue-600 dark:text-blue-400">
                    SaaS SMTP (smtp.hostinger.com:587)
                  </span>
                )}
              </div>
              {useTenantSmtp && (!emailConfig?.isSmtpEnabled || !emailConfig?.smtpHost) && (
                <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  Configure your tenant SMTP in Email Settings to use this option
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="your-email@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleTestEmail}
            disabled={testEmailMutation.isPending}
            className="w-full"
          >
            {testEmailMutation.isPending ? (
              "Sending test email..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Campaign Testing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            SMTP Configuration Test
          </CardTitle>
          <CardDescription>
            Test your Hostinger SMTP configuration by sending a test email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="Enter email to test SMTP"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleTestEmail}
            disabled={testEmailMutation.isPending}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
          </Button>
          
          {/* SMTP Configuration Info */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Current SMTP Configuration:</h4>
            <div className="text-sm space-y-1">
              <div><strong>Host:</strong> smtp.hostinger.com</div>
              <div><strong>Port:</strong> 587</div>
              <div><strong>From:</strong> support@ajresort.com</div>
              <div><strong>Security:</strong> STARTTLS</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Campaigns Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Email Campaigns
          </CardTitle>
          <CardDescription>
            Send email campaigns to your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="text-center py-4">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email campaigns found</p>
              <p className="text-sm">Create your first campaign in the Email Marketing section</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign: any) => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={campaign.status === 'draft' ? 'outline' : 'default'}>
                          {campaign.status}
                        </Badge>
                        {campaign.status === 'sent' && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Sent
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {campaign.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleSendCampaign(campaign.id)}
                          disabled={sendCampaignMutation.isPending}
                        >
                          Send to All Customers
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Welcome Email Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Welcome Email System
          </CardTitle>
          <CardDescription>
            Automatic welcome emails for new tenant signups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Welcome emails are active</h4>
                <p className="text-sm text-green-700">
                  New tenants automatically receive welcome emails with trial plan details
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Welcome Email Features:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                <li>Professional HTML email template</li>
                <li>14-day trial plan details</li>
                <li>Feature overview and quick start guide</li>
                <li>Contact information and support details</li>
                <li>Automatic sending on successful registration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmailTestPage() {
  return (
    <Layout>
      <EmailTestPageContent />
    </Layout>
  );
}

export default EmailTestPage;
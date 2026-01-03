import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Target, 
  Users, 
  Calendar as CalendarIcon, 
  Settings,
  Eye,
  Save,
  Send,
  Clock,
  Zap,
  FileText,
  Image,
  Link as LinkIcon,
  Plus,
  X
} from "lucide-react";
import { format } from "date-fns";
import { RecipientSelector } from "./RecipientSelector";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  channel: z.enum(["email", "sms", "whatsapp", "multi_channel"]),
  objective: z.enum([
    "lead_generation",
    "package_promotion",
    "seasonal_offers",
    "abandoned_inquiry",
    "post_booking_upsell",
    "feedback_reviews"
  ]),
  subject: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  scheduledAt: z.date().optional(),
  timezone: z.string().default("UTC"),
  segmentId: z.number().optional(),
  templateId: z.number().optional(),
  internalNotes: z.string().optional(),
  selectedRecipients: z.array(z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    type: z.enum(["customer", "lead"]),
  })).optional(),
  audienceType: z.enum(["segment", "manual"]).default("manual"),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignBuilderProps {
  onSave: (data: CampaignFormData) => void;
  onSend?: (data: CampaignFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<CampaignFormData>;
  isLoading?: boolean;
}

export function CampaignBuilder({ 
  onSave, 
  onSend,
  onCancel,
  initialData,
  isLoading = false 
}: CampaignBuilderProps) {
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = useState("setup");
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(initialData?.templateId || null);
  const [selectedRecipients, setSelectedRecipients] = useState<any[]>(initialData?.selectedRecipients || []);
  const [audienceType, setAudienceType] = useState<"segment" | "manual">(initialData?.audienceType || "manual");

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: initialData?.name || "",
      channel: initialData?.channel || "email",
      objective: initialData?.objective || "lead_generation",
      subject: initialData?.subject || "",
      content: initialData?.content || "",
      fromName: initialData?.fromName || "",
      fromEmail: initialData?.fromEmail || "",
      replyTo: initialData?.replyTo || "",
      scheduledAt: initialData?.scheduledAt,
      timezone: initialData?.timezone || "UTC",
      segmentId: initialData?.segmentId,
      templateId: initialData?.templateId,
      internalNotes: initialData?.internalNotes || "",
      selectedRecipients: initialData?.selectedRecipients || [],
      audienceType: initialData?.audienceType || "manual",
    },
  });

  // Fetch templates
  const { data: templates = [] } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/email-templates`],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenant?.id}/email-templates`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!tenant?.id,
  });

  // Fetch segments
  const { data: segments = [] } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenant?.id}/email-segments`],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenant?.id}/email-segments`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!tenant?.id,
  });

  const channel = form.watch("channel");
  const objective = form.watch("objective");

  const handleSave = (data: CampaignFormData) => {
    onSave({ ...data, selectedRecipients, audienceType });
  };

  const handleTemplateSelect = (templateId: number) => {
    const template = templates.find((t: any) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      form.setValue("templateId", templateId);
      if (template.subject) form.setValue("subject", template.subject);
      if (template.content) {
        form.setValue("content", template.content);
      }
    }
  };

  const handleSend = (data: CampaignFormData) => {
    if (onSend) {
      onSend(data);
    }
  };

  const personalizationTokens = [
    { token: "{{FirstName}}", description: "Recipient's first name" },
    { token: "{{LastName}}", description: "Recipient's last name" },
    { token: "{{Email}}", description: "Recipient's email" },
    { token: "{{Destination}}", description: "Preferred destination" },
    { token: "{{TravelDate}}", description: "Travel date" },
    { token: "{{AgentName}}", description: "Assigned agent name" },
    { token: "{{BookingLink}}", description: "Booking link" },
    { token: "{{CompanyName}}", description: "Company name" },
    { token: "{{PackageName}}", description: "Package name" },
    { token: "{{Price}}", description: "Package price" },
  ];

  const insertToken = (token: string) => {
    const currentContent = form.getValues("content");
    form.setValue("content", currentContent + token);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <form onSubmit={form.handleSubmit(handleSave)} className="flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Basics</CardTitle>
                <CardDescription>
                  Configure the fundamental settings for your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selection - Prominent at top */}
                <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label htmlFor="template" className="text-base font-semibold">Select Template (Optional)</Label>
                  <Select
                    value={selectedTemplate?.toString() || "none"}
                    onValueChange={(value) => {
                      if (value !== "none") {
                        handleTemplateSelect(parseInt(value));
                      } else {
                        setSelectedTemplate(null);
                        form.setValue("templateId", undefined);
                        form.setValue("subject", "");
                        form.setValue("content", "");
                      }
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose a template or create from scratch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Template - Create from Scratch</SelectItem>
                      {templates.length === 0 ? (
                        <SelectItem value="no-templates" disabled>
                          No templates available. Create templates first.
                        </SelectItem>
                      ) : (
                        templates
                          .filter((t: any) => {
                            const currentChannel = form.watch("channel");
                            return t.channel === currentChannel || currentChannel === "multi_channel";
                          })
                          .map((template: any) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name} ({template.channel}) {template.category && `- ${template.category}`}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <p className="text-xs text-blue-700 mt-1">
                      ✓ Template selected. Content will be loaded from template.
                    </p>
                  )}
                  {!selectedTemplate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a template to pre-fill content, or create from scratch
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Summer Travel Promotion 2024"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="channel">Channel *</Label>
                    <Select
                      value={form.watch("channel")}
                      onValueChange={(value) => form.setValue("channel", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="sms">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            SMS
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="multi_channel">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Multi-Channel
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objective">Campaign Objective *</Label>
                    <Select
                      value={form.watch("objective")}
                      onValueChange={(value) => form.setValue("objective", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select objective" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead_generation">Lead Generation</SelectItem>
                        <SelectItem value="package_promotion">Package Promotion</SelectItem>
                        <SelectItem value="seasonal_offers">Seasonal Offers</SelectItem>
                        <SelectItem value="abandoned_inquiry">Abandoned Inquiry Follow-up</SelectItem>
                        <SelectItem value="post_booking_upsell">Post-Booking Upsell</SelectItem>
                        <SelectItem value="feedback_reviews">Feedback / Reviews</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {channel === "email" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fromName">From Name</Label>
                        <Input
                          id="fromName"
                          {...form.register("fromName")}
                          placeholder="Your Company Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fromEmail">From Email</Label>
                        <Input
                          id="fromEmail"
                          type="email"
                          {...form.register("fromEmail")}
                          placeholder="noreply@yourcompany.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replyTo">Reply-To Email</Label>
                      <Input
                        id="replyTo"
                        type="email"
                        {...form.register("replyTo")}
                        placeholder="support@yourcompany.com"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="internalNotes">Internal Notes</Label>
                  <Textarea
                    id="internalNotes"
                    {...form.register("internalNotes")}
                    placeholder="Add any internal notes or reminders about this campaign..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Content</CardTitle>
                <CardDescription>
                  Create your message content with personalization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {channel === "email" && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject *</Label>
                    <Input
                      id="subject"
                      {...form.register("subject")}
                      placeholder="Discover Amazing Travel Deals This Summer!"
                    />
                    <p className="text-xs text-muted-foreground">
                      {form.watch("subject")?.length || 0} characters
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">Message Content *</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewMode(!previewMode)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {previewMode ? "Edit" : "Preview"}
                      </Button>
                    </div>
                  </div>

                  {previewMode ? (
                    <div className="border rounded-lg p-4 min-h-[300px] bg-white">
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ 
                        __html: form.watch("content") || "<p>No content</p>" 
                      }} />
                    </div>
                  ) : (
                    <Textarea
                      id="content"
                      {...form.register("content")}
                      placeholder="Write your campaign message here..."
                      className="min-h-[300px] font-mono"
                      rows={12}
                    />
                  )}
                </div>

                <div className="border rounded-lg p-4">
                  <Label className="mb-2 block">Personalization Tokens</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Click a token to insert it into your content
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {personalizationTokens.map((item) => (
                      <Button
                        key={item.token}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertToken(item.token)}
                        className="justify-start text-left h-auto py-2"
                      >
                        <code className="text-xs font-mono">{item.token}</code>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Target Audience</CardTitle>
                <CardDescription>
                  Select who will receive this campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Audience Selection Method</Label>
                  <Select
                    value={audienceType}
                    onValueChange={(value: "segment" | "manual") => {
                      setAudienceType(value);
                      form.setValue("audienceType", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Selection (Customers/Leads)</SelectItem>
                      <SelectItem value="segment">Saved Segment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {audienceType === "segment" ? (
                  <div className="space-y-2">
                    <Label>Select Segment</Label>
                    <Select
                      value={form.watch("segmentId")?.toString() || ""}
                      onValueChange={(value) => {
                        form.setValue("segmentId", parseInt(value));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a segment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_customers">All Customers</SelectItem>
                        <SelectItem value="new_leads">New Leads</SelectItem>
                        <SelectItem value="recent_bookings">Recent Bookings</SelectItem>
                        {segments.map((segment: any) => (
                          <SelectItem key={segment.id} value={segment.id.toString()}>
                            {segment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Estimated Recipients</Label>
                        <Badge variant="secondary">
                          {form.watch("segmentId") === 1 ? "All customers" : 
                           form.watch("segmentId") === 2 ? "New leads" :
                           form.watch("segmentId") === 3 ? "Recent bookings" :
                           segments.find((s: any) => s.id === form.watch("segmentId"))?.subscriberCount || 0} contacts
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <RecipientSelector
                    selectedRecipients={selectedRecipients}
                    onSelectionChange={setSelectedRecipients}
                    channel={channel}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Campaign</CardTitle>
                <CardDescription>
                  Choose when to send your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Send Time</Label>
                  <Select
                    value={form.watch("scheduledAt") ? "scheduled" : "immediate"}
                    onValueChange={(value) => {
                      if (value === "immediate") {
                        form.setValue("scheduledAt", undefined);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Send Immediately</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.watch("scheduledAt") !== undefined && (
                  <div className="space-y-2">
                    <Label>Schedule Date & Time</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={form.watch("scheduledAt") ? format(form.watch("scheduledAt")!, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          if (date) {
                            const existing = form.watch("scheduledAt");
                            if (existing) {
                              date.setHours(existing.getHours());
                              date.setMinutes(existing.getMinutes());
                            }
                            form.setValue("scheduledAt", date);
                          }
                        }}
                      />
                      <Input
                        type="time"
                        value={form.watch("scheduledAt") ? format(form.watch("scheduledAt")!, "HH:mm") : ""}
                        onChange={(e) => {
                          const time = e.target.value;
                          if (time) {
                            const [hours, minutes] = time.split(":").map(Number);
                            const date = form.watch("scheduledAt") || new Date();
                            date.setHours(hours);
                            date.setMinutes(minutes);
                            form.setValue("scheduledAt", date);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={form.watch("timezone")}
                    onValueChange={(value) => form.setValue("timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure additional campaign options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
        </div>
        
        {/* Action Buttons - Fixed at bottom */}
        <div className="flex items-center justify-between pt-4 pb-4 px-6 border-t bg-white flex-shrink-0">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Draft"}
            </Button>
            {onSend && (
              <Button
                type="button"
                onClick={form.handleSubmit(handleSend)}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Send className="h-4 w-4 mr-2" />
                {form.watch("scheduledAt") ? "Schedule" : "Send Now"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}


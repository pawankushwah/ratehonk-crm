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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  MessageSquare, 
  Smartphone,
  Save,
  Eye,
  X,
  Plus,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Layout,
} from "lucide-react";
import { cn } from "@/lib/utils";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  channel: z.enum(["email", "sms", "whatsapp"]),
  category: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  previewText: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateBuilderProps {
  onSave: (data: TemplateFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<TemplateFormData>;
  isLoading?: boolean;
}

export function TemplateBuilder({ 
  onSave, 
  onCancel,
  initialData,
  isLoading = false 
}: TemplateBuilderProps) {
  const [selectedChannel, setSelectedChannel] = useState<"email" | "sms" | "whatsapp">(
    (initialData?.channel as any) || "email"
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [content, setContent] = useState(initialData?.content || "");

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: initialData?.name || "",
      channel: initialData?.channel || "email",
      category: initialData?.category || "",
      subject: initialData?.subject || "",
      content: initialData?.content || "",
      previewText: initialData?.previewText || "",
    },
  });

  const personalizationTokens = [
    { token: "{{FirstName}}", description: "First Name" },
    { token: "{{LastName}}", description: "Last Name" },
    { token: "{{Email}}", description: "Email Address" },
    { token: "{{Phone}}", description: "Phone Number" },
    { token: "{{Destination}}", description: "Travel Destination" },
    { token: "{{TravelDate}}", description: "Travel Date" },
    { token: "{{AgentName}}", description: "Agent Name" },
    { token: "{{BookingLink}}", description: "Booking Link" },
    { token: "{{CompanyName}}", description: "Company Name" },
    { token: "{{PackageName}}", description: "Package Name" },
    { token: "{{Price}}", description: "Price" },
    { token: "{{BookingNumber}}", description: "Booking Number" },
  ];

  const insertToken = (token: string) => {
    const currentContent = form.getValues("content");
    const newContent = currentContent + token;
    form.setValue("content", newContent);
    setContent(newContent);
  };

  const handleChannelChange = (channel: "email" | "sms" | "whatsapp") => {
    setSelectedChannel(channel);
    form.setValue("channel", channel);
  };

  const handleSave = (data: TemplateFormData) => {
    onSave({ ...data, channel: selectedChannel });
  };

  const getCharacterCount = () => {
    const content = form.watch("content") || "";
    return content.length;
  };

  const getSmsCharacterCount = () => {
    const content = form.watch("content") || "";
    // SMS character counting (GSM vs Unicode)
    const isUnicode = /[^\x00-\x7F]/.test(content);
    const maxChars = isUnicode ? 70 : 160; // Unicode: 70 chars, GSM: 160 chars
    const parts = Math.ceil(content.length / maxChars);
    return { count: content.length, max: maxChars, parts };
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Left Sidebar - Builder Tools */}
      <div className="w-64 border-r bg-gray-50 p-4 space-y-4 overflow-y-auto flex-shrink-0">
        <div>
          <Label className="text-sm font-semibold mb-2 block">Channel</Label>
          <div className="space-y-2">
            <Button
              type="button"
              variant={selectedChannel === "email" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleChannelChange("email")}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button
              type="button"
              variant={selectedChannel === "sms" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleChannelChange("sms")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS
            </Button>
            <Button
              type="button"
              variant={selectedChannel === "whatsapp" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleChannelChange("whatsapp")}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>

        <Separator />

        {/* Formatting Tools (for Email) */}
        {selectedChannel === "email" && (
          <div>
            <Label className="text-sm font-semibold mb-2 block">Formatting</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" title="Bold">
                <Bold className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" title="Italic">
                <Italic className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" title="Underline">
                <Underline className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" title="List">
                <List className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" title="Link">
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" title="Image">
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Personalization Tokens */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Personalization</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Click to insert tokens
          </p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {personalizationTokens.map((item) => (
              <Button
                key={item.token}
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-auto py-1.5"
                onClick={() => insertToken(item.token)}
              >
                <code className="text-xs">{item.token}</code>
                <span className="ml-2 text-xs text-muted-foreground truncate">
                  {item.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Character Count (for SMS) */}
        {selectedChannel === "sms" && (
          <div className="border rounded-lg p-3 bg-white">
            <Label className="text-sm font-semibold mb-2 block">Character Count</Label>
            {(() => {
              const smsInfo = getSmsCharacterCount();
              return (
                <div className="space-y-1">
                  <div className="text-xs">
                    <span className="font-medium">{smsInfo.count}</span> / {smsInfo.max} characters
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {smsInfo.parts} message{smsInfo.parts > 1 ? 's' : ''}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full",
                        smsInfo.count > smsInfo.max ? "bg-red-500" : "bg-blue-500"
                      )}
                      style={{ width: `${Math.min((smsInfo.count / smsInfo.max) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <form onSubmit={form.handleSubmit(handleSave)} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto min-h-0">
            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
                <CardDescription>
                  Basic details for your {selectedChannel} template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Welcome Email Template"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={form.watch("category") || ""}
                      onValueChange={(value) => form.setValue("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="booking">Booking</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedChannel === "email" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Email Subject</Label>
                      <Input
                        id="subject"
                        {...form.register("subject")}
                        placeholder="Welcome to Our Travel Services!"
                      />
                      <p className="text-xs text-muted-foreground">
                        {form.watch("subject")?.length || 0} characters
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previewText">Preview Text</Label>
                      <Input
                        id="previewText"
                        {...form.register("previewText")}
                        placeholder="Preview text shown in email clients"
                        maxLength={150}
                      />
                      <p className="text-xs text-muted-foreground">
                        Shown in email preview (max 150 characters)
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card className="flex-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Template Content</CardTitle>
                    <CardDescription>
                      {selectedChannel === "email" && "Create your email template with HTML support"}
                      {selectedChannel === "sms" && "Write your SMS message (160 chars = 1 message)"}
                      {selectedChannel === "whatsapp" && "Create your WhatsApp message template"}
                    </CardDescription>
                  </div>
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
              </CardHeader>
              <CardContent>
                {previewMode ? (
                  <div className="border rounded-lg p-6 min-h-[400px] bg-white">
                    {selectedChannel === "email" ? (
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ 
                        __html: form.watch("content") || "<p>No content</p>" 
                      }} />
                    ) : (
                      <div className="whitespace-pre-wrap font-mono text-sm">
                        {form.watch("content") || "No content"}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedChannel === "email" ? (
                      <Textarea
                        {...form.register("content")}
                        placeholder="Write your email template here... You can use HTML tags for formatting."
                        className="min-h-[400px] font-mono"
                        rows={20}
                        onChange={(e) => {
                          form.setValue("content", e.target.value);
                          setContent(e.target.value);
                        }}
                      />
                    ) : (
                      <Textarea
                        {...form.register("content")}
                        placeholder={
                          selectedChannel === "sms"
                            ? "Write your SMS message here... (160 characters = 1 message)"
                            : "Write your WhatsApp message here..."
                        }
                        className="min-h-[200px] font-mono"
                        rows={10}
                        maxLength={selectedChannel === "sms" ? 1600 : undefined}
                        onChange={(e) => {
                          form.setValue("content", e.target.value);
                          setContent(e.target.value);
                        }}
                      />
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {selectedChannel === "sms" 
                          ? `${getSmsCharacterCount().count} characters (${getSmsCharacterCount().parts} message${getSmsCharacterCount().parts > 1 ? 's' : ''})`
                          : `${getCharacterCount()} characters`
                        }
                      </span>
                      {selectedChannel === "email" && (
                        <span>HTML supported</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="border-t p-4 flex items-center justify-between bg-white">
            <div>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
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
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


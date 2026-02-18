import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema for WhatsApp settings - template selection for welcome messages
const whatsappSettingsSchema = z.object({
  enableLeadWelcomeMessage: z.boolean(),
  leadWelcomeMessage: z.string(), // Kept for backward compat, optional when using template
  leadWelcomeTemplateName: z.string().optional().nullable(),
  leadWelcomeTemplateLanguage: z.string().optional(),
  leadWelcomeTemplateSessionId: z.string().optional().nullable(),
  enableCustomerWelcomeMessage: z.boolean(),
  customerWelcomeMessage: z.string(),
  customerWelcomeTemplateName: z.string().optional().nullable(),
  customerWelcomeTemplateLanguage: z.string().optional(),
  customerWelcomeTemplateSessionId: z.string().optional().nullable(),
});

type WhatsAppSettings = z.infer<typeof whatsappSettingsSchema>;

interface WhatsAppSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppSettingsPanel({
  open,
  onOpenChange,
}: WhatsAppSettingsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: whatsappData, isLoading: whatsappLoading } = useQuery({
    queryKey: ["/api/tenant-settings/whatsapp"],
    enabled: open,
  });

  const whatsappForm = useForm<WhatsAppSettings>({
    resolver: zodResolver(whatsappSettingsSchema),
    defaultValues: {
      enableLeadWelcomeMessage: true,
      leadWelcomeMessage: "",
      leadWelcomeTemplateName: null,
      leadWelcomeTemplateLanguage: "en",
      leadWelcomeTemplateSessionId: null,
      enableCustomerWelcomeMessage: true,
      customerWelcomeMessage: "",
      customerWelcomeTemplateName: null,
      customerWelcomeTemplateLanguage: "en",
      customerWelcomeTemplateSessionId: null,
    },
  });

  // Fetch sessions and templates for template selection
  const { data: sessionsData } = useQuery<any[]>({
    queryKey: ["/api/whatsapp/sessions"],
    enabled: open,
  });
  const sessions: any[] = Array.isArray(sessionsData) ? sessionsData : (sessionsData as any)?.data ?? [];
  const leadSessionId = whatsappForm.watch("leadWelcomeTemplateSessionId");
  const customerSessionId = whatsappForm.watch("customerWelcomeTemplateSessionId");
  const leadPhoneNumberId = sessions.find((s) => s.sessionId === leadSessionId)?.deviceInfo?.apiPhoneNumberId;
  const customerPhoneNumberId = sessions.find((s) => s.sessionId === customerSessionId)?.deviceInfo?.apiPhoneNumberId;
  const { data: leadTemplatesData } = useQuery<any[] | { templates?: any[] }>({
    queryKey: [`/api/whatsapp/templates?phoneNumberId=${encodeURIComponent(leadPhoneNumberId || "")}`],
    enabled: open && !!leadPhoneNumberId,
  });
  const { data: customerTemplatesData } = useQuery<any[] | { templates?: any[] }>({
    queryKey: [`/api/whatsapp/templates?phoneNumberId=${encodeURIComponent(customerPhoneNumberId || "")}`],
    enabled: open && !!customerPhoneNumberId,
  });
  const leadTemplates: any[] = Array.isArray(leadTemplatesData)
    ? leadTemplatesData
    : (leadTemplatesData as any)?.templates ?? (leadTemplatesData as any)?.data ?? [];
  const customerTemplates: any[] = Array.isArray(customerTemplatesData)
    ? customerTemplatesData
    : (customerTemplatesData as any)?.templates ?? (customerTemplatesData as any)?.data ?? [];
  const approvedLeadTemplates = leadTemplates.filter((t) => (t.status || "").toLowerCase() === "approved");
  const approvedCustomerTemplates = customerTemplates.filter((t) => (t.status || "").toLowerCase() === "approved");

  // Update WhatsApp form when data loads
  useEffect(() => {
    if (whatsappData) {
      const d = whatsappData as any;
      whatsappForm.reset({
        enableLeadWelcomeMessage: d.enableLeadWelcomeMessage !== false,
        leadWelcomeMessage: d.leadWelcomeMessage || "Hello! Thank you for your interest. Our team will get in touch with you shortly.",
        leadWelcomeTemplateName: d.leadWelcomeTemplateName || null,
        leadWelcomeTemplateLanguage: d.leadWelcomeTemplateLanguage || "en",
        leadWelcomeTemplateSessionId: d.leadWelcomeTemplateSessionId || null,
        enableCustomerWelcomeMessage: d.enableCustomerWelcomeMessage !== false,
        customerWelcomeMessage: d.customerWelcomeMessage || "Welcome! Thank you for choosing us. We're excited to serve you!",
        customerWelcomeTemplateName: d.customerWelcomeTemplateName || null,
        customerWelcomeTemplateLanguage: d.customerWelcomeTemplateLanguage || "en",
        customerWelcomeTemplateSessionId: d.customerWelcomeTemplateSessionId || null,
      });
    }
  }, [whatsappData, whatsappForm]);

  const updateWhatsAppMutation = useMutation({
    mutationFn: async (data: WhatsAppSettings) => {
      return await apiRequest("PUT", "/api/tenant-settings/whatsapp", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-settings/whatsapp"] });
      toast({ title: "WhatsApp settings updated successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to update WhatsApp settings",
        variant: "destructive",
      });
    },
  });

  const onWhatsAppSubmit = (data: WhatsAppSettings) => {
    updateWhatsAppMutation.mutate(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[640px] lg:w-[800px] xl:w-[900px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp Settings
          </SheetTitle>
          <SheetDescription>
            Configure automatic WhatsApp welcome messages for new leads and customers.
          </SheetDescription>
        </SheetHeader>

        {whatsappLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500">Loading settings...</p>
          </div>
        ) : (
          <Form {...whatsappForm}>
            <form
              onSubmit={whatsappForm.handleSubmit(onWhatsAppSubmit)}
              className="space-y-6 mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp Welcome Messages
                  </CardTitle>
                  <CardDescription>
                    Configure automatic WhatsApp welcome messages for new
                    leads and customers. Messages are sent using your default
                    WhatsApp device when a phone number is provided during
                    creation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Lead Welcome Message Settings - Template selection */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          Lead Welcome Message
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Send automatically when a new lead is created with a
                          phone number. Select a WhatsApp template ({'{{1}}'} will be replaced with lead name).
                        </p>
                      </div>
                      <FormField
                        control={whatsappForm.control}
                        name="enableLeadWelcomeMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-enable-lead-welcome"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={whatsappForm.control}
                      name="leadWelcomeTemplateSessionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Session</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select session" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sessions.map((s) => (
                                <SelectItem key={s.sessionId} value={s.sessionId}>
                                  {s.deviceInfo?.phoneNumber || s.sessionId}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Session (phone number) to send from</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={whatsappForm.control}
                      name="leadWelcomeTemplateName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {approvedLeadTemplates.map((t) => (
                                <SelectItem key={t.templateId || t.name} value={t.name || t.templateId}>
                                  {t.name || t.templateId} ({t.language || "en"})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Approved WhatsApp template. {'{{1}}'} = lead name</FormDescription>
                        </FormItem>
                      )}
                    />
                    {/* OLD: Text message - commented out, replaced by template selection
                    <FormField control={whatsappForm.control} name="leadWelcomeMessage" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message Template (legacy)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter your lead welcome message..." {...field} rows={4} />
                        </FormControl>
                      </FormItem>
                    )} />
                    */}
                  </div>

                  {/* Customer Welcome Message Settings - Template selection */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          Customer Welcome Message
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Send automatically when a new customer is created
                          with a phone number. Select a WhatsApp template ({'{{1}}'} will be replaced with customer name).
                        </p>
                      </div>
                      <FormField
                        control={whatsappForm.control}
                        name="enableCustomerWelcomeMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-enable-customer-welcome"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={whatsappForm.control}
                      name="customerWelcomeTemplateSessionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Session</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select session" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sessions.map((s) => (
                                <SelectItem key={s.sessionId} value={s.sessionId}>
                                  {s.deviceInfo?.phoneNumber || s.sessionId}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Session (phone number) to send from</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={whatsappForm.control}
                      name="customerWelcomeTemplateName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {approvedCustomerTemplates.map((t) => (
                                <SelectItem key={t.templateId || t.name} value={t.name || t.templateId}>
                                  {t.name || t.templateId} ({t.language || "en"})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Approved WhatsApp template. {'{{1}}'} = customer name</FormDescription>
                        </FormItem>
                      )}
                    />
                    {/* OLD: Text message - commented out, replaced by template selection
                    <FormField control={whatsappForm.control} name="customerWelcomeMessage" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message Template (legacy)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter your customer welcome message..." {...field} rows={4} />
                        </FormControl>
                      </FormItem>
                    )} />
                    */}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Make sure you have a WhatsApp Integration configured
                        in{" "}
                        <Link
                          href="/whatsapp-setup"
                          className="text-primary hover:underline"
                        >
                          Integrate
                        </Link>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Configure WhatsApp sessions and templates in{" "}
                        <Link
                          href="/whatsapp-setup"
                          className="text-primary hover:underline"
                        >
                          WhatsApp Setup
                        </Link>
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={updateWhatsAppMutation.isPending}
                      data-testid="button-save-whatsapp-settings"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateWhatsAppMutation.isPending
                        ? "Saving..."
                        : "Save Settings"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}


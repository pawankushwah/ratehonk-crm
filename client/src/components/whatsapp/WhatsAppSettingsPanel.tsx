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

// Schema for WhatsApp settings
const whatsappSettingsSchema = z.object({
  enableLeadWelcomeMessage: z.boolean(),
  leadWelcomeMessage: z.string().min(1, "Lead welcome message is required"),
  enableCustomerWelcomeMessage: z.boolean(),
  customerWelcomeMessage: z
    .string()
    .min(1, "Customer welcome message is required"),
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
      enableCustomerWelcomeMessage: true,
      customerWelcomeMessage: "",
    },
  });

  // Update WhatsApp form when data loads
  useEffect(() => {
    if (whatsappData) {
      whatsappForm.reset({
        enableLeadWelcomeMessage:
          (whatsappData as any).enableLeadWelcomeMessage !== false,
        leadWelcomeMessage:
          (whatsappData as any).leadWelcomeMessage ||
          "Hello! Thank you for your interest. Our team will get in touch with you shortly.",
        enableCustomerWelcomeMessage:
          (whatsappData as any).enableCustomerWelcomeMessage !== false,
        customerWelcomeMessage:
          (whatsappData as any).customerWelcomeMessage ||
          "Welcome! Thank you for choosing us. We're excited to serve you!",
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
                  {/* Lead Welcome Message Settings */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          Lead Welcome Message
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Send automatically when a new lead is created with a
                          phone number
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
                      name="leadWelcomeMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message Template</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your lead welcome message..."
                              {...field}
                              rows={4}
                              data-testid="textarea-lead-welcome-message"
                            />
                          </FormControl>
                          <FormDescription>
                            This message will be sent via WhatsApp to new
                            leads
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Customer Welcome Message Settings */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          Customer Welcome Message
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Send automatically when a new customer is created
                          with a phone number
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
                      name="customerWelcomeMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message Template</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your customer welcome message..."
                              {...field}
                              rows={4}
                              data-testid="textarea-customer-welcome-message"
                            />
                          </FormControl>
                          <FormDescription>
                            This message will be sent via WhatsApp to new
                            customers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                        Make sure you have a default WhatsApp device
                        configured in{" "}
                        <Link
                          href="/whatsapp-devices"
                          className="text-primary hover:underline"
                        >
                          WhatsApp Devices
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


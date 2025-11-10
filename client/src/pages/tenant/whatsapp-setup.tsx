import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  MessageSquare,
  Settings,
  Trash2,
  Smartphone,
  Send,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/layout/layout";
import { auth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface WhatsAppConfig {
  id: number;
  username: string;
  email: string;
  subscriptionExpired: string;
  activeSubscription: string;
  limitDevice: number;
  chunkBlast: number;
  createdAt: string;
}

export default function WhatsAppSetup() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userData, setUserData] = useState<any>(null);

  // Get current user data from auth cache
  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = await auth.getCurrentUser();
      console.log("🔍 Loaded user data:", currentUser);
      setUserData(currentUser);
    };
    loadUserData();
  }, []);

  // Fetch current WhatsApp configuration
  const { data: configData, isLoading } = useQuery<{
    configured: boolean;
    config: WhatsAppConfig | null;
  }>({
    queryKey: ["/api/whatsapp/config"],
  });

  const isConfigured = configData?.configured || false;
  const config = configData?.config;

  // Setup WhatsApp mutation
  const setupMutation = useMutation({
    mutationFn: async () => {
      console.log("🟢 Setup mutation started");
      console.log("👤 User data:", userData);
      console.log("👤 Tenant:", userData?.tenant);

      const tenantEmail =
        userData?.tenant?.contactEmail || userData?.user?.email;
      console.log("📧 Tenant email:", tenantEmail);

      if (!tenantEmail) {
        console.error("❌ No tenant email found");
        console.error(
          "❌ User data structure:",
          JSON.stringify(userData, null, 2),
        );
        throw new Error("Tenant email not found. Please try logging in again.");
      }

      const payload = {
        email: tenantEmail,
        expire: 20,
        limitDevice: 10,
      };
      console.log("📦 Sending payload:", payload);

      const response = await apiRequest("POST", "/api/whatsapp/setup", payload);
      const result = await response.json();

      console.log("✅ Setup response:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 Setup successful:", data);
      toast({
        title: "Success",
        description:
          "WhatsApp integration configured successfully. Redirecting to devices page...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/config"] });

      // Redirect to WhatsApp devices page after successful setup
      setTimeout(() => {
        setLocation("/whatsapp-devices");
      }, 1500);
    },
    onError: (error: any) => {
      console.error("❌ Setup error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to configure WhatsApp integration",
        variant: "destructive",
      });
    },
  });

  // Delete configuration mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/whatsapp/config", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "WhatsApp configuration deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete WhatsApp configuration",
        variant: "destructive",
      });
    },
  });

  const handleSetup = () => {
    console.log("🔵 Setup button clicked!");
    console.log("📊 Setup mutation state:", {
      isPending: setupMutation.isPending,
      isError: setupMutation.isError,
      error: setupMutation.error,
    });
    console.log("👤 User data available:", !!userData);
    setupMutation.mutate();
  };

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete the WhatsApp configuration? This action cannot be undone.",
      )
    ) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                WhatsApp Setup
              </h1>
              <p className="text-gray-600">
                Configure your WhatsApp Business integration
              </p>
            </div>
          </div>
        </div>

        {/* Current Configuration Status */}
        {isConfigured && config && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">
              WhatsApp Integration Active
            </AlertTitle>
            <AlertDescription className="text-green-700">
              Your WhatsApp Business account is configured and ready to use.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {isConfigured && config ? (
            /* Show current configuration */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Current Configuration
                </CardTitle>
                <CardDescription>
                  Your WhatsApp Business integration details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Username</Label>
                    <p className="font-medium text-gray-900">
                      {config.username}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <p className="font-medium text-gray-900">{config.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Device Limit</Label>
                    <p className="font-medium text-gray-900">
                      {config.limitDevice} devices
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Subscription Status</Label>
                    <p
                      className={`font-medium ${config.activeSubscription === "active" ? "text-green-600" : "text-red-600"}`}
                    >
                      {config.activeSubscription.charAt(0).toUpperCase() +
                        config.activeSubscription.slice(1)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">
                      Subscription Expires
                    </Label>
                    <p className="font-medium text-gray-900">
                      {new Date(
                        config.subscriptionExpired,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Configured On</Label>
                    <p className="font-medium text-gray-900">
                      {new Date(config.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-config"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteMutation.isPending ? "Deleting..." : "Delete Configuration"}
                </Button>
              </div> */}
              </CardContent>
            </Card>
          ) : (
            /* Show WhatsApp Integration Flow */
            <>
              {/* How WhatsApp Integration Works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    How WhatsApp Integration Works
                  </CardTitle>
                  <CardDescription>
                    Learn about the WhatsApp Business integration process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step-by-step flow */}
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-700 font-semibold">1</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Account Creation
                        </h3>
                        <p className="text-gray-600">
                          Click the button below to create your WhatsApp
                          Business account. We'll use your tenant email (
                          {userData?.tenant?.email || userData?.email}) to set
                          up the account with a 20-day subscription and support
                          for up to 10 devices.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-700 font-semibold">2</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Connect Devices
                        </h3>
                        <p className="text-gray-600">
                          After setup, go to the{" "}
                          <strong>WhatsApp Devices</strong> page to connect your
                          WhatsApp numbers. You can add multiple devices (up to
                          10) by scanning QR codes.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-700 font-semibold">3</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Send Messages
                        </h3>
                        <p className="text-gray-600">
                          Once devices are connected, use the{" "}
                          <strong>WhatsApp Messages</strong> page to send
                          messages to your customers. Choose from 10 different
                          message types including text, images, documents, and
                          more.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-700 font-semibold">4</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Manage Customers
                        </h3>
                        <p className="text-gray-600">
                          Integrate WhatsApp communication with your CRM. Send
                          messages directly from customer profiles and track all
                          WhatsApp interactions in one place.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Setup Button */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleSetup}
                      disabled={setupMutation.isPending || !userData}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                      data-testid="button-setup-whatsapp"
                    >
                      <MessageSquare className="h-5 w-5 mr-2" />
                      {setupMutation.isPending
                        ? "Setting up WhatsApp..."
                        : "Setup WhatsApp Integration"}
                    </Button>

                    {/* Debug info */}
                    {!userData && (
                      <p className="text-sm text-amber-600 mt-2">
                        ⏳ Loading user data... Button will activate when ready.
                      </p>
                    )}

                    {userData?.tenant?.email && (
                      <p className="text-sm text-gray-500 mt-2">
                        ✅ Ready! Setup will use: {userData.tenant.email} • 20
                        days subscription • 10 devices limit
                      </p>
                    )}

                    {userData && !userData.tenant?.email && userData.email && (
                      <p className="text-sm text-gray-500 mt-2">
                        ✅ Ready! Setup will use: {userData.email} • 20 days
                        subscription • 10 devices limit
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Features Card */}
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">
                    Features You'll Get
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>10 Message Types:</strong> Text, Image, Video,
                      Document, Audio, Location, Contact, Template, Interactive,
                      and Sticker messages
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Multi-Device Support:</strong> Connect up to 10
                      WhatsApp numbers simultaneously
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>CRM Integration:</strong> Send messages directly
                      from customer profiles
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Secure API:</strong> All credentials encrypted and
                      securely stored
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>20-Day Trial:</strong> Test all features with a
                      generous trial period
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

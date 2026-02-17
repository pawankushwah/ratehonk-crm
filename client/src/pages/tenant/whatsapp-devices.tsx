import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  MoreVertical,
  QrCode,
  Trash2,
  Settings,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  MessageCircle,
  Star,
  LogOut,
  ExternalLink,
  Smartphone,
  Info,
  FileText,
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WhatsappDevice } from "@shared/schema";

export default function WhatsAppDevices() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<WhatsappDevice | null>(
    null,
  );
  const [qrIframeUrl, setQrIframeUrl] = useState<string>("");
  const [isLoadingQRIframe, setIsLoadingQRIframe] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [formData, setFormData] = useState({
    number: "",
    webhookUrl: "",
  });
  const [deviceOptions, setDeviceOptions] = useState({
    fullResponse: false,
    readMessages: false,
    rejectCalls: false,
    showAvailable: false,
    showTyping: false,
    messageDelay: 0,
  });
  const { toast } = useToast();

  // ========== NEW: WhatsApp Panel - Sessions from provider API ==========
  const { data: sessionsData, isLoading: sessionsLoading, isError: sessionsError } = useQuery<{ sessions?: any[] } | any[]>({
    queryKey: ["/api/whatsapp/sessions"],
    retry: false,
  });

  const sessions: any[] = Array.isArray(sessionsData)
    ? sessionsData
    : (sessionsData as any)?.sessions ?? (sessionsData as any)?.data ?? [];

  const [showCreateSessionDialog, setShowCreateSessionDialog] = useState(false);
  const [createSessionForm, setCreateSessionForm] = useState({
    connectionType: "official",
    phoneNumberId: "",
    accessToken: "",
    businessAccountId: "",
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: typeof createSessionForm) => {
      const res = await apiRequest("POST", "/api/whatsapp/sessions/create", {
        connectionType: data.connectionType,
        businessApiCredentials: {
          phoneNumberId: data.phoneNumberId,
          accessToken: data.accessToken,
          businessAccountId: data.businessAccountId,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/sessions"] });
      setShowCreateSessionDialog(false);
      setCreateSessionForm({
        connectionType: "official",
        phoneNumberId: "",
        accessToken: "",
        businessAccountId: "",
      });
      toast({ title: "Success", description: "Session created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create session",
        variant: "destructive",
      });
    },
  });

  const handleCreateSession = () => {
    if (!createSessionForm.phoneNumberId || !createSessionForm.accessToken || !createSessionForm.businessAccountId) {
      toast({
        title: "Validation Error",
        description: "Phone Number ID, Access Token, and Business Account ID are required",
        variant: "destructive",
      });
      return;
    }
    createSessionMutation.mutate(createSessionForm);
  };

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest("DELETE", `/api/whatsapp/sessions/${encodeURIComponent(sessionId)}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/sessions"] });
      toast({ title: "Success", description: "Session deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete session",
        variant: "destructive",
      });
    },
  });

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  /* LEGACY: devices query - commented, using sessions API
  const { data: devices = [], isLoading } = useQuery<WhatsappDevice[]>({
    queryKey: ["/api/whatsapp-devices"],
  });
  */
  const devices: WhatsappDevice[] = [];
  const isLoading = false;

  // Add device mutation
  const addDeviceMutation = useMutation({
    mutationFn: async (data: { number: string; webhookUrl?: string }) => {
      const response = await apiRequest("POST", "/api/whatsapp-devices", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-devices"] });
      setShowAddDialog(false);
      setFormData({ number: "", webhookUrl: "" });
      toast({
        title: "Success",
        description: "Device added successfully",
      });
    },
    onError: (error: any) => {
      let errorMessage = error.message || "Failed to add device";

      // Provide helpful message for common errors
      if (errorMessage.includes("already been taken")) {
        errorMessage =
          "This phone number is already registered as a device in your WhatsApp account.";
      } else if (
        errorMessage.includes("does not exist") ||
        errorMessage.includes("do not have permission")
      ) {
        errorMessage =
          "This phone number is not registered in your WhatsApp Business account. Please register the device first through WhatsApp Business API.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update device options mutation
  const updateOptionsMutation = useMutation({
    mutationFn: async (data: { id: number; options: typeof deviceOptions }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/whatsapp-devices/${data.id}/options`,
        data.options,
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-devices"] });
      setShowOptionsDialog(false);
      setSelectedDevice(null);
      toast({
        title: "Success",
        description: "Device options updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update options",
        variant: "destructive",
      });
    },
  });

  // Logout device mutation
  const logoutDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "POST",
        `/api/whatsapp-devices/${id}/logout`,
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-devices"] });
      toast({
        title: "Success",
        description: "Device logged out successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to logout device",
        variant: "destructive",
      });
    },
  });

  // Delete device mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/whatsapp-devices/${id}`,
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-devices"] });
      toast({
        title: "Success",
        description: "Device deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete device",
        variant: "destructive",
      });
    },
  });

  // Set default device mutation
  const setDefaultDeviceMutation = useMutation({
    mutationFn: async (deviceId: number) => {
      const response = await apiRequest(
        "POST",
        "/api/whatsapp/set-default-device",
        { deviceId },
      );
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-devices"] });
      toast({
        title: "Success",
        description: data.message || "Default device set successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set default device",
        variant: "destructive",
      });
    },
  });

  const handleAddDevice = () => {
    if (!formData.number) {
      toast({
        title: "Validation Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }
    addDeviceMutation.mutate(formData);
  };

  const handleOpenOptions = (device: WhatsappDevice) => {
    setSelectedDevice(device);
    setDeviceOptions({
      fullResponse: device.fullResponse,
      readMessages: device.readMessages,
      rejectCalls: device.rejectCalls,
      showAvailable: device.showAvailable,
      showTyping: device.showTyping,
      messageDelay: device.messageDelay,
    });
    setShowOptionsDialog(true);
  };

  const handleSaveOptions = () => {
    if (selectedDevice) {
      updateOptionsMutation.mutate({
        id: selectedDevice.id,
        options: deviceOptions,
      });
    }
  };

  const handleConnectDevice = async (device: WhatsappDevice) => {
    setSelectedDevice(device);
    setIsLoadingQRIframe(true);

    try {
      // First, check if device is already connected
      const statusResponse = await apiRequest(
        "GET",
        `/api/whatsapp-devices/${device.id}/check-status`,
      );
      const statusData = await statusResponse.json();
      
      if (statusData.success && statusData.connected) {
        toast({
          title: "Already Connected",
          description: "This device is already connected to WhatsApp!",
        });
        // Refresh devices to show updated status
        await queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-devices"] });
        // Refetch to ensure UI updates immediately
        await queryClient.refetchQueries({ queryKey: ["/api/whatsapp-devices"] });
        setIsLoadingQRIframe(false);
        return;
      }

      // Device is not connected, proceed to open QR code popup
      const response = await apiRequest(
        "GET",
        `/api/whatsapp-devices/${device.id}/qr-iframe-url`,
      );
      const data = await response.json();
      console.log("QR Iframe URL Response:", data);
      
      if (data.success && data.url) {
        // Open QR code page in a new popup window
        const width = 900;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const popup = window.open(
          data.url,
          'whatsapp-qr-scan',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        if (popup) {
          toast({
            title: "QR Code Window Opened",
            description: "Please scan the QR code in the popup window. Close the popup after scanning.",
          });
          
          // Show dialog to check status
          setShowQRDialog(true);
        } else {
          toast({
            title: "Popup Blocked",
            description: "Please allow popups for this site and try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load QR code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load QR code",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQRIframe(false);
    }
  };

  // Check device connection status when QR dialog closes
  const handleQRDialogClose = async (open: boolean) => {
    setShowQRDialog(open);

    // When closing the dialog, check if the device is now connected
    if (!open && selectedDevice) {
      setIsCheckingStatus(true);

      try {
        const response = await apiRequest(
          "GET",
          `/api/whatsapp-devices/${selectedDevice.id}/check-status`,
        );
        const data = await response.json();

        if (data.success && data.connected) {
          toast({
            title: "Success",
            description: "Device connected successfully!",
          });
          // Refresh devices to show updated status
          await queryClient.invalidateQueries({
            queryKey: ["/api/whatsapp-devices"],
          });
          // Refetch to ensure UI updates immediately
          await queryClient.refetchQueries({
            queryKey: ["/api/whatsapp-devices"],
          });
          
          // Update the selected device with the latest data from cache
          const updatedDevices = queryClient.getQueryData(["/api/whatsapp-devices"]) as WhatsappDevice[] | undefined;
          if (updatedDevices) {
            const updatedDevice = updatedDevices.find(d => d.id === selectedDevice.id);
            if (updatedDevice) {
              setSelectedDevice(updatedDevice);
            }
          }
        } else if (data.success && !data.connected) {
          toast({
            title: "Not Connected",
            description:
              "Device is not connected yet. Please scan the QR code and try again.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error checking device status:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to check device status",
          variant: "destructive",
        });
      } finally {
        setIsCheckingStatus(false);
        setSelectedDevice(null);
      }
    }
  };

  const handleLogoutDevice = (device: WhatsappDevice) => {
    if (device.status !== "connected") {
      toast({
        title: "Error",
        description: "Only connected devices can be logged out",
        variant: "destructive",
      });
      return;
    }
    if (confirm(`Are you sure you want to logout device ${device.number}?`)) {
      logoutDeviceMutation.mutate(device.id);
    }
  };

  const handleDeleteDevice = (device: WhatsappDevice) => {
    if (confirm(`Are you sure you want to delete device ${device.number}?`)) {
      deleteDeviceMutation.mutate(device.id);
    }
  };

  const handleSetDefaultDevice = (device: WhatsappDevice) => {
    if (device.status !== "connected") {
      toast({
        title: "Error",
        description: "Only connected devices can be set as default",
        variant: "destructive",
      });
      return;
    }
    setDefaultDeviceMutation.mutate(device.id);
  };

  const handleOpenLiveChat = async (device: WhatsappDevice) => {
    setSelectedDevice(device);
    
    try {
      const response = await apiRequest(
        "GET",
        `/api/whatsapp-devices/${device.id}/live-chat-url`,
      );
      const data = await response.json();

      if (data.success && data.url) {
        // Open Live Chat in popup window (same approach as QR code)
        const width = 1000;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.url,
          "WhatsAppLiveChat",
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          // Popup was blocked, fallback to opening in new tab
          toast({
            title: "Popup Blocked",
            description: "Opening Live Chat in a new tab instead...",
          });
          window.open(data.url, "_blank");
        } else {
          toast({
            title: "Live Chat Opened",
            description: "Live Chat interface opened in a new window",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load live chat URL",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load live chat",
        variant: "destructive",
      });
    } finally {
      setSelectedDevice(null);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* ========== NEW: WhatsApp Panel - Sessions ========== */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-700">
                Connect WhatsApp Business
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your WhatsApp Business phone numbers and connections.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await apiRequest("GET", "/api/whatsapp/panel-login-url");
                    const data = await res.json();
                    if (data?.url) {
                      window.open(data.url, "_blank");
                      toast({ title: "Opened", description: "WhatsApp panel opened in new tab" });
                    } else {
                      toast({ title: "Error", description: data?.error || "Failed to get panel URL", variant: "destructive" });
                    }
                  } catch (e: any) {
                    toast({ title: "Error", description: e?.message || "Failed to open WhatsApp panel", variant: "destructive" });
                  }
                }}
                disabled={sessionsError}
                title="Open WhatsApp panel in new tab for auto-login"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to WhatsApp Panel
              </Button>
              <Button
                onClick={() => setShowCreateSessionDialog(true)}
                className="bg-orange-500 hover:bg-orange-600"
                data-testid="button-create-session"
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect WhatsApp Business
              </Button>
            </div>
          </div>
        </div>

        {/* Added Phone Numbers - WhatsApp panel style */}
        <div className="mb-2">
          <h2 className="text-lg font-medium text-gray-700">Added Phone Numbers</h2>
          <p className="text-sm text-gray-500">
            Phone numbers already added and available for use.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verified Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  # Phone Number ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1">
                    Waba ID
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>WhatsApp Business Account ID</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WABA Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessionsLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Loading sessions...
                  </td>
                </tr>
              ) : sessionsError ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-amber-600">
                    WhatsApp is not configured or provider API error. Complete setup at WhatsApp Setup first.
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No active sessions. Click &quot;Create Session&quot; to add one.
                  </td>
                </tr>
              ) : (
                sessions.map((session: any, idx: number) => {
                  const di = session.deviceInfo;
                  const statusDisplay = session.status === "connected"
                    ? (di?.codeVerificationStatus ?? "Connected")
                    : "Disconnected";
                  const qualityColor =
                    di?.qualityRating === "GREEN"
                      ? "bg-green-500"
                      : di?.qualityRating === "YELLOW"
                        ? "bg-yellow-500"
                        : di?.qualityRating === "RED"
                          ? "bg-red-500"
                          : "bg-gray-400";
                  return (
                    <tr key={session.id ?? session.sessionId ?? idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-orange-500" />
                          {di?.verifiedName ?? di?.wabaName ?? "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {di?.displayPhoneNumber ?? di?.phoneNumber ?? "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={session.status === "connected" ? "default" : "secondary"}
                          className={
                            session.status === "connected"
                              ? "bg-orange-500 hover:bg-orange-600"
                              : "bg-gray-400"
                          }
                        >
                          <CheckCircle2 className="h-3.5 w-3 mr-1" />
                          {statusDisplay}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {di?.apiPhoneNumberId ? `# ${di.apiPhoneNumberId}` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {di?.wabaId ?? "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {di?.wabaName ?? "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {di?.qualityRating ? (
                          <Badge className={`${qualityColor} text-white`}>
                            {di.qualityRating}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.lastActive
                          ? formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {di?.apiPhoneNumberId ? (
                            <Link
                              href={`/whatsapp-templates?phoneNumberId=${encodeURIComponent(di.apiPhoneNumberId)}&verifiedName=${encodeURIComponent(di.verifiedName || di.wabaName || "Templates")}`}
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Templates">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 cursor-not-allowed" title="Templates (connect first)">
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Open">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600" title="Add">
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            title="Delete"
                            onClick={() => handleDeleteSession(session.sessionId)}
                            disabled={deleteSessionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Create Session Dialog */}
        <Dialog open={showCreateSessionDialog} onOpenChange={setShowCreateSessionDialog}>
          <DialogContent data-testid="dialog-create-session" className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="connectionType">Connection Type</Label>
                <Input
                  id="connectionType"
                  value={createSessionForm.connectionType}
                  onChange={(e) =>
                    setCreateSessionForm({ ...createSessionForm, connectionType: e.target.value })
                  }
                  placeholder="official"
                />
                <p className="text-xs text-gray-500 mt-1">e.g. official</p>
              </div>
              <div>
                <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
                <Input
                  id="phoneNumberId"
                  value={createSessionForm.phoneNumberId}
                  onChange={(e) =>
                    setCreateSessionForm({ ...createSessionForm, phoneNumberId: e.target.value })
                  }
                  placeholder="YOUR_PHONE_NUMBER_ID"
                />
              </div>
              <div>
                <Label htmlFor="accessToken">Access Token *</Label>
                <Textarea
                  id="accessToken"
                  value={createSessionForm.accessToken}
                  onChange={(e) =>
                    setCreateSessionForm({ ...createSessionForm, accessToken: e.target.value })
                  }
                  placeholder="YOUR_META_ACCESS_TOKEN"
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="businessAccountId">Business Account ID (WABA ID) *</Label>
                <Input
                  id="businessAccountId"
                  value={createSessionForm.businessAccountId}
                  onChange={(e) =>
                    setCreateSessionForm({ ...createSessionForm, businessAccountId: e.target.value })
                  }
                  placeholder="YOUR_WABA_ID"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateSessionDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? "Creating..." : "Create Session"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* LEGACY: Devices table - disabled (use sessions API) */}
        {false && (
        <>
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span className="text-indigo-600">Devices</span>
            <span>&gt;</span>
            <span>Whatsapp Account</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-700">Whatsapp Account</h1>
            <Button onClick={() => setShowAddDialog(true)} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-add-device">
              <Plus className="h-4 w-4 mr-2" /> Add Device
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NUMBER</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WEBHOOK URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SENT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LIVE CHAT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OPTIONS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading devices...</td></tr>
              ) : devices.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No devices added yet. Click "Add Device" to get started.</td></tr>
              ) : (
                devices.map((device) => <tr key={device.id}>...</tr>)
              )}
            </tbody>
          </table>
        </div>
        </>
        )}

        {/* LEGACY: Add Device, Options, QR dialogs - disabled (use sessions API) */}
        {false && (
        <>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent data-testid="dialog-add-device">
            <DialogHeader>
              <DialogTitle>Add Device</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="number">Number</Label>
                <Input
                  id="number"
                  placeholder="919179388646"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  data-testid="input-add-number"
                />
                <p className="text-xs text-red-500 mt-1">
                  *Use Country Code ( without + )
                </p>
              </div>
              <div>
                <Label htmlFor="webhook">Link webhook</Label>
                <Input
                  id="webhook"
                  placeholder=""
                  value={formData.webhookUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, webhookUrl: e.target.value })
                  }
                  data-testid="input-add-webhook"
                />
                <p className="text-xs text-gray-500 mt-1">*Optional</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddDevice}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={addDeviceMutation.isPending}
                data-testid="button-save-device"
              >
                {addDeviceMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Options Dialog */}
        <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
          <DialogContent data-testid="dialog-options">
            <DialogHeader>
              <DialogTitle>Options</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 text-sm">📋</span>
                  </div>
                  <Label htmlFor="full-response">Full Response</Label>
                </div>
                <Switch
                  id="full-response"
                  checked={deviceOptions.fullResponse}
                  onCheckedChange={(checked) =>
                    setDeviceOptions({
                      ...deviceOptions,
                      fullResponse: checked,
                    })
                  }
                  data-testid="switch-full-response"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm">👁️</span>
                  </div>
                  <Label htmlFor="read">Read</Label>
                </div>
                <Switch
                  id="read"
                  checked={deviceOptions.readMessages}
                  onCheckedChange={(checked) =>
                    setDeviceOptions({
                      ...deviceOptions,
                      readMessages: checked,
                    })
                  }
                  data-testid="switch-read"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-pink-100 flex items-center justify-center">
                    <span className="text-pink-600 text-sm">📞</span>
                  </div>
                  <Label htmlFor="reject-call">Reject Call</Label>
                </div>
                <Switch
                  id="reject-call"
                  checked={deviceOptions.rejectCalls}
                  onCheckedChange={(checked) =>
                    setDeviceOptions({ ...deviceOptions, rejectCalls: checked })
                  }
                  data-testid="switch-reject-call"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <Label htmlFor="available">Available</Label>
                </div>
                <Switch
                  id="available"
                  checked={deviceOptions.showAvailable}
                  onCheckedChange={(checked) =>
                    setDeviceOptions({
                      ...deviceOptions,
                      showAvailable: checked,
                    })
                  }
                  data-testid="switch-available"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 text-sm">⌨️</span>
                  </div>
                  <Label htmlFor="typing">Typing</Label>
                </div>
                <Switch
                  id="typing"
                  checked={deviceOptions.showTyping}
                  onCheckedChange={(checked) =>
                    setDeviceOptions({ ...deviceOptions, showTyping: checked })
                  }
                  data-testid="switch-typing"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-600 text-sm">⏱️</span>
                  </div>
                  <Label htmlFor="delay">Delay</Label>
                </div>
                <Input
                  id="delay"
                  type="number"
                  min="0"
                  value={deviceOptions.messageDelay}
                  onChange={(e) =>
                    setDeviceOptions({
                      ...deviceOptions,
                      messageDelay: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-24"
                  data-testid="input-delay"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSaveOptions}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={updateOptionsMutation.isPending}
                data-testid="button-save-options"
              >
                {updateOptionsMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Connection Dialog */}
        <Dialog open={showQRDialog} onOpenChange={handleQRDialogClose}>
          <DialogContent
            className="max-w-5xl max-h-[90vh]"
            data-testid="dialog-qr-connection"
          >
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    Connect WhatsApp Device - {selectedDevice?.number}
                  </DialogTitle>
                </div>
                <Badge
                  variant={
                    selectedDevice?.status === "connected"
                      ? "default"
                      : "destructive"
                  }
                  className={
                    selectedDevice?.status === "connected"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }
                  data-testid="badge-connection-status"
                >
                  {selectedDevice?.status === "connected"
                    ? "Connected"
                    : "Disconnected"}
                </Badge>
              </div>
            </DialogHeader>

            {/* Instructions */}
            <Alert
              className="bg-cyan-50 border-cyan-200"
              data-testid="alert-instructions"
            >
              <AlertTriangle className="h-4 w-4 text-cyan-600" />
              <AlertDescription className="text-cyan-800">
                A popup window has been opened with the QR code. Please scan it with your WhatsApp mobile app, then close the popup window and click "Check Connection Status" below.
              </AlertDescription>
            </Alert>

            {/* Connection Steps */}
            <div className="py-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How to Connect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Open the popup window</p>
                      <p className="text-sm text-gray-600">The QR code should be displayed in the popup window.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Scan the QR code</p>
                      <p className="text-sm text-gray-600">Open WhatsApp on your phone → Settings → Linked Devices → Link a Device, then scan the QR code.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Close the popup</p>
                      <p className="text-sm text-gray-600">After scanning, close the popup window.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Check connection</p>
                      <p className="text-sm text-gray-600">Click "Check Connection Status" below to verify the device is connected.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <div className="flex items-center gap-2 w-full">
                {isCheckingStatus && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Checking connection status...</span>
                  </div>
                )}
                <Button
                  onClick={() => handleQRDialogClose(false)}
                  disabled={isCheckingStatus}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  data-testid="button-close-qr"
                >
                  {isCheckingStatus ? "Checking..." : "Check Connection Status"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>
        )}

      </div>
    </Layout>
  );
}

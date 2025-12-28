import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  MoreVertical,
  QrCode,
  Trash2,
  Settings,
  AlertTriangle,
  RefreshCw,
  MessageCircle,
  Star,
  LogOut,
  Smartphone,
} from "lucide-react";
import type { WhatsappDevice } from "@shared/schema";

interface WhatsAppDevicesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppDevicesPanel({
  open,
  onOpenChange,
}: WhatsAppDevicesPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<WhatsappDevice | null>(
    null,
  );
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

  // Fetch devices
  const { data: devices = [], isLoading } = useQuery<WhatsappDevice[]>({
    queryKey: ["/api/whatsapp-devices"],
    enabled: open,
  });

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
        await queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-devices"] });
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
      
      if (data.success && data.url) {
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
          await queryClient.invalidateQueries({
            queryKey: ["/api/whatsapp-devices"],
          });
          await queryClient.refetchQueries({
            queryKey: ["/api/whatsapp-devices"],
          });
          
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
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[640px] lg:w-[800px] xl:w-[900px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              WhatsApp Devices
            </SheetTitle>
            <SheetDescription>
              Manage your WhatsApp devices. Add, connect, and configure devices for sending messages.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Devices</h2>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center text-gray-500 py-8">Loading devices...</div>
            ) : devices.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No devices added yet. Click "Add Device" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {devices.map((device) => (
                  <Card key={device.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{device.number}</span>
                            {device.isDefault && (
                              <Badge className="bg-yellow-400 text-gray-900 hover:bg-yellow-400">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Default
                              </Badge>
                            )}
                            <Badge
                              variant={device.status === "connected" ? "default" : "destructive"}
                              className={
                                device.status === "connected"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }
                            >
                              <span
                                className={`h-2 w-2 rounded-full mr-1 ${
                                  device.status === "connected"
                                    ? "bg-green-300"
                                    : "bg-red-300"
                                }`}
                              />
                              {device.status === "connected" ? "Connected" : "Disconnected"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Webhook: {device.webhookUrl || "Not set"}</div>
                            <div>Messages Sent: {device.messagesSent || 0}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenLiveChat(device)}
                                    disabled={device.status !== "connected"}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Live Chat
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {device.status !== "connected" && (
                                <TooltipContent>
                                  <p>Device must be connected to use Live Chat</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenOptions(device)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Options
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleConnectDevice(device)}
                              >
                                <QrCode className="h-4 w-4 mr-2" />
                                Connect Via QR
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSetDefaultDevice(device)}
                                disabled={device.status !== "connected"}
                              >
                                <Star className={`h-4 w-4 mr-2 ${device.isDefault ? "fill-yellow-400 text-yellow-400" : ""}`} />
                                {device.isDefault ? "Default Device" : "Set as Default"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleLogoutDevice(device)}
                                disabled={device.status !== "connected"}
                                className="text-orange-600"
                              >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout Device
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteDevice(device)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Device Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
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
              />
              <p className="text-xs text-gray-500 mt-1">*Optional</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDevice}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={addDeviceMutation.isPending}
            >
              {addDeviceMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Options Dialog */}
      <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="full-response">Full Response</Label>
              <Switch
                id="full-response"
                checked={deviceOptions.fullResponse}
                onCheckedChange={(checked) =>
                  setDeviceOptions({
                    ...deviceOptions,
                    fullResponse: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="read">Read</Label>
              <Switch
                id="read"
                checked={deviceOptions.readMessages}
                onCheckedChange={(checked) =>
                  setDeviceOptions({
                    ...deviceOptions,
                    readMessages: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="reject-call">Reject Call</Label>
              <Switch
                id="reject-call"
                checked={deviceOptions.rejectCalls}
                onCheckedChange={(checked) =>
                  setDeviceOptions({ ...deviceOptions, rejectCalls: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="available">Available</Label>
              <Switch
                id="available"
                checked={deviceOptions.showAvailable}
                onCheckedChange={(checked) =>
                  setDeviceOptions({
                    ...deviceOptions,
                    showAvailable: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="typing">Typing</Label>
              <Switch
                id="typing"
                checked={deviceOptions.showTyping}
                onCheckedChange={(checked) =>
                  setDeviceOptions({ ...deviceOptions, showTyping: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="delay">Delay</Label>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveOptions}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={updateOptionsMutation.isPending}
            >
              {updateOptionsMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Connection Dialog */}
      <Dialog open={showQRDialog} onOpenChange={handleQRDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                Connect WhatsApp Device - {selectedDevice?.number}
              </DialogTitle>
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
              >
                {selectedDevice?.status === "connected"
                  ? "Connected"
                  : "Disconnected"}
              </Badge>
            </div>
          </DialogHeader>

          <Alert className="bg-cyan-50 border-cyan-200">
            <AlertTriangle className="h-4 w-4 text-cyan-600" />
            <AlertDescription className="text-cyan-800">
              A popup window has been opened with the QR code. Please scan it with your WhatsApp mobile app, then close the popup window and click "Check Connection Status" below.
            </AlertDescription>
          </Alert>

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
              >
                {isCheckingStatus ? "Checking..." : "Check Connection Status"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


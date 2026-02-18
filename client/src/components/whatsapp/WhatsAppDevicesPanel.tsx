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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Smartphone,
  ExternalLink,
  FileText,
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface WhatsAppDevicesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppDevicesPanel({
  open,
  onOpenChange,
}: WhatsAppDevicesPanelProps) {
  const [showCreateSessionDialog, setShowCreateSessionDialog] = useState(false);
  const [createSessionForm, setCreateSessionForm] = useState({
    connectionType: "official",
    phoneNumberId: "",
    accessToken: "",
    businessAccountId: "",
  });
  const { toast } = useToast();

  // Fetch sessions from provider API
  const { data: sessionsData, isLoading, isError } = useQuery<
    { sessions?: any[] } | any[]
  >({
    queryKey: ["/api/whatsapp/sessions"],
    enabled: open,
    retry: false,
  });

  const sessions: any[] = Array.isArray(sessionsData)
    ? sessionsData
    : (sessionsData as any)?.sessions ?? (sessionsData as any)?.data ?? [];

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

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest(
        "DELETE",
        `/api/whatsapp/sessions/${encodeURIComponent(sessionId)}`
      );
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

  const handleCreateSession = () => {
    if (
      !createSessionForm.phoneNumberId ||
      !createSessionForm.accessToken ||
      !createSessionForm.businessAccountId
    ) {
      toast({
        title: "Validation Error",
        description:
          "Phone Number ID, Access Token, and Business Account ID are required",
        variant: "destructive",
      });
      return;
    }
    createSessionMutation.mutate(createSessionForm);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[640px] lg:w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              WhatsApp Sessions
            </SheetTitle>
            <SheetDescription>
              Manage your WhatsApp Business phone numbers. Sessions are created
              via the provider API.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await apiRequest(
                      "GET",
                      "/api/whatsapp/panel-login-url"
                    );
                    const data = await res.json();
                    if (data?.url) {
                      window.open(data.url, "_blank");
                      toast({
                        title: "Opened",
                        description: "WhatsApp panel opened in new tab",
                      });
                    } else {
                      toast({
                        title: "Error",
                        description: data?.error || "Failed to get panel URL",
                        variant: "destructive",
                      });
                    }
                  } catch (e: any) {
                    toast({
                      title: "Error",
                      description:
                        e?.message || "Failed to open WhatsApp panel",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isError}
                title="Open WhatsApp panel in new tab for auto-login"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to WhatsApp Panel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowCreateSessionDialog(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Connect WhatsApp Business
                </Button>
                <Link href="/whatsapp-devices">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Full Settings
                  </Button>
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center text-gray-500 py-8">
                Loading sessions...
              </div>
            ) : isError ? (
              <div className="text-center text-amber-600 py-8">
                WhatsApp is not configured or provider API error. Complete setup
                at{" "}
                <Link href="/whatsapp-setup">
                  <span className="underline">WhatsApp Setup</span>
                </Link>{" "}
                first.
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No active sessions. Click &quot;Connect WhatsApp Business&quot;
                to add one, or open Full Settings for more options.
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session: any, idx: number) => {
                  const di = session.deviceInfo;
                  const statusDisplay =
                    session.status === "connected"
                      ? di?.codeVerificationStatus ?? "Connected"
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
                    <div
                      key={session.id ?? session.sessionId ?? idx}
                      className="border border-gray-200 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-gray-900">
                              {di?.verifiedName ?? di?.wabaName ?? "-"}
                            </span>
                            <Badge
                              variant={
                                session.status === "connected"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                session.status === "connected"
                                  ? "bg-orange-500 hover:bg-orange-600"
                                  : "bg-gray-400"
                              }
                            >
                              {statusDisplay}
                            </Badge>
                            {di?.qualityRating && (
                              <Badge
                                className={`${qualityColor} text-white`}
                              >
                                {di.qualityRating}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-0.5">
                            <div>
                              {di?.displayPhoneNumber ?? di?.phoneNumber ?? "-"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {session.lastActive
                                ? formatDistanceToNow(
                                    new Date(session.lastActive),
                                    { addSuffix: true }
                                  )
                                : "-"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {di?.apiPhoneNumberId ? (
                            <Link
                              href={`/whatsapp-templates?phoneNumberId=${encodeURIComponent(di.apiPhoneNumberId)}&verifiedName=${encodeURIComponent(di.verifiedName || di.wabaName || "Templates")}`}
                            >
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => onOpenChange(false)}
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Templates</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Link>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-50 cursor-not-allowed"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Templates (connect first)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            title="Delete"
                            onClick={() =>
                              handleDeleteSession(session.sessionId)
                            }
                            disabled={deleteSessionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Session Dialog */}
      <Dialog
        open={showCreateSessionDialog}
        onOpenChange={setShowCreateSessionDialog}
      >
        <DialogContent className="max-w-lg">
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
                  setCreateSessionForm({
                    ...createSessionForm,
                    connectionType: e.target.value,
                  })
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
                  setCreateSessionForm({
                    ...createSessionForm,
                    phoneNumberId: e.target.value,
                  })
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
                  setCreateSessionForm({
                    ...createSessionForm,
                    accessToken: e.target.value,
                  })
                }
                placeholder="YOUR_META_ACCESS_TOKEN"
                rows={3}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="businessAccountId">
                Business Account ID (WABA ID) *
              </Label>
              <Input
                id="businessAccountId"
                value={createSessionForm.businessAccountId}
                onChange={(e) =>
                  setCreateSessionForm({
                    ...createSessionForm,
                    businessAccountId: e.target.value,
                  })
                }
                placeholder="YOUR_WABA_ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateSessionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending
                ? "Creating..."
                : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

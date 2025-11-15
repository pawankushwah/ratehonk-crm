import { useState, useRef } from "react";
import {
  MessageSquare,
  Image as ImageIcon,
  Send,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WhatsappDevice } from "@shared/schema";
import EmojiPicker from "emoji-picker-react";

interface WhatsAppMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Customer mode props
  customerPhone?: string;
  customerName?: string;
  customerId?: number;
  // Lead mode props
  recipientType?: "customer" | "lead";
  recipientId?: number;
  recipientName?: string;
  recipientPhone?: string;
  // Common props
  tenantId?: number;
  onSuccess?: () => void;
}

export function WhatsAppMessageDialog({
  open,
  onOpenChange,
  customerPhone,
  customerName,
  customerId,
  recipientType = "customer",
  recipientId,
  recipientName,
  recipientPhone,
  tenantId,
  onSuccess,
}: WhatsAppMessageDialogProps) {
  // Determine if we're in lead mode or customer mode
  const isLeadMode = recipientType === "lead";
  const phoneNumber = isLeadMode ? recipientPhone : customerPhone;
  const displayName = isLeadMode ? recipientName : customerName;
  const entityId = isLeadMode ? recipientId : customerId;
  const [activeTab, setActiveTab] = useState("text");
  const { toast } = useToast();

  // Text message state
  const [textDevice, setTextDevice] = useState<string>("");
  const [textMessage, setTextMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Media message state
  const [mediaDevice, setMediaDevice] = useState<string>("");
  const [mediaType, setMediaType] = useState<string>("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch connected devices
  const { data: devices = [] } = useQuery<WhatsappDevice[]>({
    queryKey: ["/api/whatsapp-devices"],
  });

  // Send text message mutation
  const sendTextMutation = useMutation({
    mutationFn: async () => {
      const selectedDevice = devices.find((d) => d.id.toString() === textDevice);
      if (!selectedDevice) {
        throw new Error("Please select a WhatsApp device");
      }
      const payload: any = {
        sender: selectedDevice.number,
        number: phoneNumber,
        message: textMessage,
      };
      
      if (isLeadMode && entityId) {
        payload.leadId = entityId;
      } else if (!isLeadMode && entityId) {
        payload.customerId = entityId;
      }
      
      return await apiRequest("POST", "/api/whatsapp/send-text-message", payload);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: `WhatsApp message sent to ${displayName}`,
      });
      setTextMessage("");
      // Invalidate WhatsApp messages query to refresh the list
      if (tenantId && entityId) {
        if (isLeadMode) {
          queryClient.invalidateQueries({
            queryKey: [`/api/tenants/${tenantId}/leads/${entityId}/whatsapp-messages`],
          });
        } else {
          queryClient.invalidateQueries({
            queryKey: [`/api/tenants/${tenantId}/customers/${entityId}/whatsapp-messages`],
          });
        }
      }
      // Also invalidate general queries
      if (entityId) {
        queryClient.invalidateQueries({
          queryKey: isLeadMode ? ["/api/leads", entityId] : ["/api/customers", entityId],
        });
      }
      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Send media message mutation
  const sendMediaMutation = useMutation({
    mutationFn: async () => {
      const selectedDevice = devices.find((d) => d.id.toString() === mediaDevice);
      if (!selectedDevice) {
        throw new Error("Please select a WhatsApp device");
      }
      const payload: any = {
        sender: selectedDevice.number,
        number: phoneNumber,
        media_type: mediaType,
        url: mediaUrl,
        caption: mediaCaption || undefined,
      };
      
      if (isLeadMode && entityId) {
        payload.leadId = entityId;
      } else if (!isLeadMode && entityId) {
        payload.customerId = entityId;
      }
      
      return await apiRequest("POST", "/api/whatsapp/send-media-message", payload);
    },
    onSuccess: () => {
      toast({
        title: "Media Sent",
        description: `WhatsApp media message sent to ${displayName}`,
      });
      setMediaUrl("");
      setMediaCaption("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Invalidate WhatsApp messages query to refresh the list
      if (tenantId && entityId) {
        if (isLeadMode) {
          queryClient.invalidateQueries({
            queryKey: [`/api/tenants/${tenantId}/leads/${entityId}/whatsapp-messages`],
          });
        } else {
          queryClient.invalidateQueries({
            queryKey: [`/api/tenants/${tenantId}/customers/${entityId}/whatsapp-messages`],
          });
        }
      }
      // Also invalidate general queries
      if (entityId) {
        queryClient.invalidateQueries({
          queryKey: isLeadMode ? ["/api/leads", entityId] : ["/api/customers", entityId],
        });
      }
      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send media message",
        variant: "destructive",
      });
    },
  });

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const textarea = textAreaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText =
        textMessage.substring(0, start) + emoji + textMessage.substring(end);
      setTextMessage(newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setTextMessage((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log("📎 No files selected");
      return;
    }

    const file = files[0]; // WhatsApp only supports single file
    console.log(`📎 Uploading file: ${file.name}...`);
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('attachments', file);

      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      const response = await fetch('/api/email-attachments/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload file' }));
        throw new Error(errorData.message || 'Failed to upload file');
      }

      const result = await response.json();
      const uploadedFiles = result.files || [];
      
      if (uploadedFiles.length === 0) {
        throw new Error('No file was uploaded');
      }
      
      // Use the first uploaded file's path as the media URL
      const uploadedFile = uploadedFiles[0];
      if (uploadedFile.path) {
        setMediaUrl(uploadedFile.path);
        console.log(`✅ Successfully uploaded file: ${uploadedFile.filename}, path: ${uploadedFile.path}`);
        
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } else {
        throw new Error('Uploaded file missing path');
      }
      
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendText = () => {
    if (!textDevice) {
      toast({
        title: "Error",
        description: "Please select a WhatsApp device",
        variant: "destructive",
      });
      return;
    }
    if (!textMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }
    sendTextMutation.mutate();
  };

  const handleSendMedia = () => {
    if (!mediaDevice) {
      toast({
        title: "Error",
        description: "Please select a WhatsApp device",
        variant: "destructive",
      });
      return;
    }
    if (!mediaUrl.trim()) {
      toast({
        title: "Error",
        description: "Please upload a media file or provide a URL",
        variant: "destructive",
      });
      return;
    }
    sendMediaMutation.mutate();
  };

  // Reset form when dialog closes
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset all form state when closing
      setTextMessage("");
      setMediaUrl("");
      setMediaCaption("");
      setTextDevice("");
      setMediaDevice("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Send WhatsApp Message to {displayName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Phone: {phoneNumber}
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" data-testid="tab-text-message">
              <MessageSquare className="h-4 w-4 mr-2" />
              Text Message
            </TabsTrigger>
            <TabsTrigger value="media" data-testid="tab-media-message">
              <ImageIcon className="h-4 w-4 mr-2" />
              Media Message
            </TabsTrigger>
          </TabsList>

          {/* Text Message Tab */}
          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="text-device">WhatsApp Device *</Label>
              <Select value={textDevice} onValueChange={setTextDevice}>
                <SelectTrigger
                  id="text-device"
                  data-testid="select-text-device"
                >
                  <SelectValue placeholder="Select a connected device" />
                </SelectTrigger>
                <SelectContent>
                  {devices
                    .filter((d) => d.status === "connected")
                    .map((device) => (
                      <SelectItem
                        key={device.id}
                        value={device.id.toString()}
                        data-testid={`device-option-${device.id}`}
                      >
                        {device.number} - (Sent {device.messagesSent})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {devices.filter((d) => d.status === "connected").length === 0 && (
                <p className="text-sm text-amber-600">
                  No connected devices. Please connect a device first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="text-message">Message *</Label>
              <div className="relative">
                <Textarea
                  ref={textAreaRef}
                  id="text-message"
                  data-testid="textarea-message"
                  placeholder="Type your message here..."
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  data-testid="button-emoji-picker"
                >
                  😊
                </Button>
              </div>
              {showEmojiPicker && (
                <div className="absolute z-50 mt-2">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-text"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendText}
                disabled={sendTextMutation.isPending}
                data-testid="button-send-text"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendTextMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </TabsContent>

          {/* Media Message Tab */}
          <TabsContent value="media" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="media-device">WhatsApp Device *</Label>
              <Select value={mediaDevice} onValueChange={setMediaDevice}>
                <SelectTrigger
                  id="media-device"
                  data-testid="select-media-device"
                >
                  <SelectValue placeholder="Select a connected device" />
                </SelectTrigger>
                <SelectContent>
                  {devices
                    .filter((d) => d.status === "connected")
                    .map((device) => (
                      <SelectItem
                        key={device.id}
                        value={device.id.toString()}
                        data-testid={`media-device-option-${device.id}`}
                      >
                        {device.number} - (Sent {device.messagesSent})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media-type">Media Type *</Label>
              <Select value={mediaType} onValueChange={setMediaType}>
                <SelectTrigger id="media-type" data-testid="select-media-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Upload Media File</Label>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept={
                    mediaType === "image"
                      ? "image/*"
                      : mediaType === "video"
                        ? "video/*"
                        : mediaType === "audio"
                          ? "audio/*"
                          : ".pdf,.doc,.docx,.txt"
                  }
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  className="flex items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Uploading..." : "Choose File"}
                </Button>
                {mediaUrl && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800 flex items-center justify-between">
                    <span>✓ File uploaded: {mediaUrl.split('/').pop()}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMediaUrl("");
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media-url">Or Media URL *</Label>
              <Input
                id="media-url"
                data-testid="input-media-url"
                placeholder="https://example.com/media.jpg"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Upload a file above or enter a direct URL to the media
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media-caption">Caption (Optional)</Label>
              <Textarea
                id="media-caption"
                data-testid="textarea-media-caption"
                placeholder="Add a caption to your media..."
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-media"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMedia}
                disabled={sendMediaMutation.isPending}
                data-testid="button-send-media"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendMediaMutation.isPending ? "Sending..." : "Send Media"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

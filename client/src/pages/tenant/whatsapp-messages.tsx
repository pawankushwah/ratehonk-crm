import { useState, useRef, useCallback } from "react";
import {
  MessageSquare,
  Image as ImageIcon,
  Package,
  Hash,
  Sticker,
  BarChart3,
  List,
  MapPin,
  Contact,
  Square,
  Upload,
  X,
  Wrench,
  Smartphone,
  Settings,
} from "lucide-react";
import { Link } from "wouter";
import { WhatsAppSettingsPanel } from "@/components/whatsapp/WhatsAppSettingsPanel";
import { WhatsAppDevicesPanel } from "@/components/whatsapp/WhatsAppDevicesPanel";
import { WhatsAppSetupPanel } from "@/components/whatsapp/WhatsAppSetupPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout/layout";
import EmojiPicker from "emoji-picker-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WhatsappDevice } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

type MessageType =
  | "text"
  | "media"
  | "product"
  | "channel"
  | "sticker"
  | "poll"
  | "list"
  | "location"
  | "vcard"
  | "button";

interface ListSection {
  title: string;
  rows: { title: string; description: string }[];
}

const messageTypes = [
  { id: "text" as MessageType, label: "Text Message", icon: MessageSquare },
  { id: "media" as MessageType, label: "Media Message", icon: ImageIcon },
  // { id: "product" as MessageType, label: "Product Message", icon: Package },
  // { id: "channel" as MessageType, label: "Channel Message", icon: Hash },
  // { id: "sticker" as MessageType, label: "Sticker Message", icon: Sticker },
  // { id: "poll" as MessageType, label: "Poll Message", icon: BarChart3 },
  // { id: "list" as MessageType, label: "List Message", icon: List },
  // { id: "location" as MessageType, label: "Location Message", icon: MapPin },
  // { id: "vcard" as MessageType, label: "VCard Message", icon: Contact },
  // { id: "button" as MessageType, label: "Button Message (*)", icon: Square },
];

function LocationPicker({
  position,
  setPosition,
}: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return <Marker position={position} />;
}

export default function WhatsAppMessaging() {
  const [selectedType, setSelectedType] = useState<MessageType>("text");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [textMessage, setTextMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [stickerFile, setStickerFile] = useState<File | null>(null);
  const [stickerPreview, setStickerPreview] = useState<string>("");
  const [buttonImageFile, setButtonImageFile] = useState<File | null>(null);
  const [buttonImagePreview, setButtonImagePreview] = useState<string>("");
  const [mapPosition, setMapPosition] = useState<[number, number]>([
    51.505, -0.09,
  ]);
  const [listSections, setListSections] = useState<ListSection[]>([
    { title: "", rows: [{ title: "", description: "" }] },
  ]);
  const [buttons, setButtons] = useState<string[]>([""]);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isDevicesPanelOpen, setIsDevicesPanelOpen] = useState(false);
  const [isSetupPanelOpen, setIsSetupPanelOpen] = useState(false);

  // Text message form state
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [receiverNumber, setReceiverNumber] = useState("");
  const [footer, setFooter] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

  // Media message form state
  const [mediaSelectedDevice, setMediaSelectedDevice] = useState<string>("");
  const [mediaReceiverNumber, setMediaReceiverNumber] = useState("");
  const [mediaSelectedRecipients, setMediaSelectedRecipients] = useState<
    string[]
  >([]);
  const [mediaType, setMediaType] = useState<string>("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaFooter, setMediaFooter] = useState("");

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const buttonImageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch connected devices
  const { data: devices = [] } = useQuery<WhatsappDevice[]>({
    queryKey: ["/api/whatsapp-devices"],
  });

  // Fetch customers with phone numbers
  const { data: customersData } = useQuery<{
    customers: Array<{
      id: number;
      name: string;
      phone: string;
      email: string;
    }>;
  }>({
    queryKey: ["/api/whatsapp/customers-with-phone"],
  });

  // Fetch leads with phone numbers
  const { data: leadsData } = useQuery<{
    leads: Array<{
      id: number;
      name: string;
      phone: string;
      email: string;
      leadType: string;
    }>;
  }>({
    queryKey: ["/api/whatsapp/leads-with-phone"],
  });

  const customers = customersData?.customers || [];
  const leads = leadsData?.leads || [];

  // Get only connected devices for sending messages
  const connectedDevices = devices.filter((d) => d.status === "connected");

  // Send text message mutation
  const sendTextMutation = useMutation({
    mutationFn: async (data: {
      sender: string;
      number: string;
      message: string;
      footer?: string;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/whatsapp/send-text-message",
        data,
      );
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Message sent successfully!",
      });
      // Clear form
      setTextMessage("");
      setReceiverNumber("");
      setFooter("");
      setSelectedRecipients([]);
      // Refresh device list to update message count
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-devices"] });
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
    mutationFn: async (data: {
      sender: string;
      number: string;
      media_type: string;
      url: string;
      caption?: string;
      footer?: string;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/whatsapp/send-media-message",
        data,
      );
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Media message sent successfully!",
      });
      // Clear form
      setMediaUrl("");
      setMediaCaption("");
      setMediaFooter("");
      setMediaReceiverNumber("");
      setMediaSelectedRecipients([]);
      // Refresh device list to update message count
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-devices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send media message",
        variant: "destructive",
      });
    },
  });

  const handleToggleRecipient = (phone: string) => {
    setSelectedRecipients((prev) => {
      if (prev.includes(phone)) {
        return prev.filter((p) => p !== phone);
      } else {
        return [...prev, phone];
      }
    });
  };

  const handleAddSelectedToReceiver = () => {
    if (selectedRecipients.length === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one customer or lead",
        variant: "destructive",
      });
      return;
    }

    // Combine existing numbers with selected recipients
    const existingNumbers = receiverNumber.split("|").filter((n) => n.trim());
    const allNumbers = Array.from(
      new Set([...existingNumbers, ...selectedRecipients]),
    );
    setReceiverNumber(allNumbers.join("|"));

    toast({
      title: "Recipients Added",
      description: `${selectedRecipients.length} phone number(s) added to receiver list`,
    });

    // Clear selection
    setSelectedRecipients([]);
  };

  const handleGetMediaUploadURL = async () => {
    try {
      const response = await apiRequest(
        "POST",
        "/api/whatsapp/media/upload-url",
        {},
      );
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      toast({
        title: "Error",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleMediaUploadComplete = async (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;

      try {
        const response = await apiRequest(
          "POST",
          "/api/whatsapp/media/confirm-upload",
          {
            uploadURL,
          },
        );
        const data = await response.json();

        setMediaUrl(data.publicURL);

        toast({
          title: "Upload Successful",
          description: "Media file uploaded successfully!",
        });
      } catch (error) {
        console.error("Error confirming upload:", error);
        toast({
          title: "Error",
          description: "Failed to confirm upload",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleMediaRecipient = (phone: string) => {
    setMediaSelectedRecipients((prev) => {
      if (prev.includes(phone)) {
        return prev.filter((p) => p !== phone);
      } else {
        return [...prev, phone];
      }
    });
  };

  const handleAddSelectedToMediaReceiver = () => {
    if (mediaSelectedRecipients.length === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one customer or lead",
        variant: "destructive",
      });
      return;
    }

    // Combine existing numbers with selected recipients
    const existingNumbers = mediaReceiverNumber
      .split("|")
      .filter((n) => n.trim());
    const allNumbers = Array.from(
      new Set([...existingNumbers, ...mediaSelectedRecipients]),
    );
    setMediaReceiverNumber(allNumbers.join("|"));

    toast({
      title: "Recipients Added",
      description: `${mediaSelectedRecipients.length} phone number(s) added to receiver list`,
    });

    // Clear selection
    setMediaSelectedRecipients([]);
  };

  const handleSendMediaMessage = () => {
    if (!mediaSelectedDevice) {
      toast({
        title: "Error",
        description: "Please select a sender device",
        variant: "destructive",
      });
      return;
    }

    // Combine all recipient sources: selected + manual
    const manualNumbers = mediaReceiverNumber
      .split("|")
      .filter((n) => n.trim());
    const allNumbers = Array.from(
      new Set([...manualNumbers, ...mediaSelectedRecipients]),
    );

    // Validate at least one recipient exists
    if (allNumbers.length === 0) {
      toast({
        title: "Error",
        description:
          "Please select recipients from customers/leads or enter phone numbers manually",
        variant: "destructive",
      });
      return;
    }

    if (!mediaUrl) {
      toast({
        title: "Error",
        description: "Please enter media URL",
        variant: "destructive",
      });
      return;
    }

    // Send with all combined numbers
    sendMediaMutation.mutate({
      sender: mediaSelectedDevice,
      number: allNumbers.join("|"),
      media_type: mediaType,
      url: mediaUrl,
      caption: mediaCaption || undefined,
      footer: mediaFooter || undefined,
    });
  };

  const handleSendTextMessage = () => {
    if (!selectedDevice) {
      toast({
        title: "Error",
        description: "Please select a sender device",
        variant: "destructive",
      });
      return;
    }

    // Combine all recipient sources: selected + manual
    const manualNumbers = receiverNumber.split("|").filter((n) => n.trim());
    const allNumbers = Array.from(
      new Set([...manualNumbers, ...selectedRecipients]),
    );

    // Validate at least one recipient exists
    if (allNumbers.length === 0) {
      toast({
        title: "Error",
        description:
          "Please select recipients from customers/leads or enter phone numbers manually",
        variant: "destructive",
      });
      return;
    }

    if (!textMessage) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    // Send with all combined numbers
    sendTextMutation.mutate({
      sender: selectedDevice,
      number: allNumbers.join("|"),
      message: textMessage,
      footer: footer || undefined,
    });
  };

  const handleTextFormat = (format: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textMessage.substring(start, end);

    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `*${selectedText}*`;
        break;
      case "italic":
        formattedText = `_${selectedText}_`;
        break;
      case "strikethrough":
        formattedText = `~${selectedText}~`;
        break;
      case "code":
        formattedText = `\`\`\`${selectedText}\`\`\``;
        break;
    }

    const newText =
      textMessage.substring(0, start) +
      formattedText +
      textMessage.substring(end);
    setTextMessage(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + formattedText.length,
        start + formattedText.length,
      );
    }, 0);
  };

  const handleEmojiClick = (emojiData: any) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText =
      textMessage.substring(0, start) +
      emojiData.emoji +
      textMessage.substring(start);
    setTextMessage(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + emojiData.emoji.length,
        start + emojiData.emoji.length,
      );
    }, 0);

    setShowEmojiPicker(false);
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStickerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStickerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setStickerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleButtonImageFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setButtonImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setButtonImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    if (pollOptions.length < 12) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const addListSection = () => {
    setListSections([
      ...listSections,
      { title: "", rows: [{ title: "", description: "" }] },
    ]);
  };

  const updateSectionTitle = (sectionIndex: number, value: string) => {
    const newSections = [...listSections];
    newSections[sectionIndex].title = value;
    setListSections(newSections);
  };

  const addRowToSection = (sectionIndex: number) => {
    const newSections = [...listSections];
    newSections[sectionIndex].rows.push({ title: "", description: "" });
    setListSections(newSections);
  };

  const updateSectionRow = (
    sectionIndex: number,
    rowIndex: number,
    field: "title" | "description",
    value: string,
  ) => {
    const newSections = [...listSections];
    newSections[sectionIndex].rows[rowIndex][field] = value;
    setListSections(newSections);
  };

  const removeSection = (sectionIndex: number) => {
    if (listSections.length > 1) {
      setListSections(listSections.filter((_, i) => i !== sectionIndex));
    }
  };

  const addButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, ""]);
    }
  };

  const updateButton = (index: number, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = value;
    setButtons(newButtons);
  };

  const removeButton = (index: number) => {
    if (buttons.length > 1) {
      setButtons(buttons.filter((_, i) => i !== index));
    }
  };

  const renderTextMessage = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="sender">Sender Device *</Label>
        {connectedDevices.length === 0 ? (
          <div className="text-sm text-red-600 mt-1">
            No connected devices available. Please connect a device first.
          </div>
        ) : (
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger data-testid="select-sender-device">
              <SelectValue placeholder="Select a connected device" />
            </SelectTrigger>
            <SelectContent>
              {connectedDevices.map((device) => (
                <SelectItem key={device.id} value={device.number}>
                  {device.number} (Sent: {device.messagesSent})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Select Recipients from Customers/Leads */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <Label className="text-base font-semibold mb-3 block">
          Select Recipients (Optional)
        </Label>
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Leads ({leads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="mt-4">
            {customers.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                No customers with phone numbers found
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center space-x-3 p-2 hover:bg-white rounded border border-transparent hover:border-gray-200"
                  >
                    <Checkbox
                      id={`customer-${customer.id}`}
                      checked={selectedRecipients.includes(customer.phone)}
                      onCheckedChange={() =>
                        handleToggleRecipient(customer.phone)
                      }
                      data-testid={`checkbox-customer-${customer.id}`}
                    />
                    <label
                      htmlFor={`customer-${customer.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-gray-600">{customer.phone}</div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leads" className="mt-4">
            {leads.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                No leads with phone numbers found
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center space-x-3 p-2 hover:bg-white rounded border border-transparent hover:border-gray-200"
                  >
                    <Checkbox
                      id={`lead-${lead.id}`}
                      checked={selectedRecipients.includes(lead.phone)}
                      onCheckedChange={() => handleToggleRecipient(lead.phone)}
                      data-testid={`checkbox-lead-${lead.id}`}
                    />
                    <label
                      htmlFor={`lead-${lead.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-gray-600">{lead.phone}</div>
                      {lead.leadType && (
                        <div className="text-xs text-gray-500">
                          {lead.leadType}
                        </div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedRecipients.length > 0 && (
          <div className="mt-3 flex items-center justify-between bg-cyan-50 border border-cyan-200 rounded p-2">
            <span className="text-sm text-cyan-800">
              {selectedRecipients.length} recipient(s) selected
            </span>
            <Button
              onClick={handleAddSelectedToReceiver}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="button-add-selected"
            >
              Add to Receiver List
            </Button>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="receiver">Manual Receiver Numbers (Optional)</Label>
        <Textarea
          id="receiver"
          value={receiverNumber}
          onChange={(e) => setReceiverNumber(e.target.value)}
          placeholder="628xxx|628xxx|628xxx (separate with | symbol)"
          className="min-h-[80px]"
          data-testid="textarea-receiver"
        />
        <p className="text-xs text-gray-500 mt-1">
          You can select from above, enter manually here, or both. At least one
          recipient is required.
        </p>
      </div>
      <div>
        <Label>Text Message</Label>
        <div className="border rounded-md">
          <div className="flex items-center gap-1 border-b p-2 bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleTextFormat("bold")}
              data-testid="button-bold"
            >
              <b>B</b>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleTextFormat("italic")}
              data-testid="button-italic"
            >
              <i>I</i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleTextFormat("strikethrough")}
              data-testid="button-strikethrough"
            >
              <s>S</s>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleTextFormat("code")}
              data-testid="button-code"
            >
              {"<>"}
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                data-testid="button-emoji"
              >
                😊
              </Button>
              {showEmojiPicker && (
                <div className="absolute top-10 left-0 z-50">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>
          </div>
          <Textarea
            ref={textAreaRef}
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            placeholder="Example : {'{'}Hi{'}'}Hello! your number is {'{'}number{'}'}"
            className="min-h-[200px] border-0 focus-visible:ring-0"
            data-testid="textarea-message"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="footer">Footer message *optional</Label>
        <Input
          id="footer"
          value={footer}
          onChange={(e) => setFooter(e.target.value)}
          placeholder=""
          data-testid="input-footer"
        />
      </div>
      <div className="flex justify-center">
        <Button
          onClick={handleSendTextMessage}
          disabled={sendTextMutation.isPending || connectedDevices.length === 0}
          className="bg-cyan-500 hover:bg-cyan-600"
          data-testid="button-send"
        >
          {sendTextMutation.isPending ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </div>
  );

  const renderMediaMessage = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="media-sender">Sender Device *</Label>
        {connectedDevices.length === 0 ? (
          <div className="text-sm text-red-600 mt-1">
            No connected devices available. Please connect a device first.
          </div>
        ) : (
          <Select
            value={mediaSelectedDevice}
            onValueChange={setMediaSelectedDevice}
          >
            <SelectTrigger data-testid="select-media-sender-device">
              <SelectValue placeholder="Select a connected device" />
            </SelectTrigger>
            <SelectContent>
              {connectedDevices.map((device) => (
                <SelectItem key={device.id} value={device.number}>
                  {device.number} (Sent: {device.messagesSent})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Select Recipients from Customers/Leads */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <Label className="text-base font-semibold mb-3 block">
          Select Recipients (Optional)
        </Label>
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Leads ({leads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="mt-4">
            {customers.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                No customers with phone numbers found
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center space-x-3 p-2 hover:bg-white rounded border border-transparent hover:border-gray-200"
                  >
                    <Checkbox
                      id={`media-customer-${customer.id}`}
                      checked={mediaSelectedRecipients.includes(customer.phone)}
                      onCheckedChange={() =>
                        handleToggleMediaRecipient(customer.phone)
                      }
                      data-testid={`checkbox-media-customer-${customer.id}`}
                    />
                    <label
                      htmlFor={`media-customer-${customer.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-gray-600">{customer.phone}</div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leads" className="mt-4">
            {leads.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                No leads with phone numbers found
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center space-x-3 p-2 hover:bg-white rounded border border-transparent hover:border-gray-200"
                  >
                    <Checkbox
                      id={`media-lead-${lead.id}`}
                      checked={mediaSelectedRecipients.includes(lead.phone)}
                      onCheckedChange={() =>
                        handleToggleMediaRecipient(lead.phone)
                      }
                      data-testid={`checkbox-media-lead-${lead.id}`}
                    />
                    <label
                      htmlFor={`media-lead-${lead.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-gray-600">{lead.phone}</div>
                      {lead.leadType && (
                        <div className="text-xs text-gray-500">
                          {lead.leadType}
                        </div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {mediaSelectedRecipients.length > 0 && (
          <div className="mt-3 flex items-center justify-between bg-cyan-50 border border-cyan-200 rounded p-2">
            <span className="text-sm text-cyan-800">
              {mediaSelectedRecipients.length} recipient(s) selected
            </span>
            <Button
              onClick={handleAddSelectedToMediaReceiver}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="button-add-media-selected"
            >
              Add to Receiver List
            </Button>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="media-receiver">
          Manual Receiver Numbers (Optional)
        </Label>
        <Textarea
          id="media-receiver"
          value={mediaReceiverNumber}
          onChange={(e) => setMediaReceiverNumber(e.target.value)}
          placeholder="628xxx|628xxx|628xxx (separate with | symbol)"
          className="min-h-[80px]"
          data-testid="textarea-media-receiver"
        />
        <p className="text-xs text-gray-500 mt-1">
          You can select from above, enter manually here, or both. At least one
          recipient is required.
        </p>
      </div>
      <div>
        <Label>Media Type *</Label>
        <RadioGroup
          value={mediaType}
          onValueChange={setMediaType}
          className="flex gap-4"
          data-testid="radio-media-type"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id="media-image" />
            <Label htmlFor="media-image">Image</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="video" id="media-video" />
            <Label htmlFor="media-video">Video</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="audio" id="media-audio" />
            <Label htmlFor="media-audio">Audio</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="document" id="media-document" />
            <Label htmlFor="media-document">Document</Label>
          </div>
        </RadioGroup>
      </div>
      <div>
        <Label htmlFor="media-url">Media URL *</Label>
        <div className="flex gap-2 items-start">
          <Input
            id="media-url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://example.com/image.jpg or upload a file below"
            data-testid="input-media-url"
            className="flex-1"
          />
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={52428800}
            onGetUploadParameters={handleGetMediaUploadURL}
            onComplete={handleMediaUploadComplete}
            buttonClassName="bg-indigo-600 hover:bg-indigo-700"
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </div>
          </ObjectUploader>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter a direct URL or upload a file (max 50MB). Upload will auto-fill
          the URL field.
        </p>
      </div>
      <div>
        <Label htmlFor="media-caption">Caption (Optional)</Label>
        <Textarea
          id="media-caption"
          value={mediaCaption}
          onChange={(e) => setMediaCaption(e.target.value)}
          className="min-h-[100px]"
          placeholder="Enter your caption here..."
          data-testid="textarea-media-caption"
        />
      </div>
      <div>
        <Label htmlFor="media-footer">Footer Message (Optional)</Label>
        <Input
          id="media-footer"
          value={mediaFooter}
          onChange={(e) => setMediaFooter(e.target.value)}
          placeholder="Footer text"
          data-testid="input-media-footer"
        />
      </div>
      <div className="flex justify-center">
        <Button
          onClick={handleSendMediaMessage}
          disabled={
            sendMediaMutation.isPending || connectedDevices.length === 0
          }
          className="bg-cyan-500 hover:bg-cyan-600"
          data-testid="button-send-media"
        >
          {sendMediaMutation.isPending ? "Sending..." : "Send Media Message"}
        </Button>
      </div>
    </div>
  );

  const renderProductMessage = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="product-sender">Sender</Label>
        <Input
          id="product-sender"
          placeholder="919179388646"
          data-testid="input-product-sender"
        />
      </div>
      <div>
        <Label htmlFor="product-receiver">Receiver Number *</Label>
        <Textarea
          id="product-receiver"
          placeholder="628xxx|628xxx|628xxx"
          className="min-h-[80px]"
          data-testid="textarea-product-receiver"
        />
      </div>
      <div>
        <Label htmlFor="product-url">WhatsApp Product URL</Label>
        <Input
          id="product-url"
          placeholder="https://wa.me/p/1234567890123456/628xxxxx"
          data-testid="input-product-url"
        />
      </div>
      <div>
        <Label htmlFor="product-message">Message *optional</Label>
        <Textarea
          id="product-message"
          className="min-h-[100px]"
          data-testid="textarea-product-message"
        />
      </div>
      <div className="flex justify-center">
        <Button
          className="bg-cyan-500 hover:bg-cyan-600"
          data-testid="button-send-product"
        >
          Send Message
        </Button>
      </div>
    </div>
  );

  const renderChannelMessage = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="channel-sender">Sender</Label>
        <Input
          id="channel-sender"
          placeholder="919179388646"
          data-testid="input-channel-sender"
        />
      </div>
      <div>
        <Label htmlFor="channel-url">Channel URL</Label>
        <Input
          id="channel-url"
          placeholder="https://whatsapp.com/channel/0029Vxxxxxxx"
          data-testid="input-channel-url"
        />
      </div>
      <div>
        <Label htmlFor="channel-message">Text Message</Label>
        <Textarea
          id="channel-message"
          placeholder="Example : {'{'}Hi{'}'}Hello! your number is {'{'}number{'}'}"
          className="min-h-[150px]"
          data-testid="textarea-channel-message"
        />
      </div>
      <div>
        <Label htmlFor="channel-footer">Footer message *optional</Label>
        <Input id="channel-footer" data-testid="input-channel-footer" />
      </div>
      <div className="flex justify-center">
        <Button
          className="bg-cyan-500 hover:bg-cyan-600"
          data-testid="button-send-channel"
        >
          Send Message
        </Button>
      </div>
    </div>
  );

  const renderStickerMessage = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="sticker-sender">Sender</Label>
        <Input
          id="sticker-sender"
          placeholder="919179388646"
          data-testid="input-sticker-sender"
        />
      </div>
      <div>
        <Label htmlFor="sticker-receiver">Receiver Number *</Label>
        <Textarea
          id="sticker-receiver"
          placeholder="628xxx|628xxx|628xxx"
          className="min-h-[80px]"
          data-testid="textarea-sticker-receiver"
        />
      </div>
      <div>
        <Label>Sticker Image</Label>
        <input
          ref={stickerInputRef}
          type="file"
          accept="image/*"
          onChange={handleStickerFileChange}
          className="hidden"
        />
        <div className="flex gap-2">
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => stickerInputRef.current?.click()}
            data-testid="button-choose-sticker"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Sticker
          </Button>
          {stickerFile && (
            <Button
              variant="outline"
              onClick={() => {
                setStickerFile(null);
                setStickerPreview("");
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
        {stickerPreview && (
          <div className="mt-2">
            <img
              src={stickerPreview}
              alt="Sticker Preview"
              className="max-w-[150px] rounded border"
            />
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <Button
          className="bg-cyan-500 hover:bg-cyan-600"
          data-testid="button-send-sticker"
        >
          Send Message
        </Button>
      </div>
    </div>
  );

  const renderPollMessage = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="poll-sender">Sender</Label>
        <Input
          id="poll-sender"
          placeholder="919179388646"
          data-testid="input-poll-sender"
        />
      </div>
      <div>
        <Label htmlFor="poll-receiver">Receiver Number *</Label>
        <Textarea
          id="poll-receiver"
          placeholder="628xxx|628xxx|628xxx"
          className="min-h-[80px]"
          data-testid="textarea-poll-receiver"
        />
      </div>
      <div>
        <Label htmlFor="poll-question">Name / Question</Label>
        <Textarea
          id="poll-question"
          className="min-h-[100px]"
          data-testid="textarea-poll-question"
        />
      </div>
      <div>
        <Label>Only one answer per number</Label>
        <Input defaultValue="Yes" data-testid="input-poll-single" />
      </div>
      <div className="space-y-2">
        <Label>Poll Options (min 2, max 12)</Label>
        {pollOptions.map((option, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={option}
              onChange={(e) => updatePollOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              data-testid={`input-poll-option-${index}`}
            />
            {pollOptions.length > 2 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => removePollOption(index)}
                data-testid={`button-remove-option-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          onClick={addPollOption}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          disabled={pollOptions.length >= 12}
          data-testid="button-add-poll-option"
        >
          + Add Option
        </Button>
      </div>
      <div className="flex justify-center">
        <Button
          className="bg-cyan-500 hover:bg-cyan-600"
          data-testid="button-send-poll"
        >
          Send Message
        </Button>
      </div>
    </div>
  );

  const renderListMessage = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="list-sender">Sender</Label>
        <Input
          id="list-sender"
          placeholder="919179388646"
          data-testid="input-list-sender"
        />
      </div>
      <div>
        <Label htmlFor="list-receiver">Receiver Number *</Label>
        <Textarea
          id="list-receiver"
          placeholder="628xxx|628xxx|628xxx"
          className="min-h-[80px]"
          data-testid="textarea-list-receiver"
        />
      </div>
      <div>
        <Label htmlFor="list-message">Message</Label>
        <Textarea
          id="list-message"
          className="min-h-[100px]"
          data-testid="textarea-list-message"
        />
      </div>
      <div>
        <Label htmlFor="list-button">Button Text</Label>
        <Input
          id="list-button"
          placeholder="View Options"
          data-testid="input-list-button"
        />
      </div>
      <div>
        <Label htmlFor="list-footer">Footer</Label>
        <Input id="list-footer" data-testid="input-list-footer" />
      </div>

      <div className="space-y-4">
        <Label>List Sections</Label>
        {listSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="border rounded-lg p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                value={section.title}
                onChange={(e) =>
                  updateSectionTitle(sectionIndex, e.target.value)
                }
                placeholder="Section Title"
                data-testid={`input-section-title-${sectionIndex}`}
              />
              {listSections.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeSection(sectionIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {section.rows.map((row, rowIndex) => (
              <div key={rowIndex} className="pl-4 space-y-2 border-l-2">
                <Input
                  value={row.title}
                  onChange={(e) =>
                    updateSectionRow(
                      sectionIndex,
                      rowIndex,
                      "title",
                      e.target.value,
                    )
                  }
                  placeholder="Row Title"
                  data-testid={`input-row-title-${sectionIndex}-${rowIndex}`}
                />
                <Input
                  value={row.description}
                  onChange={(e) =>
                    updateSectionRow(
                      sectionIndex,
                      rowIndex,
                      "description",
                      e.target.value,
                    )
                  }
                  placeholder="Row Description"
                  data-testid={`input-row-desc-${sectionIndex}-${rowIndex}`}
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addRowToSection(sectionIndex)}
              className="w-full"
            >
              + Add Row
            </Button>
          </div>
        ))}
        <Button
          onClick={addListSection}
          className="w-full bg-green-600 hover:bg-green-700"
          data-testid="button-add-section"
        >
          + Add Section
        </Button>
      </div>

      <div className="flex justify-center">
        <Button
          className="bg-cyan-500 hover:bg-cyan-600"
          data-testid="button-send-list"
        >
          Send Message
        </Button>
      </div>
    </div>
  );

  const renderLocationMessage = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="location-sender">Sender</Label>
        <Input
          id="location-sender"
          placeholder="919179388646"
          data-testid="input-location-sender"
        />
      </div>
      <div>
        <Label htmlFor="location-receiver">Receiver Number *</Label>
        <Textarea
          id="location-receiver"
          placeholder="628xxx|628xxx|628xxx"
          className="min-h-[80px]"
          data-testid="textarea-location-receiver"
        />
      </div>
      <div>
        <Label>Click on map to select location</Label>
        <div className="h-[400px] rounded-md overflow-hidden border">
          <MapContainer
            center={mapPosition}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker
              position={mapPosition}
              setPosition={setMapPosition}
            />
          </MapContainer>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            value={mapPosition[0].toFixed(6)}
            onChange={(e) =>
              setMapPosition([parseFloat(e.target.value) || 0, mapPosition[1]])
            }
            data-testid="input-latitude"
          />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            value={mapPosition[1].toFixed(6)}
            onChange={(e) =>
              setMapPosition([mapPosition[0], parseFloat(e.target.value) || 0])
            }
            data-testid="input-longitude"
          />
        </div>
      </div>
      <div className="flex justify-center">
        <Button
          className="bg-cyan-500 hover:bg-cyan-600"
          data-testid="button-send-location"
        >
          Send Message
        </Button>
      </div>
    </div>
  );

  const renderVCardMessage = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="vcard-sender">Sender</Label>
        <Input
          id="vcard-sender"
          placeholder="919179388646"
          data-testid="input-vcard-sender"
        />
      </div>
      <div>
        <Label htmlFor="vcard-receiver">Receiver Number *</Label>
        <Textarea
          id="vcard-receiver"
          placeholder="628xxx|628xxx|628xxx"
          className="min-h-[80px]"
          data-testid="textarea-vcard-receiver"
        />
      </div>
      <div>
        <Label htmlFor="vcard-name">Name</Label>
        <Input
          id="vcard-name"
          placeholder="john wick"
          data-testid="input-vcard-name"
        />
      </div>
      <div>
        <Label htmlFor="vcard-number">Number</Label>
        <Input
          id="vcard-number"
          placeholder="628xxxxxxx"
          data-testid="input-vcard-number"
        />
      </div>
      <div className="flex justify-center">
        <Button
          className="bg-cyan-500 hover:bg-cyan-600"
          data-testid="button-send-vcard"
        >
          Send Message
        </Button>
      </div>
    </div>
  );

  const renderButtonMessage = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="button-sender">Sender</Label>
        <Input
          id="button-sender"
          placeholder="919179388646"
          data-testid="input-button-sender"
        />
      </div>
      <div>
        <Label htmlFor="button-receiver">Receiver Number *</Label>
        <Textarea
          id="button-receiver"
          placeholder="628xxx|628xxx|628xxx"
          className="min-h-[80px]"
          data-testid="textarea-button-receiver"
        />
      </div>
      <div>
        <Label htmlFor="button-message">Message</Label>
        <Textarea
          id="button-message"
          className="min-h-[100px]"
          data-testid="textarea-button-message"
        />
      </div>
      <div>
        <Label htmlFor="button-footer">Footer message *optional</Label>
        <Input id="button-footer" data-testid="input-button-footer" />
      </div>
      <div>
        <Label>Header Image *optional</Label>
        <input
          ref={buttonImageInputRef}
          type="file"
          accept="image/*"
          onChange={handleButtonImageFileChange}
          className="hidden"
        />
        <div className="flex gap-2">
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => buttonImageInputRef.current?.click()}
            data-testid="button-choose-button-image"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Image
          </Button>
          {buttonImageFile && (
            <Button
              variant="outline"
              onClick={() => {
                setButtonImageFile(null);
                setButtonImagePreview("");
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
        {buttonImagePreview && (
          <div className="mt-2">
            <img
              src={buttonImagePreview}
              alt="Header Preview"
              className="max-w-xs rounded border"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Interactive Buttons (max 3)</Label>
        {buttons.map((button, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={button}
              onChange={(e) => updateButton(index, e.target.value)}
              placeholder={`Button ${index + 1} Text`}
              data-testid={`input-button-text-${index}`}
            />
            {buttons.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeButton(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {buttons.length < 3 && (
          <Button
            onClick={addButton}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            data-testid="button-add-button"
          >
            + Add Button
          </Button>
        )}
      </div>

      <div className="flex justify-center">
        <Button
          className="bg-cyan-500 hover:bg-cyan-600"
          data-testid="button-send-button"
        >
          Send Message
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedType) {
      case "text":
        return renderTextMessage();
      case "media":
        return renderMediaMessage();
      case "product":
        return renderProductMessage();
      case "channel":
        return renderChannelMessage();
      case "sticker":
        return renderStickerMessage();
      case "poll":
        return renderPollMessage();
      case "list":
        return renderListMessage();
      case "location":
        return renderLocationMessage();
      case "vcard":
        return renderVCardMessage();
      case "button":
        return renderButtonMessage();
      default:
        return renderTextMessage();
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span className="text-indigo-600">Message</span>
                <span>&gt;</span>
                <span>Test</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-700">Test Message</h1>
            </div>
            
            {/* Quick Navigation Links */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                title="WhatsApp Setup"
                data-testid="button-whatsapp-setup"
                onClick={() => setIsSetupPanelOpen(true)}
              >
                <Wrench className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                title="WhatsApp Devices"
                data-testid="button-whatsapp-devices"
                onClick={() => setIsDevicesPanelOpen(true)}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                title="WhatsApp Settings"
                data-testid="button-whatsapp-settings"
                onClick={() => setIsSettingsPanelOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex">
            <div className="w-64 border-r border-gray-200 bg-gray-50">
              <div className="p-4 space-y-1">
                {messageTypes.map((type) => {
                  const Icon = type.icon;
                  const isActive = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "text-gray-700 hover:bg-gray-100",
                      )}
                      data-testid={`nav-${type.id}`}
                    >
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 p-8">
              <div className="max-w-3xl mx-auto">{renderContent()}</div>
            </div>
          </div>
        </div>
      </div>

      <WhatsAppSettingsPanel
        open={isSettingsPanelOpen}
        onOpenChange={setIsSettingsPanelOpen}
      />
      <WhatsAppDevicesPanel
        open={isDevicesPanelOpen}
        onOpenChange={setIsDevicesPanelOpen}
      />
      <WhatsAppSetupPanel
        open={isSetupPanelOpen}
        onOpenChange={setIsSetupPanelOpen}
      />
    </Layout>
  );
}

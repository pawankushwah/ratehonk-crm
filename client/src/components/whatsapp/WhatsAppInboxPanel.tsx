import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MessageCircle,
  Paperclip,
  Send,
  Smile,
  ExternalLink,
  FileText,
  Image,
  Video,
  File,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import EmojiPicker from "emoji-picker-react";

interface Session {
  id?: string;
  sessionId: string;
  status: string;
  connectionType?: string;
  deviceInfo?: {
    phoneNumber?: string;
    apiPhoneNumberId?: string;
    verifiedName?: string;
  };
  createdAt?: string;
}

interface Chat {
  id: string;
  sessionId: string;
  contactId?: string;
  contactName: string;
  contactNumber: string;
  contactProfilePic?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isGroup?: boolean;
  tagIds?: string[];
  tags?: { id: string; name: string }[];
}

interface Tag {
  id: string;
  name: string;
  color?: string;
  colorHex?: string;
}

interface FooterButton {
  id?: string;
  text: string;
  url?: string;
  phone_number?: string;
  type?: string;
}

interface Message {
  id: string;
  chatId: string;
  sessionId: string;
  senderNumber?: string;
  senderName?: string;
  body: string;
  type?: string;
  mediaUrl?: string;
  fromMe: boolean;
  status?: string;
  timestamp: string;
  sentAt?: string;
  footerButtonType?: string | null;
  footerButtonText?: string | null;
  footerButtonUrl?: string | null;
  footerButtonPhone?: string | null;
}

function parseFooterButtons(msg: Message): FooterButton[] {
  const text = msg.footerButtonText;
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizePhone(contactNumber: string): string {
  return contactNumber.replace(/\D/g, "").replace(/@c\.us$|@g\.us$/i, "");
}

export function WhatsAppInboxPanel() {
  const { toast } = useToast();
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string>("all");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [templateBodyParams, setTemplateBodyParams] = useState<Record<string, string>>({});
  const [templateHeaderImageUrl, setTemplateHeaderImageUrl] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sessions
  const { data: sessionsData, isLoading: sessionsLoading, isError: sessionsError } = useQuery<
    Session[] | { sessions?: Session[] }
  >({
    queryKey: ["/api/whatsapp/sessions"],
    retry: false,
  });

  const sessions: Session[] = (() => {
    if (!sessionsData) return [];
    const arr = Array.isArray(sessionsData)
      ? sessionsData
      : (sessionsData as any)?.sessions ?? (sessionsData as any)?.data ?? [];
    return arr.filter((s) => s.status === "connected");
  })();

  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].sessionId);
    }
  }, [sessions, selectedSessionId]);

  // Tags (for inbox filtering)
  const { data: tagsData } = useQuery<Tag[] | { tags?: Tag[] }>({
    queryKey: ["/api/whatsapp/tags"],
    retry: false,
  });

  const tags: Tag[] = (() => {
    if (!tagsData) return [];
    const arr = Array.isArray(tagsData)
      ? tagsData
      : (tagsData as any)?.tags ?? (tagsData as any)?.data ?? [];
    return arr;
  })();

  // Inbox list: use chats when "All", use contacts with tags when a tag is selected
  const selectedTag = tags.find((t) => t.id === selectedTagId);
  const useContactsForTag = selectedTagId && selectedTagId !== "all" && selectedTag;

  const chatsQueryParams = new URLSearchParams();
  if (selectedSessionId) chatsQueryParams.set("sessionId", selectedSessionId);
  const chatsQueryKey = selectedSessionId
    ? `/api/whatsapp/chats?${chatsQueryParams.toString()}`
    : "";

  const contactsQueryParams = new URLSearchParams();
  if (selectedSessionId) contactsQueryParams.set("sessionId", selectedSessionId);
  if (selectedTag) contactsQueryParams.set("tags", selectedTag.name);
  const contactsQueryKey =
    selectedSessionId && useContactsForTag
      ? `/api/whatsapp/contacts?${contactsQueryParams.toString()}`
      : "";

  const { data: chatsData, isLoading: chatsLoading } = useQuery<Chat[] | { chats?: Chat[] }>({
    queryKey: [chatsQueryKey],
    enabled: !!selectedSessionId && !useContactsForTag,
    refetchInterval: 30000,
  });

  const { data: contactsData, isLoading: contactsLoading } = useQuery<
    Chat[] | { contacts?: Chat[] }
  >({
    queryKey: [contactsQueryKey],
    enabled: !!selectedSessionId && !!useContactsForTag,
    refetchInterval: 30000,
  });

  const chats: Chat[] = (() => {
    if (useContactsForTag && contactsData) {
      return Array.isArray(contactsData)
        ? contactsData
        : (contactsData as any)?.contacts ?? (contactsData as any)?.chats ?? (contactsData as any)?.data ?? [];
    }
    if (!chatsData) return [];
    return Array.isArray(chatsData)
      ? chatsData
      : (chatsData as any)?.chats ?? (chatsData as any)?.data ?? [];
  })();

  const filteredChats = chats.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.contactName?.toLowerCase().includes(q) ||
        c.contactNumber?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const listLoading = useContactsForTag ? contactsLoading : chatsLoading;

  // Messages (poll every 15s when chat open)
  const messagesQueryKey = selectedChat
    ? `/api/whatsapp/messages?chatId=${encodeURIComponent(selectedChat.id)}`
    : "";
  const { data: messagesData, isLoading: messagesLoading } = useQuery<
    Message[] | { messages?: Message[] }
  >({
    queryKey: [messagesQueryKey],
    enabled: !!selectedChat?.id,
    refetchInterval: selectedChat ? 15000 : false,
  });

  const messages: Message[] = (() => {
    if (!messagesData) return [];
    const arr = Array.isArray(messagesData)
      ? messagesData
      : (messagesData as any)?.messages ?? (messagesData as any)?.data ?? [];
    return [...arr].sort(
      (a, b) =>
        new Date(a.timestamp || a.sentAt || 0).getTime() -
        new Date(b.timestamp || b.sentAt || 0).getTime(),
    );
  })();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendTextMutation = useMutation({
    mutationFn: async (data: { sessionId: string; to: string; message: string }) => {
      const res = await apiRequest("POST", "/api/whatsapp/messages/send-text", data);
      return res.json();
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.refetchQueries({
        predicate: (q) => String(q.queryKey[0] || "").includes("/api/whatsapp/messages"),
      });
      queryClient.refetchQueries({
        predicate: (q) => {
          const key = String(q.queryKey[0] || "");
          return key.includes("/api/whatsapp/chats") || key.includes("/api/whatsapp/contacts");
        },
      });
      toast({ title: "Sent", description: "Message sent successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!messageInput.trim() || !selectedChat || !selectedSessionId) return;
    const to = normalizePhone(selectedChat.contactNumber);
    if (!to) {
      toast({ title: "Error", description: "Invalid contact number", variant: "destructive" });
      return;
    }
    sendTextMutation.mutate({
      sessionId: selectedSessionId,
      to,
      message: messageInput.trim(),
    });
  };

  const handleSendQuickReply = (text: string) => {
    if (!selectedChat || !selectedSessionId) return;
    const to = normalizePhone(selectedChat.contactNumber);
    if (!to) {
      toast({ title: "Error", description: "Invalid contact number", variant: "destructive" });
      return;
    }
    sendTextMutation.mutate({
      sessionId: selectedSessionId,
      to,
      message: text,
    });
  };

  const sendMediaMutation = useMutation({
    mutationFn: async (data: { sessionId: string; to: string; mediaType: string; url: string; caption?: string }) => {
      const res = await apiRequest("POST", "/api/whatsapp/messages/send-media", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        predicate: (q) => String(q.queryKey[0] || "").includes("/api/whatsapp/messages"),
      });
      queryClient.refetchQueries({
        predicate: (q) => {
          const key = String(q.queryKey[0] || "");
          return key.includes("/api/whatsapp/chats") || key.includes("/api/whatsapp/contacts");
        },
      });
      toast({ title: "Sent", description: "Media sent successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send media", variant: "destructive" });
    },
  });

  const sendTemplateMutation = useMutation({
    mutationFn: async (data: { sessionId: string; to: string; templateName: string; templateLanguage?: string; templateParams?: string[]; headerMediaUrl?: string }) => {
      const res = await apiRequest("POST", "/api/whatsapp/messages/send-template", data);
      return res.json();
    },
    onSuccess: () => {
      handleTemplateDialogClose(false);
      queryClient.refetchQueries({
        predicate: (q) => String(q.queryKey[0] || "").includes("/api/whatsapp/messages"),
      });
      queryClient.refetchQueries({
        predicate: (q) => {
          const key = String(q.queryKey[0] || "");
          return key.includes("/api/whatsapp/chats") || key.includes("/api/whatsapp/contacts");
        },
      });
      toast({ title: "Sent", description: "Template sent successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send template", variant: "destructive" });
    },
  });

  const selectedSession = sessions.find((s) => s.sessionId === selectedSessionId);
  const phoneNumberId = selectedSession?.deviceInfo?.apiPhoneNumberId;

  const { data: templatesData } = useQuery<any[] | { templates?: any[] }>({
    queryKey: [`/api/whatsapp/templates?phoneNumberId=${encodeURIComponent(phoneNumberId || "")}`],
    enabled: templateDialogOpen && !!phoneNumberId,
  });

  const templates: any[] = (() => {
    if (!templatesData) return [];
    return Array.isArray(templatesData)
      ? templatesData
      : (templatesData as any)?.templates ?? (templatesData as any)?.data ?? [];
  })();

  const approvedTemplates = templates.filter((t) => (t.status || "").toLowerCase() === "approved");

  /** Extract placeholders in WhatsApp order: HEADER (TEXT) first, then BODY. Media headers have no params. */
  const getTemplatePlaceholders = (tpl: any): string[] => {
    const components = tpl?.components || [];
    const ordered: string[] = [];
    for (const c of components) {
      if (c.type === "HEADER" && c.format === "TEXT" && c.text) {
        const m = c.text.match(/\{\{(\d+)\}\}/g) || [];
        m.forEach((x: string) => ordered.push(x.replace(/\{\{|\}\}/g, "")));
      }
      if (c.type === "BODY" && c.text) {
        const m = c.text.match(/\{\{(\d+)\}\}/g) || [];
        m.forEach((x: string) => ordered.push(x.replace(/\{\{|\}\}/g, "")));
      }
    }
    return [...new Set(ordered)].sort((a, b) => parseInt(a) - parseInt(b));
  };

  const getBodyPlaceholders = (tpl: any): string[] => getTemplatePlaceholders(tpl);

  const renderPreviewHeader = (tpl: any): string | null => {
    const header = tpl?.components?.find((c: any) => c.type === "HEADER" && c.format === "TEXT");
    if (!header?.text) return null;
    let text = header.text;
    Object.entries(templateBodyParams).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v || `{{${k}}}`);
    });
    return text;
  };

  const renderPreviewBody = (tpl: any): string => {
    const body = tpl?.components?.find((c: any) => c.type === "BODY");
    let text = body?.text || "";
    Object.entries(templateBodyParams).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v || `{{${k}}}`);
    });
    return text;
  };

  const hasImageHeader = (tpl: any) => {
    const header = tpl?.components?.find((c: any) => c.type === "HEADER");
    return header?.format === "IMAGE";
  };

  const getTemplateButtons = (tpl: any) => {
    const buttons = tpl?.components?.find((c: any) => c.type === "BUTTONS");
    return buttons?.buttons || [];
  };

  const handleTemplateSelect = (tpl: any) => {
    setSelectedTemplate(tpl);
    const placeholders = getBodyPlaceholders(tpl);
    const initial: Record<string, string> = {};
    placeholders.forEach((p) => (initial[p] = ""));
    setTemplateBodyParams(initial);
    setTemplateHeaderImageUrl("");
  };

  const handleSendTemplate = () => {
    if (!selectedChat || !selectedSessionId || !selectedTemplate) return;
    const to = normalizePhone(selectedChat.contactNumber);
    if (!to) {
      toast({ title: "Error", description: "Invalid contact number", variant: "destructive" });
      return;
    }
    const placeholders = getBodyPlaceholders(selectedTemplate);
    const templateParams = placeholders.map((p) => (templateBodyParams[p] ?? "").trim());
    if (placeholders.length > 0 && templateParams.some((v) => !v)) {
      toast({ title: "Error", description: "Please fill all template placeholders", variant: "destructive" });
      return;
    }
    const payload: any = {
      sessionId: selectedSessionId,
      to,
      templateName: selectedTemplate.name || selectedTemplate.templateId,
      languageCode: selectedTemplate.language || "en",
    };
    if (templateParams.length > 0) payload.templateParams = templateParams;
    if (hasImageHeader(selectedTemplate) && templateHeaderImageUrl) payload.headerImageUrl = templateHeaderImageUrl;
    sendTemplateMutation.mutate(payload);
  };

  const handleTemplateDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedTemplate(null);
      setTemplateBodyParams({});
      setTemplateHeaderImageUrl("");
    }
    setTemplateDialogOpen(open);
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setMessageInput((prev) => prev + emojiData.emoji);
    setEmojiPickerOpen(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat || !selectedSessionId) return;
    e.target.value = "";
    const to = normalizePhone(selectedChat.contactNumber);
    if (!to) {
      toast({ title: "Error", description: "Invalid contact number", variant: "destructive" });
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/objects/store", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      });
      const data = await res.json();
      if (!data.publicUrl) throw new Error("Upload failed");
      const baseUrl = window.location.origin;
      const fullUrl = data.publicUrl.startsWith("http") ? data.publicUrl : `${baseUrl}${data.publicUrl}`;
      const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "document";
      sendMediaMutation.mutate({
        sessionId: selectedSessionId,
        to,
        mediaType,
        url: fullUrl,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to upload file", variant: "destructive" });
    }
  };

  const triggerFileUpload = (accept: string) => {
    setAttachMenuOpen(false);
    const input = fileInputRef.current;
    if (input) {
      input.accept = accept;
      input.click();
    }
  };

  const tagFilters = [
    { id: "all", name: "All" },
    ...tags.map((t) => ({ id: t.id, name: t.name })),
  ];

  if (sessionsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <p className="font-medium text-amber-800">WhatsApp is not configured</p>
            <p className="text-sm text-amber-700 mt-1">
              Complete setup at{" "}
              <Link href="/whatsapp-setup" className="underline">
                WhatsApp Setup
              </Link>{" "}
              first.
            </p>
          </div>
        </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
        {/* Left panel - Chat list */}
        <div className="w-96 border-r border-gray-200 flex flex-col bg-gray-50/50">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-gray-800">Inbox</h1>
              <Link href="/whatsapp-devices">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Panel
                </Button>
              </Link>
            </div>

            {/* Session selector */}
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger className="mb-3">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.sessionId} value={s.sessionId}>
                    {s.deviceInfo?.verifiedName || s.deviceInfo?.phoneNumber || s.sessionId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tag filters */}
            <div className="flex gap-1 overflow-x-auto pb-2">
              {tagFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedTagId(f.id)}
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap ${
                    selectedTagId === f.id
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Loading chats...</div>
            ) : filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No conversations yet. Select a session to load chats.
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full flex items-start gap-3 p-4 text-left hover:bg-gray-100 border-b border-gray-100 ${
                    selectedChat?.id === chat.id ? "bg-orange-50" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-medium">
                      {(chat.contactName || chat.contactNumber || "?")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    {(chat.unreadCount ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {chat.contactName || chat.contactNumber || "Unknown"}
                      </span>
                      {chat.lastMessageTime && (
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatDistanceToNow(new Date(chat.lastMessageTime), {
                            addSuffix: false,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {chat.lastMessage || "No messages"}
                    </p>
                    <div className="mt-1">
                      <span className="inline-block w-4 h-4">
                        <svg viewBox="0 0 24 24" fill="#25D366" className="w-4 h-4">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel - Message thread */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedChat ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedChat.contactName || selectedChat.contactNumber || "Unknown"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedChat.contactNumber}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="text-center text-gray-500 py-8">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const footerButtons = parseFooterButtons(msg);
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-4 py-2 ${
                            msg.fromMe
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {msg.mediaUrl && (
                            <div className="mb-2">
                              {msg.type === "image" || !msg.type ? (
                                <img
                                  src={msg.mediaUrl}
                                  alt=""
                                  className="max-w-full rounded max-h-48 object-cover"
                                />
                              ) : msg.type === "video" ? (
                                <video
                                  src={msg.mediaUrl}
                                  controls
                                  className="max-w-full rounded max-h-48"
                                />
                              ) : msg.type === "document" ? (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-2 px-3 py-2 rounded ${msg.fromMe ? "bg-white/20 hover:bg-white/30" : "bg-black/10 hover:bg-black/20"}`}
                                >
                                  <File className="h-5 w-5 flex-shrink-0" />
                                  <span className="text-sm truncate max-w-[180px]">
                                    {msg.mediaUrl.split("/").pop() || "Document"}
                                  </span>
                                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                </a>
                              ) : msg.type === "audio" ? (
                                <audio src={msg.mediaUrl} controls className="max-w-full" />
                              ) : (
                                <img
                                  src={msg.mediaUrl}
                                  alt=""
                                  className="max-w-full rounded max-h-48 object-cover"
                                />
                              )}
                            </div>
                          )}
                          {(msg.body && msg.body !== "[Media]") && (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                          )}
                          {footerButtons.length > 0 && (
                            <div className={`flex flex-wrap gap-2 mt-2 pt-2 border-t ${msg.fromMe ? "border-white/20" : "border-gray-300"}`}>
                              {footerButtons.map((btn, i) => (
                                btn.url ? (
                                  <a
                                    key={btn.id || i}
                                    href={btn.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {btn.text}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : btn.phone_number ? (
                                  <a
                                    key={btn.id || i}
                                    href={`tel:${btn.phone_number}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <span className="inline-block w-3 h-3">📞</span>
                                    {btn.text}
                                  </a>
                                ) : (
                                  <button
                                    key={btn.id || i}
                                    type="button"
                                    onClick={() => handleSendQuickReply(btn.text)}
                                    className="inline-flex items-center px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                                    disabled={sendTextMutation.isPending}
                                  >
                                    {btn.text}
                                  </button>
                                )
                              ))}
                            </div>
                          )}
                          <p
                            className={`text-xs mt-1 ${
                              msg.fromMe ? "text-green-100" : "text-gray-500"
                            }`}
                          >
                            {msg.timestamp || msg.sentAt
                              ? format(new Date(msg.timestamp || msg.sentAt), "HH:mm")
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">
                  Free-form messages allowed (within 24-hour window)
                </p>
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  <Popover open={attachMenuOpen} onOpenChange={setAttachMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        disabled={!selectedChat || sendMediaMutation.isPending}
                        title="Attach file"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1" align="start" side="top">
                      <button
                        type="button"
                        onClick={() => triggerFileUpload("image/*")}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-gray-100 text-left"
                      >
                        <Image className="h-5 w-5 text-gray-500" />
                        <span>Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerFileUpload("video/*")}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-gray-100 text-left"
                      >
                        <Video className="h-5 w-5 text-gray-500" />
                        <span>Video</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerFileUpload(".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-gray-100 text-left"
                      >
                        <File className="h-5 w-5 text-gray-500" />
                        <span>Document</span>
                      </button>
                    </PopoverContent>
                  </Popover>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="pr-20 min-h-[44px]"
                    />
                    <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          title="Emoji"
                        >
                          <Smile className="h-4 w-4 text-gray-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-0" align="end" side="top">
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => setTemplateDialogOpen(true)}
                    disabled={!selectedChat || !phoneNumberId}
                    title="Send template"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Template
                  </Button>
                  <Button
                    size="icon"
                    className="bg-orange-500 hover:bg-orange-600 flex-shrink-0 h-11 w-11"
                    onClick={handleSend}
                    disabled={!messageInput.trim() || sendTextMutation.isPending}
                    title="Send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Send Template Message dialog */}
              <Dialog open={templateDialogOpen} onOpenChange={handleTemplateDialogClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Send Template Message</DialogTitle>
                    <p className="text-sm text-gray-500">Send a predefined message template</p>
                  </DialogHeader>
                  <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
                    {/* Preview (left) */}
                    <div className="w-1/2 flex flex-col border rounded-lg bg-gray-50 p-4 min-h-[280px]">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
                      {selectedTemplate ? (
                        <div className="flex-1 overflow-y-auto space-y-3">
                          {hasImageHeader(selectedTemplate) && (
                            <div className="rounded overflow-hidden bg-gray-200 aspect-video flex items-center justify-center">
                              {templateHeaderImageUrl ? (
                                <img src={templateHeaderImageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Image className="h-12 w-12 text-gray-400" />
                              )}
                            </div>
                          )}
                          {renderPreviewHeader(selectedTemplate) && (
                            <p className="text-sm font-medium whitespace-pre-wrap">{renderPreviewHeader(selectedTemplate)}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{renderPreviewBody(selectedTemplate)}</p>
                          <p className="text-xs text-gray-500">
                            {selectedSession?.deviceInfo?.verifiedName || "Business"}
                          </p>
                          {getTemplateButtons(selectedTemplate).length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {getTemplateButtons(selectedTemplate).map((btn: any, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-3 py-1.5 rounded text-sm font-medium bg-green-600 text-white"
                                >
                                  {btn.text || btn.type}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                          <Image className="h-16 w-16 mb-2" />
                          <p className="text-sm font-medium">No Template Selected</p>
                          <p className="text-xs mt-1">Please select a template to preview the message.</p>
                        </div>
                      )}
                    </div>
                    {/* Config (right) */}
                    <div className="w-1/2 flex flex-col gap-4 overflow-y-auto">
                      {!phoneNumberId ? (
                        <p className="text-sm text-gray-500">Select a session with a phone number to send templates.</p>
                      ) : (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Phone Number</label>
                            <Input
                              value={selectedChat ? normalizePhone(selectedChat.contactNumber) : ""}
                              readOnly
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Message Template</label>
                            <Select
                              value={selectedTemplate?.templateId || selectedTemplate?.name || ""}
                              onValueChange={(v) => {
                                const t = approvedTemplates.find((t) => t.templateId === v || t.name === v);
                                if (t) handleTemplateSelect(t);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                              <SelectContent>
                                {approvedTemplates.map((tpl) => (
                                  <SelectItem key={tpl.id || tpl.templateId} value={tpl.templateId || tpl.name}>
                                    {tpl.name || tpl.templateId} ({tpl.category || "MARKETING"})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {selectedTemplate && getBodyPlaceholders(selectedTemplate).length > 0 && (
                            <div className="space-y-2">
                              {getBodyPlaceholders(selectedTemplate).map((p) => (
                                <div key={p}>
                                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    Parameter <span className="text-gray-500 font-normal">{`{{${p}}}`}</span>
                                  </label>
                                  <Input
                                    placeholder="Enter value"
                                    value={templateBodyParams[p] ?? ""}
                                    onChange={(e) =>
                                      setTemplateBodyParams((prev) => ({ ...prev, [p]: e.target.value }))
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          {selectedTemplate && hasImageHeader(selectedTemplate) && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Image</label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Enter image URL (https://...)"
                                  value={templateHeaderImageUrl}
                                  onChange={(e) => setTemplateHeaderImageUrl(e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const input = document.createElement("input");
                                    input.type = "file";
                                    input.accept = "image/*";
                                    input.onchange = async (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (!file) return;
                                      try {
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        const token = localStorage.getItem("auth_token");
                                        const res = await fetch("/api/objects/store", {
                                          method: "POST",
                                          body: formData,
                                          credentials: "include",
                                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                                        });
                                        const data = await res.json();
                                        if (data.publicUrl) {
                                          const url = data.publicUrl.startsWith("http")
                                            ? data.publicUrl
                                            : `${window.location.origin}${data.publicUrl}`;
                                          setTemplateHeaderImageUrl(url);
                                        }
                                      } catch {}
                                    };
                                    input.click();
                                  }}
                                >
                                  Upload
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500">Select image from gallery or enter URL</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => handleTemplateDialogClose(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={handleSendTemplate}
                      disabled={!selectedTemplate || sendTemplateMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Template
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
              <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Welcome to Inbox!</h3>
              <p className="text-center max-w-sm mb-6">
                Select a contact from the list to start a conversation. Your messages will appear
                here.
              </p>
              <div className="flex gap-4">
                <div className="text-center">
                  <Button variant="outline" size="lg" className="flex flex-col h-auto py-4 px-6">
                    <MessageCircle className="h-6 w-6 mb-2" />
                    Real-time Chat
                  </Button>
                </div>
                <div className="text-center">
                  <Button variant="outline" size="lg" className="flex flex-col h-auto py-4 px-6">
                    <Paperclip className="h-6 w-6 mb-2" />
                    Templates
                  </Button>
                </div>
                <div className="text-center">
                  <Button variant="outline" size="lg" className="flex flex-col h-auto py-4 px-6">
                    <Paperclip className="h-6 w-6 mb-2" />
                    Media Sharing
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

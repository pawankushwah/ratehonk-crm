import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  ArrowLeft,
  Upload,
  FileText,
  Settings,
  Eye,
  Share2,
  Trash2,
  GripVertical,
  Calendar,
  Plane,
  Hotel,
  Ship,
  MapPin,
  Package,
  Car,
  UtensilsCrossed,
  Train,
  Bus,
  Info,
  Star,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRoute, useLocation } from "wouter";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API = (tenantId: number) => ({
  list: `/api/tenants/${tenantId}/itineraries`,
  get: (id: number) => `/api/tenants/${tenantId}/itineraries/${id}`,
  create: `/api/tenants/${tenantId}/itineraries`,
  update: (id: number) => `/api/tenants/${tenantId}/itineraries/${id}`,
  delete: (id: number) => `/api/tenants/${tenantId}/itineraries/${id}`,
  uploadCover: (itId: number) => `/api/tenants/${tenantId}/itineraries/${itId}/upload-cover`,
  sections: (id: number) => `/api/tenants/${tenantId}/itineraries/${id}/sections`,
  sectionUpdate: (sid: number) => `/api/tenants/${tenantId}/itineraries/sections/${sid}`,
  sectionDelete: (sid: number) => `/api/tenants/${tenantId}/itineraries/sections/${sid}`,
  sectionUploadImages: (sid: number) => `/api/tenants/${tenantId}/itineraries/sections/${sid}/upload-images`,
  items: (sid: number) => `/api/tenants/${tenantId}/itineraries/sections/${sid}/items`,
  itemUpdate: (iid: number) => `/api/tenants/${tenantId}/itineraries/items/${iid}`,
  itemDelete: (iid: number) => `/api/tenants/${tenantId}/itineraries/items/${iid}`,
  itemUploadImages: (iid: number) => `/api/tenants/${tenantId}/itineraries/items/${iid}/upload-images`,
  parseFiles: `/api/tenants/${tenantId}/itineraries/parse-files`,
  shareUrl: (itId: number) => `/api/tenants/${tenantId}/itineraries/${itId}/share-url`,
  sendEmail: (itId: number) => `/api/tenants/${tenantId}/itineraries/${itId}/send-email`,
});

export default function ItineraryBuilder() {
  const { tenant, user } = useAuth();
  const [, params] = useRoute("/itineraries/:id");
  const mode = params?.id === "new" ? "new" : "edit";
  const id = params?.id && params.id !== "new" ? parseInt(params.id) : null;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionFileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const sectionImageInputRef = useRef<HTMLInputElement>(null);

  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState("");
  const [uploadingSectionId, setUploadingSectionId] = useState<number | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [title, setTitle] = useState("Untitled Itinerary");
  const [intro, setIntro] = useState("");
  const [coverPhoto, setCoverPhoto] = useState("");
  const [signature, setSignature] = useState((user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ""}`.trim() : "");
  const [clientPrice, setClientPrice] = useState(0);
  const [agentProfit, setAgentProfit] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editSectionId, setEditSectionId] = useState<number | null>(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [editSectionDate, setEditSectionDate] = useState("");

  const api = tenant ? API(tenant.id) : null;
  const token = () => localStorage.getItem("auth_token");
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  const { data: itinerary, isLoading, refetch: refetchItinerary } = useQuery({
    queryKey: ["itinerary", id],
    enabled: !!api && !!id && mode === "edit",
    queryFn: async () => {
      const res = await fetch(api!.get(id!), { headers: headers() });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/customers`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenant!.id}/customers?limit=500`, { headers: headers() });
      if (!res.ok) return [];
      const j = await res.json();
      return j.customers || j.data || j || [];
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/packages`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenant!.id}/packages`, { headers: headers() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const syncFromItinerary = useCallback((it: any) => {
    setTitle(it.title || "Untitled Itinerary");
    setIntro(it.intro || "");
    setCoverPhoto(it.coverPhoto || "");
    setSignature(it.signature || "");
    setClientPrice(parseFloat(it.clientPrice) || 0);
    setAgentProfit(parseFloat(it.agentProfit) || 0);
    setCurrency(it.currency || "INR");
    setCustomerId(it.customerId ?? null);
    setSections(it.sections || []);
  }, []);

  useEffect(() => {
    if (itinerary && mode === "edit") syncFromItinerary(itinerary);
  }, [itinerary?.id, mode, syncFromItinerary]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api!.create, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      return res.json();
    },
    onSuccess: (data) => {
      navigate(`/itineraries/${data.id}`);
      queryClient.invalidateQueries({ queryKey: [api!.list] });
      toast({ title: "Itinerary created" });
    },
    onError: (e) => toast({ title: (e as Error).message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api!.update(id!), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      return res.json();
    },
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["itinerary", id] });
    },
    onError: (e) => toast({ title: (e as Error).message, variant: "destructive" }),
  });

  const save = () => {
    const payload = {
      title,
      intro,
      coverPhoto: coverPhoto || null,
      signature: signature || null,
      clientPrice,
      agentProfit,
      currency,
      customerId: customerId || null,
    };
    if (mode === "new") createMutation.mutate(payload);
    else updateMutation.mutate(payload);
  };

  const addSection = async (sectionNameOverride?: string) => {
    if (!api) return;
    if (mode === "new" || !id) {
      setAddSectionOpen(true);
      return;
    }
    const sectionName = (sectionNameOverride || newSectionName.trim()) || "New Section";
    try {
      const res = await fetch(api.sections(id), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ sectionName, displayOrder: sections.length }),
      });
      const sec = await res.json();
      if (res.ok) {
        setSections((s) => [...s, { id: sec.id, sectionName, items: [], images: [], displayOrder: sections.length }]);
        queryClient.invalidateQueries({ queryKey: ["itinerary", id] });
        setAddSectionOpen(false);
        setNewSectionName("");
      }
    } catch (e) {
      toast({ title: "Failed to add section", variant: "destructive" });
    }
  };

  const confirmAddSection = () => {
    const sectionName = newSectionName.trim() || "New Section";
    if (mode === "new" || !id) {
      createMutation.mutate({
        title,
        intro,
        coverPhoto: coverPhoto || null,
        signature: signature || null,
        clientPrice,
        agentProfit,
        currency,
        customerId: customerId || null,
        initialSectionName: sectionName,
      });
      setAddSectionOpen(false);
      setNewSectionName("");
    } else {
      addSection(sectionName);
    }
  };

  const addItem = async (sectionId: number, itemType: string = "general") => {
    if (!api) return;
    const defaultTitles: Record<string, string> = {
      flight: "New flight",
      lodging: "New accommodation",
      cruise: "New cruise",
      activity: "New activity",
      car_rental: "New car rental",
      restaurant: "New restaurant",
      train: "New train",
      transfer: "New transfer",
      general: "New item",
    };
    try {
      const res = await fetch(api.items(sectionId), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ itemType, title: defaultTitles[itemType] || "New item", displayOrder: 0 }),
      });
      const item = await res.json();
      if (res.ok) {
        setSections((s) =>
          s.map((sec) =>
            sec.id === sectionId ? { ...sec, items: [...(sec.items || []), item] } : sec
          )
        );
        queryClient.invalidateQueries({ queryKey: ["itinerary", id] });
      }
    } catch (e) {
      toast({ title: "Failed to add item", variant: "destructive" });
    }
  };

  const deleteSection = async (sectionId: number) => {
    if (!api || !id) return;
    try {
      await fetch(api.sectionDelete(sectionId), { method: "DELETE", headers: headers() });
      setSections((s) => s.filter((sec) => sec.id !== sectionId));
      queryClient.invalidateQueries({ queryKey: ["itinerary", id] });
    } catch (e) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleSectionFileUpload = async (sectionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !api || !id) return;
    setUploadingSectionId(sectionId);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append("files", files[i]);
      formData.append("sectionId", String(sectionId));
      const res = await fetch(api.parseFiles, { method: "POST", headers: headers() as any, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error("Parse failed");
      const count = data.sections?.flatMap((p: any) => p.items || []).length || 0;
      const { data: fresh } = await refetchItinerary();
      if (fresh) syncFromItinerary(fresh);
      toast({ title: `Imported ${count} item(s)` });
    } catch (err) {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setUploadingSectionId(null);
      e.target.value = "";
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !api || !id) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(api.uploadCover(id), { method: "POST", headers: headers() as any, body: formData });
      const { publicUrl } = await res.json();
      if (res.ok && publicUrl) setCoverPhoto(publicUrl);
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleSectionImagesUpload = async (sectionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !api) return;
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append("files", files[i]);
      const res = await fetch(api.sectionUploadImages(sectionId), { method: "POST", headers: headers() as any, body: formData });
      const { publicUrls } = await res.json();
      if (res.ok && publicUrls?.length) {
        setSections((s) => s.map((sec) => (sec.id === sectionId ? { ...sec, images: [...(sec.images || []), ...publicUrls] } : sec)));
        queryClient.invalidateQueries({ queryKey: ["itinerary", id] });
      }
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleItemImagesUpload = async (itemId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !api) return;
    setUploadingItemId(itemId);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append("files", files[i]);
      const res = await fetch(api.itemUploadImages(itemId), { method: "POST", headers: headers() as any, body: formData });
      const { publicUrls } = await res.json();
      if (res.ok && publicUrls?.length) {
        setSections((s) =>
          s.map((sec) => ({
            ...sec,
            items: (sec.items || []).map((it: any) =>
              it.id === itemId ? { ...it, images: [...(it.images || []), ...publicUrls] } : it
            ),
          }))
        );
        queryClient.invalidateQueries({ queryKey: ["itinerary", id] });
      }
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingItemId(null);
    }
    e.target.value = "";
  };

  const saveItemTitle = async (itemId: number, newTitle: string) => {
    if (!api) return;
    try {
      await fetch(api.itemUpdate(itemId), { method: "PUT", headers: { "Content-Type": "application/json", ...headers() }, body: JSON.stringify({ title: newTitle }) });
      setSections((s) => s.map((sec) => ({ ...sec, items: (sec.items || []).map((it: any) => (it.id === itemId ? { ...it, title: newTitle } : it)) })));
      setEditingItemId(null);
      queryClient.invalidateQueries({ queryKey: ["itinerary", id] });
    } catch (e) {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !api || !id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append("files", files[i]);
      const res = await fetch(api.parseFiles, {
        method: "POST",
        headers: headers() as any,
        body: formData,
      });
      const { sections: parsed } = await res.json();
      if (!res.ok) throw new Error("Parse failed");
      for (const ps of parsed || []) {
        const secRes = await fetch(api.sections(id), {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers() },
          body: JSON.stringify({
            sectionName: ps.sectionName || "Imported",
            sectionDate: ps.sectionDate || null,
            displayOrder: sections.length,
          }),
        });
        const sec = await secRes.json();
        if (secRes.ok && ps.items?.length) {
          for (const it of ps.items) {
            await fetch(api.items(sec.id), {
              method: "POST",
              headers: { "Content-Type": "application/json", ...headers() },
              body: JSON.stringify({
                itemType: it.itemType || "activity",
                title: it.title,
                description: it.description,
                details: it.details || {},
              }),
            });
          }
        }
      }
      const { data: fresh } = await refetchItinerary();
      if (fresh) syncFromItinerary(fresh);
      toast({ title: `Imported ${parsed?.length || 0} section(s)` });
    } catch (err) {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleShare = async () => {
    if (!api || !id) return;
    try {
      const res = await fetch(api.shareUrl(id), { headers: headers() });
      const { publicUrl } = await res.json();
      if (res.ok && publicUrl) {
        await navigator.clipboard?.writeText(publicUrl);
        toast({ title: "Share link copied to clipboard" });
      } else throw new Error("Failed to get link");
    } catch (e) {
      toast({ title: "Failed to get share link", variant: "destructive" });
    }
  };

  const handleSendToCustomer = async () => {
    if (!api || !id) return;
    const cust = customers.find((c: any) => c.id === customerId);
    if (!cust?.email) {
      toast({ title: "Select a customer with an email address", variant: "destructive" });
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch(api.sendEmail(id), { method: "POST", headers: { "Content-Type": "application/json", ...headers() }, body: JSON.stringify({}) });
      const data = await res.json();
      if (res.ok) toast({ title: "Itinerary sent to customer email" });
      else throw new Error(data.error || "Failed to send");
    } catch (e) {
      toast({ title: (e as Error).message || "Failed to send", variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  const openEditSection = (sec: any) => {
    setEditSectionId(sec.id);
    setEditSectionName(sec.sectionName);
    setEditSectionDate(sec.sectionDate || "");
  };

  const saveEditSection = async () => {
    if (!api || !editSectionId) return;
    try {
      await fetch(api.sectionUpdate(editSectionId), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ sectionName: editSectionName, sectionDate: editSectionDate || null }),
      });
      setSections((s) =>
        s.map((sec) =>
          sec.id === editSectionId
            ? { ...sec, sectionName: editSectionName, sectionDate: editSectionDate || null }
            : sec
        )
      );
      setEditSectionId(null);
      queryClient.invalidateQueries({ queryKey: ["itinerary", id] });
    } catch (e) {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const getSectionIcon = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("flight")) return Plane;
    if (n.includes("hotel") || n.includes("lodging")) return Hotel;
    if (n.includes("cruise")) return Ship;
    return MapPin;
  };

  const getItemIcon = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("flight")) return Plane;
    if (t.includes("hotel") || t.includes("lodging")) return Hotel;
    if (t.includes("cruise")) return Ship;
    if (t.includes("car") || t.includes("rental")) return Car;
    if (t.includes("restaurant")) return UtensilsCrossed;
    if (t.includes("train")) return Train;
    if (t.includes("transfer")) return Bus;
    if (t.includes("activity")) return Star;
    return Info;
  };

  const ITEM_TYPES = [
    { value: "general", label: "General", icon: Info },
    { value: "activity", label: "Activity", icon: Star },
    { value: "car_rental", label: "Car rental", icon: Car },
    { value: "cruise", label: "Cruise", icon: Ship },
    { value: "flight", label: "Flight", icon: Plane },
    { value: "lodging", label: "Lodging", icon: Hotel },
    { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
    { value: "train", label: "Train", icon: Train },
    { value: "transfer", label: "Transfer", icon: Bus },
  ];

  if (!tenant) return null;
  if (mode === "edit" && id && isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  if (mode === "new" && createMutation.isSuccess && createMutation.data?.id) {
    navigate(`/itineraries/${createMutation.data.id}`);
    return null;
  }

  const isImporting = uploading || uploadingSectionId !== null || uploadingItemId !== null;

  return (
    <Layout>
      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-xl">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">
              {uploading ? "Importing files..." : uploadingSectionId ? "Importing to section..." : "Uploading images..."}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Left: Preview */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate("/itineraries")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-bold">{title}</h1>
                <p className="text-sm text-gray-500">
                  {currency} {(clientPrice || 0).toFixed(2)} Client · {currency} {(agentProfit || 0).toFixed(2)} Profit
                </p>
              </div>
              {lastSaved && (
                <span className="text-xs text-gray-500">Last saved {Math.round((Date.now() - lastSaved.getTime()) / 60000)} min ago</span>
              )}
              <Button variant="outline" size="sm" onClick={async () => { if (!api || !id) return; try { const r = await fetch(api.shareUrl(id), { headers: headers() }); const { publicUrl } = await r.json(); if (r.ok && publicUrl) window.open(publicUrl, "_blank"); } catch { } }} disabled={!id}>
                <Eye className="h-4 w-4 mr-1" />
                Preview itinerary
              </Button>
              <Button variant="default" size="sm" onClick={handleShare} disabled={!id}>
                <Share2 className="h-4 w-4 mr-1" />
                Share itinerary
              </Button>
              {customerId && (
                <Button variant="outline" size="sm" onClick={handleSendToCustomer} disabled={!id || sendingEmail || !customers.find((c: any) => c.id === customerId)?.email}>
                  {sendingEmail ? "Sending..." : "Send to customer"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={save} disabled={createMutation.isPending || updateMutation.isPending}>
                Save
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {/* Cover + Intro */}
            <Card className="mb-6 overflow-hidden">
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              {coverPhoto ? (
                <div className="relative h-48 bg-cover bg-center group" style={{ backgroundImage: `url(${coverPhoto})` }}>
                  {id && (
                    <Button variant="secondary" size="sm" className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => coverInputRef.current?.click()}>
                      Change cover
                    </Button>
                  )}
                </div>
              ) : id ? (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400" onClick={() => coverInputRef.current?.click()}>
                  <span className="text-sm text-gray-500">Click to upload cover photo</span>
                </div>
              ) : null}
              <CardHeader>
                <CardTitle className="text-2xl">{title}</CardTitle>
                {intro && <p className="text-gray-600 whitespace-pre-wrap">{intro}</p>}
                {signature && (
                  <p className="text-lg italic mt-4" style={{ fontFamily: "cursive" }}>
                    {signature}
                  </p>
                )}
              </CardHeader>
            </Card>

            {/* Add section / item / import */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button onClick={() => setAddSectionOpen(true)} variant="default" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add section
              </Button>
              {sections.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Add item
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={!id || uploading}>
                      <FileText className="h-4 w-4 mr-2" />
                      Import a file
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {ITEM_TYPES.map(({ value, label, icon: Icon }) => (
                      <DropdownMenuItem key={value} onClick={() => sections[0] && addItem(sections[0].id, value)}>
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {id && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.txt,.csv,.html,.eml"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Importing..." : "Import files"}
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate("/packages")}>
                <Package className="h-4 w-4" />
                Explore packages
              </Button>
            </div>

            {/* Import drop zone */}
            {id && (
              <Card
                className="mb-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Import quotes and confirmations</p>
                  <p className="text-xs text-gray-500 text-center max-w-sm">
                    Drag or click to import files (flights, hotels, cruises, activities). We'll read and create sections automatically.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Sections */}
            {sections.map((sec) => {
              const Icon = getSectionIcon(sec.sectionName);
              return (
                <Card key={sec.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <CardTitle className="text-base">{sec.sectionName}</CardTitle>
                        {sec.sectionDate && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {sec.sectionDate}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <input
                          ref={sectionFileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.txt,.csv,.html,.eml"
                          className="hidden"
                          onChange={(e) => handleSectionFileUpload(sec.id, e)}
                        />
                        <input
                          ref={sectionImageInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleSectionImagesUpload(sec.id, e)}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Import from file" onClick={() => { const inp = document.createElement("input"); inp.type="file"; inp.multiple=true; inp.accept=".pdf,.txt,.csv,.html,.eml"; inp.onchange=(ev) => handleSectionFileUpload(sec.id, ev as any); inp.click(); }}>
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Upload images" onClick={() => { const inp = document.createElement("input"); inp.type="file"; inp.multiple=true; inp.accept="image/*"; inp.onchange=(ev) => handleSectionImagesUpload(sec.id, ev as any); inp.click(); }}>
                          <Upload className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSection(sec)}>
                          <Settings className="h-3 w-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Add item">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => { const inp = document.createElement("input"); inp.type="file"; inp.multiple=true; inp.accept=".pdf,.txt,.csv,.html,.eml"; inp.onchange=(ev) => handleSectionFileUpload(sec.id, ev as any); inp.click(); }}>
                              <FileText className="h-4 w-4 mr-2" />
                              Import a file
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {ITEM_TYPES.map(({ value, label, icon: Icon }) => (
                              <DropdownMenuItem key={value} onClick={() => addItem(sec.id, value)}>
                                <Icon className="h-4 w-4 mr-2" />
                                {label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteSection(sec.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mb-3 flex items-center gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        id={`section-images-${sec.id}`}
                        onChange={(e) => handleSectionImagesUpload(sec.id, e)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => document.getElementById(`section-images-${sec.id}`)?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload section images
                      </Button>
                    </div>
                    {(sec.images || []).length > 0 && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {(sec.images || []).map((img: string, i: number) => (
                          <img key={i} src={img} alt="" className="h-16 w-16 object-cover rounded border" />
                        ))}
                      </div>
                    )}
                    {(sec.items || []).length === 0 ? (
                      <p className="text-sm text-gray-500 py-4">No items. Click + to add or upload a file to import.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(sec.items || []).map((item: any) => {
                          const ItemIcon = getItemIcon(item.itemType || "general");
                          return (
                          <li key={item.id} className="flex flex-col gap-2 p-2 rounded bg-gray-50 group/item">
                            <div className="flex items-start gap-2">
                              <ItemIcon className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                {editingItemId === item.id ? (
                                  <Input
                                    value={editingItemTitle}
                                    onChange={(e) => setEditingItemTitle(e.target.value)}
                                    onBlur={() => saveItemTitle(item.id, editingItemTitle)}
                                    onKeyDown={(e) => { if (e.key === "Enter") saveItemTitle(item.id, editingItemTitle); }}
                                    autoFocus
                                    className="h-8 text-sm"
                                  />
                                ) : (
                                  <p
                                    className="font-medium text-sm cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1"
                                    onClick={() => { setEditingItemId(item.id); setEditingItemTitle(item.title); }}
                                  >
                                    {item.title}
                                  </p>
                                )}
                                {item.description && !editingItemId && <p className="text-xs text-gray-500">{item.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pl-6">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                id={`item-images-${item.id}`}
                                onChange={(e) => handleItemImagesUpload(item.id, e)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-gray-600"
                                onClick={() => document.getElementById(`item-images-${item.id}`)?.click()}
                                disabled={uploadingItemId === item.id}
                              >
                                <Upload className="h-3 w-3" />
                                {uploadingItemId === item.id ? "Uploading..." : "Add images"}
                              </Button>
                              {(item.images || []).length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {(item.images || []).map((img: string, i: number) => (
                                    <img key={i} src={img} alt="" className="h-10 w-10 object-cover rounded border" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right: Settings panel */}
        <div className="w-full lg:w-96 border-l bg-white p-6">
          <h3 className="font-semibold mb-4">Itinerary settings</h3>
          <div className="space-y-4">
            {id && (
              <div>
                <Label>Cover photo</Label>
                <div className="mt-1 flex gap-2">
                  <Input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={handleCoverUpload} />
                  <Button variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                  {coverPhoto && <img src={coverPhoto} alt="Cover" className="h-16 w-16 object-cover rounded" />}
                </div>
              </div>
            )}
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 7 Nights at Sea" />
            </div>
            <div>
              <Label>Intro</Label>
              <Textarea value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Welcome message..." rows={3} />
            </div>
            <div>
              <Label>Signature</Label>
              <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label>Customer</Label>
              <Select value={customerId != null ? customerId.toString() : "__none__"} onValueChange={(v) => setCustomerId(v === "__none__" ? null : parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name || c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Client price</Label>
                <Input type="number" value={clientPrice || ""} onChange={(e) => setClientPrice(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Your profit</Label>
                <Input type="number" value={agentProfit || ""} onChange={(e) => setAgentProfit(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Add section dialog */}
      <Dialog open={addSectionOpen} onOpenChange={(o) => { setAddSectionOpen(o); if (!o) setNewSectionName(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section title</Label>
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g. Flights, Hotels, Activities"
              />
            </div>
            <Button onClick={confirmAddSection}>
              {mode === "new" || !id ? "Create itinerary & add section" : "Add section"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit section dialog */}
      <Dialog open={!!editSectionId} onOpenChange={(o) => !o && setEditSectionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section name</Label>
              <Input value={editSectionName} onChange={(e) => setEditSectionName(e.target.value)} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={editSectionDate} onChange={(e) => setEditSectionDate(e.target.value)} />
            </div>
            <Button onClick={saveEditSection}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

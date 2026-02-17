import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  FileText,
  Image,
  Copy,
  CheckCircle2,
  ArrowLeft,
  FileType,
  Phone,
  MessageCircle,
  ExternalLink,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type TemplateStatus = "APPROVED" | "PENDING" | "REJECTED";
type StatusFilter = "all" | "pending" | "approved" | "rejected";

interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
  buttons?: Array<{ type: string; text?: string; url?: string; phone_number?: string; example?: string[] }>;
  example?: { body_text?: string[][]; header_handle?: string[] };
}

interface WhatsAppTemplate {
  id: string;
  templateId: string;
  name: string;
  language: string;
  status: TemplateStatus;
  category: string;
  phoneNumberId: string;
  components?: TemplateComponent[];
  createdAt: string;
  syncedAt?: string;
}

function getTemplateType(components?: TemplateComponent[]): "Image" | "Text" {
  const header = components?.find((c) => c.type === "HEADER");
  return header?.format === "IMAGE" ? "Image" : "Text";
}

function getExampleValues(component: TemplateComponent): string[] | undefined {
  const ex = (component as any).example;
  if (!ex) return undefined;
  const bodyText = ex.body_text as string[][] | undefined;
  if (bodyText?.[0]) return bodyText[0];
  return undefined;
}

function renderBodyWithExamples(text: string | undefined, examples: string[] | undefined): string {
  if (!text) return "";
  if (!examples?.length) return text;
  return text.replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const idx = parseInt(n, 10) - 1;
    return examples[idx] ?? `{{${n}}}`;
  });
}

function getComponentCounts(components?: TemplateComponent[]) {
  const header = components?.find((c) => c.type === "HEADER");
  const body = components?.find((c) => c.type === "BODY");
  const buttons = components?.find((c) => c.type === "BUTTONS");
  const docCount = header?.format === "DOCUMENT" ? 1 : 0;
  const phoneCount = buttons?.buttons?.filter((b) => b.type === "PHONE_NUMBER").length ?? 0;
  const quickReplyCount = buttons?.buttons?.filter((b) => b.type === "QUICK_REPLY").length ?? 0;
  const urlCount = buttons?.buttons?.filter((b) => b.type === "URL").length ?? 0;
  return { docCount, phoneCount, quickReplyCount, urlCount };
}

export default function WhatsAppTemplates() {
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const phoneNumberId = searchParams.get("phoneNumberId") || "";
  const verifiedName = searchParams.get("verifiedName") || "Templates";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);

  const { data: templatesData, isLoading, isError } = useQuery<WhatsAppTemplate[] | { templates?: WhatsAppTemplate[] }>({
    queryKey: [`/api/whatsapp/templates?phoneNumberId=${encodeURIComponent(phoneNumberId)}`],
    enabled: !!phoneNumberId,
    retry: false,
  });

  const templates: WhatsAppTemplate[] = useMemo(() => {
    if (!templatesData) return [];
    return Array.isArray(templatesData)
      ? templatesData
      : (templatesData as any)?.templates ?? (templatesData as any)?.data ?? [];
  }, [templatesData]);

  const filteredTemplates = useMemo(() => {
    if (statusFilter === "all") return templates;
    return templates.filter((t) => t.status.toLowerCase() === statusFilter);
  }, [templates, statusFilter]);

  const copyTemplateId = (templateId: string) => {
    navigator.clipboard.writeText(templateId);
    toast({ title: "Copied", description: "Template ID copied to clipboard" });
  };

  if (!phoneNumberId) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/whatsapp-devices">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Devices
              </Button>
            </Link>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center text-amber-800">
            <p className="font-medium">Missing phone number</p>
            <p className="text-sm mt-1">
              Please navigate from the WhatsApp devices page by clicking the templates icon on a connected session.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/whatsapp-devices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Devices
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-700">
            Templates for {decodeURIComponent(verifiedName)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Message templates for this WhatsApp Business phone number.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                statusFilter === tab.key
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Show All Templates
            </Button>
          </div>
        </div>

        {/* Templates Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      Loading templates...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-amber-600">
                      Failed to load templates. WhatsApp may not be configured.
                    </td>
                  </tr>
                ) : filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      No templates found.
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((template) => {
                    const templateType = getTemplateType(template.components);
                    const counts = getComponentCounts(template.components);
                    return (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2 text-sm font-mono text-gray-900">
                            {template.templateId}
                            <button
                              onClick={() => copyTemplateId(template.templateId)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Copy"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {template.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="border-gray-300 text-gray-700">
                            {template.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {template.language}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              template.status === "APPROVED"
                                ? "bg-orange-500 text-white"
                                : template.status === "PENDING"
                                  ? "bg-yellow-500 text-white"
                                  : "bg-red-500 text-white"
                            }
                          >
                            <CheckCircle2 className="h-3.5 w-3 mr-1" />
                            {template.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            {templateType === "Image" ? (
                              <Image className="h-4 w-4 text-gray-400" />
                            ) : (
                              <FileType className="h-4 w-4 text-gray-400" />
                            )}
                            {templateType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="inline-flex items-center gap-1" title="Documents">
                              <FileText className="h-3.5 w-3.5" />
                              {counts.docCount}
                            </span>
                            <span className="inline-flex items-center gap-1" title="Phone">
                              <Phone className="h-3.5 w-3.5" />
                              {counts.phoneCount}
                            </span>
                            <span className="inline-flex items-center gap-1" title="Quick reply">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {counts.quickReplyCount}
                            </span>
                            <span className="inline-flex items-center gap-1" title="URL">
                              <ExternalLink className="h-3.5 w-3.5" />
                              {counts.urlCount}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {template.createdAt
                            ? format(new Date(template.createdAt), "MMM d, yyyy, hh:mm a")
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Template Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <DialogTitle>Template Preview</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mr-2"
                onClick={() => setPreviewTemplate(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            {previewTemplate && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">{previewTemplate.name}</p>

                {/* Template content - WhatsApp message style */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                  {previewTemplate.components?.map((comp) => {
                    if (comp.type === "HEADER") {
                      if (comp.format === "TEXT" && comp.text) {
                        return (
                          <p key={comp.type} className="font-medium text-gray-900">
                            {comp.text}
                          </p>
                        );
                      }
                      if (comp.format === "IMAGE") {
                        return (
                          <div
                            key={comp.type}
                            className="h-24 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm"
                          >
                            [Image]
                          </div>
                        );
                      }
                      return null;
                    }
                    if (comp.type === "BODY") {
                      const examples = getExampleValues(comp);
                      const bodyText = renderBodyWithExamples(comp.text, examples);
                      return (
                        <p key={comp.type} className="text-gray-700 whitespace-pre-wrap text-sm">
                          {bodyText}
                        </p>
                      );
                    }
                    if (comp.type === "FOOTER" && comp.text) {
                      return (
                        <p key={comp.type} className="text-gray-500 text-xs">
                          {comp.text}
                        </p>
                      );
                    }
                    if (comp.type === "BUTTONS" && comp.buttons?.length) {
                      return (
                        <div key={comp.type} className="flex flex-wrap gap-2 pt-2">
                          {comp.buttons.map((btn, i) =>
                            btn.type === "URL" && btn.url ? (
                              <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                asChild
                              >
                                <a href={btn.url} target="_blank" rel="noopener noreferrer">
                                  {btn.text || btn.url}
                                </a>
                              </Button>
                            ) : (
                              <Button key={i} variant="outline" size="sm" className="text-xs">
                                {btn.type === "PHONE_NUMBER" ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {btn.text || "Call"}
                                  </span>
                                ) : (
                                  btn.text || "Button"
                                )}
                              </Button>
                            ),
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Badge
                    className={
                      previewTemplate.status === "APPROVED"
                        ? "bg-orange-500 text-white"
                        : previewTemplate.status === "PENDING"
                          ? "bg-yellow-500 text-white"
                          : "bg-red-500 text-white"
                    }
                  >
                    <CheckCircle2 className="h-3.5 w-3 mr-1" />
                    {previewTemplate.status}
                  </Badge>
                  <Badge variant="outline">{previewTemplate.category}</Badge>
                  <Badge variant="outline">{previewTemplate.language}</Badge>
                  <span className="text-xs text-gray-500 self-center">
                    Template ID: {previewTemplate.templateId}
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Plus, Search, Mail, MessageSquare, Smartphone, 
  Edit, Trash2, Eye, Copy, MoreHorizontal,
  FileText
} from "lucide-react";
import { TemplateBuilder } from "@/components/campaigns/TemplateBuilder";
import { format } from "date-fns";

interface EmailTemplate {
  id: number;
  name: string;
  channel: "email" | "sms" | "whatsapp";
  category?: string;
  subject?: string;
  content: string;
  previewText?: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export default function EmailTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<"all" | "email" | "sms" | "whatsapp">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: [`/api/tenants/${tenant?.id}/email-templates`],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenant?.id}/email-templates`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
    enabled: !!tenant?.id
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/email-templates`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-templates`] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Template Created!",
        description: "Your template has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create template",
        variant: "destructive"
      });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: { templateId: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/tenants/${tenant?.id}/email-templates/${data.templateId}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-templates`] });
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      toast({
        title: "Template Updated!",
        description: "Template has been updated successfully."
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await apiRequest("DELETE", `/api/tenants/${tenant?.id}/email-templates/${templateId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-templates`] });
      toast({
        title: "Template Deleted",
        description: "Template has been removed."
      });
    }
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const duplicateData = {
        name: `${template.name} (Copy)`,
        channel: template.channel,
        category: template.category,
        subject: template.subject,
        content: template.content,
        previewText: template.previewText,
      };
      const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/email-templates`, duplicateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-templates`] });
      toast({
        title: "Template Duplicated",
        description: "Template has been duplicated successfully."
      });
    }
  });

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === "all" || template.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return Mail;
      case "sms": return MessageSquare;
      case "whatsapp": return Smartphone;
      default: return FileText;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "email": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "sms": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "whatsapp": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="rounded-lg shadow-sm mx-2 my-2">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="w-full h-[72px] flex items-center bg-white px-[18px] py-4 rounded-t-xl border-b border-[#E3E8EF] shadow-[0px_1px_6px_0px_rgba(0,0,0,0.05)]">
            <h1 className="font-inter font-medium text-[20px] leading-[24px] text-[#121926]">
              Email Templates
            </h1>
            <div className="flex gap-3 ml-auto">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await apiRequest("POST", `/api/tenants/${tenant?.id}/email-templates/create-dummy`);
                    const data = await response.json();
                    queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/email-templates`] });
                    toast({
                      title: "Dummy Templates Created!",
                      description: data.message || `Created ${data.templates?.length || 0} templates`,
                    });
                  } catch (error: any) {
                    toast({
                      title: "Creation Failed",
                      description: error.message || "Failed to create dummy templates",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Dummy Templates
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <TemplateBuilder
                      tenantId={tenant?.id}
                      onSave={(data) => {
                        createTemplateMutation.mutate(data);
                      }}
                      onCancel={() => setIsCreateDialogOpen(false)}
                      isLoading={createTemplateMutation.isPending}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={channelFilter} onValueChange={(v) => setChannelFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All Channels</TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="whatsapp">
                  <Smartphone className="h-4 w-4 mr-2" />
                  WhatsApp
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No templates found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm || channelFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first template to get started"
                  }
                </p>
                {!searchTerm && channelFilter === "all" && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Template
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const Icon = getChannelIcon(template.channel);
                return (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTemplate(template);
                                setIsPreviewDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTemplate(template);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => duplicateTemplateMutation.mutate(template)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteTemplateMutation.mutate(template.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getChannelColor(template.channel)}>
                            {template.channel}
                          </Badge>
                          {template.category && (
                            <Badge variant="outline">{template.category}</Badge>
                          )}
                          {template.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                        {template.subject && (
                          <div>
                            <p className="text-sm text-muted-foreground">Subject:</p>
                            <p className="text-sm font-medium truncate">{template.subject}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Content Preview:</p>
                          <p className="text-sm line-clamp-2 text-muted-foreground">
                            {template.content.replace(/<[^>]*>/g, "").substring(0, 100)}...
                          </p>
                        </div>
                        {template.createdAt && (
                          <p className="text-xs text-muted-foreground">
                            Created {format(new Date(template.createdAt), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto min-h-0">
            {selectedTemplate && (
              <TemplateBuilder
                tenantId={tenant?.id}
                initialData={selectedTemplate}
                onSave={(data) => {
                  updateTemplateMutation.mutate({
                    templateId: selectedTemplate.id,
                    updates: data,
                  });
                }}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedTemplate(null);
                }}
                isLoading={updateTemplateMutation.isPending}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Channel:</span>
                  <Badge className={cn("ml-2", getChannelColor(selectedTemplate.channel))}>
                    {selectedTemplate.channel}
                  </Badge>
                </div>
                {selectedTemplate.subject && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600">Subject:</span>
                    <span className="ml-2 font-semibold">{selectedTemplate.subject}</span>
                  </div>
                )}
              </div>
              <div className="border rounded-lg p-6 bg-white">
                {selectedTemplate.channel === "email" ? (
                  <div 
                    className="prose max-w-none" 
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.content }} 
                  />
                ) : (
                  <div className="whitespace-pre-wrap font-mono text-sm">
                    {selectedTemplate.content}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}


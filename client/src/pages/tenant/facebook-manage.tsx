import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Facebook, Settings, RefreshCw, ArrowLeft, 
  CheckCircle, XCircle, FileText, Users, Calendar
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FacebookPage {
  id: string;
  pageId: string;
  pageName: string;
  pageAccessToken?: string;
  followersCount?: number;
  isActive: boolean;
}

interface LeadForm {
  id: string;
  formId: string;
  formName: string;
  pageId: string;
  pageName: string;
  totalLeads?: number;
  isActive: boolean;
}

export default function FacebookManage() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  // Fetch Facebook pages
  const { data: pages = [], isLoading: isLoadingPages } = useQuery<FacebookPage[]>({
    queryKey: [`/api/tenants/${tenant?.id}/facebook/pages`],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tenants/${tenant?.id}/facebook/pages`);
      return response.json();
    },
  });

  // Fetch lead forms for selected page
  const { data: leadForms = [], isLoading: isLoadingForms } = useQuery<LeadForm[]>({
    queryKey: [`/api/tenants/${tenant?.id}/facebook/pages/${selectedPage}/lead-forms`],
    enabled: !!tenant?.id && !!selectedPage,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tenants/${tenant?.id}/facebook/pages/${selectedPage}/lead-forms`);
      return response.json();
    },
  });

  // Sync leads mutation
  const syncLeadsMutation = useMutation({
    mutationFn: async ({ pageId, formId }: { pageId?: string; formId?: string }) => {
      const url = formId 
        ? `/api/tenants/${tenant?.id}/facebook/pages/${pageId}/lead-forms/${formId}/sync`
        : `/api/tenants/${tenant?.id}/facebook/sync-leads`;
      const response = await apiRequest("POST", url);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/pages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenant?.id}/facebook/pages/${selectedPage}/lead-forms`] });
      toast({
        title: "Leads Synced!",
        description: `Successfully imported ${data.imported || data.importedCount || 0} new leads.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync leads",
        variant: "destructive",
      });
    },
  });

  const activePages = pages.filter(p => p.isActive);
  const selectedPageData = pages.find(p => p.pageId === selectedPage);

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/social-integrations')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Facebook Pages</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and manage your Facebook pages and lead forms
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pages List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="h-5 w-5" />
                Connected Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPages ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : activePages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No pages connected</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate('/social-integrations')}
                  >
                    Connect Pages
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {activePages.map((page) => (
                    <div
                      key={page.pageId}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPage === page.pageId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPage(page.pageId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{page.pageName}</p>
                          {page.followersCount && (
                            <p className="text-sm text-gray-500">
                              {page.followersCount.toLocaleString()} followers
                            </p>
                          )}
                        </div>
                        {selectedPage === page.pageId && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Forms */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lead Forms
                  {selectedPageData && (
                    <span className="text-sm font-normal text-gray-500">
                      - {selectedPageData.pageName}
                    </span>
                  )}
                </CardTitle>
                {selectedPage && (
                  <Button
                    size="sm"
                    onClick={() => syncLeadsMutation.mutate({ pageId: selectedPage })}
                    disabled={syncLeadsMutation.isPending}
                  >
                    {syncLeadsMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync All Forms
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedPage ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Select a page to view its lead forms</p>
                </div>
              ) : isLoadingForms ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : leadForms.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-2">No lead forms found for this page</p>
                  <p className="text-sm text-gray-400">
                    Create lead forms in your Facebook Page settings
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Leads</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadForms.map((form) => (
                      <TableRow key={form.formId}>
                        <TableCell className="font-medium">{form.formName}</TableCell>
                        <TableCell>
                          <Badge variant={form.isActive ? "default" : "secondary"}>
                            {form.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{form.totalLeads || 0}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => syncLeadsMutation.mutate({ 
                              pageId: form.pageId, 
                              formId: form.formId 
                            })}
                            disabled={syncLeadsMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}


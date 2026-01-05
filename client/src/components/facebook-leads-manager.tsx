/**
 * Facebook Leads Manager Component
 * Manages Facebook Lead Ads integration and lead syncing
 */

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, RefreshCw, CheckCircle, XCircle, Users, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface FacebookLeadsManagerProps {
  integrationId?: string;
  isOpen: boolean;
  onClose: () => void;
  tenantId: number;
}

interface FacebookPage {
  id: string;
  name: string;
  category?: string;
}

interface FacebookForm {
  id: string;
  name: string;
  status: string;
  leads_count?: number;
}

export function FacebookLeadsManager({
  integrationId,
  isOpen,
  onClose,
  tenantId,
}: FacebookLeadsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [syncResult, setSyncResult] = useState<any>(null);

  // Fetch Facebook pages
  const { data: pagesData, isLoading: pagesLoading } = useQuery<{
    success: boolean;
    pages: FacebookPage[];
    count: number;
  }>({
    queryKey: [`/api/integrations/facebook-lead-ads/pages`, tenantId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/integrations/facebook-lead-ads/pages?tenantId=${tenantId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch pages");
      }
      return response.json();
    },
    enabled: isOpen && !!tenantId,
  });

  // Fetch forms when page is selected
  const { data: formsData, isLoading: formsLoading } = useQuery<{
    success: boolean;
    forms: FacebookForm[];
    count: number;
  }>({
    queryKey: [`/api/integrations/facebook-lead-ads/forms`, selectedPageId, tenantId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/integrations/facebook-lead-ads/forms/${selectedPageId}?tenantId=${tenantId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch forms");
      }
      return response.json();
    },
    enabled: isOpen && !!selectedPageId && !!tenantId,
  });

  // Sync leads mutation
  const syncLeadsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/integrations/facebook-lead-ads/sync-leads`, {
        integrationId,
        pageId: selectedPageId || undefined,
        formId: selectedFormId || undefined,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        tenantId,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync leads");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setSyncResult(data);
      toast({
        title: "Leads Synced Successfully!",
        description: `Synced ${data.syncedContactsCount} new contacts and updated ${data.updatedContactsCount} existing contacts.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenantId}/social-integrations`] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync leads from Facebook",
        variant: "destructive",
      });
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPageId("");
      setSelectedFormId("");
      setStartDate(undefined);
      setEndDate(undefined);
      setSyncResult(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Facebook Lead Ads Manager</DialogTitle>
          <DialogDescription>
            Select a Facebook page and lead form to sync leads into your CRM
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Page Selection */}
            <div className="space-y-2">
              <Label htmlFor="page">Facebook Page</Label>
              <Select
                value={selectedPageId}
                onValueChange={(value) => {
                  setSelectedPageId(value);
                  setSelectedFormId(""); // Reset form when page changes
                }}
                disabled={pagesLoading}
              >
                <SelectTrigger id="page">
                  <SelectValue placeholder={pagesLoading ? "Loading pages..." : "Select a page"} />
                </SelectTrigger>
                <SelectContent>
                  {pagesData?.pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name} {page.category && `(${page.category})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pagesData && pagesData.count === 0 && (
                <p className="text-sm text-muted-foreground">No Facebook pages found. Please connect a Facebook account first.</p>
              )}
            </div>

            {/* Form Selection */}
            {selectedPageId && (
              <div className="space-y-2">
                <Label htmlFor="form">Lead Form</Label>
                <Select
                  value={selectedFormId}
                  onValueChange={setSelectedFormId}
                  disabled={formsLoading || !selectedPageId}
                >
                  <SelectTrigger id="form">
                    <SelectValue placeholder={formsLoading ? "Loading forms..." : "Select a form (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Forms</SelectItem>
                    {formsData?.forms.map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.name} ({form.status}) {form.leads_count !== undefined && `- ${form.leads_count} leads`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formsData && formsData.count === 0 && (
                  <p className="text-sm text-muted-foreground">No lead forms found for this page.</p>
                )}
              </div>
            )}

            {/* Date Range Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Sync Button */}
            <Button
              onClick={() => syncLeadsMutation.mutate()}
              disabled={syncLeadsMutation.isPending || !selectedPageId}
              className="w-full"
              size="lg"
            >
              {syncLeadsMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing Leads...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Leads
                </>
              )}
            </Button>

            {/* Sync Results */}
            {syncResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Sync Results</CardTitle>
                  <CardDescription>Summary of the lead sync operation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Leads</p>
                      <p className="text-2xl font-bold">{syncResult.count || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">New Contacts</p>
                      <p className="text-2xl font-bold text-green-600">{syncResult.syncedContactsCount || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Updated</p>
                      <p className="text-2xl font-bold text-blue-600">{syncResult.updatedContactsCount || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Skipped</p>
                      <p className="text-2xl font-bold text-gray-600">{syncResult.skippedContactsCount || 0}</p>
                    </div>
                  </div>

                  {syncResult.errorDetails && syncResult.errorDetails.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-destructive">Errors:</p>
                      <ScrollArea className="h-32">
                        {syncResult.errorDetails.map((error: any, index: number) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            {error.leadId || error.formId || error.pageId}: {error.error}
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Synced at {new Date(syncResult.syncedAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


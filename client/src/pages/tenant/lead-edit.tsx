import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { FlexibleLeadForm } from "@/components/lead/flexible-lead-form";
import { directLeadsApi } from "@/lib/direct-leads-api";
import type { Lead } from "@/lib/types";

export default function LeadEdit() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/leads/:id/edit");
  const leadId = params?.id;
  const { user, tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lead, isLoading: isLoadingLead } = useQuery({
    queryKey: [`lead-${leadId}`],
    queryFn: async () => {
      const leads = await directLeadsApi.getLeads(tenant?.id!);
      return leads.find((l: Lead) => String(l.id) === leadId);
    },
    enabled: !!leadId && !!tenant?.id,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const requestData = {
        ...data,
        tenantId: tenant?.id,
        userId: user?.id,
        name: `${data.firstName} ${data.lastName}`,
      };
      return directLeadsApi.updateLead(tenant?.id!, Number(leadId!), requestData);
    },
    onSuccess: (updatedLead) => {
      const currentLeads =
        (queryClient.getQueryData([`leads-tenant-${tenant?.id}`]) as Lead[]) ||
        [];
      const updatedLeads = currentLeads.map((l) =>
        String(l.id) === leadId ? updatedLead : l
      );
      queryClient.setQueryData([`leads-tenant-${tenant?.id}`], updatedLeads);
      queryClient.invalidateQueries({
        queryKey: [`leads-tenant-${tenant?.id}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`lead-${leadId}`],
      });

      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      setLocation("/leads");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateLeadMutation.mutate(data);
  };

  const onCancel = () => {
    setLocation("/leads");
  };

  if (isLoadingLead) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#0BBCD6]" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading lead...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Lead not found
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              The lead you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={onCancel} data-testid="button-back-to-leads">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              data-testid="button-back-to-leads"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Edit Lead
            </h1>
            <div className="w-20"></div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <FlexibleLeadForm
              lead={lead}
              tenantId={String(tenant?.id!)}
              userId={String(user?.id!)}
              onSubmit={onSubmit}
              onCancel={onCancel}
              isLoading={updateLeadMutation.isPending}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

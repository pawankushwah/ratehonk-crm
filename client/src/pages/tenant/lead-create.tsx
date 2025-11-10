import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { FlexibleLeadForm } from "@/components/lead/flexible-lead-form";
import { directLeadsApi } from "@/lib/direct-leads-api";
import type { Lead } from "@/lib/types";

export default function LeadCreate() {
  const [, setLocation] = useLocation();
  const { user, tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const requestData = {
        ...data,
        tenantId: tenant?.id,
        userId: user?.id,
        name: `${data.firstName} ${data.lastName}`,
      };
      return directLeadsApi.createLead(tenant?.id!, requestData);
    },
    onSuccess: (newLead) => {
      const currentLeads =
        (queryClient.getQueryData([`leads-tenant-${tenant?.id}`]) as Lead[]) ||
        [];
      const updatedLeads = [...currentLeads, newLead];
      queryClient.setQueryData([`leads-tenant-${tenant?.id}`], updatedLeads);
      queryClient.invalidateQueries({
        queryKey: [`leads-tenant-${tenant?.id}`],
      });

      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      setLocation("/leads");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createLeadMutation.mutate(data);
  };

  const onCancel = () => {
    setLocation("/leads");
  };

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
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Lead</h1>
            <div className="w-20"></div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <FlexibleLeadForm
              tenantId={String(tenant?.id!)}
              userId={String(user?.id!)}
              onSubmit={onSubmit}
              onCancel={onCancel}
              isLoading={createLeadMutation.isPending}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

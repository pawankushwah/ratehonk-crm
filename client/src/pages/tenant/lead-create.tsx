import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, HelpCircle, Bell } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { FlexibleLeadForm } from "@/components/lead/flexible-lead-form";
import { directLeadsApi } from "@/lib/direct-leads-api";
import type { Lead } from "@/lib/types";
import { Link } from "wouter";

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
      <div className="w-full  mt-[12px] rounded-[15px]">
        
        <div
          className="w-full h-[72px] bg-white px-[18px] py-[16px] 
                    border-b border-[#E3E8EF] rounded-[16px] flex items-center justify-between"
        >
          <h1 className="text-[18px] font-semibold">Lead Management</h1>

          <div className="flex gap-3 ml-auto">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
              <Link href="/dynamic-fields">
                <Settings className="h-5 w-5 text-gray-600" />
              </Link>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
              <Link href="/support">
                <HelpCircle className="h-5 w-5 text-gray-600" />
              </Link>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
              <Bell className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>

       
        <div className="w-full bg-[#F5F6FA] px-[18px] py-[14px] border-b border-gray-200 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <i className="ri-folder-line text-gray-600"></i>
            <span>Lead Management</span>
            <span className="text-gray-400">›</span>
          </div>

          <div className="px-3 py-[6px] bg-white border border-gray-300 rounded-md shadow-sm flex items-center gap-2">
            <i className="ri-file-add-line text-gray-600"></i>
            Create Lead
          </div>
        </div>

        
        <div
          className="w-[1027px] h-[1084px] mx-auto mt-[25px] 
                    bg-white rounded-[16px] shadow-sm border border-gray-200
                    p-[20px] space-y-[12px]"
        >
          <FlexibleLeadForm
            tenantId={String(tenant?.id!)}
            userId={String(user?.id!)}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isLoading={createLeadMutation.isPending}
          />
        </div>
      </div>
    </Layout>
  );
}

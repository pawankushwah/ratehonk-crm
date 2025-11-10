import { Layout } from "@/components/layout/layout";
import LeadTypeManagement from "@/components/admin/lead-type-management";

export default function LeadTypes() {
  return (
    <Layout>
      <div className="p-8">
        <LeadTypeManagement />
      </div>
    </Layout>
  );
}

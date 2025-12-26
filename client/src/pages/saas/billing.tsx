import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";

export default function SaasBilling() {
  const { user } = useSaasAuth();

  if (user?.role !== "saas_owner") {
    return (
      <SaasLayout>
        <div className="p-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">This page is only accessible to SaaS owners.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SaasLayout>
    );
  }

  return (
    <SaasLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Billing Management</h1>
          <p className="text-muted-foreground mt-2">Manage billing and payment history</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Billing Overview</CardTitle>
            <CardDescription>Payment history and billing information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Billing management features coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </SaasLayout>
  );
}


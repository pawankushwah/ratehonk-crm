import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";

export default function SaasSettings() {
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
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage SaaS platform settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>Configure platform-wide settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Settings features coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </SaasLayout>
  );
}


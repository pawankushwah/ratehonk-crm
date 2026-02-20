import { useQuery } from "@tanstack/react-query";
import { PartnerLayout } from "@/components/layout/partner-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CreditCard, Users, Loader2 } from "lucide-react";
import { partnerApiRequest } from "@/lib/partner-queryClient";
import { format } from "date-fns";
import { Link } from "wouter";

export default function PartnerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/partner/dashboard"],
    queryFn: async () => {
      const res = await partnerApiRequest("GET", "/api/partner/dashboard", {});
      return res.json();
    },
  });

  const metrics = data?.metrics || { totalTenants: 0, activeTenants: 0, totalSubscriptions: 0 };
  const recentTenants = data?.recentTenants || [];

  return (
    <PartnerLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Partner Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of your tenants and subscriptions</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalTenants}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.activeTenants}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalSubscriptions}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Tenants</CardTitle>
                <CardDescription>Your most recently created tenants</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTenants.length > 0 ? (
                  <div className="space-y-4">
                    {recentTenants.map((t: any) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{t.company_name || t.companyName}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.contact_email || t.contactEmail}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {t.created_at || t.createdAt
                            ? format(new Date(t.created_at || t.createdAt), "MMM dd, yyyy")
                            : "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No tenants yet</p>
                )}
                <Link href="/partner/tenants">
                  <span className="text-emerald-600 hover:underline text-sm font-medium mt-4 inline-block">
                    View all tenants →
                  </span>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PartnerLayout>
  );
}

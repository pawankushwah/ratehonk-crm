import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PartnerLayout } from "@/components/layout/partner-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2 } from "lucide-react";
import { partnerApiRequest } from "@/lib/partner-queryClient";

export default function PartnerPlans() {
  const { data: plansData, isLoading } = useQuery({
    queryKey: ["/api/partner/plans"],
    queryFn: async () => {
      const res = await partnerApiRequest("GET", "/api/partner/plans", {});
      return res.json();
    },
  });

  const plans = Array.isArray(plansData) ? plansData : plansData?.plans || [];
  const partnerPlans = plans.filter((p: any) => p.partner_id);

  return (
    <PartnerLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Plans</h1>
            <p className="text-muted-foreground mt-2">Create and manage your own subscription plans</p>
          </div>
          <Link href="/partner/plans/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Monthly</TableHead>
                    <TableHead>Yearly</TableHead>
                    <TableHead>Country</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerPlans.length > 0 ? (
                    partnerPlans.map((plan: any) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>{plan.monthly_price ?? plan.monthlyPrice ?? "-"}</TableCell>
                        <TableCell>{plan.yearly_price ?? plan.yearlyPrice ?? "-"}</TableCell>
                        <TableCell>{plan.country || "US"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No plans yet. Create your first plan to assign to tenants.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}

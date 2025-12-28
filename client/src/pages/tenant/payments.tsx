import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { format } from "date-fns";
import { CreditCard, Search, Eye } from "lucide-react";
import { Link } from "wouter";

export default function PaymentsPage() {
  const { tenant } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: [`/api/tenants/${tenant?.id}/payment-forms-sent`],
    queryFn: async () => {
      if (!tenant?.id) return { success: true, forms: [] };
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(
        `/api/tenants/${tenant.id}/payment-forms-sent`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) return { success: true, forms: [] };
      return await response.json();
    },
    enabled: !!tenant?.id,
  });

  const forms = paymentsData?.forms || [];
  
  const filteredForms = forms.filter((form: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      form.customerName?.toLowerCase().includes(query) ||
      form.customerEmail?.toLowerCase().includes(query) ||
      form.customerPhone?.toLowerCase().includes(query)
    );
  });


  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground mt-1">
              View all payment records and transactions
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payment Forms Sent</p>
                <p className="text-2xl font-bold">{filteredForms.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice, customer name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Forms List */}
        <Card>
          <CardHeader>
            <CardTitle>All Payment Forms Sent ({filteredForms.length})</CardTitle>
            <CardDescription>
              List of all payment forms sent to customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payment forms sent</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredForms.map((form: any) => (
                  <div
                    key={form.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">
                            {form.customerName || "Unknown Customer"}
                          </h3>
                          <Badge variant="default">Payment Form</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {form.customerEmail || form.customerPhone || "No contact info"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sent on {format(new Date(form.sentAt || form.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/customers/${form.customerId}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Customer
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


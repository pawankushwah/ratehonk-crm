import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { SaasLayout } from "@/components/layout/saas-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Loader2 } from "lucide-react";
import { useSaasAuth } from "@/components/auth/saas-auth-provider";
import { saasApiRequest } from "@/lib/saas-queryClient";

// Helper function to get country name from country code
const getCountryName = (countryCode: string): string => {
  const countryNames: Record<string, string> = {
    'US': 'United States',
    'IN': 'India',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'JP': 'Japan',
    'CN': 'China',
    'KR': 'South Korea',
    'SG': 'Singapore',
    'AE': 'UAE',
    'SA': 'Saudi Arabia',
  };
  return countryNames[countryCode] || countryCode;
};

export default function SaasPlans() {
  const { user } = useSaasAuth();
  const [, setLocation] = useLocation();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Fetch subscription plans grouped by country
  const { data: plansByCountry, isLoading, refetch } = useQuery({
    queryKey: ["/api/saas/plans"],
    queryFn: async () => {
      const response = await saasApiRequest("GET", "/api/subscription/plans", {});
      return response.json();
    },
  });

  // Extract countries from grouped response
  const countries = useMemo(() => {
    if (Array.isArray(plansByCountry) && plansByCountry.length > 0) {
      // Check if it's the new grouped structure
      if (plansByCountry[0]?.country && plansByCountry[0]?.plans) {
        return plansByCountry.map((group: any) => group.country).filter(Boolean).sort();
      }
      // Old flat structure - extract unique countries
      const uniqueCountries = Array.from(new Set(
        plansByCountry.map((plan: any) => plan.country || 'US')
      )).sort();
      return uniqueCountries;
    }
    return [];
  }, [plansByCountry]);

  // Flatten plans from all countries or filter by selected country
  const plans = useMemo(() => {
    if (!Array.isArray(plansByCountry) || plansByCountry.length === 0) {
      return [];
    }

    // Check if it's the new grouped structure
    if (plansByCountry[0]?.country && plansByCountry[0]?.plans) {
      // New grouped structure
      let allPlans: any[] = [];
      
      plansByCountry.forEach((group: any) => {
        if (!selectedCountry || group.country === selectedCountry) {
          if (Array.isArray(group.plans)) {
            allPlans = allPlans.concat(group.plans.map((plan: any) => ({
              ...plan,
              country: plan.country || group.country || 'US',
              currency: plan.currency || group.currency || 'USD',
            })));
          }
        }
      });
      
      return allPlans;
    } else {
      // Old flat structure - filter by country if selected
      if (selectedCountry) {
        return plansByCountry.filter((plan: any) => 
          (plan.country || 'US') === selectedCountry
        );
      }
      return plansByCountry;
    }
  }, [plansByCountry, selectedCountry]);


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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Subscription Plans</h1>
            <p className="text-muted-foreground mt-2">Manage subscription plans for tenants</p>
          </div>
          <Button onClick={() => setLocation("/saas/plans/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>

        {/* Country Filter Tabs */}
        {countries.length > 1 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCountry === null ? 'default' : 'outline'}
                onClick={() => setSelectedCountry(null)}
                size="sm"
              >
                All Countries
              </Button>
              {countries.map((country) => (
                <Button
                  key={country}
                  variant={selectedCountry === country ? 'default' : 'outline'}
                  onClick={() => setSelectedCountry(country)}
                  size="sm"
                >
                  {getCountryName(country)} ({country})
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-3 text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : plans && plans.length > 0 ? (
            plans.map((plan: any) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <Badge variant={plan.isActive || plan.is_active ? "default" : "secondary"}>
                      {plan.isActive || plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Country:</span>
                      <span className="font-medium">{plan.country || 'US'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Currency:</span>
                      <span className="font-medium">{plan.currency || 'USD'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Monthly:</span>
                      <span className="font-bold">{plan.currency || 'USD'} {plan.monthly_price || plan.monthlyPrice || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Yearly:</span>
                      <span className="font-bold">{plan.currency || 'USD'} {plan.yearly_price || plan.yearlyPrice || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Max Users:</span>
                      <span className="font-medium">{plan.maxUsers || plan.max_users === -1 ? "Unlimited" : plan.maxUsers || plan.max_users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Max Customers:</span>
                      <span className="font-medium">{plan.maxCustomers || plan.max_customers === -1 ? "Unlimited" : plan.maxCustomers || plan.max_customers}</span>
                    </div>
                    {(plan.isFreePlan || plan.is_free_plan) && (
                      <Badge variant="secondary" className="w-full justify-center">Free Trial Plan</Badge>
                    )}
                    {(plan.freeTrialDays || plan.free_trial_days) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Free Trial:</span>
                        <span className="font-medium">{plan.freeTrialDays || plan.free_trial_days} days</span>
                      </div>
                    )}
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setLocation(`/saas/plans/${plan.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              No plans found
            </div>
          )}
        </div>
      </div>
    </SaasLayout>
  );
}


import { useLocation } from "wouter";
import { useSubscriptionFeatures } from "@/lib/subscription-check";
import { PAGE_ROUTES } from "@/lib/menu-items";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock } from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPage?: string; // Page route like '/dashboard', '/customers', etc.
  requiredMenuItem?: string; // Menu item ID like 'dashboard', 'customers', etc.
}

export function SubscriptionGuard({ 
  children, 
  requiredPage, 
  requiredMenuItem 
}: SubscriptionGuardProps) {
  const [location, setLocation] = useLocation();
  const { features, isLoading, hasAccess, hasPageAccess, subscriptionQueryCompleted } = useSubscriptionFeatures();

  // Determine which check to use
  const checkAccess = () => {
    // Always allow while loading - this prevents showing access restricted during initial load
    if (isLoading) return true; 
    
    // Check if we're a SaaS owner (query would be disabled, so always allow)
    const isSaasOwner = typeof window !== 'undefined' && 
      (localStorage.getItem('saas_auth_token') || window.location.pathname.startsWith('/saas/'));
    
    if (isSaasOwner) return true;
    
    // Only check access if the subscription query has completed
    // This prevents showing access restricted before the query has finished
    if (!subscriptionQueryCompleted) return true;
    
    // Only deny access if we're certain the data has loaded and there's no subscription
    // If features is null after loading completes, it means no subscription exists
    if (!features) {
      // No subscription at all
      return false;
    }

    // Check if subscription is active or on valid trial
    if (!features.isActive && !features.isTrial) {
      return false;
    }

    // Check if free trial expired
    if (features.isFreePlan && features.isTrial && features.trialDaysLeft <= 0) {
      return false;
    }

    // Check specific page/menu access
    if (requiredPage) {
      return hasPageAccess(requiredPage);
    }
    
    if (requiredMenuItem) {
      return hasAccess(requiredMenuItem);
    }

    // If no specific requirement, just check if subscription is valid
    return features.isActive || features.isTrial;
  };

  const hasAccessToFeature = checkAccess();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (!hasAccessToFeature) {
    const pageName = requiredPage 
      ? PAGE_ROUTES[requiredPage.replace('/', '')] || requiredPage
      : requiredMenuItem || 'this page';

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" />
              <CardTitle>Access Restricted</CardTitle>
            </div>
            <CardDescription>
              {features?.isFreePlan && features?.trialDaysLeft <= 0
                ? "Your free trial has expired. Please upgrade to continue using this feature."
                : features && !features.isActive && !features.isTrial
                ? "Your subscription is not active. Please renew your subscription to access this feature."
                : `This feature is not included in your current subscription plan. Please upgrade to access ${pageName}.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {features?.isTrial && features.trialDaysLeft > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>{features.trialDaysLeft} days left in your trial</span>
                </div>
              </div>
            )}
            <Button 
              onClick={() => setLocation('/subscription')}
              className="w-full"
            >
              View Subscription Plans
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}


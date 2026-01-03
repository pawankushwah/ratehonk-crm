// Subscription checking utilities for tenant panel
import { useQuery } from "@tanstack/react-query";
import { SubscriptionAPIClient } from "./subscription-api";
import { useAuth } from "@/components/auth/auth-provider";

export interface SubscriptionFeatures {
  allowedMenuItems: string[];
  allowedPages: string[];
  isActive: boolean;
  isTrial: boolean;
  trialDaysLeft: number;
  isFreePlan: boolean;
  hasUsedFreeTrial: boolean;
}

/**
 * Hook to check if a menu item is allowed by the current subscription
 * Only works for tenant users, not SaaS owners
 */
export function useSubscriptionFeatures(): {
  features: SubscriptionFeatures | null;
  isLoading: boolean;
  hasAccess: (menuItem: string) => boolean;
  hasPageAccess: (pageRoute: string) => boolean;
  subscriptionQueryCompleted: boolean;
} {
  // Check if user is SaaS owner - if so, skip subscription checks
  // Check localStorage for SaaS auth token or if we're in SaaS admin area
  const isSaasOwner = typeof window !== 'undefined' && 
    (localStorage.getItem('saas_auth_token') || window.location.pathname.startsWith('/saas/'));
  
  const { data: currentSubscription, isLoading: isLoadingSubscription, isFetching: isFetchingSubscription, isFetched: isFetchedSubscription } = useQuery({
    queryKey: ['/api/subscription/current'],
    queryFn: () => SubscriptionAPIClient.getCurrentSubscription(),
    enabled: !isSaasOwner, // Don't fetch if SaaS owner
  });

  const { data: planDetails, isLoading: isLoadingPlan, isFetching: isFetchingPlan, isFetched: isFetchedPlan } = useQuery({
    queryKey: ['/api/subscription/plan', currentSubscription?.subscription?.planId],
    queryFn: async () => {
      if (!currentSubscription?.subscription?.planId) return null;
      try {
        const response = await fetch(`/api/subscription/plans`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (!response.ok) return null;
        const plansData = await response.json();
        
        // Handle grouped structure (by country)
        if (Array.isArray(plansData) && plansData.length > 0) {
          // Check if it's the new grouped structure
          if (plansData[0]?.country && plansData[0]?.plans) {
            // Flatten and find the plan
            for (const countryGroup of plansData) {
              if (countryGroup.plans && Array.isArray(countryGroup.plans)) {
                const plan = countryGroup.plans.find((p: any) => p.id === currentSubscription.subscription.planId);
                if (plan) return plan;
              }
            }
            return null;
          } else {
            // Old flat structure
            return plansData.find((p: any) => p.id === currentSubscription.subscription.planId) || null;
          }
        }
        return null;
      } catch (error) {
        console.error('Error fetching plan details:', error);
        return null;
      }
    },
    enabled: !!currentSubscription?.subscription?.planId && !isSaasOwner,
  });

  // Combine loading states - we're loading if either query is loading or fetching
  // For SaaS owners, queries are disabled so we're never loading
  // We need to check if we need to wait for plan details (if subscription exists but plan details haven't loaded)
  const needsPlanDetails = currentSubscription?.subscription?.planId && !isSaasOwner;
  const isLoading = isSaasOwner ? false : (
    isLoadingSubscription || 
    isFetchingSubscription || 
    (needsPlanDetails && (isLoadingPlan || isFetchingPlan))
  );
  
  // Track if subscription query has completed (for determining if we should show access restricted)
  const subscriptionQueryCompleted = isSaasOwner || isFetchedSubscription;

  const features: SubscriptionFeatures | null = currentSubscription?.subscription ? {
    allowedMenuItems: planDetails?.allowedMenuItems || planDetails?.allowed_menu_items || planDetails?.features || [],
    allowedPages: planDetails?.allowedPages || planDetails?.allowed_pages || planDetails?.features || [],
    isActive: currentSubscription.subscription.status === 'active',
    isTrial: currentSubscription.onTrial || currentSubscription.subscription.status === 'trial',
    trialDaysLeft: currentSubscription.trialDaysLeft || 0,
    isFreePlan: planDetails?.isFreePlan || planDetails?.is_free_plan || false,
    hasUsedFreeTrial: false, // TODO: Fetch from API
  } : null;

  const hasAccess = (menuItem: string): boolean => {
    if (!features) return false;
    // If subscription is not active and not on trial, deny access
    if (!features.isActive && !features.isTrial) return false;
    // If on free trial plan and trial expired, deny access
    if (features.isFreePlan && features.isTrial && features.trialDaysLeft <= 0) return false;
    // Check if menu item is in allowed list
    return features.allowedMenuItems.includes(menuItem);
  };

  const hasPageAccess = (pageRoute: string): boolean => {
    if (!features) return false;
    // If subscription is not active and not on trial, deny access
    if (!features.isActive && !features.isTrial) return false;
    // If on free trial plan and trial expired, deny access
    if (features.isFreePlan && features.isTrial && features.trialDaysLeft <= 0) return false;
    // Check if page route is in allowed list
    return features.allowedPages.includes(pageRoute) || features.allowedPages.includes(pageRoute.replace('/', ''));
  };

  return {
    features,
    isLoading,
    hasAccess,
    hasPageAccess,
    subscriptionQueryCompleted, // Export this to help SubscriptionGuard know when to check access
  };
}

/**
 * Check if subscription allows access to a menu item (synchronous check)
 */
export function checkMenuAccess(allowedMenuItems: string[], menuItem: string): boolean {
  return allowedMenuItems.includes(menuItem);
}

/**
 * Check if subscription allows access to a page route (synchronous check)
 */
export function checkPageAccess(allowedPages: string[], pageRoute: string): boolean {
  return allowedPages.includes(pageRoute) || allowedPages.includes(pageRoute.replace('/', ''));
}


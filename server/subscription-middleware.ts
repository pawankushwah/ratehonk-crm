import { sql } from "./db.js";
import { simpleStorage } from "./simple-storage.js";

/**
 * Middleware to check if tenant has access to a specific page/feature based on subscription
 * This should be used after authenticateToken middleware
 */
export async function checkSubscriptionAccess(
  req: any,
  res: any,
  next: any,
  requiredPageRoute?: string
) {
  try {
    // SaaS owners bypass subscription checks
    if (req.user?.role === "saas_owner") {
      return next();
    }

    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ 
        message: "Access denied - no tenant associated",
        code: "NO_TENANT"
      });
    }

    // Get current subscription
    const subscription = await simpleStorage.getTenantSubscription(tenantId);
    
    if (!subscription) {
      return res.status(403).json({
        message: "No active subscription found. Please subscribe to continue.",
        code: "NO_SUBSCRIPTION",
        redirectTo: "/subscription"
      });
    }

    // Check if subscription is active or on trial
    const isActive = subscription.status === "active";
    const isTrial = subscription.status === "trial" || subscription.status === "free_trial";
    const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
    const isTrialExpired = trialEndsAt && trialEndsAt < new Date();

    // If not active and trial expired, deny access
    if (!isActive && (!isTrial || isTrialExpired)) {
      // Check if it's a free plan
      const [plan] = await sql`
        SELECT is_free_plan FROM subscription_plans WHERE id = ${subscription.plan_id}
      `;

      if (plan?.is_free_plan) {
        // Check if tenant has used free trial
        const [trialUsage] = await sql`
          SELECT has_used_free_trial FROM tenant_free_trial_usage WHERE tenant_id = ${tenantId}
        `;

        if (trialUsage?.has_used_free_trial) {
          return res.status(403).json({
            message: "Your free trial has expired. Please upgrade to continue using this feature.",
            code: "TRIAL_EXPIRED",
            redirectTo: "/subscription"
          });
        }
      } else {
        return res.status(403).json({
          message: "Your subscription is not active. Please renew your subscription.",
          code: "SUBSCRIPTION_INACTIVE",
          redirectTo: "/subscription"
        });
      }
    }

    // If specific page route is required, check if it's allowed
    if (requiredPageRoute) {
      const [plan] = await sql`
        SELECT allowed_pages, allowed_menu_items FROM subscription_plans WHERE id = ${subscription.plan_id}
      `;

      if (plan) {
        const allowedPages = plan.allowed_pages || [];
        const allowedMenuItems = plan.allowed_menu_items || [];
        
        // Normalize the route (remove leading slash for comparison)
        const normalizedRoute = requiredPageRoute.startsWith('/') 
          ? requiredPageRoute.substring(1) 
          : requiredPageRoute;
        
        const routeMatch = allowedPages.includes(requiredPageRoute) || 
                          allowedPages.includes(`/${normalizedRoute}`) ||
                          allowedPages.includes(normalizedRoute);

        // Also check menu items (some routes might be mapped to menu items)
        const menuItemMatch = allowedMenuItems.includes(normalizedRoute);

        if (!routeMatch && !menuItemMatch && allowedPages.length > 0) {
          return res.status(403).json({
            message: "This feature is not included in your subscription plan. Please upgrade to access this feature.",
            code: "FEATURE_NOT_INCLUDED",
            redirectTo: "/subscription"
          });
        }
      }
    }

    // Attach subscription info to request for use in route handlers
    req.subscription = subscription;
    req.subscriptionStatus = {
      isActive,
      isTrial,
      isTrialExpired,
      trialDaysLeft: trialEndsAt 
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0
    };

    next();
  } catch (error: any) {
    console.error("Subscription check error:", error);
    // On error, allow access but log the issue (fail open for now)
    // In production, you might want to fail closed
    console.warn("⚠️ Subscription check failed, allowing access:", error.message);
    next();
  }
}

/**
 * Middleware factory to check subscription for specific page routes
 */
export function requirePageAccess(pageRoute: string) {
  return (req: any, res: any, next: any) => {
    checkSubscriptionAccess(req, res, next, pageRoute);
  };
}

/**
 * Middleware to check subscription status (without specific page check)
 */
export function requireActiveSubscription(req: any, res: any, next: any) {
  checkSubscriptionAccess(req, res, next);
}


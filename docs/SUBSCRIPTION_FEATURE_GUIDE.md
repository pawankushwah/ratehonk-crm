# Subscription Feature Management Guide

## Overview

This system implements country-based subscription plans with feature-level access control. Tenants can only access menu items and pages that are included in their subscription plan.

## Key Features

1. **Country-wise Plans**: Each subscription plan is associated with a country and currency
2. **Feature-based Access**: Plans define which menu items and pages are accessible
3. **Free Trial Support**: Plans can have free trial days, and free plans can be auto-assigned during registration
4. **One-time Free Trial**: Free plans can only be used once per tenant
5. **Menu Visibility**: Sidebar automatically hides menu items not included in subscription
6. **Page Protection**: Pages check subscription before rendering

## Database Schema

### New Columns in `subscription_plans`:
- `country` (TEXT): Country code (e.g., 'US', 'IN', 'GB')
- `currency` (TEXT): Currency code (e.g., 'USD', 'INR', 'GBP')
- `allowed_menu_items` (JSONB): Array of menu item IDs allowed
- `allowed_pages` (JSONB): Array of page routes allowed
- `free_trial_days` (INTEGER): Number of free trial days (0 = no trial)
- `is_free_plan` (BOOLEAN): True if this is a free trial plan (one-time use)

### New Table: `tenant_free_trial_usage`
Tracks which tenants have used their free trial to prevent reuse.

## Frontend Implementation

### 1. Using SubscriptionGuard Component

Wrap any tenant page component with `SubscriptionGuard` to protect it:

```tsx
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";

export default function MyPage() {
  return (
    <SubscriptionGuard requiredMenuItem="customers">
      <Layout>
        {/* Your page content */}
      </Layout>
    </SubscriptionGuard>
  );
}
```

**Props:**
- `requiredMenuItem` (string): Menu item ID (e.g., 'customers', 'leads', 'dashboard')
- `requiredPage` (string): Page route (e.g., '/customers', '/leads')
- `children` (ReactNode): Page content to protect

### 2. Using Subscription Hook

Check subscription features programmatically:

```tsx
import { useSubscriptionFeatures } from "@/lib/subscription-check";

function MyComponent() {
  const { hasAccess, hasPageAccess, features, isLoading } = useSubscriptionFeatures();
  
  if (isLoading) return <Loading />;
  
  if (!hasAccess('customers')) {
    return <UpgradePrompt />;
  }
  
  return <CustomerList />;
}
```

### 3. Sidebar Integration

The sidebar automatically filters menu items based on subscription. No additional code needed - it uses `useSubscriptionFeatures()` internally.

## Backend Implementation

### 1. Using Subscription Middleware

Add subscription checks to API routes:

```typescript
import { requireActiveSubscription, requirePageAccess } from "./subscription-middleware";

// Check if tenant has active subscription
app.get("/api/tenants/:tenantId/customers", 
  authenticateToken, 
  requireActiveSubscription,
  async (req, res) => {
    // Route handler
  }
);

// Check if tenant has access to specific page
app.get("/api/tenants/:tenantId/customers", 
  authenticateToken, 
  requirePageAccess('/customers'),
  async (req, res) => {
    // Route handler
  }
);
```

### 2. Middleware Functions

- `requireActiveSubscription`: Checks if tenant has active subscription or valid trial
- `requirePageAccess(pageRoute)`: Checks if tenant's plan includes the specified page
- `checkSubscriptionAccess`: Low-level function for custom checks

## SaaS Owner: Creating Plans

1. Navigate to `/saas/plans`
2. Click "Add Plan"
3. Fill in:
   - Plan name and description
   - **Country**: Select country for this plan
   - **Currency**: Auto-filled based on country (can be edited)
   - Monthly and yearly prices
   - Max users and customers
   - **Free Trial Days**: Number of trial days (0 = no trial)
   - **Is Free Plan**: Check if this is a one-time free trial plan
   - **Allowed Menu Items**: Select which menu items/pages are included
4. Save

## Tenant Registration

When a tenant registers:
1. System automatically looks for a free plan (`is_free_plan = true`)
2. Checks if tenant has already used free trial
3. If not used, assigns free plan with trial period
4. Marks free trial as used in `tenant_free_trial_usage` table

## Menu Items Reference

Available menu items (from `client/src/lib/menu-items.ts`):
- `dashboard`
- `customers`
- `shortcuts`
- `tasks`
- `leads`
- `lead-types`
- `lead-sync`
- `social-integrations`
- `lead-analytics`
- `calendar`
- `bookings`
- `packages`
- `invoices`
- `estimates`
- `vendors`
- `expenses`
- `booking-recommendations`
- `email-campaigns`
- `email-automations`
- `email-ab-tests`
- `email-segments`
- `email-settings`
- `email-test`
- `gmail-emails`
- `hotels`
- `hotels-list`
- `automation-workflows`
- `reports`
- `users`
- `roles`
- `dynamic-fields`
- `menu-ordering`
- `settings`
- `subscription`
- `support`

## Adding Subscription Protection to New Pages

1. **Frontend**: Wrap page component with `SubscriptionGuard`
   ```tsx
   <SubscriptionGuard requiredMenuItem="your-menu-item">
     <Layout>...</Layout>
   </SubscriptionGuard>
   ```

2. **Backend**: Add middleware to API routes
   ```typescript
   app.get("/api/your-route", 
     authenticateToken, 
     requirePageAccess('/your-page'),
     handler
   );
   ```

## Testing

1. **Create a free plan** with limited menu items
2. **Register a new tenant** - should auto-assign free plan
3. **Login as tenant** - verify only allowed menus show
4. **Try accessing restricted pages** - should show upgrade prompt
5. **Upgrade to paid plan** - verify all features become available

## Migration

Run the migration file:
```sql
-- migrations/add_subscription_plan_country_features.sql
```

This adds new columns and creates the free trial tracking table.

## Notes

- User-based permissions (roles) still work alongside subscription checks
- Subscription checks happen first, then role-based permissions
- SaaS owners bypass all subscription checks
- Free trial plans can only be used once per tenant
- After free trial expires, tenant must upgrade to continue


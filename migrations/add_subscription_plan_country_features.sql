-- Migration: Add country, currency, and feature permissions to subscription plans
-- Also add free trial tracking table

-- Add new columns to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'US',
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS allowed_menu_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allowed_pages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS free_trial_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_free_plan BOOLEAN NOT NULL DEFAULT false;

-- Create index for country lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_country ON subscription_plans(country);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_free_plan ON subscription_plans(is_free_plan);

-- Create tenant_free_trial_usage table to track free trial usage
CREATE TABLE IF NOT EXISTS tenant_free_trial_usage (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  has_used_free_trial BOOLEAN NOT NULL DEFAULT false,
  free_trial_plan_id INTEGER REFERENCES subscription_plans(id),
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_tenant_free_trial_usage_tenant_id ON tenant_free_trial_usage(tenant_id);

-- Update existing plans to have default menu items (all menu items)
-- This ensures backward compatibility - existing plans will have access to all features
UPDATE subscription_plans 
SET allowed_menu_items = features::jsonb,
    allowed_pages = features::jsonb
WHERE allowed_menu_items = '[]'::jsonb OR allowed_menu_items IS NULL;

-- Add comment to explain the new columns
COMMENT ON COLUMN subscription_plans.country IS 'Country code (e.g., US, IN, UK) for country-specific pricing';
COMMENT ON COLUMN subscription_plans.currency IS 'Currency code (e.g., USD, INR, GBP)';
COMMENT ON COLUMN subscription_plans.allowed_menu_items IS 'Array of menu item IDs that this plan allows access to';
COMMENT ON COLUMN subscription_plans.allowed_pages IS 'Array of page routes that this plan allows access to';
COMMENT ON COLUMN subscription_plans.free_trial_days IS 'Number of free trial days (0 = no trial)';
COMMENT ON COLUMN subscription_plans.is_free_plan IS 'True if this is a free trial plan that can only be used once per tenant';


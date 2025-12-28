-- Migration: Add dashboard widgets and page permissions to subscription_plans
-- This migration adds support for granular dashboard widget and page permission control

DO $$ 
BEGIN
  -- Add allowed_dashboard_widgets column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'allowed_dashboard_widgets'
  ) THEN
    ALTER TABLE subscription_plans 
    ADD COLUMN allowed_dashboard_widgets JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  -- Add allowed_page_permissions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'allowed_page_permissions'
  ) THEN
    ALTER TABLE subscription_plans 
    ADD COLUMN allowed_page_permissions JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;


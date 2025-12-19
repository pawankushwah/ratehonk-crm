-- Create dashboard_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS dashboard_preferences (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  component_key TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  custom_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add user_id column to dashboard_preferences table for user-specific preferences
-- This allows users to customize their dashboard visibility independently
-- while still respecting role-based permissions

-- Add user_id column (nullable - NULL means tenant-level preference, user ID means user-specific)
ALTER TABLE dashboard_preferences 
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Add index for faster queries on user-specific preferences
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_user_id 
ON dashboard_preferences(tenant_id, user_id, component_key);

-- Add comment to explain the column
COMMENT ON COLUMN dashboard_preferences.user_id IS 'NULL for tenant-level preferences, user ID for user-specific preferences';

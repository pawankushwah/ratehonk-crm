-- Migration: Add timezone and date_format columns to tenant_settings table
-- Date: 2025-01-XX
-- Description: Adds timezone and date_format columns to store tenant preferences

-- Add timezone column to tenant_settings table
ALTER TABLE tenant_settings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add date_format column to tenant_settings table
ALTER TABLE tenant_settings 
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'MM/DD/YYYY';

-- Update existing tenant_settings to set default values if null
UPDATE tenant_settings
SET timezone = 'UTC'
WHERE timezone IS NULL;

UPDATE tenant_settings
SET date_format = 'MM/DD/YYYY'
WHERE date_format IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN tenant_settings.timezone IS 'Timezone for the tenant (e.g., UTC, America/New_York, Asia/Kolkata)';
COMMENT ON COLUMN tenant_settings.date_format IS 'Date format preference for the tenant (e.g., MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)';


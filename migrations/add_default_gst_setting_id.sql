-- Migration: Add default_gst_setting_id column to tenant_settings table
-- Date: 2025-01-XX
-- Description: Adds a column to store the default GST/tax setting ID for invoices

-- Add column to tenant_settings table
ALTER TABLE tenant_settings 
ADD COLUMN IF NOT EXISTS default_gst_setting_id INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN tenant_settings.default_gst_setting_id IS 'Default GST/tax setting ID to use when creating invoices';

-- Optional: Add foreign key constraint if gst_settings table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gst_settings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_tenant_settings_default_gst_setting_id'
      AND table_name = 'tenant_settings'
    ) THEN
      ALTER TABLE tenant_settings
      ADD CONSTRAINT fk_tenant_settings_default_gst_setting_id
      FOREIGN KEY (default_gst_setting_id) REFERENCES gst_settings(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;


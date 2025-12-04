-- Migration script to add invoice_number_prefix column to tenant_settings table
-- Note: This column was already added in the schema, but if it doesn't exist, run this:

-- Add invoice_number_prefix column to tenant_settings table if it doesn't exist
ALTER TABLE tenant_settings 
ADD COLUMN IF NOT EXISTS invoice_number_prefix TEXT DEFAULT 'INV';

-- Update existing tenant_settings to set default prefix if null
UPDATE tenant_settings
SET invoice_number_prefix = 'INV'
WHERE invoice_number_prefix IS NULL;

-- Verify the column exists
SELECT 
  tenant_id,
  invoice_number_start,
  invoice_number_prefix,
  default_currency
FROM tenant_settings
LIMIT 10;


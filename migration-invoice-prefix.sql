-- Migration script to add invoice_prefix column to invoices table
-- and invoice_number_prefix column to tenant_settings table

-- Step 1: Add invoice_prefix column to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV';

-- Step 2: Update existing invoices to extract prefix from invoice_number
-- This will split "INV-001" into prefix="INV" and number="001"
UPDATE invoices
SET 
  invoice_prefix = CASE 
    -- Pattern: PREFIX-NUMBER (e.g., INV-001, BILL-123)
    WHEN invoice_number ~ '^[A-Za-z0-9]+[\s-]+.+$' THEN 
      UPPER(SUBSTRING(invoice_number FROM '^([A-Za-z0-9]+)[\s-]+'))
    -- Pattern: PREFIXNUMBER (e.g., INV001, BILL123)
    WHEN invoice_number ~ '^[A-Za-z]+[0-9]' THEN 
      UPPER(SUBSTRING(invoice_number FROM '^([A-Za-z]+)'))
    -- If it's all numbers, use default prefix
    WHEN invoice_number ~ '^[0-9]+$' THEN 'INV'
    -- Default fallback
    ELSE 'INV'
  END,
  invoice_number = CASE 
    -- Pattern: PREFIX-NUMBER (e.g., INV-001, BILL-123)
    WHEN invoice_number ~ '^[A-Za-z0-9]+[\s-]+.+$' THEN 
      SUBSTRING(invoice_number FROM '^[A-Za-z0-9]+[\s-]+(.+)$')
    -- Pattern: PREFIXNUMBER (e.g., INV001, BILL123)
    WHEN invoice_number ~ '^[A-Za-z]+[0-9]' THEN 
      SUBSTRING(invoice_number FROM '^[A-Za-z]+(.+)$')
    -- If it's all numbers, keep as is
    WHEN invoice_number ~ '^[0-9]+$' THEN invoice_number
    -- Default fallback
    ELSE invoice_number
  END
WHERE invoice_prefix IS NULL OR invoice_prefix = 'INV';

-- Step 3: Verify the migration
SELECT 
  id, 
  invoice_prefix, 
  invoice_number,
  invoice_prefix || '-' || invoice_number as full_invoice_number
FROM invoices 
LIMIT 10;


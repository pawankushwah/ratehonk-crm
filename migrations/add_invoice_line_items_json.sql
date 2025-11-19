-- Add line_items JSON column to invoices table for storing complete line item data

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS line_items JSONB;

COMMENT ON COLUMN invoices.line_items IS 'Complete line items data stored as JSON, including purchasePrice, invoiceNumber, voucherNumber, travelCategory, vendor, serviceProviderId, taxRateId, etc.';


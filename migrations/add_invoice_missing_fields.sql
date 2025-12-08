-- Add missing columns to invoices table for complete invoice data storage

-- Add currency column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';

-- Add payment method column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add payment terms column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS payment_terms TEXT;

-- Add paid amount column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Add discount amount column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Add is tax inclusive column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS is_tax_inclusive BOOLEAN DEFAULT FALSE;

-- Add additional notes column
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Add comments
COMMENT ON COLUMN invoices.currency IS 'Currency code for the invoice (USD, INR, EUR, etc.)';
COMMENT ON COLUMN invoices.payment_method IS 'Payment method used (credit_card, bank_transfer, cash, etc.)';
COMMENT ON COLUMN invoices.payment_terms IS 'Payment terms (e.g., "Net 30", "30 days", etc.)';
COMMENT ON COLUMN invoices.paid_amount IS 'Amount already paid towards this invoice';
COMMENT ON COLUMN invoices.discount_amount IS 'Discount amount applied to the invoice';
COMMENT ON COLUMN invoices.is_tax_inclusive IS 'Whether tax is included in the prices (true) or added separately (false)';
COMMENT ON COLUMN invoices.additional_notes IS 'Additional notes or terms for the invoice';


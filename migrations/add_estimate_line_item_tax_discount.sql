-- Add tax_rate_id, tax, and discount columns to estimate_line_items table
-- This allows storing tax rate reference, tax amount, and discount for each line item

ALTER TABLE estimate_line_items 
ADD COLUMN IF NOT EXISTS tax_rate_id INTEGER REFERENCES gst_rates(id);

ALTER TABLE estimate_line_items 
ADD COLUMN IF NOT EXISTS tax DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE estimate_line_items 
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0.00;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_tax_rate_id 
ON estimate_line_items(tax_rate_id);


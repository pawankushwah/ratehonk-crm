-- Add category column to estimate_line_items table
-- This allows storing the category (e.g., Flight, Hotel, etc.) for each line item

ALTER TABLE estimate_line_items 
ADD COLUMN IF NOT EXISTS category VARCHAR(200);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_category 
ON estimate_line_items(category);


-- Add lead_id column to estimates table
-- This allows linking estimates to leads (in addition to customers)

ALTER TABLE estimates 
ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES leads(id);

-- Add index for better query performance when filtering by lead_id
CREATE INDEX IF NOT EXISTS idx_estimates_lead_id 
ON estimates(lead_id);


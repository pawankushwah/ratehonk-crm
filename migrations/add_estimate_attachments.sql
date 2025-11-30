-- Add attachments column to estimates table
-- This allows storing file attachments (PDFs, images) for each estimate

ALTER TABLE estimates 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance when filtering by attachments
CREATE INDEX IF NOT EXISTS idx_estimates_attachments 
ON estimates USING GIN (attachments);


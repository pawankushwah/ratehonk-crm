-- Add attachments column to invoices table
-- This allows storing multiple file attachments (PDFs, images, documents) for each invoice

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance when filtering by attachments
CREATE INDEX IF NOT EXISTS idx_invoices_attachments 
ON invoices USING GIN (attachments);

-- Add comment
COMMENT ON COLUMN invoices.attachments IS 'Array of file attachments stored as JSON. Each attachment contains: id, name, url, type, fileSize, etc.';


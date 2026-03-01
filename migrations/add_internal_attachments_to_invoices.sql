-- Add internal_attachments column to invoices table
-- Internal attachments are for internal reference only and are NOT sent with invoice emails

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS internal_attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN invoices.internal_attachments IS 'Internal-only file attachments (not sent with invoice emails). Same format as attachments: [{name, url, type}]';

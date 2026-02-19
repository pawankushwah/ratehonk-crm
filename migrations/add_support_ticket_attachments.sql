-- Add attachments column to support ticket messages
ALTER TABLE support_ticket_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

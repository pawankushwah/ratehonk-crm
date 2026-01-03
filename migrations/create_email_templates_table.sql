-- Create email_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  subject TEXT,
  content TEXT NOT NULL,
  preview_text TEXT,
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'whatsapp')),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant_id ON email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_channel ON email_templates(channel);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

-- Add channel column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'channel'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'whatsapp'));
  END IF;
END $$;


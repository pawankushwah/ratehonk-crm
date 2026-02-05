-- Ensure email_automations exists (may already exist from schema)
CREATE TABLE IF NOT EXISTS email_automations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_template_id INTEGER REFERENCES email_templates(id),
  delay_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Lead follow-up automation: track when we sent an automation email to a lead (for interval enforcement)
CREATE TABLE IF NOT EXISTS lead_automation_sends (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  lead_id INTEGER NOT NULL,
  email_automation_id INTEGER NOT NULL REFERENCES email_automations(id),
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_automation_sends_tenant_lead_automation
  ON lead_automation_sends(tenant_id, lead_id, email_automation_id);

-- Tenant-level toggle for lead follow-up automations (optional; default true)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenant_settings' AND column_name = 'lead_follow_up_automations_enabled'
  ) THEN
    ALTER TABLE tenant_settings ADD COLUMN lead_follow_up_automations_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Track when we sent an invoice status follow-up automation email (for interval enforcement)
CREATE TABLE IF NOT EXISTS invoice_automation_sends (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  email_automation_id INTEGER NOT NULL REFERENCES email_automations(id),
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_automation_sends_tenant_invoice_automation
  ON invoice_automation_sends(tenant_id, invoice_id, email_automation_id);

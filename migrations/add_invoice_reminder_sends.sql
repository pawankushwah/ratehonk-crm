-- Track when we sent a payment reminder for an invoice (for frequency enforcement)
CREATE TABLE IF NOT EXISTS invoice_reminder_sends (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_reminder_sends_invoice_id ON invoice_reminder_sends(invoice_id);

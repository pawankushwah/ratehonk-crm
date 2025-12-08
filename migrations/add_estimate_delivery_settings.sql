ALTER TABLE tenant_settings
ADD COLUMN IF NOT EXISTS send_estimate_via_email BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS send_estimate_via_whatsapp BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN tenant_settings.send_estimate_via_email IS 'Automatically send estimates via email when created';
COMMENT ON COLUMN tenant_settings.send_estimate_via_whatsapp IS 'Automatically send estimates via WhatsApp when created';


-- Migration: Add invoice delivery toggles
-- Date: 2025-01-XX
-- Description: Adds boolean flags to control invoice delivery channels

ALTER TABLE tenant_settings
ADD COLUMN IF NOT EXISTS send_invoice_via_email BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS send_invoice_via_whatsapp BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN tenant_settings.send_invoice_via_email IS 'Whether invoices should be sent to customers via email';
COMMENT ON COLUMN tenant_settings.send_invoice_via_whatsapp IS 'Whether invoices should be sent to customers via WhatsApp';


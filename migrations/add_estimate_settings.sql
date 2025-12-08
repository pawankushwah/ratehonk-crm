ALTER TABLE tenant_settings
ADD COLUMN IF NOT EXISTS estimate_number_start INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS show_estimate_tax BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_estimate_discount BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_estimate_notes BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_estimate_deposit BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_estimate_payment_terms BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN tenant_settings.estimate_number_start IS 'Starting number for estimate numbering';
COMMENT ON COLUMN tenant_settings.show_estimate_tax IS 'Show/hide tax field on estimate create page';
COMMENT ON COLUMN tenant_settings.show_estimate_discount IS 'Show/hide discount field on estimate create page';
COMMENT ON COLUMN tenant_settings.show_estimate_notes IS 'Show/hide notes field on estimate create page';
COMMENT ON COLUMN tenant_settings.show_estimate_deposit IS 'Show/hide deposit field on estimate create page';
COMMENT ON COLUMN tenant_settings.show_estimate_payment_terms IS 'Show/hide payment terms field on estimate create page';


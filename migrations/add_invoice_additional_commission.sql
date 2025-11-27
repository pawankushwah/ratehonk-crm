ALTER TABLE tenant_settings
ADD COLUMN IF NOT EXISTS show_additional_commission BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN tenant_settings.show_additional_commission IS 'Show/hide additional commission field on invoice create page';


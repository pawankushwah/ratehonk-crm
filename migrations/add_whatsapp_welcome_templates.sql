-- Add WhatsApp welcome template columns to tenant_settings
-- Replaces text message with template-based welcome messages

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'lead_welcome_template_name') THEN
    ALTER TABLE tenant_settings ADD COLUMN lead_welcome_template_name TEXT;
    RAISE NOTICE 'Column lead_welcome_template_name added';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'lead_welcome_template_language') THEN
    ALTER TABLE tenant_settings ADD COLUMN lead_welcome_template_language TEXT DEFAULT 'en';
    RAISE NOTICE 'Column lead_welcome_template_language added';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'lead_welcome_template_session_id') THEN
    ALTER TABLE tenant_settings ADD COLUMN lead_welcome_template_session_id TEXT;
    RAISE NOTICE 'Column lead_welcome_template_session_id added';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'customer_welcome_template_name') THEN
    ALTER TABLE tenant_settings ADD COLUMN customer_welcome_template_name TEXT;
    RAISE NOTICE 'Column customer_welcome_template_name added';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'customer_welcome_template_language') THEN
    ALTER TABLE tenant_settings ADD COLUMN customer_welcome_template_language TEXT DEFAULT 'en';
    RAISE NOTICE 'Column customer_welcome_template_language added';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'customer_welcome_template_session_id') THEN
    ALTER TABLE tenant_settings ADD COLUMN customer_welcome_template_session_id TEXT;
    RAISE NOTICE 'Column customer_welcome_template_session_id added';
  END IF;
END $$;

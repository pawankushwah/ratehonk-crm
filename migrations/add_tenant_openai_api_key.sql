-- Tenant-level OpenAI API key (optional; falls back to env OPENAI_API_KEY if not set)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenant_settings' AND column_name = 'openai_api_key'
  ) THEN
    ALTER TABLE tenant_settings ADD COLUMN openai_api_key TEXT;
  END IF;
END $$;

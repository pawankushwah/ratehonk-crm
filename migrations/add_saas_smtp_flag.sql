-- Allow storing SaaS owner SMTP credentials directly in the database
-- by marking a configuration row with is_saas_smtp=true and no tenant_id.

ALTER TABLE email_configurations
  ADD COLUMN IF NOT EXISTS is_saas_smtp BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE email_configurations
  ALTER COLUMN tenant_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'email_configurations'::regclass
      AND conname = 'email_configurations_tenant_id_key'
  ) THEN
    ALTER TABLE email_configurations
      ADD CONSTRAINT email_configurations_tenant_id_key UNIQUE (tenant_id);
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS email_configurations_is_saas_unique
  ON email_configurations ((CASE WHEN is_saas_smtp THEN 1 ELSE 0 END))
  WHERE is_saas_smtp IS TRUE;

WITH saas AS (
  SELECT id
  FROM email_configurations
  WHERE tenant_id = 1
  ORDER BY id
  LIMIT 1
)
UPDATE email_configurations
SET is_saas_smtp = true,
    tenant_id = NULL,
    updated_at = NOW()
WHERE id IN (SELECT id FROM saas);

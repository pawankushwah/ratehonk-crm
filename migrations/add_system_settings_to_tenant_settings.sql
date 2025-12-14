-- Add system settings columns to tenant_settings table
DO $$
BEGIN
    -- Add lead_scoring_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'lead_scoring_enabled') THEN
        ALTER TABLE tenant_settings ADD COLUMN lead_scoring_enabled BOOLEAN DEFAULT true;
        RAISE NOTICE 'Column lead_scoring_enabled added to tenant_settings table';
    END IF;

    -- Add auto_lead_assignment column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'auto_lead_assignment') THEN
        ALTER TABLE tenant_settings ADD COLUMN auto_lead_assignment BOOLEAN DEFAULT false;
        RAISE NOTICE 'Column auto_lead_assignment added to tenant_settings table';
    END IF;

    -- Add duplicate_detection column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'duplicate_detection') THEN
        ALTER TABLE tenant_settings ADD COLUMN duplicate_detection BOOLEAN DEFAULT true;
        RAISE NOTICE 'Column duplicate_detection added to tenant_settings table';
    END IF;

    -- Add data_retention_days column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'data_retention_days') THEN
        ALTER TABLE tenant_settings ADD COLUMN data_retention_days INTEGER DEFAULT 365;
        RAISE NOTICE 'Column data_retention_days added to tenant_settings table';
    END IF;

    -- Add audit_logging column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'audit_logging') THEN
        ALTER TABLE tenant_settings ADD COLUMN audit_logging BOOLEAN DEFAULT true;
        RAISE NOTICE 'Column audit_logging added to tenant_settings table';
    END IF;

    -- Add session_timeout column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'session_timeout') THEN
        ALTER TABLE tenant_settings ADD COLUMN session_timeout INTEGER DEFAULT 120;
        RAISE NOTICE 'Column session_timeout added to tenant_settings table';
    END IF;
END $$;


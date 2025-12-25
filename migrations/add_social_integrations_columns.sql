-- Add missing columns to social_integrations table if they don't exist

-- Add client_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN client_id TEXT;
    END IF;
END $$;

-- Add client_secret column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'client_secret'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN client_secret TEXT;
    END IF;
END $$;

-- Add api_key column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'api_key'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN api_key TEXT;
    END IF;
END $$;

-- Add api_secret column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'api_secret'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN api_secret TEXT;
    END IF;
END $$;

-- Add access_token column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'access_token'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN access_token TEXT;
    END IF;
END $$;

-- Add refresh_token column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'refresh_token'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN refresh_token TEXT;
    END IF;
END $$;

-- Add token_expires_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'token_expires_at'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN token_expires_at TIMESTAMP;
    END IF;
END $$;

-- Add oauth_token column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'oauth_token'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN oauth_token TEXT;
    END IF;
END $$;

-- Add oauth_token_secret column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'oauth_token_secret'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN oauth_token_secret TEXT;
    END IF;
END $$;

-- Add last_sync column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'last_sync'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN last_sync TIMESTAMP;
    END IF;
END $$;

-- Add total_leads_imported column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'total_leads_imported'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN total_leads_imported INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add sync_frequency column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'sync_frequency'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN sync_frequency TEXT DEFAULT 'hourly';
    END IF;
END $$;

-- Add webhook_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'webhook_url'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN webhook_url TEXT;
    END IF;
END $$;

-- Add webhook_secret column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'webhook_secret'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN webhook_secret TEXT;
    END IF;
END $$;

-- Add permissions column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'permissions'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN permissions JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add settings column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'settings'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN created_at TIMESTAMP DEFAULT NOW() NOT NULL;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_integrations' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE social_integrations ADD COLUMN updated_at TIMESTAMP DEFAULT NOW() NOT NULL;
    END IF;
END $$;


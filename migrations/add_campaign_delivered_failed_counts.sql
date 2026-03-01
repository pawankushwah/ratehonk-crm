-- Add delivered_count, failed_count, from_name, from_email, reply_to to email_campaigns
-- Safe to run multiple times (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'delivered_count') THEN
        ALTER TABLE email_campaigns ADD COLUMN delivered_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added delivered_count to email_campaigns';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'failed_count') THEN
        ALTER TABLE email_campaigns ADD COLUMN failed_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added failed_count to email_campaigns';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'from_name') THEN
        ALTER TABLE email_campaigns ADD COLUMN from_name TEXT;
        RAISE NOTICE 'Added from_name to email_campaigns';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'from_email') THEN
        ALTER TABLE email_campaigns ADD COLUMN from_email TEXT;
        RAISE NOTICE 'Added from_email to email_campaigns';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'reply_to') THEN
        ALTER TABLE email_campaigns ADD COLUMN reply_to TEXT;
        RAISE NOTICE 'Added reply_to to email_campaigns';
    END IF;
END $$;

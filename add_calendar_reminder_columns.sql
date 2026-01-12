-- Migration: Add reminder email columns to calendar_events table
-- This allows calendar events to send reminder emails 15 minutes before the event

-- Add reminder_email_recipients column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'calendar_events'
        AND column_name = 'reminder_email_recipients'
    ) THEN
        ALTER TABLE calendar_events
        ADD COLUMN reminder_email_recipients JSONB DEFAULT NULL;

        RAISE NOTICE 'Column reminder_email_recipients added to calendar_events table';
    ELSE
        RAISE NOTICE 'Column reminder_email_recipients already exists in calendar_events table';
    END IF;
END $$;

-- Add send_reminder_email column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'calendar_events'
        AND column_name = 'send_reminder_email'
    ) THEN
        ALTER TABLE calendar_events
        ADD COLUMN send_reminder_email BOOLEAN DEFAULT false;

        RAISE NOTICE 'Column send_reminder_email added to calendar_events table';
    ELSE
        RAISE NOTICE 'Column send_reminder_email already exists in calendar_events table';
    END IF;
END $$;

-- Add reminder_sent column if it doesn't exist (to track if reminder was already sent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'calendar_events'
        AND column_name = 'reminder_sent'
    ) THEN
        ALTER TABLE calendar_events
        ADD COLUMN reminder_sent BOOLEAN DEFAULT false;

        -- Create index for better query performance
        CREATE INDEX idx_calendar_events_reminder_sent ON calendar_events(reminder_sent);

        RAISE NOTICE 'Column reminder_sent added to calendar_events table';
    ELSE
        RAISE NOTICE 'Column reminder_sent already exists in calendar_events table';
    END IF;
END $$;

-- Add selected_users column if it doesn't exist (to store selected internal users for event visibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'calendar_events'
        AND column_name = 'selected_users'
    ) THEN
        ALTER TABLE calendar_events
        ADD COLUMN selected_users JSONB DEFAULT NULL;

        RAISE NOTICE 'Column selected_users added to calendar_events table';
    ELSE
        RAISE NOTICE 'Column selected_users already exists in calendar_events table';
    END IF;
END $$;

-- Create index for reminder queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_reminder_query ON calendar_events(send_reminder_email, start_time, reminder_sent) 
WHERE send_reminder_email = true AND reminder_sent = false;

-- Create index for selected_users queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_selected_users ON calendar_events USING GIN (selected_users);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'calendar_events'
AND column_name IN ('reminder_email_recipients', 'send_reminder_email', 'reminder_sent', 'selected_users');

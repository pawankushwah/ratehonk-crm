-- Create notification_preferences table
DO $$
BEGIN
    -- Create notification_preferences table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
        CREATE TABLE notification_preferences (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            preferences JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
            UNIQUE(user_id, tenant_id)
        );

        -- Create indexes for better query performance
        CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
        CREATE INDEX idx_notification_preferences_tenant_id ON notification_preferences(tenant_id);
        CREATE INDEX idx_notification_preferences_user_tenant ON notification_preferences(user_id, tenant_id);

        RAISE NOTICE 'Table notification_preferences created successfully';
    ELSE
        RAISE NOTICE 'Table notification_preferences already exists';
    END IF;
END $$;


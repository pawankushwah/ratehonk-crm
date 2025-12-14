-- Create user_notifications table
DO $$
BEGIN
    -- Create user_notifications table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_notifications') THEN
        CREATE TABLE user_notifications (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            entity_type TEXT,
            entity_id INTEGER,
            priority TEXT DEFAULT 'medium',
            is_read BOOLEAN DEFAULT false NOT NULL,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        -- Create indexes for better query performance
        CREATE INDEX idx_user_notifications_tenant_id ON user_notifications(tenant_id);
        CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
        CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);
        CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at);
        CREATE INDEX idx_user_notifications_user_tenant ON user_notifications(user_id, tenant_id);

        RAISE NOTICE 'Table user_notifications created successfully';
    ELSE
        RAISE NOTICE 'Table user_notifications already exists';
    END IF;
END $$;


-- SaaS Notifications table for platform-level notifications (support tickets, etc.)
CREATE TABLE IF NOT EXISTS saas_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    priority TEXT DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false NOT NULL,
    action_url TEXT,
    metadata JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saas_notifications_user_id ON saas_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_saas_notifications_is_read ON saas_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_saas_notifications_created_at ON saas_notifications(created_at DESC);

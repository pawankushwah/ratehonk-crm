-- Create business_targets table for sales and performance tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_targets') THEN
        CREATE TABLE business_targets (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- null = team/company target
            target_type TEXT NOT NULL, -- revenue, bookings, leads, customers, tasks_completed
            target_name TEXT NOT NULL,
            target_value DECIMAL(15, 2) NOT NULL, -- Amount or count
            current_value DECIMAL(15, 2) DEFAULT 0, -- Current achievement
            period_type TEXT NOT NULL, -- daily, weekly, monthly, quarterly, yearly
            period_start TIMESTAMP NOT NULL,
            period_end TIMESTAMP NOT NULL,
            status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
            created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX idx_business_targets_tenant_id ON business_targets(tenant_id);
        CREATE INDEX idx_business_targets_user_id ON business_targets(user_id);
        CREATE INDEX idx_business_targets_period ON business_targets(period_start, period_end);
        CREATE INDEX idx_business_targets_status ON business_targets(status);
    END IF;
END $$;


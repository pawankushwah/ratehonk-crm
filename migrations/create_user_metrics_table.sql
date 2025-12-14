-- Create user_metrics table
DO $$
BEGIN
    -- Create user_metrics table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_metrics') THEN
        CREATE TABLE user_metrics (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            metric_type TEXT NOT NULL,
            metric_value DECIMAL(10, 2) NOT NULL,
            metric_date TIMESTAMP NOT NULL,
            additional_data JSONB,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        -- Create indexes for better query performance
        CREATE INDEX idx_user_metrics_tenant_id ON user_metrics(tenant_id);
        CREATE INDEX idx_user_metrics_user_id ON user_metrics(user_id);
        CREATE INDEX idx_user_metrics_metric_type ON user_metrics(metric_type);
        CREATE INDEX idx_user_metrics_metric_date ON user_metrics(metric_date);
        CREATE INDEX idx_user_metrics_user_tenant ON user_metrics(user_id, tenant_id);

        RAISE NOTICE 'Table user_metrics created successfully';
    ELSE
        RAISE NOTICE 'Table user_metrics already exists';
    END IF;
END $$;


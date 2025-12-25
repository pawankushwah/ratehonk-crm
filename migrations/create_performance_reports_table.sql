-- Create performance_reports table for tracking employee performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_reports') THEN
        CREATE TABLE performance_reports (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            report_period TEXT NOT NULL, -- monthly, quarterly, yearly
            period_start TIMESTAMP NOT NULL,
            period_end TIMESTAMP NOT NULL,
            revenue_generated DECIMAL(15, 2) DEFAULT 0,
            bookings_count INTEGER DEFAULT 0,
            leads_converted INTEGER DEFAULT 0,
            tasks_completed INTEGER DEFAULT 0,
            tasks_assigned INTEGER DEFAULT 0,
            customer_satisfaction_score DECIMAL(5, 2),
            notes TEXT,
            created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX idx_performance_reports_tenant_id ON performance_reports(tenant_id);
        CREATE INDEX idx_performance_reports_user_id ON performance_reports(user_id);
        CREATE INDEX idx_performance_reports_period ON performance_reports(period_start, period_end);
    END IF;
END $$;


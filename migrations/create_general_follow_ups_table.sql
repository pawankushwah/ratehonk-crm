-- Create general_follow_ups table
DO $$
BEGIN
    -- Create general_follow_ups table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'general_follow_ups') THEN
        CREATE TABLE general_follow_ups (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_by_user_id INTEGER NOT NULL REFERENCES users(id),
            priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
            due_date TIMESTAMP NOT NULL,
            related_table_name VARCHAR(100), -- 'leads', 'customers', 'invoices', 'bookings', 'estimates', 'expenses', 'tasks', 'packages', 'vendors', 'general'
            related_table_id INTEGER, -- ID from the related table
            tags TEXT[] DEFAULT '{}',
            reminder_date TIMESTAMP,
            completed_at TIMESTAMP,
            completion_notes TEXT,
            email_sent BOOLEAN DEFAULT FALSE,
            email_sent_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for better query performance
        CREATE INDEX idx_general_follow_ups_tenant_id ON general_follow_ups(tenant_id);
        CREATE INDEX idx_general_follow_ups_assigned_user ON general_follow_ups(assigned_user_id);
        CREATE INDEX idx_general_follow_ups_due_date ON general_follow_ups(due_date);
        CREATE INDEX idx_general_follow_ups_status ON general_follow_ups(status);
        CREATE INDEX idx_general_follow_ups_created_by ON general_follow_ups(created_by_user_id);
        CREATE INDEX idx_general_follow_ups_related_entity ON general_follow_ups(related_table_name, related_table_id);
        CREATE INDEX idx_general_follow_ups_tenant_status ON general_follow_ups(tenant_id, status);
        CREATE INDEX idx_general_follow_ups_tenant_assigned ON general_follow_ups(tenant_id, assigned_user_id);

        -- Create trigger to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_general_follow_ups_updated_at()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;

        CREATE TRIGGER general_follow_ups_updated_at_trigger
        BEFORE UPDATE ON general_follow_ups
        FOR EACH ROW
        EXECUTE FUNCTION update_general_follow_ups_updated_at();

        RAISE NOTICE 'Table general_follow_ups created successfully';
    ELSE
        RAISE NOTICE 'Table general_follow_ups already exists';
    END IF;
END $$;


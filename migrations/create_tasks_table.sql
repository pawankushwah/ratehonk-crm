-- Create tasks table
DO $$
BEGIN
    -- Create tasks table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        CREATE TABLE tasks (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            priority TEXT NOT NULL DEFAULT 'medium',
            type TEXT NOT NULL DEFAULT 'general',
            due_date TIMESTAMP NOT NULL,
            completed_at TIMESTAMP,
            assigned_to TEXT NOT NULL,
            assigned_to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
            lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
            tags JSONB DEFAULT '[]'::jsonb,
            notes TEXT,
            estimated_duration INTEGER,
            actual_duration INTEGER,
            created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        -- Create indexes for better query performance
        CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
        CREATE INDEX idx_tasks_assigned_to_id ON tasks(assigned_to_id);
        CREATE INDEX idx_tasks_status ON tasks(status);
        CREATE INDEX idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX idx_tasks_customer_id ON tasks(customer_id);
        CREATE INDEX idx_tasks_lead_id ON tasks(lead_id);
        CREATE INDEX idx_tasks_created_by ON tasks(created_by);
        CREATE INDEX idx_tasks_tenant_status ON tasks(tenant_id, status);
        CREATE INDEX idx_tasks_tenant_assigned ON tasks(tenant_id, assigned_to_id);

        -- Create trigger to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_tasks_updated_at()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;

        CREATE TRIGGER tasks_updated_at_trigger
        BEFORE UPDATE ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_tasks_updated_at();

        RAISE NOTICE 'Table tasks created successfully';
    ELSE
        RAISE NOTICE 'Table tasks already exists';
    END IF;
END $$;


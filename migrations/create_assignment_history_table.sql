-- Create assignment_history table
DO $$
BEGIN
    -- Create assignment_history table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignment_history') THEN
        CREATE TABLE assignment_history (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            entity_type TEXT NOT NULL,
            entity_id INTEGER NOT NULL,
            previous_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            new_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reason TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        -- Create indexes for better query performance
        CREATE INDEX idx_assignment_history_tenant_id ON assignment_history(tenant_id);
        CREATE INDEX idx_assignment_history_entity ON assignment_history(entity_type, entity_id);
        CREATE INDEX idx_assignment_history_new_user_id ON assignment_history(new_user_id);
        CREATE INDEX idx_assignment_history_created_at ON assignment_history(created_at);

        RAISE NOTICE 'Table assignment_history created successfully';
    ELSE
        RAISE NOTICE 'Table assignment_history already exists';
    END IF;
END $$;


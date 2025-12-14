-- Add assigned_user_id, assigned_at, and assigned_by columns to leads table
DO $$
BEGIN
    -- Add assigned_user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'assigned_user_id') THEN
        ALTER TABLE leads 
        ADD COLUMN assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN leads.assigned_user_id IS 'User ID assigned to handle this lead';
        
        RAISE NOTICE 'Column assigned_user_id added to leads table';
    ELSE
        RAISE NOTICE 'Column assigned_user_id already exists';
    END IF;

    -- Add assigned_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'assigned_at') THEN
        ALTER TABLE leads 
        ADD COLUMN assigned_at TIMESTAMP;
        
        COMMENT ON COLUMN leads.assigned_at IS 'Timestamp when the lead was assigned to a user';
        
        RAISE NOTICE 'Column assigned_at added to leads table';
    ELSE
        RAISE NOTICE 'Column assigned_at already exists';
    END IF;

    -- Add assigned_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'assigned_by') THEN
        ALTER TABLE leads 
        ADD COLUMN assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN leads.assigned_by IS 'User ID who assigned this lead';
        
        RAISE NOTICE 'Column assigned_by added to leads table';
    ELSE
        RAISE NOTICE 'Column assigned_by already exists';
    END IF;

    -- Add last_activity_user_id column if it doesn't exist (used in assignment updates)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_activity_user_id') THEN
        ALTER TABLE leads 
        ADD COLUMN last_activity_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN leads.last_activity_user_id IS 'User ID who last interacted with this lead';
        
        RAISE NOTICE 'Column last_activity_user_id added to leads table';
    ELSE
        RAISE NOTICE 'Column last_activity_user_id already exists';
    END IF;

    -- Create index on assigned_user_id for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leads' AND indexname = 'idx_leads_assigned_user_id') THEN
        CREATE INDEX idx_leads_assigned_user_id ON leads(assigned_user_id);
        RAISE NOTICE 'Index idx_leads_assigned_user_id created';
    ELSE
        RAISE NOTICE 'Index idx_leads_assigned_user_id already exists';
    END IF;
END $$;


-- Add created_by and updated_by columns to leads table
DO $$
BEGIN
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'created_by') THEN
        ALTER TABLE leads 
        ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN leads.created_by IS 'User ID who created this lead';
        
        RAISE NOTICE 'Column created_by added to leads table';
    ELSE
        RAISE NOTICE 'Column created_by already exists';
    END IF;

    -- Add updated_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'updated_by') THEN
        ALTER TABLE leads 
        ADD COLUMN updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN leads.updated_by IS 'User ID who last updated this lead';
        
        RAISE NOTICE 'Column updated_by added to leads table';
    ELSE
        RAISE NOTICE 'Column updated_by already exists';
    END IF;

    -- Create indexes for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leads' AND indexname = 'idx_leads_created_by') THEN
        CREATE INDEX idx_leads_created_by ON leads(created_by);
        RAISE NOTICE 'Index idx_leads_created_by created';
    ELSE
        RAISE NOTICE 'Index idx_leads_created_by already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leads' AND indexname = 'idx_leads_updated_by') THEN
        CREATE INDEX idx_leads_updated_by ON leads(updated_by);
        RAISE NOTICE 'Index idx_leads_updated_by created';
    ELSE
        RAISE NOTICE 'Index idx_leads_updated_by already exists';
    END IF;
END $$;


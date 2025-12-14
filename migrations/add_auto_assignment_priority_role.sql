-- Add auto_assignment_priority_role_id to tenant_settings table
DO $$
BEGIN
    -- Add auto_assignment_priority_role_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'auto_assignment_priority_role_id') THEN
        ALTER TABLE tenant_settings 
        ADD COLUMN auto_assignment_priority_role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;
        
        -- Add a comment to the new column
        COMMENT ON COLUMN tenant_settings.auto_assignment_priority_role_id IS 'Role ID that should be prioritized for auto-assignment of leads. If set, leads will be assigned to users with this role first.';
        
        RAISE NOTICE 'Column auto_assignment_priority_role_id added to tenant_settings table';
    ELSE
        RAISE NOTICE 'Column auto_assignment_priority_role_id already exists';
    END IF;
END $$;


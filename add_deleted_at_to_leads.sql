-- Migration: Add deleted_at column to leads table for soft delete functionality
-- This allows leads to be soft-deleted instead of permanently removed,
-- preventing foreign key constraint violations

-- Add deleted_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE leads 
        ADD COLUMN deleted_at TIMESTAMP NULL;
        
        -- Create index for better query performance
        CREATE INDEX idx_leads_deleted_at ON leads(deleted_at);
        
        RAISE NOTICE 'Column deleted_at added to leads table';
    ELSE
        RAISE NOTICE 'Column deleted_at already exists in leads table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'deleted_at';


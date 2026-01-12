-- Migration: Add deleted_at column to invoices and expenses tables for soft delete functionality
-- This allows invoices and expenses to be soft-deleted instead of permanently removed,
-- preventing foreign key constraint violations

-- Add deleted_at column to invoices table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE invoices 
        ADD COLUMN deleted_at TIMESTAMP NULL;
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at);
        
        RAISE NOTICE 'Column deleted_at added to invoices table';
    ELSE
        RAISE NOTICE 'Column deleted_at already exists in invoices table';
    END IF;
END $$;

-- Add deleted_at column to expenses table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE expenses 
        ADD COLUMN deleted_at TIMESTAMP NULL;
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at);
        
        RAISE NOTICE 'Column deleted_at added to expenses table';
    ELSE
        RAISE NOTICE 'Column deleted_at already exists in expenses table';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('invoices', 'expenses')
AND column_name = 'deleted_at'
ORDER BY table_name;

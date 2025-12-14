-- Migration: Rename supervisor_id to reporting_user_id
-- Date: 2024
-- Description: Renames the supervisor_id column to reporting_user_id in the users table

-- Check if supervisor_id column exists before renaming
DO $$
BEGIN
    -- Rename the column if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'supervisor_id'
    ) THEN
        ALTER TABLE users RENAME COLUMN supervisor_id TO reporting_user_id;
        RAISE NOTICE 'Column supervisor_id renamed to reporting_user_id successfully';
    ELSE
        -- Check if reporting_user_id already exists (migration already run)
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'reporting_user_id'
        ) THEN
            RAISE NOTICE 'Column reporting_user_id already exists. Migration may have already been run.';
        ELSE
            -- Column doesn't exist, add it
            ALTER TABLE users ADD COLUMN reporting_user_id INTEGER;
            RAISE NOTICE 'Column reporting_user_id added (supervisor_id did not exist)';
        END IF;
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN users.reporting_user_id IS 'References users.id - creates hierarchical reporting structure';


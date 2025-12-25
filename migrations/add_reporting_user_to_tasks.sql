-- Add reporting_user_id column to tasks table
DO $$
BEGIN
    -- Add reporting_user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'reporting_user_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN reporting_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX idx_tasks_reporting_user_id ON tasks(reporting_user_id);
        COMMENT ON COLUMN tasks.reporting_user_id IS 'Reporting manager/supervisor of the assigned user';
    END IF;
END $$;


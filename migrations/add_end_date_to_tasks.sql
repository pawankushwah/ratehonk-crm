-- Add end_date column to tasks table
DO $$
BEGIN
    -- Add end_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'end_date'
    ) THEN
        ALTER TABLE tasks ADD COLUMN end_date TIMESTAMP;
        CREATE INDEX idx_tasks_end_date ON tasks(end_date);
        COMMENT ON COLUMN tasks.end_date IS 'End date for task completion window';
    END IF;
END $$;


-- Add previous_assigned_user_id column to general_follow_ups table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'general_follow_ups' 
        AND column_name = 'previous_assigned_user_id'
    ) THEN
        ALTER TABLE general_follow_ups
        ADD COLUMN previous_assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_general_follow_ups_previous_assigned ON general_follow_ups(previous_assigned_user_id);
        
        RAISE NOTICE 'Column previous_assigned_user_id added successfully';
    ELSE
        RAISE NOTICE 'Column previous_assigned_user_id already exists';
    END IF;
END $$;


-- Fix call_logs_status_check constraint to allow all valid status values
-- The constraint was rejecting 'no-answer' which is used by the UI (CallModal) and Zoom integration
-- Valid statuses per schema: completed | missed | voicemail | no-answer | busy | failed

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'call_logs_status_check' 
        AND conrelid = 'call_logs'::regclass
    ) THEN
        ALTER TABLE call_logs DROP CONSTRAINT call_logs_status_check;
        RAISE NOTICE 'Dropped existing call_logs_status_check constraint';
    END IF;

    -- Add new constraint with all valid status values
    ALTER TABLE call_logs ADD CONSTRAINT call_logs_status_check 
        CHECK (status IN ('completed', 'missed', 'voicemail', 'no-answer', 'busy', 'failed'));
    RAISE NOTICE 'Added call_logs_status_check constraint with allowed values: completed, missed, voicemail, no-answer, busy, failed';
END $$;

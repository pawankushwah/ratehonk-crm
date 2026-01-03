-- Add metadata column to email_campaigns if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_campaigns' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE email_campaigns ADD COLUMN metadata JSONB;
  END IF;
END $$;


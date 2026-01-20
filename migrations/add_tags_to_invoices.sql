-- Add tags column to invoices table
-- This column stores an array of tags (e.g., ["Reissued"]) as JSON

-- Check if column already exists before adding
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE invoices 
    ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
    
    -- Create index for better query performance on tags
    CREATE INDEX IF NOT EXISTS idx_invoices_tags ON invoices USING GIN (tags);
    
    RAISE NOTICE 'Column tags added to invoices table';
  ELSE
    RAISE NOTICE 'Column tags already exists in invoices table';
  END IF;
END $$;

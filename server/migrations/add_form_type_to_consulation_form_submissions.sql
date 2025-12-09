-- Add form_type column to consulation_form_submissions table
ALTER TABLE consulation_form_submissions
ADD COLUMN IF NOT EXISTS form_type VARCHAR(50) DEFAULT 'consulation';

-- Update existing rows to have 'consulation' as default form_type
UPDATE consulation_form_submissions
SET form_type = 'consulation'
WHERE form_type IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_consulation_form_submissions_form_type ON consulation_form_submissions(tenant_id, form_type);


-- Add form_type column to consulation_form_templates table
ALTER TABLE consulation_form_templates
ADD COLUMN IF NOT EXISTS form_type VARCHAR(50) DEFAULT 'consulation';

-- Update existing rows to have 'consulation' as default form_type
UPDATE consulation_form_templates
SET form_type = 'consulation'
WHERE form_type IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_consulation_form_templates_form_type ON consulation_form_templates(tenant_id, form_type);


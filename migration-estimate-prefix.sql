-- Migration: Add estimate_prefix column to estimates table
-- This migration adds the estimate_prefix column to store the prefix separately from the estimate number

-- Add estimate_prefix column to estimates table if it doesn't exist
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS estimate_prefix TEXT DEFAULT 'EST';

-- Update existing estimates to extract prefix from estimate_number
-- This handles formats like EST-001, EST001, etc.
UPDATE estimates
SET estimate_prefix = CASE
  -- If estimate_number contains a dash or space separator (e.g., EST-001, EST 001)
  WHEN estimate_number ~ '^[A-Za-z0-9]+[\s-]+' THEN
    UPPER(SUBSTRING(estimate_number FROM '^([A-Za-z0-9]+)[\s-]+'))
  -- If estimate_number starts with letters followed by numbers (e.g., EST001)
  WHEN estimate_number ~ '^[A-Za-z]+\d' THEN
    UPPER(SUBSTRING(estimate_number FROM '^([A-Za-z]+)'))
  -- Default to EST if no pattern matches
  ELSE 'EST'
END,
estimate_number = CASE
  -- If estimate_number contains a dash or space separator (e.g., EST-001, EST 001)
  WHEN estimate_number ~ '^[A-Za-z0-9]+[\s-]+' THEN
    SUBSTRING(estimate_number FROM '[\s-]+(.+)$')
  -- If estimate_number starts with letters followed by numbers (e.g., EST001)
  WHEN estimate_number ~ '^[A-Za-z]+\d' THEN
    SUBSTRING(estimate_number FROM '[A-Za-z]+(.+)$')
  -- If it's all numbers, keep as is
  WHEN estimate_number ~ '^\d+$' THEN
    estimate_number
  -- Default: try to extract numbers
  ELSE COALESCE(SUBSTRING(estimate_number FROM '(\d+)'), estimate_number)
END
WHERE estimate_prefix IS NULL OR estimate_prefix = 'EST';

-- Set default value for any NULL estimate_prefix
UPDATE estimates
SET estimate_prefix = 'EST'
WHERE estimate_prefix IS NULL;


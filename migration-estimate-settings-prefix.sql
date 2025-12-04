-- Migration: Add estimate_number_prefix column to tenant_settings table
-- This migration adds the estimate_number_prefix column to store the prefix for estimate numbers

-- Add estimate_number_prefix column to tenant_settings table if it doesn't exist
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS estimate_number_prefix TEXT DEFAULT 'EST';

-- Update existing tenant_settings to set default prefix if NULL
UPDATE tenant_settings
SET estimate_number_prefix = 'EST'
WHERE estimate_number_prefix IS NULL;


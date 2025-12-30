-- Migration: Add activity_table_id and activity_table_name columns to customer_activities table
-- This allows activities to reference related records (invoices, bookings, etc.)

-- Add activity_table_id column
ALTER TABLE customer_activities 
ADD COLUMN IF NOT EXISTS activity_table_id INTEGER;

-- Add activity_table_name column
ALTER TABLE customer_activities 
ADD COLUMN IF NOT EXISTS activity_table_name TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_activities_table_ref 
ON customer_activities(activity_table_id, activity_table_name) 
WHERE activity_table_id IS NOT NULL AND activity_table_name IS NOT NULL;

-- Add comment
COMMENT ON COLUMN customer_activities.activity_table_id IS 'ID of related table record (e.g., invoice_id, booking_id)';
COMMENT ON COLUMN customer_activities.activity_table_name IS 'Name of related table (e.g., invoices, bookings)';


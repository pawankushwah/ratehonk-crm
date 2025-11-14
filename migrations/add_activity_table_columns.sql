-- Migration: Add activity_table_id and activity_table_name columns to activity tables
-- Date: 2025-01-14

-- Add columns to lead_activities table
ALTER TABLE lead_activities 
ADD COLUMN IF NOT EXISTS activity_table_id INTEGER,
ADD COLUMN IF NOT EXISTS activity_table_name TEXT;

-- Add columns to customer_activities table
ALTER TABLE customer_activities 
ADD COLUMN IF NOT EXISTS activity_table_id INTEGER,
ADD COLUMN IF NOT EXISTS activity_table_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN lead_activities.activity_table_id IS 'ID of the primary table record (e.g., invoice_id, booking_id)';
COMMENT ON COLUMN lead_activities.activity_table_name IS 'Name of the primary table (e.g., "invoices", "bookings", "estimates")';
COMMENT ON COLUMN customer_activities.activity_table_id IS 'ID of the primary table record (e.g., invoice_id, booking_id)';
COMMENT ON COLUMN customer_activities.activity_table_name IS 'Name of the primary table (e.g., "invoices", "bookings", "estimates")';



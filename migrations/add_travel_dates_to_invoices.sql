-- Migration: Add travel date, departure date, and arrival date columns to invoices table
-- These dates are important for travel-related invoices

-- Add travel_date column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS travel_date TIMESTAMP;

-- Add departure_date column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS departure_date TIMESTAMP;

-- Add arrival_date column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS arrival_date TIMESTAMP;

-- Add comments
COMMENT ON COLUMN invoices.travel_date IS 'Travel date for the invoice';
COMMENT ON COLUMN invoices.departure_date IS 'Departure date for travel-related invoices';
COMMENT ON COLUMN invoices.arrival_date IS 'Arrival date for travel-related invoices';


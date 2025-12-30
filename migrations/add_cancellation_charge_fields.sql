-- Migration: Add cancellation charge fields to invoices table
-- This allows tracking cancellation charges when invoices are cancelled

-- Add has_cancellation_charge column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS has_cancellation_charge BOOLEAN DEFAULT FALSE;

-- Add cancellation_charge_amount column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS cancellation_charge_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Add cancellation_charge_notes column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS cancellation_charge_notes TEXT;

-- Add comments
COMMENT ON COLUMN invoices.has_cancellation_charge IS 'Whether cancellation charges were applied when the invoice was cancelled';
COMMENT ON COLUMN invoices.cancellation_charge_amount IS 'Amount of cancellation charge applied';
COMMENT ON COLUMN invoices.cancellation_charge_notes IS 'Notes or reason for the cancellation charge';


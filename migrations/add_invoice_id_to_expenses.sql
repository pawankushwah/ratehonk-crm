-- Migration: Add invoice_id column to expenses table
-- This allows expenses to be linked to invoices when created directly

-- Add invoice_id column
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expenses_invoice_id ON expenses(invoice_id) WHERE invoice_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN expenses.invoice_id IS 'Optional reference to the invoice this expense is associated with';


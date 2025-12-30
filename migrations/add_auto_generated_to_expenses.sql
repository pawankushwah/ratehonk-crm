-- Migration: Add auto_generated column to expenses table
-- This column indicates if the expense was auto-generated from an invoice (1) or created manually (0)

-- Add auto_generated column
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expenses_auto_generated ON expenses(auto_generated) WHERE auto_generated = TRUE;

-- Add comment
COMMENT ON COLUMN expenses.auto_generated IS 'Indicates if expense was auto-generated from invoice (TRUE) or created manually (FALSE)';

-- Update existing expenses that were created from invoices
-- Expenses with notes containing "Expenses from invoice" or "Expenses for Invoice" should be marked as auto-generated
UPDATE expenses
SET auto_generated = TRUE
WHERE notes LIKE '%Expenses from invoice%' 
   OR notes LIKE '%Expenses for Invoice%'
   OR (expense_number LIKE '%-EXP' AND invoice_id IS NOT NULL);


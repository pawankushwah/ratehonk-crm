-- Add amount_paid and amount_due columns to expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS amount_due DECIMAL(10, 2) DEFAULT 0.00;

COMMENT ON COLUMN expenses.amount_paid IS 'Amount already paid towards this expense';
COMMENT ON COLUMN expenses.amount_due IS 'Amount due for this expense';


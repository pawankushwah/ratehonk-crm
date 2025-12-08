-- Add quantity and expense_number columns to expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS expense_number VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_expenses_expense_number ON expenses(expense_number);


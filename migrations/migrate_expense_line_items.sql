-- Migration script to create expense_line_items table and migrate existing expense data
-- This script converts the old structure (each expense is a separate record) 
-- to the new structure (one expense header with multiple line items)

-- Step 1: Create expense_line_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS expense_line_items (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  amount DECIMAL(10, 2) NOT NULL,
  tax_rate_id INTEGER,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  vendor_id INTEGER REFERENCES vendors(id),
  lead_type_id INTEGER REFERENCES lead_types(id),
  payment_method TEXT NOT NULL DEFAULT 'credit_card',
  payment_status TEXT NOT NULL DEFAULT 'paid',
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  amount_due DECIMAL(10, 2) DEFAULT 0,
  receipt_url TEXT,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index on expense_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_expense_line_items_expense_id ON expense_line_items(expense_id);

-- Step 2: Migrate existing expense data to line items
-- For each expense, create a corresponding line item
INSERT INTO expense_line_items (
  expense_id,
  category,
  title,
  description,
  quantity,
  amount,
  tax_rate_id,
  tax_amount,
  tax_rate,
  total_amount,
  vendor_id,
  lead_type_id,
  payment_method,
  payment_status,
  amount_paid,
  amount_due,
  receipt_url,
  notes,
  display_order
)
SELECT 
  id as expense_id,
  COALESCE(category, 'other') as category,
  COALESCE(title, 'Expense') as title,
  description,
  COALESCE(quantity, 1) as quantity,
  amount,
  NULL as tax_rate_id, -- tax_rate_id not available in old structure
  COALESCE(tax_amount, 0) as tax_amount,
  COALESCE(tax_rate, 0) as tax_rate,
  amount as total_amount, -- Assuming amount is total in old structure
  vendor_id,
  lead_type_id,
  COALESCE(payment_method, 'credit_card') as payment_method,
  CASE 
    WHEN status = 'paid' THEN 'paid'
    WHEN status = 'approved' THEN 'credit'
    ELSE 'due'
  END as payment_status,
  COALESCE(amount_paid, 0) as amount_paid,
  COALESCE(amount_due, 0) as amount_due,
  receipt_url,
  notes,
  0 as display_order
FROM expenses
WHERE id NOT IN (
  SELECT DISTINCT expense_id 
  FROM expense_line_items 
  WHERE expense_id IS NOT NULL
)
AND NOT EXISTS (
  SELECT 1 
  FROM expense_line_items 
  WHERE expense_id = expenses.id
);

-- Step 3: Update expense headers to have default values
-- Set title to "Expense" if it's empty or matches the line item title
UPDATE expenses e
SET 
  title = COALESCE(
    NULLIF(e.title, ''),
    'Expense'
  ),
  quantity = 1, -- Header quantity is always 1
  category = COALESCE(
    NULLIF(e.category, ''),
    'other'
  )
WHERE EXISTS (
  SELECT 1 
  FROM expense_line_items eli 
  WHERE eli.expense_id = e.id
);

-- Step 4: Update expense totals from line items
UPDATE expenses e
SET 
  amount = COALESCE(
    (SELECT SUM(total_amount) FROM expense_line_items WHERE expense_id = e.id),
    e.amount
  ),
  tax_amount = COALESCE(
    (SELECT SUM(tax_amount) FROM expense_line_items WHERE expense_id = e.id),
    COALESCE(e.tax_amount, 0)
  ),
  amount_paid = COALESCE(
    (SELECT SUM(amount_paid) FROM expense_line_items WHERE expense_id = e.id),
    COALESCE(e.amount_paid, 0)
  ),
  amount_due = COALESCE(
    (SELECT SUM(amount_due) FROM expense_line_items WHERE expense_id = e.id),
    COALESCE(e.amount_due, 0)
  ),
  tax_rate = CASE 
    WHEN COALESCE((SELECT SUM(total_amount) FROM expense_line_items WHERE expense_id = e.id), 0) > 0
    THEN (COALESCE((SELECT SUM(tax_amount) FROM expense_line_items WHERE expense_id = e.id), 0) / 
          COALESCE((SELECT SUM(total_amount) FROM expense_line_items WHERE expense_id = e.id), 1)) * 100
    ELSE COALESCE(e.tax_rate, 0)
  END,
  receipt_url = NULL -- Receipt URLs are now stored in line items
WHERE EXISTS (
  SELECT 1 
  FROM expense_line_items eli 
  WHERE eli.expense_id = e.id
);

-- Step 5: Add comment to document the migration
COMMENT ON TABLE expense_line_items IS 'Stores individual line items for expenses. Each expense can have multiple line items.';


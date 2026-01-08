-- SQL Query to link invoice_id in expenses table where it's empty
-- This query matches expenses to invoices based on:
-- 1. Notes containing invoice numbers (e.g., "Expenses from invoice 169")
-- 2. Expense numbers matching invoice numbers (e.g., "169-EXP" matching invoice "169" or "INV169")

-- Step 1: Update expenses based on expense notes pattern
-- Pattern: "Expenses from invoice {invoiceNumber}" or "Auto-generated from invoice {invoiceNumber}"
UPDATE expenses e
SET invoice_id = (
  SELECT i.id
  FROM invoices i
  WHERE i.tenant_id = e.tenant_id
    AND (
      -- Match full invoice number (prefix + number) - try different formats
      e.notes LIKE '%from invoice ' || (i.invoice_prefix || i.invoice_number) || '%'
      OR e.notes LIKE '%from invoice ' || (i.invoice_prefix || '-' || i.invoice_number) || '%'
      OR e.notes LIKE '%from invoice ' || i.invoice_number || '%'
      OR e.notes LIKE '%invoice ' || (i.invoice_prefix || i.invoice_number) || '%'
      OR e.notes LIKE '%invoice ' || (i.invoice_prefix || '-' || i.invoice_number) || '%'
      OR e.notes LIKE '%invoice ' || i.invoice_number || '%'
    )
  LIMIT 1
)
WHERE e.invoice_id IS NULL
  AND e.notes IS NOT NULL
  AND (e.notes LIKE '%from invoice%' OR e.notes LIKE '%invoice%');

-- Step 2: Update expenses based on expense number pattern
-- Pattern: "{invoiceNumber}-EXP" or "{numericPart}-EXP" matching invoice numbers
UPDATE expenses e
SET invoice_id = (
  SELECT i.id
  FROM invoices i
  WHERE i.tenant_id = e.tenant_id
    AND e.expense_number IS NOT NULL
    AND (
      -- Match full invoice number (with prefix) - e.g., "INV169-EXP" matches "INV169"
      (i.invoice_prefix || i.invoice_number) = SPLIT_PART(e.expense_number, '-EXP', 1)
      OR (i.invoice_prefix || '-' || i.invoice_number) = SPLIT_PART(e.expense_number, '-EXP', 1)
      -- Match just the numeric part - e.g., "169-EXP" matches invoice number "169"
      OR i.invoice_number = SPLIT_PART(e.expense_number, '-EXP', 1)
      -- Also handle cases where expense number is just the numeric part
      OR i.invoice_number = e.expense_number
      OR (i.invoice_prefix || i.invoice_number) = e.expense_number
    )
  LIMIT 1
)
WHERE e.invoice_id IS NULL
  AND e.expense_number IS NOT NULL
  AND (e.expense_number LIKE '%-EXP%' OR e.expense_number ~ '^[0-9]+$');

-- Step 3: Get summary statistics
SELECT 
  COUNT(*) as total_expenses,
  COUNT(invoice_id) as expenses_with_invoice_id,
  COUNT(*) - COUNT(invoice_id) as expenses_without_invoice_id
FROM expenses;


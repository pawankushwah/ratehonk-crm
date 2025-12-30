-- Migration: Backfill invoice_id for existing expenses
-- This script matches existing expenses to invoices based on expense notes and expense numbers
-- Expenses created from invoices typically have notes like "Auto-generated from invoice INV-001" 
-- or expense numbers like "INV-001-EXP-1" or "INV-001-MAN-1"

-- Step 1: Update expenses based on expense notes pattern
-- Pattern: "Auto-generated from invoice {invoiceNumber}" or "Manual expense from invoice {invoiceNumber}"
-- Notes format: "Auto-generated from invoice INV-001 - VOUCHER123" or "Manual expense from invoice INV-001"
-- Extract invoice number from notes and match to invoices
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
      -- Also try matching when invoice number appears after "invoice " in notes
      OR SUBSTRING(e.notes FROM 'invoice\s+([A-Z0-9-]+)') = (i.invoice_prefix || i.invoice_number)
      OR SUBSTRING(e.notes FROM 'invoice\s+([A-Z0-9-]+)') = (i.invoice_prefix || '-' || i.invoice_number)
      OR SUBSTRING(e.notes FROM 'invoice\s+([A-Z0-9-]+)') = i.invoice_number
    )
  LIMIT 1
)
WHERE e.invoice_id IS NULL
  AND (e.notes LIKE '%Auto-generated from invoice%' OR e.notes LIKE '%Manual expense from invoice%');

-- Step 2: Update expenses based on expense number pattern
-- Pattern: "{invoiceNumber}-EXP-{index}" or "{invoiceNumber}-MAN-{index}"
UPDATE expenses e
SET invoice_id = (
  SELECT i.id
  FROM invoices i
  WHERE (
    -- Extract invoice number prefix from expense number (e.g., "INV-001-EXP-1" -> "INV-001")
    e.expense_number IS NOT NULL
    AND (
      -- Match full invoice number (with prefix)
      i.invoice_prefix || i.invoice_number = SPLIT_PART(e.expense_number, '-EXP-', 1)
      OR i.invoice_prefix || '-' || i.invoice_number = SPLIT_PART(e.expense_number, '-EXP-', 1)
      OR i.invoice_prefix || i.invoice_number = SPLIT_PART(e.expense_number, '-MAN-', 1)
      OR i.invoice_prefix || '-' || i.invoice_number = SPLIT_PART(e.expense_number, '-MAN-', 1)
      -- Also try matching just the number part
      OR i.invoice_number = SPLIT_PART(SPLIT_PART(e.expense_number, '-EXP-', 1), '-', -1)
      OR i.invoice_number = SPLIT_PART(SPLIT_PART(e.expense_number, '-MAN-', 1), '-', -1)
    )
  )
  AND i.tenant_id = e.tenant_id
  LIMIT 1
)
WHERE e.invoice_id IS NULL
  AND e.expense_number IS NOT NULL
  AND (e.expense_number LIKE '%-EXP-%' OR e.expense_number LIKE '%-MAN-%');

-- Step 3: Update expenses based on matching dates and amounts (fallback method)
-- This matches expenses to invoices created on the same date with similar amounts
-- Only for expenses that still don't have invoice_id
UPDATE expenses e
SET invoice_id = (
  SELECT i.id
  FROM invoices i
  WHERE i.tenant_id = e.tenant_id
    AND DATE(i.created_at) = DATE(e.created_at)
    AND ABS(CAST(i.total_amount AS NUMERIC) - CAST(e.amount AS NUMERIC)) < 0.01
    AND i.id NOT IN (
      SELECT DISTINCT invoice_id 
      FROM expenses 
      WHERE invoice_id IS NOT NULL
    )
  ORDER BY ABS(CAST(i.total_amount AS NUMERIC) - CAST(e.amount AS NUMERIC))
  LIMIT 1
)
WHERE e.invoice_id IS NULL
  AND e.created_at IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM invoices i
    WHERE i.tenant_id = e.tenant_id
      AND DATE(i.created_at) = DATE(e.created_at)
      AND ABS(CAST(i.total_amount AS NUMERIC) - CAST(e.amount AS NUMERIC)) < 0.01
  );

-- Step 4: Show summary of backfilled expenses
SELECT 
  COUNT(*) as total_expenses,
  COUNT(invoice_id) as expenses_with_invoice_id,
  COUNT(*) - COUNT(invoice_id) as expenses_without_invoice_id
FROM expenses;

-- Step 5: Show expenses that were successfully matched
SELECT 
  e.id as expense_id,
  e.expense_number,
  e.title,
  e.amount,
  i.id as invoice_id,
  i.invoice_number,
  i.total_amount as invoice_total,
  e.notes
FROM expenses e
LEFT JOIN invoices i ON e.invoice_id = i.id
WHERE e.invoice_id IS NOT NULL
ORDER BY e.created_at DESC
LIMIT 20;


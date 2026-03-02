-- Permanently delete all soft-deleted expenses, invoices, and estimates
-- Run this in a transaction - rollback if you want to preview without committing

BEGIN;

-- 1. Delete expense_line_items for soft-deleted expenses (or expenses linked to soft-deleted invoices)
DELETE FROM expense_line_items
WHERE expense_id IN (
  SELECT id FROM expenses WHERE deleted_at IS NOT NULL
  UNION
  SELECT id FROM expenses WHERE invoice_id IN (SELECT id FROM invoices WHERE deleted_at IS NOT NULL)
);

-- 2. Delete soft-deleted expenses (and those linked to soft-deleted invoices)
DELETE FROM expenses
WHERE deleted_at IS NOT NULL
   OR invoice_id IN (SELECT id FROM invoices WHERE deleted_at IS NOT NULL);

-- 3. Delete invoice_items for soft-deleted invoices
DELETE FROM invoice_items
WHERE invoice_id IN (SELECT id FROM invoices WHERE deleted_at IS NOT NULL);

-- 4. Delete payment_installments for soft-deleted invoices
DELETE FROM payment_installments
WHERE invoice_id IN (SELECT id FROM invoices WHERE deleted_at IS NOT NULL);

-- 5. Delete soft-deleted invoices
DELETE FROM invoices WHERE deleted_at IS NOT NULL;

-- 6. Delete soft-deleted estimates (if deleted_at column exists on estimates)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'deleted_at'
  ) THEN
    DELETE FROM estimate_line_items
    WHERE estimate_id IN (SELECT id FROM estimates WHERE deleted_at IS NOT NULL);
    DELETE FROM estimates WHERE deleted_at IS NOT NULL;
  END IF;
END $$;

COMMIT;

-- Migration: Fix data inconsistencies in old invoices and expenses
-- This script updates:
-- 1. Expense line items payment_status and amount_paid based on parent expense status
-- 2. Expense amount_paid based on line items totals
-- 3. Invoice paid_amount based on invoice status
-- 4. Links expenses to invoices where possible

-- ============================================================================
-- STEP 1: Update expense_line_items payment_status and amount_paid
-- If parent expense status is 'paid' or 'approved', mark line items as paid
-- ============================================================================

UPDATE expense_line_items eli
SET 
  payment_status = 'paid',
  amount_paid = eli.total_amount,
  amount_due = 0,
  updated_at = NOW()
FROM expenses e
WHERE 
  eli.expense_id = e.id
  AND e.status IN ('paid', 'approved')
  AND (eli.payment_status != 'paid' OR eli.amount_paid != eli.total_amount OR eli.amount_paid IS NULL);

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % expense line items to paid status', updated_count;
END $$;

-- ============================================================================
-- STEP 2: Update expense amount_paid from line items totals
-- Set expense amount_paid = SUM of all line items total_amount where expense is paid/approved
-- ============================================================================

UPDATE expenses e
SET 
  amount_paid = COALESCE(line_items_sum.total_sum, 0),
  amount_due = GREATEST(0, COALESCE(e.amount, 0) + COALESCE(e.tax_amount, 0) - COALESCE(line_items_sum.total_sum, 0)),
  updated_at = NOW()
FROM (
  SELECT 
    expense_id,
    SUM(COALESCE(total_amount, 0)) as total_sum
  FROM expense_line_items
  GROUP BY expense_id
) line_items_sum
WHERE 
  e.id = line_items_sum.expense_id
  AND e.status IN ('paid', 'approved')
  AND (e.amount_paid != line_items_sum.total_sum OR e.amount_paid IS NULL);

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated amount_paid for % expenses', updated_count;
END $$;

-- ============================================================================
-- STEP 3: Update expense amount_paid for expenses without line items
-- For expenses that are paid/approved but have no line items, set amount_paid = amount + tax_amount
-- ============================================================================

UPDATE expenses e
SET 
  amount_paid = COALESCE(e.amount, 0) + COALESCE(e.tax_amount, 0),
  amount_due = 0,
  updated_at = NOW()
WHERE 
  e.status IN ('paid', 'approved')
  AND NOT EXISTS (
    SELECT 1 FROM expense_line_items eli WHERE eli.expense_id = e.id
  )
  AND (e.amount_paid != (COALESCE(e.amount, 0) + COALESCE(e.tax_amount, 0)) OR e.amount_paid IS NULL);

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated amount_paid for % expenses without line items', updated_count;
END $$;

-- ============================================================================
-- STEP 4: Update invoice paid_amount based on invoice status
-- If invoice status is 'paid', set paid_amount = total_amount
-- ============================================================================

UPDATE invoices i
SET 
  paid_amount = i.total_amount,
  updated_at = NOW()
WHERE 
  i.status = 'paid'
  AND (i.paid_amount != i.total_amount OR i.paid_amount IS NULL);

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated paid_amount for % paid invoices', updated_count;
END $$;

-- ============================================================================
-- STEP 5: Update invoice paid_amount from related expenses
-- If invoice has related expenses that are paid/approved, sum their amount_paid
-- ============================================================================

UPDATE invoices i
SET 
  paid_amount = COALESCE(expenses_sum.total_paid, 0),
  updated_at = NOW()
FROM (
  SELECT 
    invoice_id,
    SUM(COALESCE(amount_paid, 0)) as total_paid
  FROM expenses
  WHERE invoice_id IS NOT NULL 
    AND status IN ('paid', 'approved')
    AND deleted_at IS NULL
  GROUP BY invoice_id
) expenses_sum
WHERE 
  i.id = expenses_sum.invoice_id
  AND i.status = 'paid'
  AND (i.paid_amount != expenses_sum.total_paid OR i.paid_amount IS NULL);

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated paid_amount for % invoices from related expenses', updated_count;
END $$;

-- ============================================================================
-- STEP 6: Try to link expenses to invoices where invoice_id is NULL
-- Match based on expense notes containing invoice numbers
-- This uses patterns like "Auto-generated from invoice INV-001" or "from invoice 123"
-- ============================================================================

-- Step 6a: Update expenses based on expense notes pattern
-- Pattern: "Auto-generated from invoice {invoiceNumber}" or "from invoice {invoiceNumber}"
UPDATE expenses e
SET 
  invoice_id = matched_invoice.invoice_id,
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (e.id)
    e.id as expense_id,
    i.id as invoice_id
  FROM expenses e
  INNER JOIN invoices i ON i.tenant_id = e.tenant_id
  WHERE 
    e.invoice_id IS NULL
    AND e.deleted_at IS NULL
    AND i.deleted_at IS NULL
    AND e.notes IS NOT NULL
    AND (
      -- Match full invoice number (prefix + number) - try different formats
      e.notes LIKE '%from invoice ' || (i.invoice_prefix || i.invoice_number) || '%'
      OR e.notes LIKE '%from invoice ' || (i.invoice_prefix || '-' || i.invoice_number) || '%'
      OR e.notes LIKE '%from invoice ' || i.invoice_number || '%'
      OR e.notes LIKE '%invoice ' || (i.invoice_prefix || i.invoice_number) || '%'
      OR e.notes LIKE '%invoice ' || (i.invoice_prefix || '-' || i.invoice_number) || '%'
      OR e.notes LIKE '%invoice ' || i.invoice_number || '%'
      OR e.notes LIKE '%INV-' || i.invoice_number || '%'
      OR e.notes LIKE '%INV' || i.invoice_number || '%'
    )
  ORDER BY e.id, i.issue_date DESC
) matched_invoice
WHERE 
  e.id = matched_invoice.expense_id
  AND e.invoice_id IS NULL;

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Linked % expenses to invoices based on notes', updated_count;
END $$;

-- Step 6b: Update expenses based on expense number pattern
-- Pattern: "{invoiceNumber}-EXP" or "{numericPart}-EXP" matching invoice numbers
UPDATE expenses e
SET 
  invoice_id = matched_invoice.invoice_id,
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (e.id)
    e.id as expense_id,
    i.id as invoice_id
  FROM expenses e
  INNER JOIN invoices i ON i.tenant_id = e.tenant_id
  WHERE 
    e.invoice_id IS NULL
    AND e.deleted_at IS NULL
    AND i.deleted_at IS NULL
    AND e.expense_number IS NOT NULL
    AND (
      -- Match expense number containing invoice number
      e.expense_number LIKE '%' || i.invoice_number || '%'
      OR e.expense_number LIKE '%' || (i.invoice_prefix || i.invoice_number) || '%'
      OR e.expense_number LIKE '%' || (i.invoice_prefix || '-' || i.invoice_number) || '%'
      -- Pattern: "INV-001-EXP-1" or "INV-001-MAN-1"
      OR e.expense_number = (i.invoice_prefix || '-' || i.invoice_number || '-EXP-1')
      OR e.expense_number LIKE (i.invoice_prefix || '-' || i.invoice_number || '-%')
    )
  ORDER BY e.id, i.issue_date DESC
) matched_invoice
WHERE 
  e.id = matched_invoice.expense_id
  AND e.invoice_id IS NULL;

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Linked % expenses to invoices based on expense numbers', updated_count;
END $$;

-- ============================================================================
-- STEP 7: Update invoice status to 'paid' if all related expenses are paid
-- This ensures consistency
-- ============================================================================

UPDATE invoices i
SET 
  status = 'paid',
  paid_amount = i.total_amount,
  updated_at = NOW()
WHERE 
  i.status != 'paid'
  AND i.status != 'cancelled'
  AND i.status != 'void'
  AND i.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM expenses e 
    WHERE e.invoice_id = i.id 
      AND e.deleted_at IS NULL
  )
  AND NOT EXISTS (
    SELECT 1 FROM expenses e 
    WHERE e.invoice_id = i.id 
      AND e.deleted_at IS NULL
      AND e.status NOT IN ('paid', 'approved')
  )
  AND (
    SELECT SUM(COALESCE(amount_paid, 0)) 
    FROM expenses 
    WHERE invoice_id = i.id 
      AND deleted_at IS NULL
      AND status IN ('paid', 'approved')
  ) >= i.total_amount;

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated status to paid for % invoices based on expenses', updated_count;
END $$;

-- ============================================================================
-- STEP 8: Summary Report
-- Show statistics about the fixes
-- ============================================================================

DO $$
DECLARE
  expense_line_items_paid INTEGER;
  expenses_fixed INTEGER;
  invoices_fixed INTEGER;
  expenses_linked INTEGER;
BEGIN
  -- Count expense line items with paid status
  SELECT COUNT(*) INTO expense_line_items_paid
  FROM expense_line_items eli
  INNER JOIN expenses e ON e.id = eli.expense_id
  WHERE e.status IN ('paid', 'approved') AND eli.payment_status = 'paid';
  
  -- Count expenses with correct amount_paid
  SELECT COUNT(*) INTO expenses_fixed
  FROM expenses e
  WHERE e.status IN ('paid', 'approved')
    AND e.amount_paid > 0
    AND e.deleted_at IS NULL;
  
  -- Count invoices with correct paid_amount
  SELECT COUNT(*) INTO invoices_fixed
  FROM invoices i
  WHERE i.status = 'paid'
    AND i.paid_amount > 0
    AND i.deleted_at IS NULL;
  
  -- Count expenses linked to invoices
  SELECT COUNT(*) INTO expenses_linked
  FROM expenses
  WHERE invoice_id IS NOT NULL
    AND deleted_at IS NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATA FIX SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Expense line items with paid status: %', expense_line_items_paid;
  RAISE NOTICE 'Expenses with amount_paid set: %', expenses_fixed;
  RAISE NOTICE 'Invoices with paid_amount set: %', invoices_fixed;
  RAISE NOTICE 'Expenses linked to invoices: %', expenses_linked;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to check results)
-- ============================================================================

-- Check expenses with incorrect amount_paid
-- SELECT 
--   e.id,
--   e.title,
--   e.status,
--   e.amount_paid,
--   (SELECT SUM(total_amount) FROM expense_line_items WHERE expense_id = e.id) as line_items_total
-- FROM expenses e
-- WHERE e.status IN ('paid', 'approved')
--   AND e.amount_paid != COALESCE((SELECT SUM(total_amount) FROM expense_line_items WHERE expense_id = e.id), e.amount + e.tax_amount);

-- Check invoices with incorrect paid_amount
-- SELECT 
--   i.id,
--   i.invoice_number,
--   i.status,
--   i.total_amount,
--   i.paid_amount,
--   (SELECT SUM(amount_paid) FROM expenses WHERE invoice_id = i.id AND status IN ('paid', 'approved')) as expenses_total
-- FROM invoices i
-- WHERE i.status = 'paid'
--   AND i.paid_amount != i.total_amount;

-- Check expense line items with incorrect payment_status
-- SELECT 
--   eli.id,
--   eli.expense_id,
--   eli.payment_status,
--   e.status as expense_status
-- FROM expense_line_items eli
-- INNER JOIN expenses e ON e.id = eli.expense_id
-- WHERE e.status IN ('paid', 'approved')
--   AND eli.payment_status != 'paid';

-- Migration: Soft delete invoices with status 'void' and their related expenses
-- This script sets deleted_at timestamp for void invoices and all their related expenses

-- ============================================================================
-- STEP 1: Check if deleted_at column exists in invoices table
-- ============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'deleted_at'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    RAISE EXCEPTION 'Column deleted_at does not exist in invoices table. Please run the add_deleted_at_to_invoices_expenses.sql migration first.';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Soft delete expenses related to void invoices
-- First, soft delete all expenses that are linked to void invoices
-- ============================================================================

UPDATE expenses e
SET 
  deleted_at = NOW(),
  updated_at = NOW()
FROM invoices i
WHERE 
  e.invoice_id = i.id
  AND i.status = 'void'
  AND i.deleted_at IS NULL
  AND e.deleted_at IS NULL;

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Soft deleted % expenses related to void invoices', updated_count;
END $$;

-- ============================================================================
-- STEP 3: Soft delete void invoices
-- Set deleted_at for all invoices with status 'void' that are not already deleted
-- ============================================================================

UPDATE invoices i
SET 
  deleted_at = NOW(),
  updated_at = NOW()
WHERE 
  i.status = 'void'
  AND i.deleted_at IS NULL;

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Soft deleted % void invoices', updated_count;
END $$;

-- ============================================================================
-- STEP 4: Summary Report
-- Show statistics about the soft deletions
-- ============================================================================

DO $$
DECLARE
  void_invoices_count INTEGER;
  void_invoices_deleted INTEGER;
  related_expenses_deleted INTEGER;
BEGIN
  -- Count total void invoices (including already deleted)
  SELECT COUNT(*) INTO void_invoices_count
  FROM invoices
  WHERE status = 'void';
  
  -- Count void invoices that are now soft deleted
  SELECT COUNT(*) INTO void_invoices_deleted
  FROM invoices
  WHERE status = 'void' AND deleted_at IS NOT NULL;
  
  -- Count expenses deleted due to void invoices
  SELECT COUNT(*) INTO related_expenses_deleted
  FROM expenses
  WHERE deleted_at IS NOT NULL
    AND invoice_id IN (SELECT id FROM invoices WHERE status = 'void');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SOFT DELETE SUMMARY FOR VOID INVOICES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total void invoices: %', void_invoices_count;
  RAISE NOTICE 'Void invoices soft deleted: %', void_invoices_deleted;
  RAISE NOTICE 'Related expenses soft deleted: %', related_expenses_deleted;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to check results)
-- ============================================================================

-- Check if there are any void invoices that are NOT soft deleted
-- SELECT 
--   id,
--   invoice_number,
--   status,
--   deleted_at,
--   created_at
-- FROM invoices
-- WHERE status = 'void'
--   AND deleted_at IS NULL;

-- Check expenses related to void invoices that are NOT soft deleted
-- SELECT 
--   e.id,
--   e.title,
--   e.invoice_id,
--   e.deleted_at,
--   i.invoice_number,
--   i.status as invoice_status
-- FROM expenses e
-- INNER JOIN invoices i ON i.id = e.invoice_id
-- WHERE i.status = 'void'
--   AND e.deleted_at IS NULL;

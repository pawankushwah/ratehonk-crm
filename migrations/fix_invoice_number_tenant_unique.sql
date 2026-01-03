-- Migration to fix invoice_number unique constraint to be tenant-specific
-- This allows the same invoice number (e.g., "001") for different tenants
-- but prevents duplicates within the same tenant

-- Step 1: Drop the existing global unique constraint on invoice_number
-- First, find and drop the constraint if it exists
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'invoices'::regclass
      AND contype = 'u'
      AND array_length(conkey, 1) = 1
      AND (
        SELECT attname 
        FROM pg_attribute 
        WHERE attrelid = conrelid 
          AND attnum = conkey[1]
      ) = 'invoice_number';
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE invoices DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No global unique constraint on invoice_number found';
    END IF;
END $$;

-- Step 2: Create a composite unique constraint on (tenant_id, invoice_prefix, invoice_number)
-- This ensures invoice numbers are unique per tenant, but can be duplicated across tenants
ALTER TABLE invoices
ADD CONSTRAINT invoices_tenant_invoice_unique 
UNIQUE (tenant_id, invoice_prefix, invoice_number);

-- Step 3: Verify the constraint was created
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'invoices'::regclass
  AND conname = 'invoices_tenant_invoice_unique';


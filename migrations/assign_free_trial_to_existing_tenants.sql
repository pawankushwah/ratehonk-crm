-- Migration: Assign free trial subscriptions to all existing tenants
-- This script assigns a Basic Plan free trial to tenants that don't have a subscription

DO $$ 
DECLARE
  tenant_record RECORD;
  basic_plan_id INTEGER;
  trial_days INTEGER := 7;
  trial_start_date TIMESTAMP := NOW();
  trial_end_date TIMESTAMP;
  assigned_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  -- Get Basic Plan ID (prefer India plan, fallback to US)
  SELECT id, free_trial_days INTO basic_plan_id, trial_days
  FROM subscription_plans 
  WHERE name LIKE '%Basic%' 
  ORDER BY 
    CASE WHEN country = 'IN' THEN 1 ELSE 2 END,
    id ASC
  LIMIT 1;
  
  IF basic_plan_id IS NULL THEN
    RAISE EXCEPTION 'No Basic Plan found. Please create plans first.';
  END IF;
  
  RAISE NOTICE 'Using plan ID: %, Trial days: %', basic_plan_id, trial_days;
  
  -- Calculate trial end date
  trial_end_date := trial_start_date + (trial_days || ' days')::INTERVAL;
  
  -- Loop through all tenants
  FOR tenant_record IN 
    SELECT id, company_name, contact_email 
    FROM tenants 
    ORDER BY id
  LOOP
    -- Check if tenant already has a subscription
    IF EXISTS (
      SELECT 1 
      FROM tenant_subscriptions 
      WHERE tenant_id = tenant_record.id
    ) THEN
      RAISE NOTICE 'Skipping tenant #% (%) - already has subscription', 
        tenant_record.id, tenant_record.company_name;
      skipped_count := skipped_count + 1;
    ELSE
      -- Create free trial subscription
      INSERT INTO tenant_subscriptions (
        tenant_id,
        plan_id,
        status,
        billing_cycle,
        payment_gateway,
        trial_ends_at,
        current_period_start,
        current_period_end,
        next_billing_date,
        failed_payment_attempts
      ) VALUES (
        tenant_record.id,
        basic_plan_id,
        'trial',
        'monthly',
        'stripe',
        trial_end_date,
        trial_start_date,
        trial_end_date,
        trial_end_date,
        0
      );
      
      RAISE NOTICE 'Assigned free trial to tenant #% (%) - Trial ends: %', 
        tenant_record.id, 
        tenant_record.company_name,
        trial_end_date;
      assigned_count := assigned_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Assigned: % tenant(s)', assigned_count;
  RAISE NOTICE '  Skipped: % tenant(s)', skipped_count;
  RAISE NOTICE '========================================';
END $$;


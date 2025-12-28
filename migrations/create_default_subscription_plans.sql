-- Migration: Create default subscription plans for India and International markets
-- Creates 3 plans for India (IN) and 3 plans for International (US)

DO $$ 
DECLARE
  basic_menu_items JSONB := '["dashboard", "customers", "leads", "bookings", "invoices", "calendar", "settings", "subscription"]'::jsonb;
  professional_menu_items JSONB := '["dashboard", "customers", "leads", "lead-types", "bookings", "packages", "invoices", "invoice-import", "vendors", "expenses", "calendar", "email-campaigns", "social-media", "analytics", "reports", "dynamic-fields", "settings", "menu-ordering", "users", "roles", "whatsapp-messages", "whatsapp-setup", "whatsapp-devices", "travel-search-b2c", "travel-search-b2b", "service-providers", "gst-settings", "tasks", "support", "subscription", "automation-workflows"]'::jsonb;
  enterprise_menu_items JSONB := '["dashboard", "customers", "leads", "lead-types", "bookings", "packages", "invoices", "invoice-import", "vendors", "expenses", "calendar", "email-campaigns", "social-media", "analytics", "reports", "dynamic-fields", "settings", "menu-ordering", "users", "roles", "whatsapp-messages", "whatsapp-setup", "whatsapp-devices", "travel-search-b2c", "travel-search-b2b", "service-providers", "gst-settings", "tasks", "support", "subscription", "automation-workflows"]'::jsonb;
  
  basic_pages JSONB := '["/dashboard", "/customers", "/leads", "/bookings", "/invoices", "/calendar", "/settings", "/subscription"]'::jsonb;
  professional_pages JSONB := '["/dashboard", "/customers", "/leads", "/lead-types", "/bookings", "/packages", "/invoices", "/invoice-import", "/vendors", "/expenses", "/calendar", "/email-campaigns", "/social-integrations", "/analytics", "/reports", "/dynamic-fields", "/settings", "/menu-ordering", "/users", "/roles", "/whatsapp-messages", "/whatsapp-setup", "/whatsapp-devices", "/travel-search-b2c", "/travel-search-b2b", "/service-providers", "/gst-settings", "/tasks", "/support", "/subscription", "/automation-workflows"]'::jsonb;
  enterprise_pages JSONB := '["/dashboard", "/customers", "/leads", "/lead-types", "/bookings", "/packages", "/invoices", "/invoice-import", "/vendors", "/expenses", "/calendar", "/email-campaigns", "/social-integrations", "/analytics", "/reports", "/dynamic-fields", "/settings", "/menu-ordering", "/users", "/roles", "/whatsapp-messages", "/whatsapp-setup", "/whatsapp-devices", "/travel-search-b2c", "/travel-search-b2b", "/service-providers", "/gst-settings", "/tasks", "/support", "/subscription", "/automation-workflows"]'::jsonb;
  
  basic_widgets JSONB := '["dashboard.revenue", "dashboard.bookings", "dashboard.customers", "dashboard.leads"]'::jsonb;
  professional_widgets JSONB := '["dashboard.revenue", "dashboard.bookings", "dashboard.customers", "dashboard.leads", "dashboard.revenue-chart", "dashboard.profit-loss", "dashboard.expense-chart", "dashboard.service-booking", "dashboard.service-provider", "dashboard.vendor-booking", "dashboard.invoice-status", "dashboard.marketing-seo", "dashboard.sidebar-followups", "dashboard.sidebar-customers", "dashboard.sidebar-bookings", "dashboard.sidebar-contacts"]'::jsonb;
  enterprise_widgets JSONB := '["dashboard.revenue", "dashboard.bookings", "dashboard.customers", "dashboard.leads", "dashboard.revenue-chart", "dashboard.profit-loss", "dashboard.expense-chart", "dashboard.service-booking", "dashboard.service-provider", "dashboard.vendor-booking", "dashboard.invoice-status", "dashboard.marketing-seo", "dashboard.sidebar-followups", "dashboard.sidebar-customers", "dashboard.sidebar-bookings", "dashboard.sidebar-contacts"]'::jsonb;
  
  basic_permissions JSONB := '{"dashboard": ["view"], "customers": ["view", "create"], "leads": ["view", "create"], "bookings": ["view", "create"], "invoices": ["view", "create"], "calendar": ["view"], "settings": ["view"], "subscription": ["view"]}'::jsonb;
  professional_permissions JSONB := '{"dashboard": ["view"], "customers": ["view", "edit", "delete", "create"], "leads": ["view", "edit", "delete", "create"], "lead-types": ["view", "edit", "delete", "create"], "bookings": ["view", "edit", "delete", "create"], "packages": ["view", "edit", "delete", "create"], "invoices": ["view", "edit", "delete", "create"], "invoice-import": ["view", "create"], "vendors": ["view", "edit", "delete", "create"], "expenses": ["view", "edit", "delete", "create"], "calendar": ["view", "edit", "create", "delete"], "email-campaigns": ["view", "edit", "delete", "create"], "social-media": ["view", "edit", "create"], "analytics": ["view"], "reports": ["view", "create"], "dynamic-fields": ["view", "edit", "delete", "create"], "settings": ["view", "edit"], "menu-ordering": ["view", "edit"], "users": ["view", "edit", "delete", "create"], "roles": ["view", "edit", "delete", "create"], "whatsapp-messages": ["view", "create"], "whatsapp-setup": ["view", "edit"], "whatsapp-devices": ["view", "create", "edit", "delete"], "travel-search-b2c": ["view"], "travel-search-b2b": ["view"], "service-providers": ["view", "create", "edit", "delete"], "gst-settings": ["view", "edit"], "tasks": ["view", "create", "edit", "delete"], "support": ["view", "create"], "subscription": ["view", "edit"], "automation-workflows": ["view", "create", "edit", "delete"]}'::jsonb;
  enterprise_permissions JSONB := '{"dashboard": ["view"], "customers": ["view", "edit", "delete", "create"], "leads": ["view", "edit", "delete", "create"], "lead-types": ["view", "edit", "delete", "create"], "bookings": ["view", "edit", "delete", "create"], "packages": ["view", "edit", "delete", "create"], "invoices": ["view", "edit", "delete", "create"], "invoice-import": ["view", "create"], "vendors": ["view", "edit", "delete", "create"], "expenses": ["view", "edit", "delete", "create"], "calendar": ["view", "edit", "create", "delete"], "email-campaigns": ["view", "edit", "delete", "create"], "social-media": ["view", "edit", "create"], "analytics": ["view"], "reports": ["view", "create"], "dynamic-fields": ["view", "edit", "delete", "create"], "settings": ["view", "edit"], "menu-ordering": ["view", "edit"], "users": ["view", "edit", "delete", "create"], "roles": ["view", "edit", "delete", "create"], "whatsapp-messages": ["view", "create"], "whatsapp-setup": ["view", "edit"], "whatsapp-devices": ["view", "create", "edit", "delete"], "travel-search-b2c": ["view"], "travel-search-b2b": ["view"], "service-providers": ["view", "create", "edit", "delete"], "gst-settings": ["view", "edit"], "tasks": ["view", "create", "edit", "delete"], "support": ["view", "create"], "subscription": ["view", "edit"], "automation-workflows": ["view", "create", "edit", "delete"]}'::jsonb;
BEGIN
  -- Check if plans already exist, if so skip
  IF EXISTS (SELECT 1 FROM subscription_plans WHERE country = 'IN' LIMIT 1) THEN
    RAISE NOTICE 'India plans already exist, skipping...';
  ELSE
    -- India Plans (INR Currency)
    
    -- Basic Plan - India
    INSERT INTO subscription_plans (
      name, description, country, currency, monthly_price, yearly_price,
      max_users, max_customers, features, allowed_menu_items, allowed_pages,
      allowed_dashboard_widgets, allowed_page_permissions,
      free_trial_days, is_free_plan, is_active
    ) VALUES (
      'Basic Plan - India',
      'Perfect for small businesses getting started with CRM. Includes essential features for managing customers, leads, and bookings.',
      'IN',
      'INR',
      999.00,  -- Monthly: ₹999
      9999.00, -- Yearly: ₹9,999 (save ~17%)
      3,       -- Max 3 users
      100,     -- Max 100 customers
      basic_menu_items,
      basic_menu_items,
      basic_pages,
      basic_widgets,
      basic_permissions,
      7,       -- 7 days free trial
      false,
      true
    );
    
    -- Professional Plan - India
    INSERT INTO subscription_plans (
      name, description, country, currency, monthly_price, yearly_price,
      max_users, max_customers, features, allowed_menu_items, allowed_pages,
      allowed_dashboard_widgets, allowed_page_permissions,
      free_trial_days, is_free_plan, is_active
    ) VALUES (
      'Professional Plan - India',
      'Ideal for growing businesses. Includes advanced features like automation, analytics, WhatsApp integration, and unlimited access to all modules.',
      'IN',
      'INR',
      2999.00,  -- Monthly: ₹2,999
      29999.00, -- Yearly: ₹29,999 (save ~17%)
      10,       -- Max 10 users
      500,      -- Max 500 customers
      professional_menu_items,
      professional_menu_items,
      professional_pages,
      professional_widgets,
      professional_permissions,
      14,       -- 14 days free trial
      false,
      true
    );
    
    -- Enterprise Plan - India
    INSERT INTO subscription_plans (
      name, description, country, currency, monthly_price, yearly_price,
      max_users, max_customers, features, allowed_menu_items, allowed_pages,
      allowed_dashboard_widgets, allowed_page_permissions,
      free_trial_days, is_free_plan, is_active
    ) VALUES (
      'Enterprise Plan - India',
      'For large organizations requiring unlimited access, priority support, and all advanced features including automation workflows and custom integrations.',
      'IN',
      'INR',
      7999.00,  -- Monthly: ₹7,999
      79999.00, -- Yearly: ₹79,999 (save ~17%)
      -1,       -- Unlimited users
      -1,       -- Unlimited customers
      enterprise_menu_items,
      enterprise_menu_items,
      enterprise_pages,
      enterprise_widgets,
      enterprise_permissions,
      30,       -- 30 days free trial
      false,
      true
    );
    
    RAISE NOTICE 'India plans created successfully';
  END IF;
  
  -- Check if International plans already exist
  IF EXISTS (SELECT 1 FROM subscription_plans WHERE country = 'US' LIMIT 1) THEN
    RAISE NOTICE 'International plans already exist, skipping...';
  ELSE
    -- International Plans (USD Currency)
    
    -- Basic Plan - International
    INSERT INTO subscription_plans (
      name, description, country, currency, monthly_price, yearly_price,
      max_users, max_customers, features, allowed_menu_items, allowed_pages,
      allowed_dashboard_widgets, allowed_page_permissions,
      free_trial_days, is_free_plan, is_active
    ) VALUES (
      'Basic Plan',
      'Perfect for small businesses getting started with CRM. Includes essential features for managing customers, leads, and bookings.',
      'US',
      'USD',
      12.00,  -- Monthly: $12
      120.00, -- Yearly: $120 (save ~17%)
      3,      -- Max 3 users
      100,    -- Max 100 customers
      basic_menu_items,
      basic_menu_items,
      basic_pages,
      basic_widgets,
      basic_permissions,
      7,      -- 7 days free trial
      false,
      true
    );
    
    -- Professional Plan - International
    INSERT INTO subscription_plans (
      name, description, country, currency, monthly_price, yearly_price,
      max_users, max_customers, features, allowed_menu_items, allowed_pages,
      allowed_dashboard_widgets, allowed_page_permissions,
      free_trial_days, is_free_plan, is_active
    ) VALUES (
      'Professional Plan',
      'Ideal for growing businesses. Includes advanced features like automation, analytics, WhatsApp integration, and unlimited access to all modules.',
      'US',
      'USD',
      36.00,  -- Monthly: $36
      360.00, -- Yearly: $360 (save ~17%)
      10,     -- Max 10 users
      500,    -- Max 500 customers
      professional_menu_items,
      professional_menu_items,
      professional_pages,
      professional_widgets,
      professional_permissions,
      14,     -- 14 days free trial
      false,
      true
    );
    
    -- Enterprise Plan - International
    INSERT INTO subscription_plans (
      name, description, country, currency, monthly_price, yearly_price,
      max_users, max_customers, features, allowed_menu_items, allowed_pages,
      allowed_dashboard_widgets, allowed_page_permissions,
      free_trial_days, is_free_plan, is_active
    ) VALUES (
      'Enterprise Plan',
      'For large organizations requiring unlimited access, priority support, and all advanced features including automation workflows and custom integrations.',
      'US',
      'USD',
      96.00,  -- Monthly: $96
      960.00, -- Yearly: $960 (save ~17%)
      -1,     -- Unlimited users
      -1,     -- Unlimited customers
      enterprise_menu_items,
      enterprise_menu_items,
      enterprise_pages,
      enterprise_widgets,
      enterprise_permissions,
      30,     -- 30 days free trial
      false,
      true
    );
    
    RAISE NOTICE 'International plans created successfully';
  END IF;
END $$;


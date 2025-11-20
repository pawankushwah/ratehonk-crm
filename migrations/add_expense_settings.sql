-- Add expense settings columns to tenant_settings table
ALTER TABLE tenant_settings
ADD COLUMN IF NOT EXISTS expense_number_start INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS show_expense_tax BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_expense_vendor BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_expense_lead_type BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_expense_category BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_expense_subcategory BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_expense_payment_method BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_expense_payment_status BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_expense_notes BOOLEAN DEFAULT true;

COMMENT ON COLUMN tenant_settings.expense_number_start IS 'Starting number for expense numbering';
COMMENT ON COLUMN tenant_settings.show_expense_tax IS 'Show/hide tax field in expense form';
COMMENT ON COLUMN tenant_settings.show_expense_vendor IS 'Show/hide vendor field in expense form';
COMMENT ON COLUMN tenant_settings.show_expense_lead_type IS 'Show/hide lead type field in expense form';
COMMENT ON COLUMN tenant_settings.show_expense_category IS 'Show/hide category field in expense form';
COMMENT ON COLUMN tenant_settings.show_expense_subcategory IS 'Show/hide subcategory field in expense form';
COMMENT ON COLUMN tenant_settings.show_expense_payment_method IS 'Show/hide payment method field in expense form';
COMMENT ON COLUMN tenant_settings.show_expense_payment_status IS 'Show/hide payment status field in expense form';
COMMENT ON COLUMN tenant_settings.show_expense_notes IS 'Show/hide notes field in expense form';


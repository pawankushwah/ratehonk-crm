-- Add complete address fields to tenants table
-- These fields are used for invoice, estimate, and other documents

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country TEXT;

COMMENT ON COLUMN tenants.street_address IS 'Street address line(s)';
COMMENT ON COLUMN tenants.city IS 'City';
COMMENT ON COLUMN tenants.state IS 'State/Province';
COMMENT ON COLUMN tenants.zip_code IS 'ZIP/Postal code';
COMMENT ON COLUMN tenants.country IS 'Country';

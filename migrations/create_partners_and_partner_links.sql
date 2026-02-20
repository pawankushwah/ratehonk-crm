-- Partners table (CRM selling partners)
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    address TEXT,
    commission_type TEXT DEFAULT 'percentage',  -- 'percentage' or 'fixed'
    commission_value DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partners_contact_email ON partners(contact_email);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);

-- Add partner_id to tenants (nullable - tenants created by partner have this set)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_partner_id ON tenants(partner_id);

-- Add partner_id to users (for partner login - users with role='partner')
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);

-- Add minimum_subscription_price to partners (tenants cannot create subscription below this amount)
ALTER TABLE partners ADD COLUMN IF NOT EXISTS minimum_subscription_price DECIMAL(10, 2) DEFAULT NULL;

-- Add partner_id to subscription_plans (nullable - null = SaaS owner/global plan, set = partner-specific plan)
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_subscription_plans_partner_id ON subscription_plans(partner_id);

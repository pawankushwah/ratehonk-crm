-- Enhanced Campaign Schema for Multi-Channel Campaign Management
-- This migration enhances the existing email_campaigns table and adds supporting tables

-- 1. Enhance email_campaigns table with new fields
DO $$
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'channel') THEN
        ALTER TABLE email_campaigns ADD COLUMN channel TEXT DEFAULT 'email' NOT NULL;
        -- channel: 'email', 'sms', 'whatsapp', 'multi_channel'
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'objective') THEN
        ALTER TABLE email_campaigns ADD COLUMN objective TEXT;
        -- objective: 'lead_generation', 'package_promotion', 'seasonal_offers', 'abandoned_inquiry', 'post_booking_upsell', 'feedback_reviews'
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'owner_id') THEN
        ALTER TABLE email_campaigns ADD COLUMN owner_id INTEGER REFERENCES users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'internal_notes') THEN
        ALTER TABLE email_campaigns ADD COLUMN internal_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'from_name') THEN
        ALTER TABLE email_campaigns ADD COLUMN from_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'from_email') THEN
        ALTER TABLE email_campaigns ADD COLUMN from_email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'reply_to') THEN
        ALTER TABLE email_campaigns ADD COLUMN reply_to TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'template_id') THEN
        ALTER TABLE email_campaigns ADD COLUMN template_id INTEGER REFERENCES email_templates(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'segment_id') THEN
        ALTER TABLE email_campaigns ADD COLUMN segment_id INTEGER REFERENCES email_segments(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'personalization_tokens') THEN
        ALTER TABLE email_campaigns ADD COLUMN personalization_tokens JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'timezone') THEN
        ALTER TABLE email_campaigns ADD COLUMN timezone TEXT DEFAULT 'UTC';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'delivered_count') THEN
        ALTER TABLE email_campaigns ADD COLUMN delivered_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'failed_count') THEN
        ALTER TABLE email_campaigns ADD COLUMN failed_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'reply_count') THEN
        ALTER TABLE email_campaigns ADD COLUMN reply_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'conversion_count') THEN
        ALTER TABLE email_campaigns ADD COLUMN conversion_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'revenue_generated') THEN
        ALTER TABLE email_campaigns ADD COLUMN revenue_generated DECIMAL(10, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'cost') THEN
        ALTER TABLE email_campaigns ADD COLUMN cost DECIMAL(10, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_campaigns' AND column_name = 'completed_at') THEN
        ALTER TABLE email_campaigns ADD COLUMN completed_at TIMESTAMP;
    END IF;

    RAISE NOTICE 'Enhanced email_campaigns table with new columns';
END $$;

-- 2. Create campaign_recipients table for tracking individual sends
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL, -- 'lead', 'customer', 'contact'
    recipient_id INTEGER NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked', 'replied', 'unsubscribed'
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    replied_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_tenant_id ON campaign_recipients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_recipient ON campaign_recipients(recipient_type, recipient_id);

-- 3. Create campaign_links table for click tracking
CREATE TABLE IF NOT EXISTS campaign_links (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    short_url TEXT,
    click_count INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_links_campaign_id ON campaign_links(campaign_id);

-- 4. Create campaign_link_clicks table for detailed click tracking
CREATE TABLE IF NOT EXISTS campaign_link_clicks (
    id SERIAL PRIMARY KEY,
    link_id INTEGER NOT NULL REFERENCES campaign_links(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES campaign_recipients(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP DEFAULT NOW() NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_campaign_link_clicks_link_id ON campaign_link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_campaign_link_clicks_recipient_id ON campaign_link_clicks(recipient_id);

-- 5. Create campaign_automations table for drip campaigns
CREATE TABLE IF NOT EXISTS campaign_automations (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL, -- 'new_lead', 'inquiry_not_responded', 'booking_confirmation', 'pre_travel_reminder', 'post_travel_feedback'
    trigger_conditions JSONB DEFAULT '{}',
    campaign_sequence JSONB NOT NULL, -- Array of campaigns with delays
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_automations_tenant_id ON campaign_automations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_automations_trigger_type ON campaign_automations(trigger_type);

-- 6. Create campaign_compliance table for opt-in/opt-out tracking
CREATE TABLE IF NOT EXISTS campaign_compliance (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL,
    recipient_id INTEGER NOT NULL,
    channel TEXT NOT NULL, -- 'email', 'sms', 'whatsapp'
    consent_status TEXT NOT NULL, -- 'opted_in', 'opted_out', 'pending'
    consent_source TEXT, -- 'website', 'form', 'manual', 'import'
    consent_timestamp TIMESTAMP,
    opt_out_timestamp TIMESTAMP,
    opt_out_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(tenant_id, recipient_type, recipient_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_campaign_compliance_tenant_id ON campaign_compliance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_compliance_recipient ON campaign_compliance(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_campaign_compliance_channel ON campaign_compliance(channel);
CREATE INDEX IF NOT EXISTS idx_campaign_compliance_status ON campaign_compliance(consent_status);

-- 7. Create campaign_analytics table for aggregated metrics
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    replied_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(campaign_id, date)
);

CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_date ON campaign_analytics(date);

RAISE NOTICE 'Campaign schema enhancement completed';


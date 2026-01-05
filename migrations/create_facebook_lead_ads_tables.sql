-- Migration for Facebook Lead Ads Integration
-- Creates tables needed for OAuth state management and integration tracking

-- Integration OAuth States table (for CSRF protection during OAuth flow)
CREATE TABLE IF NOT EXISTS integration_oauth_states (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  integration_name TEXT NOT NULL DEFAULT 'facebook-lead-ads',
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT,
  redirect_uri TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Create index on state for fast lookups
CREATE INDEX IF NOT EXISTS idx_integration_oauth_states_state ON integration_oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_integration_oauth_states_tenant ON integration_oauth_states(tenant_id, integration_name);

-- Add comment
COMMENT ON TABLE integration_oauth_states IS 'Temporary storage for OAuth state tokens to prevent CSRF attacks';


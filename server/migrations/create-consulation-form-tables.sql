-- Create consulation_form_templates table
CREATE TABLE IF NOT EXISTS consulation_form_templates (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fields JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create consulation_form_submissions table
CREATE TABLE IF NOT EXISTS consulation_form_submissions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  form_fields JSONB NOT NULL,
  responses JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_consulation_form_templates_tenant_id ON consulation_form_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consulation_form_submissions_tenant_id ON consulation_form_submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consulation_form_submissions_customer_id ON consulation_form_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_consulation_form_submissions_created_at ON consulation_form_submissions(created_at);


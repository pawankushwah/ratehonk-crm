-- Support Tickets and Messages
-- Full support ticket system for tenant-to-SaaS-owner communication

-- SaaS/Platform settings (support email, etc.)
CREATE TABLE IF NOT EXISTS saas_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  company_name TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS support_tickets_tenant_id ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_created_at ON support_tickets(created_at DESC);

-- Support ticket messages (conversation thread)
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'tenant' | 'saas_owner'
  sender_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sender_email TEXT,
  sender_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);

-- Insert default support email key (SaaS owner can update via settings)
INSERT INTO saas_settings (key, value) VALUES ('support_email', '')
ON CONFLICT (key) DO NOTHING;

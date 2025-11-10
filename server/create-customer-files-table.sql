-- Create customer_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_files (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(20) NOT NULL, -- image, document, video, file
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL, -- Size in bytes
  object_path TEXT NOT NULL, -- Path in object storage
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  tags JSONB DEFAULT '[]'::jsonb, -- Tags for categorization
  description TEXT, -- Optional description
  is_public BOOLEAN NOT NULL DEFAULT false, -- Public/private access
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_files_customer_id ON customer_files(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_files_tenant_id ON customer_files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_files_uploaded_by ON customer_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_customer_files_created_at ON customer_files(created_at);


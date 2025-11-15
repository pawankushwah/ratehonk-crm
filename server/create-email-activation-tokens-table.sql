-- Create email_activation_tokens table for email activation on registration
-- This table stores activation tokens sent to users during registration

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS email_activation_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 2: Add foreign key constraint (only if users table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_email_activation_tokens_user_id'
      AND table_name = 'email_activation_tokens'
    ) THEN
      ALTER TABLE email_activation_tokens
      ADD CONSTRAINT fk_email_activation_tokens_user_id
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Step 3: Create indexes (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_activation_tokens') THEN
    -- Index on user_id for faster lookups
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_email_activation_tokens_user_id'
    ) THEN
      CREATE INDEX idx_email_activation_tokens_user_id ON email_activation_tokens(user_id);
    END IF;
    
    -- Index on token for verification lookups
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_email_activation_tokens_token'
    ) THEN
      CREATE INDEX idx_email_activation_tokens_token ON email_activation_tokens(token);
    END IF;
    
    -- Index on expires_at for cleanup queries
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_email_activation_tokens_expires_at'
    ) THEN
      CREATE INDEX idx_email_activation_tokens_expires_at ON email_activation_tokens(expires_at);
    END IF;
  END IF;
END $$;

-- Step 4: Verify table was created
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_activation_tokens')
    THEN 'email_activation_tokens table created successfully!'
    ELSE 'ERROR: email_activation_tokens table was NOT created!'
  END as status;


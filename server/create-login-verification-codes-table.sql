-- Create login_verification_codes table for email verification on every login
-- This table stores 6-digit verification codes sent to users during login

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS login_verification_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 2: Add foreign key constraint (only if users table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_login_verification_codes_user_id'
      AND table_name = 'login_verification_codes'
    ) THEN
      ALTER TABLE login_verification_codes
      ADD CONSTRAINT fk_login_verification_codes_user_id
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Step 3: Create indexes (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'login_verification_codes') THEN
    -- Index on user_id for faster lookups
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_login_verification_codes_user_id'
    ) THEN
      CREATE INDEX idx_login_verification_codes_user_id ON login_verification_codes(user_id);
    END IF;
    
    -- Index on code for verification lookups
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_login_verification_codes_code'
    ) THEN
      CREATE INDEX idx_login_verification_codes_code ON login_verification_codes(code);
    END IF;
    
    -- Index on expires_at for cleanup queries
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_login_verification_codes_expires_at'
    ) THEN
      CREATE INDEX idx_login_verification_codes_expires_at ON login_verification_codes(expires_at);
    END IF;
  END IF;
END $$;

-- Step 4: Verify table was created
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'login_verification_codes')
    THEN 'login_verification_codes table created successfully!'
    ELSE 'ERROR: login_verification_codes table was NOT created!'
  END as status;

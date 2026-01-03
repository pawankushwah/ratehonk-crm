-- Create email_verification_otps table for storing OTP codes
CREATE TABLE IF NOT EXISTS email_verification_otps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_user_id ON email_verification_otps(user_id);

-- Create index on otp for faster verification
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_otp ON email_verification_otps(otp);

-- Create index on expires_at to help with cleanup of expired OTPs
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_expires_at ON email_verification_otps(expires_at);


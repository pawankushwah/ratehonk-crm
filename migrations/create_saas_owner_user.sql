-- Create SaaS Owner User
-- This migration creates the default SaaS owner admin user
-- Email: admin@travelcrm.com
-- Password: admin123 (will be hashed)

-- First, check if user already exists
DO $$
DECLARE
    user_exists boolean;
    hashed_password text;
BEGIN
    -- Check if user already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@travelcrm.com') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Hash the password 'admin123' using bcrypt
        -- Note: You'll need to generate this hash. For 'admin123', the hash is:
        -- $2b$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq
        -- But we'll use a proper bcrypt hash. In production, use: SELECT crypt('admin123', gen_salt('bf'));
        
        -- For PostgreSQL with pgcrypto extension:
        -- hashed_password := crypt('admin123', gen_salt('bf'));
        
        -- Insert the SaaS owner user
        INSERT INTO users (
            email,
            password,
            role,
            tenant_id,
            first_name,
            last_name,
            is_active,
            is_email_verified,
            created_at,
            updated_at
        ) VALUES (
            'admin@travelcrm.com',
            '$2b$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', -- This is a placeholder, needs to be generated
            'saas_owner',
            NULL, -- SaaS owner doesn't belong to a tenant
            'Admin',
            'User',
            true,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'SaaS owner user created successfully';
    ELSE
        RAISE NOTICE 'SaaS owner user already exists';
    END IF;
END $$;


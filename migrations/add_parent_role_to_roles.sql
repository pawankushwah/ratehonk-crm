-- Migration: Add parent_role_id and hierarchy_level to roles table for role hierarchy
-- Date: 2024
-- Description: Adds parent_role_id and hierarchy_level columns to roles table to support role hierarchy

-- Add hierarchy_level column if it doesn't exist
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 0;

-- Add parent_role_id column if it doesn't exist
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS parent_role_id INTEGER;

-- Add foreign key constraint (self-referencing)
DO $$
BEGIN
    -- Check if foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'roles_parent_role_id_fkey' 
        AND table_name = 'roles'
    ) THEN
        ALTER TABLE roles 
        ADD CONSTRAINT roles_parent_role_id_fkey 
        FOREIGN KEY (parent_role_id) 
        REFERENCES roles(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_roles_parent_role_id 
ON roles(parent_role_id);

-- Add index for hierarchy_level
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy_level 
ON roles(hierarchy_level);

-- Add comments to the columns
COMMENT ON COLUMN roles.parent_role_id IS 'References roles.id - creates role hierarchy structure';
COMMENT ON COLUMN roles.hierarchy_level IS 'Lower number = higher in hierarchy (0 = Owner, 1 = Manager, 2 = Supervisor, 3 = Sales Rep)';

-- Update hierarchy_level for existing roles if needed
-- This ensures roles without a parent have hierarchy_level = 0
UPDATE roles 
SET hierarchy_level = 0
WHERE hierarchy_level IS NULL;


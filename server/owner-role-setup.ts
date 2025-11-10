// Owner Role Setup for Tenant Registration
import { sql } from './db';

// Full owner permissions for all system modules
export const OWNER_PERMISSIONS = {
  dashboard: ["view"],
  customers: ["view", "edit", "create", "delete"],
  leads: ["view", "edit", "create", "delete"],
  bookings: ["view", "edit", "create", "delete"],
  packages: ["view", "edit", "create", "delete"],
  invoices: ["view", "edit", "create", "delete"],
  reports: ["view"],
  settings: ["view", "edit"],
  users: ["view", "edit", "create", "delete"],
  roles: ["view", "edit", "create", "delete"],
  "email-campaigns": ["view", "edit", "create", "delete"],
  "email-automations": ["view", "edit", "create", "delete"],
  "dynamic-fields": ["view", "edit", "create", "delete"],
  "menu-ordering": ["view", "edit"],
  automation: ["view", "edit", "create", "delete"],
  subscription: ["view", "edit"]
};

/**
 * Creates the default Owner role for a new tenant
 * This should be called during tenant registration
 */
export async function createOwnerRoleForTenant(tenantId: number): Promise<number> {
  try {
    console.log(`🎭 Creating Owner role for tenant ${tenantId}`);
    
    const [ownerRole] = await sql`
      INSERT INTO roles (tenant_id, name, description, permissions, is_active, is_default, created_at, updated_at)
      VALUES (
        ${tenantId},
        'Owner',
        'Full system access with all permissions - automatically created during registration',
        ${JSON.stringify(OWNER_PERMISSIONS)},
        true,
        true,
        NOW(),
        NOW()
      )
      RETURNING id, name, permissions
    `;
    
    console.log(`✅ Owner role created with ID: ${ownerRole.id}`);
    return ownerRole.id;
  } catch (error) {
    console.error(`❌ Failed to create Owner role for tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Assigns the owner role to a user during registration
 * This ensures the tenant admin automatically gets full permissions
 */
export async function assignOwnerRoleToUser(userId: number, tenantId: number): Promise<void> {
  try {
    console.log(`👑 Assigning Owner role to user ${userId} in tenant ${tenantId}`);
    
    // Get or create the owner role for this tenant
    let ownerRoleId: number;
    
    const [existingOwnerRole] = await sql`
      SELECT id FROM roles 
      WHERE tenant_id = ${tenantId} AND name = 'Owner' AND is_default = true
      LIMIT 1
    `;
    
    if (existingOwnerRole) {
      ownerRoleId = existingOwnerRole.id;
      console.log(`🔍 Found existing Owner role: ${ownerRoleId}`);
    } else {
      ownerRoleId = await createOwnerRoleForTenant(tenantId);
    }
    
    // Update the user to have the owner role
    await sql`
      UPDATE users 
      SET role_id = ${ownerRoleId}, updated_at = NOW()
      WHERE id = ${userId}
    `;
    
    console.log(`✅ User ${userId} assigned Owner role ${ownerRoleId}`);
  } catch (error) {
    console.error(`❌ Failed to assign Owner role to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Ensures all existing tenant admins have owner roles
 * This is for migrating existing tenants
 */
export async function ensureAllTenantsHaveOwnerRoles(): Promise<void> {
  try {
    console.log(`🔧 Ensuring all existing tenants have Owner roles...`);
    
    const tenantAdmins = await sql`
      SELECT DISTINCT u.id as user_id, u.tenant_id, u.email
      FROM users u
      WHERE u.role = 'tenant_admin' 
      AND u.is_active = true
      AND u.tenant_id IS NOT NULL
    `;
    
    console.log(`🔍 Found ${tenantAdmins.length} tenant admins to process`);
    
    for (const admin of tenantAdmins) {
      await assignOwnerRoleToUser(admin.user_id, admin.tenant_id);
    }
    
    console.log(`✅ All tenant admins now have Owner roles`);
  } catch (error) {
    console.error(`❌ Failed to ensure Owner roles for all tenants:`, error);
    throw error;
  }
}
/**
 * Script to update existing Owner roles with all permissions
 * This includes all dashboard widgets and page permissions
 */

import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/crm_ratehonk';

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

async function updateOwnerRoles() {
  try {
    console.log('🔄 Starting Owner role permissions update...');
    
    // Generate all permissions - includes all dashboard widgets and page permissions
    // This matches the MENU_ITEMS structure from shared/permissions.ts
    const ownerPermissions = {
      // Dashboard page
      dashboard: ["view"],
      // Dashboard widgets
      "dashboard.revenue": ["view"],
      "dashboard.bookings": ["view"],
      "dashboard.customers": ["view"],
      "dashboard.leads": ["view"],
      "dashboard.revenue-chart": ["view"],
      "dashboard.profit-loss": ["view"],
      "dashboard.expense-chart": ["view"],
      "dashboard.service-booking": ["view"],
      "dashboard.service-provider": ["view"],
      "dashboard.vendor-booking": ["view"],
      "dashboard.invoice-status": ["view"],
      "dashboard.marketing-seo": ["view"],
      "dashboard.sidebar-followups": ["view"],
      "dashboard.sidebar-customers": ["view"],
      "dashboard.sidebar-bookings": ["view"],
      "dashboard.sidebar-contacts": ["view"],
      // Page permissions
      customers: ["view", "edit", "delete", "create"],
      leads: ["view", "edit", "delete", "create"],
      "lead-types": ["view", "edit", "delete", "create"],
      bookings: ["view", "edit", "delete", "create"],
      packages: ["view", "edit", "delete", "create"],
      invoices: ["view", "edit", "delete", "create"],
      "invoice-import": ["view", "create"],
      vendors: ["view", "edit", "delete", "create"],
      expenses: ["view", "edit", "delete", "create"],
      calendar: ["view", "edit", "create", "delete"],
      "email-campaigns": ["view", "edit", "delete", "create"],
      "social-media": ["view", "edit", "create"],
      analytics: ["view"],
      reports: ["view", "create"],
      "dynamic-fields": ["view", "edit", "delete", "create"],
      settings: ["view", "edit"],
      "menu-ordering": ["view", "edit"],
      users: ["view", "edit", "delete", "create"],
      roles: ["view", "edit", "delete", "create"],
      "whatsapp-messages": ["view", "create"],
      "whatsapp-setup": ["view", "edit"],
      "whatsapp-devices": ["view", "create", "edit", "delete"],
      "travel-search-b2c": ["view"],
      "travel-search-b2b": ["view"],
      "service-providers": ["view", "create", "edit", "delete"],
      "gst-settings": ["view", "edit"],
      tasks: ["view", "create", "edit", "delete"],
      support: ["view", "create"],
      subscription: ["view", "edit"],
      "automation-workflows": ["view", "create", "edit", "delete"]
    };
    
    console.log(`✅ Generated permissions for ${Object.keys(ownerPermissions).length} permission keys`);
    console.log('📋 Permission keys:', Object.keys(ownerPermissions).join(', '));
    
    // Update all Owner roles (is_default = true or name = 'Owner')
    const result = await sql`
      UPDATE roles
      SET 
        permissions = ${JSON.stringify(ownerPermissions)}::jsonb,
        updated_at = NOW()
      WHERE 
        (is_default = true OR name = 'Owner')
        AND tenant_id IS NOT NULL
      RETURNING id, tenant_id, name, is_default
    `;
    
    console.log(`✅ Updated ${result.length} Owner role(s):`);
    result.forEach(role => {
      console.log(`   - Role ID: ${role.id}, Tenant ID: ${role.tenant_id}, Name: ${role.name}, Is Default: ${role.is_default}`);
    });
    
    if (result.length === 0) {
      console.log('⚠️  No Owner roles found to update');
    }
    
    console.log('✅ Owner role permissions update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating Owner roles:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
updateOwnerRoles()
  .then(() => {
    console.log('✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });


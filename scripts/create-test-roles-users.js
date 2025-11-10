// Test script to create sample roles and users with different permission levels
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Sample role configurations
const testRoles = [
  {
    name: "Sales Manager",
    description: "Can manage customers, leads, and bookings but limited reporting access",
    permissions: {
      dashboard: ["view"],
      customers: ["view", "edit", "create"],
      leads: ["view", "edit", "create", "delete"],
      "lead-types": ["view"],
      bookings: ["view", "edit", "create"],
      packages: ["view"],
      invoices: ["view", "edit"],
      calendar: ["view", "edit", "create"],
      "email-campaigns": ["view", "create"],
      analytics: ["view"],
      reports: ["view"]
    }
  },
  {
    name: "Customer Support",
    description: "View-only access to customer data and limited booking management",
    permissions: {
      dashboard: ["view"],
      customers: ["view", "edit"],
      leads: ["view"],
      bookings: ["view", "edit"],
      packages: ["view"],
      invoices: ["view"],
      calendar: ["view"],
      "email-campaigns": ["view"]
    }
  },
  {
    name: "Marketing Specialist",
    description: "Full access to marketing tools, limited access to customer data",
    permissions: {
      dashboard: ["view"],
      customers: ["view"],
      leads: ["view", "edit", "create"],
      "lead-types": ["view", "edit", "create"],
      "email-campaigns": ["view", "edit", "create", "delete"],
      "social-media": ["view", "edit", "create"],
      analytics: ["view"],
      reports: ["view", "create"]
    }
  }
];

// Sample users to create
const testUsers = [
  {
    email: "sales.manager@test.com",
    firstName: "Sarah",
    lastName: "Johnson",
    phone: "+1-555-0101",
    roleName: "Sales Manager"
  },
  {
    email: "support.agent@test.com", 
    firstName: "Mike",
    lastName: "Chen",
    phone: "+1-555-0102",
    roleName: "Customer Support"
  },
  {
    email: "marketing.lead@test.com",
    firstName: "Emma",
    lastName: "Davis", 
    phone: "+1-555-0103",
    roleName: "Marketing Specialist"
  }
];

async function createTestRolesAndUsers() {
  const client = await pool.connect();
  
  try {
    console.log("🔧 Creating test roles and users...");
    
    // Use tenant ID 10 (Kapido Travel)
    const tenantId = 10;
    
    // Create test roles
    const roleMap = new Map();
    
    for (const role of testRoles) {
      const result = await client.query(`
        INSERT INTO roles (tenant_id, name, description, permissions, is_active, is_default)
        VALUES ($1, $2, $3, $4, true, false)
        RETURNING id
      `, [tenantId, role.name, role.description, JSON.stringify(role.permissions)]);
      
      roleMap.set(role.name, result.rows[0].id);
      console.log(`✅ Created role: ${role.name} (ID: ${result.rows[0].id})`);
    }
    
    // Create test users
    for (const user of testUsers) {
      const roleId = roleMap.get(user.roleName);
      
      if (!roleId) {
        console.log(`❌ Role ${user.roleName} not found for user ${user.email}`);
        continue;
      }
      
      // Generate a simple temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      const result = await client.query(`
        INSERT INTO users (
          email, first_name, last_name, phone, password, 
          role, tenant_id, role_id, is_active, is_email_verified
        )
        VALUES ($1, $2, $3, $4, $5, 'tenant_user', $6, $7, true, true)
        RETURNING id
      `, [
        user.email, user.firstName, user.lastName, user.phone, 
        hashedPassword, tenantId, roleId
      ]);
      
      console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Role: ${user.roleName}, Password: ${tempPassword}`);
    }
    
    console.log("\n🎉 Test roles and users created successfully!");
    console.log("\nTest Accounts:");
    console.log("sales.manager@test.com - Sales Manager role");
    console.log("support.agent@test.com - Customer Support role"); 
    console.log("marketing.lead@test.com - Marketing Specialist role");
    console.log("\nNote: Check console output above for temporary passwords");
    
  } catch (error) {
    console.error("❌ Error creating test data:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createTestRolesAndUsers();
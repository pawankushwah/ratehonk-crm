import postgres from 'postgres';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get DATABASE_URL from environment (with fallback for development)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/crm_ratehonk';

const TENANT_ID = 45;
const DEFAULT_PASSWORD = 'Test@123'; // Same password for all users

async function createTestUsers() {
  let sql;
  
  try {
    // Connect to database
    sql = postgres(DATABASE_URL, {
      ssl: 'require',
      max: 1,
    });

    console.log('📊 Connected to database');
    console.log(`🔍 Fetching roles for tenant ${TENANT_ID}...`);
    
    // Get all roles for tenant 45
    const roles = await sql`
      SELECT id, name, description
      FROM roles
      WHERE tenant_id = ${TENANT_ID} AND (is_active = true OR is_default = true)
      ORDER BY hierarchy_level, name
    `;
    
    console.log(`✅ Found ${roles.length} roles:`, roles.map(r => r.name).join(', '));
    
    if (roles.length === 0) {
      console.log('⚠️ No roles found for tenant', TENANT_ID);
      return;
    }
    
    // Hash password once for all users
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    console.log('✅ Password hashed');
    
    const createdUsers = [];
    
    // Create a user for each role
    for (const role of roles) {
      const email = `test_${role.name.toLowerCase().replace(/\s+/g, '_')}@test.com`;
      const firstName = role.name.split(' ')[0] || 'Test';
      const lastName = role.name.split(' ').slice(1).join(' ') || 'User';
      
      // Check if user already exists
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email} AND tenant_id = ${TENANT_ID}
      `;
      
      if (existingUser.length > 0) {
        console.log(`⏭️  User ${email} already exists, skipping...`);
        continue;
      }
      
      // Create user
      const [user] = await sql`
        INSERT INTO users (
          tenant_id,
          email,
          password,
          first_name,
          last_name,
          role_id,
          role,
          is_active,
          is_email_verified,
          password_reset_required,
          created_at,
          updated_at
        ) VALUES (
          ${TENANT_ID},
          ${email},
          ${hashedPassword},
          ${firstName},
          ${lastName},
          ${role.id},
          'tenant_user',
          true,
          true,
          true,
          NOW(),
          NOW()
        )
        RETURNING id, email, first_name, last_name
      `;
      
      createdUsers.push({
        ...user,
        roleName: role.name,
        password: DEFAULT_PASSWORD
      });
      
      console.log(`✅ Created user: ${user.email} (${user.first_name} ${user.last_name}) - Role: ${role.name}`);
    }
    
    console.log('\n📋 Summary:');
    console.log(`✅ Created ${createdUsers.length} users for tenant ${TENANT_ID}`);
    console.log(`\n📝 User Credentials (Password for all: ${DEFAULT_PASSWORD}):`);
    createdUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.first_name} ${user.last_name}) - Role: ${user.roleName}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

// Run the script
createTestUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });


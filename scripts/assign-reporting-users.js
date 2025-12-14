import postgres from 'postgres';
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

async function assignReportingUsers() {
  let sql;
  
  try {
    // Connect to database
    sql = postgres(DATABASE_URL, {
      ssl: 'require',
      max: 1,
    });

    console.log('📊 Connected to database');
    console.log(`🔍 Fetching roles and users for tenant ${TENANT_ID}...`);
    
    // Get all roles with their parent roles
    const roles = await sql`
      SELECT id, name, parent_role_id, hierarchy_level
      FROM roles
      WHERE tenant_id = ${TENANT_ID} AND (is_active = true OR is_default = true)
      ORDER BY hierarchy_level, name
    `;
    
    console.log(`✅ Found ${roles.length} roles`);
    
    // Get all users
    const users = await sql`
      SELECT id, email, first_name, last_name, role_id, reporting_user_id
      FROM users
      WHERE tenant_id = ${TENANT_ID} AND is_active = true
      ORDER BY role_id
    `;
    
    console.log(`✅ Found ${users.length} users`);
    
    // Create a map of role_id -> users with that role
    const usersByRole = new Map();
    users.forEach(user => {
      if (!usersByRole.has(user.role_id)) {
        usersByRole.set(user.role_id, []);
      }
      usersByRole.get(user.role_id).push(user);
    });
    
    // Create a map of role_id -> role object
    const roleMap = new Map();
    roles.forEach(role => {
      roleMap.set(role.id, role);
    });
    
    const assignments = [];
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each user
    for (const user of users) {
      const userRole = roleMap.get(user.role_id);
      
      if (!userRole) {
        console.log(`⚠️  User ${user.email} has invalid role_id: ${user.role_id}`);
        skippedCount++;
        continue;
      }
      
      // Skip if user already has a reporting user assigned
      if (user.reporting_user_id) {
        console.log(`⏭️  User ${user.email} already has reporting user assigned, skipping...`);
        skippedCount++;
        continue;
      }
      
      // Skip if role has no parent (top-level roles)
      if (!userRole.parent_role_id) {
        console.log(`⏭️  User ${user.email} (${userRole.name}) has no parent role, skipping...`);
        skippedCount++;
        continue;
      }
      
      // Find users with the parent role
      const parentRoleUsers = usersByRole.get(userRole.parent_role_id) || [];
      
      if (parentRoleUsers.length === 0) {
        console.log(`⚠️  No users found with parent role (ID: ${userRole.parent_role_id}) for user ${user.email}`);
        skippedCount++;
        continue;
      }
      
      // Assign the first available user with the parent role as reporting user
      // If there are multiple, we'll assign them round-robin style
      const parentRole = roleMap.get(userRole.parent_role_id);
      const reportingUser = parentRoleUsers[0]; // Use first user with parent role
      
      // Update user's reporting_user_id
      await sql`
        UPDATE users
        SET reporting_user_id = ${reportingUser.id}, updated_at = NOW()
        WHERE id = ${user.id}
      `;
      
      assignments.push({
        user: `${user.first_name} ${user.last_name} (${user.email})`,
        userRole: userRole.name,
        reportingUser: `${reportingUser.first_name} ${reportingUser.last_name} (${reportingUser.email})`,
        reportingRole: parentRole.name
      });
      
      updatedCount++;
      console.log(`✅ Assigned ${reportingUser.first_name} ${reportingUser.last_name} (${parentRole.name}) as reporting user for ${user.first_name} ${user.last_name} (${userRole.name})`);
    }
    
    console.log('\n📋 Summary:');
    console.log(`✅ Updated ${updatedCount} users`);
    console.log(`⏭️  Skipped ${skippedCount} users`);
    console.log('\n📝 Reporting User Assignments:');
    assignments.forEach(assignment => {
      console.log(`   - ${assignment.user}`);
      console.log(`     Role: ${assignment.userRole}`);
      console.log(`     Reports to: ${assignment.reportingUser}`);
      console.log(`     Reporting Role: ${assignment.reportingRole}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error assigning reporting users:', error);
    throw error;
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

// Run the script
assignReportingUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });


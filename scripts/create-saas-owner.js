import postgres from 'postgres';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get DATABASE_URL from environment (with fallback for development)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/ratehonk_crm';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function createSaasOwner() {
  let sql;
  try {
    // Connect to database
    const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
    const isNeon = DATABASE_URL.includes('neon.tech');
    
    sql = postgres(DATABASE_URL, {
      ssl: isLocalhost ? false : (isNeon ? { rejectUnauthorized: false } : 'require'),
      max: 1,
    });

    console.log('📊 Connected to database');
    console.log('🔧 Creating SaaS owner user...');

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = 'admin@travelcrm.com'
    `;

    if (existingUsers.length > 0) {
      console.log('✅ SaaS owner user already exists!');
      console.log('   Email: admin@travelcrm.com');
      console.log('   User ID:', existingUsers[0].id);
      await sql.end();
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔐 Password hashed successfully');

    // Create the SaaS owner user
    const [newUser] = await sql`
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
      )
      VALUES (
        'admin@travelcrm.com',
        ${hashedPassword},
        'saas_owner',
        NULL,
        'Admin',
        'User',
        true,
        true,
        NOW(),
        NOW()
      )
      RETURNING id, email, role, first_name, last_name
    `;

    console.log('✅ SaaS owner user created successfully!');
    console.log('   User ID:', newUser.id);
    console.log('   Email:', newUser.email);
    console.log('   Role:', newUser.role);
    console.log('   Name:', `${newUser.first_name} ${newUser.last_name}`);
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@travelcrm.com');
    console.log('   Password: admin123');
    console.log('\n🌐 Login URL: http://localhost:5000/saas/login');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating SaaS owner user:', error);
    if (sql) await sql.end();
    process.exit(1);
  }
}

createSaasOwner();


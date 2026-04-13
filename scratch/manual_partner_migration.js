import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function migrate() {
  try {
    console.log('🚀 Starting manual migration for partner infrastructure...');

    // 1. Create Partners table
    console.log('Creating partners table...');
    await sql`
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        company_name TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        contact_phone TEXT,
        address TEXT,
        commission_type TEXT DEFAULT 'percentage',
        commission_value DECIMAL(10, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_partners_contact_email ON partners(contact_email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active)`;

    // 2. Add partner_id to tenants
    console.log('Adding partner_id to tenants...');
    await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tenants_partner_id ON tenants(partner_id)`;

    // 3. Add partner_id to users
    console.log('Adding partner_id to users...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id)`;

    // 4. Add partner_id to subscription_plans
    console.log('Adding partner_id to subscription_plans...');
    await sql`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_subscription_plans_partner_id ON subscription_plans(partner_id)`;

    console.log('✅ Manual migration completed successfully!');
    await sql.end();
  } catch (err) {
    console.error('❌ Manual migration failed:', err);
    process.exit(1);
  }
}

migrate();

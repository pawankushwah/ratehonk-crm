import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function check() {
  try {
    const tenants = await sql`SELECT id, company_name FROM tenants`;
    const users = await sql`SELECT id, email, role, tenant_id FROM users`;
    const subs = await sql`SELECT * FROM tenant_subscriptions`;
    const plans = await sql`SELECT id, name, is_free_plan FROM subscription_plans`;
    
    console.log(JSON.stringify({ tenants, users, subs, plans }, null, 2));
    await sql.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();

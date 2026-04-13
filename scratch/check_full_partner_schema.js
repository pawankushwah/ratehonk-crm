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
    const tables = ['tenants', 'users', 'subscription_plans', 'partners'];
    const results = {};
    
    for (const table of tables) {
      const cols = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${table}
      `;
      results[table] = cols;
    }
    
    console.log(JSON.stringify(results, null, 2));
    await sql.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();

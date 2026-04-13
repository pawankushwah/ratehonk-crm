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
    console.log('🔍 Final verification of partner infrastructure...');
    
    const results = {};
    const tables = ['tenants', 'users', 'subscription_plans', 'partners'];
    
    for (const table of tables) {
      const cols = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${table}
      `;
      results[table] = cols.map(c => c.column_name);
    }
    
    console.log('Columns per table:');
    for (const [table, cols] of Object.entries(results)) {
      console.log(`${table}: ${cols.includes('partner_id') ? '✅ partner_id present' : '❌ partner_id MISSING'}`);
      if (table === 'partners') {
        console.log(`Partners table exists: ${cols.length > 0 ? '✅' : '❌'}`);
      }
    }

    await sql.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();

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
    console.log('🔍 Checking tenants table columns in detail...');
    const cols = await sql`
      SELECT table_schema, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants'
    `;
    console.log(JSON.stringify(cols, null, 2));

    console.log('🔍 Checking for partner_id specifically...');
    const partnerIdCol = cols.find(c => c.column_name === 'partner_id');
    if (partnerIdCol) {
      console.log('✅ partner_id column FOUND in information_schema');
    } else {
      console.log('❌ partner_id column NOT FOUND in information_schema');
    }

    await sql.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();

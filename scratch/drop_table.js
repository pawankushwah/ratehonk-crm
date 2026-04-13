import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function drop() {
  try {
    await sql`DROP TABLE IF EXISTS invoice_reminder_sends CASCADE`;
    console.log('Table dropped');
    await sql.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

drop();

import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function verify() {
  try {
    console.log('🧪 Verifying support_ticket_messages schema...');
    
    // Check if attachments column exists
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'support_ticket_messages' AND column_name = 'attachments'
    `;
    
    if (cols.length > 0) {
      console.log(`✅ attachments column found: ${cols[0].data_type}`);
    } else {
      console.error('❌ attachments column NOT found!');
      process.exit(1);
    }

    // Try a test insert (we need a valid ticket_id, or we'll just test the column presence)
    // Actually, checking the column presence is enough to know the PG error 42703 is gone.
    
    console.log('✅ Verification successful!');
    await sql.end();
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
}

verify();

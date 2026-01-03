import { sql } from '../server/db.js';

async function addChannelColumn() {
  try {
    // Check if column exists
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'email_templates' AND column_name = 'channel'
      LIMIT 1
    `;

    if (checkColumn.length === 0) {
      console.log('Adding channel column to email_templates table...');
      await sql`
        ALTER TABLE email_templates 
        ADD COLUMN channel TEXT DEFAULT 'email' 
        CHECK (channel IN ('email', 'sms', 'whatsapp'))
      `;
      console.log('✅ Channel column added successfully!');
    } else {
      console.log('✅ Channel column already exists!');
    }

    // Create index if it doesn't exist
    await sql`
      CREATE INDEX IF NOT EXISTS idx_email_templates_channel 
      ON email_templates(channel)
    `;
    console.log('✅ Index created/verified!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addChannelColumn();


import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get DATABASE_URL from environment (with fallback for development)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/ratehonk_crm';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function runMigrations() {
  let sql;
  try {
    // Connect to database
    sql = postgres(DATABASE_URL, {
      ssl: DATABASE_URL.includes('localhost') ? false : 'require',
      max: 1,
    });

    console.log('📊 Connected to database');
    
    // List of migration files to run (in order)
    const migrationFiles = [
      'migrations/create_assignment_history_table.sql',
      'migrations/create_user_metrics_table.sql',
      'migrations/create_user_notifications_table.sql',
      'migrations/create_tasks_table.sql',
      'migrations/create_general_follow_ups_table.sql',
      'migrations/add_previous_assigned_user_to_follow_ups.sql',
    ];
    
    for (const migrationFile of migrationFiles) {
      const migrationPath = path.isAbsolute(migrationFile) 
        ? migrationFile 
        : path.join(__dirname, '..', migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Migration file not found: ${migrationPath}`);
        continue;
      }
      
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      const fileName = path.basename(migrationPath);
      
      console.log(`\n📝 Running migration: ${fileName}`);
      
      try {
        // Execute migration
        await sql.unsafe(migrationSQL);
        console.log(`✅ Migration completed successfully: ${fileName}`);
      } catch (error) {
        // Check if it's a "already exists" error which is okay
        if (error.message && (
          error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.message.includes('relation') && error.message.includes('already exists')
        )) {
          console.log(`ℹ️  Migration skipped (table already exists): ${fileName}`);
        } else {
          console.error(`❌ Migration failed for ${fileName}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('\n✅ All migrations completed!');
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (sql) {
      await sql.end();
    }
    process.exit(1);
  }
}

runMigrations();


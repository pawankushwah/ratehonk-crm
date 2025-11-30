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

async function runMigration() {
  let sql;
  try {
    // Connect to database
    sql = postgres(DATABASE_URL, {
      ssl: 'require',
      max: 1,
    });

    console.log('📊 Connected to database');
    
    // Get migration file from command line argument or use default
    const migrationFile = process.argv[2] || 'migrations/add_estimate_line_item_category.sql';
    const migrationPath = path.isAbsolute(migrationFile) 
      ? migrationFile 
      : path.join(__dirname, '..', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    const fileName = path.basename(migrationPath);
    
    console.log(`📝 Running migration: ${fileName}`);
    
    // Execute migration
    await sql.unsafe(migrationSQL);
    
    console.log(`✅ Migration completed successfully!`);
    console.log(`✅ Migration file: ${fileName}`);
    
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

runMigration();


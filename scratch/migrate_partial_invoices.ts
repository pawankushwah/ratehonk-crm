import { sql } from "../server/db";

async function migrate() {
  console.log("🚀 Starting partial invoice migration...");

  try {
    // 1. Add columns to invoices table
    console.log("adding is_partial to invoices...");
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT FALSE`;
    
    // 2. Add columns to invoice_items table
    console.log("adding fulfilled_quantity to invoice_items...");
    await sql`ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS fulfilled_quantity INTEGER DEFAULT 0`;
    
    // 3. Backfill existing data
    console.log("Backfilling fulfilled_quantity for existing items...");
    await sql`UPDATE invoice_items SET fulfilled_quantity = quantity WHERE fulfilled_quantity = 0`;
    
    console.log("Backfilling is_partial for existing invoices...");
    await sql`UPDATE invoices SET is_partial = false WHERE is_partial IS NULL`;
    
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrate();

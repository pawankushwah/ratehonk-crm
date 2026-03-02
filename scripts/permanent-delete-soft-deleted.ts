/**
 * Permanently delete soft-deleted expenses, invoices, and estimates
 * Run with: npx tsx scripts/permanent-delete-soft-deleted.ts
 */

import "dotenv/config";
import { sql } from "../server/db";

async function permanentDeleteSoftDeleted() {
  try {
    console.log("🗑️ Permanently deleting soft-deleted expenses, invoices, and estimates...\n");

    await sql.begin(async (sql) => {
      // 1. Delete expense_line_items for soft-deleted expenses (or expenses linked to soft-deleted invoices)
      const r1 = await sql`
        DELETE FROM expense_line_items
        WHERE expense_id IN (
          SELECT id FROM expenses WHERE deleted_at IS NOT NULL
          UNION
          SELECT id FROM expenses WHERE invoice_id IN (SELECT id FROM invoices WHERE deleted_at IS NOT NULL)
        )
      `;
      console.log("  ✓ Deleted expense_line_items for soft-deleted expenses");

      // 2. Delete soft-deleted expenses + expenses linked to soft-deleted invoices
      const r2 = await sql`
        DELETE FROM expenses
        WHERE deleted_at IS NOT NULL
           OR invoice_id IN (SELECT id FROM invoices WHERE deleted_at IS NOT NULL)
      `;
      console.log("  ✓ Deleted soft-deleted expenses");

      // 3. Delete invoice_items for soft-deleted invoices
      const r3 = await sql`
        DELETE FROM invoice_items
        WHERE invoice_id IN (SELECT id FROM invoices WHERE deleted_at IS NOT NULL)
      `;
      console.log("  ✓ Deleted invoice_items for soft-deleted invoices");

      // 4. Delete payment_installments for soft-deleted invoices
      const r4 = await sql`
        DELETE FROM payment_installments
        WHERE invoice_id IN (SELECT id FROM invoices WHERE deleted_at IS NOT NULL)
      `;
      console.log("  ✓ Deleted payment_installments for soft-deleted invoices");

      // 5. Delete soft-deleted invoices
      const r5 = await sql`
        DELETE FROM invoices WHERE deleted_at IS NOT NULL
      `;
      console.log("  ✓ Deleted soft-deleted invoices");

      // 6. Delete estimates if deleted_at column exists
      const [colExists] = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'estimates' AND column_name = 'deleted_at'
        ) as exists
      `;
      if (colExists?.exists) {
        await sql`
          DELETE FROM estimate_line_items
          WHERE estimate_id IN (SELECT id FROM estimates WHERE deleted_at IS NOT NULL)
        `;
        await sql`
          DELETE FROM estimates WHERE deleted_at IS NOT NULL
        `;
        console.log("  ✓ Deleted soft-deleted estimates");
      } else {
        console.log("  ○ Estimates table has no deleted_at column (skipped)");
      }
    });

    console.log("\n✅ Done. All soft-deleted records have been permanently removed.");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
  process.exit(0);
}

permanentDeleteSoftDeleted();

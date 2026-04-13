import { db } from "../server/db";
import { frontendForms } from "../shared/schema";
import { sql } from "../server/db";

async function seed() {
  console.log("🌱 Seeding frontend_forms...");
  
  const forms = [
    { name: "Inventory Form", formKey: "inventory" },
    { name: "Non-Inventory Form", formKey: "non-inventory" },
    { name: "Service Form", formKey: "service" },
    { name: "Bundle Form", formKey: "bundle" },
    { name: "Product Form", formKey: "product" }
  ];

  try {
    for (const form of forms) {
      // Use raw SQL to ignore conflicts if they exist
      await sql`
        INSERT INTO frontend_forms (name, form_key, updated_at)
        VALUES (${form.name}, ${form.formKey}, NOW())
        ON CONFLICT (form_key) DO NOTHING
      `;
    }
    console.log("✅ Seeding complete.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

seed();

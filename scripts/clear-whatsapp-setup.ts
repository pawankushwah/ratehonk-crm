/**
 * Clear all tenant WhatsApp setup (config, devices, messages)
 * Use when reconnecting with a different API panel
 * Run: npx tsx scripts/clear-whatsapp-setup.ts
 */
import { sql } from "../server/db";

async function main() {
  console.log("Clearing all WhatsApp setup...");
  await sql`DELETE FROM whatsapp_messages`;
  await sql`DELETE FROM whatsapp_devices`;
  await sql`DELETE FROM whatsapp_config`;
  console.log("Done. All WhatsApp config, devices, and messages have been removed.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

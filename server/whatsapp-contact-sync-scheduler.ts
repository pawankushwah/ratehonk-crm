/**
 * WhatsApp Contact Sync Scheduler
 * Runs in the background and syncs all leads & customers to WhatsApp for tenants with WhatsApp configured.
 * Runs every hour to catch any contacts that may have been missed.
 */

import { sql } from "./db.js";
import { syncAllContactsToWhatsApp } from "./whatsapp-contact-sync.js";

const RUN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export async function processWhatsAppContactSync(): Promise<void> {
  try {
    const rows = await sql`
      SELECT DISTINCT tenant_id FROM whatsapp_config
      WHERE tenant_id IS NOT NULL
    `;
    const tenantIds = rows.map((r: any) => r.tenant_id).filter(Boolean);

    if (tenantIds.length === 0) return;

    console.log(`📱 WhatsApp contact sync: processing ${tenantIds.length} tenant(s)`);

    for (const tenantId of tenantIds) {
      try {
        const result = await syncAllContactsToWhatsApp(tenantId);
        if (result.synced > 0 || result.failed > 0) {
          console.log(`📱 Tenant ${tenantId}: ${result.synced} synced, ${result.failed} failed`);
        }
      } catch (err: any) {
        console.error(`WhatsApp sync error for tenant ${tenantId}:`, err?.message);
      }
    }
  } catch (error) {
    console.error("Error in WhatsApp contact sync scheduler:", error);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startWhatsAppContactSyncScheduler(): void {
  if (intervalId) return;
  processWhatsAppContactSync();
  intervalId = setInterval(processWhatsAppContactSync, RUN_INTERVAL_MS);
  console.log("📱 WhatsApp contact sync scheduler started (runs every hour)");
}

export function stopWhatsAppContactSyncScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("WhatsApp contact sync scheduler stopped");
  }
}

/**
 * WhatsApp Contact Sync Service
 * Syncs leads and customers to WhatsApp provider contacts when WhatsApp is configured.
 * Called on server side when:
 * - New lead/customer is created (only if WhatsApp configured for tenant)
 * - Manual sync button clicked on leads/customers listing pages
 */

import { simpleStorage } from "./simple-storage.js";

const WHATSAPP_PROVIDER_API_BASE =
  process.env.WHATSAPP_PROVIDER_API_BASE || "";

function buildDestination(phone: string): string {
  const cleaned = phone.replace(/\s/g, "").trim();
  if (!cleaned) return phone;
  if (cleaned.startsWith("+")) return cleaned;
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length >= 10) return `+${digits}`;
  return cleaned;
}

/**
 * Sync a single contact to WhatsApp provider
 */
export async function syncContactToWhatsApp(
  tenantId: number,
  contact: {
    type: "lead" | "customer";
    name: string;
    phone: string | null;
    email?: string | null;
    source?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!WHATSAPP_PROVIDER_API_BASE) {
      return { success: false, error: "WhatsApp provider API not configured" };
    }
    if (!contact.phone || contact.phone.trim() === "") {
      return { success: false, error: "Phone number required" };
    }

    const config = await simpleStorage.getWhatsAppConfigByTenant(tenantId);
    if (!config) {
      return { success: false, error: "WhatsApp not configured for tenant" };
    }

    const base = WHATSAPP_PROVIDER_API_BASE.replace(/\/$/, "");
    const destination = buildDestination(contact.phone);

    const body = {
      destination,
      userName: contact.name || "Unknown",
      source: contact.source || "CRM",
      tags: [contact.type],
      attributes: contact.email ? { email: contact.email } : {},
    };

    const response = await fetch(`${base}/api/project/v1/contacts`, {
      method: "POST",
      headers: {
        "X-API-Key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg =
        errData?.message || errData?.error || `HTTP ${response.status}`;
      console.error(`WhatsApp contact sync failed:`, errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log(`📱 WhatsApp contact synced: ${contact.type} ${contact.name} (${destination})`);
    return { success: true };
  } catch (error: any) {
    console.error("WhatsApp contact sync error:", error);
    return { success: false, error: error?.message || "Sync failed" };
  }
}

/**
 * Sync all leads and customers with phone numbers to WhatsApp
 */
export async function syncAllContactsToWhatsApp(
  tenantId: number
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const result = { synced: 0, failed: 0, errors: [] as string[] };

  try {
    if (!WHATSAPP_PROVIDER_API_BASE) {
      result.errors.push("WhatsApp provider API not configured");
      return result;
    }

    const config = await simpleStorage.getWhatsAppConfigByTenant(tenantId);
    if (!config) {
      result.errors.push("WhatsApp not configured for this account");
      return result;
    }

    const [leads, customers] = await Promise.all([
      simpleStorage.getLeadsWithPhone(tenantId),
      simpleStorage.getCustomersWithPhone(tenantId),
    ]);

    const toSync: Array<{ type: "lead" | "customer"; name: string; phone: string; email?: string; source?: string }> = [];

    for (const lead of leads || []) {
      const name = lead.name || `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Lead";
      toSync.push({
        type: "lead",
        name,
        phone: String(lead.phone),
        email: lead.email,
      });
    }

    for (const customer of customers || []) {
      toSync.push({
        type: "customer",
        name: customer.name || "Customer",
        phone: String(customer.phone),
        email: customer.email,
      });
    }

    for (const contact of toSync) {
      const { success, error } = await syncContactToWhatsApp(tenantId, contact);
      if (success) {
        result.synced++;
      } else {
        result.failed++;
        if (error && result.errors.length < 1) result.errors.push(error);
      }
    }

    console.log(`📱 WhatsApp sync complete: ${result.synced} synced, ${result.failed} failed`);
    return result;
  } catch (error: any) {
    console.error("WhatsApp sync all error:", error);
    result.errors.push(error?.message || "Sync failed");
    return result;
  }
}

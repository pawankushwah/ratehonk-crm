/**
 * Lead follow-up email automation scheduler.
 * Runs periodically and sends follow-up emails to leads in a given status
 * when the configured interval has passed (e.g. every 1, 2, or 7 days).
 */

import { simpleStorage } from "./simple-storage";
import { tenantEmailService } from "./tenant-email-service";
import { sql } from "./db";

const RUN_INTERVAL_MS = 60 * 60 * 1000; // Every hour

function personalizeTemplate(template: string, lead: Record<string, any>, companyName: string): string {
  const firstName = lead.firstName ?? lead.first_name ?? lead.name?.split(" ")[0] ?? "";
  const lastName = lead.lastName ?? lead.last_name ?? lead.name?.split(" ").slice(1).join(" ") ?? "";
  const email = lead.email ?? "";
  return template
    .replace(/\{\{FirstName\}\}/g, firstName)
    .replace(/\{\{LastName\}\}/g, lastName)
    .replace(/\{\{Email\}\}/g, lead.email ?? "")
    .replace(/\{\{CompanyName\}\}/g, companyName)
    .replace(/\{\{AgentName\}\}/g, "Our Team")
    .replace(/\{\{BookingLink\}\}/g, `${process.env.APP_URL || "http://localhost:5000"}/bookings`);
}

export async function processLeadFollowUpAutomations(): Promise<void> {
  try {
    const tenants = await sql`SELECT id FROM tenants`;
    for (const t of tenants) {
      const tenantId = t.id as number;
      const enabled = await simpleStorage.getTenantSettingLeadFollowUpEnabled(tenantId);
      if (!enabled) continue;

      const automations = await simpleStorage.getEmailAutomationsByTenant(tenantId);
      const followUpAutomations = automations.filter(
        (a: any) => a.isActive && a.triggerType === "lead_status_follow_up" && a.emailTemplateId
      );

      for (const automation of followUpAutomations) {
        const cond = (automation.triggerConditions || {}) as {
          leadStatus?: string;
          intervalDays?: number;
          minDaysInStatus?: number;
        };
        const leadStatus = cond.leadStatus || "new";
        const intervalDays = Math.max(1, cond.intervalDays ?? 1);
        const minDaysInStatus = Math.max(0, cond.minDaysInStatus ?? 0);

        const template = await simpleStorage.getEmailTemplateById(automation.emailTemplateId!);
        if (!template || !template.subject || !template.content) continue;

        const tenant = await simpleStorage.getTenant(tenantId);
        const companyName = (tenant?.company_name || tenant?.companyName) || "Our Team";

        const result = await simpleStorage.getLeadsByTenant({
          tenantId,
          status: leadStatus,
          limit: 500,
          offset: 0,
        });
        const leads = Array.isArray(result?.data) ? result.data : [];

        for (const lead of leads) {
          if (!lead?.email || String(lead.email).trim() === "") continue;

          const leadUpdatedAt = lead.updatedAt ?? lead.updated_at ? new Date(lead.updatedAt ?? lead.updated_at) : new Date(lead.createdAt ?? lead.created_at || 0);
          const now = new Date();
          const daysInStatus = (now.getTime() - leadUpdatedAt.getTime()) / (24 * 60 * 60 * 1000);
          if (minDaysInStatus > 0 && daysInStatus < minDaysInStatus) continue;

          const lastSend = await simpleStorage.getLastLeadAutomationSend(tenantId, lead.id, automation.id);
          const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
          if (lastSend && now.getTime() - lastSend.getTime() < intervalMs) continue;

          try {
            const subject = personalizeTemplate(template.subject, lead, companyName);
            const htmlBody = personalizeTemplate(template.content, lead, companyName);
            const textBody = htmlBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

            await tenantEmailService.sendCustomerEmail({
              to: lead.email,
              subject,
              body: textBody,
              htmlBody,
              tenantId,
              fromName: companyName,
            });

            await simpleStorage.recordLeadAutomationSend(tenantId, lead.id, automation.id);
            console.log(`📧 Lead follow-up sent: automation ${automation.id} -> lead ${lead.id} (${lead.email})`);
          } catch (err) {
            console.error(`Lead follow-up send failed for lead ${lead.id}:`, err);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in processLeadFollowUpAutomations:", error);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startLeadFollowUpScheduler(): void {
  if (intervalId) return;
  processLeadFollowUpAutomations();
  intervalId = setInterval(processLeadFollowUpAutomations, RUN_INTERVAL_MS);
  console.log("📅 Lead follow-up automation scheduler started (runs every hour)");
}

export function stopLeadFollowUpScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Lead follow-up automation scheduler stopped");
  }
}

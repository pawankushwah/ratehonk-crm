/**
 * Invoice status follow-up email automation scheduler.
 * Runs periodically and sends follow-up emails for invoices in a given status
 * (e.g. Pending, Overdue) when the configured interval has passed.
 */

import { sql } from "./db";
import { simpleStorage } from "./simple-storage";
import { tenantEmailService } from "./tenant-email-service";

const RUN_INTERVAL_MS = 60 * 60 * 1000; // Every hour

function personalizeTemplate(
  template: string,
  invoice: { customerName?: string | null; customerEmail?: string | null; invoiceNumber: string },
  companyName: string
): string {
  const firstName = (invoice.customerName || "").split(" ")[0] || "Customer";
  return template
    .replace(/\{\{FirstName\}\}/g, firstName)
    .replace(/\{\{LastName\}\}/g, (invoice.customerName || "").split(" ").slice(1).join(" ") || "")
    .replace(/\{\{Email\}\}/g, invoice.customerEmail ?? "")
    .replace(/\{\{CompanyName\}\}/g, companyName)
    .replace(/\{\{InvoiceNumber\}\}/g, invoice.invoiceNumber)
    .replace(/\{\{AgentName\}\}/g, "Our Team");
}

export async function processInvoiceStatusAutomations(): Promise<void> {
  try {
    const tenants = await sql`SELECT id FROM tenants`;
    for (const t of tenants) {
      const tenantId = t.id as number;
      const automations = await simpleStorage.getEmailAutomationsByTenant(tenantId);
      const invoiceAutomations = automations.filter(
        (a: any) => a.isActive && a.triggerType === "invoice_status_follow_up" && a.emailTemplateId
      );

      for (const automation of invoiceAutomations) {
        const cond = (automation.triggerConditions || {}) as {
          invoiceStatus?: string;
          intervalDays?: number;
          minDaysInStatus?: number;
        };
        const invoiceStatus = cond.invoiceStatus || "pending";
        const intervalDays = Math.max(1, cond.intervalDays ?? 1);
        const minDaysInStatus = Math.max(0, cond.minDaysInStatus ?? 0);

        const template = await simpleStorage.getEmailTemplateById(automation.emailTemplateId!);
        if (!template || !template.subject || !template.content) continue;

        const tenant = await simpleStorage.getTenant(tenantId);
        const companyName = (tenant?.company_name || tenant?.companyName) || "Our Team";

        const invoices = await simpleStorage.getInvoicesForStatusAutomation(tenantId, invoiceStatus);
        const now = new Date();

        for (const inv of invoices) {
          const email = inv.customerEmail && String(inv.customerEmail).trim();
          if (!email) continue;

          const updatedAt = inv.updatedAt instanceof Date ? inv.updatedAt : new Date(inv.updatedAt);
          const daysInStatus = (now.getTime() - updatedAt.getTime()) / (24 * 60 * 60 * 1000);
          if (minDaysInStatus > 0 && daysInStatus < minDaysInStatus) continue;

          const lastSend = await simpleStorage.getLastInvoiceAutomationSend(inv.id, automation.id);
          const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
          if (lastSend && now.getTime() - lastSend.getTime() < intervalMs) continue;

          try {
            const subject = personalizeTemplate(template.subject, inv, companyName);
            const htmlBody = personalizeTemplate(template.content, inv, companyName);
            const textBody = htmlBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

            await tenantEmailService.sendCustomerEmail({
              to: email,
              subject,
              body: textBody,
              htmlBody,
              tenantId,
              fromName: companyName,
            });

            await simpleStorage.recordInvoiceAutomationSend(tenantId, inv.id, automation.id);
            console.log(`📧 Invoice status automation sent: automation ${automation.id} -> invoice ${inv.id} (${email})`);
          } catch (err) {
            console.error(`Invoice status automation send failed for invoice ${inv.id}:`, err);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in processInvoiceStatusAutomations:", error);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startInvoiceAutomationScheduler(): void {
  if (intervalId) return;
  processInvoiceStatusAutomations();
  intervalId = setInterval(processInvoiceStatusAutomations, RUN_INTERVAL_MS);
  console.log("📅 Invoice status automation scheduler started (runs every hour)");
}

export function stopInvoiceAutomationScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Invoice status automation scheduler stopped");
  }
}

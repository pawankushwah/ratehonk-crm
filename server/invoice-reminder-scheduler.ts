/**
 * Invoice payment reminder scheduler.
 * Sends reminder emails for invoices that have "Payment Reminder" enabled
 * (enable_reminder=true) and are not paid, according to reminder_frequency
 * (daily, weekly, monthly, or specific_date).
 */

import { simpleStorage } from "./simple-storage";
import { tenantEmailService } from "./tenant-email-service";

const RUN_INTERVAL_MS = 24 * 60 * 60 * 1000; // Once per day

function buildReminderEmail(inv: {
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: Date;
  companyName: string;
}) {
  const dueStr = inv.dueDate instanceof Date ? inv.dueDate.toLocaleDateString() : String(inv.dueDate);
  const amountDue = Math.max(0, inv.totalAmount - inv.paidAmount);
  const subject = `Payment reminder: Invoice ${inv.invoiceNumber}`;
  const textBody = `Dear ${inv.customerName},

This is a friendly reminder that payment is due for Invoice ${inv.invoiceNumber}.

Amount due: ${amountDue.toFixed(2)}
Due date: ${dueStr}

Please arrange payment at your earliest convenience. If you have already paid, please disregard this message.

Best regards,
${inv.companyName}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #1f2937; margin-top: 0;">Payment reminder</h2>
    <p>Dear <strong>${inv.customerName}</strong>,</p>
    <p>This is a friendly reminder that payment is due for <strong>Invoice ${inv.invoiceNumber}</strong>.</p>
    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Amount due:</strong> ${amountDue.toFixed(2)}</p>
      <p style="margin: 8px 0 0 0;"><strong>Due date:</strong> ${dueStr}</p>
    </div>
    <p>Please arrange payment at your earliest convenience. If you have already paid, please disregard this message.</p>
    <p style="margin-top: 24px; color: #6b7280;">Best regards,<br><strong>${inv.companyName}</strong></p>
  </div>
</body>
</html>`;

  return { subject, textBody, htmlBody };
}

function shouldSendReminder(
  frequency: string | null,
  reminderSpecificDate: Date | null,
  lastSend: Date | null,
  now: Date
): boolean {
  if (frequency === "specific_date" && reminderSpecificDate) {
    const d = new Date(reminderSpecificDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }
  const last = lastSend ? lastSend.getTime() : 0;
  const intervalMs =
    frequency === "daily"
      ? 24 * 60 * 60 * 1000
      : frequency === "weekly"
        ? 7 * 24 * 60 * 60 * 1000
        : frequency === "monthly"
          ? 30 * 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000; // default weekly
  return now.getTime() - last >= intervalMs;
}

export async function processInvoicePaymentReminders(): Promise<void> {
  try {
    const invoices = await simpleStorage.getInvoicesForPaymentReminder();
    const now = new Date();

    for (const inv of invoices) {
      try {
        const lastSend = await simpleStorage.getLastInvoiceReminderSend(inv.id);
        if (!shouldSendReminder(inv.reminderFrequency, inv.reminderSpecificDate, lastSend, now)) continue;

        const tenant = await simpleStorage.getTenant(inv.tenantId);
        const companyName = (tenant?.company_name || tenant?.companyName) || "Our Company";

        const { subject, textBody, htmlBody } = buildReminderEmail({
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          totalAmount: inv.totalAmount,
          paidAmount: inv.paidAmount,
          dueDate: inv.dueDate,
          companyName,
        });

        await tenantEmailService.sendCustomerEmail({
          to: inv.customerEmail,
          subject,
          body: textBody,
          htmlBody,
          tenantId: inv.tenantId,
          fromName: companyName,
        });

        await simpleStorage.recordInvoiceReminderSend(inv.id);
        console.log(`📧 Invoice payment reminder sent: ${inv.invoiceNumber} -> ${inv.customerEmail}`);
      } catch (err) {
        console.error(`Invoice reminder failed for invoice ${inv.id}:`, err);
      }
    }
  } catch (error) {
    console.error("Error in processInvoicePaymentReminders:", error);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startInvoiceReminderScheduler(): void {
  if (intervalId) return;
  processInvoicePaymentReminders();
  intervalId = setInterval(processInvoicePaymentReminders, RUN_INTERVAL_MS);
  console.log("📅 Invoice payment reminder scheduler started (runs daily)");
}

export function stopInvoiceReminderScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

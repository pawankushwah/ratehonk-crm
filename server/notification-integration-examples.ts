/**
 * Notification Integration Examples
 * 
 * This file shows how to integrate notifications into different modules.
 * Copy and adapt these examples to your actual module files.
 */

import {
  leadNotifications,
  customerNotifications,
  invoiceNotifications,
  estimateNotifications,
  bookingNotifications,
  taskNotifications,
  followupNotifications,
  paymentNotifications,
  expenseNotifications,
  emailNotifications,
  subscriptionNotifications,
  genericNotifications,
} from "./notification-helpers.js";

// ============================================
// LEAD MODULE INTEGRATION EXAMPLES
// ============================================

/**
 * Example: When a lead is assigned to a user
 */
export async function exampleLeadAssigned(tenantId: number, assignedUserId: number, leadId: number, leadName: string) {
  await leadNotifications.assigned(tenantId, assignedUserId, leadId, leadName);
}

/**
 * Example: When a lead is converted to customer
 */
export async function exampleLeadConverted(
  tenantId: number,
  userId: number,
  leadId: number,
  leadName: string,
  customerId: number
) {
  await leadNotifications.converted(tenantId, userId, leadId, leadName, customerId);
}

// ============================================
// INVOICE MODULE INTEGRATION EXAMPLES
// ============================================

/**
 * Example: When an invoice is created
 */
export async function exampleInvoiceCreated(
  tenantId: number,
  userId: number,
  invoiceId: number,
  invoiceNumber: string,
  customerName: string
) {
  await invoiceNotifications.created(tenantId, userId, invoiceId, invoiceNumber, customerName);
}

/**
 * Example: When an invoice becomes overdue
 * This should be called by a scheduled job/cron
 */
export async function exampleInvoiceOverdue(
  tenantId: number,
  userId: number,
  invoiceId: number,
  invoiceNumber: string,
  amount: string
) {
  await invoiceNotifications.overdue(tenantId, userId, invoiceId, invoiceNumber, amount);
}

/**
 * Example: When payment is received for an invoice
 */
export async function examplePaymentReceived(
  tenantId: number,
  userId: number,
  invoiceId: number,
  invoiceNumber: string,
  amount: string
) {
  await paymentNotifications.received(tenantId, userId, invoiceId, invoiceNumber, amount);
}

// ============================================
// TASK MODULE INTEGRATION EXAMPLES
// ============================================

/**
 * Example: When a task is assigned
 */
export async function exampleTaskAssigned(
  tenantId: number,
  assignedUserId: number,
  taskId: number,
  taskTitle: string
) {
  await taskNotifications.assigned(tenantId, assignedUserId, taskId, taskTitle);
}

/**
 * Example: When a task becomes overdue
 * This should be called by a scheduled job/cron
 */
export async function exampleTaskOverdue(
  tenantId: number,
  userId: number,
  taskId: number,
  taskTitle: string
) {
  await taskNotifications.overdue(tenantId, userId, taskId, taskTitle);
}

// ============================================
// FOLLOW-UP MODULE INTEGRATION EXAMPLES
// ============================================

/**
 * Example: When a follow-up is due
 * This should be called by a scheduled job/cron
 */
export async function exampleFollowupDue(
  tenantId: number,
  userId: number,
  followupId: number,
  followupTitle: string
) {
  await followupNotifications.due(tenantId, userId, followupId, followupTitle);
}

// ============================================
// SUBSCRIPTION MODULE INTEGRATION EXAMPLES
// ============================================

/**
 * Example: Check and notify about expiring subscriptions
 * This should be called by a scheduled job/cron (daily)
 */
export async function exampleCheckExpiringSubscriptions() {
  // This is a placeholder - implement your subscription checking logic
  // For each tenant/user with expiring subscription:
  // await subscriptionNotifications.expiring(tenantId, userId, daysLeft);
}

// ============================================
// CUSTOM NOTIFICATION EXAMPLES
// ============================================

/**
 * Example: Custom reminder notification
 */
export async function exampleCustomReminder(
  tenantId: number,
  userId: number,
  reminderTitle: string,
  reminderMessage: string,
  actionUrl?: string
) {
  await genericNotifications.reminder(
    tenantId,
    userId,
    reminderTitle,
    reminderMessage,
    actionUrl,
    "high" // priority
  );
}

/**
 * Example: System-wide notification to all users in tenant
 */
export async function exampleSystemNotification(
  tenantId: number,
  title: string,
  message: string
) {
  // This would require getting all user IDs in the tenant
  // For now, use the notificationService directly
  const { notificationService } = await import("./notification-service");
  await notificationService.createTenantNotification("system", {
    tenantId,
    title,
    message,
  });
}


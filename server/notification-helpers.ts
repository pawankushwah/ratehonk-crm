/**
 * Notification Helper Functions
 * Easy-to-use functions for creating notifications from different modules
 */

import { notificationService, NotificationType } from "./notification-service";
import { simpleStorage } from "./simple-storage";

/**
 * Lead-related notifications
 */
export const leadNotifications = {
  async assigned(tenantId: number, userId: number, leadId: number, leadName: string) {
    return notificationService.createNotification("lead_assigned", {
      tenantId,
      userId,
      entityType: "lead",
      entityId: leadId,
      leadId,
      leadName,
    });
  },

  async updated(tenantId: number, userId: number, leadId: number, leadName: string, updatedBy: string) {
    return notificationService.createNotification("lead_updated", {
      tenantId,
      userId,
      entityType: "lead",
      entityId: leadId,
      leadId,
      leadName,
      updatedBy,
    });
  },

  async converted(tenantId: number, userId: number, leadId: number, leadName: string, customerId: number) {
    return notificationService.createNotification("lead_converted", {
      tenantId,
      userId,
      entityType: "lead",
      entityId: leadId,
      leadId,
      leadName,
      customerId,
    });
  },

  async statusChanged(tenantId: number, userId: number, leadId: number, leadName: string, newStatus: string) {
    return notificationService.createNotification("lead_status_changed", {
      tenantId,
      userId,
      entityType: "lead",
      entityId: leadId,
      leadId,
      leadName,
      newStatus,
    });
  },
};

/**
 * Customer-related notifications
 */
export const customerNotifications = {
  async created(tenantId: number, userId: number, customerId: number, customerName: string) {
    return notificationService.createNotification("customer_created", {
      tenantId,
      userId,
      entityType: "customer",
      entityId: customerId,
      customerId,
      customerName,
    });
  },

  async updated(tenantId: number, userId: number, customerId: number, customerName: string) {
    return notificationService.createNotification("customer_updated", {
      tenantId,
      userId,
      entityType: "customer",
      entityId: customerId,
      customerId,
      customerName,
    });
  },

  async assigned(tenantId: number, userId: number, customerId: number, customerName: string) {
    return notificationService.createNotification("customer_assigned", {
      tenantId,
      userId,
      entityType: "customer",
      entityId: customerId,
      customerId,
      customerName,
    });
  },
};

/**
 * Invoice-related notifications
 */
export const invoiceNotifications = {
  async created(tenantId: number, userId: number, invoiceId: number, invoiceNumber: string, customerName: string) {
    return notificationService.createNotification("invoice_created", {
      tenantId,
      userId,
      entityType: "invoice",
      entityId: invoiceId,
      invoiceId,
      invoiceNumber,
      customerName,
    });
  },

  async sent(tenantId: number, userId: number, invoiceId: number, invoiceNumber: string, customerName: string) {
    return notificationService.createNotification("invoice_sent", {
      tenantId,
      userId,
      entityType: "invoice",
      entityId: invoiceId,
      invoiceId,
      invoiceNumber,
      customerName,
    });
  },

  async paid(tenantId: number, userId: number, invoiceId: number, invoiceNumber: string, amount: string) {
    return notificationService.createNotification("invoice_paid", {
      tenantId,
      userId,
      entityType: "invoice",
      entityId: invoiceId,
      invoiceId,
      invoiceNumber,
      amount,
    });
  },

  async overdue(tenantId: number, userId: number, invoiceId: number, invoiceNumber: string, amount: string) {
    return notificationService.createNotification("invoice_overdue", {
      tenantId,
      userId,
      entityType: "invoice",
      entityId: invoiceId,
      invoiceId,
      invoiceNumber,
      amount,
      priority: "urgent",
    });
  },
};

/**
 * Estimate-related notifications
 */
export const estimateNotifications = {
  async created(tenantId: number, userId: number, estimateId: number, estimateNumber: string) {
    return notificationService.createNotification("estimate_created", {
      tenantId,
      userId,
      entityType: "estimate",
      entityId: estimateId,
      estimateId,
      estimateNumber,
    });
  },

  async sent(tenantId: number, userId: number, estimateId: number, estimateNumber: string, customerName: string) {
    return notificationService.createNotification("estimate_sent", {
      tenantId,
      userId,
      entityType: "estimate",
      entityId: estimateId,
      estimateId,
      estimateNumber,
      customerName,
    });
  },

  async accepted(tenantId: number, userId: number, estimateId: number, estimateNumber: string, customerName: string) {
    return notificationService.createNotification("estimate_accepted", {
      tenantId,
      userId,
      entityType: "estimate",
      entityId: estimateId,
      estimateId,
      estimateNumber,
      customerName,
    });
  },

  async rejected(tenantId: number, userId: number, estimateId: number, estimateNumber: string, customerName: string) {
    return notificationService.createNotification("estimate_rejected", {
      tenantId,
      userId,
      entityType: "estimate",
      entityId: estimateId,
      estimateId,
      estimateNumber,
      customerName,
    });
  },
};

/**
 * Booking-related notifications
 */
export const bookingNotifications = {
  async created(tenantId: number, userId: number, bookingId: number, customerName: string) {
    return notificationService.createNotification("booking_created", {
      tenantId,
      userId,
      entityType: "booking",
      entityId: bookingId,
      bookingId,
      customerName,
    });
  },

  async confirmed(tenantId: number, userId: number, bookingId: number) {
    return notificationService.createNotification("booking_confirmed", {
      tenantId,
      userId,
      entityType: "booking",
      entityId: bookingId,
      bookingId,
    });
  },

  async cancelled(tenantId: number, userId: number, bookingId: number) {
    return notificationService.createNotification("booking_cancelled", {
      tenantId,
      userId,
      entityType: "booking",
      entityId: bookingId,
      bookingId,
    });
  },
};

/**
 * Task-related notifications
 */
export const taskNotifications = {
  async assigned(tenantId: number, userId: number, taskId: number, taskTitle: string) {
    return notificationService.createNotification("task_assigned", {
      tenantId,
      userId,
      entityType: "task",
      entityId: taskId,
      taskId,
      taskTitle,
    });
  },

  async completed(tenantId: number, userId: number, taskId: number, taskTitle: string) {
    return notificationService.createNotification("task_completed", {
      tenantId,
      userId,
      entityType: "task",
      entityId: taskId,
      taskId,
      taskTitle,
    });
  },

  async overdue(tenantId: number, userId: number, taskId: number, taskTitle: string) {
    return notificationService.createNotification("task_overdue", {
      tenantId,
      userId,
      entityType: "task",
      entityId: taskId,
      taskId,
      taskTitle,
      priority: "urgent",
    });
  },
};

/**
 * Follow-up-related notifications
 */
export const followupNotifications = {
  async created(tenantId: number, userId: number, followupId: number, followupTitle: string) {
    return notificationService.createNotification("followup_created", {
      tenantId,
      userId,
      entityType: "followup",
      entityId: followupId,
      followupId,
      followupTitle,
    });
  },

  async due(tenantId: number, userId: number, followupId: number, followupTitle: string) {
    return notificationService.createNotification("followup_due", {
      tenantId,
      userId,
      entityType: "followup",
      entityId: followupId,
      followupId,
      followupTitle,
      priority: "high",
    });
  },

  async completed(tenantId: number, userId: number, followupId: number, followupTitle: string) {
    return notificationService.createNotification("followup_completed", {
      tenantId,
      userId,
      entityType: "followup",
      entityId: followupId,
      followupId,
      followupTitle,
    });
  },
};

/**
 * Payment-related notifications
 */
export const paymentNotifications = {
  async received(tenantId: number, userId: number, invoiceId: number, invoiceNumber: string, amount: string) {
    return notificationService.createNotification("payment_received", {
      tenantId,
      userId,
      entityType: "payment",
      entityId: invoiceId,
      invoiceId,
      invoiceNumber,
      amount,
    });
  },

  async failed(tenantId: number, userId: number, invoiceId: number, invoiceNumber: string) {
    return notificationService.createNotification("payment_failed", {
      tenantId,
      userId,
      entityType: "payment",
      entityId: invoiceId,
      invoiceId,
      invoiceNumber,
      priority: "urgent",
    });
  },
};

/**
 * Expense-related notifications
 */
export const expenseNotifications = {
  async created(tenantId: number, userId: number, expenseId: number, amount: string) {
    return notificationService.createNotification("expense_created", {
      tenantId,
      userId,
      entityType: "expense",
      entityId: expenseId,
      expenseId,
      amount,
    });
  },

  async approved(tenantId: number, userId: number, expenseId: number) {
    return notificationService.createNotification("expense_approved", {
      tenantId,
      userId,
      entityType: "expense",
      entityId: expenseId,
      expenseId,
    });
  },

  async rejected(tenantId: number, userId: number, expenseId: number) {
    return notificationService.createNotification("expense_rejected", {
      tenantId,
      userId,
      entityType: "expense",
      entityId: expenseId,
      expenseId,
    });
  },
};

/**
 * Email-related notifications
 */
export const emailNotifications = {
  async sent(tenantId: number, userId: number, emailSubject: string, emailId?: number) {
    return notificationService.createNotification("email_sent", {
      tenantId,
      userId,
      entityType: "email",
      entityId: emailId,
      emailId,
      emailSubject,
    });
  },

  async failed(tenantId: number, userId: number, emailSubject: string, emailId?: number) {
    return notificationService.createNotification("email_failed", {
      tenantId,
      userId,
      entityType: "email",
      entityId: emailId,
      emailId,
      emailSubject,
      priority: "high",
    });
  },
};

/**
 * Subscription-related notifications
 */
export const subscriptionNotifications = {
  async expiring(tenantId: number, userId: number, daysLeft: number) {
    return notificationService.createNotification("subscription_expiring", {
      tenantId,
      userId,
      daysLeft,
      priority: "high",
    });
  },

  async expired(tenantId: number, userId: number) {
    return notificationService.createNotification("subscription_expired", {
      tenantId,
      userId,
      priority: "urgent",
    });
  },

  async trialExpiring(tenantId: number, userId: number, daysLeft: number) {
    return notificationService.createNotification("trial_expiring", {
      tenantId,
      userId,
      daysLeft,
      priority: "high",
    });
  },

  async trialExpired(tenantId: number, userId: number) {
    return notificationService.createNotification("trial_expired", {
      tenantId,
      userId,
      priority: "urgent",
    });
  },
};

/**
 * Generic notification helpers
 */
export const genericNotifications = {
  async reminder(
    tenantId: number,
    userId: number,
    reminderTitle: string,
    reminderMessage: string,
    actionUrl?: string,
    priority: "low" | "medium" | "high" | "urgent" = "medium"
  ) {
    return notificationService.createNotification("reminder", {
      tenantId,
      userId,
      reminderTitle,
      reminderMessage,
      actionUrl,
      priority,
    });
  },

  async system(
    tenantId: number,
    userId: number,
    title: string,
    message: string,
    actionUrl?: string
  ) {
    return notificationService.createNotification("system", {
      tenantId,
      userId,
      title,
      message,
      actionUrl,
    });
  },

  async assignment(
    tenantId: number,
    userId: number,
    entityType: string,
    entityId: number,
    entityName: string,
    actionUrl?: string
  ) {
    return notificationService.createNotification("assignment", {
      tenantId,
      userId,
      entityType: entityType as any,
      entityId,
      entityName,
      actionUrl,
    });
  },
};


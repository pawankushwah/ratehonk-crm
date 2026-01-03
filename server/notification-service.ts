/**
 * Comprehensive Notification Service
 * Handles all notification types across all modules
 */

import { simpleStorage } from "./simple-storage";
import { sql } from "./db";

export type NotificationType =
  | "lead_assigned"
  | "lead_updated"
  | "lead_converted"
  | "lead_status_changed"
  | "customer_created"
  | "customer_updated"
  | "customer_assigned"
  | "invoice_created"
  | "invoice_sent"
  | "invoice_paid"
  | "invoice_overdue"
  | "estimate_created"
  | "estimate_sent"
  | "estimate_accepted"
  | "estimate_rejected"
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "expense_created"
  | "expense_approved"
  | "expense_rejected"
  | "task_assigned"
  | "task_completed"
  | "task_overdue"
  | "followup_created"
  | "followup_due"
  | "followup_completed"
  | "payment_received"
  | "payment_failed"
  | "reminder"
  | "system"
  | "assignment"
  | "mention"
  | "comment"
  | "file_uploaded"
  | "email_sent"
  | "email_failed"
  | "subscription_expiring"
  | "subscription_expired"
  | "trial_expiring"
  | "trial_expired";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export type EntityType =
  | "lead"
  | "customer"
  | "invoice"
  | "estimate"
  | "booking"
  | "expense"
  | "task"
  | "followup"
  | "payment"
  | "email"
  | "file"
  | "comment"
  | "user"
  | "subscription";

export interface NotificationData {
  tenantId: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  entityType?: EntityType;
  entityId?: number;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  isRead?: boolean;
}

export interface NotificationTemplate {
  title: string;
  message: string;
  priority: NotificationPriority;
  actionUrl?: (data: any) => string;
}

class NotificationService {
  // Notification templates for different types
  private templates: Record<NotificationType, (data: any) => NotificationTemplate> = {
    lead_assigned: (data) => ({
      title: "New Lead Assigned",
      message: `You have been assigned a new lead: ${data.leadName || "Untitled Lead"}`,
      priority: "high",
      actionUrl: () => `/leads/${data.leadId}`,
    }),
    lead_updated: (data) => ({
      title: "Lead Updated",
      message: `Lead "${data.leadName || "Untitled"}" has been updated by ${data.updatedBy || "someone"}`,
      priority: "medium",
      actionUrl: () => `/leads/${data.leadId}`,
    }),
    lead_converted: (data) => ({
      title: "Lead Converted to Customer",
      message: `Lead "${data.leadName || "Untitled"}" has been converted to a customer`,
      priority: "high",
      actionUrl: () => `/customers/${data.customerId}`,
    }),
    lead_status_changed: (data) => ({
      title: "Lead Status Changed",
      message: `Lead "${data.leadName || "Untitled"}" status changed to ${data.newStatus || "unknown"}`,
      priority: "medium",
      actionUrl: () => `/leads/${data.leadId}`,
    }),
    customer_created: (data) => ({
      title: "New Customer Created",
      message: `A new customer "${data.customerName || "Untitled"}" has been created`,
      priority: "medium",
      actionUrl: () => `/customers/${data.customerId}`,
    }),
    customer_updated: (data) => ({
      title: "Customer Updated",
      message: `Customer "${data.customerName || "Untitled"}" has been updated`,
      priority: "low",
      actionUrl: () => `/customers/${data.customerId}`,
    }),
    customer_assigned: (data) => ({
      title: "Customer Assigned",
      message: `You have been assigned customer: ${data.customerName || "Untitled"}`,
      priority: "high",
      actionUrl: () => `/customers/${data.customerId}`,
    }),
    invoice_created: (data) => ({
      title: "Invoice Created",
      message: `A new invoice #${data.invoiceNumber || data.invoiceId} has been created for ${data.customerName || "customer"}`,
      priority: "medium",
      actionUrl: () => `/invoices/${data.invoiceId}`,
    }),
    invoice_sent: (data) => ({
      title: "Invoice Sent",
      message: `Invoice #${data.invoiceNumber || data.invoiceId} has been sent to ${data.customerName || "customer"}`,
      priority: "medium",
      actionUrl: () => `/invoices/${data.invoiceId}`,
    }),
    invoice_paid: (data) => ({
      title: "Invoice Paid",
      message: `Invoice #${data.invoiceNumber || data.invoiceId} has been paid. Amount: ${data.amount || "N/A"}`,
      priority: "high",
      actionUrl: () => `/invoices/${data.invoiceId}`,
    }),
    invoice_overdue: (data) => ({
      title: "Invoice Overdue",
      message: `Invoice #${data.invoiceNumber || data.invoiceId} is now overdue. Amount: ${data.amount || "N/A"}`,
      priority: "urgent",
      actionUrl: () => `/invoices/${data.invoiceId}`,
    }),
    estimate_created: (data) => ({
      title: "Estimate Created",
      message: `A new estimate #${data.estimateNumber || data.estimateId} has been created`,
      priority: "medium",
      actionUrl: () => `/estimates/${data.estimateId}`,
    }),
    estimate_sent: (data) => ({
      title: "Estimate Sent",
      message: `Estimate #${data.estimateNumber || data.estimateId} has been sent to ${data.customerName || "customer"}`,
      priority: "medium",
      actionUrl: () => `/estimates/${data.estimateId}`,
    }),
    estimate_accepted: (data) => ({
      title: "Estimate Accepted",
      message: `Estimate #${data.estimateNumber || data.estimateId} has been accepted by ${data.customerName || "customer"}`,
      priority: "high",
      actionUrl: () => `/estimates/${data.estimateId}`,
    }),
    estimate_rejected: (data) => ({
      title: "Estimate Rejected",
      message: `Estimate #${data.estimateNumber || data.estimateId} has been rejected by ${data.customerName || "customer"}`,
      priority: "medium",
      actionUrl: () => `/estimates/${data.estimateId}`,
    }),
    booking_created: (data) => ({
      title: "New Booking Created",
      message: `A new booking has been created for ${data.customerName || "customer"}`,
      priority: "high",
      actionUrl: () => `/bookings/${data.bookingId}`,
    }),
    booking_confirmed: (data) => ({
      title: "Booking Confirmed",
      message: `Booking #${data.bookingId} has been confirmed`,
      priority: "high",
      actionUrl: () => `/bookings/${data.bookingId}`,
    }),
    booking_cancelled: (data) => ({
      title: "Booking Cancelled",
      message: `Booking #${data.bookingId} has been cancelled`,
      priority: "high",
      actionUrl: () => `/bookings/${data.bookingId}`,
    }),
    expense_created: (data) => ({
      title: "Expense Created",
      message: `A new expense of ${data.amount || "N/A"} has been created`,
      priority: "medium",
      actionUrl: () => `/expenses/${data.expenseId}`,
    }),
    expense_approved: (data) => ({
      title: "Expense Approved",
      message: `Expense #${data.expenseId} has been approved`,
      priority: "medium",
      actionUrl: () => `/expenses/${data.expenseId}`,
    }),
    expense_rejected: (data) => ({
      title: "Expense Rejected",
      message: `Expense #${data.expenseId} has been rejected`,
      priority: "medium",
      actionUrl: () => `/expenses/${data.expenseId}`,
    }),
    task_assigned: (data) => ({
      title: "Task Assigned",
      message: `You have been assigned a new task: ${data.taskTitle || "Untitled Task"}`,
      priority: "high",
      actionUrl: () => `/tasks/${data.taskId}`,
    }),
    task_completed: (data) => ({
      title: "Task Completed",
      message: `Task "${data.taskTitle || "Untitled"}" has been completed`,
      priority: "medium",
      actionUrl: () => `/tasks/${data.taskId}`,
    }),
    task_overdue: (data) => ({
      title: "Task Overdue",
      message: `Task "${data.taskTitle || "Untitled"}" is now overdue`,
      priority: "urgent",
      actionUrl: () => `/tasks/${data.taskId}`,
    }),
    followup_created: (data) => ({
      title: "Follow-up Created",
      message: `A new follow-up has been created: ${data.followupTitle || "Untitled"}`,
      priority: "medium",
      actionUrl: () => `/followups/${data.followupId}`,
    }),
    followup_due: (data) => ({
      title: "Follow-up Due",
      message: `Follow-up "${data.followupTitle || "Untitled"}" is due now`,
      priority: "high",
      actionUrl: () => `/followups/${data.followupId}`,
    }),
    followup_completed: (data) => ({
      title: "Follow-up Completed",
      message: `Follow-up "${data.followupTitle || "Untitled"}" has been completed`,
      priority: "low",
      actionUrl: () => `/followups/${data.followupId}`,
    }),
    payment_received: (data) => ({
      title: "Payment Received",
      message: `Payment of ${data.amount || "N/A"} has been received for invoice #${data.invoiceNumber || data.invoiceId}`,
      priority: "high",
      actionUrl: () => `/invoices/${data.invoiceId}`,
    }),
    payment_failed: (data) => ({
      title: "Payment Failed",
      message: `Payment attempt failed for invoice #${data.invoiceNumber || data.invoiceId}`,
      priority: "urgent",
      actionUrl: () => `/invoices/${data.invoiceId}`,
    }),
    reminder: (data) => ({
      title: data.reminderTitle || "Reminder",
      message: data.reminderMessage || "You have a reminder",
      priority: data.priority || "medium",
      actionUrl: data.actionUrl ? () => data.actionUrl : undefined,
    }),
    system: (data) => ({
      title: data.title || "System Notification",
      message: data.message || "System update",
      priority: "medium",
      actionUrl: data.actionUrl ? () => data.actionUrl : undefined,
    }),
    assignment: (data) => ({
      title: "New Assignment",
      message: `You have been assigned to ${data.entityType || "item"}: ${data.entityName || "Untitled"}`,
      priority: "high",
      actionUrl: data.actionUrl ? () => data.actionUrl : undefined,
    }),
    mention: (data) => ({
      title: "You were mentioned",
      message: `${data.mentionedBy || "Someone"} mentioned you in ${data.entityType || "a comment"}`,
      priority: "medium",
      actionUrl: data.actionUrl ? () => data.actionUrl : undefined,
    }),
    comment: (data) => ({
      title: "New Comment",
      message: `${data.commentedBy || "Someone"} commented on ${data.entityType || "an item"}`,
      priority: "low",
      actionUrl: data.actionUrl ? () => data.actionUrl : undefined,
    }),
    file_uploaded: (data) => ({
      title: "File Uploaded",
      message: `A new file "${data.fileName || "Untitled"}" has been uploaded`,
      priority: "low",
      actionUrl: data.actionUrl ? () => data.actionUrl : undefined,
    }),
    email_sent: (data) => ({
      title: "Email Sent",
      message: `Email "${data.emailSubject || "Untitled"}" has been sent successfully`,
      priority: "low",
      actionUrl: data.actionUrl ? () => data.actionUrl : undefined,
    }),
    email_failed: (data) => ({
      title: "Email Failed",
      message: `Failed to send email "${data.emailSubject || "Untitled"}"`,
      priority: "high",
      actionUrl: data.actionUrl ? () => data.actionUrl : undefined,
    }),
    subscription_expiring: (data) => ({
      title: "Subscription Expiring Soon",
      message: `Your subscription will expire in ${data.daysLeft || 0} days`,
      priority: "high",
      actionUrl: () => `/subscription`,
    }),
    subscription_expired: (data) => ({
      title: "Subscription Expired",
      message: `Your subscription has expired. Please renew to continue using the service`,
      priority: "urgent",
      actionUrl: () => `/subscription`,
    }),
    trial_expiring: (data) => ({
      title: "Trial Expiring Soon",
      message: `Your trial will expire in ${data.daysLeft || 0} days`,
      priority: "high",
      actionUrl: () => `/subscription`,
    }),
    trial_expired: (data) => ({
      title: "Trial Expired",
      message: `Your trial has expired. Please upgrade to continue using the service`,
      priority: "urgent",
      actionUrl: () => `/subscription`,
    }),
  };

  /**
   * Create a notification using a template
   */
  async createNotification(
    type: NotificationType,
    data: {
      tenantId: number;
      userId: number;
      entityType?: EntityType;
      entityId?: number;
      metadata?: Record<string, any>;
      expiresAt?: Date;
      priority?: NotificationPriority;
      [key: string]: any; // Additional data for template
    }
  ): Promise<any> {
    try {
      const template = this.templates[type](data);
      const actionUrl = template.actionUrl ? template.actionUrl(data) : undefined;

      const notificationData: NotificationData = {
        tenantId: data.tenantId,
        userId: data.userId,
        title: template.title,
        message: template.message,
        type,
        priority: data.priority || template.priority,
        entityType: data.entityType,
        entityId: data.entityId,
        actionUrl,
        metadata: {
          ...data.metadata,
          ...data,
        },
        expiresAt: data.expiresAt,
        isRead: false,
      };

      return await simpleStorage.createNotification(notificationData);
    } catch (error) {
      console.error(`Error creating notification (${type}):`, error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    type: NotificationType,
    data: {
      tenantId: number;
      userIds: number[];
      entityType?: EntityType;
      entityId?: number;
      metadata?: Record<string, any>;
      expiresAt?: Date;
      priority?: NotificationPriority;
      [key: string]: any;
    }
  ): Promise<any[]> {
    const notifications = [];
    for (const userId of data.userIds) {
      try {
        const notification = await this.createNotification(type, {
          ...data,
          userId,
        });
        notifications.push(notification);
      } catch (error) {
        console.error(`Error creating notification for user ${userId}:`, error);
      }
    }
    return notifications;
  }

  /**
   * Create notification for all users in a tenant (for system-wide notifications)
   */
  async createTenantNotification(
    type: NotificationType,
    data: {
      tenantId: number;
      entityType?: EntityType;
      entityId?: number;
      metadata?: Record<string, any>;
      expiresAt?: Date;
      priority?: NotificationPriority;
      excludeUserIds?: number[];
      [key: string]: any;
    }
  ): Promise<any[]> {
    try {
      // Get all users in the tenant
      let users;
      if (data.excludeUserIds && data.excludeUserIds.length > 0) {
        // Use ANY for array comparison in PostgreSQL
        users = await sql`
          SELECT id FROM users 
          WHERE tenant_id = ${data.tenantId}
          AND id != ALL(${sql.array(data.excludeUserIds)})
        `;
      } else {
        users = await sql`
          SELECT id FROM users 
          WHERE tenant_id = ${data.tenantId}
        `;
      }
      const userIds = users.map((u: any) => u.id);
      return await this.createBulkNotifications(type, {
        ...data,
        userIds,
      });
    } catch (error) {
      console.error("Error creating tenant notification:", error);
      throw error;
    }
  }

  /**
   * Create notification for users with specific role
   */
  async createRoleNotification(
    type: NotificationType,
    data: {
      tenantId: number;
      roleName: string;
      entityType?: EntityType;
      entityId?: number;
      metadata?: Record<string, any>;
      expiresAt?: Date;
      priority?: NotificationPriority;
      [key: string]: any;
    }
  ): Promise<any[]> {
    try {
      // Get all users with the specified role
      const users = await sql`
        SELECT u.id 
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.tenant_id = ${data.tenantId} AND r.name = ${data.roleName}
      `;

      const userIds = users.map((u: any) => u.id);
      return await this.createBulkNotifications(type, {
        ...data,
        userIds,
      });
    } catch (error) {
      console.error("Error creating role notification:", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();


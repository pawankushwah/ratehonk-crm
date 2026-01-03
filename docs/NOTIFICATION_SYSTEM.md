# Comprehensive Notification System

## Overview

This notification system provides a complete solution for managing notifications across all modules in the CRM application. It supports multiple notification types, priorities, filtering, and user preferences.

## Features

- ✅ **40+ Notification Types** - Covers all modules (leads, customers, invoices, tasks, etc.)
- ✅ **Priority Levels** - Urgent, High, Medium, Low
- ✅ **Filtering & Search** - Filter by type, priority, read/unread status
- ✅ **User Preferences** - Control which notifications to receive
- ✅ **Action URLs** - Click notifications to navigate to relevant pages
- ✅ **Auto-expiration** - Notifications can expire automatically
- ✅ **Bulk Operations** - Mark all as read, delete all read notifications
- ✅ **Real-time Updates** - Polling every 30 seconds for new notifications
- ✅ **Module Integration** - Easy-to-use helper functions for all modules

## Architecture

### Backend Components

1. **Notification Service** (`server/notification-service.ts`)
   - Core notification creation logic
   - Template system for different notification types
   - Support for single, bulk, tenant-wide, and role-based notifications

2. **Notification Helpers** (`server/notification-helpers.ts`)
   - Easy-to-use functions for each module
   - Examples: `leadNotifications.assigned()`, `invoiceNotifications.paid()`

3. **API Endpoints** (`server/simple-routes.ts`)
   - GET `/api/user/notifications` - Get user notifications with filtering
   - PUT `/api/user/notifications/:id/read` - Mark as read
   - PUT `/api/user/notifications/mark-all-read` - Mark all as read
   - DELETE `/api/user/notifications/:id` - Delete notification
   - DELETE `/api/user/notifications/read/all` - Delete all read
   - GET `/api/user/notification-preferences` - Get preferences
   - PUT `/api/user/notification-preferences` - Save preferences

4. **Database Storage** (`server/simple-storage.ts`)
   - Notification CRUD operations
   - Preference management

### Frontend Components

1. **NotificationBell** (`client/src/components/notifications/NotificationBell.tsx`)
   - Enhanced notification dropdown
   - Filtering by type and priority
   - Delete individual notifications
   - Mark all as read
   - Beautiful UI with icons and badges

2. **NotificationPreferences** (`client/src/components/notifications/NotificationPreferences.tsx`)
   - User preference management
   - Module-specific toggles
   - Priority filters

## Notification Types

### Lead Notifications
- `lead_assigned` - When a lead is assigned to a user
- `lead_updated` - When a lead is updated
- `lead_converted` - When a lead is converted to customer
- `lead_status_changed` - When lead status changes

### Customer Notifications
- `customer_created` - New customer created
- `customer_updated` - Customer information updated
- `customer_assigned` - Customer assigned to user

### Invoice Notifications
- `invoice_created` - New invoice created
- `invoice_sent` - Invoice sent to customer
- `invoice_paid` - Invoice payment received
- `invoice_overdue` - Invoice is overdue

### Estimate Notifications
- `estimate_created` - New estimate created
- `estimate_sent` - Estimate sent to customer
- `estimate_accepted` - Estimate accepted by customer
- `estimate_rejected` - Estimate rejected by customer

### Booking Notifications
- `booking_created` - New booking created
- `booking_confirmed` - Booking confirmed
- `booking_cancelled` - Booking cancelled

### Task Notifications
- `task_assigned` - Task assigned to user
- `task_completed` - Task completed
- `task_overdue` - Task is overdue

### Follow-up Notifications
- `followup_created` - New follow-up created
- `followup_due` - Follow-up is due
- `followup_completed` - Follow-up completed

### Payment Notifications
- `payment_received` - Payment received
- `payment_failed` - Payment failed

### Expense Notifications
- `expense_created` - New expense created
- `expense_approved` - Expense approved
- `expense_rejected` - Expense rejected

### Email Notifications
- `email_sent` - Email sent successfully
- `email_failed` - Email sending failed

### Subscription Notifications
- `subscription_expiring` - Subscription expiring soon
- `subscription_expired` - Subscription expired
- `trial_expiring` - Trial expiring soon
- `trial_expired` - Trial expired

### System Notifications
- `reminder` - Custom reminder
- `system` - System-wide notification
- `assignment` - General assignment
- `mention` - User mentioned
- `comment` - New comment
- `file_uploaded` - File uploaded

## Usage Examples

### Creating a Notification

```typescript
import { leadNotifications } from "@/server/notification-helpers";

// When a lead is assigned
await leadNotifications.assigned(
  tenantId,
  assignedUserId,
  leadId,
  leadName
);

// When an invoice is paid
import { invoiceNotifications } from "@/server/notification-helpers";

await invoiceNotifications.paid(
  tenantId,
  userId,
  invoiceId,
  invoiceNumber,
  amount
);
```

### Using the Notification Service Directly

```typescript
import { notificationService } from "@/server/notification-service";

// Create a custom notification
await notificationService.createNotification("reminder", {
  tenantId: 1,
  userId: 2,
  reminderTitle: "Follow up with customer",
  reminderMessage: "Don't forget to call John tomorrow",
  actionUrl: "/customers/123",
  priority: "high",
});

// Create notification for multiple users
await notificationService.createBulkNotifications("system", {
  tenantId: 1,
  userIds: [1, 2, 3],
  title: "System Maintenance",
  message: "Scheduled maintenance tonight at 2 AM",
});
```

## Integration Guide

### Step 1: Import Helpers

```typescript
import { 
  leadNotifications,
  invoiceNotifications,
  taskNotifications 
} from "@/server/notification-helpers";
```

### Step 2: Add Notifications to Your Module

Example in lead creation:

```typescript
// After creating a lead
const lead = await createLead(data);

// Notify assigned user
if (lead.assignedUserId) {
  await leadNotifications.assigned(
    tenantId,
    lead.assignedUserId,
    lead.id,
    lead.name
  );
}
```

Example in invoice payment:

```typescript
// After recording payment
await recordPayment(invoiceId, amount);

// Notify relevant users
await invoiceNotifications.paid(
  tenantId,
  invoice.createdBy,
  invoiceId,
  invoice.number,
  amount
);
```

## Database Schema

The `user_notifications` table includes:
- `id` - Primary key
- `tenant_id` - Tenant reference
- `user_id` - User reference
- `title` - Notification title
- `message` - Notification message
- `type` - Notification type (e.g., "lead_assigned")
- `entity_type` - Related entity type (e.g., "lead")
- `entity_id` - Related entity ID
- `is_read` - Read status
- `priority` - Priority level (low, medium, high, urgent)
- `action_url` - URL to navigate when clicked
- `metadata` - Additional JSON data
- `expires_at` - Auto-expiration timestamp
- `created_at` - Creation timestamp

## Notification Preferences

Users can customize:
- **Delivery Methods**: In-app, Email, Push
- **Module Preferences**: Enable/disable notifications per module
- **Priority Filters**: Show only urgent or high+ priority

## Best Practices

1. **Use Appropriate Priorities**
   - `urgent`: Requires immediate action (overdue invoices, failed payments)
   - `high`: Important but not urgent (assignments, due dates)
   - `medium`: Standard notifications (updates, creations)
   - `low`: Informational (completions, confirmations)

2. **Include Action URLs**
   - Always provide `actionUrl` so users can navigate directly to the relevant page

3. **Use Metadata**
   - Store additional context in `metadata` for future reference

4. **Set Expiration Dates**
   - Use `expiresAt` for time-sensitive notifications

5. **Bulk Notifications**
   - Use `createBulkNotifications` or `createTenantNotification` for system-wide alerts

## Future Enhancements

- [ ] Real-time notifications via WebSockets
- [ ] Email notification delivery
- [ ] Push notification support
- [ ] Notification sound preferences
- [ ] Notification grouping/threading
- [ ] Notification analytics
- [ ] Scheduled notifications
- [ ] Notification templates customization


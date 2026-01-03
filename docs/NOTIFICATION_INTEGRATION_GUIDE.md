# Notification Integration Guide

## Quick Start

### 1. Import Notification Helpers

```typescript
import { 
  leadNotifications,
  invoiceNotifications,
  taskNotifications,
  // ... other helpers
} from "@/server/notification-helpers";
```

### 2. Add Notifications to Your Code

#### Example: Lead Assignment

```typescript
// In your lead assignment function
async function assignLead(leadId: number, userId: number) {
  // ... your assignment logic
  
  // Create notification
  await leadNotifications.assigned(
    tenantId,
    userId,
    leadId,
    lead.name
  );
}
```

#### Example: Invoice Payment

```typescript
// In your payment processing function
async function processPayment(invoiceId: number, amount: number) {
  // ... your payment logic
  
  const invoice = await getInvoice(invoiceId);
  
  // Notify invoice creator
  await invoiceNotifications.paid(
    tenantId,
    invoice.createdBy,
    invoiceId,
    invoice.number,
    formatCurrency(amount)
  );
}
```

#### Example: Task Overdue Check (Cron Job)

```typescript
// In your scheduled task checker
async function checkOverdueTasks() {
  const overdueTasks = await getOverdueTasks();
  
  for (const task of overdueTasks) {
    await taskNotifications.overdue(
      task.tenantId,
      task.assignedUserId,
      task.id,
      task.title
    );
  }
}
```

## Module Integration Checklist

### Leads Module
- [ ] Lead assigned → `leadNotifications.assigned()`
- [ ] Lead updated → `leadNotifications.updated()`
- [ ] Lead converted → `leadNotifications.converted()`
- [ ] Lead status changed → `leadNotifications.statusChanged()`

### Customers Module
- [ ] Customer created → `customerNotifications.created()`
- [ ] Customer updated → `customerNotifications.updated()`
- [ ] Customer assigned → `customerNotifications.assigned()`

### Invoices Module
- [ ] Invoice created → `invoiceNotifications.created()`
- [ ] Invoice sent → `invoiceNotifications.sent()`
- [ ] Invoice paid → `invoiceNotifications.paid()`
- [ ] Invoice overdue → `invoiceNotifications.overdue()` (cron job)

### Estimates Module
- [ ] Estimate created → `estimateNotifications.created()`
- [ ] Estimate sent → `estimateNotifications.sent()`
- [ ] Estimate accepted → `estimateNotifications.accepted()`
- [ ] Estimate rejected → `estimateNotifications.rejected()`

### Bookings Module
- [ ] Booking created → `bookingNotifications.created()`
- [ ] Booking confirmed → `bookingNotifications.confirmed()`
- [ ] Booking cancelled → `bookingNotifications.cancelled()`

### Tasks Module
- [ ] Task assigned → `taskNotifications.assigned()`
- [ ] Task completed → `taskNotifications.completed()`
- [ ] Task overdue → `taskNotifications.overdue()` (cron job)

### Follow-ups Module
- [ ] Follow-up created → `followupNotifications.created()`
- [ ] Follow-up due → `followupNotifications.due()` (cron job)
- [ ] Follow-up completed → `followupNotifications.completed()`

### Payments Module
- [ ] Payment received → `paymentNotifications.received()`
- [ ] Payment failed → `paymentNotifications.failed()`

### Expenses Module
- [ ] Expense created → `expenseNotifications.created()`
- [ ] Expense approved → `expenseNotifications.approved()`
- [ ] Expense rejected → `expenseNotifications.rejected()`

### Email Module
- [ ] Email sent → `emailNotifications.sent()`
- [ ] Email failed → `emailNotifications.failed()`

## Scheduled Jobs

Create cron jobs or scheduled tasks for:

1. **Overdue Invoices** - Check daily and notify
2. **Overdue Tasks** - Check daily and notify
3. **Due Follow-ups** - Check hourly and notify
4. **Expiring Subscriptions** - Check daily and notify
5. **Expiring Trials** - Check daily and notify

Example cron job structure:

```typescript
// server/cron/notification-jobs.ts
import { invoiceNotifications, taskNotifications } from "../notification-helpers";

// Run daily at 9 AM
export async function checkOverdueInvoices() {
  const overdueInvoices = await getOverdueInvoices();
  for (const invoice of overdueInvoices) {
    await invoiceNotifications.overdue(
      invoice.tenantId,
      invoice.createdBy,
      invoice.id,
      invoice.number,
      invoice.totalAmount
    );
  }
}
```

## Error Handling

Always wrap notification creation in try-catch to prevent breaking your main flow:

```typescript
try {
  await leadNotifications.assigned(tenantId, userId, leadId, leadName);
} catch (error) {
  console.error("Failed to create notification:", error);
  // Don't throw - notification failure shouldn't break the main operation
}
```

## Testing

Test notifications by:

1. Creating test notifications directly
2. Triggering the actions that should create notifications
3. Checking the notification bell UI
4. Verifying action URLs work correctly


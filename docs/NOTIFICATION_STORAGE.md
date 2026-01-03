# How Notifications Are Stored

## Database Structure

Notifications are stored in the **`user_notifications`** table in PostgreSQL. Here's the complete structure:

### Table Schema

```sql
CREATE TABLE user_notifications (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique ID
    tenant_id INTEGER NOT NULL,               -- Which tenant/organization
    user_id INTEGER NOT NULL,                 -- Which user receives the notification
    title TEXT NOT NULL,                      -- Notification title (e.g., "New Lead Assigned")
    message TEXT NOT NULL,                    -- Notification message/body
    type TEXT NOT NULL,                       -- Notification type (e.g., "lead_assigned", "invoice_paid")
    entity_type TEXT,                         -- Related entity type (e.g., "lead", "invoice", "task")
    entity_id INTEGER,                        -- ID of the related entity (e.g., lead ID, invoice ID)
    is_read BOOLEAN DEFAULT false,           -- Whether user has read it
    priority TEXT DEFAULT 'medium',           -- Priority: 'low', 'medium', 'high', 'urgent'
    action_url TEXT,                          -- URL to navigate when clicked (e.g., "/leads/123")
    metadata JSONB,                           -- Additional data stored as JSON
    expires_at TIMESTAMP,                     -- Optional expiration date
    created_at TIMESTAMP DEFAULT NOW()        -- When notification was created
);
```

### Indexes (for performance)

```sql
CREATE INDEX idx_user_notifications_tenant_id ON user_notifications(tenant_id);
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at);
CREATE INDEX idx_user_notifications_user_tenant ON user_notifications(user_id, tenant_id);
```

## Storage Flow

### Step 1: Notification Creation

When you call a notification helper function:

```typescript
await leadNotifications.assigned(tenantId, userId, leadId, leadName);
```

### Step 2: Notification Service Processing

The `notification-service.ts` processes this:

1. **Template Selection**: Finds the template for `lead_assigned` type
2. **Data Preparation**: Creates notification data object:

```typescript
{
  tenantId: 1,
  userId: 5,
  title: "New Lead Assigned",
  message: "You have been assigned a new lead: John Doe",
  type: "lead_assigned",
  priority: "high",
  entityType: "lead",
  entityId: 123,
  actionUrl: "/leads/123",
  metadata: {
    leadId: 123,
    leadName: "John Doe",
    // ... other context
  },
  isRead: false
}
```

### Step 3: Database Insert

The `simpleStorage.createNotification()` method inserts into database:

```sql
INSERT INTO user_notifications (
  tenant_id, user_id, title, message, type, entity_type,
  entity_id, is_read, priority, action_url, metadata, expires_at, created_at
) VALUES (
  1,                              -- tenant_id
  5,                              -- user_id
  'New Lead Assigned',            -- title
  'You have been assigned a new lead: John Doe',  -- message
  'lead_assigned',                -- type
  'lead',                         -- entity_type
  123,                            -- entity_id
  false,                          -- is_read
  'high',                         -- priority
  '/leads/123',                   -- action_url
  '{"leadId":123,"leadName":"John Doe"}',  -- metadata (JSON)
  NULL,                           -- expires_at (optional)
  NOW()                           -- created_at
)
RETURNING *;
```

## Example Stored Data

### Example 1: Lead Assignment Notification

```json
{
  "id": 1,
  "tenant_id": 1,
  "user_id": 5,
  "title": "New Lead Assigned",
  "message": "You have been assigned a new lead: John Doe",
  "type": "lead_assigned",
  "entity_type": "lead",
  "entity_id": 123,
  "is_read": false,
  "priority": "high",
  "action_url": "/leads/123",
  "metadata": {
    "leadId": 123,
    "leadName": "John Doe",
    "assignedBy": "Admin User"
  },
  "expires_at": null,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Example 2: Invoice Overdue Notification

```json
{
  "id": 2,
  "tenant_id": 1,
  "user_id": 3,
  "title": "Invoice Overdue",
  "message": "Invoice #INV-2024-001 is now overdue. Amount: $1,500.00",
  "type": "invoice_overdue",
  "entity_type": "invoice",
  "entity_id": 456,
  "is_read": false,
  "priority": "urgent",
  "action_url": "/invoices/456",
  "metadata": {
    "invoiceId": 456,
    "invoiceNumber": "INV-2024-001",
    "amount": "1500.00",
    "customerName": "ABC Company",
    "dueDate": "2024-01-10"
  },
  "expires_at": null,
  "created_at": "2024-01-15T09:00:00Z"
}
```

### Example 3: Task Completed Notification

```json
{
  "id": 3,
  "tenant_id": 1,
  "user_id": 7,
  "title": "Task Completed",
  "message": "Task \"Follow up with client\" has been completed",
  "type": "task_completed",
  "entity_type": "task",
  "entity_id": 789,
  "is_read": true,
  "priority": "medium",
  "action_url": "/tasks/789",
  "metadata": {
    "taskId": 789,
    "taskTitle": "Follow up with client",
    "completedBy": "Jane Smith"
  },
  "expires_at": "2024-02-15T00:00:00Z",
  "created_at": "2024-01-15T14:20:00Z"
}
```

## Data Retrieval

### Getting User Notifications

When the frontend requests notifications:

```typescript
GET /api/user/notifications?includeRead=true&type=lead_assigned&priority=high
```

The backend queries:

```sql
SELECT * FROM user_notifications
WHERE user_id = 5 
  AND tenant_id = 1
  AND (expires_at IS NULL OR expires_at > NOW())
  AND type = 'lead_assigned'
  AND priority = 'high'
ORDER BY 
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  created_at DESC
LIMIT 50 OFFSET 0;
```

## Key Storage Features

### 1. **Multi-Tenant Support**
- Each notification is tied to a `tenant_id` for data isolation
- Users only see notifications from their tenant

### 2. **Entity Linking**
- `entity_type` + `entity_id` link notifications to specific records
- Example: `entity_type="lead"`, `entity_id=123` links to lead #123

### 3. **Metadata Storage**
- `metadata` column stores JSON for additional context
- Flexible storage for any extra data needed

### 4. **Auto-Expiration**
- `expires_at` allows notifications to auto-expire
- Queries automatically filter out expired notifications

### 5. **Read Status Tracking**
- `is_read` tracks whether user has seen the notification
- Can filter to show only unread notifications

### 6. **Priority Sorting**
- Notifications are automatically sorted by priority
- Urgent notifications appear first

## Storage Methods

### Creating a Notification

```typescript
// Method: simpleStorage.createNotification(notificationData)
// Location: server/simple-storage.ts

const notification = await simpleStorage.createNotification({
  tenantId: 1,
  userId: 5,
  title: "New Lead Assigned",
  message: "You have been assigned a new lead: John Doe",
  type: "lead_assigned",
  entityType: "lead",
  entityId: 123,
  priority: "high",
  actionUrl: "/leads/123",
  metadata: { leadId: 123, leadName: "John Doe" },
  isRead: false
});
```

### Retrieving Notifications

```typescript
// Method: simpleStorage.getUserNotifications(userId, tenantId, ...)
// Location: server/simple-storage.ts

const notifications = await simpleStorage.getUserNotifications(
  userId: 5,
  tenantId: 1,
  includeRead: true,      // Include read notifications
  type: "lead_assigned",  // Filter by type (optional)
  priority: "high",       // Filter by priority (optional)
  limit: 50,              // Pagination limit
  offset: 0,              // Pagination offset
  unreadOnly: false       // Only unread (optional)
);
```

### Marking as Read

```typescript
// Method: simpleStorage.markNotificationAsRead(notificationId, userId)
await simpleStorage.markNotificationAsRead(1, 5);
```

### Deleting Notifications

```typescript
// Delete single notification
await simpleStorage.deleteNotification(1, 5);

// Delete all read notifications
await simpleStorage.deleteAllReadNotifications(5, 1);
```

## Notification Preferences Storage

User preferences are stored in a separate table:

### `notification_preferences` Table

```sql
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);
```

### Example Preferences Data

```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "inAppNotifications": true,
  "leadNotifications": true,
  "customerNotifications": true,
  "invoiceNotifications": true,
  "taskNotifications": true,
  "urgentOnly": false,
  "highPriorityOnly": false
}
```

## Data Relationships

```
tenants (1) ──┐
              ├──> user_notifications (many)
users (1) ────┘

user_notifications
  ├── tenant_id → tenants.id
  ├── user_id → users.id
  ├── entity_type + entity_id → (leads, customers, invoices, etc.)
```

## Performance Considerations

1. **Indexes**: All common query fields are indexed
2. **Filtering**: Queries filter by user_id + tenant_id first (most selective)
3. **Pagination**: Default limit of 50 notifications per query
4. **Expiration**: Expired notifications are filtered out automatically
5. **Priority Sorting**: Done at database level for efficiency

## Data Lifecycle

1. **Creation**: Notification inserted with `is_read = false`
2. **Display**: User sees notification in bell icon
3. **Interaction**: User clicks → `is_read = true` + navigate to `action_url`
4. **Cleanup**: 
   - Expired notifications filtered out automatically
   - User can delete read notifications
   - Old notifications can be archived

## Summary

- **Storage**: PostgreSQL `user_notifications` table
- **Structure**: 13 columns including title, message, type, priority, metadata
- **Relationships**: Linked to tenants, users, and entities (leads, invoices, etc.)
- **Features**: Multi-tenant, entity linking, metadata, expiration, read tracking
- **Performance**: Indexed for fast queries, pagination support
- **Preferences**: Separate table for user notification preferences


# Follow-Up Feature Enhancement Plan

## Overview
Create a flexible follow-up system where users can add any type of follow-up (not just task-based), assign them to tenant users or self-assign, and display them on the dashboard right sidebar.

## Current State Analysis
- ✅ Existing `follow_ups` table linked to `tasks` (task_id)
- ✅ Basic CRUD endpoints exist (`/api/tenants/:tenantId/follow-ups`)
- ❌ Dashboard currently shows leads instead of actual follow-ups
- ❌ No assignment functionality (assigned_user_id missing)
- ❌ Limited flexibility (only task-based)

## Proposed Solution

### 1. Database Schema Enhancement

#### Create new `general_follow_ups` table (Recommended)
- Keep existing task-based follow-ups intact
- Create new flexible table for general follow-ups
- Better separation of concerns
- Support linking to ANY table (leads, customers, invoices, bookings, etc.)

**Key Requirements:**
- Store table name and ID for linking to any entity
- Support assignment to parent/child users only (role hierarchy)
- Email notification to assigned user
- Quick add from listing pages (leads, customers, invoices, etc.)

### 2. Backend Changes

#### 2.1 Database Migration
- Create `general_follow_ups` table with all fields above
- Add indexes on `tenant_id`, `assigned_user_id`, `due_date`, `status`

#### 2.2 Storage Layer (`server/simple-storage.ts`)
Add methods:
- `createGeneralFollowUp(followUpData)` - Create new follow-up
- `getGeneralFollowUpsByTenant(tenantId, filters)` - Get all follow-ups for tenant
- `getGeneralFollowUpsByAssignedUser(userId, tenantId)` - Get user's assigned follow-ups
- `updateGeneralFollowUp(followUpId, updateData)` - Update follow-up
- `deleteGeneralFollowUp(followUpId)` - Delete follow-up
- `markFollowUpComplete(followUpId, completionNotes)` - Mark as complete
- `reassignFollowUp(followUpId, newUserId)` - Reassign to another user
- `getAssignableUsersForFollowUp(userId, tenantId)` - Get parent + child users based on role hierarchy
- `getRelatedEntityDetails(tableName, tableId)` - Get details of related entity (lead, customer, invoice, etc.)

#### 2.4 Email Service (`server/email-service.ts` or similar)
Add email notification methods:
- `sendFollowUpAssignmentEmail(followUp, assignedUser, createdByUser)` - Send email when follow-up is assigned
- `sendFollowUpReassignmentEmail(followUp, newAssignedUser, reassignedByUser)` - Send email when reassigned
- Email template includes: Follow-up title, description, due date, priority, assigned by, related entity link

#### 2.3 API Routes (`server/simple-routes.ts`)
Add/Update endpoints:
- `GET /api/tenants/:tenantId/follow-ups` - Get all follow-ups (with filters: assigned_to, status, priority, due_date, related_table_name, related_table_id)
- `POST /api/tenants/:tenantId/follow-ups` - Create new follow-up (sends email notification if assigned)
- `GET /api/tenants/:tenantId/follow-ups/:followUpId` - Get single follow-up
- `PATCH /api/tenants/:tenantId/follow-ups/:followUpId` - Update follow-up
- `DELETE /api/tenants/:tenantId/follow-ups/:followUpId` - Delete follow-up
- `POST /api/tenants/:tenantId/follow-ups/:followUpId/complete` - Mark as complete
- `POST /api/tenants/:tenantId/follow-ups/:followUpId/reassign` - Reassign follow-up (sends email notification)
- `GET /api/tenants/:tenantId/follow-ups/assignable-users` - Get list of assignable users (parent + child users based on role hierarchy)

**Filtering & Permissions:**
- Users see their own assigned follow-ups + follow-ups they created
- Managers/Supervisors see team follow-ups based on role hierarchy
- Owner/Admin see all tenant follow-ups

**Email Notifications:**
- Send email when follow-up is created and assigned to another user
- Send email when follow-up is reassigned
- Email includes: Title, Description, Due Date, Priority, Assigned By, Related Entity Link

### 3. Frontend Changes

#### 3.1 New Components

**`client/src/components/follow-ups/CreateFollowUpDialog.tsx`**
- Modal/Dialog for creating follow-ups
- Can be opened from:
  - Dashboard sidebar "Add Follow-Up" button
  - Leads listing page (pre-filled with lead info)
  - Customers listing page (pre-filled with customer info)
  - Invoices listing page (pre-filled with invoice info)
  - Other entity listing pages
- Fields:
  - Title (required)
  - Description (textarea)
  - Due Date & Time (date/time picker)
  - Priority (dropdown: Low, Medium, High, Urgent)
  - Assign To (dropdown: Self, or select from parent/child users only - filtered by role hierarchy)
  - Related To (pre-filled if opened from listing page, or optional manual selection)
    - Table Name: Leads, Customers, Invoices, Bookings, etc.
    - Entity ID: Auto-filled from context
  - Tags (multi-select or input)
  - Reminder (optional checkbox + date/time)
- When assigned to another user, shows confirmation that email will be sent

**`client/src/components/follow-ups/FollowUpCard.tsx`**
- Card component for displaying follow-up in sidebar
- Shows: Title, assigned user, due date, priority badge, status
- Click to expand/view details
- Quick actions: Complete, Edit, Delete

**`client/src/components/follow-ups/FollowUpList.tsx`**
- List component for dashboard sidebar
- Shows filtered follow-ups (pending, due today, overdue)
- Group by: Due Today, Overdue, Upcoming
- "Add Follow-Up" button at top

**`client/src/pages/tenant/follow-ups.tsx`** (Optional full page)
- Full page view of all follow-ups
- Filters: Status, Priority, Assigned To, Due Date Range
- Table/Grid view with sorting
- Bulk actions

#### 3.2 Update Dashboard (`client/src/pages/tenant/dashboard.tsx`)
- Replace current `followUpsArray` (which shows leads) with actual follow-ups
- Fetch from `/api/tenants/:tenantId/follow-ups?status=pending&limit=10&sort=due_date`
- Show in SidebarLists component

#### 3.3 Update SidebarList Component (`client/src/components/dashboard/SidebarList.tsx`)
- Update Follow Ups section to show actual follow-up cards
- Display: Title, assigned user avatar/name, due date, priority indicator, related entity badge
- Click to view/edit follow-up
- Click related entity badge to navigate to that entity
- Show count badge for overdue/pending items
- "Add Follow-Up" button at top

#### 3.4 Add Quick Follow-Up Actions to Listing Pages
**Update listing pages to add "Add Follow-Up" action:**
- `client/src/pages/tenant/leads.tsx` - Add "Add Follow-Up" button/action in row actions
- `client/src/pages/tenant/customers.tsx` - Add "Add Follow-Up" button/action in row actions
- `client/src/pages/tenant/invoices.tsx` - Add "Add Follow-Up" button/action in row actions
- Other entity pages as needed

**Quick Add Flow:**
1. User clicks "Add Follow-Up" on a lead/customer/invoice row
2. Dialog opens with:
   - Title pre-filled: "Follow up on [Entity Type] #[ID]"
   - Related entity pre-filled (table name + ID)
   - Other fields empty for user to fill
3. User fills details and assigns
4. On save, email sent to assigned user (if not self)

### 4. UI/UX Design

#### 4.1 Dashboard Sidebar Follow-Up Section
```
┌─────────────────────────────┐
│ Follow Ups          [+ Add] │
├─────────────────────────────┤
│ 🔴 Call John - Due Today    │
│    Assigned: You            │
│    Due: Today 3:00 PM       │
├─────────────────────────────┤
│ 🟡 Follow up on quote       │
│    Assigned: Sarah          │
│    Due: Tomorrow 10:00 AM   │
├─────────────────────────────┤
│ 🟢 Review proposal          │
│    Assigned: You            │
│    Due: Dec 25, 2:00 PM    │
└─────────────────────────────┘
```

#### 4.2 Create Follow-Up Dialog
```
┌─────────────────────────────────────┐
│ Create Follow-Up            [X]     │
├─────────────────────────────────────┤
│ Title *                            │
│ [_____________________________]    │
│                                     │
│ Description                        │
│ [_____________________________]    │
│ [_____________________________]    │
│                                     │
│ Due Date & Time *                  │
│ [Date] [Time]                      │
│                                     │
│ Priority *                          │
│ [Medium ▼]                         │
│                                     │
│ Assign To *                        │
│ [Self ▼] or [Select User ▼]       │
│                                     │
│ Related To (Optional)               │
│ [None ▼] [Lead #123] [Customer]   │
│                                     │
│ Tags                                │
│ [Add tag...]                        │
│                                     │
│ ☐ Set Reminder                      │
│                                     │
│ [Cancel]  [Create Follow-Up]       │
└─────────────────────────────────────┘
```

### 5. Features & Functionality

#### 5.1 Core Features
- ✅ Create follow-up with flexible content
- ✅ Assign to self or other tenant users
- ✅ Set due date & time
- ✅ Set priority levels
- ✅ Link to related entities (leads, customers, bookings, etc.)
- ✅ Add tags for categorization
- ✅ Set reminders
- ✅ Mark as complete with notes
- ✅ Edit/Update follow-ups
- ✅ Delete follow-ups
- ✅ Reassign follow-ups

#### 5.2 Display Features
- ✅ Show on dashboard sidebar
- ✅ Filter by status (pending, completed, overdue)
- ✅ Group by due date (Today, Tomorrow, This Week, Overdue)
- ✅ Color coding by priority
- ✅ Show assigned user avatar/name
- ✅ Quick actions (complete, edit, delete)

#### 5.3 Permissions & Access Control
- Users see:
  - Follow-ups assigned to them
  - Follow-ups they created
- Managers/Supervisors see:
  - Their assigned follow-ups
  - Follow-ups of users in their team (role hierarchy)
- Owner/Admin see:
  - All tenant follow-ups

#### 5.4 User Assignment Rules
- When assigning follow-up:
  - User can assign to themselves
  - User can assign to their parent user (manager/supervisor)
  - User can assign to their child users (direct reports)
  - Uses role hierarchy to determine parent/child relationships
  - Dropdown shows only assignable users (filtered by role hierarchy)

#### 5.5 Email Notifications
- Email sent automatically when:
  - Follow-up is created and assigned to another user
  - Follow-up is reassigned to another user
- Email includes:
  - Follow-up title and description
  - Due date and time
  - Priority level
  - Assigned by (creator/reassigner name)
  - Link to related entity (if applicable)
  - Direct link to follow-up in dashboard
- Email template: Professional, clear, actionable

### 6. Implementation Steps

#### Phase 1: Database & Backend
1. Create database migration for `general_follow_ups` table
2. Add storage methods in `simple-storage.ts`
   - Include method to get assignable users (parent + child based on role hierarchy)
   - Include method to get related entity details
3. Add API routes in `simple-routes.ts`
   - Include endpoint for assignable users
4. Implement email notification service
   - Create email template for follow-up assignment
   - Integrate email sending on create/reassign
5. Test API endpoints

#### Phase 2: Frontend Components
1. Create `CreateFollowUpDialog` component
2. Create `FollowUpCard` component
3. Create `FollowUpList` component
4. Update `SidebarList` to use new components

#### Phase 3: Dashboard Integration
1. Update dashboard to fetch follow-ups
2. Replace leads array with follow-ups array
3. Add "Add Follow-Up" button in sidebar
4. Update follow-up cards to show related entity badges
5. Add click handlers to navigate to related entities
6. Test display and interactions

#### Phase 3.5: Listing Page Integration
1. Add "Add Follow-Up" action button to leads listing page
2. Add "Add Follow-Up" action button to customers listing page
3. Add "Add Follow-Up" action button to invoices listing page
4. Pre-fill dialog with entity context when opened from listing page
5. Test quick add flow from each listing page

#### Phase 4: Enhancements (Optional)
1. Add full follow-ups page (`/follow-ups`)
2. Add notifications for due/overdue follow-ups
3. Add email reminders
4. Add follow-up templates
5. Add bulk operations

### 7. Database Schema (Detailed)

```sql
CREATE TABLE general_follow_ups (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by_user_id INTEGER NOT NULL REFERENCES users(id),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP NOT NULL,
  
  -- Flexible entity linking - store table name and ID
  related_table_name VARCHAR(100), -- 'leads', 'customers', 'invoices', 'bookings', 'tasks', 'estimates', 'expenses', etc.
  related_table_id INTEGER, -- ID from the related table
  
  tags TEXT[] DEFAULT '{}',
  reminder_date TIMESTAMP,
  completed_at TIMESTAMP,
  completion_notes TEXT,
  email_sent BOOLEAN DEFAULT FALSE, -- Track if email notification was sent
  email_sent_at TIMESTAMP, -- When email was sent
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_general_follow_ups_tenant_id ON general_follow_ups(tenant_id);
CREATE INDEX idx_general_follow_ups_assigned_user ON general_follow_ups(assigned_user_id);
CREATE INDEX idx_general_follow_ups_due_date ON general_follow_ups(due_date);
CREATE INDEX idx_general_follow_ups_status ON general_follow_ups(status);
CREATE INDEX idx_general_follow_ups_created_by ON general_follow_ups(created_by_user_id);
CREATE INDEX idx_general_follow_ups_related_entity ON general_follow_ups(related_table_name, related_table_id);
```

**Supported Entity Types:**
- `leads` - Link to leads table
- `customers` - Link to customers table
- `invoices` - Link to invoices table
- `bookings` - Link to bookings table
- `estimates` - Link to estimates table
- `expenses` - Link to expenses table
- `tasks` - Link to tasks table
- `packages` - Link to packages table
- `vendors` - Link to vendors table
- `general` - No specific link (standalone follow-up)

### 8. API Request/Response Examples

#### Create Follow-Up
```json
POST /api/tenants/45/follow-ups
{
  "title": "Call John about quote",
  "description": "Follow up on the proposal sent last week",
  "dueDate": "2024-12-20T15:00:00Z",
  "priority": "high",
  "assignedUserId": 123, // or null for self-assigned
  "relatedTableName": "leads", // 'leads', 'customers', 'invoices', 'bookings', etc.
  "relatedTableId": 456, // ID from the related table
  "tags": ["sales", "urgent"],
  "reminderDate": "2024-12-20T14:00:00Z"
}

Response:
{
  "id": 1,
  "title": "Call John about quote",
  "description": "Follow up on the proposal sent last week",
  "assignedUserId": 123,
  "assignedUserName": "John Doe",
  "assignedUserEmail": "john@example.com",
  "createdByUserId": 456,
  "createdByName": "Jane Smith",
  "priority": "high",
  "status": "pending",
  "dueDate": "2024-12-20T15:00:00Z",
  "relatedTableName": "leads",
  "relatedTableId": 456,
  "tags": ["sales", "urgent"],
  "reminderDate": "2024-12-20T14:00:00Z",
  "emailSent": true,
  "emailSentAt": "2024-12-18T10:00:00Z",
  "createdAt": "2024-12-18T10:00:00Z",
  "updatedAt": "2024-12-18T10:00:00Z"
}
```

#### Get Assignable Users (for dropdown)
```
GET /api/tenants/45/follow-ups/assignable-users

Response:
{
  "users": [
    {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Manager",
      "relationship": "parent" // 'parent', 'child', or 'self'
    },
    {
      "id": 456,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "Sales Rep",
      "relationship": "child"
    }
  ]
}
```

#### Get Follow-Ups
```
GET /api/tenants/45/follow-ups?status=pending&priority=high&assignedTo=123&limit=10&sort=due_date
```

#### Response
```json
{
  "data": [
    {
      "id": 1,
      "title": "Call John about quote",
      "description": "Follow up on the proposal...",
      "assignedUserId": 123,
      "assignedUserName": "John Doe",
      "assignedUserEmail": "john@example.com",
      "createdByUserId": 456,
      "createdByName": "Jane Smith",
      "priority": "high",
      "status": "pending",
      "dueDate": "2024-12-20T15:00:00Z",
      "relatedTableName": "leads",
      "relatedTableId": 456,
      "relatedEntityDetails": {
        "id": 456,
        "name": "ABC Company",
        "email": "contact@abc.com"
      },
      "tags": ["sales", "urgent"],
      "reminderDate": "2024-12-20T14:00:00Z",
      "emailSent": true,
      "emailSentAt": "2024-12-18T10:00:00Z",
      "createdAt": "2024-12-18T10:00:00Z",
      "updatedAt": "2024-12-18T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

### 9. Testing Checklist
- [ ] Create follow-up (self-assigned)
- [ ] Create follow-up (assign to parent user)
- [ ] Create follow-up (assign to child user)
- [ ] Create follow-up from leads listing page
- [ ] Create follow-up from customers listing page
- [ ] Create follow-up from invoices listing page
- [ ] View follow-ups on dashboard sidebar
- [ ] Filter follow-ups by status/priority
- [ ] Mark follow-up as complete
- [ ] Edit follow-up
- [ ] Delete follow-up
- [ ] Reassign follow-up
- [ ] Link follow-up to related entity (leads, customers, invoices, etc.)
- [ ] Navigate to related entity from follow-up card
- [ ] Permission checks (users see only their assigned + created)
- [ ] Manager sees team follow-ups
- [ ] Owner sees all follow-ups
- [ ] Assignable users dropdown shows only parent/child users
- [ ] Email notification sent when assigned to another user
- [ ] Email notification sent when reassigned
- [ ] Email contains all follow-up details and links
- [ ] Email template renders correctly

### 10. Email Template Design

**Subject:** New Follow-Up Assigned: [Title]

**Body:**
```
Hello [Assigned User Name],

A new follow-up has been assigned to you:

Title: [Follow-Up Title]
Description: [Description]
Due Date: [Due Date & Time]
Priority: [Priority Level]
Assigned By: [Created By Name]

[If Related Entity Exists]
Related To: [Entity Type] #[ID]
View [Entity Type]: [Link to entity]

View Follow-Up: [Link to dashboard follow-ups]

Best regards,
CRM System
```

### 11. Supported Entity Types for Linking

The system will support linking follow-ups to:
- ✅ Leads (`leads` table)
- ✅ Customers (`customers` table)
- ✅ Invoices (`invoices` table)
- ✅ Bookings (`bookings` table)
- ✅ Estimates (`estimates` table)
- ✅ Expenses (`expenses` table)
- ✅ Tasks (`tasks` table)
- ✅ Travel Packages (`packages` table)
- ✅ Vendors (`vendors` table)
- ✅ General (no link)

### 12. Future Enhancements (Post-MVP)
- Follow-up templates
- Recurring follow-ups
- SMS notifications (in addition to email)
- Calendar integration
- Follow-up analytics/reports
- Mobile app support
- Follow-up comments/notes history
- File attachments
- Bulk follow-up creation
- Follow-up reminders (email before due date)

---

## Approval Required
Please review this plan and approve before implementation. Any changes or additions needed?


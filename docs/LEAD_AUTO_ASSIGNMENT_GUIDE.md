# Lead Auto-Assignment Guide

## Overview
The system automatically assigns leads to users when they are created, prioritizing users based on their roles and current workload. **The priority role is configurable per tenant**, allowing you to set which role should receive leads first.

## How It Works

### Assignment Priority Order:
1. **Configured Priority Role** (Highest Priority - Configurable)
   - First, the system checks tenant settings for `autoAssignmentPriorityRoleId`
   - If configured, assigns to users with that role first
   - Selects the user with the least active leads for balanced distribution
   - **This is configurable and can be changed anytime**

2. **Preferred Role** (If specified)
   - If a lead type has a `preferred_role_id`, it will prioritize that role
   - Includes child roles in the hierarchy

3. **Lowest Hierarchy Level**
   - Finds users at the lowest hierarchy level (sales reps, not managers)
   - Ensures leads go to field workers rather than supervisors

4. **Least Workload**
   - Among eligible users, selects the one with the least active leads
   - Ensures balanced workload distribution

## Current Implementation

The auto-assignment happens automatically in the `createLead` function in `server/simple-storage.ts`:

```typescript
// Auto-assign lead if userId not provided
let finalUserId = userId;
if (!finalUserId && tenantId) {
  // Get role ID from lead type if available (for role-based assignment)
  const [leadType] = leadData.leadTypeId 
    ? await sql`SELECT id, preferred_role_id FROM lead_types WHERE id = ${leadData.leadTypeId} AND tenant_id = ${tenantId}`
    : [null];
  
  const preferredRoleId = leadType?.preferred_role_id || null;
  finalUserId = await this.autoAssignLead(tenantId, finalLeadTypeId, preferredRoleId);
}
```

## How to Use

### 1. Configure Priority Role (Required)
You need to set which role should be prioritized for auto-assignment:

**Option A: Via API**
```http
PUT /api/tenant-settings/auto-assignment
Authorization: Bearer <token>
Content-Type: application/json

{
  "autoAssignmentPriorityRoleId": 68  // Role ID you want to prioritize
}
```

**Option B: Via Tenant Settings API**
```http
PUT /api/tenant-settings/whatsapp
Authorization: Bearer <token>
Content-Type: application/json

{
  "autoAssignmentPriorityRoleId": 68,
  "enableLeadWelcomeMessage": true,
  "leadWelcomeMessage": "...",
  // ... other settings
}
```

**To remove priority role (use default behavior):**
```json
{
  "autoAssignmentPriorityRoleId": null
}
```

### 2. Ensure Priority Role Has Active Users
- Go to `/roles` page to find your role ID
- Ensure users are assigned to the priority role
- Users must be active (`is_active = true`)

### 3. Create Leads Without Manual Assignment
When creating a lead:
- **Don't** provide `assignedUserId` in the request
- The system will automatically assign it to a user with the configured priority role
- If no users exist with that role, it falls back to other eligible users

### 4. Verify Assignment
- Check the lead details after creation
- The `assignedUserId` field will show which user was assigned
- Check server logs for assignment details

## Testing

### Test Scenario 1: Configured Priority Role
1. Create a role (e.g., "Travel Consultant", "Sales Executive", etc.)
2. Note the role ID from the roles page
3. Set it as priority role via API: `PUT /api/tenant-settings/auto-assignment`
4. Create 2-3 users with this role
5. Create a lead without specifying `assignedUserId`
6. Verify the lead is assigned to one of the priority role users

### Test Scenario 2: Workload Balancing
1. Set a priority role via API
2. Create multiple users with that role
3. Create several leads
4. Verify leads are distributed evenly among priority role users based on their current workload

### Test Scenario 3: Change Priority Role
1. Set Role A as priority, create a lead → assigned to Role A user
2. Change priority to Role B via API
3. Create another lead → should be assigned to Role B user

### Test Scenario 4: Fallback Behavior
1. Set a priority role that has no active users
2. Create a lead
3. Verify the lead is assigned to another eligible user based on hierarchy and workload

### Test Scenario 5: Remove Priority Role
1. Set `autoAssignmentPriorityRoleId: null` via API
2. Create a lead
3. Verify assignment uses default logic (preferred role → hierarchy → workload)

## Customization

### Change Priority Role (Dynamic)
The priority role is now **fully configurable** via API. No code changes needed!

**Set Priority Role:**
```http
PUT /api/tenant-settings/auto-assignment
{
  "autoAssignmentPriorityRoleId": <role_id>
}
```

**Remove Priority Role (use defaults):**
```http
PUT /api/tenant-settings/auto-assignment
{
  "autoAssignmentPriorityRoleId": null
}
```

**Get Current Settings:**
```http
GET /api/tenant-settings
```

The response will include `autoAssignmentPriorityRoleId` if configured.

### Benefits of Dynamic Configuration
- ✅ Change priority role without code deployment
- ✅ Different tenants can have different priority roles
- ✅ Easy to test different assignment strategies
- ✅ Can be changed anytime based on business needs

## API Endpoints

### Create Lead (Auto-Assignment)
```http
POST /api/leads
Content-Type: application/json
Authorization: Bearer <token>

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "leadTypeId": 1,
  "tenantId": 45
  // Note: assignedUserId is NOT provided - will be auto-assigned
}
```

### Create Lead (Manual Assignment)
```http
POST /api/leads
Content-Type: application/json
Authorization: Bearer <token>

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "assignedUserId": 123  // Manual assignment - auto-assignment will be skipped
}
```

## Troubleshooting

### Leads Not Being Assigned
1. Check if there are active users with lead permissions
2. Verify Travel Consultant role exists and has users
3. Check server logs for assignment errors
4. Ensure users have `is_active = true`

### Wrong Users Getting Assigned
1. Verify role names match exactly (case-insensitive)
2. Check user permissions for lead access
3. Review hierarchy levels in roles
4. Check workload distribution

## Logs

The system logs assignment details:
- `🤖 Auto-assigning lead for tenant X` - Assignment started
- `📋 Found configured priority role ID: X` - Priority role configured
- `✅ Found N users with configured priority role (ID: X), prioritizing them` - Priority role users found
- `ℹ️ Configured priority role (ID: X) has no active users, falling back to other roles` - Fallback triggered
- `✅ Auto-assigned to priority role user X (Role Name) with Y active leads` - Assignment completed

Check server console for these logs when creating leads.

## API Reference

### Update Auto-Assignment Priority Role
```http
PUT /api/tenant-settings/auto-assignment
Authorization: Bearer <token>
Content-Type: application/json

{
  "autoAssignmentPriorityRoleId": 68  // Role ID or null to remove
}
```

**Response:**
```json
{
  "success": true,
  "message": "Auto-assignment priority role updated successfully",
  "autoAssignmentPriorityRoleId": 68
}
```

### Get Tenant Settings (includes priority role)
```http
GET /api/tenant-settings
Authorization: Bearer <token>
```

**Response:**
```json
{
  "enableLeadWelcomeMessage": true,
  "leadWelcomeMessage": "...",
  "enableCustomerWelcomeMessage": true,
  "customerWelcomeMessage": "...",
  "autoAssignmentPriorityRoleId": 68  // null if not configured
}
```


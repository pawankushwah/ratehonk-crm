# Travel Business Role Hierarchy

## Recommended Role Structure for Travel CRM

### Hierarchy Level 0 (Top Level)
**Owner / Super Admin**
- Full system access
- Manages all aspects of the business
- Parent: None

---

### Hierarchy Level 1 (Senior Management)
**General Manager / Operations Manager**
- Oversees all operations
- Manages multiple departments
- Parent: Owner
- Reports to: Owner

**Business Development Manager**
- Manages sales and partnerships
- Oversees sales teams
- Parent: Owner
- Reports to: Owner

---

### Hierarchy Level 2 (Department Heads)
**Sales Manager**
- Manages sales team
- Handles key accounts
- Parent: Business Development Manager
- Reports to: Business Development Manager

**Customer Service Manager**
- Manages customer support team
- Handles customer escalations
- Parent: General Manager
- Reports to: General Manager

**Accounts Manager**
- Manages accounts receivable/payable
- Handles financial operations
- Parent: General Manager
- Reports to: General Manager

**Marketing Manager**
- Manages marketing campaigns
- Oversees lead generation
- Parent: Business Development Manager
- Reports to: Business Development Manager

---

### Hierarchy Level 3 (Team Leads / Supervisors)
**Sales Supervisor / Team Lead**
- Supervises sales executives
- Handles team performance
- Parent: Sales Manager
- Reports to: Sales Manager

**Senior Travel Consultant**
- Handles complex bookings
- Mentors junior consultants
- Parent: Sales Manager
- Reports to: Sales Manager

**Customer Service Supervisor**
- Supervises support team
- Handles escalated issues
- Parent: Customer Service Manager
- Reports to: Customer Service Manager

**Accounts Supervisor**
- Supervises accounts team
- Reviews financial transactions
- Parent: Accounts Manager
- Reports to: Accounts Manager

---

### Hierarchy Level 4 (Operational Staff)
**Travel Consultant / Sales Executive**
- Handles customer inquiries
- Creates bookings and packages
- Manages leads
- Parent: Sales Supervisor
- Reports to: Sales Supervisor

**Customer Service Representative**
- Handles customer queries
- Processes refunds/cancellations
- Manages customer complaints
- Parent: Customer Service Supervisor
- Reports to: Customer Service Supervisor

**Accounts Executive**
- Processes invoices
- Handles payments
- Manages vendor accounts
- Parent: Accounts Supervisor
- Reports to: Accounts Supervisor

**Marketing Executive**
- Executes marketing campaigns
- Manages social media
- Generates leads
- Parent: Marketing Manager
- Reports to: Marketing Manager

---

## Visual Hierarchy Tree

```
Owner (Level 0)
│
├── General Manager (Level 1)
│   ├── Customer Service Manager (Level 2)
│   │   └── Customer Service Supervisor (Level 3)
│   │       └── Customer Service Representative (Level 4)
│   │
│   └── Accounts Manager (Level 2)
│       └── Accounts Supervisor (Level 3)
│           └── Accounts Executive (Level 4)
│
└── Business Development Manager (Level 1)
    ├── Sales Manager (Level 2)
    │   ├── Sales Supervisor (Level 3)
    │   │   └── Travel Consultant (Level 4)
    │   │
    │   └── Senior Travel Consultant (Level 3)
    │       └── Travel Consultant (Level 4)
    │
    └── Marketing Manager (Level 2)
        └── Marketing Executive (Level 3)
```

---

## Role Permissions Summary

### Owner
- **Full Access**: All modules (view, create, edit, delete)
- **Special**: User management, role management, system settings

### General Manager / Operations Manager
- **Dashboard**: View (all team metrics)
- **Leads**: View, Edit (all leads)
- **Customers**: View, Edit, Create, Delete
- **Bookings**: View, Edit, Create, Delete
- **Packages**: View, Edit, Create, Delete
- **Invoices**: View, Edit, Create
- **Reports**: View (all reports)
- **Users**: View, Edit (team members)
- **Settings**: View

### Sales Manager
- **Dashboard**: View (sales team metrics)
- **Leads**: View, Edit, Create (assigned + team leads)
- **Customers**: View, Edit, Create (assigned + team customers)
- **Bookings**: View, Edit, Create, Delete (assigned + team bookings)
- **Packages**: View, Edit, Create
- **Invoices**: View, Edit
- **Reports**: View (sales reports)
- **Users**: View (team members)

### Sales Supervisor
- **Dashboard**: View (team metrics)
- **Leads**: View, Edit, Create (assigned + team leads)
- **Customers**: View, Edit, Create (assigned + team customers)
- **Bookings**: View, Edit, Create (assigned + team bookings)
- **Packages**: View, Edit
- **Invoices**: View
- **Reports**: View (team reports)

### Travel Consultant / Sales Executive
- **Dashboard**: View (own metrics)
- **Leads**: View, Edit, Create (own leads)
- **Customers**: View, Edit, Create (own customers)
- **Bookings**: View, Edit, Create (own bookings)
- **Packages**: View
- **Invoices**: View (own invoices)
- **Reports**: View (own reports)

### Customer Service Manager
- **Dashboard**: View (CS team metrics)
- **Leads**: View (all leads)
- **Customers**: View, Edit, Create (all customers)
- **Bookings**: View, Edit (all bookings)
- **Packages**: View
- **Invoices**: View, Edit
- **Reports**: View (CS reports)
- **Users**: View (CS team)

### Customer Service Representative
- **Dashboard**: View (own metrics)
- **Leads**: View (all leads)
- **Customers**: View, Edit, Create (all customers)
- **Bookings**: View, Edit (all bookings)
- **Packages**: View
- **Invoices**: View
- **Reports**: View (own reports)

### Accounts Manager
- **Dashboard**: View (financial metrics)
- **Customers**: View (all customers)
- **Bookings**: View (all bookings)
- **Packages**: View
- **Invoices**: View, Edit, Create, Delete
- **Reports**: View (financial reports)
- **Users**: View (accounts team)

### Accounts Executive
- **Dashboard**: View (financial metrics)
- **Customers**: View (all customers)
- **Bookings**: View (all bookings)
- **Invoices**: View, Edit, Create
- **Reports**: View (financial reports)

### Marketing Manager
- **Dashboard**: View (marketing metrics)
- **Leads**: View, Edit, Create (all leads)
- **Customers**: View (all customers)
- **Packages**: View, Edit, Create
- **Reports**: View (marketing reports)
- **Users**: View (marketing team)

### Marketing Executive
- **Dashboard**: View (marketing metrics)
- **Leads**: View, Edit, Create (assigned leads)
- **Packages**: View, Edit
- **Reports**: View (own reports)

---

## Implementation Notes

1. **Auto Lead Assignment**: Leads can be auto-assigned based on:
   - Role hierarchy (lower levels get assigned first)
   - Workload (least active users get priority)
   - Lead source/type preferences

2. **Reporting Structure**: 
   - Each role can see their own data + their team's data
   - Managers see aggregated team metrics
   - Owner sees everything

3. **Permission Inheritance**:
   - Child roles inherit some permissions from parent roles
   - But can have restricted access based on hierarchy level

4. **Flexibility**:
   - You can add/remove roles as needed
   - Adjust hierarchy based on your business structure
   - Modify permissions per role requirements

---

## Quick Setup Guide

1. **Create Owner Role** (already exists by default)
2. **Create Level 1 Roles**: General Manager, Business Development Manager
3. **Create Level 2 Roles**: Sales Manager, Customer Service Manager, etc.
4. **Create Level 3 Roles**: Supervisors and Team Leads
5. **Create Level 4 Roles**: Operational staff roles
6. **Set Parent Relationships**: Link each role to its parent
7. **Configure Permissions**: Set appropriate permissions for each role
8. **Assign Users**: Assign users to their respective roles

---

## Example: Creating Roles in Order

```
1. Owner (Level 0) - Default role, already exists

2. General Manager (Level 1)
   - Parent: Owner
   - Hierarchy Level: 1

3. Business Development Manager (Level 1)
   - Parent: Owner
   - Hierarchy Level: 1

4. Sales Manager (Level 2)
   - Parent: Business Development Manager
   - Hierarchy Level: 2

5. Sales Supervisor (Level 3)
   - Parent: Sales Manager
   - Hierarchy Level: 3

6. Travel Consultant (Level 4)
   - Parent: Sales Supervisor
   - Hierarchy Level: 4
```

This structure ensures:
- Clear reporting lines
- Proper data visibility (managers see team data)
- Auto lead assignment works correctly
- Scalable as business grows


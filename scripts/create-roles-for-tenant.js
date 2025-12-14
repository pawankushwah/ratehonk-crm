import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/ratehonk_crm';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Connect to database
const sql = postgres(DATABASE_URL, {
  ssl: DATABASE_URL.includes('localhost') ? false : 'require',
  max: 1,
});

const tenantId = 45;

// Define role hierarchy with permissions
const rolesToCreate = [
  {
    name: "General Manager",
    description: "Oversees all operations and manages multiple departments",
    parentRoleId: null,
    hierarchyLevel: 1,
    permissions: {
      dashboard: ["view"],
      customers: ["view", "edit", "create", "delete"],
      leads: ["view", "edit", "create"],
      bookings: ["view", "edit", "create", "delete"],
      packages: ["view", "edit", "create", "delete"],
      invoices: ["view", "edit", "create"],
      reports: ["view", "create"],
      users: ["view", "edit"],
      calendar: ["view", "edit", "create"],
      tasks: ["view", "create", "edit", "delete"],
      analytics: ["view"]
    }
  },
  {
    name: "Business Development Manager",
    description: "Manages sales and partnerships, oversees sales teams",
    parentRoleId: null,
    hierarchyLevel: 1,
    permissions: {
      dashboard: ["view"],
      customers: ["view", "edit", "create"],
      leads: ["view", "edit", "create"],
      bookings: ["view", "edit", "create"],
      packages: ["view", "edit", "create"],
      invoices: ["view", "edit"],
      reports: ["view", "create"],
      users: ["view"],
      calendar: ["view", "edit", "create"],
      tasks: ["view", "create", "edit"],
      analytics: ["view"],
      "email-campaigns": ["view", "edit", "create"]
    }
  },
  {
    name: "Sales Manager",
    description: "Manages sales team and handles key accounts",
    parentRoleId: null,
    hierarchyLevel: 2,
    permissions: {
      dashboard: ["view"],
      customers: ["view", "edit", "create"],
      leads: ["view", "edit", "create"],
      bookings: ["view", "edit", "create"],
      packages: ["view", "edit"],
      invoices: ["view", "edit"],
      reports: ["view"],
      users: ["view"],
      calendar: ["view", "edit", "create"],
      tasks: ["view", "create", "edit"]
    }
  },
  {
    name: "Customer Service Manager",
    description: "Manages customer support team and handles escalations",
    parentRoleId: null,
    hierarchyLevel: 2,
    permissions: {
      dashboard: ["view"],
      customers: ["view", "edit", "create"],
      leads: ["view"],
      bookings: ["view", "edit"],
      packages: ["view"],
      invoices: ["view", "edit"],
      reports: ["view"],
      users: ["view"],
      calendar: ["view", "edit"],
      tasks: ["view", "create", "edit"],
      support: ["view", "create"]
    }
  },
  {
    name: "Accounts Manager",
    description: "Manages accounts receivable/payable and financial operations",
    parentRoleId: null,
    hierarchyLevel: 2,
    permissions: {
      dashboard: ["view"],
      customers: ["view"],
      bookings: ["view"],
      packages: ["view"],
      invoices: ["view", "edit", "create", "delete"],
      vendors: ["view", "edit", "create", "delete"],
      expenses: ["view", "edit", "create", "delete"],
      reports: ["view", "create"],
      "gst-settings": ["view", "edit"]
    }
  },
  {
    name: "Marketing Manager",
    description: "Manages marketing campaigns and oversees lead generation",
    parentRoleId: null,
    hierarchyLevel: 2,
    permissions: {
      dashboard: ["view"],
      leads: ["view", "edit", "create"],
      customers: ["view"],
      packages: ["view", "edit", "create"],
      reports: ["view"],
      "email-campaigns": ["view", "edit", "create", "delete"],
      "social-media": ["view", "edit", "create"],
      analytics: ["view"]
    }
  },
  {
    name: "Sales Supervisor",
    description: "Supervises sales executives and handles team performance",
    parentRoleId: null,
    hierarchyLevel: 3,
    permissions: {
      dashboard: ["view"],
      customers: ["view", "edit", "create"],
      leads: ["view", "edit", "create"],
      bookings: ["view", "edit", "create"],
      packages: ["view", "edit"],
      invoices: ["view"],
      reports: ["view"],
      calendar: ["view", "edit", "create"],
      tasks: ["view", "create", "edit"]
    }
  },
  {
    name: "Senior Travel Consultant",
    description: "Handles complex bookings and mentors junior consultants",
    parentRoleId: null,
    hierarchyLevel: 3,
    permissions: {
      dashboard: ["view"],
      customers: ["view", "edit", "create"],
      leads: ["view", "edit", "create"],
      bookings: ["view", "edit", "create"],
      packages: ["view", "edit"],
      invoices: ["view"],
      calendar: ["view", "edit", "create"],
      tasks: ["view", "create", "edit"]
    }
  },
  {
    name: "Customer Service Supervisor",
    description: "Supervises support team and handles escalated issues",
    parentRoleId: null,
    hierarchyLevel: 3,
    permissions: {
      dashboard: ["view"],
      customers: ["view", "edit", "create"],
      bookings: ["view", "edit"],
      invoices: ["view"],
      tasks: ["view", "create", "edit"],
      support: ["view", "create"]
    }
  },
  {
    name: "Accounts Supervisor",
    description: "Supervises accounts team and reviews financial transactions",
    parentRoleId: null,
    hierarchyLevel: 3,
    permissions: {
      dashboard: ["view"],
      invoices: ["view", "edit", "create"],
      vendors: ["view", "edit", "create"],
      expenses: ["view", "edit", "create"],
      reports: ["view"]
    }
  },
  {
    name: "Travel Consultant",
    description: "Handles customer inquiries, creates bookings and packages, manages leads",
    parentRoleId: null,
    hierarchyLevel: 4,
    permissions: {
      dashboard: ["view"],
      customers: ["view", "edit", "create"],
      leads: ["view", "edit", "create"],
      bookings: ["view", "edit", "create"],
      packages: ["view"],
      invoices: ["view"],
      calendar: ["view", "edit", "create"],
      tasks: ["view", "create", "edit"]
    }
  },
  {
    name: "Customer Service Representative",
    description: "Handles customer queries, processes refunds/cancellations, manages complaints",
    parentRoleId: null,
    hierarchyLevel: 4,
    permissions: {
      dashboard: ["view"],
      customers: ["view", "edit", "create"],
      bookings: ["view", "edit"],
      invoices: ["view"],
      tasks: ["view", "create", "edit"],
      support: ["view", "create"]
    }
  },
  {
    name: "Accounts Executive",
    description: "Processes invoices, handles payments, manages vendor accounts",
    parentRoleId: null,
    hierarchyLevel: 4,
    permissions: {
      dashboard: ["view"],
      invoices: ["view", "edit", "create"],
      vendors: ["view", "edit", "create"],
      expenses: ["view", "edit", "create"],
      reports: ["view"]
    }
  },
  {
    name: "Marketing Executive",
    description: "Executes marketing campaigns, manages social media, generates leads",
    parentRoleId: null,
    hierarchyLevel: 3,
    permissions: {
      dashboard: ["view"],
      leads: ["view", "edit", "create"],
      packages: ["view", "edit"],
      "email-campaigns": ["view", "edit", "create"],
      "social-media": ["view", "edit", "create"]
    }
  }
];

async function createRolesForTenant() {
  try {
    console.log('📊 Connected to database');
    console.log(`🔧 Creating roles for tenant ${tenantId}...`);

    // Get Owner role ID
    const [ownerRole] = await sql`
      SELECT id FROM roles 
      WHERE tenant_id = ${tenantId} AND is_default = true
      LIMIT 1
    `;

    if (!ownerRole) {
      console.error(`❌ Owner role not found for tenant ${tenantId}`);
      return;
    }

    console.log(`✅ Found Owner role with ID: ${ownerRole.id}`);

    // Create roles in hierarchy order (Level 1 first, then 2, 3, 4)
    const createdRoles = {
      Owner: ownerRole.id
    };

    // Sort roles by hierarchy level
    const sortedRoles = [...rolesToCreate].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);

    for (const roleData of sortedRoles) {
      // Determine parent role ID based on hierarchy
      let parentRoleId = null;

      if (roleData.hierarchyLevel === 1) {
        // Level 1 roles report to Owner
        parentRoleId = ownerRole.id;
      } else if (roleData.hierarchyLevel === 2) {
        // Level 2 roles - determine parent based on role name
        if (roleData.name === "Sales Manager") {
          parentRoleId = createdRoles["Business Development Manager"] || null;
        } else if (roleData.name === "Customer Service Manager" || roleData.name === "Accounts Manager") {
          parentRoleId = createdRoles["General Manager"] || null;
        } else if (roleData.name === "Marketing Manager") {
          parentRoleId = createdRoles["Business Development Manager"] || null;
        }
      } else if (roleData.hierarchyLevel === 3) {
        // Level 3 roles
        if (roleData.name === "Sales Supervisor") {
          parentRoleId = createdRoles["Sales Manager"] || null;
        } else if (roleData.name === "Senior Travel Consultant") {
          parentRoleId = createdRoles["Sales Manager"] || null;
        } else if (roleData.name === "Customer Service Supervisor") {
          parentRoleId = createdRoles["Customer Service Manager"] || null;
        } else if (roleData.name === "Accounts Supervisor") {
          parentRoleId = createdRoles["Accounts Manager"] || null;
        } else if (roleData.name === "Marketing Executive") {
          parentRoleId = createdRoles["Marketing Manager"] || null;
        }
      } else if (roleData.hierarchyLevel === 4) {
        // Level 4 roles
        if (roleData.name === "Travel Consultant") {
          parentRoleId = createdRoles["Sales Supervisor"] || null;
        } else if (roleData.name === "Customer Service Representative") {
          parentRoleId = createdRoles["Customer Service Supervisor"] || null;
        } else if (roleData.name === "Accounts Executive") {
          parentRoleId = createdRoles["Accounts Supervisor"] || null;
        }
      }

      // Check if role already exists
      const [existingRole] = await sql`
        SELECT id FROM roles 
        WHERE tenant_id = ${tenantId} AND name = ${roleData.name}
        LIMIT 1
      `;

      if (existingRole) {
        console.log(`⚠️  Role "${roleData.name}" already exists, updating...`);
        
        // Update existing role
        await sql`
          UPDATE roles 
          SET 
            description = ${roleData.description},
            permissions = ${JSON.stringify(roleData.permissions)},
            parent_role_id = ${parentRoleId},
            hierarchy_level = ${roleData.hierarchyLevel},
            updated_at = NOW()
          WHERE id = ${existingRole.id}
        `;
        
        createdRoles[roleData.name] = existingRole.id;
        console.log(`✅ Updated role: ${roleData.name} (ID: ${existingRole.id})`);
      } else {
        // Create new role
        const [newRole] = await sql`
          INSERT INTO roles (
            tenant_id, 
            name, 
            description, 
            permissions, 
            parent_role_id,
            hierarchy_level,
            is_active,
            is_default,
            created_at,
            updated_at
          )
          VALUES (
            ${tenantId},
            ${roleData.name},
            ${roleData.description},
            ${JSON.stringify(roleData.permissions)},
            ${parentRoleId},
            ${roleData.hierarchyLevel},
            true,
            false,
            NOW(),
            NOW()
          )
          RETURNING id
        `;
        
        createdRoles[roleData.name] = newRole.id;
        console.log(`✅ Created role: ${roleData.name} (ID: ${newRole.id}, Level: ${roleData.hierarchyLevel}, Parent: ${parentRoleId || 'None'})`);
      }
    }

    console.log(`\n✅ Successfully created/updated ${Object.keys(createdRoles).length - 1} roles for tenant ${tenantId}`);
    console.log(`\n📊 Role Hierarchy:`);
    console.log(`Owner (Level 0)`);
    console.log(`├── General Manager (Level 1)`);
    console.log(`│   ├── Customer Service Manager (Level 2)`);
    console.log(`│   │   └── Customer Service Supervisor (Level 3)`);
    console.log(`│   │       └── Customer Service Representative (Level 4)`);
    console.log(`│   └── Accounts Manager (Level 2)`);
    console.log(`│       └── Accounts Supervisor (Level 3)`);
    console.log(`│           └── Accounts Executive (Level 4)`);
    console.log(`└── Business Development Manager (Level 1)`);
    console.log(`    ├── Sales Manager (Level 2)`);
    console.log(`    │   ├── Sales Supervisor (Level 3)`);
    console.log(`    │   │   └── Travel Consultant (Level 4)`);
    console.log(`    │   └── Senior Travel Consultant (Level 3)`);
    console.log(`    └── Marketing Manager (Level 2)`);
    console.log(`        └── Marketing Executive (Level 3)`);

  } catch (error) {
    console.error("❌ Error creating roles:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
(async () => {
  try {
    await createRolesForTenant();
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  }
})();


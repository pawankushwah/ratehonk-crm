// Script to create roles via API
const fetch = require('node-fetch');
require('dotenv').config();

const tenantId = 45;
const baseUrl = process.env.API_URL || 'http://localhost:5000';

// You'll need to get an auth token - replace this with actual token
const authToken = process.env.AUTH_TOKEN || '';

const rolesToCreate = [
  {
    name: "General Manager",
    description: "Oversees all operations and manages multiple departments",
    parentRoleId: null, // Will be set to Owner role ID
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
    parentRoleId: null, // Will be set to Business Development Manager
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
    parentRoleId: null, // Will be set to General Manager
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
    parentRoleId: null, // Will be set to General Manager
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
    parentRoleId: null, // Will be set to Business Development Manager
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
    parentRoleId: null, // Will be set to Sales Manager
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
    parentRoleId: null, // Will be set to Sales Manager
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
    parentRoleId: null, // Will be set to Customer Service Manager
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
    parentRoleId: null, // Will be set to Accounts Manager
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
    parentRoleId: null, // Will be set to Sales Supervisor
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
    parentRoleId: null, // Will be set to Customer Service Supervisor
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
    parentRoleId: null, // Will be set to Accounts Supervisor
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
    parentRoleId: null, // Will be set to Marketing Manager
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

async function createRoles() {
  try {
    console.log(`🔧 Creating roles for tenant ${tenantId}...`);
    
    // First, get Owner role ID
    const ownerRes = await fetch(`${baseUrl}/api/tenants/${tenantId}/roles`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!ownerRes.ok) {
      throw new Error(`Failed to fetch roles: ${ownerRes.status}`);
    }
    
    const allRoles = await ownerRes.json();
    const ownerRole = allRoles.find(r => r.isDefault);
    
    if (!ownerRole) {
      throw new Error('Owner role not found');
    }
    
    console.log(`✅ Found Owner role with ID: ${ownerRole.id}`);
    
    const createdRoles = { Owner: ownerRole.id };
    
    // Sort roles by hierarchy level
    const sortedRoles = [...rolesToCreate].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);
    
    for (const roleData of sortedRoles) {
      // Determine parent role ID
      let parentRoleId = null;
      
      if (roleData.hierarchyLevel === 1) {
        parentRoleId = ownerRole.id;
      } else if (roleData.hierarchyLevel === 2) {
        if (roleData.name === "Sales Manager") {
          parentRoleId = createdRoles["Business Development Manager"] || null;
        } else if (roleData.name === "Customer Service Manager" || roleData.name === "Accounts Manager") {
          parentRoleId = createdRoles["General Manager"] || null;
        } else if (roleData.name === "Marketing Manager") {
          parentRoleId = createdRoles["Business Development Manager"] || null;
        }
      } else if (roleData.hierarchyLevel === 3) {
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
        if (roleData.name === "Travel Consultant") {
          parentRoleId = createdRoles["Sales Supervisor"] || null;
        } else if (roleData.name === "Customer Service Representative") {
          parentRoleId = createdRoles["Customer Service Supervisor"] || null;
        } else if (roleData.name === "Accounts Executive") {
          parentRoleId = createdRoles["Accounts Supervisor"] || null;
        }
      }
      
      // Check if role exists
      const existingRole = allRoles.find(r => r.name === roleData.name);
      
      const rolePayload = {
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        parentRoleId: parentRoleId
      };
      
      if (existingRole) {
        console.log(`⚠️  Role "${roleData.name}" already exists, updating...`);
        const updateRes = await fetch(`${baseUrl}/api/tenants/${tenantId}/roles/${existingRole.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(rolePayload)
        });
        
        if (!updateRes.ok) {
          const errorText = await updateRes.text();
          throw new Error(`Failed to update role: ${updateRes.status} ${errorText}`);
        }
        
        createdRoles[roleData.name] = existingRole.id;
        console.log(`✅ Updated role: ${roleData.name} (ID: ${existingRole.id})`);
      } else {
        const createRes = await fetch(`${baseUrl}/api/tenants/${tenantId}/roles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(rolePayload)
        });
        
        if (!createRes.ok) {
          const errorText = await createRes.text();
          throw new Error(`Failed to create role: ${createRes.status} ${errorText}`);
        }
        
        const newRole = await createRes.json();
        createdRoles[roleData.name] = newRole.id;
        console.log(`✅ Created role: ${roleData.name} (ID: ${newRole.id}, Level: ${roleData.hierarchyLevel}, Parent: ${parentRoleId || 'None'})`);
      }
    }
    
    console.log(`\n✅ Successfully created/updated ${Object.keys(createdRoles).length - 1} roles for tenant ${tenantId}`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

createRoles()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });


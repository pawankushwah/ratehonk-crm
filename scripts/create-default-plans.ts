/**
 * Script to create default subscription plans for India and International markets
 * Run with: npx tsx scripts/create-default-plans.ts
 */

import { sql } from "../server/db";

const basicMenuItems = [
  "dashboard",
  "customers",
  "leads",
  "bookings",
  "invoices",
  "calendar",
  "settings",
  "subscription",
];

const professionalMenuItems = [
  "dashboard",
  "customers",
  "leads",
  "lead-types",
  "bookings",
  "packages",
  "invoices",
  "invoice-import",
  "vendors",
  "expenses",
  "calendar",
  "email-campaigns",
  "social-media",
  "analytics",
  "reports",
  "dynamic-fields",
  "settings",
  "menu-ordering",
  "users",
  "roles",
  "whatsapp-messages",
  "whatsapp-setup",
  "whatsapp-devices",
  "travel-search-b2c",
  "travel-search-b2b",
  "service-providers",
  "gst-settings",
  "tasks",
  "support",
  "subscription",
  "automation-workflows",
];

const enterpriseMenuItems = [...professionalMenuItems];

const basicPages = basicMenuItems.map((item) =>
  item === "dashboard" ? "/dashboard" : `/${item}`
);

const professionalPages = professionalMenuItems.map((item) =>
  item === "dashboard" ? "/dashboard" : `/${item}`
);

const enterprisePages = [...professionalPages];

const basicWidgets = [
  "dashboard.revenue",
  "dashboard.bookings",
  "dashboard.customers",
  "dashboard.leads",
];

const professionalWidgets = [
  "dashboard.revenue",
  "dashboard.bookings",
  "dashboard.customers",
  "dashboard.leads",
  "dashboard.revenue-chart",
  "dashboard.profit-loss",
  "dashboard.expense-chart",
  "dashboard.service-booking",
  "dashboard.service-provider",
  "dashboard.vendor-booking",
  "dashboard.invoice-status",
  "dashboard.marketing-seo",
  "dashboard.sidebar-followups",
  "dashboard.sidebar-customers",
  "dashboard.sidebar-bookings",
  "dashboard.sidebar-contacts",
];

const enterpriseWidgets = [...professionalWidgets];

const basicPermissions: Record<string, string[]> = {
  dashboard: ["view"],
  customers: ["view", "create"],
  leads: ["view", "create"],
  bookings: ["view", "create"],
  invoices: ["view", "create"],
  calendar: ["view"],
  settings: ["view"],
  subscription: ["view"],
};

const professionalPermissions: Record<string, string[]> = {
  dashboard: ["view"],
  customers: ["view", "edit", "delete", "create"],
  leads: ["view", "edit", "delete", "create"],
  "lead-types": ["view", "edit", "delete", "create"],
  bookings: ["view", "edit", "delete", "create"],
  packages: ["view", "edit", "delete", "create"],
  invoices: ["view", "edit", "delete", "create"],
  "invoice-import": ["view", "create"],
  vendors: ["view", "edit", "delete", "create"],
  expenses: ["view", "edit", "delete", "create"],
  calendar: ["view", "edit", "create", "delete"],
  "email-campaigns": ["view", "edit", "delete", "create"],
  "social-media": ["view", "edit", "create"],
  analytics: ["view"],
  reports: ["view", "create"],
  "dynamic-fields": ["view", "edit", "delete", "create"],
  settings: ["view", "edit"],
  "menu-ordering": ["view", "edit"],
  users: ["view", "edit", "delete", "create"],
  roles: ["view", "edit", "delete", "create"],
  "whatsapp-messages": ["view", "create"],
  "whatsapp-setup": ["view", "edit"],
  "whatsapp-devices": ["view", "create", "edit", "delete"],
  "travel-search-b2c": ["view"],
  "travel-search-b2b": ["view"],
  "service-providers": ["view", "create", "edit", "delete"],
  "gst-settings": ["view", "edit"],
  tasks: ["view", "create", "edit", "delete"],
  support: ["view", "create"],
  subscription: ["view", "edit"],
  "automation-workflows": ["view", "create", "edit", "delete"],
};

const enterprisePermissions = { ...professionalPermissions };

async function createPlans() {
  try {
    console.log("🚀 Creating default subscription plans...");

    // Check if plans already exist
    const existingIndiaPlans = await sql`
      SELECT COUNT(*) as count FROM subscription_plans WHERE country = 'IN'
    `;
    const existingUSPlans = await sql`
      SELECT COUNT(*) as count FROM subscription_plans WHERE country = 'US'
    `;

    if (existingIndiaPlans[0]?.count > 0) {
      console.log("⚠️  India plans already exist, skipping...");
    } else {
      // Create India Plans
      console.log("📝 Creating India plans...");

      // Basic Plan - India
      await sql`
        INSERT INTO subscription_plans (
          name, description, country, currency, monthly_price, yearly_price,
          max_users, max_customers, features, allowed_menu_items, allowed_pages,
          allowed_dashboard_widgets, allowed_page_permissions,
          free_trial_days, is_free_plan, is_active
        ) VALUES (
          'Basic Plan - India',
          'Perfect for small businesses getting started with CRM. Includes essential features for managing customers, leads, and bookings.',
          'IN',
          'INR',
          999.00,
          9999.00,
          3,
          100,
          ${JSON.stringify(basicMenuItems)},
          ${JSON.stringify(basicMenuItems)},
          ${JSON.stringify(basicPages)},
          ${JSON.stringify(basicWidgets)},
          ${JSON.stringify(basicPermissions)},
          7,
          false,
          true
        )
      `;
      console.log("✅ Created: Basic Plan - India (₹999/month)");

      // Professional Plan - India
      await sql`
        INSERT INTO subscription_plans (
          name, description, country, currency, monthly_price, yearly_price,
          max_users, max_customers, features, allowed_menu_items, allowed_pages,
          allowed_dashboard_widgets, allowed_page_permissions,
          free_trial_days, is_free_plan, is_active
        ) VALUES (
          'Professional Plan - India',
          'Ideal for growing businesses. Includes advanced features like automation, analytics, WhatsApp integration, and unlimited access to all modules.',
          'IN',
          'INR',
          2999.00,
          29999.00,
          10,
          500,
          ${JSON.stringify(professionalMenuItems)},
          ${JSON.stringify(professionalMenuItems)},
          ${JSON.stringify(professionalPages)},
          ${JSON.stringify(professionalWidgets)},
          ${JSON.stringify(professionalPermissions)},
          14,
          false,
          true
        )
      `;
      console.log("✅ Created: Professional Plan - India (₹2,999/month)");

      // Enterprise Plan - India
      await sql`
        INSERT INTO subscription_plans (
          name, description, country, currency, monthly_price, yearly_price,
          max_users, max_customers, features, allowed_menu_items, allowed_pages,
          allowed_dashboard_widgets, allowed_page_permissions,
          free_trial_days, is_free_plan, is_active
        ) VALUES (
          'Enterprise Plan - India',
          'For large organizations requiring unlimited access, priority support, and all advanced features including automation workflows and custom integrations.',
          'IN',
          'INR',
          7999.00,
          79999.00,
          -1,
          -1,
          ${JSON.stringify(enterpriseMenuItems)},
          ${JSON.stringify(enterpriseMenuItems)},
          ${JSON.stringify(enterprisePages)},
          ${JSON.stringify(enterpriseWidgets)},
          ${JSON.stringify(enterprisePermissions)},
          30,
          false,
          true
        )
      `;
      console.log("✅ Created: Enterprise Plan - India (₹7,999/month)");
    }

    if (existingUSPlans[0]?.count > 0) {
      console.log("⚠️  International plans already exist, skipping...");
    } else {
      // Create International Plans
      console.log("📝 Creating International plans...");

      // Basic Plan - International
      await sql`
        INSERT INTO subscription_plans (
          name, description, country, currency, monthly_price, yearly_price,
          max_users, max_customers, features, allowed_menu_items, allowed_pages,
          allowed_dashboard_widgets, allowed_page_permissions,
          free_trial_days, is_free_plan, is_active
        ) VALUES (
          'Basic Plan',
          'Perfect for small businesses getting started with CRM. Includes essential features for managing customers, leads, and bookings.',
          'US',
          'USD',
          12.00,
          120.00,
          3,
          100,
          ${JSON.stringify(basicMenuItems)},
          ${JSON.stringify(basicMenuItems)},
          ${JSON.stringify(basicPages)},
          ${JSON.stringify(basicWidgets)},
          ${JSON.stringify(basicPermissions)},
          7,
          false,
          true
        )
      `;
      console.log("✅ Created: Basic Plan ($12/month)");

      // Professional Plan - International
      await sql`
        INSERT INTO subscription_plans (
          name, description, country, currency, monthly_price, yearly_price,
          max_users, max_customers, features, allowed_menu_items, allowed_pages,
          allowed_dashboard_widgets, allowed_page_permissions,
          free_trial_days, is_free_plan, is_active
        ) VALUES (
          'Professional Plan',
          'Ideal for growing businesses. Includes advanced features like automation, analytics, WhatsApp integration, and unlimited access to all modules.',
          'US',
          'USD',
          36.00,
          360.00,
          10,
          500,
          ${JSON.stringify(professionalMenuItems)},
          ${JSON.stringify(professionalMenuItems)},
          ${JSON.stringify(professionalPages)},
          ${JSON.stringify(professionalWidgets)},
          ${JSON.stringify(professionalPermissions)},
          14,
          false,
          true
        )
      `;
      console.log("✅ Created: Professional Plan ($36/month)");

      // Enterprise Plan - International
      await sql`
        INSERT INTO subscription_plans (
          name, description, country, currency, monthly_price, yearly_price,
          max_users, max_customers, features, allowed_menu_items, allowed_pages,
          allowed_dashboard_widgets, allowed_page_permissions,
          free_trial_days, is_free_plan, is_active
        ) VALUES (
          'Enterprise Plan',
          'For large organizations requiring unlimited access, priority support, and all advanced features including automation workflows and custom integrations.',
          'US',
          'USD',
          96.00,
          960.00,
          -1,
          -1,
          ${JSON.stringify(enterpriseMenuItems)},
          ${JSON.stringify(enterpriseMenuItems)},
          ${JSON.stringify(enterprisePages)},
          ${JSON.stringify(enterpriseWidgets)},
          ${JSON.stringify(enterprisePermissions)},
          30,
          false,
          true
        )
      `;
      console.log("✅ Created: Enterprise Plan ($96/month)");
    }

    console.log("\n🎉 All plans created successfully!");
    console.log("\n📊 Summary:");
    console.log("   India (IN): 3 plans (Basic, Professional, Enterprise)");
    console.log("   International (US): 3 plans (Basic, Professional, Enterprise)");
  } catch (error) {
    console.error("❌ Error creating plans:", error);
    process.exit(1);
  }
}

createPlans()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


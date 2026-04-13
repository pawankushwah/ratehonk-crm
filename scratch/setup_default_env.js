import postgres from 'postgres';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function setup() {
  try {
    console.log('🚀 Setting up default tenant and subscription...');

    // 1. Create a Default Tenant
    const [tenant] = await sql`
      INSERT INTO tenants (
        company_name,
        subdomain,
        contact_email,
        contact_phone,
        is_active,
        created_at
      ) VALUES (
        'Default Travel Agency',
        'default-agency',
        'admin@travelcrm.com',
        '1234567890',
        true,
        NOW()
      )
      RETURNING id
    `;
    console.log(`✅ Created Tenant ID: ${tenant.id}`);

    // 2. Get a Plan ID (Professional Plan - India)
    const [plan] = await sql`
      SELECT id FROM subscription_plans 
      WHERE name LIKE '%Professional%' AND country = 'IN'
      LIMIT 1
    `;
    
    if (!plan) {
      throw new Error('Subscription plans not found. Please run npm run create-plans first.');
    }

    // 3. Create an Active Subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 day trial

    await sql`
      INSERT INTO tenant_subscriptions (
        tenant_id,
        plan_id,
        status,
        billing_cycle,
        payment_gateway,
        trial_ends_at,
        current_period_start,
        current_period_end,
        created_at,
        updated_at
      ) VALUES (
        ${tenant.id},
        ${plan.id},
        'active',
        'monthly',
        'stripe',
        ${trialEndDate},
        NOW(),
        ${trialEndDate},
        NOW(),
        NOW()
      )
    `;
    console.log(`✅ Created active subscription for Tenant ${tenant.id} using Plan ${plan.id}`);

    // 4. Update the SaaS Owner user to be part of this tenant (or create a new one)
    // We'll update the existing admin to have this tenantId for easier testing
    await sql`
      UPDATE users 
      SET tenant_id = ${tenant.id}
      WHERE email = 'admin@travelcrm.com'
    `;
    console.log(`✅ Linked user admin@travelcrm.com to Tenant ${tenant.id}`);

    // 5. Create Default Roles for this tenant (required for many operations)
    const [ownerRole] = await sql`
      INSERT INTO roles (
        tenant_id,
        name,
        description,
        permissions,
        hierarchy_level,
        is_active,
        is_default,
        created_at,
        updated_at
      ) VALUES (
        ${tenant.id},
        'Owner',
        'Full access to all features',
        '{"dashboard": ["view", "edit"], "customers": ["view", "edit", "delete"], "leads": ["view", "edit", "delete"]}',
        0,
        true,
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `;
    console.log(`✅ Created Owner role for Tenant ${tenant.id}`);

    // Link user to role
    await sql`
      UPDATE users 
      SET role_id = ${ownerRole.id}
      WHERE email = 'admin@travelcrm.com'
    `;

    console.log('\n🎉 Setup complete! You should now be able to access the dashboard.');
    await sql.end();
  } catch (err) {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  }
}

setup();

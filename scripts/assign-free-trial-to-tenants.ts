/**
 * Script to assign free trial subscriptions to all existing tenants
 * Run with: npm run assign-trials
 */

import { sql } from "../server/db";

async function assignFreeTrials() {
  try {
    console.log("🚀 Starting free trial assignment for existing tenants...\n");

    // Get all tenants
    const tenants = await sql`
      SELECT id, company_name, contact_email, created_at 
      FROM tenants 
      ORDER BY id
    `;

    if (tenants.length === 0) {
      console.log("⚠️  No tenants found in the database.");
      return;
    }

    console.log(`📊 Found ${tenants.length} tenant(s) in the database.\n`);

    // Get Basic Plan for free trial (prefer India plan, fallback to US)
    const plans = await sql`
      SELECT id, name, country, currency, free_trial_days 
      FROM subscription_plans 
      WHERE name LIKE '%Basic%' 
      ORDER BY 
        CASE WHEN country = 'IN' THEN 1 ELSE 2 END,
        id ASC
      LIMIT 2
    `;

    if (plans.length === 0) {
      console.log("❌ No Basic Plan found. Please create plans first using: npm run create-plans");
      process.exit(1);
    }

    const basicPlan = plans[0];
    const trialDays = basicPlan.free_trial_days || 7;
    
    console.log(`📦 Using plan: ${basicPlan.name} (${basicPlan.country}, ${basicPlan.currency})`);
    console.log(`⏱️  Trial period: ${trialDays} days\n`);

    let assignedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const tenant of tenants) {
      try {
        // Check if tenant already has a subscription
        const existingSubscription = await sql`
          SELECT id, status, trial_ends_at 
          FROM tenant_subscriptions 
          WHERE tenant_id = ${tenant.id}
          ORDER BY created_at DESC
          LIMIT 1
        `;

        if (existingSubscription.length > 0) {
          const sub = existingSubscription[0];
          console.log(`⏭️  Tenant #${tenant.id} (${tenant.company_name}): Already has subscription (Status: ${sub.status})`);
          skippedCount++;
          continue;
        }

        // Calculate trial end date (today + trial days)
        const trialStartDate = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);

        // Convert dates to ISO strings for postgres library
        const trialStartDateISO = trialStartDate.toISOString();
        const trialEndDateISO = trialEndDate.toISOString();

        // Create free trial subscription using direct SQL (postgres needs ISO strings)
        await sql`
          INSERT INTO tenant_subscriptions (
            tenant_id,
            plan_id,
            status,
            billing_cycle,
            payment_gateway,
            gateway_subscription_id,
            gateway_customer_id,
            trial_ends_at,
            current_period_start,
            current_period_end,
            next_billing_date,
            failed_payment_attempts
          ) VALUES (
            ${tenant.id},
            ${basicPlan.id},
            'trial',
            'monthly',
            'stripe',
            NULL,
            NULL,
            ${trialEndDateISO}::timestamp,
            ${trialStartDateISO}::timestamp,
            ${trialEndDateISO}::timestamp,
            ${trialEndDateISO}::timestamp,
            0
          )
        `;

        console.log(`✅ Tenant #${tenant.id} (${tenant.company_name}): Assigned ${trialDays}-day free trial`);
        console.log(`   Trial ends: ${trialEndDate.toLocaleDateString()}`);
        assignedCount++;
      } catch (error: any) {
        console.error(`❌ Error assigning trial to tenant #${tenant.id} (${tenant.company_name}):`, error.message);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Summary:");
    console.log(`   ✅ Assigned: ${assignedCount} tenant(s)`);
    console.log(`   ⏭️  Skipped: ${skippedCount} tenant(s) (already have subscriptions)`);
    console.log(`   ❌ Errors: ${errorCount} tenant(s)`);
    console.log("=".repeat(60));

    if (assignedCount > 0) {
      console.log("\n🎉 Free trial subscriptions assigned successfully!");
    }
  } catch (error) {
    console.error("❌ Error assigning free trials:", error);
    process.exit(1);
  }
}

assignFreeTrials()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


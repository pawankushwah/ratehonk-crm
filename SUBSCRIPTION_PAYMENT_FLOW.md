# Subscription Payment Flow - How Payment Works When Trial Expires

## Overview

When you activate a subscription plan with a 14-day free trial, here's how the payment system works:

## Payment Flow for Stripe Subscriptions

### 1. **During Trial Period (Days 1-14)**
- Your subscription status is set to `trial`
- No payment is charged during this period
- You have full access to all plan features
- The system tracks your `trial_ends_at` date

### 2. **When Trial Expires (Day 15)**
Stripe automatically handles the payment process:

1. **Automatic Invoice Creation**: Stripe creates an invoice for the subscription amount
2. **Payment Attempt**: Stripe attempts to charge the payment method on file:
   - If you provided a payment method during subscription creation, Stripe will charge it automatically
   - If no payment method is on file, the payment will fail

3. **Webhook Notification**: Stripe sends a webhook event to our server:
   - `invoice.payment_succeeded` - If payment is successful
   - `invoice.payment_failed` - If payment fails

4. **Status Update**: Our system updates your subscription status:
   - **Success**: Status changes from `trial` → `active`
   - **Failure**: Status remains `trial` or changes to `past_due` after multiple failures

### 3. **Payment Processing**
When payment succeeds:
- Subscription status is updated to `active`
- Payment history is recorded in the database
- Your subscription continues with full access
- Next billing date is set based on your billing cycle (monthly/yearly)

When payment fails:
- Subscription status may change to `past_due` after 3 failed attempts
- You'll receive email notifications about the failed payment
- Access may be restricted until payment is resolved

## Payment Flow for Non-Stripe Subscriptions

For subscriptions created without going through Stripe (e.g., manual trial assignments):

1. **Trial Expiration Check**: A scheduled job runs daily to check for expired trials
2. **Status Update**: If trial has expired and no payment gateway is configured:
   - Subscription status changes to `expired`
   - Access to premium features is restricted
   - User must manually upgrade to continue

## Important Notes

### For Stripe Subscriptions:
- ✅ **Payment is automatic** - No manual action required if payment method is on file
- ✅ **Webhook handling** - Our server receives real-time updates from Stripe
- ✅ **Seamless transition** - Trial → Active happens automatically

### For Manual Subscriptions:
- ⚠️ **Payment must be processed manually** - User needs to complete payment through the subscription page
- ⚠️ **Status update required** - System checks daily for expired trials

## Webhook Configuration

To ensure automatic payment processing works correctly:

1. **Stripe Webhook URL**: `https://yourdomain.com/api/webhooks/stripe`
2. **Required Events**:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

3. **Environment Variables**:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Webhook signing secret from Stripe dashboard

## Troubleshooting

### Payment Not Processing After Trial?
1. Check if payment method is saved in Stripe
2. Verify webhook URL is configured in Stripe dashboard
3. Check server logs for webhook events
4. Ensure `STRIPE_WEBHOOK_SECRET` is set correctly

### Subscription Status Not Updating?
1. Check webhook endpoint is accessible
2. Verify webhook signature validation
3. Check database for subscription record
4. Review server logs for errors

## Current Implementation Status

✅ **Implemented**:
- Stripe subscription creation with trial period
- Webhook endpoint for Stripe events
- Payment success/failure handling
- Subscription status updates
- Payment history recording

⚠️ **Needs Configuration**:
- Stripe webhook URL must be configured in Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` environment variable must be set
- Payment method must be collected during subscription creation

## Next Steps

1. **Configure Stripe Webhook**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select required events
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

2. **Test Payment Flow**:
   - Create a test subscription with trial
   - Wait for trial to expire (or use Stripe test mode to simulate)
   - Verify webhook events are received
   - Check subscription status updates correctly

3. **Monitor Payments**:
   - Set up alerts for failed payments
   - Review payment history regularly
   - Handle customer support requests for payment issues


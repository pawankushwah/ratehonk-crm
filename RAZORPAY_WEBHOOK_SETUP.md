# Razorpay Webhook Configuration Guide

## Webhook URL

The Razorpay webhook endpoint is located at:

```
https://yourdomain.com/api/webhooks/razorpay
```

### For Different Environments:

**Development (Local):**
```
http://localhost:5000/api/webhooks/razorpay
```

**Production:**
```
https://crm.ratehonk.com/api/webhooks/razorpay
```
*(Replace with your actual production domain)*

## How to Configure in Razorpay Dashboard

1. **Login to Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com
   - Navigate to **Settings** → **Webhooks**

2. **Add Webhook URL**
   - Click **"Add New Webhook"**
   - Enter your webhook URL:
     - Production: `https://yourdomain.com/api/webhooks/razorpay`
     - Development: Use ngrok or similar tool to expose localhost

3. **Select Webhook Events**
   You need to subscribe to these events for subscription management:
   
   **Required Events:**
   - ✅ `subscription.charged` - When subscription payment is successful
   - ✅ `subscription.halted` - When subscription payment fails
   - ✅ `subscription.cancelled` - When subscription is cancelled
   - ✅ `subscription.activated` - When subscription becomes active
   - ✅ `subscription.pending` - When subscription is pending
   - ✅ `subscription.completed` - When subscription completes all cycles
   - ✅ `payment.captured` - When payment is captured
   - ✅ `payment.failed` - When payment fails

4. **Get Webhook Secret**
   - After creating the webhook, Razorpay will generate a **Webhook Secret**
   - Copy this secret
   - Add it to your `.env` file:
     ```
     RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here
     ```

5. **Test Webhook**
   - Razorpay provides a "Test" button to send a test webhook
   - Check your server logs to verify webhook is received
   - Verify webhook signature validation is working

## Environment Variables Required

Add these to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Webhook Security

The webhook endpoint verifies the signature using HMAC SHA256:

1. Razorpay sends webhook with `X-Razorpay-Signature` header
2. Server verifies signature using `RAZORPAY_WEBHOOK_SECRET`
3. Only verified webhooks are processed

## Testing Webhooks Locally

For local development, you need to expose your local server:

### Option 1: Using ngrok
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 5000

# Use the ngrok URL in Razorpay dashboard
# Example: https://abc123.ngrok.io/api/webhooks/razorpay
```

### Option 2: Using localtunnel
```bash
# Install localtunnel
npm install -g localtunnel

# Expose local server
lt --port 5000

# Use the provided URL in Razorpay dashboard
```

## Webhook Event Handling

The server handles these events:

- **`subscription.charged`** → Updates subscription status to `active`, records payment
- **`subscription.halted`** → Updates subscription status to `past_due`, increments failed attempts
- **`subscription.cancelled`** → Updates subscription status to `cancelled`

## Recurring Payment Configuration

### Monthly Subscriptions:
- **Period**: `monthly`
- **Interval**: `1` (every 1 month)
- **Recurring**: Automatically charges every month after trial

### Yearly Subscriptions:
- **Period**: `yearly`
- **Interval**: `12` (every 12 months)
- **Recurring**: Automatically charges every year after trial

## Verification Checklist

- [ ] Webhook URL configured in Razorpay Dashboard
- [ ] All required events subscribed
- [ ] `RAZORPAY_WEBHOOK_SECRET` added to `.env`
- [ ] Webhook signature verification working
- [ ] Test webhook received successfully
- [ ] Server logs show webhook processing
- [ ] Subscription status updates correctly

## Troubleshooting

### Webhook Not Received
1. Check webhook URL is accessible (not behind firewall)
2. Verify URL is correct in Razorpay dashboard
3. Check server logs for incoming requests
4. Ensure webhook secret is correct

### Signature Verification Failed
1. Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
2. Check webhook payload format
3. Ensure HMAC SHA256 verification is working

### Events Not Processing
1. Check subscribed events in Razorpay dashboard
2. Verify event handling code in `server/subscription-service.ts`
3. Check server logs for errors
4. Verify subscription metadata contains `tenantId`

## Production Deployment

For production:
1. Use HTTPS webhook URL (required by Razorpay)
2. Set `RAZORPAY_WEBHOOK_SECRET` in production environment
3. Monitor webhook delivery in Razorpay dashboard
4. Set up alerts for failed webhook deliveries
5. Log all webhook events for debugging

## Support

If you encounter issues:
1. Check Razorpay Dashboard → Webhooks → Delivery Logs
2. Review server logs for webhook processing
3. Test webhook using Razorpay's test feature
4. Verify environment variables are set correctly


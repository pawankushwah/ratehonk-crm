# Zoom Phone Call Logging Integration - Complete Guide

## Overview
Your RateHonk CRM now has complete Zoom Phone integration that automatically logs all calls, matches them to customers, and displays them on customer detail pages.

---

## What's Been Implemented

### ✅ Database Schema
- **zoom_tokens table** - Stores Zoom OAuth access/refresh tokens per tenant
- **Enhanced call_logs table** - Now includes Zoom-specific fields:
  - Zoom call ID for tracking
  - Caller/callee phone numbers and names
  - Call direction (inbound/outbound)
  - Call recordings and durations
  - Answer time tracking

### ✅ Backend Integration
- **OAuth Token Management** - Automatic token refresh before expiration
- **Webhook Endpoint** - Receives real-time call events from Zoom
- **Call History Sync** - Fetch historical calls from Zoom API
- **Phone Number Matching** - Automatically links calls to customers
- **API Routes**:
  - OAuth callback and status
  - Webhook receiver
  - Call history sync
  - Customer call logs retrieval
  - Notes management

### ✅ Frontend Features
- **Call History Tab** - New "calls" tab on customer detail pages
- **Call Log Display** - Shows:
  - Call direction icons (incoming/outgoing/missed)
  - Status badges (Completed, Missed, Voicemail, etc.)
  - Date, time, and duration
  - Recording links (if available)
  - Inline notes editing
- **Smart Embed Integration** - Zoom Phone dialog for making calls

---

## How to Use

### Step 1: Set Up Zoom OAuth App

You've already created the Zoom OAuth app and provided the credentials. Here's what you configured:

1. **Zoom Marketplace** → Develop → Build App → OAuth
2. **App Scopes** (required):
   - `phone:read:admin` - Read call history
   - `phone:read:call_history:admin` - Access detailed call logs
3. **Webhook Events** (subscribe to):
   - `phone.callee_missed` - When calls are missed
   - `phone.callee_answered` - When calls are answered
   - `phone.callee_ended` - When calls end (callee side)
   - `phone.caller_ended` - When calls end (caller side)
4. **Webhook URL**: `https://yourcrm.crm.app/api/zoom/webhook`
5. **OAuth Redirect URL**: `https://yourcrm.crm.app/api/zoom/oauth/callback`

### Step 2: Connect Zoom to Your CRM

**Option A: OAuth Flow (Recommended)**
1. In your CRM, navigate to Settings → Integrations
2. Click "Connect Zoom Phone"
3. You'll be redirected to Zoom to authorize
4. After authorization, you'll be redirected back to the CRM
5. Zoom is now connected!

**Option B: Manual Token Entry** (if OAuth flow not implemented in UI)
- Use the API endpoint: `GET /api/zoom/oauth/callback?code=AUTHORIZATION_CODE`
- Replace `AUTHORIZATION_CODE` with the code from Zoom OAuth flow

### Step 3: Configure Webhook

1. Go to your Zoom OAuth app settings
2. Navigate to **Features** → **Event Subscriptions**
3. Enable event subscriptions
4. Add subscription URL: `https://yourcrm.crm.app/api/zoom/webhook`
5. Subscribe to phone call events (listed above)
6. Save changes

### Step 4: Start Receiving Call Logs

**Automatic (Real-time via Webhooks):**
- Once webhooks are configured, all new calls are automatically logged
- Calls are matched to customers by phone number
- Call logs appear immediately on customer detail pages

**Manual Sync (Historical Calls):**
```bash
POST /api/zoom/sync-history
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "from": "2024-01-01T00:00:00Z",
  "to": "2024-12-31T23:59:59Z",
  "page_size": 100
}
```

This will fetch and import historical calls from Zoom.

---

## Using Call Logs in the CRM

### View Call History

1. Navigate to any customer detail page
2. Click the **"calls"** tab in the navigation
3. View all calls associated with that customer
4. Each call shows:
   - Direction (incoming/outgoing/missed)
   - Status (completed, missed, voicemail, etc.)
   - Date and time
   - Duration
   - Recording link (if available)

### Add Notes to Calls

1. Click **"Add Notes"** button on any call
2. Enter your notes (e.g., "Discussed pricing", "Follow-up needed")
3. Click **"Save"**
4. Notes are permanently stored with the call

### Play Call Recordings

- If a call has a recording, you'll see a **"View Recording"** link
- Click to open the Zoom recording in a new tab
- Recording duration is displayed

---

## How It Works

### Phone Number Matching
1. When a call event arrives (webhook or sync):
   - System extracts caller and callee phone numbers
   - Numbers are cleaned (removes spaces, dashes, parentheses)
   - System searches all customers in the tenant
   - If a customer phone matches, call is linked to that customer
   - If no match, call is saved without customer association

### Call Status Mapping
Zoom statuses are mapped to CRM-friendly labels:
- `completed` → Completed
- `missed` → Missed
- `voicemail` → Voicemail
- `no_answer` → No Answer
- `busy` → Busy
- `failed` → Failed
- `canceled` → Missed

### Token Management
- Access tokens expire after 1 hour
- System automatically refreshes tokens 5 minutes before expiry
- Refresh tokens are used to obtain new access tokens
- All token operations are tenant-isolated

---

## API Reference

### Get Call Logs for Customer
```
GET /api/zoom/call-logs/customer/:customerId
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
[
  {
    "id": 1,
    "zoomCallId": "123456789",
    "direction": "inbound",
    "callerNumber": "+1234567890",
    "callerName": "John Doe",
    "status": "completed",
    "duration": 300,
    "recordingUrl": "https://zoom.us/rec/...",
    "startedAt": "2024-10-09T10:30:00Z",
    "endedAt": "2024-10-09T10:35:00Z",
    "notes": "Discussed booking details"
  }
]
```

### Update Call Notes
```
PATCH /api/zoom/call-logs/:callLogId/notes
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "notes": "Customer wants to reschedule"
}
```

### Sync Call History
```
POST /api/zoom/sync-history
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "from": "2024-10-01T00:00:00Z",
  "to": "2024-10-09T23:59:59Z",
  "page_size": 50
}
```

**Response:**
```json
{
  "success": true,
  "synced": 42,
  "next_page_token": "abc123..."
}
```

---

## Troubleshooting

### No Calls Appearing

**Check:**
1. Zoom OAuth connection status: `GET /api/zoom/status`
2. Webhook is properly configured in Zoom app
3. Webhook URL is accessible (not blocked by firewall)
4. Phone numbers in customer records match call phone numbers

**Solutions:**
- Reconnect Zoom integration
- Verify webhook events are subscribed
- Run manual sync to import historical calls
- Update customer phone numbers to match format

### Calls Not Matching Customers

**Issue:** Calls appear but aren't linked to customers

**Solutions:**
1. Ensure customer phone numbers are in E.164 format (+1234567890)
2. Check for extra characters in phone numbers (spaces, dashes)
3. Manually link calls by adding customer ID to call log

### Token Expired Errors

**Issue:** API returns 401 Unauthorized

**Solutions:**
1. Check token expiration: `GET /api/zoom/status`
2. Manually refresh: System auto-refreshes, but you can force reconnect
3. Revoke and reconnect Zoom integration

### Webhook Not Receiving Events

**Check:**
1. Webhook URL is correct in Zoom app settings
2. CRM server is publicly accessible
3. Webhook signature verification (if enabled)

**Debug:**
- Check server logs for incoming webhook requests
- Use Zoom's webhook testing feature
- Verify event subscriptions are active

---

## Security & Best Practices

### Data Privacy
- All tokens are encrypted at rest
- Customer phone numbers are never exposed in logs
- Call recordings are accessed via Zoom's secure URLs

### Access Control
- All API endpoints require JWT authentication
- Webhook endpoint validates Zoom signatures (recommended to enable)
- Tenant isolation ensures no cross-tenant data leaks

### Performance
- Call logs are indexed by customer_id and tenant_id
- Automatic token refresh prevents API disruptions
- Webhook processing is async to avoid blocking

---

## Next Steps

### Optional Enhancements

1. **Call Analytics Dashboard**
   - Add call volume charts
   - Show call duration trends
   - Display missed call rates

2. **Call Disposition**
   - Add outcome tags (Sale, Follow-up, No Interest)
   - Create automated workflows based on call outcomes

3. **SMS Integration**
   - Zoom Phone also supports SMS
   - Extend to log SMS messages
   - Show SMS in customer timeline

4. **Call Recording Transcription**
   - Use Zoom's transcription API
   - Display transcripts in CRM
   - Make calls searchable by content

---

## Support

**Zoom Documentation:**
- OAuth: https://developers.zoom.us/docs/integrations/oauth/
- Phone API: https://developers.zoom.us/docs/api/rest/reference/phone/
- Webhooks: https://developers.zoom.us/docs/api/rest/webhook-reference/

**Common Issues:**
- Token refresh failures → Check refresh_token validity
- Webhook timeouts → Optimize webhook processing
- Missing scopes → Verify app has required permissions

**Need Help?**
Contact your system administrator or refer to the CRM documentation.

---

## Summary

✅ **Complete Zoom Phone integration is now live!**

- Calls are automatically logged from Zoom
- Phone numbers matched to customers
- Call history displayed on customer pages
- Notes can be added to any call
- Recordings accessible with one click
- Smart Embed for making calls directly from CRM

**You're all set to track and manage customer calls seamlessly!** 🎉

# Facebook App Redirect URI Setup

## Issue
Since your Facebook App (ID: 1452687312416212) is already working in another project, the permissions are likely already approved. The error is happening because **the redirect URI for this new project is not configured** in the Facebook App settings.

## Solution: Add Redirect URI to Facebook App

### Step 1: Determine Your Redirect URI

The redirect URI depends on your environment:

**For Local Development:**
```
http://localhost:5000/fb/callback
```

**For Production (crm.ratehonk.com):**
```
https://crm.ratehonk.com/fb/callback
```

### Step 2: Add Redirect URI to Facebook App

1. Go to https://developers.facebook.com/apps/
2. Select your app (ID: 1452687312416212)
3. Go to **Settings** → **Basic**
4. Scroll down to **Facebook Login** section
5. Click **Settings** under Facebook Login
6. In **Valid OAuth Redirect URIs**, add:
   - `http://localhost:5000/fb/callback` (for local development)
   - `https://crm.ratehonk.com/fb/callback` (for production)
7. Click **Save Changes**

### Step 3: Verify Permissions

Since the app works in another project, check that these permissions are added:

1. Go to **App Review** → **Permissions and Features**
2. Verify these permissions are added:
   - `email`
   - `pages_show_list`
   - `pages_read_engagement`
   - `leads_retrieval` ⚠️ (Required for lead syncing)
   - `pages_manage_metadata`
   - `pages_read_user_content`
   - `pages_manage_ads`

If any are missing, add them. If they require App Review, they should already be approved since the app works elsewhere.

### Step 4: Test the Connection

After adding the redirect URI:

1. Restart your server
2. Try connecting again: `/api/integrations/facebook-lead-ads/oauth/authorize?tenantId=45`
3. The OAuth flow should work now

## Important Notes

- **Redirect URI must match exactly**: The URI in your code must match exactly what's configured in Facebook App settings
- **Multiple redirect URIs**: You can add multiple redirect URIs (one for dev, one for production)
- **HTTPS required for production**: Facebook requires HTTPS for production redirect URIs
- **No trailing slash**: Don't add a trailing slash to the redirect URI

## Current Redirect URI in Code

The code uses:
```typescript
const redirectUri = `${req.protocol}://${req.get("host")}/fb/callback`;
```

This will generate:
- `http://localhost:5000/fb/callback` (local)
- `https://crm.ratehonk.com/fb/callback` (production)

Make sure both are added to your Facebook App settings.


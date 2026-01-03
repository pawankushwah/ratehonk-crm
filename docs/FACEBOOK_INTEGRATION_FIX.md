# Facebook Integration Permission Error Fix

## Problem
When trying to connect Facebook Lead Ads, you see the error:
- "It looks like this app isn't available"
- "This app needs at least one supported permission."

## Root Cause
The Facebook App (ID: 1452687312416212) doesn't have the required permissions configured in the Facebook Developer Console.

## Solution

### Step 1: Access Facebook Developer Console
1. Go to https://developers.facebook.com/apps/
2. Select your app (ID: 1452687312416212) or create a new one
3. Navigate to **App Review** → **Permissions and Features**

### Step 2: Add Required Permissions
The app requests these permissions:
- `email` - Basic user email
- `pages_read_engagement` - Read page engagement metrics
- `pages_manage_posts` - Manage page posts
- `pages_show_list` - Show list of pages
- `business_management` - Manage business assets
- `instagram_basic` - Basic Instagram access
- `instagram_content_publish` - Publish to Instagram
- `leads_retrieval` - **CRITICAL** - Retrieve lead form data

### Step 3: Configure App Settings

#### A. Basic Settings
1. Go to **Settings** → **Basic**
2. Add **App Domains**: `crm.ratehonk.com`
3. Add **Site URL**: `https://crm.ratehonk.com`
4. Add **Valid OAuth Redirect URIs**:
   - `https://crm.ratehonk.com/api/tenants/*/facebook/callback`
   - `https://crm.ratehonk.com/fb/callback`

#### B. Products & Features
1. Add **Facebook Login** product
2. Add **Instagram Basic Display** (if using Instagram)
3. Add **Marketing API** (for leads_retrieval)

#### C. Permissions Configuration
1. Go to **App Review** → **Permissions and Features**
2. For each permission, click **Request** or **Add**
3. **Important Permissions**:
   - `leads_retrieval` - Requires **App Review** and **Business Verification**
   - `business_management` - Requires **App Review**
   - `pages_manage_posts` - Requires **App Review**

### Step 4: App Review Process (For Advanced Permissions)

For permissions like `leads_retrieval`, you need:

1. **Business Verification**:
   - Go to **Settings** → **Business Verification**
   - Complete business verification process

2. **App Review**:
   - Submit your app for review
   - Provide use case description
   - Show how you'll use the permissions
   - Provide privacy policy URL
   - Provide terms of service URL

3. **Test Users** (For Development):
   - Add test users in **Roles** → **Test Users**
   - Test the integration with test users first

### Step 5: Development Mode vs Live Mode

**Development Mode** (Current):
- Only works with app admins, developers, and test users
- No app review needed
- Limited functionality

**Live Mode**:
- Works with all users
- Requires app review for advanced permissions
- Full functionality

### Step 6: Minimum Required Permissions (Quick Fix)

For immediate testing, you can start with these basic permissions:
- `email` (no review needed)
- `pages_show_list` (no review needed for basic access)
- `pages_read_engagement` (no review needed for basic access)

Then add advanced permissions after app review:
- `leads_retrieval` (requires review)
- `business_management` (requires review)
- `pages_manage_posts` (requires review)

### Step 7: Update Code (Optional - Use Basic Permissions First)

If you want to test with basic permissions first, you can temporarily modify the scopes in `server/facebook-service.ts`:

```typescript
const scopes = [
  'email',
  'pages_show_list',
  'pages_read_engagement',
  // Comment out advanced permissions until app review is complete
  // 'pages_manage_posts',
  // 'business_management',
  // 'instagram_basic',
  // 'instagram_content_publish',
  // 'leads_retrieval'
].join(',');
```

### Step 8: Verify Configuration

1. Check **Settings** → **Basic**:
   - App ID matches: `1452687312416212`
   - App Secret is configured
   - Valid redirect URIs are added

2. Check **App Review** → **Permissions and Features**:
   - All required permissions are added
   - Permissions show as "Approved" or "In Development"

3. Test the connection again

## Common Issues

### Issue 1: "Invalid OAuth Redirect URI"
**Fix**: Add the exact redirect URI to **Facebook Login** → **Settings** → **Valid OAuth Redirect URIs**

### Issue 2: "App Not Available"
**Fix**: 
- Ensure app is in **Development Mode** and you're using a test user
- Or complete **App Review** for **Live Mode**

### Issue 3: "Permission Not Granted"
**Fix**: 
- Check if permission requires app review
- Complete app review process
- Ensure business verification is complete (for business permissions)

## Quick Test Checklist

- [ ] App ID and Secret are correct
- [ ] Redirect URIs are configured
- [ ] At least basic permissions are added
- [ ] App is in Development Mode (for testing)
- [ ] Using test user or app admin account
- [ ] OAuth URL is generated correctly

## Support

If issues persist:
1. Check Facebook App Dashboard for specific error messages
2. Review Facebook Developer Documentation
3. Check server logs for OAuth errors
4. Verify App ID and Secret in database match Facebook App settings


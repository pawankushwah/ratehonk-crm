# Facebook Permission Troubleshooting Guide

## Current Status
✅ All permissions show **"Standard access"**
✅ All permissions show **"Ready to use (0)"**
⚠️ Some show **"Verification required"** (this is for advanced access, not needed for standard)

## Understanding Permission Status

### Standard Access vs Advanced Access
- **Standard Access**: Available immediately, no review needed
- **Advanced Access**: Requires App Review and verification
- For your use case, **Standard Access is sufficient**

### "Ready to use (0)" Status
- This means the permission is **added** and **available**
- The "(0)" might indicate usage count or review count
- This is **normal** and should work

### "Verification required"
- This is for **Advanced Access** only
- You don't need this if you have "Standard access"
- Standard access should work without verification

## The Real Issue

If all permissions show "Standard access" and "Ready to use", but you're still getting the error, the issue might be:

1. **OAuth Scope Mismatch**: The scopes requested might not match exactly
2. **App Configuration**: The app might need a specific configuration
3. **User Account**: The user account might not have the required permissions

## Verification Steps

### Step 1: Verify OAuth Scopes
Check that the OAuth URL includes all scopes. The URL should look like:
```
https://www.facebook.com/v18.0/dialog/oauth?
  client_id=1452687312416212&
  redirect_uri=https://crm.ratehonk.com/fb/callback&
  scope=email,pages_show_list,pages_read_engagement,leads_retrieval,pages_manage_metadata,pages_read_user_content,pages_manage_ads&
  state=...&
  response_type=code
```

### Step 2: Test with Developer Account
1. Try OAuth with the developer account (should work)
2. Check if the error occurs with developer account
3. If it works with developer but not others, it's a permission issue

### Step 3: Check App Review Status
1. Go to **App Review** → **Permissions and Features**
2. For each permission, verify:
   - Status shows **"Ready to use"** (green)
   - Access level shows **"Standard access"**
   - No red warnings or errors

### Step 4: Check User Permissions
The user account trying to connect must:
- Have access to at least one Facebook Page
- Be an admin/editor of the page (for page-related permissions)
- Have granted the app access previously (might need to revoke and re-grant)

## Common Solutions

### Solution 1: Request Permissions Explicitly
Even if permissions show "Ready to use", try:
1. Click on each permission
2. Click "Request advanced access" (even if you don't need advanced)
3. This might trigger Facebook to "activate" the permission

### Solution 2: Check App Settings
1. Go to **Settings** → **Basic**
2. Verify **App Mode** is **Live** (not Development)
3. Check **App Domains** includes your domain
4. Verify **Privacy Policy URL** is set (required for some permissions)

### Solution 3: Test OAuth Flow Manually
1. Open browser console
2. Navigate to: `https://crm.ratehonk.com/api/integrations/facebook-lead-ads/oauth/authorize?tenantId=67`
3. Check the `authUrl` in the response
4. Copy the `authUrl` and open it in a new tab
5. See what error Facebook shows (if any)

## Email Permission Specific

The `email` permission is a **basic permission** and should work with Standard access. If you're concerned:

1. **Check if email is actually needed**: For Lead Ads, you might not need `email` permission if leads come with email in the form data
2. **Try without email**: Remove `email` from the scopes temporarily to test
3. **Verify email access**: The user must have a verified email on their Facebook account

## Debugging Steps

1. **Check OAuth URL**: Verify all scopes are included
2. **Test with different account**: Try with developer account vs regular account
3. **Check browser console**: Look for any JavaScript errors
4. **Check network tab**: See the actual OAuth request/response
5. **Check Facebook error**: The error message from Facebook might give more details

## If Still Not Working

If permissions are correct but still getting errors:
1. Try removing `email` from scopes (test if it's the issue)
2. Check if the error is specific to certain permissions
3. Verify the redirect URI is exactly matching
4. Check if there are any app-level restrictions
5. Contact Facebook Developer Support with App ID and error details


# Facebook Lead Ads Integration Setup Guide

## Why the Permission Error Occurs

The error **"This app needs at least one supported permission"** happens because:

1. **Facebook App Not Configured**: The Facebook App (ID: 1452687312416212) doesn't have the required permissions added in the Facebook Developer Console.

2. **Advanced Permissions Require App Review**: Permissions like `leads_retrieval` require:
   - App Review submission
   - Business Verification
   - Use case documentation
   - Privacy policy and terms of service

3. **Permissions Not Added to App**: Even basic permissions need to be added to the app in Facebook Developer Console before they can be requested.

## Solution: Two-Phase Approach

### Phase 1: Testing with Basic Permissions (No App Review)

For initial testing, we use basic permissions that don't require App Review:

1. **Configure Facebook App**:
   - Go to https://developers.facebook.com/apps/
   - Select your app (ID: 1452687312416212)
   - Go to **Settings** → **Basic**
   - Add **Valid OAuth Redirect URIs**: `https://your-domain.com/fb/callback`
   - Go to **App Review** → **Permissions and Features**
   - Add these permissions:
     - `email` (no review needed)
     - `pages_show_list` (no review needed)
     - `pages_read_engagement` (no review needed)

2. **Test the Connection**:
   - The OAuth flow should work with these basic permissions
   - You can connect and see pages
   - Lead syncing will be limited until advanced permissions are approved

### Phase 2: Production with Full Permissions (Requires App Review)

For full functionality, you need to complete App Review:

1. **Add Advanced Permissions**:
   - Go to **App Review** → **Permissions and Features**
   - Request these permissions:
     - `leads_retrieval` ⚠️ **REQUIRES Business Verification**
     - `pages_manage_metadata`
     - `pages_read_user_content`
     - `pages_manage_ads`

2. **Complete Business Verification**:
   - Go to **Settings** → **Business Verification**
   - Complete the verification process
   - This is required for `leads_retrieval`

3. **Submit for App Review**:
   - Go to **App Review** → **Permissions and Features**
   - For each permission, click **Request** or **Add**
   - Provide:
     - Use case description
     - How you'll use the permission
     - Privacy policy URL
     - Terms of service URL
     - Screenshots/videos of your app

4. **Update Code**:
   - Once approved, uncomment the advanced permissions in `server/integrations/facebook-lead-ads-oauth.ts`:
   ```typescript
   const FACEBOOK_SCOPES = [
     "email",
     "pages_show_list",
     "pages_read_engagement",
     "leads_retrieval",        // Uncomment after approval
     "pages_manage_metadata",  // Uncomment after approval
     "pages_read_user_content", // Uncomment after approval
     "pages_manage_ads",       // Uncomment after approval
   ];
   ```

## Quick Fix for Testing

If you want to test immediately without App Review:

1. **Update the code** to use only basic permissions (already done in the code)
2. **Configure Facebook App**:
   - Add `email`, `pages_show_list`, `pages_read_engagement` permissions
   - Add redirect URI
   - Test the connection

3. **Note**: You won't be able to sync leads until `leads_retrieval` is approved, but you can test the OAuth flow and page selection.

## Common Issues

### Issue 1: "App Not Available"
**Cause**: Permissions not added to app
**Fix**: Add permissions in Facebook Developer Console → App Review → Permissions and Features

### Issue 2: "Invalid OAuth Redirect URI"
**Cause**: Redirect URI not configured
**Fix**: Add exact redirect URI to Facebook Login → Settings → Valid OAuth Redirect URIs

### Issue 3: "Permission Not Granted"
**Cause**: Permission requires App Review
**Fix**: Complete App Review process for that permission

## Current Status

The code is currently configured to use **basic permissions only** for testing. Once you:
1. Add these permissions to your Facebook App
2. Configure the redirect URI
3. Test the connection

You should be able to connect. For full lead syncing functionality, complete App Review for `leads_retrieval`.


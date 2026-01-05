# Fix: "This app needs at least one supported permission" Error

## Problem
Even though your Facebook App (ID: 1452687312416212) works in another project, you're getting this error when trying to connect from `crm.ratehonk.com`.

## Root Cause
The redirect URI `https://crm.ratehonk.com/fb/callback` is **not configured** in your Facebook App settings. Facebook requires the exact redirect URI to be whitelisted before OAuth can proceed.

## Solution: Add Redirect URI to Facebook App

### Step 1: Access Facebook Developer Console
1. Go to https://developers.facebook.com/apps/
2. Select your app (ID: **1452687312416212**)

### Step 2: Add Redirect URI
1. Go to **Settings** → **Basic**
2. Scroll down to find **Facebook Login** section
3. Click **Settings** (or "Add Product" if Facebook Login isn't added yet)
4. In **Valid OAuth Redirect URIs**, add:
   ```
   https://crm.ratehonk.com/fb/callback
   http://localhost:5000/fb/callback
   ```
5. Click **Save Changes**

### Step 3: Verify Permissions
1. Go to **App Review** → **Permissions and Features**
2. Verify these permissions are added (even if already approved):
   - ✅ `email`
   - ✅ `pages_show_list`
   - ✅ `pages_read_engagement`
   - ✅ `leads_retrieval` ⚠️ (Critical for Lead Ads)
   - ✅ `pages_manage_metadata`
   - ✅ `pages_read_user_content`
   - ✅ `pages_manage_ads`

### Step 4: Check App Mode
- **Development Mode**: Only works with test users
- **Live Mode**: Works with all users (requires App Review for production)

If in Development Mode:
- Add yourself as a test user in **Roles** → **Test Users**
- Or switch to Live Mode (if App Review is complete)

## Current OAuth URL Being Generated

Your app is correctly generating:
```
https://www.facebook.com/v18.0/dialog/oauth?
  client_id=1452687312416212&
  redirect_uri=https://crm.ratehonk.com/fb/callback&
  scope=email,pages_show_list,pages_read_engagement,leads_retrieval,pages_manage_metadata,pages_read_user_content,pages_manage_ads&
  state=...&
  response_type=code
```

This is correct! The issue is just that Facebook needs the redirect URI whitelisted.

## Quick Checklist

- [ ] Added `https://crm.ratehonk.com/fb/callback` to Valid OAuth Redirect URIs
- [ ] Added `http://localhost:5000/fb/callback` for local development
- [ ] Verified all required permissions are added in App Review
- [ ] Saved changes in Facebook Developer Console
- [ ] Tested the connection again

## After Adding Redirect URI

Once you add the redirect URI:
1. Wait 1-2 minutes for Facebook to propagate the changes
2. Try connecting again
3. The OAuth flow should work without the permission error

## Still Not Working?

If it still doesn't work after adding the redirect URI:
1. Check that the redirect URI matches **exactly** (no trailing slash, correct protocol)
2. Verify the app is in the correct mode (Development/Live)
3. Check if you're using a test user account (if in Development Mode)
4. Clear browser cache and try again


# Facebook App Live Mode - Permission Error Fix

## Current Status
✅ **App is in Live Mode** (toggle is active)
✅ **App ID**: 1452687312416212
✅ **App Type**: Business

## Issue
Even though the app is in **Live Mode**, users are getting the error:
- "This app needs at least one supported permission"

## Root Cause
When an app is in Live Mode, **all permissions must be explicitly added** in the App Review section, even if they're already approved. The permissions need to be:
1. **Added** to the app (in App Review → Permissions and Features)
2. **Approved** for production use (if they require review)

## Solution: Add Permissions in App Review

### Step 1: Navigate to App Review
1. In the left sidebar, click **"App Review"** (with checkmark icon)
2. Click **"Permissions and Features"** from the dropdown

### Step 2: Add Required Permissions
For each permission below, ensure it shows **"Added"** status:

**Basic Permissions (Usually Auto-Added):**
- ✅ `email` - Should show "Added" (basic permission)
- ✅ `pages_show_list` - Should show "Added" (basic permission)
- ✅ `pages_read_engagement` - Should show "Added" (basic permission)

**Advanced Permissions (Must Be Added):**
- ⚠️ `leads_retrieval` - **CRITICAL** - Must show "Added" or "Approved"
- ⚠️ `pages_manage_metadata` - Should show "Added" or "Approved"
- ⚠️ `pages_read_user_content` - Should show "Added" or "Approved"
- ⚠️ `pages_manage_ads` - Should show "Added" or "Approved"

### Step 3: Add Missing Permissions
If any permission shows:
- **"Request"** - Click it and submit for App Review (if not already approved)
- **Not listed** - Click **"Add Permission"** or **"Get Started"** to add it
- **"In Development"** - This means it's only available to test users; needs App Review for Live Mode

### Step 4: Verify Status
After adding permissions, each should show:
- ✅ **"Added"** - Permission is added and available
- ✅ **"Approved"** - Permission is approved for production use
- ❌ **"In Development"** - Only works for test users (needs App Review)

## Why This Happens in Live Mode

Even in Live Mode, Facebook requires:
1. **Permissions must be explicitly added** to the app
2. **Advanced permissions must be approved** through App Review
3. **Permissions must be requested** in the OAuth flow (which we're doing)

If a permission is approved but not "Added" to the app, users will get the permission error.

## Quick Checklist

- [ ] Go to **App Review** → **Permissions and Features**
- [ ] Verify all 7 required permissions are listed
- [ ] Ensure each permission shows **"Added"** or **"Approved"**
- [ ] If any show **"Request"**, click to add/request them
- [ ] Save changes
- [ ] Test OAuth flow again

## Current OAuth Scopes Being Requested

Your app is correctly requesting these scopes:
```
email
pages_show_list
pages_read_engagement
leads_retrieval
pages_manage_metadata
pages_read_user_content
pages_manage_ads
```

All of these must be **"Added"** in App Review → Permissions and Features.

## After Adding Permissions

1. Wait 2-3 minutes for changes to propagate
2. Clear browser cache
3. Test OAuth flow with a non-developer account
4. The permission error should be resolved

## If Still Not Working

If permissions are added but still getting errors:
1. Check if permissions show **"Approved"** status (not just "Added")
2. Verify the OAuth URL includes all scopes (check browser console)
3. Try disconnecting and reconnecting the integration
4. Check Facebook's App Review status for any pending reviews


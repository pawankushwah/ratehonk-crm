# Facebook App Permissions Checklist

## ✅ Redirect URI Status
**GOOD**: `https://crm.ratehonk.com/fb/callback` is already in your Valid OAuth Redirect URIs list.

## ⚠️ Permissions Issue

The error "This app needs at least one supported permission" means the **permissions need to be added** in the App Review section, even if they're already approved.

## Step-by-Step Fix

### Step 1: Go to App Review → Permissions and Features

1. Go to https://developers.facebook.com/apps/
2. Select your app (ID: 1452687312416212)
3. Click **App Review** in the left sidebar
4. Click **Permissions and Features**

### Step 2: Add Each Permission

For each permission below, check if it shows "Added" or "Request":

**Required Permissions:**
1. ✅ `email` - Should show "Added" (basic permission)
2. ✅ `pages_show_list` - Should show "Added" (basic permission)
3. ✅ `pages_read_engagement` - Should show "Added" (basic permission)
4. ⚠️ `leads_retrieval` - **CRITICAL** - Must show "Added" or "Approved"
5. ⚠️ `pages_manage_metadata` - Should show "Added" or "Approved"
6. ⚠️ `pages_read_user_content` - Should show "Added" or "Approved"
7. ⚠️ `pages_manage_ads` - Should show "Added" or "Approved"

### Step 3: Add Missing Permissions

If any permission shows "Request" or is missing:

1. Click **Add** or **Request** next to the permission
2. If it requires App Review:
   - Provide use case description
   - Submit for review (if not already approved)
3. If it's a basic permission:
   - It should be added immediately

### Step 4: Verify App Mode

1. Go to **Settings** → **Basic**
2. Check **App Mode**:
   - **Development Mode**: Only works with test users
   - **Live Mode**: Works with all users

**If in Development Mode:**
- Go to **Roles** → **Test Users**
- Add yourself as a test user
- Use that test user account to test the OAuth flow

### Step 5: Check Permission Status

After adding permissions, verify:
- All permissions show as "Added" or "Approved"
- No permissions show as "Request" or "Pending"
- App is in the correct mode (Development/Live)

## Common Issues

### Issue 1: Permissions Not Added
**Symptom**: Permissions are approved but not "Added" to the app
**Fix**: Click "Add" next to each permission in App Review → Permissions and Features

### Issue 2: Development Mode
**Symptom**: OAuth works but shows permission error
**Fix**: Add yourself as a test user, or switch to Live Mode

### Issue 3: Permission Not Approved
**Symptom**: Permission shows "Request" and requires App Review
**Fix**: Submit for App Review (should already be done since app works elsewhere)

## Quick Test

After adding permissions:
1. Wait 2-3 minutes for changes to propagate
2. Clear browser cache
3. Try OAuth flow again
4. The error should be resolved

## Current Permissions Being Requested

Your app is requesting these scopes:
```
email
pages_show_list
pages_read_engagement
leads_retrieval
pages_manage_metadata
pages_read_user_content
pages_manage_ads
```

All of these must be "Added" in App Review → Permissions and Features.


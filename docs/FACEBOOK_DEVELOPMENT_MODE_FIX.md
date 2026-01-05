# Facebook App Development Mode - User Access Issue

## Issue 1: Permission Error for Non-Developer Accounts

### Problem
When trying to connect with a Facebook account that is **not** the developer/admin account, you get the error:
- "This app needs at least one supported permission"

But when using the **developer account** (same account used to create the app), it works fine.

### Root Cause
Your Facebook App is in **Development Mode**, which restricts access to:
- ✅ App Admins/Developers (the account that created the app)
- ✅ Test Users (manually added users)
- ❌ Regular Facebook users (blocked)

### Solution Options

#### Option 1: Add Users as Test Users (Recommended for Testing)
1. Go to https://developers.facebook.com/apps/
2. Select your app (ID: 1452687312416212)
3. Go to **Roles** → **Test Users**
4. Click **Add Test Users**
5. Add the Facebook accounts you want to test with
6. Those users can now use the app

#### Option 2: Switch to Live Mode (For Production)
1. Go to **App Review** → **Permissions and Features**
2. Ensure all required permissions are **Approved** (not just "Request")
3. Go to **Settings** → **Basic**
4. Scroll to **App Mode**
5. Switch from **Development Mode** to **Live Mode**
6. **Note**: This requires App Review to be complete for all permissions

### Why Developer Account Works
The developer/admin account automatically has access to the app, even in Development Mode. This is why it works for you but not for other users.

## Issue 2: Missing Next Steps After Integration

### Problem
After successful OAuth connection, you don't see:
- "Manage Leads" button
- Page selection
- Form selection
- Lead syncing options

### Root Cause
The UI is checking `facebookStatus` (regular Facebook integration) instead of checking for `facebook-lead-ads` integration status.

### Solution
The code has been updated to:
1. Check for `facebook-lead-ads` integration specifically
2. Show "Manage Leads" button when connected
3. Automatically open the Leads Manager after successful connection

## Quick Fix Summary

### For Testing with Multiple Accounts:
1. Add test users in Facebook Developer Console
2. Or switch to Live Mode (if App Review is complete)

### For Next Steps After Connection:
1. The "Manage Leads" button should appear automatically
2. If not, refresh the page
3. Click "Manage Leads" to select pages and sync leads

## Current Status

✅ Code updated to check `facebook-lead-ads` integration
✅ "Manage Leads" button will show when connected
✅ Leads Manager opens automatically after OAuth success
✅ Integration status refreshes after connection


# 🔧 Fix: Zoom Phone Smart Embed Not Working on Live Domain

## Problem

Zoom Phone Smart Embed is not working on `crm.ratehonk.com` after login. The iframe may be blank, showing errors, or not loading.

## ✅ Most Common Cause: Domain Not Authorized

Zoom requires your production domain to be explicitly added to the **Authorized Domains** list in Zoom Marketplace.

## Step-by-Step Fix

### Step 1: Access Zoom Marketplace

1. Go to **https://marketplace.zoom.us/**
2. Sign in with your **Zoom admin account**
3. Click **Manage** → **Installed Apps** (top navigation)

### Step 2: Find Smart Embed App

1. Search for **"Smart Embed"** in your installed apps
2. Find **"Zoom Phone Smart Embed"** (Official Zoom app)
3. Click on it to open settings

### Step 3: Add Your Production Domain

1. Click **Manage** → **Configure**
2. Find the **"Authorized domains"** section
3. Add your production domain:
   ```
   https://crm.ratehonk.com
   ```
4. **Important:** 
   - Use `https://` (not `http://`)
   - Include the full domain with subdomain
   - No trailing slash
   - No wildcards allowed
5. Click **Save**

### Step 4: Verify Shared Permissions

1. In Smart Embed settings, ensure this is checked:
   - ✅ **"Allow this app to use my shared permissions"**
2. Click **Save** if you made changes

### Step 5: Clear Browser Cache and Test

1. Clear your browser cache or use incognito mode
2. Log into `https://crm.ratehonk.com`
3. Go to any customer detail page
4. Click **"Call with Zoom"** button
5. The Zoom Phone iframe should now load

## Additional Troubleshooting

### Check 1: Verify HTTPS

Zoom Phone Smart Embed **requires HTTPS** in production. Verify:
- Your site is accessible via `https://crm.ratehonk.com`
- SSL certificate is valid
- No mixed content warnings

### Check 2: Browser Console Errors

Open browser DevTools (F12) and check Console tab for errors:

**Common errors:**
- `X-Frame-Options` blocking iframe
- `Content-Security-Policy` blocking
- CORS errors
- Domain not authorized

### Check 3: Network Tab

In DevTools → Network tab, look for:
- Failed requests to `applications.zoom.us`
- 403 Forbidden errors (usually means domain not authorized)
- CORS preflight failures

### Check 4: User Authorization

Each user must authorize Smart Embed:
1. First time user clicks "Call with Zoom"
2. Iframe opens with "Sign in to Zoom" prompt
3. User enters Zoom credentials
4. User accepts permissions
5. Zoom Phone interface loads

### Check 5: Zoom Phone License

Ensure the logged-in user has:
- ✅ Active Zoom Phone license
- ✅ License assigned by Zoom admin
- ✅ Account is active (not suspended)

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Domain `https://crm.ratehonk.com` added to Zoom authorized domains
- [ ] Smart Embed app is installed and active
- [ ] "Shared permissions" enabled in Smart Embed settings
- [ ] Site is accessible via HTTPS (not HTTP)
- [ ] User has active Zoom Phone license
- [ ] User has authorized Smart Embed (first-time flow)
- [ ] Browser allows iframes (no extensions blocking)
- [ ] No console errors in browser DevTools

## If Still Not Working

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors when clicking "Call with Zoom"
4. Common errors:
   ```
   Refused to display 'https://applications.zoom.us/...' in a frame because it set 'X-Frame-Options' to 'deny'
   ```
   This means domain is not authorized.

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Click "Call with Zoom" button
4. Look for requests to `applications.zoom.us`
5. Check response status:
   - **200 OK**: Domain is authorized, check other issues
   - **403 Forbidden**: Domain NOT authorized - add to Zoom settings
   - **CORS error**: Domain authorization issue

### Test with Different Browser

Try:
- Chrome/Edge (recommended)
- Firefox
- Safari

Some browsers have stricter iframe policies.

## Code Verification

The iframe is configured in `client/src/components/zoom/zoom-phone-embed.tsx`:

```tsx
<iframe
  src="https://applications.zoom.us/integration/phone/embeddablephone/home"
  className="w-full h-full border-0"
  allow="microphone; camera"
  title="Zoom Phone"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
/>
```

This is correct. The issue is almost always domain authorization.

## Contact Zoom Support

If domain is authorized but still not working:

1. **Zoom Support**: https://support.zoom.us/hc/en-us/articles/360060776051
2. **Developer Docs**: https://developers.zoom.us/docs/phone/smart-embed/
3. **Community Forum**: https://community.zoom.com/

---

## Summary

**Most likely fix:** Add `https://crm.ratehonk.com` to Zoom Marketplace → Smart Embed → Authorized Domains

**Quick test:** After adding domain, wait 1-2 minutes for changes to propagate, then test in incognito mode.


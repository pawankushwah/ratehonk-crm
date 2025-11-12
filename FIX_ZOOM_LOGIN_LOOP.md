# 🔧 Fix: Zoom Phone Smart Embed Login Loop

## Problem

When clicking the phone icon:
1. Zoom login page opens in iframe
2. You sign in successfully
3. But then it shows the login page again (redirect loop)

## Root Causes

This happens because the Smart Embed iframe can't persist the authentication session. Common causes:

1. **Domain not properly authorized** - Most common
2. **Iframe sandbox restrictions** - Too restrictive
3. **Cookie/Session storage blocked** - Browser blocking third-party cookies
4. **HTTPS/HTTP mismatch** - Security issues
5. **CORS/SameSite cookie issues** - Browser security policies

## ✅ Solutions

### Solution 1: Verify Domain Authorization (Most Important)

1. Go to **https://marketplace.zoom.us/**
2. Sign in with Zoom admin account
3. **Manage** → **Installed Apps** → **Zoom Phone Smart Embed**
4. Click **Manage** → **Configure**
5. In **"Authorized domains"**, ensure you have:
   ```
   https://crm.ratehonk.com
   ```
6. **Important:** 
   - Must be exact match (no trailing slash)
   - Must use `https://` (not `http://`)
   - Wait 2-3 minutes after adding for changes to propagate

### Solution 2: Update Iframe Configuration

The iframe might need less restrictive sandbox attributes. Update `client/src/components/zoom/zoom-phone-embed.tsx`:

**Current:**
```tsx
<iframe
  src="https://applications.zoom.us/integration/phone/embeddablephone/home"
  className="w-full h-full border-0"
  allow="microphone; camera"
  title="Zoom Phone"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
/>
```

**Try removing sandbox or making it less restrictive:**
```tsx
<iframe
  src="https://applications.zoom.us/integration/phone/embeddablephone/home"
  className="w-full h-full border-0"
  allow="microphone; camera; autoplay"
  title="Zoom Phone"
  // Remove sandbox or use minimal restrictions
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
/>
```

Or try without sandbox (if security allows):
```tsx
<iframe
  src="https://applications.zoom.us/integration/phone/embeddablephone/home"
  className="w-full h-full border-0"
  allow="microphone; camera; autoplay"
  title="Zoom Phone"
/>
```

### Solution 3: Check Browser Settings

**Chrome/Edge:**
1. Go to `chrome://settings/cookies` (or `edge://settings/cookies`)
2. Ensure "Block third-party cookies" is **OFF** (or allow `zoom.us`)
3. Or add exception for `*.zoom.us`

**Firefox:**
1. Settings → Privacy & Security
2. Under "Cookies and Site Data"
3. Ensure "Cross-site and social media trackers" is not blocking Zoom

### Solution 4: Test in Incognito/Private Mode

1. Open incognito/private window
2. Go to `https://crm.ratehonk.com`
3. Log in
4. Try Zoom Phone
5. If it works in incognito, it's a cookie/cache issue

### Solution 5: Clear Browser Data

1. Clear cookies for:
   - `crm.ratehonk.com`
   - `zoom.us`
   - `applications.zoom.us`
2. Clear cache
3. Try again

### Solution 6: Check Console for Errors

Open DevTools (F12) → Console tab and look for:

- `X-Frame-Options` errors → Domain authorization issue
- `Cookie` errors → Browser blocking cookies
- `CORS` errors → Cross-origin issues
- `Content-Security-Policy` errors → CSP blocking

## Debugging Steps

### Step 1: Check Network Tab

1. Open DevTools (F12) → Network tab
2. Click "Call with Zoom"
3. Look for requests to `applications.zoom.us`
4. Check response headers:
   - `Set-Cookie` headers present? → Cookies should be set
   - `X-Frame-Options` header? → Should allow embedding
   - Status codes? → Should be 200 OK

### Step 2: Check Application Tab

1. DevTools → Application tab
2. Cookies → Check `applications.zoom.us`
3. Are cookies being set?
4. Are they being cleared immediately?

### Step 3: Test Direct URL

Try opening the Smart Embed URL directly in a new tab:
```
https://applications.zoom.us/integration/phone/embeddablephone/home
```

If it works directly but not in iframe → Domain authorization issue

## Quick Fix: Update Iframe Code

I can update the iframe configuration to be less restrictive. Would you like me to do that?

## Alternative: Use Popup Instead of Iframe

If iframe continues to have issues, we could:
1. Open Zoom Phone in a popup window instead
2. Handle authentication in popup
3. Close popup after successful auth

---

## Most Likely Fix

**90% of the time, this is a domain authorization issue:**

1. Go to Zoom Marketplace
2. Add `https://crm.ratehonk.com` to authorized domains
3. Wait 2-3 minutes
4. Clear browser cache
5. Test in incognito mode

If it still loops after domain authorization, it's likely a browser cookie/session storage issue.


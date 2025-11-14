# Setting Base URL in Environment Variables

## Quick Setup

To fix the password reset URL issue, you need to set the base URL in your environment variables.

### Option 1: Create/Update .env file (Local Development)

Create a `.env` file in the root directory with:

```env
APP_URL=https://crm.ratehonk.com
FRONTEND_URL=https://crm.ratehonk.com
```

**Note:** The `.env` file is gitignored, so you need to create it manually.

### Option 2: Set Environment Variables (Production)

On your production server, set these environment variables:

```bash
export APP_URL=https://crm.ratehonk.com
export FRONTEND_URL=https://crm.ratehonk.com
```

Or if using PM2:
```bash
pm2 restart all --update-env
```

And make sure your `ecosystem.config.js` includes:
```javascript
env: {
  APP_URL: 'https://crm.ratehonk.com',
  FRONTEND_URL: 'https://crm.ratehonk.com',
}
```

### Option 3: CloudPanel/Server Environment Variables

If using CloudPanel or similar:
1. Go to your site settings
2. Add environment variables:
   - `APP_URL` = `https://crm.ratehonk.com`
   - `FRONTEND_URL` = `https://crm.ratehonk.com`

## After Setting Environment Variables

1. **Restart your server** to pick up the new environment variables
2. **Test password reset** - the email should now contain `https://crm.ratehonk.com/reset-password?token=...`

## Code Protection

The code now includes protection against wrong URLs:
- Automatically rejects `your-app-url.com` or `ww25` domains
- Forces `https://crm.ratehonk.com` if wrong domain is detected
- Frontend redirects users from wrong domains to correct domain

## Verification

Check server logs when sending password reset email. You should see:
```
📧 Password reset URL: https://crm.ratehonk.com/reset-password?token=...
📧 Using base URL: https://crm.ratehonk.com
📧 APP_URL env: https://crm.ratehonk.com
```


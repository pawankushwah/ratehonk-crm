# 🔧 Fix: Port Configuration Issue

## Problem

Your application is running on port 3000, but you want it on port 5000. The PM2 ecosystem config was overriding your `.env` file.

## ✅ Solution

I've updated both `ecosystem.config.js` and `ecosystem.config.cjs` to use port 5000.

### Option 1: Upload Updated Config Files

Upload the updated `ecosystem.config.js` (or `ecosystem.config.cjs`) to your server, then:

```bash
pm2 restart ratehonk-crm --update-env
```

### Option 2: Quick Fix on Server

Edit the config file directly on your server:

```bash
cd ~/htdocs/crm.ratehonk.com/crm-ratehonk
nano ecosystem.config.js
```

Change:
- `PORT: 3000` → `PORT: 5000` (in both `env` and `env_production` sections)

Or if using `.cjs`:
```bash
nano ecosystem.config.cjs
```

Then restart:
```bash
pm2 restart ratehonk-crm --update-env
```

### Option 3: Remove PORT from PM2 Config (Recommended)

Better approach - let PM2 read PORT from your `.env` file:

```bash
cd ~/htdocs/crm.ratehonk.com/crm-ratehonk
nano ecosystem.config.js
```

Remove the `PORT: 3000` lines from both `env` and `env_production` sections, so it looks like:

```javascript
env: {
  NODE_ENV: 'production'
},
env_production: {
  NODE_ENV: 'production'
},
```

Make sure your `.env` file has:
```env
PORT=5000
```

Then restart:
```bash
pm2 restart ratehonk-crm --update-env
```

## Verify

After restarting, check the logs:

```bash
pm2 logs ratehonk-crm --lines 5
```

You should see:
```
✅ Server listening on http://localhost:5000
🏥 Health check: http://localhost:5000/health
```

Test it:
```bash
curl http://localhost:5000/health
```

---

**The config files have been updated to use port 5000. Upload them and restart PM2!**


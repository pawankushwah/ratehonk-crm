# 🔧 Fix: Running in Development Mode Instead of Production

## Problem

Your application is running in development mode:
```
🔧 NODE_ENV: development - Using Vite dev server
```

This causes errors because:
- It tries to use Vite dev server (which needs source files)
- Production should serve static files from `dist/public/`
- You're seeing errors like "Failed to load url /src/main.tsx"

## ✅ Solution

### Step 1: Check Your .env File

```bash
cd ~/htdocs/crm.ratehonk.com/crm-ratehonk
cat .env | grep NODE_ENV
```

If it shows `NODE_ENV=development`, change it to `production`:

```bash
nano .env
```

Make sure you have:
```env
NODE_ENV=production
PORT=5000
```

### Step 2: Verify PM2 Config

```bash
cat ecosystem.config.js | grep NODE_ENV
```

Should show `NODE_ENV: 'production'` in both `env` and `env_production` sections.

### Step 3: Restart PM2 with Production Environment

```bash
pm2 stop ratehonk-crm
pm2 delete ratehonk-crm
pm2 start ecosystem.config.js --env production
```

### Step 4: Verify It's Running in Production

```bash
pm2 logs ratehonk-crm --lines 10
```

You should see:
```
🔧 NODE_ENV: production - Using static files
✅ Server listening on http://localhost:5000
```

**NOT:**
```
🔧 NODE_ENV: development - Using Vite dev server  ❌
```

## Quick Fix Command

If you want to force production mode:

```bash
pm2 stop ratehonk-crm
pm2 delete ratehonk-crm
NODE_ENV=production pm2 start ecosystem.config.js --env production
```

## Why This Happens

The application checks `process.env.NODE_ENV` to decide:
- **Development**: Use Vite dev server (needs source files)
- **Production**: Serve static files from `dist/public/` (what you want)

If `NODE_ENV` is set to `development` anywhere (`.env` file, PM2 config, or system environment), it will use development mode.

---

**After fixing NODE_ENV to production and restarting, your app should serve static files correctly!**


# 🔧 Fix: Still Running on Port 3000

## Problem

Even after updating the config, the application is still running on port 3000. This means PM2 hasn't picked up the new port setting.

## ✅ Solution

### Step 1: Verify Your .env File Has PORT=5000

```bash
cd ~/htdocs/crm.ratehonk.com/crm-ratehonk
cat .env | grep PORT
```

If it shows `PORT=3000` or is missing, add/update it:

```bash
nano .env
```

Make sure you have:
```env
PORT=5000
```

### Step 2: Update ecosystem.config.js on Server

```bash
nano ecosystem.config.js
```

Make sure both `env` and `env_production` sections have:
```javascript
PORT: 5000
```

Not `PORT: 3000`.

### Step 3: Stop and Delete PM2 Process

```bash
pm2 stop ratehonk-crm
pm2 delete ratehonk-crm
```

### Step 4: Start Fresh with Updated Config

```bash
pm2 start ecosystem.config.js --env production
```

Or if using .cjs:
```bash
pm2 start ecosystem.config.cjs --env production
```

### Step 5: Verify

```bash
pm2 logs ratehonk-crm --lines 5
```

You should now see:
```
✅ Server listening on http://localhost:5000
```

## Alternative: Quick Manual Fix

If the above doesn't work, you can also set the port directly when starting:

```bash
pm2 stop ratehonk-crm
pm2 delete ratehonk-crm
pm2 start dist/index.js --name ratehonk-crm --env production --update-env -- PORT=5000
```

Or set it in the environment:

```bash
PORT=5000 pm2 restart ratehonk-crm --update-env
```

## Check Current PM2 Environment

To see what environment variables PM2 is using:

```bash
pm2 show ratehonk-crm
```

Look for the "env" section to see what PORT is set.

---

**The key is to stop, delete, and restart the PM2 process so it picks up the new port configuration!**


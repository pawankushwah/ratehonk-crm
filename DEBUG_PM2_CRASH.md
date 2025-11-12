# 🔍 Debug PM2 Application Crash

## Problem

Your application is crashing repeatedly (18 restarts). The status shows:
- Status: empty (not "online")
- Restart count: 18
- PID: 0 (process not running)

## ✅ Check Logs

The application is crashing immediately. Check the error logs:

```bash
# View error logs
pm2 logs ratehonk-crm --err --lines 100

# Or view all logs
pm2 logs ratehonk-crm --lines 100

# Or check the log files directly
tail -100 logs/err.log
cat logs/err.log
```

## Common Causes

1. **Missing environment variables** - Check if DATABASE_URL, JWT_SECRET, etc. are set
2. **Database connection error** - Can't connect to PostgreSQL
3. **Port already in use** - Another process using port 3000
4. **Missing dependencies** - Some module not found
5. **Build issues** - dist/index.js might be missing or corrupted

## Quick Checks

```bash
# 1. Check if dist/index.js exists
ls -la dist/index.js

# 2. Check if .env file exists and has required variables
cat .env | grep -E "DATABASE_URL|JWT_SECRET|SESSION_SECRET"

# 3. Test database connection
echo $DATABASE_URL

# 4. Check if port is in use
sudo lsof -i :3000

# 5. Try running manually to see the error
node dist/index.js
```

## Fix Steps

1. **Check the logs first** - This will tell you exactly what's wrong
2. **Verify .env file** - Make sure all required variables are set
3. **Test database connection** - Ensure DATABASE_URL is correct
4. **Rebuild if needed** - If dist/index.js is missing or old

---

**Run `pm2 logs ratehonk-crm --err --lines 100` and share the error message!**


# 🔧 Fix: PM2 ES Module Error

## Problem

Error when running `pm2 start ecosystem.config.js`:
```
ReferenceError: module is not defined in ES module scope
```

This happens because your project uses ES modules (`"type": "module"` in package.json), but the config file was using CommonJS syntax.

## ✅ Solution

I've updated `ecosystem.config.js` to use ES module syntax. **Upload the updated file to your server**, then try again:

```bash
pm2 start ecosystem.config.js --env production
```

## Alternative: Use .cjs File

If PM2 still has issues with ES module config files, use the `.cjs` file instead:

```bash
pm2 start ecosystem.config.cjs --env production
```

The `.cjs` file uses CommonJS syntax which PM2 always supports.

## What Changed

**Before (CommonJS - doesn't work with ES modules):**
```javascript
module.exports = { ... }
```

**After (ES Module syntax):**
```javascript
export default { ... }
```

## Quick Fix on Server

If you can't upload the file right now, you can quickly fix it on the server:

```bash
cd ~/htdocs/crm.ratehonk.com/crm-ratehonk

# Option 1: Use the .cjs file (easiest)
pm2 start ecosystem.config.cjs --env production

# Option 2: Or manually edit the .js file
nano ecosystem.config.js
# Change first line from: module.exports = {
# To: export default {
# Change last line from: };
# To: };
```

---

**The config file has been fixed! Upload it and try again, or use `ecosystem.config.cjs` as a quick workaround.**


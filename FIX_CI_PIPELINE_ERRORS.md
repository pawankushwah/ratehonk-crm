# 🔧 Fix CI/CD Pipeline Errors

## Issues Fixed

### 1. Node.js Version Mismatch
- **Problem:** GitHub Actions was using Node.js 18, but some packages require Node.js 20+
- **Fix:** Updated workflow to use Node.js 20

### 2. Package Lock File Sync
- **Problem:** `npm ci` failed because package-lock.json was out of sync
- **Fix:** Changed to `npm install` which updates the lock file

## Changes Made

### Updated Files:
1. `.github/workflows/deploy.yml` - Updated to Node.js 20 and `npm install`
2. `.github/workflows/deploy-simple.yml` - Added Node.js version check
3. `.github/workflows/deploy-remote.sh` - Added Node.js version check

## Server Requirements

**Important:** Your production server also needs Node.js 20+

### Check Server Node.js Version

```bash
ssh ratehonk-crm@your-server-ip
node -v
```

### Update Server to Node.js 20

If your server is still on Node.js 18:

```bash
# Remove old Node.js
sudo apt-get remove nodejs npm

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node -v  # Should show v20.x.x
npm -v
```

### Update PM2 After Node.js Upgrade

```bash
# Reinstall PM2 with new Node.js
npm install -g pm2

# Restart PM2 processes
pm2 restart all
pm2 save
```

## Regenerate package-lock.json (Optional)

If you want to regenerate the lock file locally:

```bash
# Delete old lock file
rm package-lock.json

# Reinstall to generate new lock file
npm install

# Commit the new lock file
git add package-lock.json
git commit -m "Update package-lock.json for Node.js 20"
git push
```

## Verify Fix

After pushing changes:

1. Go to **GitHub Actions** tab
2. Check the latest workflow run
3. Should see:
   - ✅ Node.js 20 being used
   - ✅ Dependencies installing successfully
   - ✅ Build completing

## Troubleshooting

### Still Getting Node.js 18 Errors

- Check GitHub Actions logs - should show Node.js 20
- Verify workflow file has `node-version: '20'`

### Package Lock Still Out of Sync

- Run `npm install` locally to update lock file
- Commit and push the updated `package-lock.json`

### Server Build Fails

- Ensure server has Node.js 20+
- Check server logs: `pm2 logs ratehonk-crm`

---

**Pipeline errors should now be fixed! 🎉**


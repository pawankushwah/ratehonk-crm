# 🔐 GitHub Secrets Setup for CI/CD Pipeline

## Required Secrets

Your new workflow uses these secret names. Add them in: **GitHub Repo → Settings → Secrets and variables → Actions**

### 1. **`VPS_SSH_PRIVATE_KEY`** (Required)

Your SSH private key for server access.

**How to get it:**
```powershell
# On Windows PowerShell
Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy"
```

**Copy the ENTIRE output**, including:
- `-----BEGIN OPENSSH PRIVATE KEY-----`
- All the encoded content (middle lines)
- `-----END OPENSSH PRIVATE KEY-----`

**Important:** 
- Include BEGIN and END lines
- No extra spaces
- All lines must be included

### 2. **`VPS_HOST`** (Required)

Your server IP address or domain.

**Examples:**
- `srv878988.hostgator.com`
- `123.45.67.89`
- `vps123.hostinger.com`

### 3. **`VPS_USER`** (Required)

SSH username for your server.

**For CloudPanel sites:**
- `ratehonk-crm` (your CloudPanel site user)
- Or `root` (not recommended)

### 4. **`DEPLOY_PATH`** (Optional)

Full path to your project on the server.

**Default:** `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk`

**If you want to use a different path, set this secret:**
- Example: `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk`

## 📝 Step-by-Step Setup

### Step 1: Get Your SSH Private Key

```powershell
Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy"
```

Copy the entire output.

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each:

**Secret 1: VPS_SSH_PRIVATE_KEY**
- Name: `VPS_SSH_PRIVATE_KEY`
- Value: (paste your complete private key)

**Secret 2: VPS_HOST**
- Name: `VPS_HOST`
- Value: `srv878988.hostgator.com` (or your server IP)

**Secret 3: VPS_USER**
- Name: `VPS_USER`
- Value: `ratehonk-crm`

**Secret 4: DEPLOY_PATH** (Optional)
- Name: `DEPLOY_PATH`
- Value: `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk`

### Step 3: Verify Secrets

After adding, you should see:
- ✅ VPS_SSH_PRIVATE_KEY
- ✅ VPS_HOST
- ✅ VPS_USER
- ✅ DEPLOY_PATH (optional)

## 🔄 Migration from Old Secrets

If you had old secrets with different names:

**Old → New:**
- `SSH_PRIVATE_KEY` → `VPS_SSH_PRIVATE_KEY`
- `SERVER_HOST` → `VPS_HOST`
- `SERVER_USER` → `VPS_USER`
- `SERVER_PATH` → `DEPLOY_PATH`

You can either:
1. **Update old secrets** (rename them)
2. **Create new secrets** with new names
3. **Delete old secrets** after creating new ones

## ✅ Verification

After adding secrets, test the workflow:

1. Go to **Actions** tab
2. Click **"CI/CD Pipeline"** workflow
3. Click **"Run workflow"**
4. Select branch: `main`
5. Click **"Run workflow"**

The workflow will:
1. Build the application
2. Run type checks
3. Upload artifacts
4. Deploy to your VPS

## 🐛 Troubleshooting

### SSH Key Errors

If you see SSH key errors:
- Verify the key includes BEGIN and END lines
- Check for extra spaces or line breaks
- Ensure the public key is in server's `~/.ssh/authorized_keys`

### Host Connection Errors

If connection fails:
- Verify `VPS_HOST` is correct
- Check server firewall allows SSH (port 22)
- Test SSH manually: `ssh -i ~/.ssh/github_actions_deploy user@host`

### Permission Errors

If you see permission errors:
- Ensure `VPS_USER` has access to `DEPLOY_PATH`
- Check file ownership on server
- Verify PM2 is installed and accessible

---

**Your CI/CD pipeline is ready with the new workflow! 🚀**


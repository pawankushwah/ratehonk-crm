# 🚀 GitHub CI/CD Setup Guide

This guide will help you set up automated deployment from GitHub to your production server.

## 📋 Prerequisites

- GitHub repository with your code
- Production server with SSH access
- PM2 installed on server
- Node.js 18+ on server

## 🔧 Step 1: Generate SSH Key Pair

### On Your Local Machine

```bash
# Generate SSH key pair (if you don't have one)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# This creates:
# ~/.ssh/github_actions_deploy (private key)
# ~/.ssh/github_actions_deploy.pub (public key)
```

### Copy Public Key to Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub ratehonk-crm@your-server-ip

# Or manually:
cat ~/.ssh/github_actions_deploy.pub
# Copy the output and add to server's ~/.ssh/authorized_keys
```

### Test SSH Connection

```bash
ssh -i ~/.ssh/github_actions_deploy ratehonk-crm@your-server-ip
```

## 🔐 Step 2: Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

### Required Secrets:

1. **`SERVER_HOST`**
   - Value: Your server IP or domain
   - Example: `srv878988.hostgator.com` or `123.45.67.89`

2. **`SERVER_USER`**
   - Value: SSH username
   - Example: `ratehonk-crm`

3. **`SSH_PRIVATE_KEY`**
   - Value: Contents of your private key file
   - Get it with: `cat ~/.ssh/github_actions_deploy`
   - Copy the entire output (including `-----BEGIN` and `-----END` lines)

4. **`SERVER_PATH`**
   - Value: Full path to your project on server
   - Example: `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk`

### Optional Secrets:

5. **`SERVER_PORT`** (if not using port 22)
   - Value: SSH port number
   - Example: `2222`

## 📝 Step 3: Choose Deployment Method

### Option A: Git Pull Method (Recommended - Simpler)

Uses workflow: `.github/workflows/deploy-simple.yml`

**Requirements:**
- Your server must have Git repository cloned
- Server must have access to pull from GitHub (SSH key or HTTPS token)

**Setup on Server:**
```bash
cd /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk

# If not already a git repo, initialize it
git init
git remote add origin https://github.com/your-username/your-repo.git
# Or use SSH: git remote add origin git@github.com:your-username/your-repo.git

# Pull code
git pull origin main
```

**Advantages:**
- Simpler workflow
- Faster (only pulls changed files)
- Uses Git for version control

### Option B: SCP Upload Method

Uses workflow: `.github/workflows/deploy.yml`

**Requirements:**
- No Git needed on server
- Uploads files directly via SCP

**Advantages:**
- Works without Git on server
- More control over what gets deployed

## 🚀 Step 4: Enable GitHub Actions

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see the workflow files
4. If prompted, click **"I understand my workflows, go ahead and enable them"**

## ✅ Step 5: Test Deployment

### Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **"Deploy to Production"** workflow
3. Click **"Run workflow"**
4. Select branch (main/master)
5. Click **"Run workflow"**

### Automatic Trigger

Push to `main` or `master` branch:

```bash
git add .
git commit -m "Test CI/CD deployment"
git push origin main
```

The workflow will automatically start!

## 📊 Monitoring Deployments

1. Go to **Actions** tab in GitHub
2. Click on a workflow run to see:
   - Build status
   - Deployment logs
   - Any errors

## 🔍 Troubleshooting

### SSH Connection Failed

**Error:** `Permission denied (publickey)`

**Fix:**
1. Verify SSH key is added to GitHub secrets correctly
2. Ensure public key is in server's `~/.ssh/authorized_keys`
3. Test SSH connection manually: `ssh -i ~/.ssh/github_actions_deploy user@server`

### Build Failed

**Error:** `npm run build` failed

**Fix:**
1. Check build logs in GitHub Actions
2. Ensure all dependencies are in `package.json`
3. Test build locally: `npm run build`

### PM2 Not Found

**Error:** `pm2: command not found`

**Fix:**
1. Install PM2 on server: `npm install -g pm2`
2. Or use full path: `/usr/local/bin/pm2` or `~/.npm-global/bin/pm2`

### Path Not Found

**Error:** `cd: /path/to/project: No such file or directory`

**Fix:**
1. Verify `SERVER_PATH` secret is correct
2. Ensure path exists on server
3. Check path has correct permissions

### Permission Denied

**Error:** `Permission denied` when running scripts

**Fix:**
1. Ensure user has write permissions in project directory
2. Check file ownership: `ls -la /path/to/project`
3. Fix permissions: `chown -R user:user /path/to/project`

## 🔒 Security Best Practices

1. **Never commit secrets** - Always use GitHub Secrets
2. **Use SSH keys** - More secure than passwords
3. **Limit SSH access** - Use firewall rules
4. **Rotate keys regularly** - Change SSH keys periodically
5. **Use branch protection** - Require reviews before deploying

## 📝 Workflow Files

- **`.github/workflows/deploy-simple.yml`** - Git pull method (recommended)
- **`.github/workflows/deploy.yml`** - SCP upload method
- **`.github/workflows/deploy-remote.sh`** - Remote deployment script

## 🎯 Quick Reference

**GitHub Secrets Needed:**
- `SERVER_HOST` - Server IP/domain
- `SERVER_USER` - SSH username
- `SSH_PRIVATE_KEY` - Private SSH key
- `SERVER_PATH` - Project path on server
- `SERVER_PORT` - SSH port (optional, default: 22)

**Deployment Triggers:**
- Push to `main` or `master` branch
- Manual trigger from GitHub Actions UI

**After Deployment:**
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs ratehonk-crm`
- Test application: `curl https://crm.ratehonk.com/health`

---

**Your CI/CD pipeline is ready! Push to main branch and watch it deploy automatically! 🎉**


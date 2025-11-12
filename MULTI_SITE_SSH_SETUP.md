# 🔐 SSH Key Setup for Multiple CloudPanel Sites

## ✅ Yes, You Can Use the Same SSH Key!

You can use the same SSH private key for multiple CloudPanel sites. Here's how:

## 📋 Understanding CloudPanel Site Structure

In CloudPanel, each site typically has:
- **Own user account** (e.g., `ratehonk-crm`, `site2-user`, `site3-user`)
- **Own directory** (e.g., `/home/ratehonk-crm/htdocs/...`)
- **Own SSH access** (via user's `~/.ssh/authorized_keys`)

## 🔑 Option 1: Same Key for Same User (Recommended)

If multiple sites share the same CloudPanel user:

**Example:**
- Site 1: `/home/ratehonk-crm/htdocs/crm.ratehonk.com/`
- Site 2: `/home/ratehonk-crm/htdocs/another-site.com/`

**Setup:**
1. Add the public key once to `~/.ssh/authorized_keys` for that user
2. Use the same `SSH_PRIVATE_KEY` in GitHub Secrets
3. Use different `SERVER_PATH` secrets for each site

**GitHub Secrets per Site:**
- Site 1:
  - `SSH_PRIVATE_KEY` = (same key)
  - `SERVER_USER` = `ratehonk-crm`
  - `SERVER_PATH` = `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk`

- Site 2:
  - `SSH_PRIVATE_KEY` = (same key)
  - `SERVER_USER` = `ratehonk-crm`
  - `SERVER_PATH` = `/home/ratehonk-crm/htdocs/another-site.com/project`

## 🔑 Option 2: Same Key for Different Users

If each site has a different CloudPanel user:

**Example:**
- Site 1: User `ratehonk-crm`
- Site 2: User `site2-user`
- Site 3: User `site3-user`

**Setup:**
1. Add the same public key to each user's `~/.ssh/authorized_keys`
2. Use the same `SSH_PRIVATE_KEY` in GitHub Secrets
3. Use different `SERVER_USER` and `SERVER_PATH` for each site

**Steps:**

```bash
# For user 1 (ratehonk-crm)
ssh ratehonk-crm@your-server-ip
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# For user 2 (site2-user)
ssh site2-user@your-server-ip
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# For user 3 (site3-user)
ssh site3-user@your-server-ip
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**GitHub Secrets per Site:**
- Site 1:
  - `SSH_PRIVATE_KEY` = (same key)
  - `SERVER_USER` = `ratehonk-crm`
  - `SERVER_PATH` = `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk`

- Site 2:
  - `SSH_PRIVATE_KEY` = (same key)
  - `SERVER_USER` = `site2-user`
  - `SERVER_PATH` = `/home/site2-user/htdocs/another-site.com/project`

## 🚀 Quick Setup Script

Add your public key to multiple users at once:

```bash
#!/bin/bash
# add-ssh-key-to-users.sh

PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE65X9vVWK/GaI4PF3gA5w6J27dwAznXVii4eziDGVTR github-actions"

USERS=("ratehonk-crm" "site2-user" "site3-user")

for USER in "${USERS[@]}"; do
    echo "Adding key to $USER..."
    sudo -u $USER mkdir -p /home/$USER/.ssh
    sudo -u $USER chmod 700 /home/$USER/.ssh
    echo "$PUBLIC_KEY" | sudo -u $USER tee -a /home/$USER/.ssh/authorized_keys
    sudo -u $USER chmod 600 /home/$USER/.ssh/authorized_keys
    echo "✅ Key added to $USER"
done
```

## 📝 GitHub Actions Workflow Setup

### For Multiple Sites with Same Key

Create separate workflow files or use workflow inputs:

**Option A: Separate Workflow Files**

`.github/workflows/deploy-site1.yml`:
```yaml
name: Deploy Site 1
on:
  push:
    branches: [main]
    paths:
      - 'site1/**'
jobs:
  deploy:
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SITE1_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ${{ secrets.SITE1_PATH }}
            # deployment commands
```

`.github/workflows/deploy-site2.yml`:
```yaml
name: Deploy Site 2
on:
  push:
    branches: [main]
    paths:
      - 'site2/**'
jobs:
  deploy:
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SITE2_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}  # Same key!
          script: |
            cd ${{ secrets.SITE2_PATH }}
            # deployment commands
```

**Option B: Single Workflow with Matrix**

```yaml
name: Deploy All Sites
on:
  workflow_dispatch:
    inputs:
      site:
        type: choice
        options:
          - site1
          - site2
          - site3

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets[format('{0}_USER', github.event.inputs.site)] }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ${{ secrets[format('{0}_PATH', github.event.inputs.site)] }}
            # deployment commands
```

## 🔒 Security Best Practices

### ✅ Recommended Approach

1. **One key per deployment purpose:**
   - One key for GitHub Actions deployments
   - Different key for personal SSH access
   - Different key for other automation

2. **Key naming:**
   - `github_actions_deploy` - For CI/CD
   - `personal_access` - For your personal use
   - `backup_automation` - For backup scripts

3. **Access control:**
   - Each key should only have access to what it needs
   - Use CloudPanel user permissions to limit access
   - Regularly rotate keys (every 6-12 months)

### ❌ Not Recommended

- Using your personal SSH key for GitHub Actions
- Sharing the same key across different organizations
- Using keys without passphrases in production

## 📊 GitHub Secrets Organization

For multiple sites, organize secrets like this:

**Common Secrets (shared):**
- `SSH_PRIVATE_KEY` - Same for all sites
- `SERVER_HOST` - Same server IP

**Site-Specific Secrets:**
- `SITE1_USER` = `ratehonk-crm`
- `SITE1_PATH` = `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk`
- `SITE2_USER` = `site2-user`
- `SITE2_PATH` = `/home/site2-user/htdocs/another-site.com/project`

## ✅ Verification

Test SSH access for each user:

```bash
# Test Site 1
ssh -i ~/.ssh/github_actions_deploy ratehonk-crm@your-server-ip

# Test Site 2
ssh -i ~/.ssh/github_actions_deploy site2-user@your-server-ip

# Test Site 3
ssh -i ~/.ssh/github_actions_deploy site3-user@your-server-ip
```

All should connect without passwords if the key is properly added.

## 🎯 Summary

**Yes, you can use the same SSH key for multiple CloudPanel sites!**

**Best Practice:**
1. Generate one SSH key pair for GitHub Actions
2. Add the public key to all CloudPanel users that need deployment access
3. Use the same `SSH_PRIVATE_KEY` in GitHub Secrets
4. Use different `SERVER_USER` and `SERVER_PATH` secrets for each site

**Benefits:**
- ✅ Simpler key management
- ✅ One key to rotate instead of many
- ✅ Easier to revoke access (remove from all users)
- ✅ Consistent deployment process

---

**Your SSH key can be used across all your CloudPanel sites! 🎉**


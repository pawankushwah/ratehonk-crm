# ⚠️ Using Root User for SSH - Security Guide

## ⚠️ **NOT RECOMMENDED - Security Risk!**

Using root user for SSH access is **strongly discouraged** for security reasons. However, if you must use it, here's how and why you shouldn't.

## 🚨 Security Risks

### Why Root Access is Dangerous:

1. **Full System Access**
   - Root can modify/delete ANY file on the server
   - Can break other sites on the same server
   - Can compromise the entire VPS

2. **No Isolation**
   - If one site's deployment goes wrong, it affects ALL sites
   - No protection between different CloudPanel sites
   - Violates principle of least privilege

3. **Audit Trail Issues**
   - Harder to track which user/site made changes
   - CloudPanel logs won't show site-specific actions
   - Difficult to troubleshoot issues

4. **GitHub Actions Risk**
   - If GitHub Actions is compromised, attacker gets root access
   - Can access all sites, databases, and system files
   - Can install backdoors or malware

5. **CloudPanel Best Practices**
   - CloudPanel is designed to use individual users per site
   - Using root bypasses CloudPanel's security model
   - May cause issues with CloudPanel's file management

## ✅ Recommended: Use Individual Site Users

**Best Practice:**
- Each CloudPanel site has its own user
- Use the same SSH key, but different users
- Maintains security isolation

**Setup:**
```bash
# Site 1
SERVER_USER = ratehonk-crm
SERVER_PATH = /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk

# Site 2
SERVER_USER = site2-user
SERVER_PATH = /home/site2-user/htdocs/another-site.com/project
```

## 🔧 If You Must Use Root (Not Recommended)

### Step 1: Enable Root SSH Access

**⚠️ WARNING: This reduces server security significantly!**

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Find and change:
# PermitRootLogin yes
# PasswordAuthentication no  # Use key-based auth only!

# Restart SSH
sudo systemctl restart sshd
```

### Step 2: Add Public Key to Root

```bash
# As root user
mkdir -p /root/.ssh
chmod 700 /root/.ssh
echo "YOUR_PUBLIC_KEY" >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

### Step 3: Update GitHub Secrets

**GitHub Secrets:**
- `SSH_PRIVATE_KEY` = (your private key)
- `SERVER_USER` = `root`
- `SERVER_PATH` = (full path to project)
- `SERVER_HOST` = (your server IP)

### Step 4: Update Workflow

The workflow will work the same, just with `root` as user:

```yaml
- uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: root  # ⚠️ Using root
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      cd /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk
      # deployment commands
```

## 🛡️ Security Hardening (If Using Root)

If you absolutely must use root, at least:

### 1. Disable Password Authentication

```bash
sudo nano /etc/ssh/sshd_config

# Ensure these settings:
PermitRootLogin prohibit-password  # Key-based only
PasswordAuthentication no
PubkeyAuthentication yes

sudo systemctl restart sshd
```

### 2. Use SSH Key with Passphrase

```bash
# Generate key with passphrase
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy

# When prompted, enter a strong passphrase
```

### 3. Restrict Root Access by IP

```bash
sudo nano /etc/ssh/sshd_config

# Add at the end:
Match Address 192.168.1.0/24  # Only allow from specific IPs
    PermitRootLogin yes
```

### 4. Use Fail2Ban

```bash
# Install Fail2Ban
sudo apt-get install fail2ban

# Configure to protect SSH
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 5. Limit Root Commands (Advanced)

Use `authorized_keys` command restrictions:

```bash
# In /root/.ssh/authorized_keys
command="/usr/local/bin/deploy-script.sh" ssh-ed25519 AAAAC3... github-actions
```

This limits what commands can be run via this key.

## 🎯 Better Alternatives

### Option 1: Use Sudo (Recommended)

Keep individual users but grant sudo for specific commands:

```bash
# Add to sudoers (visudo)
ratehonk-crm ALL=(ALL) NOPASSWD: /usr/bin/pm2, /usr/bin/npm, /usr/bin/git
```

Then in workflow:
```yaml
script: |
  cd /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk
  sudo pm2 restart ratehonk-crm
```

### Option 2: Use Same User for Multiple Sites

If sites can share a user:

```bash
# All sites under one user
/home/deploy-user/htdocs/site1.com/
/home/deploy-user/htdocs/site2.com/
/home/deploy-user/htdocs/site3.com/
```

Use:
- `SERVER_USER` = `deploy-user`
- Different `SERVER_PATH` per site

### Option 3: Use Deployment User

Create a dedicated deployment user:

```bash
# Create deployment user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG www-data deploy

# Add SSH key
sudo -u deploy mkdir -p /home/deploy/.ssh
echo "YOUR_PUBLIC_KEY" | sudo -u deploy tee /home/deploy/.ssh/authorized_keys
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys

# Grant necessary permissions
sudo chown -R deploy:www-data /home/*/htdocs/
```

## 📊 Comparison

| Approach | Security | Isolation | CloudPanel Compatible | Recommended |
|----------|----------|-----------|----------------------|-------------|
| Root User | ❌ Very Low | ❌ None | ❌ No | ❌ No |
| Individual Users | ✅ High | ✅ Full | ✅ Yes | ✅ **Yes** |
| Shared Deploy User | ⚠️ Medium | ⚠️ Partial | ⚠️ Partial | ⚠️ Maybe |
| Sudo with Limits | ✅ High | ✅ Good | ✅ Yes | ✅ **Yes** |

## ✅ Recommended Setup

**Best Practice for Multiple Sites:**

1. **Use individual CloudPanel users** (one per site)
2. **Same SSH key** for all deployments
3. **Different GitHub Secrets** per site:
   - Same `SSH_PRIVATE_KEY`
   - Different `SERVER_USER` per site
   - Different `SERVER_PATH` per site

**Example:**
```yaml
# Site 1
SERVER_USER: ratehonk-crm
SERVER_PATH: /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk

# Site 2  
SERVER_USER: site2-user
SERVER_PATH: /home/site2-user/htdocs/another-site.com/project
```

## 🎯 Summary

**Can you use root?** Yes, technically.

**Should you use root?** **NO!** ❌

**Why not?**
- Security risk
- No isolation between sites
- Violates best practices
- Can break CloudPanel functionality

**What to do instead?**
- ✅ Use individual CloudPanel site users
- ✅ Same SSH key, different users
- ✅ Maintains security and isolation

---

**Please use individual site users instead of root for better security! 🔒**


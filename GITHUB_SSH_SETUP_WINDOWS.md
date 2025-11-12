# 🔐 SSH Key Setup for GitHub Actions (Windows)

## ✅ Step 1: SSH Key Generated

Your SSH key has been generated successfully!

**Location:**
- Private key: `C:\Users\sahil\.ssh\github_actions_deploy`
- Public key: `C:\Users\sahil\.ssh\github_actions_deploy.pub`

## 📋 Step 2: Copy Public Key to Server

### Option A: Using ssh-copy-id (if available)

```powershell
ssh-copy-id -i "$env:USERPROFILE\.ssh\github_actions_deploy.pub" ratehonk-crm@your-server-ip
```

### Option B: Manual Copy (Recommended for Windows)

1. **Get your public key:**
   ```powershell
   Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy.pub"
   ```

2. **Copy the entire output** (starts with `ssh-ed25519`)

3. **SSH into your server:**
   ```powershell
   ssh ratehonk-crm@your-server-ip
   ```

4. **On the server, add the public key:**
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

5. **Test the connection:**
   ```powershell
   ssh -i "$env:USERPROFILE\.ssh\github_actions_deploy" ratehonk-crm@your-server-ip
   ```

## 🔑 Step 3: Add Private Key to GitHub Secrets

1. **Get your private key:**
   ```powershell
   Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy"
   ```

2. **Copy the entire output** (includes `-----BEGIN` and `-----END` lines)

3. **Go to GitHub:**
   - Repository → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**

4. **Add secret:**
   - Name: `SSH_PRIVATE_KEY`
   - Value: Paste the entire private key content
   - Click **Add secret**

## 📝 Step 4: Add Other GitHub Secrets

Add these secrets in GitHub:

1. **`SERVER_HOST`**
   - Value: Your server IP or domain
   - Example: `srv878988.hostgator.com` or `123.45.67.89`

2. **`SERVER_USER`**
   - Value: `ratehonk-crm`

3. **`SSH_PRIVATE_KEY`**
   - Value: Contents of `github_actions_deploy` (private key)

4. **`SERVER_PATH`**
   - Value: `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk`

5. **`SERVER_PORT`** (optional, if not using port 22)
   - Value: Your SSH port number

## ✅ Step 5: Test Connection

Test SSH connection from PowerShell:

```powershell
ssh -i "$env:USERPROFILE\.ssh\github_actions_deploy" ratehonk-crm@your-server-ip
```

If it connects without asking for a password, you're all set!

## 🚀 Step 6: Test GitHub Actions

1. Push code to GitHub:
   ```powershell
   git add .
   git commit -m "Test CI/CD"
   git push origin main
   ```

2. Go to **Actions** tab in GitHub
3. Watch the deployment workflow run!

## 🔒 Security Notes

- **Never share your private key** - Keep it secret!
- **Never commit keys to Git** - They're already in `.gitignore`
- **Use passphrase** (optional) - Adds extra security
- **Rotate keys periodically** - Change keys every 6-12 months

## 📍 Quick Reference

**Public Key Location:** `C:\Users\sahil\.ssh\github_actions_deploy.pub`
**Private Key Location:** `C:\Users\sahil\.ssh\github_actions_deploy`

**View Public Key:**
```powershell
Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy.pub"
```

**View Private Key:**
```powershell
Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy"
```

---

**Your SSH keys are ready! Now add them to GitHub and your server! 🎉**


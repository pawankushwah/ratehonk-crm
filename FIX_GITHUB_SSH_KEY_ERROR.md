# 🔧 Fix: GitHub Actions SSH Key Error

## Error Message

```
Error: can't connect without a private SSH key or password
```

## Problem

The GitHub Actions workflow cannot find or use the SSH private key. This means the `SSH_PRIVATE_KEY` secret is either:
- Not set in GitHub Secrets
- Incorrectly formatted
- Missing required parts

## ✅ Solution

### Step 1: Verify SSH Private Key

On your local Windows machine, get your private key:

```powershell
Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy"
```

You should see something like:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAlwAAAAdzc2gtcn
...
-----END OPENSSH PRIVATE KEY-----
```

### Step 2: Add/Update GitHub Secret

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Find **`SSH_PRIVATE_KEY`** secret (or create new one)
4. Click **Update** (or **New repository secret**)

### Step 3: Copy Private Key Correctly

**Important:** Copy the ENTIRE key including:
- `-----BEGIN OPENSSH PRIVATE KEY-----` (first line)
- All the encoded content (middle lines)
- `-----END OPENSSH PRIVATE KEY-----` (last line)

**Do NOT:**
- ❌ Remove the BEGIN/END lines
- ❌ Add extra spaces or line breaks
- ❌ Modify the key content

### Step 4: Verify All Required Secrets

Make sure ALL these secrets are set:

1. **`SSH_PRIVATE_KEY`** ✅ (The one causing the error)
   - Value: Complete private key with BEGIN/END lines

2. **`SERVER_HOST`**
   - Value: Your server IP or domain
   - Example: `srv878988.hostgator.com` or `123.45.67.89`

3. **`SERVER_USER`**
   - Value: `ratehonk-crm`

4. **`SERVER_PATH`**
   - Value: `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk`

5. **`SERVER_PORT`** (optional)
   - Value: `22` (default SSH port)

### Step 5: Test SSH Connection

From your local PowerShell, test if the key works:

```powershell
ssh -i "$env:USERPROFILE\.ssh\github_actions_deploy" ratehonk-crm@your-server-ip
```

If this works, the key is correct. If not, regenerate the key pair.

## 🔄 Alternative: Use deploy-simple.yml Instead

If you're having issues with the SCP method, use the simpler Git pull method:

1. Go to **Actions** tab in GitHub
2. Select **"Deploy to Production (Simple)"** workflow
3. This workflow uses Git pull instead of SCP
4. It doesn't need to upload files, just pulls from Git

**Requirements for deploy-simple.yml:**
- Your server must have Git access to the repository
- Repository must be cloned on the server

## 🐛 Troubleshooting

### Still Getting Error After Adding Secret

1. **Check secret name:** Must be exactly `SSH_PRIVATE_KEY` (case-sensitive)
2. **Check key format:** Must include BEGIN and END lines
3. **Check for extra spaces:** Remove any leading/trailing spaces
4. **Regenerate key pair:** If still not working, create new keys

### Regenerate SSH Key Pair

If you need to regenerate:

```powershell
# Delete old keys
Remove-Item "$env:USERPROFILE\.ssh\github_actions_deploy*"

# Generate new keys
ssh-keygen -t ed25519 -C "github-actions" -f "$env:USERPROFILE\.ssh\github_actions_deploy" -N '""'

# Get public key (add to server)
Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy.pub"

# Get private key (add to GitHub)
Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy"
```

Then:
1. Add public key to server's `~/.ssh/authorized_keys`
2. Add private key to GitHub Secrets as `SSH_PRIVATE_KEY`

## ✅ Verification Checklist

- [ ] SSH private key copied completely (with BEGIN/END lines)
- [ ] `SSH_PRIVATE_KEY` secret exists in GitHub
- [ ] `SERVER_HOST` secret is set correctly
- [ ] `SERVER_USER` secret is set correctly
- [ ] `SERVER_PATH` secret is set correctly
- [ ] SSH connection works from local machine
- [ ] Public key is in server's `~/.ssh/authorized_keys`

---

**After fixing the SSH_PRIVATE_KEY secret, the workflow should work! 🎉**


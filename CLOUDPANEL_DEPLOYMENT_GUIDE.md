# 🚀 CloudPanel + Hostinger VPS Deployment Guide

This guide is specifically for deploying RateHonk CRM on Hostinger VPS with CloudPanel.

## 📋 Your Setup

- **Server Type:** Hostinger VPS with CloudPanel
- **Project Path:** `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk`
- **User:** `ratehonk-crm`
- **Multiple Sites:** Yes (CloudPanel manages multiple sites)

## 🔧 Step 1: Initial Server Setup

### 1.1 Access Your Server

```bash
ssh ratehonk-crm@your-server-ip
# or via CloudPanel SSH terminal
```

### 1.2 Verify Node.js and PM2

```bash
# Check Node.js version (should be 18+)
node -v

# If not installed, install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Verify
pm2 --version
```

### 1.3 Set Up Project Directory

```bash
cd /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk

# Verify you're in the right directory
pwd
# Should show: /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk
```

## 🔐 Step 2: Setup SSH Key for GitHub Actions

### 2.1 Add Public Key to Server

From your local Windows machine, SSH into the server:

```powershell
ssh ratehonk-crm@your-server-ip
```

Then on the server, run:

```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your GitHub Actions public key
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE65X9vVWK/GaI4PF3gA5w6J27dwAznXVii4eziDGVTR github-actions" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# Verify
cat ~/.ssh/authorized_keys
```

### 2.2 Test SSH Connection

From your local PowerShell:

```powershell
ssh -i "$env:USERPROFILE\.ssh\github_actions_deploy" ratehonk-crm@your-server-ip
```

If it connects without password, you're good!

## 📦 Step 3: Initial Project Setup

### 3.1 Clone or Upload Project

**Option A: Using Git (Recommended for CI/CD)**

```bash
cd /home/ratehonk-crm/htdocs/crm.ratehonk.com
git clone https://github.com/your-username/your-repo.git crm-ratehonk
cd crm-ratehonk
```

**Option B: Upload via CloudPanel File Manager**

1. Go to CloudPanel → Sites → crm.ratehonk.com → File Manager
2. Upload your project files
3. Extract if needed

### 3.2 Install Dependencies

```bash
cd /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk
npm install
```

### 3.3 Create .env File

```bash
nano .env
```

Add your environment variables:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://username:password@host:port/database?ssl=true

# Authentication (REQUIRED)
JWT_SECRET=your-generated-jwt-secret-here
SESSION_SECRET=your-generated-session-secret-here

# Server Configuration
NODE_ENV=production
PORT=5000

# Optional: Add other variables as needed
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Build Project

```bash
npm run build
```

### 3.5 Setup Database

```bash
npm run db:push
```

## 🚀 Step 4: Setup PM2

### 4.1 Start with PM2

```bash
cd /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk
pm2 start ecosystem.config.js --env production
```

### 4.2 Save PM2 Configuration

```bash
pm2 save
```

### 4.3 Setup PM2 Startup (Important for VPS)

```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ratehonk-crm --hp /home/ratehonk-crm

# Run the command it provides
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ratehonk-crm --hp /home/ratehonk-crm

# Save again
pm2 save
```

### 4.4 Verify PM2 Status

```bash
pm2 status
pm2 logs ratehonk-crm --lines 20
```

## 🌐 Step 5: Configure CloudPanel/Nginx

### 5.1 Access CloudPanel

1. Go to CloudPanel: `https://your-server-ip:8443`
2. Login with your CloudPanel credentials
3. Navigate to **Sites** → **crm.ratehonk.com**

### 5.2 Configure Nginx Reverse Proxy

In CloudPanel, go to **Sites** → **crm.ratehonk.com** → **Nginx Config**

Add or update the configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name crm.ratehonk.com www.crm.ratehonk.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name crm.ratehonk.com www.crm.ratehonk.com;
    
    # SSL certificates (CloudPanel manages these)
    ssl_certificate /etc/letsencrypt/live/crm.ratehonk.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.ratehonk.com/privkey.pem;
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 5.3 Setup SSL Certificate

In CloudPanel:
1. Go to **Sites** → **crm.ratehonk.com** → **SSL**
2. Click **Let's Encrypt**
3. Select domains: `crm.ratehonk.com` and `www.crm.ratehonk.com`
4. Click **Install**

### 5.4 Reload Nginx

```bash
sudo systemctl reload nginx
# or via CloudPanel: Sites → crm.ratehonk.com → Reload
```

## 🔄 Step 6: Setup GitHub CI/CD

### 6.1 Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Add these secrets:

1. **`SERVER_HOST`**
   - Value: Your Hostinger VPS IP or domain
   - Example: `123.45.67.89` or `vps123.hostinger.com`

2. **`SERVER_USER`**
   - Value: `ratehonk-crm`

3. **`SSH_PRIVATE_KEY`**
   - Value: Your private SSH key (from `C:\Users\sahil\.ssh\github_actions_deploy`)

4. **`SERVER_PATH`**
   - Value: `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk`

5. **`SERVER_PORT`** (optional)
   - Value: `22` (default SSH port)

### 6.2 Enable GitHub Actions

1. Go to **Actions** tab in GitHub
2. Select **"Deploy to Production (Simple)"** workflow
3. Click **"I understand my workflows, go ahead and enable them"**

### 6.3 Test Deployment

Push to main branch:

```bash
git add .
git commit -m "Setup CI/CD"
git push origin main
```

Or manually trigger: **Actions → Deploy to Production → Run workflow**

## 🔒 Step 7: CloudPanel-Specific Considerations

### 7.1 File Permissions

CloudPanel manages file permissions. Ensure correct ownership:

```bash
# Set ownership (CloudPanel user)
sudo chown -R ratehonk-crm:ratehonk-crm /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk

# Set directory permissions
find /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk -type d -exec chmod 755 {} \;
find /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk -type f -exec chmod 644 {} \;
```

### 7.2 PM2 User Context

PM2 should run as the site user (`ratehonk-crm`):

```bash
# Ensure PM2 is running as correct user
pm2 list
# Should show processes owned by ratehonk-crm
```

### 7.3 Logs Location

CloudPanel logs are typically in:
- Nginx logs: `/home/ratehonk-crm/logs/`
- PM2 logs: `/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk/logs/`

### 7.4 Multiple Sites Isolation

Since you have multiple sites:
- Each site has its own user (`ratehonk-crm` for this site)
- Each site runs on different ports (this one uses 5000)
- CloudPanel manages Nginx configuration per site
- PM2 processes are isolated per user

## 📊 Step 8: Monitoring & Maintenance

### 8.1 Check Application Status

```bash
# PM2 status
pm2 status

# Application logs
pm2 logs ratehonk-crm --lines 50

# Nginx status
sudo systemctl status nginx

# Check if port 5000 is listening
sudo netstat -tlnp | grep 5000
```

### 8.2 CloudPanel Monitoring

- **Resource Usage:** CloudPanel → Sites → crm.ratehonk.com → Monitoring
- **Logs:** CloudPanel → Sites → crm.ratehonk.com → Logs
- **Backups:** CloudPanel → Sites → crm.ratehonk.com → Backups

## 🔄 Step 9: Update Workflow for CloudPanel

The GitHub Actions workflow will work as-is, but you can customize it. The workflow will:

1. Pull latest code (or upload files)
2. Install dependencies
3. Build project
4. Restart PM2
5. Application is live!

## ✅ Verification Checklist

- [ ] Node.js 18+ installed
- [ ] PM2 installed and configured
- [ ] Project cloned/uploaded to correct path
- [ ] `.env` file created with all variables
- [ ] Project built successfully (`npm run build`)
- [ ] Database schema pushed (`npm run db:push`)
- [ ] PM2 process running (`pm2 status`)
- [ ] PM2 startup configured (`pm2 startup`)
- [ ] Nginx configured in CloudPanel
- [ ] SSL certificate installed
- [ ] GitHub secrets configured
- [ ] CI/CD workflow tested
- [ ] Application accessible at `https://crm.ratehonk.com`

## 🐛 Troubleshooting

### PM2 Not Starting After Reboot

```bash
# Re-run PM2 startup
pm2 startup
# Follow the command it outputs
pm2 save
```

### Port 5000 Already in Use

```bash
# Find what's using port 5000
sudo lsof -i :5000

# Kill the process or change PORT in .env
```

### Nginx 502 Bad Gateway

- Check if PM2 is running: `pm2 status`
- Check if app is listening on port 5000: `sudo netstat -tlnp | grep 5000`
- Check PM2 logs: `pm2 logs ratehonk-crm`

### Permission Denied Errors

```bash
# Fix ownership
sudo chown -R ratehonk-crm:ratehonk-crm /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk
```

## 📝 Quick Reference Commands

```bash
# Navigate to project
cd /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk

# PM2 commands
pm2 status
pm2 logs ratehonk-crm
pm2 restart ratehonk-crm
pm2 stop ratehonk-crm

# View logs
tail -f logs/err.log
tail -f logs/out.log

# Check application
curl http://localhost:5000/health
```

---

**Your RateHonk CRM is now deployed on Hostinger VPS with CloudPanel! 🎉**


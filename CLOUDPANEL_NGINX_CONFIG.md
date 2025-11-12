# 🌐 CloudPanel Nginx Configuration for RateHonk CRM

## Quick Setup in CloudPanel

### Step 1: Access Nginx Config

1. Login to CloudPanel: `https://your-server-ip:8443`
2. Go to **Sites** → **crm.ratehonk.com**
3. Click **Nginx Config** tab

### Step 2: Update Configuration

Replace the default config with this:

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
    
    # SSL certificates (managed by CloudPanel)
    ssl_certificate /etc/letsencrypt/live/crm.ratehonk.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.ratehonk.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }
    
    # Static files (if serving directly from Nginx)
    location /assets/ {
        alias /home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk/dist/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 3: Save and Reload

1. Click **Save** in CloudPanel
2. CloudPanel will automatically reload Nginx
3. Or manually: `sudo systemctl reload nginx`

## Alternative: Manual Nginx Config File

If you prefer to edit the file directly:

```bash
sudo nano /etc/nginx/sites-available/crm.ratehonk.com
```

Then paste the config above and:

```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Reload
```

## SSL Certificate Setup

### Via CloudPanel (Recommended)

1. Go to **Sites** → **crm.ratehonk.com** → **SSL**
2. Click **Let's Encrypt**
3. Select domains: `crm.ratehonk.com` and `www.crm.ratehonk.com`
4. Click **Install**
5. Enable **Auto-renewal**

### Manual SSL (if needed)

```bash
sudo certbot --nginx -d crm.ratehonk.com -d www.crm.ratehonk.com
```

## Testing Configuration

```bash
# Test Nginx config
sudo nginx -t

# Check if Nginx is running
sudo systemctl status nginx

# Check if port 5000 is accessible
curl http://localhost:5000/health

# Test from outside (should redirect to HTTPS)
curl -I http://crm.ratehonk.com

# Test HTTPS
curl -I https://crm.ratehonk.com/health
```

## Troubleshooting

### 502 Bad Gateway

- Check if PM2 is running: `pm2 status`
- Check if app is on port 5000: `sudo netstat -tlnp | grep 5000`
- Check PM2 logs: `pm2 logs ratehonk-crm`

### SSL Certificate Issues

- Verify certificate exists: `sudo ls -la /etc/letsencrypt/live/crm.ratehonk.com/`
- Renew certificate: `sudo certbot renew`
- Check CloudPanel SSL settings

### Multiple Sites on Same Server

Each site in CloudPanel:
- Has its own Nginx config file
- Uses different ports for Node.js apps
- Is isolated by user permissions

Make sure each site uses a different port:
- Site 1: Port 5000
- Site 2: Port 5001
- Site 3: Port 5002
- etc.

---

**Your Nginx is configured! 🎉**


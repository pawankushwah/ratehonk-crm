# 🔒 HTTPS Local Development Setup

This guide helps you set up HTTPS for local development to test Zoom Phone Smart Embed and other OAuth integrations that require HTTPS.

## Quick Start

### Step 1: Generate SSL Certificate

```bash
npm run generate-cert
```

This creates self-signed SSL certificates in the `certs/` directory.

### Step 2: Trust the Certificate (Required)

**Windows:**
1. Double-click `certs/localhost.pem`
2. Click "Install Certificate"
3. Select "Current User"
4. Select "Place all certificates in the following store"
5. Click "Browse" → Select "Trusted Root Certification Authorities"
6. Click "Next" → "Finish"
7. Restart your browser

**Mac:**
```bash
# Open Keychain Access
open /Applications/Utilities/Keychain\ Access.app

# Import the certificate
sudo security add-trusted-cert -d -r trustRoot -k ~/Library/Keychains/login.keychain-db certs/localhost.pem
```

**Linux (Chrome/Edge):**
```bash
# Install certificate
sudo cp certs/localhost.pem /usr/local/share/ca-certificates/localhost.crt
sudo update-ca-certificates

# Restart browser
```

### Step 3: Start Development Server with HTTPS

```bash
npm run dev:https
```

The server will start on `https://localhost:5000`

## Access Your App

- **HTTPS:** https://localhost:5000
- **HTTP Redirect:** http://localhost:5001 (automatically redirects to HTTPS)

## Troubleshooting

### Certificate Not Trusted

If you see "Your connection is not private" or "NET::ERR_CERT_AUTHORITY_INVALID":

1. **Chrome/Edge:**
   - Click "Advanced"
   - Click "Proceed to localhost (unsafe)" (temporary)
   - Or properly trust the certificate (see Step 2 above)

2. **Firefox:**
   - Click "Advanced"
   - Click "Accept the Risk and Continue"
   - Or add exception: Settings → Privacy & Security → Certificates → View Certificates → Import

### Certificate Generation Fails

**Windows:**
- Install OpenSSL: https://slproweb.com/products/Win32OpenSSL.html
- Or use Git Bash (includes OpenSSL)
- Or use WSL (Windows Subsystem for Linux)

**Mac/Linux:**
- OpenSSL should already be installed
- If not: `brew install openssl` (Mac) or `sudo apt-get install openssl` (Linux)

### Port Already in Use

If port 5000 is already in use:

```bash
# Change port in .env file
PORT=5001 npm run dev:https
```

### Mixed Content Warnings

If you see mixed content warnings:
- Ensure all resources load over HTTPS
- Check browser console for HTTP resources
- Update any hardcoded `http://` URLs to `https://`

## Zoom Phone Smart Embed Configuration

After setting up HTTPS:

1. Go to **Zoom Marketplace** → **Smart Embed** → **Configure**
2. Add to **Authorized domains**:
   ```
   https://localhost:5000
   ```
3. Save and wait 2-3 minutes
4. Test Zoom Phone in your app

## Environment Variables

You can also set `USE_HTTPS=true` in your `.env` file:

```env
USE_HTTPS=true
PORT=5000
NODE_ENV=development
```

Then run:
```bash
npm run dev
```

## Certificate Files

- **Private Key:** `certs/localhost-key.pem`
- **Certificate:** `certs/localhost.pem`

**Important:** These are self-signed certificates for local development only. Never use them in production!

## Regenerating Certificates

To regenerate certificates:

```bash
# Delete old certificates
rm -rf certs/

# Generate new ones
npm run generate-cert
```

## Security Note

Self-signed certificates are only for local development. They will show security warnings in browsers until you trust them. This is normal and safe for localhost development.

---

**Your local development server is now running with HTTPS! 🎉**


# 🔧 Fix: Missing JWT_SECRET and SESSION_SECRET

## Problem

The application is crashing because these required environment variables are missing:
- `JWT_SECRET` - Required for authentication
- `SESSION_SECRET` - Required for session management

## ✅ Solution

Add these secrets to your `.env` file on the server.

### Step 1: Generate Secure Secrets

On your server, run these commands to generate secure random secrets:

```bash
# Generate JWT_SECRET (64 character hex string)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET (64 character hex string)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output from both commands.

### Step 2: Edit .env File

```bash
cd ~/htdocs/crm.ratehonk.com/crm-ratehonk
nano .env
```

### Step 3: Add the Secrets

Make sure your `.env` file contains:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://username:password@host:port/database?ssl=true

# Authentication (REQUIRED - Add the generated values)
JWT_SECRET=your-generated-jwt-secret-here-64-characters
SESSION_SECRET=your-generated-session-secret-here-64-characters

# Server Configuration
NODE_ENV=production
PORT=3000
```

**Important:** Replace `your-generated-jwt-secret-here-64-characters` and `your-generated-session-secret-here-64-characters` with the actual values you generated.

### Step 4: Save and Restart

```bash
# Save the file (Ctrl+X, then Y, then Enter)

# Restart PM2 with updated environment
pm2 restart ratehonk-crm --update-env

# Check status
pm2 status

# Check logs to verify it's working
pm2 logs ratehonk-crm --lines 20
```

## Quick One-Liner to Add Secrets

If you want to quickly add the secrets without manually editing:

```bash
cd ~/htdocs/crm.ratehonk.com/crm-ratehonk

# Generate and add JWT_SECRET
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env

# Generate and add SESSION_SECRET
echo "SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env

# Verify they were added
tail -2 .env

# Restart PM2
pm2 restart ratehonk-crm --update-env
```

## Verify .env File

After adding the secrets, verify your `.env` file:

```bash
cat .env | grep -E "JWT_SECRET|SESSION_SECRET|DATABASE_URL"
```

You should see all three variables set.

---

**After adding the secrets and restarting, your application should start successfully!**


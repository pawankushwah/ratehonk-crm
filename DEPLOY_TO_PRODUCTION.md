# 🚀 Deploy to Production Server - Step by Step

## 📦 What You Need to Upload

**YES, you need to upload your project to the production server** (if you haven't already).

### ✅ Files to Upload (Essential):

Upload these folders and files to your production server:

```
crm-ratehonk/
├── server/              ✅ REQUIRED - Backend source code
├── client/              ✅ REQUIRED - Frontend source code  
├── shared/              ✅ REQUIRED - Shared schemas
├── package.json         ✅ REQUIRED - Dependencies
├── package-lock.json    ✅ REQUIRED - Lock file
├── ecosystem.config.js  ✅ REQUIRED - PM2 configuration
├── drizzle.config.ts    ✅ REQUIRED - Database config
├── tsconfig.json        ✅ REQUIRED - TypeScript config
├── vite.config.ts       ✅ REQUIRED - Build config
├── tailwind.config.ts   ✅ REQUIRED - Tailwind config
└── postcss.config.js    ✅ REQUIRED - PostCSS config
```

### ❌ Files You DON'T Need to Upload:

- `node_modules/` - Will be installed on server
- `dist/` - Will be built on server
- `.env` - Will be created on server
- `*.log` files
- `*.png`, `*.jpg` (unless they're part of the app)
- `attached_assets/` - User uploads folder (can be empty)

---

## 🚀 Step-by-Step Deployment

### Step 1: Upload Project to Server

**Option A: Using SCP (from your Windows machine)**

```powershell
# In PowerShell on your local machine
scp -r D:\Downlaods\crm-ratehonk user@your-server-ip:/home/user/
```

**Option B: Using Git (Recommended)**

```bash
# On your production server
cd /home/your-user
git clone <your-repository-url> crm-ratehonk
cd crm-ratehonk
```

**Option C: Using SFTP Client**

Use FileZilla, WinSCP, or similar:
- Connect to your server
- Upload the entire `crm-ratehonk` folder
- Exclude: `node_modules`, `dist`, `.env`

---

### ⚠️ Important: Build Process Requirements

**You MUST install ALL dependencies (including devDependencies) for the build to work.**

The build process needs:
- `vite` - Frontend build tool
- `esbuild` - Backend bundler
- `typescript` - TypeScript compiler
- `@vitejs/plugin-react` - React plugin for Vite
- And other devDependencies

**Do NOT use `npm install --production`** - it will skip devDependencies and cause build failures!

---

### Step 2: Connect to Your Server

```bash
ssh user@your-server-ip
cd /home/your-user/crm-ratehonk
```

---

### Step 3: Install Node.js (if not installed)

```bash
# Check if Node.js is installed
node -v

# If not installed (Ubuntu/Debian):
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node -v  # Should show v18.x or higher
npm -v
```

---

### Step 4: Install PM2 Globally

```bash
npm install -g pm2
pm2 --version
```

---

### Step 5: Install Project Dependencies

```bash
cd /home/your-user/crm-ratehonk
npm install
```

**Important:** Install ALL dependencies (including devDependencies) because the build process needs them (`vite`, `esbuild`, `typescript`, etc.). The `--production` flag skips devDependencies which will cause build failures.

---

### Step 6: Create .env File

```bash
nano .env
```

Add your environment variables:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://username:password@host:port/database?ssl=true

# Authentication (REQUIRED - Generate secure random strings)
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
SESSION_SECRET=your-super-secure-session-secret-at-least-32-characters-long

# Server Configuration
NODE_ENV=production
PORT=3000

# Optional: Add other variables as needed
# OPENAI_API_KEY=...
# SMTP_HOST=...
# etc.
```

**Generate secure secrets:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save: `Ctrl+X`, then `Y`, then `Enter`

---

### Step 7: Build the Project

```bash
npm run build
```

This will:
- Build frontend (Vite) → `dist/public/`
- Build backend (esbuild) → `dist/index.js`

**Verify build:**
```bash
ls -la dist/
# Should see: dist/index.js and dist/public/
```

---

### Step 8: Setup Database Schema

```bash
npm run db:push
```

This creates all tables in your PostgreSQL database.

---

### Step 9: Create Logs Directory

```bash
mkdir -p logs
```

---

### Step 10: Start with PM2

```bash
pm2 start ecosystem.config.js --env production
```

**Note:** If you get an error about ES modules, the config file has been updated to use ES module syntax. If you still have issues, you can use the `.cjs` file instead:
```bash
pm2 start ecosystem.config.cjs --env production
```

**Check status:**
```bash
pm2 status
```

You should see `ratehonk-crm` with status `online`.

---

### Step 11: Check Logs

```bash
pm2 logs ratehonk-crm --lines 50
```

Look for:
- ✅ `Server listening on http://localhost:3000`
- ✅ `Configuration validated successfully`
- ❌ Any errors

---

### Step 12: Test Application

```bash
# Test health endpoint
curl http://localhost:3000/health
# Should return: ok
```

---

### Step 13: Save PM2 Configuration

```bash
pm2 save
```

---

### Step 14: Setup Auto-Start on Reboot

```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u youruser --hp /home/youruser

# Copy and run the command it provides
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u youruser --hp /home/youruser

# Save again
pm2 save
```

---

## ✅ Summary: What Happens Where

### On Your Local Machine:
- ✅ You have the source code
- ✅ You upload it to the server

### On Production Server:
- ✅ Install Node.js and PM2
- ✅ Install dependencies (`npm install`)
- ✅ Create `.env` file with your credentials
- ✅ Build the project (`npm run build`)
- ✅ Setup database (`npm run db:push`)
- ✅ Start with PM2 (`pm2 start`)

---

## 🔄 If You Already Uploaded Before

If you already uploaded the project to the server:

1. **Just pull latest changes** (if using Git):
   ```bash
   cd /home/your-user/crm-ratehonk
   git pull origin main
   ```

2. **Or re-upload** the changed files

3. **Then on server:**
   ```bash
   npm install              # Update ALL dependencies (including devDependencies)
   npm run build            # Rebuild
   pm2 restart ratehonk-crm # Restart application
   ```

---

## 🎯 Quick Commands Reference

```bash
# View status
pm2 status

# View logs
pm2 logs ratehonk-crm

# Restart
pm2 restart ratehonk-crm

# Stop
pm2 stop ratehonk-crm

# Monitor
pm2 monit
```

---

## ❓ FAQ

**Q: Do I need to upload the `dist/` folder?**  
A: No! Build it on the server with `npm run build`

**Q: Do I need to upload `node_modules/`?**  
A: No! Install on server with `npm install`

**Q: What if I make changes to the code?**  
A: Upload changed files, then on server: `npm run build` and `pm2 restart ratehonk-crm`

**Q: Can I use Git instead of uploading files?**  
A: Yes! Clone your repository on the server (recommended)

---

**Your project is ready to deploy! 🎉**


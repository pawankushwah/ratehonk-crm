# 🔧 Fix: Build Error - Missing devDependencies

## Problem

You ran `npm install --production` which skips devDependencies, but the build process needs them.

Error:
```
Cannot find package '@vitejs/plugin-react'
```

## ✅ Solution

Install **ALL dependencies** (including devDependencies) because the build process needs them:

```bash
# On your production server
cd ~/htdocs/crm.ratehonk.com/crm-ratehonk

# Install ALL dependencies (including devDependencies)
npm install

# Now build will work
npm run build
```

## Why This Happens

The build process (`npm run build`) needs:
- ✅ `vite` - Frontend build tool
- ✅ `esbuild` - Backend bundler  
- ✅ `typescript` - TypeScript compiler
- ✅ `@vitejs/plugin-react` - React plugin for Vite
- ✅ `tailwindcss` - CSS framework
- ✅ And other devDependencies

These are in `devDependencies` because they're only needed during build, not at runtime.

## Correct Deployment Steps

```bash
# 1. Install ALL dependencies (including devDependencies)
npm install

# 2. Create .env file
nano .env

# 3. Build the project
npm run build

# 4. Setup database
npm run db:push

# 5. Start with PM2
pm2 start ecosystem.config.js --env production
```

## Note About Production

- **For building:** You need ALL dependencies (devDependencies included)
- **For running:** The built `dist/` folder only needs production dependencies
- **Best practice:** Install all dependencies, build, then run. The devDependencies won't affect runtime performance.

## After Build

Once built, the `dist/` folder contains the compiled code and doesn't need the devDependencies at runtime. But it's fine to keep them installed - they won't affect your running application.

---

**Run `npm install` (without --production) and then `npm run build` again!**


# 🔧 Fix: cross-env Not Recognized on Windows

## Problem

On Windows PowerShell, you're getting:
```
'cross-env' is not recognized as an internal or external command
```

## ✅ Solutions

### Solution 1: Install Dependencies (Recommended)

Make sure all dependencies (including devDependencies) are installed:

```powershell
npm install
```

This will install `cross-env` from devDependencies.

### Solution 2: Use PowerShell-Compatible Syntax

Instead of using `cross-env`, you can set environment variables directly in PowerShell:

**For development:**
```powershell
$env:NODE_ENV="development"; npm run dev
```

Or create a PowerShell script. But first, let's fix the package.json scripts to work on Windows.

### Solution 3: Install cross-env Globally

```powershell
npm install -g cross-env
```

### Solution 4: Use npx

```powershell
npx cross-env NODE_ENV=development tsx server/index.ts
```

## Quick Fix: Update package.json Scripts for Windows

I can update the scripts to work better on Windows. Would you like me to do that?

---

**Try Solution 1 first: `npm install` - this should fix it!**


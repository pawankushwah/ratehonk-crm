# 🚀 Deploying RateHonk CRM to Vercel

This guide provides step-by-step instructions to deploy the RateHonk CRM to Vercel using the new serverless architecture.

## 1. Connect Your Repository
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** -> **Project**.
3. Import your GitHub/GitLab/Bitbucket repository.

## 2. Configure Project Settings
- **Framework Preset**: Other (Vercel will detect `vercel.json`).
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public` (Vercel will use this for the static part).

## 3. Set Environment Variables
Add the following variables in the Vercel Project Settings (Settings -> Environment Variables):

### Required for Database
- `DATABASE_URL`: Your PostgreSQL connection string (Neon, Vercel Postgres, etc.).

### Required for Authentication
- `JWT_SECRET`: A long random string (Generate one with `openssl rand -base64 32`).
- `SESSION_SECRET`: A long random string.

### Required for Cron Jobs
- `CRON_SECRET`: A long random string. This must match the `Bearer` token Vercel sends in Cron requests.
  *(Vercel automatically provides `CRON_SECRET` if you use their native Cron feature, but we recommend defining your own if you want to test it easily).*

### Application Settings
- `NODE_ENV`: `production`
- `PORT`: `3000` (Vercel will internally route this).
- `APP_URL`: Your production URL (e.g., `https://your-app.vercel.app`).

## 4. Setup Database Schema
Once the environment variables are set, you may need to push the database schema:
```bash
npm run db:push
```
*(You can run this locally while pointing to your production database).*

## 5. Verify Cron Jobs
Vercel will automatically detect the `crons` section in `vercel.json` and schedule the tasks.
- You can manually trigger them from the **Cron** tab in the Vercel Dashboard for testing.
- The logs will appear in the **Logs** tab.

## 6. What's Changed?
- **Serverless**: The backend now runs as an ephemeral function.
- **No Periodic Intervals**: Schedulers like Email Campaigns and Follow-ups are now triggered via `/api/cron/*` endpoints.
- **Static Files**: Vercel serves the React frontend (Vite build) directly, making the app much faster.

---
**Your CRM is now ready for world-class scale! 🚀**

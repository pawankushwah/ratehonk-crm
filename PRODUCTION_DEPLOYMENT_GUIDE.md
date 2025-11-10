# 🚀 RateHonk CRM - Production Deployment Guide

## ✅ Your Project is Ready for Production

This guide will help you deploy your RateHonk CRM to your production server.

## 📦 What You're Getting

- **Complete Multi-Tenant CRM System** with social media integrations
- **Database-driven social credentials** (no .env dependencies for social features)
- **Production-optimized build** with proper error handling
- **Comprehensive travel agency features** with booking, invoice, and lead management

## 🗂️ Files to Download

Download the entire project folder. Key production files include:

### Essential Production Files:
- `dist/` - Built production files (frontend + backend)
- `package.json` - Dependencies and scripts
- `server/` - Complete backend source code
- `client/` - Complete frontend source code
- `shared/` - Shared schemas and types
- `drizzle.config.ts` - Database configuration

## 🛠️ Server Setup Instructions

### 1. Environment Variables Setup

Set these environment variables on your production server:

```bash
# Database (REQUIRED)
DATABASE_URL=postgresql://username:password@host:port/database?ssl=true

# Authentication (REQUIRED)
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters
SESSION_SECRET=your-super-secure-session-secret-at-least-32-characters

# Optional: OpenAI for AI features
OPENAI_API_KEY=your-openai-api-key

# Optional: Email services (for welcome emails)
SENDGRID_API_KEY=your-sendgrid-api-key
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

# Google Services (for Gmail integration - optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=your-google-redirect-uri
```

### 2. Database Setup

Your project uses PostgreSQL with Neon. Options:

**Option A: Use Neon (Recommended)**
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL`

**Option B: Use your own PostgreSQL**
1. Ensure PostgreSQL 14+ is installed
2. Create database for RateHonk
3. Set `DATABASE_URL` with your database connection

### 3. Installation Steps

```bash
# 1. Upload your project files to server
# 2. Install Node.js 18+ on your server
# 3. Install dependencies
npm install

# 4. Build the project
npm run build

# 5. Push database schema
npm run db:push

# 6. Start production server
npm start
```

### 4. Process Manager (Recommended)

For production stability, use PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start your app with PM2
pm2 start dist/index.js --name "ratehonk-crm"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 🔧 Server Configuration

### Nginx Configuration (if using Nginx):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🏢 Multi-Tenant Setup

### First-Time Setup:

1. **Access your app** at `http://your-domain.com`
2. **Register first user** - this creates your tenant
3. **Configure social media** in Settings > Social Integrations
4. **Set up email** in Settings > Email Configuration
5. **Customize branding** in Settings > Tenant Settings

### Social Media Configuration:

Each tenant can configure their own:
- **Facebook Business Suite** (App ID + App Secret)
- **Instagram Business** (App ID + App Secret)
- **LinkedIn Business** (Client ID + Client Secret)
- **Twitter/X** (Client ID + Client Secret)
- **TikTok Business** (API Key + API Secret)

## 🗄️ Database Schema

The system automatically creates these tables:
- `tenants` - Multi-tenant isolation
- `users` - User authentication
- `customers` - Customer management
- `leads` - Lead management
- `bookings` - Travel bookings
- `invoices` - Invoice management
- `social_integrations` - Social media credentials per tenant
- `calendar_events` - Calendar system
- And many more...

## 🔒 Security Features

✅ **JWT Authentication** with secure tokens
✅ **Password hashing** with bcrypt
✅ **SQL injection protection** with parameterized queries
✅ **Multi-tenant isolation** - tenants can't access each other's data
✅ **Environment variable validation** with helpful error messages
✅ **Social credentials encryption** in database

## 🚨 Troubleshooting

### Common Issues:

**1. Database Connection Failed**
- Check `DATABASE_URL` format
- Ensure database is accessible from your server
- Verify SSL requirements

**2. App Won't Start**
- Check all required environment variables are set
- Ensure Node.js 18+ is installed
- Run `npm run db:push` to create database tables

**3. Social Media Integration Issues**
- Each tenant needs their own app credentials
- Configure in UI: Settings > Social Integrations
- No .env files needed for social features

**4. Email Issues**
- Configure SMTP in Settings > Email Configuration
- Welcome emails require SMTP setup per tenant

## 📊 Performance Optimization

- **Database connections** are pooled automatically
- **Frontend assets** are minified and compressed
- **API responses** are optimized with proper caching headers
- **Social media APIs** use efficient credential management

## 🎯 Post-Deployment Checklist

- [ ] App loads at your domain
- [ ] User registration works
- [ ] Database tables created (`npm run db:push`)
- [ ] First tenant created successfully
- [ ] Social integrations page accessible
- [ ] Email configuration page accessible
- [ ] Customer management works
- [ ] Lead management works
- [ ] Invoice system works
- [ ] Calendar system works

## 💡 Success Indicators

Your deployment is successful when:
1. **Users can register** and create tenants
2. **Social integrations** can be configured per tenant
3. **CRM features** work (customers, leads, bookings, invoices)
4. **Calendar system** displays events
5. **Email system** can be configured
6. **Multi-tenant isolation** works properly

## 📞 Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure database connection is working
4. Check that all Node.js dependencies are installed

Your RateHonk CRM is production-ready with enterprise-level features, multi-tenant support, and comprehensive social media integrations!
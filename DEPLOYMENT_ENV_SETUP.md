# Environment Configuration for Server Deployment

## Required Environment Variables

For successful server deployment, you need to configure the following environment variables:

### 🔧 Core Application Settings
```
NODE_ENV=production
PORT=5000
JWT_SECRET=RateHonkCRM2025_SecureJWT_ProductionKey_ChangeInProduction
SESSION_SECRET=RateHonkCRM2025_SessionSecret_ProductionKey_ChangeInProduction
FRONTEND_URL=https://your-domain.com
TRUST_PROXY=true
```

### 🗄️ Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database_name
```
*Note: Your current Supabase connection is already configured*

### 📧 Email Configuration (Primary SMTP)
```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=support@ajresort.com
SMTP_PASS=SupportAJ@2025
SMTP_FROM_EMAIL=support@ajresort.com
SMTP_FROM_NAME=RateHonk CRM Support
```

### 📧 Email Configuration (SendGrid Fallback)
```
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### 🌐 Social Media Integration
```
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

### 🔐 Google OAuth (for Gmail integration)
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
```

### 🤖 AI Services (Optional)
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 📁 File Upload Configuration
```
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

## Deployment Steps

1. **Set Environment Variables**: Configure all required variables in your hosting platform
2. **Database Setup**: Ensure your Supabase database is accessible from production
3. **Email Testing**: Test SMTP configuration with a test email
4. **Social Media Setup**: Configure OAuth apps for each social platform
5. **SSL Certificate**: Ensure HTTPS is enabled for OAuth callbacks
6. **File Permissions**: Set proper permissions for upload directory

## Security Notes

- Change all default secrets before production deployment
- Use strong, unique passwords for all services
- Enable 2FA on all external service accounts
- Regularly rotate API keys and secrets
- Monitor logs for suspicious activity

## Production Checklist

- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] Email sending functional
- [ ] Social media OAuth working
- [ ] SSL certificate installed
- [ ] File uploads working
- [ ] Error logging enabled
- [ ] Backup strategy implemented
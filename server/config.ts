// Production-ready configuration that works with and without .env files
// Load .env file if it exists
import dotenv from "dotenv";
dotenv.config();

// Reads from environment variables directly with fallbacks

export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/ratehonk_crm'
  },

  // Server
  server: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    trustProxy: process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production'
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production',
    sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret-change-in-production'
  },

  // Email Configuration - Primary SMTP
  email: {
    smtp: {
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || '587'),
      // Port 587 uses STARTTLS (secure: false), port 465 uses TLS/SSL (secure: true)
      secure: (() => {
        const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || '587');
        if (process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === 'ssl') {
          return true;
        } else if (process.env.SMTP_SECURE === 'false' || process.env.SMTP_SECURE === 'tls' || port === 587) {
          return false; // Port 587 uses STARTTLS
        } else if (port === 465) {
          return true; // Port 465 uses direct TLS/SSL
        }
        return false; // Default to STARTTLS
      })(),
      user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@ratehonk.com',
      fromName: process.env.SMTP_FROM_NAME || 'RateHonk CRM Support'
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || ''
    }
  },

  // Social Media
  social: {
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || ''
    },
    instagram: {
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || ''
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || ''
    },
    twitter: {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || ''
    },
    tiktok: {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || ''
    }
  },

  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
  },

  // AI Services
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || ''
  },

  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5000'
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  }
};

// Validation function to check required environment variables
export function validateConfig() {
  const errors: string[] = [];

  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }

  // Only validate secrets in true production environment (not when running locally with production settings)
  const isActualProduction = process.env.NODE_ENV === 'production' && !process.env.LOCAL_DEV;
  
  if (isActualProduction) {
    if (config.auth.jwtSecret === 'fallback-jwt-secret-change-in-production') {
      errors.push('JWT_SECRET must be set in production');
    }
    if (config.auth.sessionSecret === 'fallback-session-secret-change-in-production') {
      errors.push('SESSION_SECRET must be set in production');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    
    if (isActualProduction && !process.env.VERCEL) {
      console.error('\n🔧 To fix these errors in production:');
      console.error('  1. Set environment variables in your hosting platform');
      console.error('  2. Or use platform-specific configuration methods');
      console.error('  3. Refer to DEPLOYMENT_ENV_SETUP.md for complete list');
      process.exit(1);
    } else {
      console.warn('⚠️  Configuration validation failed. In serverless/Vercel environments, we continue to allow log visibility.');
    }
  } else {
    console.log('✅ Configuration validated successfully');
  }

  return config;
}

export default config;
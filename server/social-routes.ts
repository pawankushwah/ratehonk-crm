import type { Express } from "express";
import { SocialServiceFactory } from "./social-service-factory.js";

/**
 * Social media integration routes that use tenant-specific credentials from database
 * This replaces the old system that used .env files
 */
export function registerSocialRoutes(app: Express) {
  
  // Universal social media configuration endpoint
  app.post('/api/tenants/:tenantId/:platform/configure', async (req, res) => {
    try {
      const { tenantId, platform } = req.params;
      const credentials = req.body;
      
      console.log(`🔧 Configuring ${platform} credentials for tenant:`, tenantId);
      
      // Validate required fields based on platform
      const requiredFields = getPlatformRequiredFields(platform);
      const missingFields = requiredFields.filter(field => !credentials[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }
      
      // Save credentials to database using factory
      await SocialServiceFactory.saveSocialIntegration(parseInt(tenantId), platform, credentials);
      
      console.log(`✅ ${platform} credentials saved successfully`);
      
      res.json({
        success: true,
        message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} credentials configured successfully`
      });
    } catch (error: any) {
      console.error(`${req.params.platform} configuration error:`, error);
      res.status(500).json({ 
        success: false, 
        message: error.message || `Failed to configure ${req.params.platform} credentials` 
      });
    }
  });

  // Universal social media status endpoint
  app.get('/api/tenants/:tenantId/:platform/status', async (req, res) => {
    try {
      const { tenantId, platform } = req.params;
      
      // Get integration status from database
      const integration = await SocialServiceFactory.getSocialIntegration(parseInt(tenantId), platform);
      
      const isConfigured = integration && hasRequiredCredentials(platform, integration);
      const isConnected = integration?.accessToken ? true : false;
      
      res.json({
        success: true,
        configured: isConfigured,
        connected: isConnected,
        lastSync: integration?.lastSync,
        totalLeadsImported: integration?.totalLeadsImported || 0,
        settings: integration?.settings || {}
      });
    } catch (error: any) {
      console.error(`${req.params.platform} status error:`, error);
      res.status(500).json({ 
        success: false, 
        message: error.message || `Failed to get ${req.params.platform} status` 
      });
    }
  });

  // Universal OAuth initialization endpoint
  app.get('/api/auth/:platform/:tenantId', async (req, res) => {
    try {
      const { platform, tenantId } = req.params;
      
      // Prevent matching callback routes
      if (tenantId === 'callback') {
        return res.status(404).json({ success: false, message: 'Not found' });
      }
      
      console.log(`🔧 Starting ${platform} OAuth for tenant:`, tenantId);
      
      // Get service instance with tenant-specific credentials
      const service = await getSocialService(platform, parseInt(tenantId));
      
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/${platform}/callback`;
      const authUrl = service.getAuthUrl(parseInt(tenantId), redirectUri);
      
      res.json({
        success: true,
        authUrl
      });
    } catch (error: any) {
      const platform = req.params.platform || 'unknown';
      console.error(`${platform} OAuth initialization error:`, error);
      res.status(500).json({ 
        success: false, 
        message: error.message || `Failed to initialize ${platform} OAuth` 
      });
    }
  });

  // Universal OAuth callback endpoint
  app.get('/api/auth/:platform/:tenantId/callback', async (req, res) => {
    try {
      const { platform, tenantId } = req.params;
      const { code, error } = req.query;
      
      console.log(`🔧 ${platform} OAuth callback for tenant:`, tenantId);
      
      if (error) {
        console.error(`${platform} OAuth error:`, error);
        return res.redirect(`/?error=${platform}_oauth_error`);
      }
      
      if (!code) {
        console.error(`${platform} OAuth error: No authorization code received`);
        return res.redirect(`/?error=${platform}_oauth_no_code`);
      }
      
      // Get service instance and exchange code for token
      const service = await getSocialService(platform, parseInt(tenantId));
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/${platform}/${tenantId}/callback`;
      
      const tokenData = await service.exchangeCodeForToken(code as string, redirectUri);
      
      // Save access token to database
      await SocialServiceFactory.saveSocialIntegration(parseInt(tenantId), platform, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null
      });
      
      console.log(`✅ ${platform} OAuth successful for tenant:`, tenantId);
      
      // Redirect to success page
      res.redirect(`/?connected=${platform}`);
    } catch (error: any) {
      console.error(`${platform} OAuth callback error:`, error);
      res.redirect(`/?error=${req.params.platform}_oauth_callback_error`);
    }
  });
}

/**
 * Get required fields for each platform
 */
function getPlatformRequiredFields(platform: string): string[] {
  switch (platform.toLowerCase()) {
    case 'facebook':
    case 'instagram':
      return ['appId', 'appSecret'];
    case 'linkedin':
    case 'twitter':
      return ['clientId', 'clientSecret'];
    case 'tiktok':
      return ['apiKey', 'apiSecret'];
    default:
      return [];
  }
}

/**
 * Check if integration has required credentials
 */
function hasRequiredCredentials(platform: string, integration: any): boolean {
  const required = getPlatformRequiredFields(platform);
  return required.every(field => {
    // Map common field names
    const value = integration[field] || integration[mapFieldName(field)];
    return !!value;
  });
}

/**
 * Map field names between different naming conventions
 */
function mapFieldName(field: string): string {
  const fieldMap: Record<string, string> = {
    'appId': 'app_id',
    'appSecret': 'app_secret',
    'clientId': 'client_id',
    'clientSecret': 'client_secret',
    'apiKey': 'api_key',
    'apiSecret': 'api_secret'
  };
  return fieldMap[field] || field;
}

/**
 * Get appropriate service instance for platform
 */
async function getSocialService(platform: string, tenantId: number) {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return await SocialServiceFactory.getFacebookService(tenantId);
    case 'instagram':
      return await SocialServiceFactory.getInstagramService(tenantId);
    case 'linkedin':
      return await SocialServiceFactory.getLinkedInService(tenantId);
    case 'twitter':
      return await SocialServiceFactory.getTwitterService(tenantId);
    case 'tiktok':
      return await SocialServiceFactory.getTikTokService(tenantId);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
/**
 * Facebook Lead Ads OAuth Flow Handler
 * Handles OAuth 2.0 authentication flow for Facebook Lead Ads integration
 */

import { Express } from "express";
import { sql } from "../db.js";
import crypto from "crypto";

// Facebook OAuth Scopes
// Since the app is already working in another project, these permissions are likely already approved
const FACEBOOK_SCOPES = [
  // Basic permissions:
  // "email",                    // Optional: Basic user email (not required for Lead Ads, email comes from form data)
  "pages_show_list",         // List user's pages
  "pages_read_engagement",   // Read page engagement metrics
  
  // Advanced permissions (should be approved if app works in another project):
  "leads_retrieval",         // Retrieve lead data from Facebook Lead Ads (CRITICAL)
  "pages_manage_metadata",   // Manage page metadata
  "pages_read_user_content", // Read user content on pages
  "pages_manage_ads",        // Manage ads and lead forms
].filter(Boolean);

/**
 * Generate OAuth state token and store it in database
 */
async function generateOAuthState(
  tenantId: number,
  redirectUri: string
): Promise<string> {
  const state = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await sql`
    INSERT INTO integration_oauth_states (tenant_id, integration_name, state, redirect_uri, expires_at)
    VALUES (${tenantId}, 'facebook-lead-ads', ${state}, ${redirectUri}, ${expiresAt.toISOString()})
  `;

  return state;
}

/**
 * Verify and consume OAuth state token
 */
async function verifyOAuthState(
  state: string,
  tenantId: number
): Promise<boolean> {
  const [stateRecord] = await sql`
    SELECT * FROM integration_oauth_states 
    WHERE state = ${state} 
    AND tenant_id = ${tenantId}
    AND integration_name = 'facebook-lead-ads'
    AND expires_at > NOW()
  `;

  if (!stateRecord) {
    return false;
  }

  // Delete used state token
  await sql`
    DELETE FROM integration_oauth_states WHERE state = ${state}
  `;

  return true;
}

/**
 * Register Facebook Lead Ads OAuth routes
 */
export function registerFacebookLeadAdsOAuthRoutes(app: Express) {
  console.log("✅ Registering Facebook Lead Ads OAuth routes...");
  
  // OAuth Authorization endpoint
  app.get(
    "/api/integrations/facebook-lead-ads/oauth/authorize",
    async (req, res) => {
      console.log("🔵 Facebook Lead Ads OAuth authorize endpoint hit!");
      try {
        const tenantId = parseInt(req.query.tenantId as string);
        if (!tenantId) {
          return res.status(400).json({ error: "tenantId is required" });
        }

        // Get Facebook app credentials
        const [integrationRow] = await sql`
          SELECT app_id, app_secret FROM social_integrations 
          WHERE tenant_id = ${tenantId} AND platform = 'facebook' AND is_active = true
        `;

        if (!integrationRow?.app_id || !integrationRow?.app_secret) {
          // Check .env as fallback
          const envAppId = process.env.FACEBOOK_APP_ID || process.env.FB_APP_ID;
          const envAppSecret =
            process.env.FACEBOOK_APP_SECRET || process.env.FB_APP_SECRET;

          if (!envAppId || !envAppSecret) {
            return res.status(400).json({
              error:
                "Facebook credentials not configured. Please configure App ID and App Secret.",
            });
          }

          // Auto-create integration from .env
          const [existing] = await sql`
            SELECT id FROM social_integrations 
            WHERE tenant_id = ${tenantId} AND platform = 'facebook'
          `;

          if (existing) {
            await sql`
              UPDATE social_integrations 
              SET app_id = ${envAppId}, app_secret = ${envAppSecret}
              WHERE tenant_id = ${tenantId} AND platform = 'facebook'
            `;
          } else {
            await sql`
              INSERT INTO social_integrations (tenant_id, platform, app_id, app_secret, is_active)
              VALUES (${tenantId}, 'facebook', ${envAppId}, ${envAppSecret}, true)
            `;
          }
        }

        // Use BASE_URL from env if available, otherwise construct from request
        const BASE_URL = process.env.BASE_URL || process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
        const redirectUri = `${BASE_URL}/fb/callback`;
        const state = await generateOAuthState(tenantId, redirectUri);

        // Get app credentials (from DB or .env)
        const appId =
          integrationRow?.app_id ||
          process.env.FACEBOOK_APP_ID ||
          process.env.FB_APP_ID;
        const appSecret =
          integrationRow?.app_secret ||
          process.env.FACEBOOK_APP_SECRET ||
          process.env.FB_APP_SECRET;

        // Build authorization URL using URL object for better compatibility
        const authUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
      authUrl.searchParams.set("client_id", appId!);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", FACEBOOK_SCOPES.join(","));
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("response_type", "code");

        res.json({ authUrl });
      } catch (error: any) {
        console.error("Facebook Lead Ads OAuth authorize error:", error);
        res.status(500).json({
          error: error.message || "Failed to generate OAuth URL",
        });
      }
    }
  );

  // OAuth Callback endpoint
  app.get("/fb/callback", async (req, res) => {
    try {
      const { code, state, error } = req.query;

      // Handle OAuth errors
      if (error) {
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Facebook OAuth Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1 class="error">Facebook OAuth Error</h1>
            <p>${error}</p>
            <script>
              window.opener.postMessage({ type: 'FACEBOOK_OAUTH_ERROR', error: '${error}' }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
          </html>
        `;
        return res.send(errorHtml);
      }

      if (!code || !state) {
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Facebook OAuth Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1 class="error">Missing Authorization Code</h1>
            <p>No authorization code received from Facebook.</p>
            <script>
              window.opener.postMessage({ type: 'FACEBOOK_OAUTH_ERROR', error: 'No authorization code' }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
          </html>
        `;
        return res.send(errorHtml);
      }

      // Extract tenantId from state (we'll need to verify state first)
      // For now, we'll get tenantId from the state record
      const [stateRecord] = await sql`
        SELECT tenant_id, redirect_uri FROM integration_oauth_states 
        WHERE state = ${state as string}
        AND expires_at > NOW()
      `;

      if (!stateRecord) {
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Facebook OAuth Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1 class="error">Invalid or Expired State</h1>
            <p>The OAuth state token is invalid or has expired.</p>
            <script>
              window.opener.postMessage({ type: 'FACEBOOK_OAUTH_ERROR', error: 'Invalid state' }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
          </html>
        `;
        return res.send(errorHtml);
      }

      const tenantId = stateRecord.tenant_id;
      const redirectUri = stateRecord.redirect_uri;

      // Verify state
      const isValid = await verifyOAuthState(state as string, tenantId);
      if (!isValid) {
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Facebook OAuth Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1 class="error">State Verification Failed</h1>
            <script>
              window.opener.postMessage({ type: 'FACEBOOK_OAUTH_ERROR', error: 'State verification failed' }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
          </html>
        `;
        return res.send(errorHtml);
      }

      // Get Facebook app credentials
      const [integrationRow] = await sql`
        SELECT app_id, app_secret FROM social_integrations 
        WHERE tenant_id = ${tenantId} AND platform = 'facebook' AND is_active = true
      `;

      const appId =
        integrationRow?.app_id ||
        process.env.FACEBOOK_APP_ID ||
        process.env.FB_APP_ID;
      const appSecret =
        integrationRow?.app_secret ||
        process.env.FACEBOOK_APP_SECRET ||
        process.env.FB_APP_SECRET;

      if (!appId || !appSecret) {
        throw new Error("Facebook credentials not configured");
      }

      // Exchange code for access token using Graph API directly
      const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
      tokenUrl.searchParams.set("client_id", appId);
      tokenUrl.searchParams.set("client_secret", appSecret);
      tokenUrl.searchParams.set("redirect_uri", redirectUri);
      tokenUrl.searchParams.set("code", code as string);

      const tokenResponse = await fetch(tokenUrl.toString(), {
        method: "GET",
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to exchange code for token");
      }

      const tokens = await tokenResponse.json();

      // Exchange for long-lived token (60 days)
      const longLivedTokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
      longLivedTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
      longLivedTokenUrl.searchParams.set("client_id", appId);
      longLivedTokenUrl.searchParams.set("client_secret", appSecret);
      longLivedTokenUrl.searchParams.set("fb_exchange_token", tokens.access_token);

      const longLivedResponse = await fetch(longLivedTokenUrl.toString(), {
        method: "GET",
      });

      let accessToken = tokens.access_token;
      let expiresIn = tokens.expires_in || 3600; // Default to 1 hour if not provided

      if (longLivedResponse.ok) {
        const longLivedTokens = await longLivedResponse.json();
        accessToken = longLivedTokens.access_token;
        expiresIn = longLivedTokens.expires_in || 5184000; // 60 days in seconds
      }

      const longLivedToken = {
        access_token: accessToken,
        expires_in: expiresIn,
      };

      // Get user info
      const userInfoResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${longLivedToken.access_token}`
      );
      
      let userInfo: any = {};
      if (userInfoResponse.ok) {
        userInfo = await userInfoResponse.json();
      }

      // Store integration with credentials
      // Check if integration exists for facebook-lead-ads
      const [existingIntegration] = await sql`
        SELECT id FROM social_integrations 
        WHERE tenant_id = ${tenantId} AND platform = 'facebook-lead-ads'
      `;

      const credentials = {
        access_token: longLivedToken.access_token,
        expires_at: longLivedToken.expires_in
          ? Date.now() + longLivedToken.expires_in * 1000
          : null,
        token_type: "Bearer",
      };

      const config = {
        userId: userInfo.id,
        name: userInfo.name,
        email: userInfo.email || null,
      };

      if (existingIntegration) {
        // Update existing integration
        const tokenExpiresAt = longLivedToken.expires_in 
          ? new Date(Date.now() + longLivedToken.expires_in * 1000).toISOString()
          : null;
        await sql`
          UPDATE social_integrations 
          SET 
            access_token = ${longLivedToken.access_token},
            token_expires_at = ${tokenExpiresAt},
            settings = ${JSON.stringify(config)}::jsonb,
            updated_at = NOW()
          WHERE tenant_id = ${tenantId} AND platform = 'facebook-lead-ads'
        `;
      } else {
        // Create new integration
        const tokenExpiresAt = longLivedToken.expires_in 
          ? new Date(Date.now() + longLivedToken.expires_in * 1000).toISOString()
          : null;
        await sql`
          INSERT INTO social_integrations (tenant_id, platform, app_id, app_secret, access_token, token_expires_at, settings, is_active)
          VALUES (
            ${tenantId}, 
            'facebook-lead-ads',
            ${appId},
            ${appSecret},
            ${longLivedToken.access_token},
            ${tokenExpiresAt},
            ${JSON.stringify(config)}::jsonb,
            true
          )
        `;
      }

      // Success HTML that communicates with parent window
      const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Facebook OAuth Success</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #2e7d32; }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <h1 class="success">✓ Facebook Connected Successfully!</h1>
          <p>You can close this window now.</p>
          <div class="spinner"></div>
          <script>
            window.opener.postMessage({ 
              type: 'FACEBOOK_OAUTH_SUCCESS', 
              integration: 'facebook-lead-ads',
              tenantId: ${tenantId}
            }, '*');
            setTimeout(() => window.close(), 1500);
          </script>
        </body>
        </html>
      `;

      res.send(successHtml);
    } catch (error: any) {
      console.error("Facebook Lead Ads OAuth callback error:", error);
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Facebook OAuth Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <h1 class="error">Connection Failed</h1>
          <p>${error.message || "An error occurred during Facebook connection."}</p>
          <script>
            window.opener.postMessage({ 
              type: 'FACEBOOK_OAUTH_ERROR', 
              error: '${error.message || "Unknown error"}'
            }, '*');
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `;
      res.send(errorHtml);
    }
  });
}


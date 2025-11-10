// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { simpleStorage } from './simple-storage.js';
import type { GmailIntegration, GmailEmail } from '../shared/schema.js';

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
      parts?: Array<{ mimeType: string; body?: { data?: string } }>;
    }>;
  };
  internalDate: string;
}

export class GmailService {
  private oAuth2Client: OAuth2Client;

  constructor() {
    this.oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/gmail/callback'
    );
  }

  /**
   * Get OAuth2 authorization URL for tenant Gmail integration
   */
  getAuthUrl(tenantId: number): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    console.log('🔧 Generating OAuth URL with scopes:', scopes);

    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: tenantId.toString(), // Pass tenant ID in state parameter
      prompt: 'consent', // Force consent to ensure refresh token
      include_granted_scopes: true
    });

    console.log('🔗 Generated OAuth URL for tenant:', tenantId);
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens and save to database
   */
  async handleCallback(code: string, tenantId: number): Promise<boolean> {
    try {
      console.log('🔄 Starting Gmail OAuth token exchange for tenant:', tenantId);
      console.log('🔧 Using OAuth2 client with redirect URI:', process.env.GOOGLE_REDIRECT_URI);
      console.log('🔑 Exchanging authorization code for tokens...');
      
      const { tokens } = await this.oAuth2Client.getToken(code);
      console.log('🔑 Tokens received from Google OAuth:', {
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        expires_in: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'no expiry',
        token_type: tokens.token_type,
        scope: tokens.scope
      });
      
      if (!tokens.access_token) {
        console.error('❌ No access token in response:', tokens);
        throw new Error('No access token received');
      }

      // Set credentials to get user info
      this.oAuth2Client.setCredentials(tokens);
      console.log('🔐 OAuth2 client credentials set');
      
      // Get user's email address with timeout
      const oauth2 = google.oauth2('v2');
      oauth2.auth = this.oAuth2Client;
      console.log('📧 Fetching user info from Google API...');
      
      const userInfo = await oauth2.userinfo.get();
      const gmailAddress = userInfo.data.email;
      console.log('📧 Gmail address received:', gmailAddress);

      if (!gmailAddress) {
        throw new Error('Unable to get Gmail address');
      }

      // Save integration to database with error handling
      console.log('💾 Saving Gmail integration to database...');
      console.log('📧 Gmail address to save:', gmailAddress);
      const integrationData = {
        tenantId,
        gmailAddress,
        accessToken: this.encryptToken(tokens.access_token),
        refreshToken: tokens.refresh_token ? this.encryptToken(tokens.refresh_token) : null,
        tokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isConnected: true,
        syncEnabled: true
      };

      console.log('💾 Integration data to save:', {
        ...integrationData,
        accessToken: 'ENCRYPTED',
        refreshToken: integrationData.refreshToken ? 'ENCRYPTED' : null
      });

      try {
        await simpleStorage.createOrUpdateGmailIntegration(integrationData);
        console.log('✅ Gmail integration saved successfully for tenant:', tenantId);
        
        // Verify it was saved
        const savedIntegration = await simpleStorage.getGmailIntegration(tenantId);
        console.log('🔍 Verification - Saved integration:', savedIntegration ? {
          id: savedIntegration.id,
          tenantId: savedIntegration.tenantId,
          gmailAddress: savedIntegration.gmailAddress,
          isConnected: savedIntegration.isConnected
        } : 'NOT FOUND');
      } catch (saveError) {
        console.error('❌ Failed to save Gmail integration:', saveError);
        throw saveError;
      }
      
      // Skip initial sync during callback to prevent crashes
      console.log('⏭️ Skipping initial sync during callback to prevent crashes');
      console.log('📧 Gmail integration complete - user can manually sync later');
      
      return true;
    } catch (error) {
      console.error('💥 Gmail callback error:', error);
      console.error('💥 Error details:', error instanceof Error ? error.stack : error);
      return false;
    }
  }

  /**
   * Sync emails for a tenant from Gmail
   */
  async syncEmails(tenantId: number, maxResults: number = 200): Promise<void> {
    try {
      const integration = await simpleStorage.getGmailIntegration(tenantId);
      
      if (!integration || !integration.isConnected) {
        throw new Error('Gmail integration not found or not connected');
      }

      // Check token expiry and refresh if needed
      await this.ensureValidToken(integration);
      
      // Get fresh integration data after potential token refresh
      const freshIntegration = await simpleStorage.getGmailIntegration(tenantId);
      if (!freshIntegration) {
        throw new Error('Gmail integration not found after refresh');
      }

      // Set up OAuth2 client with stored tokens
      this.oAuth2Client.setCredentials({
        access_token: this.decryptToken(freshIntegration.accessToken!),
        refresh_token: freshIntegration.refreshToken ? this.decryptToken(freshIntegration.refreshToken) : undefined,
        expiry_date: freshIntegration.tokenExpiryDate?.getTime()
      });

      const gmail = google.gmail('v1');
      gmail.auth = this.oAuth2Client;

      console.log(`📧 Starting enhanced Gmail sync for tenant ${tenantId} - filtering for important emails only`);

      // Enhanced query to filter important emails and exclude promotional/social/updates
      const queries = [
        // Priority 1: Important emails in inbox (highest priority)
        'in:inbox is:important -category:promotions -category:social -category:updates',
        // Priority 2: Starred emails (often important)
        'in:inbox is:starred -category:promotions -category:social -category:updates', 
        // Priority 3: From known business domains and people
        'in:inbox (from:noreply OR from:support OR from:admin OR from:no-reply OR from:contact) -category:promotions -category:social -category:updates',
        // Priority 4: Unread emails that aren't promotional
        'in:inbox is:unread -category:promotions -category:social -category:updates'
      ];

      let totalSynced = 0;
      const maxPerQuery = Math.floor(maxResults / queries.length);

      for (const [index, query] of queries.entries()) {
        console.log(`📧 Query ${index + 1}/${queries.length}: ${query}`);
        
        try {
          const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: maxPerQuery,
            q: query
          });

          const messages = response.data.messages || [];
          console.log(`📧 Found ${messages.length} emails for query ${index + 1}`);

          // Fetch details for each message
          for (const message of messages) {
            if (!message.id) continue;

            try {
              const messageDetail = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'full'
              });

              const gmailMessage = messageDetail.data as GmailMessage;
              const emailData = this.parseGmailMessage(gmailMessage, tenantId);

              // Enhanced importance detection
              emailData.isImportant = this.detectEmailImportance(gmailMessage);

              // Check if email already exists
              const existingEmail = await simpleStorage.getGmailEmailByMessageId(tenantId, gmailMessage.id);
              
              if (!existingEmail) {
                await simpleStorage.createGmailEmail(emailData);
                totalSynced++;
                console.log(`📧 Synced: ${emailData.subject} (Important: ${emailData.isImportant})`);
              }
            } catch (messageError) {
              console.error(`Error processing message ${message.id}:`, messageError);
            }
          }
        } catch (queryError) {
          console.error(`Error with query ${index + 1}:`, queryError);
        }
      }

      console.log(`📧 Gmail sync complete: ${totalSynced} new important emails synced`);

      // Update last sync time
      await simpleStorage.updateGmailIntegration(integration.id, {
        lastSyncAt: new Date()
      });

    } catch (error) {
      console.error('Gmail sync error:', error);
      throw error;
    }
  }

  // Enhanced email importance detection
  private detectEmailImportance(gmailMessage: GmailMessage): boolean {
    const headers = gmailMessage.payload?.headers || [];
    const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
    const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
    
    // Check Gmail importance markers
    if (gmailMessage.labelIds?.includes('IMPORTANT')) {
      return true;
    }
    
    // Check for business/professional keywords in subject
    const importantKeywords = [
      'invoice', 'payment', 'urgent', 'important', 'action required',
      'booking', 'reservation', 'confirmation', 'contract', 'agreement',
      'deadline', 'reminder', 'follow up', 'meeting', 'appointment',
      'travel', 'itinerary', 'ticket', 'visa', 'passport', 'order',
      'receipt', 'statement', 'account', 'security', 'verification'
    ];
    
    const subjectLower = subject.toLowerCase();
    const hasImportantKeyword = importantKeywords.some(keyword => 
      subjectLower.includes(keyword)
    );
    
    // Check for business domains (not promotional)
    const businessDomains = [
      '@support.', '@noreply.', '@no-reply.', '@admin.',
      '@booking.', '@reservations.', '@contact.', '@customer.',
      '@billing.', '@accounts.', '@security.', '@verify.'
    ];
    
    const isFromBusiness = businessDomains.some(domain => 
      from.toLowerCase().includes(domain)
    );
    
    // Exclude promotional indicators
    const promotionalKeywords = [
      'unsubscribe', 'newsletter', 'marketing', 'promotion', 'sale',
      'discount', 'offer', 'deal', 'limited time', 'free', 'coupon',
      'savings', 'special offer', '% off'
    ];
    
    const isPromotional = promotionalKeywords.some(keyword => 
      subjectLower.includes(keyword) || from.toLowerCase().includes(keyword)
    );
    
    return (hasImportantKeyword || isFromBusiness) && !isPromotional;
  }

  // REMOVED: Duplicate getEmails and disconnectIntegration functions - using versions below instead

  /**
   * Check connection status for a tenant
   */
  async getConnectionStatus(tenantId: number): Promise<GmailIntegration | null> {
    return await simpleStorage.getGmailIntegration(tenantId);
  }

  /**
   * Parse Gmail message into our email format
   */
  private parseGmailMessage(gmailMessage: GmailMessage, tenantId: number): any {
    const headers = gmailMessage.payload.headers || [];
    
    const getHeaderValue = (name: string): string => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    const fromHeader = getHeaderValue('From');
    const toHeader = getHeaderValue('To');
    
    // Parse from and to headers to extract email and name
    const parseEmailHeader = (header: string) => {
      const match = header.match(/^(.+?)\s*<(.+?)>$/) || header.match(/^(.+)$/);
      if (match) {
        if (match[2]) {
          return { name: match[1].trim().replace(/"/g, ''), email: match[2].trim() };
        } else {
          return { name: '', email: match[1].trim() };
        }
      }
      return { name: '', email: header };
    };

    const fromData = parseEmailHeader(fromHeader);
    const toData = parseEmailHeader(toHeader);

    // Extract email body
    let bodyText = '';
    let bodyHtml = '';
    
    if (gmailMessage.payload.body?.data) {
      bodyText = Buffer.from(gmailMessage.payload.body.data, 'base64').toString();
    } else if (gmailMessage.payload.parts) {
      for (const part of gmailMessage.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          bodyText = Buffer.from(part.body.data, 'base64').toString();
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          bodyHtml = Buffer.from(part.body.data, 'base64').toString();
        } else if (part.parts) {
          for (const subPart of part.parts) {
            if (subPart.mimeType === 'text/plain' && subPart.body?.data) {
              bodyText = Buffer.from(subPart.body.data, 'base64').toString();
            } else if (subPart.mimeType === 'text/html' && subPart.body?.data) {
              bodyHtml = Buffer.from(subPart.body.data, 'base64').toString();
            }
          }
        }
      }
    }

    return {
      tenantId,
      gmailMessageId: gmailMessage.id,
      threadId: gmailMessage.threadId,
      fromEmail: fromData.email,
      fromName: fromData.name,
      toEmail: toData.email,
      toName: toData.name,
      subject: getHeaderValue('Subject'),
      bodyText,
      bodyHtml,
      isRead: !gmailMessage.labelIds.includes('UNREAD'),
      isImportant: gmailMessage.labelIds.includes('IMPORTANT'),
      hasAttachments: gmailMessage.payload.parts?.some(part => 
        part.body && Object.keys(part.body).length > 1
      ) || false,
      labels: gmailMessage.labelIds,
      receivedAt: new Date(parseInt(gmailMessage.internalDate))
    };
  }

  /**
   * Simple token encryption (in production, use proper encryption)
   */
  private encryptToken(token: string): string {
    // In production, use proper encryption with a secret key
    return Buffer.from(token).toString('base64');
  }

  /**
   * Simple token decryption (in production, use proper decryption)
   */
  private decryptToken(encryptedToken: string): string {
    // In production, use proper decryption with a secret key
    return Buffer.from(encryptedToken, 'base64').toString();
  }

  /**
   * Get Gmail emails from local database
   */
  async getEmails(tenantId: number, limit: number = 50, offset: number = 0): Promise<GmailEmail[]> {
    try {
      return await simpleStorage.getGmailEmailsByTenant(tenantId, limit, offset);
    } catch (error) {
      console.error(`❌ Failed to get Gmail emails for tenant ${tenantId}:`, error);
      return [];
    }
  }

  /**
   * Disconnect Gmail integration
   */
  async disconnectIntegration(tenantId: number): Promise<void> {
    try {
      const integration = await simpleStorage.getGmailIntegration(tenantId);
      
      if (integration) {
        // Update integration status
        await simpleStorage.updateGmailIntegration(integration.id, {
          isConnected: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiryDate: null
        });

        // Optionally delete stored emails
        await simpleStorage.deleteGmailEmailsByTenant(tenantId);
        
        console.log(`✅ Gmail integration disconnected for tenant ${tenantId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to disconnect Gmail integration for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Send reply to Gmail email
   */
  async sendReply(tenantId: number, replyData: {
    originalEmailId: string;
    to: string;
    subject: string;
    text: string;
  }): Promise<boolean> {
    try {
      const integration = await simpleStorage.getGmailIntegration(tenantId);
      
      if (!integration || !integration.isConnected) {
        throw new Error('Gmail integration not found or not connected');
      }

      // Check token expiry and refresh if needed
      await this.ensureValidToken(integration);
      
      // Get fresh integration data after potential token refresh
      const freshIntegration = await simpleStorage.getGmailIntegration(tenantId);
      if (!freshIntegration) {
        throw new Error('Gmail integration not found after refresh');
      }

      // Set up OAuth2 client with stored tokens
      this.oAuth2Client.setCredentials({
        access_token: this.decryptToken(freshIntegration.accessToken!),
        refresh_token: freshIntegration.refreshToken ? this.decryptToken(freshIntegration.refreshToken) : undefined,
        expiry_date: freshIntegration.tokenExpiryDate?.getTime()
      });

      const gmail = google.gmail('v1');
      gmail.auth = this.oAuth2Client;

      // Create raw email message
      const rawMessage = [
        `To: ${replyData.to}`,
        `Subject: ${replyData.subject}`,
        `In-Reply-To: ${replyData.originalEmailId}`,
        `References: ${replyData.originalEmailId}`,
        '',
        replyData.text
      ].join('\n');

      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send the reply
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      console.log(`✅ Gmail reply sent successfully from tenant ${tenantId} to ${replyData.to}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send Gmail reply from tenant ${tenantId}:`, error);
      return false;
    }
  }

  /**
   * Refresh access token if expired
   */
  /**
   * Ensure the access token is valid, refresh if needed
   */
  private async ensureValidToken(integration: GmailIntegration): Promise<void> {
    // Check if token is expired or will expire in the next 5 minutes
    const now = new Date();
    const expiry = integration.tokenExpiryDate;
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (!expiry || expiry <= fiveMinutesFromNow) {
      console.log('🔄 Access token expired or expiring soon, refreshing...');
      await this.refreshAccessToken(integration);
    }
  }

  /**
   * Public method to refresh token for a tenant (for use in routes)
   */
  async refreshTokenForTenant(tenantId: number): Promise<void> {
    const integration = await simpleStorage.getGmailIntegration(tenantId);
    if (!integration) {
      throw new Error('Gmail integration not found');
    }
    await this.refreshAccessToken(integration);
  }

  private async refreshAccessToken(integration: GmailIntegration): Promise<string> {
    if (!integration.refreshToken) {
      throw new Error('Gmail access token expired. Please reconnect.');
    }

    try {
      this.oAuth2Client.setCredentials({
        refresh_token: this.decryptToken(integration.refreshToken)
      });

      const { credentials } = await this.oAuth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        console.log('✅ Access token refreshed successfully');
        // Update stored tokens
        await simpleStorage.updateGmailIntegration(integration.id, {
          accessToken: this.encryptToken(credentials.access_token),
          tokenExpiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : null
        });

        return credentials.access_token;
      }

      throw new Error('Failed to refresh access token');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw new Error('Gmail access token expired. Please reconnect.');
    }
  }
}

export const gmailService = new GmailService();
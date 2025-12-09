import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { simpleStorage } from './simple-storage';

interface FacebookUser {
  id: string;
  name: string;
  email: string;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  fan_count?: number;
  tasks: string[];
}

interface FacebookBusinessAccount {
  id: string;
  name: string;
  verification_status: string;
}

interface FacebookLeadForm {
  id: string;
  name: string;
  status: string;
  leadgen_tos_accepted: boolean;
  questions: any[];
}

interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  type: string;
  insights?: {
    data: Array<{
      name: string;
      values: Array<{ value: number }>;
    }>;
  };
}

export class FacebookService {
  private readonly baseUrl = 'https://graph.facebook.com/v19.0';
  private readonly appId: string;
  private readonly appSecret: string;

  constructor(appId: string, appSecret: string) {
    // Validate App ID format (should be numeric)
    if (!appId || typeof appId !== 'string') {
      throw new Error('Facebook App ID is required. Please configure it in the Social Integrations settings.');
    }
    
    // Facebook App IDs are numeric strings (typically 15-16 digits)
    const appIdRegex = /^\d+$/;
    if (!appIdRegex.test(appId.trim())) {
      throw new Error(`Invalid Facebook App ID format. App ID should be numeric (e.g., "123456789012345"). Received: "${appId}"`);
    }
    
    if (!appSecret || typeof appSecret !== 'string' || appSecret.trim().length === 0) {
      throw new Error('Facebook App Secret is required. Please configure it in the Social Integrations settings.');
    }
    
    this.appId = appId.trim();
    this.appSecret = appSecret.trim();
  }

  /**
   * Get OAuth2 authorization URL for Facebook Login
   */
  getAuthUrl(tenantId: number, redirectUri: string): string {
    const scopes = [
      'email',
      'pages_read_engagement',
      'pages_manage_posts',
      'pages_show_list',
      'business_management',
      'instagram_basic',
      'instagram_content_publish',
      'leads_retrieval'
    ].join(',');

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      state: tenantId.toString()
    });

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: redirectUri,
      code: code
    });

    const response = await fetch(`${this.baseUrl}/oauth/access_token`, {
      method: 'POST',
      body: params
    });

    if (!response.ok) {
      throw new Error(`Facebook token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get long-lived user access token
   */
  async getLongLivedToken(shortToken: string): Promise<any> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortToken
    });

    const response = await fetch(`${this.baseUrl}/oauth/access_token?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get long-lived token: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user information
   */
  async getUser(accessToken: string): Promise<FacebookUser> {
    const response = await fetch(
      `${this.baseUrl}/me?fields=id,name,email&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    return response.json() as FacebookUser;
  }

  /**
   * Get user's Facebook Pages
   */
  async getUserPages(accessToken: string): Promise<FacebookPage[]> {
    const response = await fetch(
      `${this.baseUrl}/me/accounts?fields=id,name,access_token,category,fan_count,tasks&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get pages: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.data || [];
  }

  /**
   * Get Instagram Business Account connected to a Page
   */
  async getInstagramAccount(pageAccessToken: string, pageId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      return null; // Page might not have Instagram connected
    }

    const data = await response.json() as any;
    return data.instagram_business_account || null;
  }

  /**
   * Get lead forms for a page
   */
  async getPageLeadForms(pageAccessToken: string, pageId: string): Promise<FacebookLeadForm[]> {
    const response = await fetch(
      `${this.baseUrl}/${pageId}/leadgen_forms?fields=id,name,status,leadgen_tos_accepted,questions&access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get lead forms: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.data || [];
  }

  /**
   * Get leads from a specific lead form
   */
  async getLeadFormLeads(pageAccessToken: string, formId: string): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/${formId}/leads?access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get leads: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.data || [];
  }

  /**
   * Get detailed lead information
   */
  async getLeadDetails(pageAccessToken: string, leadId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/${leadId}?access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get lead details: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get page posts with insights
   */
  async getPagePosts(pageAccessToken: string, pageId: string, limit: number = 25): Promise<FacebookPost[]> {
    const response = await fetch(
      `${this.baseUrl}/${pageId}/posts?fields=id,message,created_time,type,insights.metric(post_impressions,post_engaged_users,post_clicks)&limit=${limit}&access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get page posts: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.data || [];
  }

  /**
   * Get page insights (overloaded method for different signatures)
   */
  async getPageInsights(accessToken: string, pageId?: string): Promise<any> {
    // If only access token is provided, get insights from user's pages
    if (!pageId) {
      const pages = await this.getUserPages(accessToken);
      if (pages.length === 0) {
        return {
          page_impressions: 0,
          page_reach: 0,
          page_engagement: 0,
          page_fan_adds: 0
        };
      }
      
      // Get insights from the first page
      pageId = pages[0].id;
      accessToken = pages[0].access_token;
    }

    const metrics = [
      'page_fans',
      'page_impressions',
      'page_engaged_users',
      'page_post_engagements'
    ].join(',');

    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}/insights?metric=${metrics}&period=day&access_token=${accessToken}`
      );

      if (!response.ok) {
        console.warn(`Failed to get page insights: ${response.statusText}`);
        return {
          page_impressions: 0,
          page_reach: 0,
          page_engagement: 0,
          page_fan_adds: 0
        };
      }

      const data = await response.json() as any;
      const insights = data.data || [];
      
      // Transform insights data
      const result = {
        page_impressions: 0,
        page_reach: 0,
        page_engagement: 0,
        page_fan_adds: 0
      };

      insights.forEach((insight: any) => {
        if (insight.values && insight.values.length > 0) {
          const value = insight.values[insight.values.length - 1].value;
          switch (insight.name) {
            case 'page_impressions':
              result.page_impressions = value;
              break;
            case 'page_engaged_users':
              result.page_engagement = value;
              break;
            case 'page_fans':
              result.page_reach = value;
              break;
            case 'page_post_engagements':
              result.page_fan_adds = value;
              break;
          }
        }
      });

      return result;
    } catch (error) {
      console.warn('Error fetching page insights:', error);
      return {
        page_impressions: 0,
        page_reach: 0,
        page_engagement: 0,
        page_fan_adds: 0
      };
    }
  }

  /**
   * Publish a post to Facebook Page
   */
  async publishPost(pageAccessToken: string, pageId: string, postData: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: postData.message,
        link: postData.link,
        access_token: pageAccessToken
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to publish post: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Save Facebook integration to database
   */
  async saveIntegration(tenantId: number, integrationData: any): Promise<any> {
    // Create Facebook integration record
    const integration = await simpleStorage.createFacebookIntegration({
      tenantId,
      facebookUserId: integrationData.user.id,
      userAccessToken: integrationData.longLivedToken.access_token,
      userTokenExpiresAt: new Date(Date.now() + integrationData.longLivedToken.expires_in * 1000),
      businessId: integrationData.businessId,
      permissions: integrationData.permissions,
      isActive: true
    });

    // Save connected pages
    const savedPages = [];
    for (const page of integrationData.pages) {
      const savedPage = await simpleStorage.createFacebookPage({
        tenantId,
        integrationId: integration.id,
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        pageCategory: page.category,
        followersCount: page.fan_count || 0,
        isInstagramConnected: !!page.instagram_business_account,
        instagramBusinessAccountId: page.instagram_business_account?.id,
        isActive: true
      });

      savedPages.push(savedPage);
    }

    return { integration, pages: savedPages };
  }

  /**
   * Sync leads from all connected lead forms
   */
  async syncLeads(tenantId: number): Promise<{ imported: number; total: number }> {
    const integration = await simpleStorage.getFacebookIntegration(tenantId);
    if (!integration) {
      throw new Error('No Facebook integration found');
    }

    // Get default lead type for the tenant
    const leadTypes = await simpleStorage.getLeadTypesByTenant(tenantId);
    const defaultLeadType = leadTypes.find((lt: any) => lt.name === 'General Inquiry' || lt.name === 'General') || leadTypes[0];
    
    if (!defaultLeadType) {
      throw new Error('No lead types configured for tenant. Please create at least one lead type.');
    }

    const pages = await simpleStorage.getFacebookPages(tenantId);
    let totalImported = 0;
    let totalProcessed = 0;

    for (const page of pages) {
      try {
        // Get lead forms for this page
        const leadForms = await this.getPageLeadForms(page.pageAccessToken, page.pageId);
        
        for (const form of leadForms) {
          // Get leads from this form
          const leads = await this.getLeadFormLeads(page.pageAccessToken, form.id);
          totalProcessed += leads.length;

          for (const lead of leads) {
            try {
              // Get lead details first
              const leadDetails = await this.getLeadDetails(page.pageAccessToken, lead.id);
              
              // Check if lead already exists (by email or Facebook lead ID)
              const existingLeads = await simpleStorage.getLeadsByTenant({ tenantId });
              
              // Extract email from lead details
              let leadEmail = '';
              if (leadDetails.field_data) {
                const emailField = leadDetails.field_data.find((f: any) => 
                  f.name.toLowerCase() === 'email'
                );
                if (emailField && emailField.values && emailField.values.length > 0) {
                  leadEmail = emailField.values[0];
                }
              }

              // Check for duplicates
              const isDuplicate = existingLeads.some((l: any) => 
                (l.email && leadEmail && l.email.toLowerCase() === leadEmail.toLowerCase()) ||
                (l.typeSpecificData && typeof l.typeSpecificData === 'object' && 
                 l.typeSpecificData.facebookLeadId === lead.id)
              );

              if (isDuplicate) {
                console.log(`Skipping duplicate Facebook lead: ${lead.id}`);
                continue;
              }

              // Transform Facebook lead to CRM lead format
              const crmLead = this.transformFacebookLead(leadDetails, page.pageName, form.name, defaultLeadType.id);
              
              // Create lead in CRM
              await simpleStorage.createLead({
                ...crmLead,
                tenantId,
                leadTypeId: defaultLeadType.id
              });
              
              totalImported++;
            } catch (error) {
              console.error(`Error importing lead ${lead.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error syncing leads for page ${page.pageId}:`, error);
      }
    }

    // Update last sync time and total imported count
    await simpleStorage.updateFacebookIntegration(integration.id, {
      lastSync: new Date(),
      totalLeadsImported: (integration.totalLeadsImported || 0) + totalImported
    });

    return { imported: totalImported, total: totalProcessed };
  }

  /**
   * Transform Facebook lead to CRM lead format
   */
  private transformFacebookLead(facebookLead: any, pageName: string, formName: string, leadTypeId?: number): any {
    const leadData: any = {
      source: `Facebook Lead Ads - ${pageName}`,
      status: 'new',
      notes: `Lead from Facebook Lead Ads form: ${formName}\nPage: ${pageName}`,
      typeSpecificData: {
        facebookLeadId: facebookLead.id,
        facebookFormId: formName,
        facebookPageName: pageName
      },
      createdAt: new Date(facebookLead.created_time)
    };

    // Set leadTypeId if provided
    if (leadTypeId) {
      leadData.leadTypeId = leadTypeId;
    }

    // Parse field data
    if (facebookLead.field_data) {
      for (const field of facebookLead.field_data) {
        const fieldName = field.name.toLowerCase();
        const fieldValue = field.values && field.values.length > 0 ? field.values[0] : '';

        switch (fieldName) {
          case 'first_name':
            leadData.firstName = fieldValue;
            break;
          case 'last_name':
            leadData.lastName = fieldValue;
            break;
          case 'full_name':
            const nameParts = fieldValue.split(' ');
            leadData.firstName = nameParts[0] || '';
            leadData.lastName = nameParts.slice(1).join(' ') || '';
            break;
          case 'email':
            leadData.email = fieldValue;
            break;
          case 'phone_number':
          case 'phone':
            leadData.phone = fieldValue;
            break;
          case 'company_name':
          case 'company':
            leadData.company = fieldValue;
            // Store in typeSpecificData as well
            if (!leadData.typeSpecificData) {
              leadData.typeSpecificData = {};
            }
            leadData.typeSpecificData.company = fieldValue;
            break;
          case 'city':
            leadData.city = fieldValue;
            break;
          case 'state':
            leadData.state = fieldValue;
            break;
          case 'country':
            leadData.country = fieldValue;
            break;
          case 'zip_code':
          case 'postal_code':
            if (!leadData.typeSpecificData) {
              leadData.typeSpecificData = {};
            }
            leadData.typeSpecificData.zipCode = fieldValue;
            break;
          default:
            // Store other fields in typeSpecificData
            if (!leadData.typeSpecificData) {
              leadData.typeSpecificData = {};
            }
            leadData.typeSpecificData[field.name] = fieldValue;
            // Also add to notes for visibility
            leadData.notes += `\n${field.name}: ${fieldValue}`;
            break;
        }
      }
    }

    // Ensure name is set
    if (!leadData.firstName && !leadData.lastName) {
      leadData.firstName = 'Facebook';
      leadData.lastName = 'Lead';
    }

    // Ensure email is set (required field)
    if (!leadData.email) {
      leadData.email = `facebook_lead_${facebookLead.id}@facebook.com`;
    }

    return leadData;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = 'sha1=' + crypto
      .createHmac('sha1', this.appSecret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * Process Facebook webhook
   */
  async processWebhook(tenantId: number, webhookData: any): Promise<void> {
    if (webhookData.object === 'page') {
      for (const entry of webhookData.entry) {
        // Handle lead form submissions
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'leadgen') {
              await this.handleLeadgenWebhook(tenantId, change.value);
            }
          }
        }
      }
    }
  }

  /**
   * Handle leadgen webhook
   */
  private async handleLeadgenWebhook(tenantId: number, leadgenData: any): Promise<void> {
    try {
      const page = await simpleStorage.getFacebookPageByPageId(tenantId, leadgenData.page_id);
      if (!page) {
        console.error(`Page not found for webhook: ${leadgenData.page_id}`);
        return;
      }

      // Get default lead type for the tenant
      const leadTypes = await simpleStorage.getLeadTypesByTenant(tenantId);
      const defaultLeadType = leadTypes.find((lt: any) => lt.name === 'General Inquiry' || lt.name === 'General') || leadTypes[0];
      
      if (!defaultLeadType) {
        console.error('No lead types configured for tenant');
        return;
      }

      // Get lead details
      const leadDetails = await this.getLeadDetails(page.pageAccessToken, leadgenData.leadgen_id);
      
      // Transform and create lead
      const crmLead = this.transformFacebookLead(leadDetails, page.pageName, 'Webhook Lead', defaultLeadType.id);
      
      await simpleStorage.createLead({
        ...crmLead,
        tenantId,
        leadTypeId: defaultLeadType.id
      });

      console.log(`Successfully imported webhook lead: ${leadgenData.leadgen_id}`);
    } catch (error) {
      console.error('Error processing leadgen webhook:', error);
    }
  }

  /**
   * Get leads from Facebook Lead Ads (simplified method for API route)
   */
  async getLeads(accessToken: string): Promise<any[]> {
    try {
      const pages = await this.getUserPages(accessToken);
      const allLeads: any[] = [];
      
      for (const page of pages) {
        try {
          const leadForms = await this.getPageLeadForms(page.access_token, page.id);
          
          for (const form of leadForms) {
            const leads = await this.getLeadFormLeads(page.access_token, form.id);
            
            // Add page and form context to each lead
            const contextualLeads = leads.map(lead => ({
              ...lead,
              page_name: page.name,
              form_name: form.name,
              page_id: page.id,
              form_id: form.id
            }));
            
            allLeads.push(...contextualLeads);
          }
        } catch (error) {
          console.warn(`Error fetching leads for page ${page.id}:`, error);
        }
      }
      
      return allLeads;
    } catch (error) {
      console.error('Error fetching Facebook leads:', error);
      return [];
    }
  }

  /**
   * Create Facebook ad campaign
   */
  async createCampaign(accessToken: string, campaignData: any): Promise<any> {
    try {
      // Get user's ad accounts
      const adAccountsResponse = await fetch(
        `${this.baseUrl}/me/adaccounts?access_token=${accessToken}`
      );
      
      if (!adAccountsResponse.ok) {
        throw new Error('Failed to get ad accounts');
      }
      
      const adAccountsData = await adAccountsResponse.json() as any;
      const adAccounts = adAccountsData.data || [];
      
      if (adAccounts.length === 0) {
        throw new Error('No ad accounts found. Please create an ad account in Facebook Business Manager.');
      }
      
      // Use the first ad account
      const adAccountId = adAccounts[0].id;
      
      // Create campaign
      const campaignResponse = await fetch(
        `${this.baseUrl}/${adAccountId}/campaigns`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: campaignData.name,
            objective: campaignData.objective,
            status: 'PAUSED', // Start paused for safety
            access_token: accessToken
          })
        }
      );
      
      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json() as any;
        throw new Error(errorData.error?.message || 'Failed to create campaign');
      }
      
      const campaign = await campaignResponse.json() as any;
      
      return {
        id: campaign.id,
        name: campaignData.name,
        objective: campaignData.objective,
        status: 'PAUSED',
        ad_account_id: adAccountId,
        created_time: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating Facebook campaign:', error);
      throw error;
    }
  }

  /**
   * Create Facebook custom audience
   */
  async createCustomAudience(accessToken: string, audienceData: any): Promise<any> {
    try {
      // Get user's ad accounts
      const adAccountsResponse = await fetch(
        `${this.baseUrl}/me/adaccounts?access_token=${accessToken}`
      );
      
      if (!adAccountsResponse.ok) {
        throw new Error('Failed to get ad accounts');
      }
      
      const adAccountsData = await adAccountsResponse.json() as any;
      const adAccounts = adAccountsData.data || [];
      
      if (adAccounts.length === 0) {
        throw new Error('No ad accounts found');
      }
      
      const adAccountId = adAccounts[0].id;
      
      // Create custom audience
      const audienceResponse = await fetch(
        `${this.baseUrl}/${adAccountId}/customaudiences`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: audienceData.name,
            subtype: audienceData.source || 'WEBSITE',
            description: audienceData.description,
            access_token: accessToken
          })
        }
      );
      
      if (!audienceResponse.ok) {
        const errorData = await audienceResponse.json() as any;
        throw new Error(errorData.error?.message || 'Failed to create audience');
      }
      
      return await audienceResponse.json();
    } catch (error) {
      console.error('Error creating custom audience:', error);
      throw error;
    }
  }

  /**
   * Create Facebook pixel
   */
  async createPixel(accessToken: string, pixelData: any): Promise<any> {
    try {
      // Get user's ad accounts
      const adAccountsResponse = await fetch(
        `${this.baseUrl}/me/adaccounts?access_token=${accessToken}`
      );
      
      if (!adAccountsResponse.ok) {
        throw new Error('Failed to get ad accounts');
      }
      
      const adAccountsData = await adAccountsResponse.json() as any;
      const adAccounts = adAccountsData.data || [];
      
      if (adAccounts.length === 0) {
        throw new Error('No ad accounts found');
      }
      
      const adAccountId = adAccounts[0].id;
      
      // Create pixel
      const pixelResponse = await fetch(
        `${this.baseUrl}/${adAccountId}/adspixels`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: pixelData.name,
            access_token: accessToken
          })
        }
      );
      
      if (!pixelResponse.ok) {
        const errorData = await pixelResponse.json() as any;
        throw new Error(errorData.error?.message || 'Failed to create pixel');
      }
      
      return await pixelResponse.json();
    } catch (error) {
      console.error('Error creating pixel:', error);
      throw error;
    }
  }

  /**
   * Get ad account campaigns
   */
  async getCampaigns(accessToken: string): Promise<any[]> {
    try {
      // Get user's ad accounts
      const adAccountsResponse = await fetch(
        `${this.baseUrl}/me/adaccounts?access_token=${accessToken}`
      );
      
      if (!adAccountsResponse.ok) {
        throw new Error('Failed to get ad accounts');
      }
      
      const adAccountsData = await adAccountsResponse.json() as any;
      const adAccounts = adAccountsData.data || [];
      
      if (adAccounts.length === 0) {
        return [];
      }
      
      const allCampaigns: any[] = [];
      
      for (const adAccount of adAccounts) {
        try {
          const campaignsResponse = await fetch(
            `${this.baseUrl}/${adAccount.id}/campaigns?fields=id,name,objective,status,daily_budget,lifetime_budget,created_time&access_token=${accessToken}`
          );
          
          if (campaignsResponse.ok) {
            const campaignsData = await campaignsResponse.json() as any;
            allCampaigns.push(...(campaignsData.data || []));
          }
        } catch (error) {
          console.warn(`Error fetching campaigns for ad account ${adAccount.id}:`, error);
        }
      }
      
      return allCampaigns;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  }

  /**
   * Get ad account insights
   */
  async getAdAccountInsights(accessToken: string): Promise<any> {
    try {
      // Get user's ad accounts
      const adAccountsResponse = await fetch(
        `${this.baseUrl}/me/adaccounts?access_token=${accessToken}`
      );
      
      if (!adAccountsResponse.ok) {
        throw new Error('Failed to get ad accounts');
      }
      
      const adAccountsData = await adAccountsResponse.json() as any;
      const adAccounts = adAccountsData.data || [];
      
      if (adAccounts.length === 0) {
        return {
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          roas: 0
        };
      }
      
      const adAccountId = adAccounts[0].id;
      
      // Get insights for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
      const insightsResponse = await fetch(
        `${this.baseUrl}/${adAccountId}/insights?fields=spend,impressions,clicks,conversions,ctr,cpc,cpm&time_range={'since':'${startDate.toISOString().split('T')[0]}','until':'${endDate.toISOString().split('T')[0]}'}&access_token=${accessToken}`
      );
      
      if (!insightsResponse.ok) {
        console.warn('Failed to get ad account insights');
        return {
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          roas: 0
        };
      }
      
      const insightsData = await insightsResponse.json() as any;
      const insights = insightsData.data?.[0] || {};
      
      return {
        spend: parseFloat(insights.spend || '0'),
        impressions: parseInt(insights.impressions || '0'),
        clicks: parseInt(insights.clicks || '0'),
        conversions: parseInt(insights.conversions || '0'),
        ctr: parseFloat(insights.ctr || '0'),
        cpc: parseFloat(insights.cpc || '0'),
        cpm: parseFloat(insights.cpm || '0'),
        roas: insights.spend > 0 ? (insights.conversions * 100) / insights.spend : 0
      };
    } catch (error) {
      console.error('Error fetching ad account insights:', error);
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        roas: 0
      };
    }
  }
}

// Removed global export - use SocialServiceFactory.getFacebookService(tenantId) instead
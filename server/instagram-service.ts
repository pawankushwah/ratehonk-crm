import { SimpleStorage } from './simple-storage';

interface InstagramTokenResponse {
  access_token: string;
  expires_in: number;
}

interface InstagramUser {
  id: string;
  username: string;
  account_type: string;
}

interface InstagramLead {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

export class InstagramService {
  private appId: string;
  private appSecret: string;
  private storage = new SimpleStorage();

  constructor(appId: string, appSecret: string) {
    if (!appId || !appSecret) {
      throw new Error('Instagram App ID and App Secret are required. Please configure them in the Social Integrations settings.');
    }
    this.appId = appId;
    this.appSecret = appSecret;
  }

  getAuthUrl(tenantId: number, redirectUri: string): string {
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
      'leads_retrieval'
    ].join(',');
    
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      state: tenantId.toString()
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<InstagramTokenResponse> {
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.appId,
        client_secret: this.appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram token exchange failed: ${error.error_description}`);
    }

    return await response.json();
  }

  async getLongLivedToken(accessToken: string): Promise<InstagramTokenResponse> {
    const response = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${this.appSecret}&access_token=${accessToken}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to get long-lived Instagram token');
    }

    return await response.json();
  }

  async getUser(accessToken: string): Promise<InstagramUser> {
    const response = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`);
    
    if (!response.ok) {
      throw new Error('Failed to get Instagram user');
    }

    return await response.json();
  }

  async getBusinessAccounts(accessToken: string): Promise<any[]> {
    const response = await fetch(`https://graph.facebook.com/me/accounts?fields=instagram_business_account&access_token=${accessToken}`);
    
    if (!response.ok) {
      throw new Error('Failed to get Instagram business accounts');
    }

    const data = await response.json();
    return data.data || [];
  }

  async syncLeads(tenantId: number): Promise<{ imported: number; total: number }> {
    const integration = await this.storage.getSocialIntegration(tenantId, 'instagram');
    
    if (!integration || !integration.accessToken) {
      throw new Error('Instagram integration not found or not authenticated');
    }

    try {
      // Get business accounts from settings
      const businessAccounts = integration.settings?.businessAccounts || [];
      let totalImported = 0;
      let totalProcessed = 0;

      for (const account of businessAccounts) {
        // Get lead forms for this business account
        const formsResponse = await fetch(
          `https://graph.facebook.com/${account.instagram_business_account.id}/leadgen_forms?access_token=${integration.accessToken}`
        );

        if (!formsResponse.ok) continue;

        const formsData = await formsResponse.json();
        
        for (const form of formsData.data || []) {
          // Get leads from this form
          const leadsResponse = await fetch(
            `https://graph.facebook.com/${form.id}/leads?access_token=${integration.accessToken}`
          );

          if (!leadsResponse.ok) continue;

          const leadsData = await leadsResponse.json();
          totalProcessed += leadsData.data?.length || 0;

          for (const lead of leadsData.data || []) {
            const imported = await this.importLead(tenantId, lead, 'instagram');
            if (imported) totalImported++;
          }
        }
      }

      // Update integration sync status
      await this.storage.updateSocialIntegration(integration.id, {
        lastSync: new Date(),
        totalLeadsImported: (integration.totalLeadsImported || 0) + totalImported
      });

      return { imported: totalImported, total: totalProcessed };
    } catch (error) {
      console.error('Instagram lead sync error:', error);
      throw error;
    }
  }

  private async importLead(tenantId: number, lead: InstagramLead, source: string): Promise<boolean> {
    try {
      // Extract lead data from Instagram format
      const leadData: any = {
        source,
        status: 'new'
      };

      // Parse field data
      for (const field of lead.field_data || []) {
        switch (field.name.toLowerCase()) {
          case 'email':
            leadData.email = field.values[0];
            break;
          case 'full_name':
          case 'name':
            const nameParts = field.values[0]?.split(' ') || [''];
            leadData.firstName = nameParts[0] || '';
            leadData.lastName = nameParts.slice(1).join(' ') || '';
            leadData.name = field.values[0] || '';
            break;
          case 'phone_number':
          case 'phone':
            leadData.phone = field.values[0];
            break;
          default:
            // Store other fields in notes
            if (!leadData.notes) leadData.notes = '';
            leadData.notes += `${field.name}: ${field.values.join(', ')}\n`;
        }
      }

      // Ensure required fields
      if (!leadData.email || !leadData.name) {
        console.log('Skipping Instagram lead with missing required fields');
        return false;
      }

      // Check for duplicate
      const existingLeads = await this.storage.getLeads(tenantId);
      const duplicate = existingLeads.find(l => 
        l.email === leadData.email && l.source === source
      );

      if (duplicate) {
        console.log('Skipping duplicate Instagram lead');
        return false;
      }

      // Get default lead type for the tenant
      const leadTypes = await this.storage.getLeadTypes(tenantId);
      const defaultLeadType = leadTypes.find(lt => lt.name === 'General') || leadTypes[0];
      
      if (!defaultLeadType) {
        throw new Error('No lead types configured for tenant');
      }

      leadData.tenantId = tenantId;
      leadData.leadTypeId = defaultLeadType.id;

      await this.storage.createLead(leadData);
      return true;
    } catch (error) {
      console.error('Error importing Instagram lead:', error);
      return false;
    }
  }
}
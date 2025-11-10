import { SimpleStorage } from './simple-storage';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

interface LinkedInUser {
  id: string;
  firstName: {
    localized: { [key: string]: string };
  };
  lastName: {
    localized: { [key: string]: string };
  };
  emailAddress: string;
}

interface LinkedInLead {
  id: string;
  createdAt: number;
  formResponse: {
    answers: Array<{
      question: {
        text: {
          text: string;
        };
      };
      answer: {
        textAnswers?: {
          values: string[];
        };
      };
    }>;
  };
}

export class LinkedInService {
  private clientId: string;
  private clientSecret: string;
  private storage = new SimpleStorage();

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  getAuthUrl(tenantId: number, redirectUri: string): string {
    const scopes = [
      'r_liteprofile',
      'r_emailaddress',
      'r_ads',
      'rw_ads',
      'r_organization_social'
    ].join(',');
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state: tenantId.toString()
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<LinkedInTokenResponse> {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LinkedIn token exchange failed: ${error.error_description}`);
    }

    return await response.json();
  }

  async getUser(accessToken: string): Promise<LinkedInUser> {
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName)', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to get LinkedIn profile');
    }

    const profile = await profileResponse.json();

    // Get email address
    const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to get LinkedIn email');
    }

    const emailData = await emailResponse.json();
    const email = emailData.elements?.[0]?.['handle~']?.emailAddress || '';

    return {
      ...profile,
      emailAddress: email
    };
  }

  async getAdAccounts(accessToken: string): Promise<any[]> {
    const response = await fetch('https://api.linkedin.com/v2/adAccountsV2?q=search&search=(status:(values:List(ACTIVE)))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get LinkedIn ad accounts');
    }

    const data = await response.json();
    return data.elements || [];
  }

  // Sales Navigator features
  async searchProspects(accessToken: string, searchParams: any): Promise<any[]> {
    const queryParams = new URLSearchParams({
      keywords: searchParams.keywords || '',
      facet: `industry,${searchParams.industry || ''}`,
      ...searchParams
    });

    const response = await fetch(`https://api.linkedin.com/v2/people?q=people&${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to search LinkedIn prospects');
    }

    const data = await response.json();
    return data.elements || [];
  }

  async getConnections(accessToken: string): Promise<any[]> {
    const response = await fetch('https://api.linkedin.com/v2/connections?q=viewer&projection=(elements*(id,firstName,lastName,headline,publicProfileUrl,pictureInfo,industry,location))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get LinkedIn connections');
    }

    const data = await response.json();
    return data.elements || [];
  }

  async getMutualConnections(accessToken: string, personId: string): Promise<any[]> {
    const response = await fetch(`https://api.linkedin.com/v2/connections/${personId}/mutualConnections`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!response.ok) {
      return []; // Not critical if this fails
    }

    const data = await response.json();
    return data.elements || [];
  }

  // Messaging features
  async getMessages(accessToken: string): Promise<any[]> {
    const response = await fetch('https://api.linkedin.com/v2/conversations?q=actor&projection=(elements*(id,participants,lastActivityAt,messages:(elements*(id,from,createdAt,subject,body))))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get LinkedIn messages');
    }

    const data = await response.json();
    return data.elements || [];
  }

  async sendInMail(accessToken: string, recipientId: string, subject: string, message: string): Promise<any> {
    const response = await fetch('https://api.linkedin.com/v2/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        recipients: [`urn:li:person:${recipientId}`],
        subject: subject,
        body: message
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send InMail: ${error.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  // Auto-logging to CRM
  async logMessageToCRM(tenantId: number, messageData: any): Promise<void> {
    // Store message in CRM system
    const crmData = {
      tenantId,
      platform: 'linkedin',
      messageType: messageData.messageType || 'message',
      fromName: messageData.from.name,
      fromLinkedInId: messageData.from.id,
      subject: messageData.subject,
      body: messageData.body,
      timestamp: messageData.timestamp,
      linkedInMessageId: messageData.id,
      conversationId: messageData.conversationId
    };

    // Store message in social_messages table via SQL
    const postgres = (await import('postgres')).default;
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.ipepsanzqwbupegrkzwz:crm%402025@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
    const sql = postgres(connectionString, {
      ssl: 'require',
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    await sql`
      INSERT INTO social_messages (tenant_id, platform, message_type, sender_name, sender_linkedin_id, subject, body, timestamp, linkedin_message_id, conversation_id)
      VALUES (${crmData.tenantId}, ${crmData.platform}, ${crmData.messageType}, ${crmData.fromName}, ${crmData.fromLinkedInId}, ${crmData.subject}, ${crmData.body}, ${crmData.timestamp}, ${crmData.linkedInMessageId}, ${crmData.conversationId})
    `;
  }

  async logConnectionToCRM(tenantId: number, connectionData: any): Promise<void> {
    // Store connection in CRM system
    const crmData = {
      tenantId,
      platform: 'linkedin',
      firstName: connectionData.firstName,
      lastName: connectionData.lastName,
      headline: connectionData.headline,
      industry: connectionData.industry,
      location: connectionData.location,
      linkedInId: connectionData.id,
      profileUrl: connectionData.publicProfileUrl,
      connectionDate: new Date().toISOString()
    };

    // Store connection in leads table via SQL
    const postgres = (await import('postgres')).default;
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.ipepsanzqwbupegrkzwz:crm%402025@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
    const sql = postgres(connectionString, {
      ssl: 'require',
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    await sql`
      INSERT INTO leads (tenant_id, name, first_name, last_name, title, company, industry, location, source, source_detail, linkedin_id, profile_url, connection_date, created_at, updated_at)
      VALUES (${crmData.tenantId}, ${crmData.firstName + ' ' + crmData.lastName}, ${crmData.firstName}, ${crmData.lastName}, ${crmData.headline}, '', ${crmData.industry}, ${crmData.location}, 'linkedin', 'connection', ${crmData.linkedInId}, ${crmData.profileUrl}, ${crmData.connectionDate}, NOW(), NOW())
    `;
  }

  // Enhanced lead sync with Sales Navigator
  async syncSalesNavigatorLeads(tenantId: number): Promise<{ imported: number; total: number }> {
    const integration = await this.storage.getSocialIntegration(tenantId, 'linkedin');
    
    if (!integration || !integration.accessToken) {
      throw new Error('LinkedIn integration not found or not authenticated');
    }

    try {
      let totalImported = 0;
      let totalProcessed = 0;

      // Sync connections as potential leads
      const connections = await this.getConnections(integration.accessToken);
      
      for (const connection of connections) {
        try {
          // Get mutual connections for lead scoring
          const mutualConnections = await this.getMutualConnections(integration.accessToken, connection.id);
          
          const leadData = {
            tenantId,
            platform: 'linkedin',
            source: 'sales_navigator',
            linkedInId: connection.id,
            firstName: connection.firstName?.localized?.en_US || connection.firstName,
            lastName: connection.lastName?.localized?.en_US || connection.lastName,
            headline: connection.headline,
            industry: connection.industry,
            location: connection.location?.name,
            profileUrl: connection.publicProfileUrl,
            mutualConnections: mutualConnections.length,
            leadScore: this.calculateLeadScore(connection, mutualConnections),
            createdAt: new Date().toISOString()
          };

          // Store lead in leads table via SQL
          const postgres = (await import('postgres')).default;
          const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.ipepsanzqwbupegrkzwz:crm%402025@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
          const sql = postgres(connectionString, {
            ssl: 'require',
            max: 20,
            idle_timeout: 20,
            connect_timeout: 10,
          });

          await sql`
            INSERT INTO leads (tenant_id, name, first_name, last_name, title, company, industry, location, source, source_detail, linkedin_id, profile_url, lead_score, mutual_connections, created_at, updated_at)
            VALUES (${leadData.tenantId}, ${leadData.firstName + ' ' + leadData.lastName}, ${leadData.firstName}, ${leadData.lastName}, ${leadData.headline}, '', ${leadData.industry}, ${leadData.location}, ${leadData.platform}, ${leadData.source}, ${leadData.linkedInId}, ${leadData.profileUrl}, ${leadData.leadScore}, ${leadData.mutualConnections}, ${leadData.createdAt}, ${leadData.createdAt})
          `;
          totalImported++;
        } catch (error) {
          console.error('Error processing connection:', error);
        }
        totalProcessed++;
      }

      return { imported: totalImported, total: totalProcessed };
    } catch (error) {
      console.error('LinkedIn Sales Navigator sync error:', error);
      throw error;
    }
  }

  private calculateLeadScore(connection: any, mutualConnections: any[]): number {
    let score = 5; // Base score

    // Boost score for mutual connections
    score += Math.min(mutualConnections.length * 0.5, 3);

    // Boost score for complete profile
    if (connection.headline) score += 1;
    if (connection.industry) score += 1;

    // Cap at 10
    return Math.min(score, 10);
  }

  async syncLeads(tenantId: number): Promise<{ imported: number; total: number }> {
    const integration = await this.storage.getSocialIntegration(tenantId, 'linkedin');
    
    if (!integration || !integration.accessToken) {
      throw new Error('LinkedIn integration not found or not authenticated');
    }

    try {
      // Get ad accounts from settings
      const adAccounts = integration.settings?.adAccounts || [];
      let totalImported = 0;
      let totalProcessed = 0;

      for (const account of adAccounts) {
        // Get lead forms for this ad account
        const formsResponse = await fetch(
          `https://api.linkedin.com/v2/leadForms?q=account&account=${encodeURIComponent(account.id)}`,
          {
            headers: {
              'Authorization': `Bearer ${integration.accessToken}`,
              'cache-control': 'no-cache',
              'X-Restli-Protocol-Version': '2.0.0'
            }
          }
        );

        if (!formsResponse.ok) continue;

        const formsData = await formsResponse.json();
        
        for (const form of formsData.elements || []) {
          // Get leads from this form
          const leadsResponse = await fetch(
            `https://api.linkedin.com/v2/leadFormResponses?q=leadForm&leadForm=${encodeURIComponent(form.id)}`,
            {
              headers: {
                'Authorization': `Bearer ${integration.accessToken}`,
                'cache-control': 'no-cache',
                'X-Restli-Protocol-Version': '2.0.0'
              }
            }
          );

          if (!leadsResponse.ok) continue;

          const leadsData = await leadsResponse.json();
          totalProcessed += leadsData.elements?.length || 0;

          for (const lead of leadsData.elements || []) {
            const imported = await this.importLead(tenantId, lead, 'linkedin');
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
      console.error('LinkedIn lead sync error:', error);
      throw error;
    }
  }

  private async importLead(tenantId: number, lead: LinkedInLead, source: string): Promise<boolean> {
    try {
      // Extract lead data from LinkedIn format
      const leadData: any = {
        source,
        status: 'new'
      };

      // Parse form responses
      for (const answer of lead.formResponse?.answers || []) {
        const question = answer.question?.text?.text?.toLowerCase() || '';
        const value = answer.answer?.textAnswers?.values?.[0] || '';

        if (question.includes('email')) {
          leadData.email = value;
        } else if (question.includes('first name')) {
          leadData.firstName = value;
        } else if (question.includes('last name')) {
          leadData.lastName = value;
        } else if (question.includes('name') && !leadData.firstName) {
          const nameParts = value.split(' ');
          leadData.firstName = nameParts[0] || '';
          leadData.lastName = nameParts.slice(1).join(' ') || '';
        } else if (question.includes('phone')) {
          leadData.phone = value;
        } else if (question.includes('company')) {
          if (!leadData.notes) leadData.notes = '';
          leadData.notes += `Company: ${value}\n`;
        } else {
          // Store other fields in notes
          if (!leadData.notes) leadData.notes = '';
          leadData.notes += `${question}: ${value}\n`;
        }
      }

      // Set full name
      leadData.name = `${leadData.firstName || ''} ${leadData.lastName || ''}`.trim();

      // Ensure required fields
      if (!leadData.email || !leadData.name) {
        console.log('Skipping LinkedIn lead with missing required fields');
        return false;
      }

      // Check for duplicate
      const existingLeads = await this.storage.getLeads(tenantId);
      const duplicate = existingLeads.find(l => 
        l.email === leadData.email && l.source === source
      );

      if (duplicate) {
        console.log('Skipping duplicate LinkedIn lead');
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
      console.error('Error importing LinkedIn lead:', error);
      return false;
    }
  }
}
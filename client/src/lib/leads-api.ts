// Leads API wrapper using new separated API routes

export const leadsApi = {
  // Create new lead
  async createLead(tenantId: number, data: any): Promise<any> {
    const response = await fetch(`/api/tenants/${tenantId}/leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create lead: ${response.statusText}`);
    }
    
    return response.json();
  },

  // List leads
  async getLeads(tenantId: number): Promise<any[]> {
    const response = await fetch(`/api/tenants/${tenantId}/leads`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get leads: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get individual lead
  async getLead(tenantId: number, leadId: number): Promise<any> {
    const response = await fetch(`/api/tenants/${tenantId}/leads/${leadId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get lead: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Update lead
  async updateLead(tenantId: number, leadId: number, data: any): Promise<any> {
    const response = await fetch(`/api/tenants/${tenantId}/leads/${leadId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update lead: ${response.statusText}`);
    }
    
    return response.json();
  }
};
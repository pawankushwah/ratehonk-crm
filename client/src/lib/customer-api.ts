// Customer API wrapper using new separated API routes

export const customerApi = {
  // Get individual customer
  async getCustomer(tenantId: number, customerId: number): Promise<any> {
    const response = await fetch(`/api/tenants/${tenantId}/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get customer: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Update customer
  async updateCustomer(tenantId: number, customerId: number, data: any): Promise<any> {
    const response = await fetch(`/api/tenants/${tenantId}/customers/${customerId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update customer: ${response.statusText}`);
    }
    
    return response.json();
  },

  // List customers (this route already works)
  async getCustomers(tenantId: number): Promise<any[]> {
    const response = await fetch(`/api/tenants/${tenantId}/customers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get customers: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Create customer (this route already works)
  async createCustomer(tenantId: number, data: any): Promise<any> {
    const response = await fetch(`/api/tenants/${tenantId}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create customer: ${response.statusText}`);
    }
    
    return response.json();
  }
};
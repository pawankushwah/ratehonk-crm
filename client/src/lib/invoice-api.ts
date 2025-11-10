// Invoice API helper functions using new separated API routes

// Get authentication token from localStorage
function getAuthToken(): string {
  return localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
}

// Get tenant ID from localStorage or authentication context
function getTenantId(): string {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.tenantId || user.tenant_id || '8'; // Default to tenant 8 for testing
}

// Invoice CRUD operations
export const invoiceApi = {
  // Get all invoices for current tenant
  async getInvoices() {
    const token = getAuthToken();
    const tenantId = getTenantId();
    const url = `/api/tenants/${tenantId}/invoices`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  },

  // Get invoice statistics (placeholder - implement if needed)
  async getInvoiceStats() {
    // TODO: Implement if this endpoint exists
    throw new Error('getInvoiceStats not yet implemented');
  },

  // Create new invoice (placeholder - implement if needed)
  async createInvoice(invoiceData: {
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
    invoiceDate?: string;
    dueDate?: string;
    notes?: string;
    currency?: string;
    customerId?: number;
  }) {
    // TODO: Implement if this endpoint exists
    throw new Error('createInvoice not yet implemented - use estimates/invoices routes');
  },

  // Update existing invoice
  async updateInvoice(invoiceId: number, updates: any) {
    const token = getAuthToken();
    const tenantId = getTenantId();
    const url = `/api/tenants/${tenantId}/invoices/${invoiceId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  },

  // Delete invoice
  async deleteInvoice(invoiceId: number) {
    const token = getAuthToken();
    const tenantId = getTenantId();
    const url = `/api/tenants/${tenantId}/invoices/${invoiceId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  },

  // Import invoices from file (placeholder - implement if needed)
  async importInvoices(invoiceData: any[]) {
    // TODO: Implement if this endpoint exists
    throw new Error('importInvoices not yet implemented');
  }
};

// Export individual functions for convenience
export const {
  getInvoices,
  getInvoiceStats,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  importInvoices
} = invoiceApi;

export default invoiceApi;
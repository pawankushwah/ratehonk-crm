// Travel Categories API for fetching and managing lead types

export const travelCategoriesApi = {
  // Setup travel categories for a tenant
  async setupTravelCategories(tenantId: number): Promise<any> {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/lead-types/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to setup travel categories');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error setting up travel categories:', error);
      throw error;
    }
  },

  // Get travel categories for a tenant
  async getTravelCategories(tenantId: number): Promise<any[]> {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/lead-types`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get travel categories');
      }
      
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching travel categories:', error);
      return [];
    }
  }
};
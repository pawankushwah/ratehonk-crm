import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";

/**
 * Direct Invoice API library using separated API routes
 * Uses /api/tenants/:tenantId/invoices pattern
 */

export function useInvoicesQuery() {
  const { tenant } = useAuth();
  
  return useQuery({
    queryKey: [`direct-invoices-${tenant?.id}`],
    queryFn: async () => {
      if (!tenant?.id) {
        throw new Error('No tenant ID available');
      }

      console.log('🔍 Direct Invoice API: Fetching invoices for tenant:', tenant.id);
      
      // Get token using both possible storage keys for compatibility
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/tenants/${tenant.id}/invoices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔍 Direct Invoice API: Request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch invoices: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 Direct Invoice API: Response received:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
        hasInvoicesField: 'invoices' in data,
        keys: Object.keys(data)
      });

      // Handle both direct array and wrapped response formats
      let invoices = [];
      if (Array.isArray(data)) {
        invoices = data;
      } else if (data && Array.isArray(data.invoices)) {
        invoices = data.invoices;
      } else if (data && typeof data === 'object') {
        // If it's an object but not the expected format, log and return empty array
        console.warn('🔍 Direct Invoice API: Unexpected response format:', data);
        invoices = [];
      }

      console.log('🔍 Direct Invoice API: Final invoices array:', {
        count: invoices.length,
        hasCustomerNames: invoices.length > 0 ? invoices.map(inv => inv.customerName || 'NO_NAME') : []
      });

      return invoices;
    },
    enabled: !!tenant?.id,
    retry: 3,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  });
}
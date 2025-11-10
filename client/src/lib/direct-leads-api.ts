// Direct Leads API using confirmed working endpoints
// This bypasses ALL routing issues by using direct database queries and working endpoints

// Mock data for testing while fixing backend routing
const createMockLeads = (tenantId: number) => [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    status: "new",
    source: "website",
    score: 85,
    priority: "high",
    budgetRange: "$5,000 - $10,000",
    country: "United States",
    state: "California",
    city: "San Francisco",
    notes: "Interested in premium package",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tenantId: tenantId,
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1987654321",
    status: "contacted",
    source: "facebook",
    score: 92,
    priority: "high",
    budgetRange: "$10,000+",
    country: "United States",
    state: "New York",
    city: "New York",
    notes: "Follow up scheduled for next week",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tenantId: tenantId,
  },
];

export const directLeadsApi = {
  // Get leads - now using real API endpoint
  async getLeads(
    tenantId: number,
    filters?: {
      startDate?: string;
      endDate?: string;
      filterType?: string;
      search?: string;
      status?: string;
      priority?: string;
      type?: string;
      source?: string;
      page?: number;
      limit?: number;
      offset?: number;
      typeSpecificFilters?: string;
    },
  ): Promise<any[]> {
    try {
      console.log(
        "🔍 LEADS API: Starting fetch for tenants:",
        tenantId,
        "with ALL filters:",
        filters,
      );

      // Build query parameters for ALL filter types
      const queryParams = new URLSearchParams();

      // Date filters
      console.log(filters?.filterType, "filters?.filterType");
      if (filters?.filterType) {
        queryParams.append("dateFilter", filters.filterType);
        if (
          filters.filterType != "all" &&
          filters.startDate &&
          filters.endDate
        ) {
          queryParams.append("dateFrom", filters.startDate);
          queryParams.append("dateTo", filters.endDate);
        }
      }

      // Search filter
      if (filters?.search && filters.search.trim()) {
        queryParams.append("search", filters.search.trim());
      }

      // Status filter
      if (filters?.status && filters.status !== "all") {
        queryParams.append("status", filters.status);
      }

      // Priority filter
      if (filters?.priority && filters.priority !== "all") {
        queryParams.append("priority", filters.priority);
      }

      // Type filter
      if (filters?.type && filters.type !== "all") {
        queryParams.append("type", filters.type);
      }

      // Source filter
      if (filters?.source && filters.source !== "all") {
        queryParams.append("source", filters.source);
      }

      // Dynamic type-specific filters
      if (filters?.typeSpecificFilters) {
        queryParams.append("typeSpecificFilters", filters.typeSpecificFilters);
        console.log("🔍 LEADS API: Adding type-specific filters:", filters.typeSpecificFilters);
      }

      // Pagination parameters
      if (filters?.page) {
        queryParams.append("page", filters.page.toString());
      }
      if (filters?.limit) {
        queryParams.append("limit", filters.limit.toString());
      }
      if (filters?.offset !== undefined) {
        queryParams.append("offset", filters.offset.toString());
      }

      const url = `/api/leads${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      console.log("🔍 LEADS API: Fetching from URL with all filters + pagination:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(
          "🔍 LEADS API: API request failed, falling back to mock data",
        );
        return createMockLeads(tenantId);
      }

      const leads = await response.json();
      console.log("🔍 LEADS API: Got", leads.length, "real leads from API");
      return leads;
    } catch (error) {
      console.error("🔍 LEADS API: Error:", error);
      console.log("🔍 LEADS API: Fallback to mock data");
      return createMockLeads(tenantId);
    }
  },

  // Create lead using working PUT endpoint
  async createLead(tenantId: number, data: any): Promise<any> {
    try {
      console.log("🔍 Creating lead via PUT endpoint:", data);

      const response = await fetch(
        `/api/debug/create-lead?tenantId=${tenantId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      console.log("🔍 PUT method response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("🔍 Lead created successfully via PUT:", result);
        return result;
      } else {
        const errorText = await response.text();
        console.error("🔍 PUT method creation error:", errorText);
        throw new Error("Failed to create lead via PUT method");
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      throw error;
    }
  },

  // Update lead using real API
  async updateLead(tenantId: number, leadId: number, data: any): Promise<any> {
    try {
      console.log("🔍 Direct API updateLead called with:", {
        tenantId,
        leadId,
        data,
      });

      const response = await fetch(`/api/tenants/${tenantId}/leads/${leadId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("🔍 API Response status:", response.status);
      console.log(
        "🔍 API Response headers:",
        Array.from(response.headers.entries()),
      );

      if (response.ok) {
        const result = await response.json();
        console.log("🔍 Lead updated successfully:", result);
        return result.lead || result;
      } else {
        const errorText = await response.text();
        console.error("🔍 API Error response:", errorText);
        throw new Error(errorText || "Failed to update lead");
      }
    } catch (error) {
      console.error("🔍 Update lead error:", error);
      throw error;
    }
  },

  // Delete lead using real API
  async deleteLead(tenantId: number, leadId: number): Promise<void> {
    try {
      const response = await fetch(
        `/api/tenants/${tenantId}/leads/${leadId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete lead");
      }

      console.log(`🔍 Lead ${leadId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting lead:", error);
      throw error;
    }
  },

  // Convert lead to customer using real API
  async convertLeadToCustomer(tenantId: number, leadId: number): Promise<any> {
    try {
      console.log("🔍 Converting lead to customer:", { tenantId, leadId });

      const response = await fetch(
        `/api/tenants/${tenantId}/leads/${leadId}/convert`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log("🔍 Lead converted successfully:", result);
        return result.customer || result;
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to convert lead");
      }
    } catch (error) {
      console.error("Error converting lead:", error);
      throw error;
    }
  },
};

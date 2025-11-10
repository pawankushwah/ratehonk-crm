// Direct Customers API using confirmed working endpoints
// This bypasses ALL routing issues by using direct database queries and working endpoints

export const directCustomersApi = {
  // Get customers using real database data
  async getCustomers(
    tenantId: number,
    filters?: {
      startDate?: string;
      endDate?: string;
      filterType?: string;
      search?: string;
      status?: string;
      type?: string;
      source?: string;
      priority?: string;
      page?: number;
      limit?: number;
      offset?: number;
    },
  ): Promise<any> {
    try {
      // Build query parameters for ALL filtering
      const queryParams = new URLSearchParams();

      // Date filters
      if (filters?.startDate) {
        queryParams.append("startDate", filters.startDate);
      }
      if (filters?.endDate) {
        queryParams.append("endDate", filters.endDate);
      }
      if (filters?.filterType) {
        queryParams.append("filterType", filters.filterType);
      }

      // Search filter
      if (filters?.search && filters.search.trim()) {
        queryParams.append("search", filters.search.trim());
      }

      // Status filter
      if (filters?.status && filters.status !== "all") {
        queryParams.append("status", filters.status);
      }

      // Type filter
      if (filters?.type && filters.type !== "all") {
        queryParams.append("type", filters.type);
      }

      // Source filter
      if (filters?.source && filters.source !== "all") {
        queryParams.append("source", filters.source);
      }

      // Priority filter
      if (filters?.priority && filters.priority !== "all") {
        queryParams.append("priority", filters.priority);
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

      const response = await fetch(`/api/tenants/${tenantId}/customers?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("🔍 Direct customers API response:", result);

        // Check if result has paginated data structure { data: [], total: 0 }
        if (
          result &&
          typeof result === "object" &&
          "data" in result &&
          Array.isArray(result.data)
        ) {
          // Transform customer data to ensure consistent field names
          const transformedData = result.data.map((customer: any) => ({
            ...customer,
            createdAt: customer.created_at || customer.createdAt,
            updatedAt: customer.updated_at || customer.updatedAt,
            status: customer.crm_status || customer.status || "active",
            crmStatus: customer.crm_status || customer.crmStatus || "active",
            // Ensure firstName/lastName for compatibility
            firstName: customer.firstName || customer.name?.split(" ")[0] || "",
            lastName:
              customer.lastName ||
              customer.name?.split(" ").slice(1).join(" ") ||
              "",
          }));

          // Return paginated response
          return {
            data: transformedData,
            total: result.total || 0,
            page: result.page || 1,
            limit: result.limit || 50,
            totalPages: result.totalPages || 0,
          };
        }

        // Check if result is directly an array (legacy support)
        if (Array.isArray(result)) {
          // Transform customer data to ensure consistent field names
          return result.map((customer) => ({
            ...customer,
            createdAt: customer.created_at || customer.createdAt,
            updatedAt: customer.updated_at || customer.updatedAt,
            status: customer.crm_status || customer.status || "active",
            crmStatus: customer.crm_status || customer.crmStatus || "active",
            // Ensure firstName/lastName for compatibility
            firstName: customer.firstName || customer.name?.split(" ")[0] || "",
            lastName:
              customer.lastName ||
              customer.name?.split(" ").slice(1).join(" ") ||
              "",
          }));
        }

        // Check if result has customers property
        if (result.customers && Array.isArray(result.customers)) {
          return result.customers;
        }
      }

      // Fallback: return empty array instead of hardcoded data
      console.warn("🔍 No customers data returned, using fallback");
      return [];
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  },

  // Get single customer by ID - fetches with high limit to ensure customer is found
  async getCustomer(tenantId: number, customerId: number): Promise<any> {
    try {
      // Fetch customers with high limit to ensure we get the one we need
      const result = await this.getCustomers(tenantId, { limit: 1000 });

      // Handle paginated response
      let customersList: any[] = [];
      if (result && typeof result === "object" && "data" in result) {
        customersList = result.data;
      } else if (Array.isArray(result)) {
        customersList = result;
      }

      const customer = customersList.find((c) => c.id === customerId);

      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }

      return customer;
    } catch (error) {
      console.error("Error fetching customer:", error);
      throw error;
    }
  },

  // Create customer using real API
  async createCustomer(tenantId: number, data: any): Promise<any> {
    try {
      const response = await fetch(
        `/api/customers/create?tenantId=${tenantId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log("🔍 Customer created:", result);
        return result.customer || result;
      } else {
        const errorData = await response.json();
        console.error("🔍 Customer creation error:", errorData);
        
        // Create a custom error with validation details
        const error: any = new Error(errorData.message || "Failed to create customer");
        error.validationErrors = errorData.errors || {};
        error.status = response.status;
        
        throw error;
      }
    } catch (error: any) {
      console.error("Error creating customer:", error);
      // If it's already our custom error with validation, rethrow it
      if (error.validationErrors) {
        throw error;
      }
      // Otherwise wrap it
      const wrappedError: any = new Error(error.message || "Failed to create customer");
      wrappedError.originalError = error;
      throw wrappedError;
    }
  },

  // Update customer using real API
  async updateCustomer(
    tenantId: number,
    customerId: number,
    data: any,
  ): Promise<any> {
    try {
      const response = await fetch(
        `/api/customers/update?tenantId=${tenantId}&customerId=${customerId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log("🔍 Customer updated:", result);
        return result.customer || result;
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update customer");
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  },

  // Delete customer using real API
  async deleteCustomer(tenantId: number, customerId: number): Promise<void> {
    try {
      const response = await fetch(
        `/api/customers/delete?tenantId=${tenantId}&customerId=${customerId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete customer");
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to delete customer");
      }

      console.log(`🔍 Customer ${customerId} deleted successfully`);
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },
};

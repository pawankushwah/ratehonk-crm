import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  email: string;
  role: string;
  tenantId?: number;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface Tenant {
  id: number;
  companyName: string;
  subdomain?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  logo?: string;
}

export interface AuthData {
  user: User;
  tenant?: Tenant;
  token: string;
}

export const auth = {
  async login(email: string, password: string): Promise<AuthData> {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await response.json();
    
    // Store token and cache authentication data (use both keys for compatibility)
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("token", data.token);
    localStorage.setItem("cached_auth_data", JSON.stringify(data));
    
    return data;
  },

  async register(formData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    contactPhone?: string;
    address?: string;
  }): Promise<AuthData> {
    const response = await apiRequest("POST", "/api/auth/register", formData);
    const data = await response.json();
    
    // Store token in localStorage (use both keys for compatibility)
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("token", data.token);
    
    return data;
  },

  async getCurrentUser(): Promise<AuthData | null> {
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (!token) return null;

      // Since /api/auth/verify has routing conflicts, use cached data from login
      // and fetch tenant settings directly for fresh data
      const cachedData = localStorage.getItem("cached_auth_data");
      if (!cachedData) {
        localStorage.removeItem("auth_token");
        return null;
      }

      const authData = JSON.parse(cachedData);
      
      // Try to get fresh tenant data from the working tenant settings endpoint
      try {
        const tenantResponse = await fetch("/api/tenant/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (tenantResponse.ok) {
          const tenantData = await tenantResponse.json();
          // Update cached data with fresh tenant information
          const updatedAuthData = {
            ...authData,
            tenant: {
              id: authData.tenant?.id || 1,
              companyName: tenantData.companyName,
              subdomain: tenantData.subdomain,
              contactEmail: tenantData.contactEmail,
              contactPhone: tenantData.contactPhone,
              address: tenantData.address,
              isActive: true,
              logo: tenantData.logo
            }
          };
          localStorage.setItem("cached_auth_data", JSON.stringify(updatedAuthData));
          return updatedAuthData;
        }
      } catch (error) {
        console.log("Could not fetch fresh tenant data, using cached data");
      }

      return authData;
    } catch (error) {
      // Fallback to cached data from login
      const cachedData = localStorage.getItem("cached_auth_data");
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      localStorage.removeItem("auth_token");
      return null;
    }
  },

  logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("cached_auth_data");
    window.location.href = "/login";
  },

  getToken(): string | null {
    return localStorage.getItem("token") || localStorage.getItem("auth_token");
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

import { apiRequest } from "./queryClient";

export interface SaasUser {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface SaasAuthData {
  user: SaasUser;
  token: string;
}

export const saasAuth = {
  async login(email: string, password: string): Promise<SaasAuthData> {
    const response = await apiRequest("POST", "/api/saas/auth/login", { email, password });
    const data = await response.json();
    
    if (!data.user || !data.token) {
      throw new Error("Invalid response from server");
    }
    
    // Store SaaS-specific tokens (separate from tenant auth)
    localStorage.setItem("saas_auth_token", data.token);
    localStorage.setItem("saas_cached_auth_data", JSON.stringify(data));
    
    return data;
  },

  async getCurrentUser(): Promise<SaasAuthData | null> {
    try {
      const token = localStorage.getItem("saas_auth_token");
      if (!token) return null;

      const cachedData = localStorage.getItem("saas_cached_auth_data");
      if (!cachedData) {
        localStorage.removeItem("saas_auth_token");
        return null;
      }

      return JSON.parse(cachedData);
    } catch (error) {
      localStorage.removeItem("saas_auth_token");
      localStorage.removeItem("saas_cached_auth_data");
      return null;
    }
  },

  logout() {
    localStorage.removeItem("saas_auth_token");
    localStorage.removeItem("saas_cached_auth_data");
    window.location.href = "/saas/login";
  },

  getToken(): string | null {
    return localStorage.getItem("saas_auth_token");
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};


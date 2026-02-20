import { apiRequest } from "./queryClient";

export interface PartnerUser {
  id: number;
  email: string;
  role: string;
  partnerId: number;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface PartnerAuthData {
  user: PartnerUser;
  token: string;
}

export const partnerAuth = {
  async login(email: string, password: string): Promise<PartnerAuthData> {
    const response = await apiRequest("POST", "/api/partner/auth/login", { email, password });
    const data = await response.json();

    if (!data.user || !data.token) {
      throw new Error("Invalid response from server");
    }

    localStorage.setItem("partner_auth_token", data.token);
    localStorage.setItem("partner_cached_auth_data", JSON.stringify(data));

    return data;
  },

  async getCurrentUser(): Promise<PartnerAuthData | null> {
    try {
      const token = localStorage.getItem("partner_auth_token");
      if (!token) return null;

      const cachedData = localStorage.getItem("partner_cached_auth_data");
      if (!cachedData) {
        localStorage.removeItem("partner_auth_token");
        return null;
      }

      return JSON.parse(cachedData);
    } catch (error) {
      localStorage.removeItem("partner_auth_token");
      localStorage.removeItem("partner_cached_auth_data");
      return null;
    }
  },

  logout() {
    localStorage.removeItem("partner_auth_token");
    localStorage.removeItem("partner_cached_auth_data");
    window.location.href = "/partner/login";
  },

  getToken(): string | null {
    return localStorage.getItem("partner_auth_token");
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

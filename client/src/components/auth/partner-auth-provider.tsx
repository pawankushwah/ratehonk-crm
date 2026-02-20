import { createContext, useContext, useEffect, useState } from "react";
import { partnerAuth, type PartnerUser } from "@/lib/partner-auth";

interface PartnerAuthContextType {
  user: PartnerUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const PartnerAuthContext = createContext<PartnerAuthContextType | undefined>(undefined);

export function PartnerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authData = await partnerAuth.getCurrentUser();
      if (authData) setUser(authData.user);
      else setUser(null);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const authData = await partnerAuth.login(email, password);
    setUser(authData.user);
  };

  const logout = () => {
    partnerAuth.logout();
    setUser(null);
  };

  return (
    <PartnerAuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
}

export function usePartnerAuth() {
  const context = useContext(PartnerAuthContext);
  if (context === undefined) {
    return {
      user: null,
      loading: true,
      login: async () => {},
      logout: () => {},
      isAuthenticated: false,
    };
  }
  return context;
}

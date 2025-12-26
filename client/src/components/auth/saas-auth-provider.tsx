import { createContext, useContext, useEffect, useState } from "react";
import { saasAuth, type SaasUser } from "@/lib/saas-auth";

interface SaasAuthContextType {
  user: SaasUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const SaasAuthContext = createContext<SaasAuthContextType | undefined>(undefined);

export function SaasAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SaasUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authData = await saasAuth.getCurrentUser();
      if (authData) {
        setUser(authData.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("SaasAuthProvider - Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const authData = await saasAuth.login(email, password);
    setUser(authData.user);
  };

  const logout = () => {
    saasAuth.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <SaasAuthContext.Provider value={value}>{children}</SaasAuthContext.Provider>;
}

export function useSaasAuth() {
  const context = useContext(SaasAuthContext);
  if (context === undefined) {
    console.warn("useSaasAuth called outside SaasAuthProvider context, using fallback state");
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


import { createContext, useContext, useEffect, useState } from "react";
import { auth, type User, type Tenant } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  setAuthData: (authData: { user: User; tenant?: Tenant | null }) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log("🔍 AuthProvider - Checking current auth status...");
      const authData = await auth.getCurrentUser();
      if (authData) {
        console.log("🔍 AuthProvider - Auth check successful, user:", authData.user?.email, "tenant:", authData.tenant?.id);
        setUser(authData.user);
        setTenant(authData.tenant || null);
      } else {
        console.log("🔍 AuthProvider - No auth data found");
        // Clear any stale data
        setUser(null);
        setTenant(null);
      }
    } catch (error) {
      console.error("🔍 AuthProvider - Auth check failed:", error);
      setUser(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log("🔍 AuthProvider - Login attempt for:", email);
    const authData = await auth.login(email, password);
    console.log("🔍 AuthProvider - Login successful, user:", authData.user?.email, "tenant:", authData.tenant?.id);
    setUser(authData.user);
    setTenant(authData.tenant || null);
  };

  const setAuthData = (authData: { user: User; tenant?: Tenant | null }) => {
    console.log("🔍 AuthProvider - Setting auth data directly, user:", authData.user?.email, "tenant:", authData.tenant?.id);
    setUser(authData.user);
    setTenant(authData.tenant || null);
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    setTenant(null);
  };

  const value = {
    user,
    tenant,
    loading,
    login,
    setAuthData,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During hot reload, the context might temporarily be undefined
    // Return a fallback state to prevent crashes
    console.warn("useAuth called outside AuthProvider context, using fallback state");
    return {
      user: null,
      tenant: null,
      loading: true,
      login: async () => {},
      setAuthData: () => {},
      logout: () => {},
      isAuthenticated: false,
    };
  }
  return context;
}

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface UserPermissions {
  userId: number;
  role: string;
  rolePermissions?: Record<string, string[]>;
}

// Mock function to get current user from auth context
const getCurrentUser = (): UserPermissions | null => {
  // This should come from your auth context
  // For now, returning a mock admin user
  return {
    userId: 22,
    role: "tenant_admin",
    rolePermissions: {}
  };
};

export const usePermissions = () => {
  const currentUser = getCurrentUser();

  const { data: permissions } = useQuery({
    queryKey: [`/api/users/${currentUser?.userId}/permissions`],
    queryFn: async () => {
      if (!currentUser) return null;
      // For tenant admins, return all permissions
      if (currentUser.role === 'tenant_admin') {
        return {
          hasAllPermissions: true,
          permissions: {}
        };
      }
      return currentUser.rolePermissions || {};
    },
    enabled: !!currentUser
  });

  const hasPermission = (page: string, action: string): boolean => {
    if (!currentUser) return false;
    
    // Tenant admins have all permissions
    if (currentUser.role === 'tenant_admin') return true;
    
    // Check role-based permissions
    if (permissions && permissions[page]) {
      return permissions[page].includes(action);
    }
    
    return false;
  };

  const checkPermission = async (page: string, action: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      const response = await apiRequest(`/api/users/${currentUser.userId}/permissions/${page}/${action}`);
      return response.hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  return {
    hasPermission,
    checkPermission,
    currentUser,
    isLoading: !currentUser
  };
};

// Higher-order component for permission-based route protection
export const withPermissions = (Component: React.ComponentType, requiredPage: string, requiredAction: string) => {
  return (props: any) => {
    const { hasPermission } = usePermissions();
    
    if (!hasPermission(requiredPage, requiredAction)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};
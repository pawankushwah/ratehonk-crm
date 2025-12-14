import { useAuth } from "@/components/auth/auth-provider";
import { hasPermission, PermissionAction } from "@shared/permissions";
import { useQuery } from "@tanstack/react-query";

export function usePermissions() {
  const { user, tenant } = useAuth();
  
  // Fetch user permissions from backend based on their role
  const { data: userPermissions = {}, isLoading, error } = useQuery({
    queryKey: [`/api/users/${user?.id}/permissions`, user?.id, tenant?.id],
    queryFn: async () => {
      if (!user?.id || !tenant?.id) {
        console.warn("Missing user or tenant ID");
        return {};
      }
      
      try {
        // Get users list and find current user to get roleId
        const usersResponse = await fetch(`/api/tenants/${tenant.id}/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (!usersResponse.ok) {
          console.error("Failed to fetch users:", usersResponse.statusText);
          // Return empty but don't block access - allow by default if API fails
          return { allowByDefault: true };
        }
        
        const users = await usersResponse.json();
        const userData = Array.isArray(users) ? users.find((u: any) => u.id === user.id) : null;
        
        if (!userData) {
          console.warn("Current user not found in users list");
          // Allow access by default if user not found
          return { allowByDefault: true };
        }
        
        const roleId = userData.roleId;
        
        if (!roleId) {
          console.warn("User has no role assigned");
          // Allow access by default if no role assigned
          return { allowByDefault: true };
        }
        
        // Get role permissions
        const roleResponse = await fetch(`/api/tenants/${tenant.id}/roles/${roleId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (!roleResponse.ok) {
          console.error("Failed to fetch role:", roleResponse.statusText);
          // Allow access by default if role fetch fails
          return { allowByDefault: true };
        }
        
        const roleData = await roleResponse.json();
        
        // Parse permissions if it's a JSON string
        let permissions = roleData.permissions || {};
        if (typeof permissions === 'string') {
          try {
            permissions = JSON.parse(permissions);
          } catch (e) {
            console.error("Failed to parse permissions:", e);
            permissions = {};
          }
        }
        
        // Check if role is owner/default role
        if (roleData.is_default === true) {
          // Owner role has all permissions
          console.log("✅ User has owner role - full access");
          return { hasAllPermissions: true, permissions: {} };
        }
        
        console.log("✅ Fetched permissions for user:", user.id, "role:", roleData.name, "permissions:", permissions);
        return permissions;
      } catch (error) {
        console.error("Error fetching permissions:", error);
        // Allow access by default on error
        return { allowByDefault: true };
      }
    },
    enabled: !!user?.id && !!tenant?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Retry once on failure
  });
  
  const checkPermission = (page: string, action: PermissionAction): boolean => {
    if (!user) {
      console.log("❌ No user found");
      return false;
    }
    
    // While loading, allow access (to prevent blocking users while permissions load)
    if (isLoading) {
      console.log("⏳ Permissions loading - allowing access temporarily");
      return true;
    }
    
    // If error or allowByDefault flag, allow access
    if (error || (userPermissions as any)?.allowByDefault) {
      console.log("⚠️ Permission check error or default allow - granting access");
      return true;
    }
    
    // Check if user has all permissions (owner role)
    if ((userPermissions as any)?.hasAllPermissions) {
      console.log("✅ User has all permissions");
      return true;
    }
    
    // Check role-based permissions
    const permissions = (userPermissions as any)?.permissions || userPermissions;
    const hasPerm = hasPermission(permissions, page, action);
    console.log(`🔍 Permission check for ${page}.${action}:`, hasPerm, "permissions:", permissions);
    return hasPerm;
  };
  
  const canView = (page: string) => checkPermission(page, "view");
  const canEdit = (page: string) => checkPermission(page, "edit");
  const canCreate = (page: string) => checkPermission(page, "create");
  const canDelete = (page: string) => checkPermission(page, "delete");
  
  return {
    checkPermission,
    canView,
    canEdit,
    canCreate,
    canDelete,
    userPermissions,
    isLoading
  };
}
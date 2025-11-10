import { useAuth } from "@/components/auth/auth-provider";
import { hasPermission, PermissionAction } from "@shared/permissions";

export function usePermissions() {
  const { user } = useAuth();
  
  // Get user permissions from their role - we'll need to fetch this from the backend
  const userPermissions = user?.permissions || {};
  
  const checkPermission = (page: string, action: PermissionAction): boolean => {
    // Owner role always has full access
    console.log("Checking permissions for user:", user ? userPermissions : "Not found");
    if (user?.role === "saas_owner" || user?.role === "tenant_admin") {
      return true;
    }
    return hasPermission(userPermissions, page, action);
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
    userPermissions
  };
}
import React from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { PermissionAction } from "@shared/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";

interface PermissionGuardProps {
  page: string;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function PermissionGuard({ 
  page, 
  action, 
  children, 
  fallback = null, 
  showError = false 
}: PermissionGuardProps) {
  const { checkPermission } = usePermissions();
  
  const hasAccess = checkPermission(page, action);
  
  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to {action} {page}. Contact your administrator for access.
          </AlertDescription>
        </Alert>
      );
    }
    return fallback as React.ReactElement;
  }
  
  return <>{children}</>;
}

// Higher-order component for page-level protection
export function withPermission(
  Component: React.ComponentType<any>,
  page: string,
  action: PermissionAction = "view"
) {
  return function PermissionProtectedComponent(props: any) {
    return (
      <PermissionGuard page={page} action={action} showError>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}
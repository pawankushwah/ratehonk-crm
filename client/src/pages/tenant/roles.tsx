import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Users, Shield, Check, X, List, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { Layout } from "@/components/layout/layout";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface Role {
  id: number;
  tenantId: number;
  name: string;
  description: string;
  permissions: Record<string, string[]>;
  isActive: boolean;
  isDefault: boolean;
  parentRoleId?: number | null;
  parentRoleName?: string | null;
  hierarchyLevel?: number;
  createdAt: string;
  updatedAt: string;
}

import { getAvailablePages } from "@shared/permissions";

// Auto-sync with menu items - this will automatically include any new pages added to the system
const AVAILABLE_PAGES = getAvailablePages();

function RolesPageContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("list");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: {} as Record<string, string[]>,
    parentRoleId: null as number | null
  });

  // Get tenant ID from auth context
  const tenantId = tenant?.id;

  // Debug logging
  useEffect(() => {
    console.log('🔍 Roles Page - Tenant ID:', tenantId);
    console.log('🔍 Roles Page - Tenant object:', tenant);
    console.log('🔍 Roles Page - Auth loading:', authLoading);
  }, [tenantId, tenant, authLoading]);

  // Fetch roles
  const queryEnabled = !!tenantId && !authLoading;
  
  useEffect(() => {
    console.log('🔍 Query enabled check:', {
      tenantId,
      authLoading,
      queryEnabled,
      'tenant?.id': tenant?.id
    });
  }, [tenantId, authLoading, queryEnabled, tenant]);

  const { data: rolesData, isLoading, error, refetch } = useQuery<Role[]>({
    queryKey: ['roles', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        console.error('🔍 No tenantId, cannot fetch roles');
        return [];
      }
      console.log('🔍 ✅ QUERY FUNCTION CALLED - Fetching roles for tenant:', tenantId);
      const res = await fetch(`/api/tenants/${tenantId}/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      console.log('🔍 Roles API response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('🔍 Roles API error:', errorText);
        throw new Error(`Failed to fetch roles: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      console.log('🔍 Roles API data:', data);
      console.log('🔍 Roles API data (stringified):', JSON.stringify(data, null, 2));
      console.log('🔍 Roles count:', Array.isArray(data) ? data.length : 0);
      if (Array.isArray(data) && data.length > 0) {
        console.log('🔍 First role structure:', data[0]);
        console.log('🔍 First role keys:', Object.keys(data[0]));
      }
      return Array.isArray(data) ? data : [];
    },
    enabled: !!tenantId && !authLoading,
    retry: 1
  });

  // Debug query state
  useEffect(() => {
    console.log('🔍 Query state:', {
      isLoading,
      error: error?.message,
      dataLength: rolesData?.length,
      queryEnabled,
      tenantId
    });
  }, [isLoading, error, rolesData, queryEnabled, tenantId]);

  const roles = Array.isArray(rolesData) ? rolesData : [];
  
  useEffect(() => {
    console.log('🔍 Roles array after processing:', roles);
    console.log('🔍 Roles array length:', roles.length);
    if (roles.length > 0) {
      console.log('🔍 First role in array:', roles[0]);
      console.log('🔍 First role type check:', {
        hasId: 'id' in roles[0],
        hasName: 'name' in roles[0],
        hasIsActive: 'isActive' in roles[0],
        hasIsDefault: 'isDefault' in roles[0]
      });
    }
  }, [roles]);

  // Fetch users to count how many users have each role
  const { data: users = [] } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/users`],
    enabled: !!tenantId
  });

  // Fetch available parent roles for create/edit
  const queryEnabledForParents = !!tenantId && (isCreateDialogOpen || isEditDialogOpen);
  
  useEffect(() => {
    console.log('🔍 Available parent roles query state:', {
      tenantId,
      isCreateDialogOpen,
      isEditDialogOpen,
      queryEnabledForParents,
      selectedRoleId: selectedRole?.id || "new"
    });
  }, [tenantId, isCreateDialogOpen, isEditDialogOpen, queryEnabledForParents, selectedRole]);

  const { data: availableParentRolesData, isLoading: isLoadingParents } = useQuery({
    queryKey: ['available-parent-roles', tenantId, selectedRole?.id || "new"],
    queryFn: async () => {
      const roleIdParam = selectedRole?.id || "new";
      console.log('🔍 ✅ FETCHING available parent roles for roleId:', roleIdParam, 'tenantId:', tenantId);
      const res = await fetch(`/api/tenants/${tenantId}/roles/${roleIdParam}/available-parents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      console.log('🔍 Available parent roles API response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('🔍 Available parent roles API error:', errorText);
        throw new Error('Failed to fetch available parent roles');
      }
      const data = await res.json();
      console.log('🔍 Available parent roles data:', data);
      console.log('🔍 Available parent roles data (stringified):', JSON.stringify(data, null, 2));
      console.log('🔍 Available parent roles count:', Array.isArray(data) ? data.length : 0);
      if (Array.isArray(data) && data.length > 0) {
        console.log('🔍 First available parent role:', data[0]);
        console.log('🔍 All role names:', data.map((r: any) => r.name));
      }
      return Array.isArray(data) ? data : [];
    },
    enabled: queryEnabledForParents,
    initialData: []
  });

  const availableParentRoles = Array.isArray(availableParentRolesData) ? availableParentRolesData : [];
  
  useEffect(() => {
    console.log('🔍 Available parent roles array:', availableParentRoles);
    console.log('🔍 Available parent roles array length:', availableParentRoles.length);
  }, [availableParentRoles]);

  // Count users per role
  const getUserCountForRole = (roleId: number) => {
    return users.filter((user: any) => user.roleId === roleId).length;
  };

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (roleData: any) => 
      fetch(`/api/tenants/${tenantId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(roleData)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenantId}/roles`] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Role created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive"
      });
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, ...roleData }: any) => 
      fetch(`/api/tenants/${tenantId}/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(roleData)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenantId}/roles`] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Role updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive"
      });
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) => 
      fetch(`/api/tenants/${tenantId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenantId}/roles`] });
      toast({
        title: "Success",
        description: "Role deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: {},
      parentRoleId: null
    });
    setSelectedRole(null);
  };

  const handleCreateRole = () => {
    createRoleMutation.mutate(formData);
  };

  const handleUpdateRole = () => {
    if (selectedRole) {
      updateRoleMutation.mutate({
        roleId: selectedRole.id,
        ...formData
      });
    }
  };

  const handleEditRole = (role: Role) => {
    if (role.isDefault) {
      toast({
        title: "Cannot Edit Owner Role",
        description: "The Owner role cannot be modified as it provides full system access.",
        variant: "destructive"
      });
      return;
    }
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      parentRoleId: role.parentRoleId || null
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteRole = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isDefault) {
      toast({
        title: "Cannot Delete Owner Role",
        description: "The Owner role cannot be deleted as it's required for system administration.",
        variant: "destructive"
      });
      return;
    }
    if (confirm("Are you sure you want to delete this role?")) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  const handlePermissionChange = (page: string, action: string, checked: boolean) => {
    setFormData(prev => {
      const newPermissions = { ...prev.permissions };
      if (!newPermissions[page]) {
        newPermissions[page] = [];
      }
      
      if (checked) {
        if (!newPermissions[page].includes(action)) {
          newPermissions[page].push(action);
        }
      } else {
        newPermissions[page] = newPermissions[page].filter(a => a !== action);
        if (newPermissions[page].length === 0) {
          delete newPermissions[page];
        }
      }
      
      return { ...prev, permissions: newPermissions };
    });
  };

  const getPermissionCount = (role: Role) => {
    return Object.values(role.permissions).reduce((total, actions) => total + actions.length, 0);
  };

  const handleSelectAllPermissions = () => {
    const allPermissions: Record<string, string[]> = {};
    Object.entries(AVAILABLE_PAGES).forEach(([pageKey, pageConfig]) => {
      allPermissions[pageKey] = [...pageConfig.actions];
    });
    setFormData(prev => ({ ...prev, permissions: allPermissions }));
    toast({
      title: "All Permissions Selected",
      description: "All available permissions have been granted to this role"
    });
  };

  const handleDeselectAllPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: {} }));
    toast({
      title: "All Permissions Cleared",
      description: "All permissions have been removed from this role"
    });
  };

  // Build hierarchy tree structure
  const buildRoleHierarchy = () => {
    const roleMap = new Map<number, Role & { children: Role[] }>();
    const rootRoles: (Role & { children: Role[] })[] = [];

    // Initialize all roles with empty children array
    roles.forEach(role => {
      roleMap.set(role.id, { ...role, children: [] });
    });

    // Build parent-child relationships
    roles.forEach(role => {
      const roleWithChildren = roleMap.get(role.id)!;
      if (role.parentRoleId && roleMap.has(role.parentRoleId)) {
        const parent = roleMap.get(role.parentRoleId)!;
        parent.children.push(roleWithChildren);
      } else {
        rootRoles.push(roleWithChildren);
      }
    });

    // Sort children by hierarchy level recursively
    const sortChildren = (role: Role & { children: Role[] }) => {
      role.children.sort((a, b) => (a.hierarchyLevel ?? 999) - (b.hierarchyLevel ?? 999));
      role.children.forEach((child) => {
        const childWithChildren = child as Role & { children: Role[] };
        if (childWithChildren.children) {
          sortChildren(childWithChildren);
        }
      });
    };

    rootRoles.forEach(sortChildren);
    rootRoles.sort((a, b) => (a.hierarchyLevel ?? 999) - (b.hierarchyLevel ?? 999));

    return rootRoles;
  };

  // Render organizational chart style tree node
  const renderOrgChartNode = (role: Role & { children: Role[] }, level: number = 0, index: number = 0, totalSiblings: number = 1) => {
    const hasChildren = role.children.length > 0;
    
    // Convert to Role type for handleEditRole
    const roleForEdit: Role = {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive,
      isDefault: role.isDefault,
      parentRoleId: role.parentRoleId,
      parentRoleName: role.parentRoleName,
      hierarchyLevel: role.hierarchyLevel,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    };

    // Use neutral colors for all nodes (no highlight colors)
    const nodeStyles = {
      bg: 'bg-white',
      border: 'border-gray-300',
      text: 'text-gray-900',
      icon: 'text-gray-600',
      hover: 'hover:border-gray-400'
    };

    return (
      <div key={role.id} className="flex flex-col items-center">
        {/* Node Box */}
        <div className={`relative ${nodeStyles.bg} ${nodeStyles.border} ${nodeStyles.hover} border rounded-lg p-4 w-[280px] flex-shrink-0 transition-all ${nodeStyles.text}`}>
          {/* Action buttons - Top right */}
          {!role.isDefault && (
            <div className="absolute top-3 right-3 flex gap-1.5 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditRole(roleForEdit)}
                className="h-6 w-6 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRole(role.id)}
                className="h-6 w-6 p-0 text-gray-600 hover:text-red-600 hover:bg-gray-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          
          {/* Content */}
          <div className="flex items-start gap-3 pr-8">
            {/* Shield Icon */}
            <div className={`${nodeStyles.icon} flex-shrink-0 mt-0.5`}>
              <Shield className="h-6 w-6" />
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              {/* Role Title */}
              <div className="font-bold text-base mb-1.5 leading-tight text-gray-900 pr-2">
                {role.name}
              </div>
              
              {/* Description */}
              <div className="text-sm text-gray-600 leading-relaxed mb-2.5 line-clamp-2">
                {role.description || role.name}
              </div>
              
              {/* User Count */}
              <div className="text-xs text-gray-500">
                {getUserCountForRole(role.id)} users
              </div>
            </div>
          </div>
        </div>

        {/* Vertical line down from node if it has children */}
        {hasChildren && (
          <>
            <div className="h-8 w-0.5 bg-gray-300 mx-auto"></div>
            {/* Container for horizontal line and children */}
            {/* Calculate width: node width (280px) + gap (48px) per child, minimum 400px */}
            <div className="relative flex justify-center" style={{ 
              width: `${Math.max(400, role.children.length * 280 + (role.children.length - 1) * 48 + 100)}px` 
            }}>
              {/* Horizontal connector line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-300"></div>
              
              {/* Children nodes */}
              <div className="flex items-start justify-center gap-12 pt-2">
                {(role.children as (Role & { children: Role[] })[]).map((child, childIndex) => (
                  <div key={child.id} className="flex flex-col items-center flex-shrink-0">
                    {/* Vertical line up from child to horizontal line */}
                    <div className="h-8 w-0.5 bg-gray-300"></div>
                    {/* Render child node */}
                    {renderOrgChartNode(child, level + 1, childIndex, role.children.length)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <p className="text-sm text-gray-500">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tenant Found</h3>
          <p className="text-gray-600">Please ensure you are logged in and have a tenant assigned.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Roles</h3>
          <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : 'Failed to load roles'}</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Tenant ID: {tenantId || 'Not available'}</p>
            <p className="text-sm text-gray-500">Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
            <p className="text-sm text-gray-500">Query Enabled: {queryEnabled ? 'Yes' : 'No'}</p>
          </div>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-gray-600 mt-2">Manage user roles and permissions for your organization</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Sales Manager"
                  />
                </div>
                <div>
                  <Label htmlFor="parentRole">Parent Role (Optional)</Label>
                  <Select
                    value={formData.parentRoleId?.toString() || "none"}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      parentRoleId: value === "none" ? null : parseInt(value)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {isLoadingParents ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        <>
                          {Array.isArray(availableParentRoles) && availableParentRoles.length > 0 ? (
                            availableParentRoles.map((role: any) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name} {role.hierarchy_level !== undefined && `(Level ${role.hierarchy_level})`}
                              </SelectItem>
                            ))
                          ) : (
                            // Fallback: show all roles if available parent roles is empty
                            Array.isArray(roles) && roles.map((role: Role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name} {role.hierarchyLevel !== undefined && `(Level ${role.hierarchyLevel})`}
                              </SelectItem>
                            ))
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a parent role to create a hierarchy. This role will be one level below the parent.
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this role's responsibilities"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Label className="text-lg font-semibold">Permissions</Label>
                    <p className="text-sm text-gray-600">Select the pages and actions this role can access</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={handleSelectAllPermissions}
                      data-testid="button-select-all-permissions"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Select All
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={handleDeselectAllPermissions}
                      data-testid="button-deselect-all-permissions"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(AVAILABLE_PAGES).map(([pageKey, pageConfig]) => (
                    <Card key={pageKey}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{pageConfig.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {pageConfig.actions.map(action => (
                          <div key={action} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${pageKey}-${action}`}
                              checked={formData.permissions[pageKey]?.includes(action) || false}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(pageKey, action, checked as boolean)
                              }
                            />
                            <Label htmlFor={`${pageKey}-${action}`} className="capitalize">
                              {action}
                            </Label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateRole}
                  disabled={createRoleMutation.isPending || !formData.name}
                >
                  {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{roles.length}</div>
            <p className="text-xs text-gray-500 mt-1">Configured in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {roles.filter(r => r.isActive).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Available for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <p className="text-xs text-gray-500 mt-1">Across all roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Available Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(AVAILABLE_PAGES).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">System modules</p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sales Manager"
                />
              </div>
              <div>
                <Label htmlFor="edit-parentRole">Parent Role (Optional)</Label>
                <Select
                  value={formData.parentRoleId?.toString() || "none"}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    parentRoleId: value === "none" ? null : parseInt(value)
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {isLoadingParents ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      <>
                        {Array.isArray(availableParentRoles) && availableParentRoles.length > 0 ? (
                          availableParentRoles.map((role: any) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name} {role.hierarchy_level !== undefined && `(Level ${role.hierarchy_level})`}
                            </SelectItem>
                          ))
                        ) : (
                          // Fallback: show all roles if available parent roles is empty
                          Array.isArray(roles) && roles.map((role: Role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name} {role.hierarchyLevel !== undefined && `(Level ${role.hierarchyLevel})`}
                            </SelectItem>
                          ))
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a parent role to create a hierarchy. This role will be one level below the parent.
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this role's responsibilities"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Label className="text-lg font-semibold">Permissions</Label>
                  <p className="text-sm text-gray-600">Select the pages and actions this role can access</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAllPermissions}
                    data-testid="button-edit-select-all-permissions"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Select All
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={handleDeselectAllPermissions}
                    data-testid="button-edit-deselect-all-permissions"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(AVAILABLE_PAGES).map(([pageKey, pageConfig]) => (
                  <Card key={pageKey}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{pageConfig.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {pageConfig.actions.map(action => (
                        <div key={action} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-${pageKey}-${action}`}
                            checked={formData.permissions[pageKey]?.includes(action) || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(pageKey, action, checked as boolean)
                            }
                          />
                          <Label htmlFor={`edit-${pageKey}-${action}`} className="capitalize">
                            {action}
                          </Label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRole}
                disabled={updateRoleMutation.isPending || !formData.name}
              >
                {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs for List and Hierarchy views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Hierarchy View
          </TabsTrigger>
        </TabsList>

        {/* List View Tab */}
        <TabsContent value="list" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role: Role) => (
          <Card key={role.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className={`h-5 w-5 ${role.isDefault ? 'text-amber-600' : 'text-blue-600'}`} />
                    {role.name}
                    {role.isDefault && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        Owner
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {role.description || "No description provided"}
                  </CardDescription>
                  {role.parentRoleName && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Reports to: {role.parentRoleName}
                      </Badge>
                    </div>
                  )}
                  {role.hierarchyLevel !== undefined && (
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Hierarchy Level: {role.hierarchyLevel}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex space-x-1">
                  {!role.isDefault ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="opacity-50 cursor-not-allowed"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="opacity-50 cursor-not-allowed text-gray-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Badge variant="secondary" className="ml-2">
                        Protected
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* User Count */}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Users with this role</span>
                  </div>
                  <Badge variant="default" className="bg-blue-600">
                    {getUserCountForRole(role.id)}
                  </Badge>
                </div>

                {/* Permissions Count */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Permissions</span>
                  <Badge variant="secondary">
                    {getPermissionCount(role)} permissions
                  </Badge>
                </div>
                
                {/* Permission Preview */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700 uppercase">Permission Preview</div>
                  {Object.entries(role.permissions).slice(0, 3).map(([page, actions]) => {
                    const actionsArray = Array.isArray(actions) ? actions : [];
                    return (
                      <div key={page} className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium text-gray-700">{AVAILABLE_PAGES[page as keyof typeof AVAILABLE_PAGES]?.name || page}</span>
                        <div className="flex space-x-1">
                          {actionsArray.map(action => (
                            <Badge key={action} variant="outline" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(role.permissions).length > 3 && (
                    <div className="text-xs text-gray-500 italic">
                      +{Object.keys(role.permissions).length - 3} more modules...
                    </div>
                  )}
                </div>
                
              </div>
            </CardContent>
          </Card>
        ))}
          {roles.length === 0 && (
            <div className="text-center py-12 col-span-full">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No roles found</h3>
              <p className="text-gray-600 mb-4">Create your first role to get started with user management.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </div>
          )}
        </div>
        </TabsContent>

        {/* Hierarchy View Tab */}
        <TabsContent value="hierarchy" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Role Hierarchy</CardTitle>
              <CardDescription>
                Visual representation of role hierarchy and reporting structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No roles found</h3>
                  <p className="text-gray-600 mb-4">Create your first role to see the hierarchy.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                  </Button>
                </div>
              ) : (
                <div className="relative py-12 overflow-x-auto w-full">
                  <div className="flex justify-center items-start px-12 min-w-full">
                    {buildRoleHierarchy().map((role, index) => 
                      <div key={role.id} className="group flex-shrink-0">
                        {renderOrgChartNode(role, 0, index, buildRoleHierarchy().length)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function RolesPage() {
  return (
    <Layout>
      <RolesPageContent />
    </Layout>
  );
}
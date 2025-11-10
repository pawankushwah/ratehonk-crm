import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Users, Shield, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  createdAt: string;
  updatedAt: string;
}

import { getAvailablePages } from "@shared/permissions";

// Auto-sync with menu items - this will automatically include any new pages added to the system
const AVAILABLE_PAGES = getAvailablePages();

function RolesPageContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: {} as Record<string, string[]>
  });

  // Get tenant ID from auth context
  const tenantId = tenant?.id;

  // Fetch roles
  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: [`/api/tenants/${tenantId}/roles`],
    queryFn: () =>
      fetch(`/api/tenants/${tenantId}/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }).then(res => res.json()),
    enabled: !!tenantId
  });

  // Fetch users to count how many users have each role
  const { data: users = [] } = useQuery({
    queryKey: [`/api/tenants/${tenantId}/users`],
    enabled: !!tenantId
  });

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
      permissions: {}
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
      permissions: role.permissions
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this role's responsibilities"
                  />
                </div>
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
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this role's responsibilities"
                />
              </div>
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

      {/* Roles Grid */}
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
                  {Object.entries(role.permissions).slice(0, 3).map(([page, actions]) => (
                    <div key={page} className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium text-gray-700">{AVAILABLE_PAGES[page as keyof typeof AVAILABLE_PAGES]?.name || page}</span>
                      <div className="flex space-x-1">
                        {actions.map(action => (
                          <Badge key={action} variant="outline" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
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
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12">
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
  );
}

export default function RolesPage() {
  return (
    <Layout>
      <RolesPageContent />
    </Layout>
  );
}
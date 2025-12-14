import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Mail, Phone, UserCheck, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { Layout } from "@/components/layout/layout";
import { Link } from "wouter";
import { CheckSquare, Crown, UsersIcon } from "lucide-react";

interface User {
  id: number;
  email: string;
  role: string;
  tenantId: number;
  roleId: number | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roleName: string | null;
  reportingUserId?: number | null;
  reportingUserName?: string | null;
  workload?: {
    leads: number;
    customers: number;
    activeTasks: number;
    total: number;
  };
}


interface Role {
  id: number;
  name: string;
  description: string;
  hierarchyLevel?: number;
  parentRoleId?: number | null;
}

function UsersPageContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userViewTab, setUserViewTab] = useState("list");
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    roleId: "" as string | number,
    reportingUserId: "" as string | number | null,
    isActive: true
  });

  // Get tenant ID from auth context
  const tenantId = tenant?.id;

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: [`/api/tenants/${tenantId}/users`],
    queryFn: () =>
      fetch(`/api/tenants/${tenantId}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }).then(res => res.json()),
    enabled: !!tenantId
  });

  // Fetch roles for dropdown
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: [`/api/tenants/${tenantId}/roles`],
    queryFn: () =>
      fetch(`/api/tenants/${tenantId}/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }).then(res => res.json()),
    enabled: !!tenantId
  });

  // Get selected role details
  const selectedRole = formData.roleId && formData.roleId !== "" 
    ? roles.find((r: Role) => r.id.toString() === formData.roleId.toString())
    : null;

  // Filter users who can be reporting users (only users with the parent role of the selected role)
  const availableReportingUsers = useMemo(() => {
    if (!selectedRole || !users.length) {
      console.log("🔍 No selectedRole or users:", { selectedRole, usersLength: users.length });
      return [];
    }
    
    console.log("🔍 Selected role:", selectedRole);
    
    // If selected role has no parent role, no reporting users available
    if (!selectedRole.parentRoleId) {
      console.log("⚠️ Selected role has no parentRoleId:", selectedRole.name);
      return [];
    }
    
    console.log("🔍 Looking for users with parent role ID:", selectedRole.parentRoleId);
    
    // Filter users to only show those with the parent role
    const filteredUsers = users.filter((user: User) => {
      if (!user.roleId) return false;
      const matches = user.roleId === selectedRole.parentRoleId && user.isActive;
      if (matches) {
        console.log("✅ Found matching user:", user.firstName, user.lastName, "roleId:", user.roleId);
      }
      return matches;
    });

    console.log("🔍 Filtered users count:", filteredUsers.length);

    // If editing a user, include their current reporting user even if they don't meet criteria
    if (selectedUser && selectedUser.reportingUserId) {
      const currentReportingUser = users.find((u: User) => u.id === selectedUser.reportingUserId);
      if (currentReportingUser && !filteredUsers.find((u: User) => u.id === currentReportingUser.id)) {
        filteredUsers.push(currentReportingUser);
      }
    }

    return filteredUsers;
  }, [users, roles, selectedRole, selectedUser]);


  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch(`/api/tenants/${tenantId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create user');
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenantId}/users`] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "User Created Successfully",
        description: `Welcome email sent to ${data.email || formData.email}. Temporary password: ${data.temporaryPassword || 'Generated automatically'}`
      });
    },
    onError: (error: any) => {
      console.error('User creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, ...userData }: any) => 
      fetch(`/api/tenants/${tenantId}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(userData)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenantId}/users`] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "User updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
    }
  });

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: (userId: number) => 
      fetch(`/api/tenants/${tenantId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${tenantId}/users`] });
      toast({
        title: "Success",
        description: "User deactivated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate user",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      roleId: "",
      reportingUserId: null,
      isActive: true
    });
    setSelectedUser(null);
  };

  const handleCreateUser = () => {
    createUserMutation.mutate({
      ...formData,
      roleId: formData.roleId ? parseInt(formData.roleId as string) : null,
      reportingUserId: formData.reportingUserId ? parseInt(formData.reportingUserId as string) : null
    });
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      updateUserMutation.mutate({
        userId: selectedUser.id,
        ...formData,
        roleId: formData.roleId ? parseInt(formData.roleId as string) : null,
        reportingUserId: formData.reportingUserId ? parseInt(formData.reportingUserId as string) : null
      });
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || "",
      roleId: user.roleId || "",
      reportingUserId: user.reportingUserId || null,
      isActive: user.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleDeactivateUser = (userId: number) => {
    if (confirm("Are you sure you want to deactivate this user? They will no longer be able to access the system.")) {
      deactivateUserMutation.mutate(userId);
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (!user.isEmailVerified) {
      return <Badge variant="outline">Email Pending</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  // Build user hierarchy tree structure
  const buildUserHierarchy = (): Array<User & { children: User[] }> => {
    const userMap = new Map<number, User & { children: User[] }>();
    
    // Initialize all users with empty children arrays
    users.forEach((user: User) => {
      userMap.set(user.id, { ...user, children: [] });
    });

    // Build parent-child relationships
    const rootUsers: Array<User & { children: User[] }> = [];
    
    users.forEach((user: User) => {
      const userNode = userMap.get(user.id)!;
      
      if (user.reportingUserId) {
        const parent = userMap.get(user.reportingUserId);
        if (parent) {
          parent.children.push(userNode);
        } else {
          // Parent not found, treat as root
          rootUsers.push(userNode);
        }
      } else {
        // No reporting user, this is a root user
        rootUsers.push(userNode);
      }
    });

    // Sort root users by role hierarchy level, then by name
    rootUsers.sort((a, b) => {
      const roleA = roles.find((r: Role) => r.id === a.roleId);
      const roleB = roles.find((r: Role) => r.id === b.roleId);
      const levelA = roleA?.hierarchyLevel ?? 999;
      const levelB = roleB?.hierarchyLevel ?? 999;
      if (levelA !== levelB) return levelA - levelB;
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });

    // Sort children recursively
    const sortChildren = (node: User & { children: User[] }) => {
      node.children.sort((a, b) => {
        const roleA = roles.find((r: Role) => r.id === a.roleId);
        const roleB = roles.find((r: Role) => r.id === b.roleId);
        const levelA = roleA?.hierarchyLevel ?? 999;
        const levelB = roleB?.hierarchyLevel ?? 999;
        if (levelA !== levelB) return levelA - levelB;
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });
      node.children.forEach(sortChildren);
    };

    rootUsers.forEach(sortChildren);
    return rootUsers;
  };

  // Render user hierarchy node (similar to roles hierarchy)
  const renderUserHierarchyNode = (user: User & { children: User[] }, level: number = 0, index: number = 0, totalSiblings: number = 1) => {
    const hasChildren = user.children.length > 0;
    
    const nodeStyles = {
      bg: 'bg-white',
      border: 'border-gray-300',
      text: 'text-gray-900',
      icon: 'text-gray-600',
      hover: 'hover:border-gray-400'
    };

    return (
      <div key={user.id} className="flex flex-col items-center">
        {/* Node Box */}
        <div className={`relative ${nodeStyles.bg} ${nodeStyles.border} ${nodeStyles.hover} border rounded-lg p-4 w-[280px] flex-shrink-0 transition-all ${nodeStyles.text}`}>
          {/* Action buttons - Top right */}
          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditUser(user)}
              className="h-6 w-6 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeactivateUser(user.id)}
              className="h-6 w-6 p-0 text-gray-600 hover:text-red-600 hover:bg-gray-100"
            >
              <UserX className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="flex items-start gap-3 pr-8">
            {/* Avatar Icon */}
            <div className={`${nodeStyles.icon} flex-shrink-0 mt-0.5`}>
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              {/* User Name */}
              <div className="font-bold text-base mb-1.5 leading-tight text-gray-900 pr-2">
                {user.firstName} {user.lastName}
              </div>
              
              {/* Role */}
              <div className="text-sm text-gray-600 leading-relaxed mb-2 line-clamp-1">
                {user.roleName || "No role"}
              </div>
              
              {/* Email */}
              <div className="text-xs text-gray-500 mb-1">
                {user.email}
              </div>
              
              {/* Reporting User */}
              {user.reportingUserName && (
                <div className="text-xs text-gray-500">
                  Reports to: {user.reportingUserName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vertical line down from node if it has children */}
        {hasChildren && (
          <>
            <div className="h-8 w-0.5 bg-gray-300 mx-auto"></div>
            {/* Container for horizontal line and children */}
            <div className="relative flex justify-center w-full overflow-x-auto py-4">
              <div className="relative flex justify-center" style={{ 
                minWidth: `${Math.max(600, user.children.length * 320 + (user.children.length - 1) * 80)}px` 
              }}>
                {/* Horizontal connector line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-300"></div>
                
                {/* Children nodes */}
                <div className="flex items-start justify-center gap-20 pt-2">
                  {user.children.map((child, childIndex) => (
                    <div key={child.id} className="flex flex-col items-center flex-shrink-0">
                      {/* Vertical line up from child to horizontal line */}
                      <div className="h-8 w-0.5 bg-gray-300"></div>
                      {/* Render child node */}
                      {renderUserHierarchyNode(child, level + 1, childIndex, user.children.length)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  if (usersLoading || rolesLoading) {
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
    <div className="p-6 w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage team members and their roles</p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tasks & Follow-ups */}
          <Link href="/tasks">
            <Button variant="outline" className="flex items-center gap-2 shadow-sm hover:shadow">
              <CheckSquare className="w-4 h-4" />
              Tasks & Follow-ups
            </Button>
          </Link>

          {/* Role Management */}
          <Link href="/roles">
            <Button variant="outline" className="flex items-center gap-2 shadow-sm hover:shadow">
              <Crown className="w-4 h-4" />
              Role Management
            </Button>
          </Link>

          {/* Create User */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2 shadow-sm hover:shadow">
                <Plus className="h-4 w-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@company.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.roleId.toString()} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      roleId: value,
                      reportingUserId: null // Reset reporting user when role changes
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role: Role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.roleId && (
                <div>
                  <Label htmlFor="reportingUser">Reporting User (Optional)</Label>
                  <Select 
                    value={formData.reportingUserId?.toString() || "none"} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      reportingUserId: value === "none" ? null : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reporting user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {availableReportingUsers.length > 0 ? (
                        availableReportingUsers.map((user: User) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.firstName} {user.lastName} ({user.roleName || user.role})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-users" disabled>
                          {selectedRole?.parentRoleId 
                            ? "No users found with parent role" 
                            : "No parent role configured for this role"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedRole?.parentRoleId 
                      ? `Select a user with the parent role (${roles.find((r: Role) => r.id === selectedRole.parentRoleId)?.name || 'Unknown'})`
                      : "This role has no parent role configured. Set a parent role in Role Management to enable reporting user selection."}
                  </p>
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> A temporary password will be generated and sent to the user's email address. 
                  They will be required to change it on first login.
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending || !formData.email || !formData.firstName || !formData.lastName}
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
              </div>
            </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@company.com"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select 
                value={formData.roleId.toString()} 
                onValueChange={(value) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    roleId: value,
                    reportingUserId: null // Reset reporting user when role changes
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: Role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.roleId && (
              <div>
                <Label htmlFor="edit-reportingUser">Reporting User (Optional)</Label>
                <Select 
                  value={formData.reportingUserId && formData.reportingUserId !== "" ? formData.reportingUserId.toString() : "none"} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    reportingUserId: value === "none" ? null : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reporting user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableReportingUsers.length > 0 ? (
                      availableReportingUsers.map((user: User) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName} ({user.roleName || user.role})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-users" disabled>
                        No available reporting users for this role
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a user who will be this user's manager or supervisor
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateUser}
                disabled={updateUserMutation.isPending || !formData.email || !formData.firstName || !formData.lastName}
              >
                {updateUserMutation.isPending ? "Updating..." : "Update User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User View Tabs */}
      <Tabs value={userViewTab} onValueChange={setUserViewTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
        </TabsList>

        {/* List View Tab */}
        <TabsContent value="list" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user: User) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {user.roleName || "No role assigned"}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeactivateUser(user.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="truncate">{user.email}</span>
                </div>
                
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{user.phone}</span>
                  </div>
                )}
                
                {user.reportingUserName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Reports to:</span>
                    <span className="font-medium">{user.reportingUserName}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  {getStatusBadge(user)}
                </div>
                
                {user.lastLoginAt && (
                  <div className="text-xs text-gray-500">
                    Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
            </Card>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12 col-span-full">
                <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600 mb-4">Add your first team member to get started.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Hierarchy View Tab */}
        <TabsContent value="hierarchy" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>User Hierarchy</CardTitle>
              <CardDescription>
                Visual representation of user hierarchy based on reporting relationships
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {users.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600 mb-4">Create your first user to see the hierarchy.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </div>
              ) : (
                <div className="w-full overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                  <div className="flex flex-col items-center justify-start min-w-max py-8 px-8">
                    {buildUserHierarchy().map((userNode, index) => (
                      <div key={userNode.id} className="mb-8">
                        {renderUserHierarchyNode(userNode, 0, index, buildUserHierarchy().length)}
                      </div>
                    ))}
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

export default function UsersPage() {
  return (
    <Layout>
      <UsersPageContent />
    </Layout>
  );
}
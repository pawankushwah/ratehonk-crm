import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Mail, Phone, UserCheck, UserX, Eye, EyeOff, Users, Target, Calendar, Bell, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  workload?: {
    leads: number;
    customers: number;
    activeTasks: number;
    total: number;
  };
}

interface AssignableUser extends User {
  permissions: Record<string, string[]>;
}

interface Assignment {
  summary: {
    assignedLeads: number;
    assignedCustomers: number;
    activeTasks: number;
    completedTasks: number;
  };
  recentLeads: Array<{
    id: number;
    name: string;
    status: string;
    createdAt: string;
    priority: string;
  }>;
  recentCustomers: Array<{
    id: number;
    name: string;
    crmStatus: string;
    lastActivity: string;
    totalValue: number;
  }>;
  upcomingTasks: Array<{
    id: number;
    title: string;
    dueDate: string;
    priority: string;
    status: string;
    type: string;
  }>;
}

interface UserDashboard {
  performance: {
    leadsAssigned: number;
    customersAssigned: number;
    activeTasks: number;
    completedTasks: number;
    unreadNotifications: number;
    conversionRate: number;
  };
  assignments: Assignment;
  notifications: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    priority: string;
    createdAt: string;
  }>;
  metrics: Record<string, any>;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

function UsersPageContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    roleId: "" as string | number,
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

  // Fetch assignable users (with workload data)
  const { data: assignableUsers = [], isLoading: assignableUsersLoading, error: assignableUsersError } = useQuery<AssignableUser[]>({
    queryKey: [`/api/tenants/${tenantId}/assignable-users`],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenantId}/assignable-users?entityType=leads`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch assignable users');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!tenantId && activeTab === "assignments"
  });

  // Fetch user dashboard data when a specific user is selected
  const { data: userDashboard, isLoading: dashboardLoading } = useQuery<UserDashboard>({
    queryKey: [`/api/tenants/${tenantId}/users/${selectedUserId}/dashboard`],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenantId}/users/${selectedUserId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
    enabled: !!tenantId && !!selectedUserId && activeTab === "performance"
  });

  // Fetch assignment history
  const { data: assignmentHistory = [], isLoading: historyLoading } = useQuery<any[]>({
    queryKey: [`/api/tenants/${tenantId}/assignment-history`],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenantId}/assignment-history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!tenantId && activeTab === "assignments"
  });

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
      isActive: true
    });
    setSelectedUser(null);
  };

  const handleCreateUser = () => {
    createUserMutation.mutate({
      ...formData,
      roleId: formData.roleId ? parseInt(formData.roleId as string) : null
    });
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      updateUserMutation.mutate({
        userId: selectedUser.id,
        ...formData,
        roleId: formData.roleId ? parseInt(formData.roleId as string) : null
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-2">Manage team members, assignments, and performance</p>
        </div>
      
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
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
                  onValueChange={(value) => setFormData(prev => ({ ...prev, roleId: value }))}
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

      {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-3  p-4 rounded-lg shadow-sm">

      {/* Tasks & Follow-ups */}
      <Link href="/tasks">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <CheckSquare className="w-4 h-4" />
          Tasks & Follow-ups
        </Button>
      </Link>

      {/* Role Management */}
      <Link href="/roles">
        <Button className="flex items-center gap-2 bg-white text-black text-sm px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <Crown className="w-4 h-4" />
          Role Management
        </Button>
      </Link>

     
      
    </div>
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Users & Roles
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "assignments"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Target className="h-4 w-4 inline mr-2" />
              Assignments & Workload
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "performance"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Performance Dashboard
            </button>
          </nav>
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, roleId: value }))}
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

      {/* Tab Content */}
      {activeTab === "users" && (
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
          <div className="text-center py-12">
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
      )}

      {/* Assignments Tab */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          {/* Workload Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {assignableUsersLoading ? (
              Array.from({length: 3}).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              ))
            ) : assignableUsersError ? (
              <div className="col-span-3 text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load user data</h3>
                <p className="text-gray-600">Please try refreshing the page or check your connection.</p>
              </div>
            ) : Array.isArray(assignableUsers) && assignableUsers.length > 0 ? (
              assignableUsers.map((user: AssignableUser) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <CardDescription>{user.roleName}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Leads:</span>
                        <span className="font-medium">{user.workload?.leads || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customers:</span>
                        <span className="font-medium">{user.workload?.customers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tasks:</span>
                        <span className="font-medium">{user.workload?.activeTasks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold text-cyan-600">{user.workload?.total || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No users available</h3>
                <p className="text-gray-600">Add team members in the Users & Roles tab to see their workload here.</p>
              </div>
            )}
          </div>

          {/* Assignment History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Assignments</CardTitle>
              <CardDescription>Track recent assignment changes and distributions</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="animate-pulse space-y-4">
                  {Array.from({length: 5}).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : Array.isArray(assignmentHistory) && assignmentHistory.length > 0 ? (
                <div className="space-y-4">
                  {assignmentHistory.map((assignment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                          <Target className="h-4 w-4 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{assignment.entityType} assigned</p>
                          <p className="text-xs text-gray-500">
                            {assignment.assignedToName} • {assignment.reason}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(assignment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments yet</h3>
                  <p className="text-gray-600">Assignment history will appear here as you assign leads and customers to users.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Dashboard Tab */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {/* User Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select User for Performance Dashboard</CardTitle>
              <CardDescription>View detailed performance metrics for individual team members</CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedUserId?.toString() || ""} 
                onValueChange={(value) => setSelectedUserId(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a user to view their dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: User) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName} - {user.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          {selectedUserId && (
            <>
              {dashboardLoading ? (
                <div className="animate-pulse space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({length: 6}).map((_, i) => (
                      <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              ) : userDashboard ? (
                <>
                  {/* Performance Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Users className="h-8 w-8 text-blue-600" />
                          <div className="ml-4">
                            <p className="text-sm text-gray-600">Leads</p>
                            <p className="text-2xl font-bold">{userDashboard.performance.leadsAssigned}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <UserCheck className="h-8 w-8 text-green-600" />
                          <div className="ml-4">
                            <p className="text-sm text-gray-600">Customers</p>
                            <p className="text-2xl font-bold">{userDashboard.performance.customersAssigned}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Calendar className="h-8 w-8 text-orange-600" />
                          <div className="ml-4">
                            <p className="text-sm text-gray-600">Active Tasks</p>
                            <p className="text-2xl font-bold">{userDashboard.performance.activeTasks}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Activity className="h-8 w-8 text-cyan-600" />
                          <div className="ml-4">
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-2xl font-bold">{userDashboard.performance.completedTasks}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Bell className="h-8 w-8 text-purple-600" />
                          <div className="ml-4">
                            <p className="text-sm text-gray-600">Notifications</p>
                            <p className="text-2xl font-bold">{userDashboard.performance.unreadNotifications}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <TrendingUp className="h-8 w-8 text-teal-600" />
                          <div className="ml-4">
                            <p className="text-sm text-gray-600">Conversion</p>
                            <p className="text-2xl font-bold">{userDashboard.performance.conversionRate}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity & Notifications */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Assignments */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Leads</CardTitle>
                        <CardDescription>Latest assigned leads and their status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {userDashboard.assignments?.recentLeads?.map((lead: any) => (
                            <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{lead.name}</p>
                                <p className="text-xs text-gray-500">{lead.status} • {lead.priority} priority</p>
                              </div>
                              <Badge variant="outline">{new Date(lead.createdAt).toLocaleDateString()}</Badge>
                            </div>
                          )) || (
                            <p className="text-gray-500 text-center py-4">No recent leads</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Recent updates and alerts</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {userDashboard.notifications?.map((notification: any) => (
                            <div key={notification.id} className={`p-3 rounded-lg ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50'}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{notification.title}</p>
                                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                </div>
                                <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'}>
                                  {notification.priority}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          )) || (
                            <p className="text-gray-500 text-center py-4">No notifications</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
                  <p className="text-gray-600">Performance data will appear here once the user has been active.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
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
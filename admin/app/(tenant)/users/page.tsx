'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Key,
  UserCog,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/contexts/ToastContext';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  businessPhone?: string;
  mobilePhone?: string;
  accountEnabled: boolean;
  createdAt: string;
  lastSignIn?: string;
  photo?: string;
}

// Mock data for demonstration
const MOCK_USERS: User[] = [
  {
    id: '1',
    displayName: 'Admin User',
    email: 'admin@tesseract-hub.com',
    role: 'Super Administrator',
    jobTitle: 'System Administrator',
    department: 'IT Operations',
    officeLocation: 'Main Office',
    businessPhone: '+1-555-0123',
    mobilePhone: '+1-555-0124',
    accountEnabled: true,
    createdAt: '2024-01-15T00:00:00Z',
    lastSignIn: new Date().toISOString(),
  },
  {
    id: '2',
    displayName: 'John Smith',
    email: 'john.smith@tesseract-hub.com',
    role: 'Administrator',
    jobTitle: 'Operations Manager',
    department: 'Operations',
    officeLocation: 'Main Office',
    businessPhone: '+1-555-0125',
    accountEnabled: true,
    createdAt: '2024-02-10T00:00:00Z',
    lastSignIn: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    displayName: 'Sarah Johnson',
    email: 'sarah.johnson@tesseract-hub.com',
    role: 'Manager',
    jobTitle: 'Customer Success Manager',
    department: 'Customer Success',
    officeLocation: 'Branch Office',
    businessPhone: '+1-555-0126',
    accountEnabled: true,
    createdAt: '2024-03-05T00:00:00Z',
    lastSignIn: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    displayName: 'Mike Davis',
    email: 'mike.davis@tesseract-hub.com',
    role: 'Staff',
    jobTitle: 'Support Specialist',
    department: 'Customer Support',
    officeLocation: 'Main Office',
    businessPhone: '+1-555-0127',
    accountEnabled: false,
    createdAt: '2024-04-20T00:00:00Z',
  },
];

const roleOptions = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'Super Administrator', label: 'Super Administrator' },
  { value: 'Administrator', label: 'Administrator' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Viewer', label: 'Viewer' },
];

const statusOptions = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DISABLED', label: 'Disabled' },
];

export default function UsersHubPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    displayName: '',
    email: '',
    role: 'Staff',
    jobTitle: '',
    department: '',
    officeLocation: '',
    businessPhone: '',
    mobilePhone: '',
    accountEnabled: true,
  });

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUsers(MOCK_USERS);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && user.accountEnabled) ||
      (statusFilter === 'DISABLED' && !user.accountEnabled);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async () => {
    try {
      const newUser: User = {
        id: String(users.length + 1),
        displayName: formData.displayName!,
        email: formData.email!,
        role: formData.role!,
        jobTitle: formData.jobTitle,
        department: formData.department,
        officeLocation: formData.officeLocation,
        businessPhone: formData.businessPhone,
        mobilePhone: formData.mobilePhone,
        accountEnabled: formData.accountEnabled!,
        createdAt: new Date().toISOString(),
      };
      setUsers([...users, newUser]);
      setShowCreateModal(false);
      resetForm();
      toast.success('User Created', `Successfully created user ${formData.displayName}`);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Creation Failed', 'Failed to create user. Please try again.');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? { ...u, ...formData }
            : u
        )
      );
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      toast.success('User Updated', `Successfully updated user ${formData.displayName}`);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Update Failed', 'Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const userName = selectedUser.displayName;
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
      toast.success('User Deleted', `Successfully deleted user ${userName}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Deletion Failed', 'Failed to delete user. Please try again.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = !user.accountEnabled;
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, accountEnabled: !u.accountEnabled } : u
        )
      );
      toast.success(
        'Status Updated',
        `User ${user.displayName} has been ${newStatus ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Status Update Failed', 'Failed to update user status. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      displayName: '',
      email: '',
      role: 'Staff',
      jobTitle: '',
      department: '',
      officeLocation: '',
      businessPhone: '',
      mobilePhone: '',
      accountEnabled: true,
    });
  };

  const getInitialsBgColor = (name: string) => {
    const colors = [
      'bg-primary',
      'bg-success',
      'bg-accent',
      'bg-warning',
      'bg-info',
      'bg-error',
    ];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  const getRoleBadgeClass = (role: string) => {
    const classes: Record<string, string> = {
      'Super Administrator': 'bg-primary/10 text-primary border-primary/30',
      Administrator: 'bg-primary/20 text-primary border-primary/30',
      Manager: 'bg-success-muted text-success-foreground border-success/30',
      Staff: 'bg-muted text-foreground border-border',
      Viewer: 'bg-warning-muted text-warning-foreground border-warning/30',
    };
    return classes[role] || classes.Staff;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate summary metrics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.accountEnabled).length;
  const disabledUsers = users.filter((u) => !u.accountEnabled).length;
  const adminUsers = users.filter((u) =>
    u.role.includes('Administrator')
  ).length;

  return (
    <PermissionGate
      permission={Permission.STAFF_VIEW}
      fallback="styled"
      fallbackTitle="Users Access Required"
      fallbackDescription="You don't have the required permissions to view users. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Users Hub"
          description="Manage internal admin users, roles, and access control"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Team', href: '/staff' },
            { label: 'Users' },
          ]}
          actions={
            <Button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Users</p>
                <p className="text-3xl font-bold text-primary mt-2">
                  {totalUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Active</p>
                <p className="text-3xl font-bold text-success mt-2">
                  {activeUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Disabled</p>
                <p className="text-3xl font-bold text-error mt-2">
                  {disabledUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-error-muted rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-error" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Admins</p>
                <p className="text-3xl font-bold text-primary mt-2">
                  {adminUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
              options={roleOptions}
            />

            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={statusOptions}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">User</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Department</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Last Sign In</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const userInitial = user.displayName.charAt(0).toUpperCase();

                    return (
                      <tr key={user.id} className="hover:bg-muted transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.photo ? (
                              <img
                                src={user.photo}
                                alt={user.displayName}
                                className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                              />
                            ) : (
                              <div
                                className={cn(
                                  'h-10 w-10 rounded-full flex items-center justify-center border-2 border-primary/20',
                                  getInitialsBgColor(user.displayName)
                                )}
                              >
                                <span className="text-white font-bold text-sm">{userInitial}</span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground">{user.displayName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                              getRoleBadgeClass(user.role)
                            )}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.department || '-'}</p>
                            <p className="text-xs text-muted-foreground">{user.jobTitle || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {user.businessPhone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {user.businessPhone}
                              </div>
                            )}
                            {user.officeLocation && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {user.officeLocation}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.lastSignIn ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatDateTime(user.lastSignIn)}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() => handleToggleStatus(user)}
                            className={cn(
                              'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-colors',
                              user.accountEnabled
                                ? 'bg-success-muted text-success-foreground border-success/30 hover:bg-success/20'
                                : 'bg-error-muted text-error border-error/30 hover:bg-error/20'
                            )}
                          >
                            {user.accountEnabled ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Disabled
                              </>
                            )}
                          </Button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setFormData({ ...user });
                                setShowEditModal(true);
                              }}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                              title="Edit"
                              aria-label="Edit user"
                            >
                              <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                              title="Delete"
                              aria-label="Delete user"
                            >
                              <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit User Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="border-b border-border px-6 py-4 sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-primary">
                  {showCreateModal ? 'Create New User' : 'Edit User'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Display Name *
                    </label>
                    <Input
                      value={formData.displayName || ''}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.smith@tesseract-hub.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Role *
                    </label>
                    <Select
                      value={formData.role || 'Staff'}
                      onChange={(value) => setFormData({ ...formData, role: value })}
                      options={roleOptions.filter((opt) => opt.value !== 'ALL')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Job Title
                    </label>
                    <Input
                      value={formData.jobTitle || ''}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="Operations Manager"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Department
                    </label>
                    <Input
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Operations"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Office Location
                    </label>
                    <Input
                      value={formData.officeLocation || ''}
                      onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                      placeholder="Main Office"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Business Phone
                    </label>
                    <Input
                      value={formData.businessPhone || ''}
                      onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                      placeholder="+1-555-0123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Mobile Phone
                    </label>
                    <Input
                      value={formData.mobilePhone || ''}
                      onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                      placeholder="+1-555-0124"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.accountEnabled}
                      onChange={(e) => setFormData({ ...formData, accountEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      Account Enabled
                    </span>
                  </label>
                </div>
              </div>

              <div className="border-t border-border px-6 py-4 flex justify-end gap-3 sticky bottom-0 bg-white">
                <Button
                  onClick={() => {
                    if (showCreateModal) setShowCreateModal(false);
                    if (showEditModal) setShowEditModal(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={showCreateModal ? handleCreateUser : handleUpdateUser}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                  disabled={!formData.displayName || !formData.email || !formData.role}
                >
                  {showCreateModal ? 'Create User' : 'Update User'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            onConfirm={handleDeleteUser}
            title="Delete User"
            message={`Are you sure you want to delete ${selectedUser.displayName}? This action cannot be undone.`}
            confirmText="Delete"
            variant="danger"
          />
        )}
      </div>
    </div>
    </PermissionGate>
  );
}

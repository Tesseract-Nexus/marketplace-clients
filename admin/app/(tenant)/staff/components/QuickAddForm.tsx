'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Shield, Users, Plus, Building2 } from 'lucide-react';
import { Select } from '@/components/Select';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';
import { useHasPermission, Permissions } from '@/hooks/usePermission';
import type { Team, Role, Department } from '@/lib/api/rbacTypes';
import { CreateDepartmentModal } from './CreateDepartmentModal';
import { CreateTeamModal } from './CreateTeamModal';

interface QuickAddFormProps {
  onSubmit: (data: QuickAddData) => Promise<void>;
  onCancel: () => void;
  onSwitchToFullForm: () => void;
  isSubmitting: boolean;
}

export interface QuickAddData {
  firstName: string;
  lastName: string;
  email: string;
  teamId: string;
  departmentId: string;
}

interface TeamWithRole extends Team {
  defaultRole?: Role;
}

export function QuickAddForm({ onSubmit, onCancel, onSwitchToFullForm, isSubmitting }: QuickAddFormProps) {
  const { currentTenant } = useTenant();
  const { user } = useUser();

  // Permission checks for creating departments and teams
  const canCreateDepartments = useHasPermission(Permissions.DEPARTMENTS_CREATE);
  const canCreateTeams = useHasPermission(Permissions.TEAMS_CREATE);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [teamId, setTeamId] = useState('');

  // Data state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<TeamWithRole[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithRole | null>(null);

  // Loading state
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal state
  const [showCreateDeptModal, setShowCreateDeptModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

  const getHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
      'x-jwt-claim-tenant-id': currentTenant?.id || '',
    };
    if (user?.id) headers['x-jwt-claim-sub'] = user.id;
    if (user?.email) headers['x-jwt-claim-email'] = user.email;
    return headers;
  };

  // Load departments on mount
  useEffect(() => {
    if (currentTenant?.id) {
      loadDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant?.id]);

  // Load teams when department changes
  useEffect(() => {
    if (departmentId) {
      loadTeams(departmentId);
    } else {
      setTeams([]);
      setTeamId('');
      setSelectedTeam(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  // Update selected team when teamId changes
  useEffect(() => {
    if (teamId) {
      const team = teams.find(t => t.id === teamId);
      setSelectedTeam(team || null);
    } else {
      setSelectedTeam(null);
    }
  }, [teamId, teams]);

  const loadDepartments = async () => {
    if (!currentTenant?.id) return;
    setLoadingDepts(true);
    try {
      const response = await fetch('/api/staff/departments', { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoadingDepts(false);
      setInitialLoadComplete(true);
    }
  };

  const loadTeams = async (deptId: string) => {
    if (!currentTenant?.id) return;
    setLoadingTeams(true);
    try {
      const response = await fetch(`/api/staff/teams?departmentId=${deptId}`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setTeams(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!teamId) {
      newErrors.teamId = 'Team selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      teamId,
      departmentId,
    });
  };

  // Handle new department created
  const handleDepartmentCreated = (newDepartment: Department) => {
    setDepartments(prev => [...prev, newDepartment]);
    setDepartmentId(newDepartment.id);
    setTeamId('');
    setTeams([]);
  };

  // Handle new team created
  const handleTeamCreated = (newTeam: TeamWithRole) => {
    setTeams(prev => [...prev, newTeam]);
    setTeamId(newTeam.id);
    setSelectedTeam(newTeam);
    if (errors.teamId) {
      setErrors(prev => ({ ...prev, teamId: '' }));
    }
  };

  const selectedDepartment = departments.find(d => d.id === departmentId);

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...departments.map(d => ({ value: d.id, label: d.name })),
  ];

  const teamOptions = [
    { value: '', label: departmentId ? 'Select Team' : 'Select department first' },
    ...teams.map(t => ({
      value: t.id,
      label: t.defaultRole
        ? `${t.name} (${t.defaultRole.displayName})`
        : t.name
    })),
  ];

  // Check if we need to show empty states
  const showNoDepartmentsMessage = initialLoadComplete && !loadingDepts && departments.length === 0;
  const showNoTeamsMessage = departmentId && !loadingTeams && teams.length === 0;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Add Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              Quick Add Staff Member
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add a new team member with just the essentials
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchToFullForm}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Need more options? Use full form
          </button>
        </div>

        {/* Essential Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              First Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
              }}
              className={cn(
                "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                errors.firstName ? "border-error" : "border-border"
              )}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-error text-xs mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Last Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
              }}
              className={cn(
                "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                errors.lastName ? "border-error" : "border-border"
              )}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-error text-xs mt-1">{errors.lastName}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Email <span className="text-error">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              className={cn(
                "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                errors.email ? "border-error" : "border-border"
              )}
              placeholder="john.doe@company.com"
            />
            {errors.email && (
              <p className="text-error text-xs mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Team Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Team Assignment</h3>
          </div>

          {/* No Departments Empty State */}
          {showNoDepartmentsMessage && (
            <div className="bg-warning-muted border-2 border-warning/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning-muted flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-warning">No departments found</h4>
                  <p className="text-sm text-warning-foreground mt-1">
                    {canCreateDepartments
                      ? 'You need to create a department before adding staff members. Departments help organize your team structure.'
                      : 'No departments exist yet. Please contact an administrator to create departments before adding staff members.'}
                  </p>
                  {canCreateDepartments && (
                    <button
                      type="button"
                      onClick={() => setShowCreateDeptModal(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-warning text-white rounded-md hover:bg-warning transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Department
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Department and Team Selection (only show if departments exist or loading) */}
          {(departments.length > 0 || loadingDepts) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Department <span className="text-error">*</span>
                  {loadingDepts && <Loader2 className="inline w-4 h-4 ml-2 animate-spin" />}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={departmentId}
                      onChange={(value) => {
                        setDepartmentId(value);
                        setTeamId('');
                      }}
                      options={departmentOptions}
                      className="w-full"
                    />
                  </div>
                  {canCreateDepartments && (
                    <button
                      type="button"
                      onClick={() => setShowCreateDeptModal(true)}
                      className="px-3 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-all"
                      title="Create new department"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Team <span className="text-error">*</span>
                  {loadingTeams && <Loader2 className="inline w-4 h-4 ml-2 animate-spin" />}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={teamId}
                      onChange={(value) => {
                        setTeamId(value);
                        if (errors.teamId) setErrors(prev => ({ ...prev, teamId: '' }));
                      }}
                      options={teamOptions}
                      className="w-full"
                      disabled={!departmentId}
                    />
                  </div>
                  {departmentId && canCreateTeams && (
                    <button
                      type="button"
                      onClick={() => setShowCreateTeamModal(true)}
                      className="px-3 py-2 bg-success-muted text-success-muted-foreground rounded-md hover:bg-success/20 transition-all"
                      title="Create new team"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {errors.teamId && (
                  <p className="text-error text-xs mt-1">{errors.teamId}</p>
                )}
              </div>
            </div>
          )}

          {/* No Teams Empty State */}
          {showNoTeamsMessage && (
            <div className="bg-accent border-2 border-primary/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-primary">No teams in this department</h4>
                  <p className="text-xs text-primary mt-1">
                    {canCreateTeams
                      ? 'Create a team to assign staff members to.'
                      : 'No teams exist in this department. Please contact an administrator to create teams.'}
                  </p>
                  {canCreateTeams && (
                    <button
                      type="button"
                      onClick={() => setShowCreateTeamModal(true)}
                      className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary transition-all font-medium text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Create Team
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Role Inheritance Info */}
          {selectedTeam?.defaultRole && (
            <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Role: <span className="text-primary">{selectedTeam.defaultRole.displayName}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This role will be automatically assigned based on the team selection.
                  The member will inherit all permissions associated with this role.
                </p>
              </div>
            </div>
          )}

          {selectedTeam && !selectedTeam.defaultRole && (
            <div className="bg-warning-muted border-2 border-warning/30 rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning">
                  No default role assigned to this team
                </p>
                <p className="text-xs text-warning-foreground mt-1">
                  You can assign a role later from the staff member&apos;s profile, or use the full form to select a role now.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted/50 transition-all font-semibold border-2 border-border disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-md hover:from-blue-700 hover:to-violet-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Add Staff Member'
            )}
          </button>
        </div>
      </form>

      {/* Create Department Modal */}
      <CreateDepartmentModal
        isOpen={showCreateDeptModal}
        onClose={() => setShowCreateDeptModal(false)}
        onSuccess={handleDepartmentCreated}
        existingDepartments={departments}
      />

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        onSuccess={handleTeamCreated}
        departmentId={departmentId}
        departmentName={selectedDepartment?.name}
      />
    </>
  );
}

export default QuickAddForm;

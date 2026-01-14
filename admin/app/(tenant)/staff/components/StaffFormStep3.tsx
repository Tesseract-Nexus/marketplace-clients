'use client';

import React, { useState, useEffect } from 'react';
import { Select } from '@/components/Select';
import { Loader2 } from 'lucide-react';
import { StaffFormStepProps, Department, Team, StaffMember } from './types';
import { useTenant } from '@/contexts/TenantContext';

export function StaffFormStep3({ formData, setFormData }: StaffFormStepProps) {
  const { currentTenant } = useTenant();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [managers, setManagers] = useState<StaffMember[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Load departments when tenant is available
  useEffect(() => {
    if (currentTenant?.id) {
      loadDepartments();
      loadManagers();
    }
  }, [currentTenant?.id]);

  // Load teams when department changes
  useEffect(() => {
    if (formData.departmentId) {
      loadTeams(formData.departmentId);
    } else {
      setTeams([]);
      setFormData(prev => ({ ...prev, teamId: '' }));
    }
  }, [formData.departmentId]);

  const getHeaders = () => ({
    'X-Tenant-ID': currentTenant?.id || '',
  });

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
    }
  };

  const loadTeams = async (departmentId: string) => {
    if (!currentTenant?.id) return;
    setLoadingTeams(true);
    try {
      const response = await fetch(`/api/staff/teams?departmentId=${departmentId}`, { headers: getHeaders() });
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

  const loadManagers = async () => {
    if (!currentTenant?.id) return;
    setLoadingManagers(true);
    try {
      const response = await fetch('/api/staff?role=manager,admin,senior_employee', { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setManagers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load managers:', error);
    } finally {
      setLoadingManagers(false);
    }
  };

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...departments.map(d => ({ value: d.id, label: d.name })),
  ];

  const teamOptions = [
    { value: '', label: formData.departmentId ? 'Select Team' : 'Select department first' },
    ...teams.map(t => ({ value: t.id, label: t.name })),
  ];

  const managerOptions = [
    { value: '', label: 'No Manager' },
    ...managers.map(m => ({
      value: m.id,
      label: `${m.firstName} ${m.lastName}${m.jobTitle ? ` - ${m.jobTitle}` : ''}`
    })),
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
        Organization
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Department
            {loadingDepts && <Loader2 className="inline w-4 h-4 ml-2 animate-spin" />}
          </label>
          <Select
            value={formData.departmentId}
            onChange={(value) => setFormData({ ...formData, departmentId: value, teamId: '' })}
            options={departmentOptions}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Team
            {loadingTeams && <Loader2 className="inline w-4 h-4 ml-2 animate-spin" />}
          </label>
          <Select
            value={formData.teamId}
            onChange={(value) => setFormData({ ...formData, teamId: value })}
            options={teamOptions}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Reporting Manager
            {loadingManagers && <Loader2 className="inline w-4 h-4 ml-2 animate-spin" />}
          </label>
          <Select
            value={formData.managerId}
            onChange={(value) => setFormData({ ...formData, managerId: value })}
            options={managerOptions}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Location ID
          </label>
          <input
            type="text"
            value={formData.locationId}
            onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="loc-001"
          />
        </div>
      </div>

      <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-6 mt-6">
        <p className="text-sm text-primary">
          <strong>Note:</strong> Department and Team are selected from your organization structure.
          If you need to create new departments or teams, go to{' '}
          <a href="/staff/departments" className="underline font-semibold">Staff &gt; Departments</a>.
        </p>
      </div>
    </div>
  );
}

export default StaffFormStep3;

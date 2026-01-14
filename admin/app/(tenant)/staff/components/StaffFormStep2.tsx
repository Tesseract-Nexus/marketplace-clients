'use client';

import React, { useMemo } from 'react';
import { Select } from '@/components/Select';
import { StaffRole, EmploymentType } from '@/lib/api/types';
import { StaffFormStepProps } from './types';

const employmentTypeOptions = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'intern', label: 'Intern' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'volunteer', label: 'Volunteer' },
];

const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
];

export function StaffFormStep2({ formData, setFormData, roles = [] }: StaffFormStepProps) {
  // Convert roles from API to select options format
  const roleOptions = useMemo(() => {
    if (roles.length > 0) {
      return roles.map(role => ({
        value: role.name,
        label: role.displayName || role.name,
      }));
    }
    // Fallback options if no roles are loaded
    return [
      { value: 'employee', label: 'Employee' },
    ];
  }, [roles]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
        Employment Information
      </h2>

      <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4 mb-6">
        <p className="text-sm text-primary">
          <strong>Note:</strong> Employee ID will be auto-generated when the staff member is created.
          The format is: <code className="bg-white px-2 py-0.5 rounded">COMPANY-0000001</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="Senior Software Engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value as StaffRole })}
            options={roleOptions}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Employment Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.employmentType}
            onChange={(value) => setFormData({ ...formData, employmentType: value as EmploymentType })}
            options={employmentTypeOptions}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            End Date (if applicable)
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Salary
          </label>
          <input
            type="number"
            value={formData.salary || ''}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="75000"
            min="0"
            step="1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Currency
          </label>
          <Select
            value={formData.currencyCode}
            onChange={(value) => setFormData({ ...formData, currencyCode: value })}
            options={currencyOptions}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default StaffFormStep2;

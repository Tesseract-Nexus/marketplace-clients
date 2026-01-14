'use client';

import React from 'react';
import { StaffFormStepProps } from './types';

export function StaffFormStep4({ formData }: StaffFormStepProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').toUpperCase();
  };

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (!amount) return '-';
    return `${currency} $${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
        Review & Confirm
      </h2>

      <div className="bg-muted p-8 rounded-2xl border-2 border-primary/30">
        <h3 className="text-lg font-semibold mb-6 text-foreground">Staff Member Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground border-b pb-2">Personal Information</h4>

            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-semibold text-lg">
                {formData.firstName} {formData.middleName && `${formData.middleName} `}{formData.lastName}
              </p>
            </div>

            {formData.displayName && (
              <div>
                <p className="text-sm text-muted-foreground">Display Name</p>
                <p className="font-semibold">{formData.displayName}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{formData.email || '-'}</p>
            </div>

            {formData.alternateEmail && (
              <div>
                <p className="text-sm text-muted-foreground">Alternate Email</p>
                <p className="font-semibold">{formData.alternateEmail}</p>
              </div>
            )}

            {formData.phoneNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-semibold">{formData.phoneNumber}</p>
              </div>
            )}

            {formData.mobileNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Mobile Number</p>
                <p className="font-semibold">{formData.mobileNumber}</p>
              </div>
            )}
          </div>

          {/* Employment Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground border-b pb-2">Employment Details</h4>

            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-semibold">{formatRole(formData.role)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Employment Type</p>
              <p className="font-semibold">{formatRole(formData.employmentType)}</p>
            </div>

            {formData.jobTitle && (
              <div>
                <p className="text-sm text-muted-foreground">Job Title</p>
                <p className="font-semibold">{formData.jobTitle}</p>
              </div>
            )}

            {formData.salary && (
              <div>
                <p className="text-sm text-muted-foreground">Salary</p>
                <p className="font-semibold text-green-600 text-xl">
                  {formatCurrency(formData.salary, formData.currencyCode)}
                </p>
              </div>
            )}

            {formData.startDate && (
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-semibold">{formatDate(formData.startDate)}</p>
              </div>
            )}

            {formData.endDate && (
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-semibold">{formatDate(formData.endDate)}</p>
              </div>
            )}
          </div>

          {/* Organization */}
          {(formData.departmentId || formData.teamId || formData.managerId || formData.locationId) && (
            <div className="space-y-4 md:col-span-2">
              <h4 className="font-semibold text-foreground border-b pb-2">Organization</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.departmentId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-semibold">{formData.departmentId}</p>
                  </div>
                )}

                {formData.teamId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Team</p>
                    <p className="font-semibold">{formData.teamId}</p>
                  </div>
                )}

                {formData.managerId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Manager</p>
                    <p className="font-semibold">{formData.managerId}</p>
                  </div>
                )}

                {formData.locationId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">{formData.locationId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-primary/30">
          <p className="text-sm text-primary">
            <strong>Note:</strong> An Employee ID will be automatically generated when the staff member is created.
          </p>
        </div>
      </div>
    </div>
  );
}

export default StaffFormStep4;

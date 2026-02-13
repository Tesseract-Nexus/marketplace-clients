'use client';

import React, { useState } from 'react';
import {
  User,
  Building2,
  AlertTriangle,
  Trash2,
  Calendar,
  Shield,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { useTenant } from '@/contexts/TenantContext';
import { DeleteTenantModal } from '@/components/settings/DeleteTenantModal';
import { MFASettings } from '@/components/settings/MFASettings';
import { useRouter } from 'next/navigation';
import { PermissionGate, Permission } from '@/components/permission-gate';

export default function AccountSettingsPage() {
  const { currentTenant } = useTenant();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Check if user is owner
  const isOwner = currentTenant?.role === 'owner';

  const memberCountDisplay = typeof currentTenant?.memberCount === 'number'
    ? String(currentTenant.memberCount)
    : 'N/A';

  const handleTenantDeleted = () => {
    // Clear tenant cookie and redirect to welcome page
    document.cookie = `tenant_slug=; path=/; max-age=0; domain=.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app'}`;
    document.cookie = 'tenant_slug=; path=/; max-age=0';

    // Redirect to root domain welcome page
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';
    window.location.href = `https://dev-admin.${baseDomain}/welcome`;
  };

  if (!currentTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-muted-foreground">Loading tenant information...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.SETTINGS_VIEW}
      fallback="styled"
      fallbackTitle="Account Settings"
      fallbackDescription="You don't have permission to view account settings."
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
          title="Account Settings"
          description="Manage your tenant account and ownership"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Account' },
          ]}
        />

        {/* Tenant Information */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Tenant Information</h3>
              <p className="text-sm text-muted-foreground">Details about your tenant account</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tenant Name</label>
                <p className="text-lg font-semibold text-foreground">{currentTenant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tenant Slug</label>
                <p className="text-lg font-mono text-foreground">{currentTenant.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Admin URL</label>
                <p className="text-sm font-mono text-primary">
                  https://{currentTenant.slug}-admin.{process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium text-muted-foreground">Your Role</label>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isOwner
                  ? 'bg-primary/10 text-primary'
                  : 'bg-primary/20 text-primary'
              }`}>
                {currentTenant.role?.charAt(0).toUpperCase() + currentTenant.role?.slice(1)}
              </span>

              <div className="flex items-center gap-2 mt-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium text-muted-foreground">Team Members</label>
              </div>
              <p className="text-lg font-semibold text-foreground">{memberCountDisplay}</p>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <MFASettings />

        {/* Owner Information */}
        {isOwner && (
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Ownership</h3>
                <p className="text-sm text-muted-foreground">You are the owner of this tenant</p>
              </div>
            </div>

            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-primary">
                As the owner, you have full control over this tenant including:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-primary">
                <li>- Managing team members and their roles</li>
                <li>- Configuring all settings and storefronts</li>
                <li>- Billing and subscription management</li>
                <li>- Permanently deleting this tenant</li>
              </ul>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        {isOwner && (
          <div className="bg-card rounded-xl border-2 border-error/30 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-error-muted rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-error" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-error">Danger Zone</h3>
                <p className="text-sm text-error">Irreversible and destructive actions</p>
              </div>
            </div>

            <div className="p-4 bg-error-muted border border-error/30 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-error">Delete this tenant</h4>
                  <p className="text-sm text-error mt-1">
                    Permanently delete this tenant, all storefronts, team members, and associated data.
                    This action cannot be undone.
                  </p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-error hover:bg-error/90 text-white flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Tenant
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Non-owner notice */}
        {!isOwner && (
          <div className="bg-muted rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Only the tenant owner can delete this tenant or transfer ownership.
                Contact the owner if you need to make changes to account settings.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Tenant Modal */}
      <DeleteTenantModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        tenantId={currentTenant.id}
        tenantName={currentTenant.name}
        tenantSlug={currentTenant.slug}
        onDeleted={handleTenantDeleted}
      />
    </div>
    </PermissionGate>
  );
}

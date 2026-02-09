'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Calendar,
  Phone,
  Shield,
  Briefcase,
  Globe,
  Copy,
  Check,
  Key,
  Bell,
  Save,
  Loader2,
  Pencil,
  X,
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/contexts/ToastContext';
import { useUser } from '@/contexts/UserContext';
import { MFASettings } from '@/components/settings/MFASettings';
import { PasskeySettings } from '@/components/settings/PasskeySettings';
import { directChangePassword } from '@/lib/auth/auth-client';

interface UserProfile {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  jobTitle: string;
  department: string;
  officeLocation: string;
  businessPhone: string;
  mobilePhone: string;
  preferredLanguage: string;
  accountEnabled: boolean;
  createdAt: string;
  lastSignIn: string;
  photo?: string;
}

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
];

function ChangePasswordForm() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Current password is required');
      return;
    }

    if (newPassword.length < 10) {
      setError('New password must be at least 10 characters long');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await directChangePassword(currentPassword, newPassword);

      if (result.success) {
        toast.success('Success', result.message || 'Your password has been changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.message || 'Failed to change password.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Change Password</h3>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-5">
        <div className="max-w-md space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error-muted border border-error/30 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">New Password</label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Must be at least 10 characters with uppercase, lowercase, and number
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Updating...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-1.5" />
                Update Password
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const toast = useToast();
  const { user, updateUser, isLoading: isUserLoading } = useUser();

  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    displayName: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'User',
    jobTitle: '',
    department: '',
    officeLocation: '',
    businessPhone: '',
    mobilePhone: '',
    preferredLanguage: 'en-US',
    accountEnabled: true,
    createdAt: '',
    lastSignIn: new Date().toISOString(),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editedProfile, setEditedProfile] = useState(profile);

  useEffect(() => {
    if (user) {
      const loadedProfile: UserProfile = {
        id: user.id || '',
        displayName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'User',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'User',
        jobTitle: user.jobTitle || '',
        department: user.department || '',
        officeLocation: '',
        businessPhone: user.phone || '',
        mobilePhone: '',
        preferredLanguage: 'en-US',
        accountEnabled: true,
        createdAt: user.createdAt || '',
        lastSignIn: user.lastLoginAt || new Date().toISOString(),
        photo: user.avatar,
      };
      setProfile(loadedProfile);
      setEditedProfile(loadedProfile);
    }
  }, [user]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied', 'Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed', 'Could not copy to clipboard');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newDisplayName = `${editedProfile.firstName} ${editedProfile.lastName}`.trim() || editedProfile.displayName;
      updateUser({
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        displayName: newDisplayName,
        phone: editedProfile.businessPhone,
        jobTitle: editedProfile.jobTitle,
        department: editedProfile.department,
      });

      setProfile({ ...editedProfile, displayName: newDisplayName });
      setIsEditing(false);
      toast.success('Success', 'Profile updated successfully!');
    } catch {
      toast.error('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const getLanguageLabel = (code: string) => {
    return LANGUAGES.find((l) => l.code === code)?.label || code;
  };

  const userInitial = profile.displayName.charAt(0).toUpperCase();

  // Reusable detail row for view mode
  const DetailRow = ({ icon: Icon, label, value, fieldKey, copyable }: {
    icon: React.ElementType;
    label: string;
    value: string;
    fieldKey?: string;
    copyable?: boolean;
  }) => (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-right">
        <span className="text-sm font-medium text-foreground">
          {value || <span className="text-muted-foreground/50 font-normal italic">Not set</span>}
        </span>
        {copyable && value && (
          <button
            onClick={() => copyToClipboard(value, fieldKey || label)}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Copy ${label.toLowerCase()}`}
          >
            {copiedField === (fieldKey || label) ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-pulse">
          <div className="mb-6 md:mb-8">
            <div className="h-4 w-48 bg-muted rounded mb-4" />
            <div className="flex justify-between items-start">
              <div>
                <div className="h-9 w-40 bg-muted rounded mb-2" />
                <div className="h-5 w-72 bg-muted rounded" />
              </div>
              <div className="h-10 w-28 bg-muted rounded" />
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-muted rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-40 bg-muted rounded" />
                <div className="h-4 w-52 bg-muted rounded" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="h-5 w-36 bg-muted rounded mb-4" />
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48 bg-card rounded-xl border border-border" />
            <div className="h-48 bg-card rounded-xl border border-border" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.DASHBOARD_VIEW}
      fallback="styled"
      fallbackTitle="Profile Access Required"
      fallbackDescription="You don't have the required permissions to view profile. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="My Profile"
          description="Manage your profile information and settings"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Profile' },
          ]}
        />

        {/* Profile Header - Compact */}
        <section aria-label="Profile overview">
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={profile.displayName}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className={`h-16 w-16 rounded-full ${getInitialsBgColor(profile.displayName)} flex items-center justify-center ring-2 ring-border`}>
                    <span className="text-white font-bold text-xl">{userInitial}</span>
                  </div>
                )}
                <div
                  className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center"
                  style={{ backgroundColor: profile.accountEnabled ? 'var(--success)' : 'var(--muted-foreground)' }}
                  title={profile.accountEnabled ? 'Active' : 'Inactive'}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <h2 className="text-xl font-bold text-foreground truncate">{profile.displayName}</h2>
                  <Badge variant="success" className="text-xs shrink-0">
                    {profile.accountEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                  <Badge variant="default" className="text-xs shrink-0">
                    {profile.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{profile.email}</span>
                  <button
                    onClick={() => copyToClipboard(profile.email, 'email')}
                    className="p-0.5 rounded hover:bg-muted transition-colors shrink-0"
                    aria-label="Copy email address"
                  >
                    {copiedField === 'email' ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                {(profile.jobTitle || profile.department) && (
                  <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                    {profile.jobTitle && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {profile.jobTitle}
                      </span>
                    )}
                    {profile.jobTitle && profile.department && (
                      <span className="text-border">|</span>
                    )}
                    {profile.department && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {profile.department}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Personal Information - Single card with edit/view toggle */}
        <section aria-label="Personal information">
          <div className="bg-card rounded-xl border border-border shadow-sm">
            {/* Card Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Personal Information</h3>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
            </div>

            {/* Card Body */}
            {isEditing ? (
              /* ── Edit Mode: Clean form grid ── */
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      First Name
                    </label>
                    <Input
                      value={editedProfile.firstName}
                      onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                      placeholder="First Name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Last Name
                    </label>
                    <Input
                      value={editedProfile.lastName}
                      onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                      placeholder="Last Name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Job Title
                    </label>
                    <Input
                      value={editedProfile.jobTitle}
                      onChange={(e) => setEditedProfile({ ...editedProfile, jobTitle: e.target.value })}
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Department
                    </label>
                    <Input
                      value={editedProfile.department}
                      onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
                      placeholder="e.g., Engineering"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Phone
                    </label>
                    <Input
                      value={editedProfile.businessPhone}
                      onChange={(e) => setEditedProfile({ ...editedProfile, businessPhone: e.target.value })}
                      placeholder="+1-555-0123"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Preferred Language
                    </label>
                    <select
                      value={editedProfile.preferredLanguage}
                      onChange={(e) => setEditedProfile({ ...editedProfile, preferredLanguage: e.target.value })}
                      className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      aria-label="Preferred Language"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Read-only account info shown below form */}
                <div className="mt-5 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Account</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Role</span>
                      <p className="font-medium text-foreground">{profile.role}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created</span>
                      <p className="font-medium text-foreground">{formatDate(profile.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Sign In</span>
                      <p className="font-medium text-foreground">{formatDate(profile.lastSignIn)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── View Mode: Clean detail rows ── */
              <div className="px-5 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  {/* Left column */}
                  <div className="divide-y divide-border">
                    <DetailRow icon={Mail} label="Email" value={profile.email} fieldKey="email" copyable />
                    <DetailRow icon={Briefcase} label="Job Title" value={profile.jobTitle} />
                    <DetailRow icon={Building2} label="Department" value={profile.department} />
                    <DetailRow icon={Phone} label="Phone" value={profile.businessPhone} fieldKey="businessPhone" copyable />
                  </div>
                  {/* Right column */}
                  <div className="divide-y divide-border">
                    <DetailRow icon={Globe} label="Language" value={getLanguageLabel(profile.preferredLanguage)} />
                    <DetailRow icon={Shield} label="Role" value={profile.role} />
                    <DetailRow icon={Calendar} label="Created" value={formatDate(profile.createdAt)} />
                    <DetailRow icon={Calendar} label="Last Sign In" value={formatDate(profile.lastSignIn)} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Security Settings */}
        <section aria-label="Security settings">
          <ChangePasswordForm />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-6">
            <MFASettings />
            <PasskeySettings />
          </div>
        </section>
      </div>
    </div>
    </PermissionGate>
  );
}

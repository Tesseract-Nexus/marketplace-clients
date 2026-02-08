'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Building2,
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
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/contexts/ToastContext';
import { useUser } from '@/contexts/UserContext';
import { MFASettings } from '@/components/settings/MFASettings';
import { PasskeySettings } from '@/components/settings/PasskeySettings';

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

  // Load profile from UserContext
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
      // Update the user context
      updateUser({
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        displayName: `${editedProfile.firstName} ${editedProfile.lastName}`.trim() || editedProfile.displayName,
        phone: editedProfile.businessPhone,
        jobTitle: editedProfile.jobTitle,
        department: editedProfile.department,
      });

      setProfile({
        ...editedProfile,
        displayName: `${editedProfile.firstName} ${editedProfile.lastName}`.trim() || editedProfile.displayName,
      });
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
  const editPreviewName = `${editedProfile.firstName} ${editedProfile.lastName}`.trim();

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-pulse">
          {/* Skeleton header */}
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
          {/* Skeleton profile card */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 bg-muted rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="h-7 w-48 bg-muted rounded" />
                <div className="h-4 w-56 bg-muted rounded" />
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-muted rounded-full" />
                  <div className="h-6 w-16 bg-muted rounded-full" />
                  <div className="h-6 w-14 bg-muted rounded-full" />
                </div>
              </div>
            </div>
          </div>
          {/* Skeleton grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-52 bg-card rounded-xl border border-border" />
            <div className="space-y-6">
              <div className="h-48 bg-card rounded-xl border border-border" />
              <div className="h-40 bg-card rounded-xl border border-border" />
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
          actions={
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary text-primary-foreground"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="bg-primary text-primary-foreground">
                  Edit Profile
                </Button>
              )}
            </div>
          }
        />

        {/* Profile Header */}
        <section aria-label="Profile information">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="relative">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={profile.displayName}
                    className="h-24 w-24 rounded-full object-cover shadow-lg border-4 border-primary/20"
                  />
                ) : (
                  <div className={`h-24 w-24 rounded-full ${getInitialsBgColor(profile.displayName)} flex items-center justify-center shadow-lg border-4 border-primary/20`}>
                    <span className="text-white font-bold text-2xl">{userInitial}</span>
                  </div>
                )}
                <div
                  className="absolute -bottom-1 -right-1 h-7 w-7 bg-success rounded-full border-4 border-white flex items-center justify-center"
                  title={profile.accountEnabled ? 'Active' : 'Inactive'}
                >
                  <div className="h-2 w-2 bg-card rounded-full" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="mb-3 space-y-2">
                    <div className="flex gap-3">
                      <div className="flex-1 max-w-[180px]">
                        <label className="text-xs text-muted-foreground block mb-1">First Name</label>
                        <Input
                          value={editedProfile.firstName}
                          onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                          placeholder="First Name"
                        />
                      </div>
                      <div className="flex-1 max-w-[180px]">
                        <label className="text-xs text-muted-foreground block mb-1">Last Name</label>
                        <Input
                          value={editedProfile.lastName}
                          onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                          placeholder="Last Name"
                        />
                      </div>
                    </div>
                    {editPreviewName && (
                      <p className="text-sm text-muted-foreground">
                        Display name: <span className="font-semibold text-foreground">{editPreviewName}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold text-foreground mb-2">{profile.displayName}</h2>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(profile.email, 'email')}
                      aria-label="Copy email address"
                    >
                      {copiedField === 'email' ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={editedProfile.jobTitle}
                        onChange={(e) => setEditedProfile({ ...editedProfile, jobTitle: e.target.value })}
                        placeholder="Job Title"
                        className="max-w-[180px] h-7 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {profile.jobTitle || (
                          <span className="italic text-muted-foreground/60">Add your job title</span>
                        )}
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <Input
                      value={editedProfile.department}
                      onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
                      placeholder="Department"
                      className="max-w-[150px] h-7 text-sm"
                    />
                  ) : profile.department ? (
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                      {profile.department}
                    </span>
                  ) : (
                    !isEditing && (
                      <span className="text-xs italic text-muted-foreground/60">No department</span>
                    )
                  )}
                  <span className="px-2 py-1 bg-success-muted text-success-foreground rounded-full text-xs font-semibold">
                    {profile.accountEnabled ? 'Active' : 'Disabled'}
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Contact and organization details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Contact Information</h3>
                  <p className="text-sm text-muted-foreground">Your contact details</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Phone</p>
                      {isEditing ? (
                        <Input
                          value={editedProfile.businessPhone}
                          onChange={(e) => setEditedProfile({ ...editedProfile, businessPhone: e.target.value })}
                          className="mt-1"
                          placeholder="+1-555-0123"
                        />
                      ) : profile.businessPhone ? (
                        <p className="text-sm text-muted-foreground">{profile.businessPhone}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground/60 italic">
                          Add a phone number so colleagues can reach you
                        </p>
                      )}
                    </div>
                  </div>
                  {!isEditing && profile.businessPhone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => copyToClipboard(profile.businessPhone, 'businessPhone')}
                      aria-label="Copy phone number"
                    >
                      {copiedField === 'businessPhone' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Preferred Language</p>
                    {isEditing ? (
                      <select
                        value={editedProfile.preferredLanguage}
                        onChange={(e) => setEditedProfile({ ...editedProfile, preferredLanguage: e.target.value })}
                        className="mt-1 w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                        aria-label="Preferred Language"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-muted-foreground">{getLanguageLabel(profile.preferredLanguage)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Organization & Security */}
            <div className="space-y-6">
              {/* Organization */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Organization</h3>
                    <p className="text-sm text-muted-foreground">Role and account info</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Role</p>
                        <p className="text-sm text-muted-foreground">{profile.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Account Created</p>
                        <p className="text-sm text-muted-foreground">{formatDate(profile.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Last Sign In</p>
                        <p className="text-sm text-muted-foreground">{formatDate(profile.lastSignIn)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="bg-card rounded-xl border border-border border-l-4 border-l-warning p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Key className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Security</h3>
                    <p className="text-sm text-muted-foreground">Password and preferences</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground cursor-not-allowed"
                    disabled
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                    <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">Coming Soon</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground cursor-not-allowed"
                    disabled
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notification Preferences
                    <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">Coming Soon</span>
                  </Button>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                    <Info className="h-3 w-3" />
                    Use the sections below to manage MFA and passkeys
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section aria-label="Security settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <MFASettings />
            <PasskeySettings />
          </div>
        </section>
      </div>
    </div>
    </PermissionGate>
  );
}

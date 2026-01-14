'use client';

import { useState } from 'react';
import {
  Shield,
  Bell,
  DollarSign,
  FileCheck,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/permission-gate';
import { Permissions } from '@/hooks/usePermission';
import { useDialog } from '@/contexts/DialogContext';

const APPROVAL_MODE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual Approval Required' },
  { value: 'AUTO_TRUSTED', label: 'Auto-approve Trusted Vendors' },
  { value: 'AUTO_ALL', label: 'Auto-approve All' },
];

const BILLING_CYCLE_OPTIONS = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

interface AdSettings {
  // Approval Settings
  approvalMode: string;
  requireCreativeReview: boolean;
  autoRejectFlagged: boolean;
  approvalExpirationDays: number;

  // Content Policies
  allowAdultContent: boolean;
  allowAlcoholAds: boolean;
  allowGamblingAds: boolean;
  allowPoliticalAds: boolean;
  requireLandingPageReview: boolean;

  // Financial Settings
  minimumBudget: number;
  minimumBidCpc: number;
  minimumBidCpm: number;
  billingCycle: string;
  revenueSharePercent: number;

  // Notification Settings
  notifyOnSubmission: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  notifyOnBudgetLow: boolean;
  budgetLowThreshold: number;
}

export default function AdSettingsPage() {
  const { showAlert } = useDialog();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AdSettings>({
    approvalMode: 'MANUAL',
    requireCreativeReview: true,
    autoRejectFlagged: true,
    approvalExpirationDays: 7,
    allowAdultContent: false,
    allowAlcoholAds: true,
    allowGamblingAds: false,
    allowPoliticalAds: false,
    requireLandingPageReview: true,
    minimumBudget: 100,
    minimumBidCpc: 0.1,
    minimumBidCpm: 1,
    billingCycle: 'MONTHLY',
    revenueSharePercent: 30,
    notifyOnSubmission: true,
    notifyOnApproval: true,
    notifyOnRejection: true,
    notifyOnBudgetLow: true,
    budgetLowThreshold: 20,
  });

  const updateSetting = <K extends keyof AdSettings>(key: K, value: AdSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await showAlert({
        title: 'Settings Saved',
        message: 'Your ad manager settings have been updated successfully.',
      });
    } catch (err) {
      await showAlert({
        title: 'Error',
        message: 'Failed to save settings. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGate permission={Permissions.ADS_SETTINGS_VIEW} fallback="styled">
      <div className="min-h-screen bg-background p-8">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Ad Manager Settings"
            description="Configure ad policies, approvals, and billing settings"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Ad Manager', href: '/ad-manager' },
              { label: 'Settings' },
            ]}
            actions={
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            }
          />

          <div className="max-w-4xl mx-auto">
          {/* Approval Settings */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Approval Settings</CardTitle>
                  <CardDescription>
                    Configure how ad submissions are reviewed and approved
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Approval Mode</Label>
                  <Select
                    value={settings.approvalMode}
                    onChange={(value) => updateSetting('approvalMode', value)}
                    options={APPROVAL_MODE_OPTIONS}
                  />
                  <p className="text-xs text-muted-foreground">
                    How submissions from vendors should be handled
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Approval Expiration (Days)</Label>
                  <Input
                    type="number"
                    value={settings.approvalExpirationDays}
                    onChange={(e) =>
                      updateSetting('approvalExpirationDays', parseInt(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Days before pending approvals expire
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Require Creative Review</p>
                    <p className="text-sm text-muted-foreground">
                      All creative assets must be reviewed before approval
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireCreativeReview}
                    onCheckedChange={(checked) =>
                      updateSetting('requireCreativeReview', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Auto-reject Flagged Content</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically reject ads flagged by content moderation
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoRejectFlagged}
                    onCheckedChange={(checked) => updateSetting('autoRejectFlagged', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Policies */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle>Content Policies</CardTitle>
                  <CardDescription>
                    Define what types of ads are allowed on your storefronts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Adult Content</p>
                  <p className="text-sm text-muted-foreground">
                    Allow advertisements with adult or mature content
                  </p>
                </div>
                <Switch
                  checked={settings.allowAdultContent}
                  onCheckedChange={(checked) => updateSetting('allowAdultContent', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Alcohol Advertisements</p>
                  <p className="text-sm text-muted-foreground">
                    Allow ads promoting alcoholic beverages
                  </p>
                </div>
                <Switch
                  checked={settings.allowAlcoholAds}
                  onCheckedChange={(checked) => updateSetting('allowAlcoholAds', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Gambling Advertisements</p>
                  <p className="text-sm text-muted-foreground">
                    Allow ads promoting gambling or betting services
                  </p>
                </div>
                <Switch
                  checked={settings.allowGamblingAds}
                  onCheckedChange={(checked) => updateSetting('allowGamblingAds', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Political Advertisements</p>
                  <p className="text-sm text-muted-foreground">
                    Allow political or advocacy advertisements
                  </p>
                </div>
                <Switch
                  checked={settings.allowPoliticalAds}
                  onCheckedChange={(checked) => updateSetting('allowPoliticalAds', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Landing Page Review</p>
                  <p className="text-sm text-muted-foreground">
                    Require landing page review before approval
                  </p>
                </div>
                <Switch
                  checked={settings.requireLandingPageReview}
                  onCheckedChange={(checked) =>
                    updateSetting('requireLandingPageReview', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Financial Settings</CardTitle>
                  <CardDescription>
                    Configure budgets, bids, and billing options
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Minimum Budget ($)</Label>
                  <Input
                    type="number"
                    value={settings.minimumBudget}
                    onChange={(e) =>
                      updateSetting('minimumBudget', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Bid CPC ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.minimumBidCpc}
                    onChange={(e) =>
                      updateSetting('minimumBidCpc', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Bid CPM ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.minimumBidCpm}
                    onChange={(e) =>
                      updateSetting('minimumBidCpm', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Select
                    value={settings.billingCycle}
                    onChange={(value) => updateSetting('billingCycle', value)}
                    options={BILLING_CYCLE_OPTIONS}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revenue Share (%)</Label>
                  <Input
                    type="number"
                    value={settings.revenueSharePercent}
                    onChange={(e) =>
                      updateSetting('revenueSharePercent', parseFloat(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentage of ad revenue shared with product owners
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure when to receive notifications about ad activity
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">New Submissions</p>
                  <p className="text-sm text-muted-foreground">
                    Notify when new ad submissions are received
                  </p>
                </div>
                <Switch
                  checked={settings.notifyOnSubmission}
                  onCheckedChange={(checked) => updateSetting('notifyOnSubmission', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Approvals</p>
                  <p className="text-sm text-muted-foreground">
                    Notify when ads are approved
                  </p>
                </div>
                <Switch
                  checked={settings.notifyOnApproval}
                  onCheckedChange={(checked) => updateSetting('notifyOnApproval', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Rejections</p>
                  <p className="text-sm text-muted-foreground">
                    Notify when ads are rejected
                  </p>
                </div>
                <Switch
                  checked={settings.notifyOnRejection}
                  onCheckedChange={(checked) => updateSetting('notifyOnRejection', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Low Budget Warning</p>
                  <p className="text-sm text-muted-foreground">
                    Notify when campaign budget falls below threshold
                  </p>
                </div>
                <Switch
                  checked={settings.notifyOnBudgetLow}
                  onCheckedChange={(checked) => updateSetting('notifyOnBudgetLow', checked)}
                />
              </div>
              {settings.notifyOnBudgetLow && (
                <div className="ml-4 space-y-2">
                  <Label>Budget Low Threshold (%)</Label>
                  <Input
                    type="number"
                    value={settings.budgetLowThreshold}
                    onChange={(e) =>
                      updateSetting('budgetLowThreshold', parseInt(e.target.value) || 0)
                    }
                    className="max-w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Notify when remaining budget is below this percentage
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}

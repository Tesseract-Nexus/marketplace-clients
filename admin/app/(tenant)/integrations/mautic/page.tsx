'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import {
  Mail,
  Users,
  Target,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  Zap,
  BarChart3,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api/client';

interface MauticStatus {
  enabled: boolean;
  connected: boolean;
  url?: string;
  error?: string;
  lastChecked?: string;
}

interface SyncResult {
  success: boolean;
  mauticId?: number;
  syncedAt?: string;
  error?: string;
}

export default function MauticIntegrationPage() {
  const { showAlert, showConfirm } = useDialog();

  const [status, setStatus] = useState<MauticStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Test email form
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Test Email from Tesseract Hub');
  const [testContent, setTestContent] = useState('<h1>Hello!</h1><p>This is a test email from your Mautic integration.</p>');

  // Fetch integration status
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: MauticStatus } | MauticStatus>('/marketing/integrations/mautic/status');

      if ('success' in response && response.data) {
        setStatus(response.data);
      } else if ('enabled' in response) {
        setStatus(response as MauticStatus);
      }
    } catch (err) {
      console.error('Failed to fetch Mautic status:', err);
      setStatus({
        enabled: false,
        connected: false,
        error: 'Failed to connect to marketing service',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      await showAlert({ title: 'Error', message: 'Please enter a test email address.' });
      return;
    }

    try {
      setSendingTest(true);
      const response = await apiClient.post<{ success: boolean; message?: string; error?: string }>('/marketing/integrations/mautic/test-email', {
        to: testEmail,
        subject: testSubject,
        content: testContent,
      });

      if (response.success) {
        await showAlert({
          title: 'Success',
          message: `Test email sent successfully to ${testEmail}!`
        });
      } else {
        throw new Error(response.error || 'Failed to send test email');
      }
    } catch (err) {
      console.error('Failed to send test email:', err);
      await showAlert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to send test email. Please check your Mautic configuration.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleRefreshConnection = async () => {
    setSyncing(true);
    await fetchStatus();
    setSyncing(false);
  };

  return (
    <PermissionGate
      permission={Permission.SETTINGS_INTEGRATIONS_MANAGE}
      fallback="styled"
      fallbackTitle="Mautic Integration Access Required"
      fallbackDescription="You don't have the required permissions to view Mautic integration. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Mautic Integration"
          description="Marketing automation integration for email campaigns, segments, and customer engagement"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Integrations', href: '/integrations' },
            { label: 'Mautic' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefreshConnection}
                disabled={loading || syncing}
                className="border-border hover:bg-muted"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", (loading || syncing) && "animate-spin")} />
                Refresh Status
              </Button>
              <Button variant="gradient" asChild>
                <a href="https://dev-mautic.tesserix.app" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Mautic Dashboard
                </a>
              </Button>
            </div>
          }
        />

        {/* Status Card */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-lg flex items-center justify-center",
                status?.connected
                  ? "bg-success/10"
                  : "bg-error-muted"
              )}>
                <Mail className={cn(
                  "h-8 w-8",
                  status?.connected ? "text-success" : "text-error"
                )} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Mautic Marketing Automation
                </h3>
                <p className="text-muted-foreground mt-1">
                  Open-source marketing automation for email campaigns and customer engagement
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Checking...</span>
                </div>
              ) : status?.connected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-muted text-success-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : status?.enabled ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning-muted text-warning">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Connection Error</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-error-muted text-error">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Disabled</span>
                </div>
              )}
            </div>
          </div>

          {status?.error && (
            <div className="mt-4 p-3 rounded-lg bg-error-muted border border-error/30 text-error text-sm">
              <strong>Error:</strong> {status.error}
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-lg font-bold text-foreground">Email Campaigns</h4>
            <p className="text-muted-foreground text-sm mt-2">
              Create and send marketing email campaigns directly from your admin dashboard.
              Campaigns sync automatically to Mautic for delivery.
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <a href="/campaigns">
                Manage Campaigns <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-success" />
            </div>
            <h4 className="text-lg font-bold text-foreground">Customer Segments</h4>
            <p className="text-muted-foreground text-sm mt-2">
              Create customer segments based on purchase behavior, loyalty status, and demographics.
              Segments sync to Mautic as contact lists.
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <a href="/customer-segments">
                Manage Segments <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-lg font-bold text-foreground">Campaign Analytics</h4>
            <p className="text-muted-foreground text-sm mt-2">
              Track email opens, clicks, and conversions. View campaign performance
              directly in the admin dashboard or Mautic.
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <a href="/analytics">
                View Analytics <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>

        {/* Test Email Section */}
        {status?.connected && (
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">Send Test Email</h4>
                <p className="text-muted-foreground text-sm">
                  Verify your Mautic integration by sending a test email
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Recipient Email *
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject
                </label>
                <Input
                  type="text"
                  placeholder="Test email subject"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Content (HTML)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-sm focus:outline-none focus:border-primary"
                rows={4}
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSendTestEmail}
                disabled={sendingTest || !testEmail}
                variant="gradient"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Configuration Section */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-foreground">Configuration</h4>
              <p className="text-muted-foreground text-sm">
                Environment variables required for Mautic integration
              </p>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 font-mono text-sm">
            <div className="space-y-2 text-muted-foreground">
              <div><span className="text-primary">MAUTIC_URL</span>=http://mautic.email.svc.cluster.local</div>
              <div><span className="text-primary">MAUTIC_USERNAME</span>=admin</div>
              <div><span className="text-primary">MAUTIC_PASSWORD_SECRET_NAME</span>=mautic-api-password</div>
              <div><span className="text-primary">MAUTIC_ENABLED</span>=true</div>
              <div><span className="text-primary">FROM_EMAIL</span>=noreply@mail.tesserix.app</div>
              <div><span className="text-primary">FROM_NAME</span>=Tesseract Hub</div>
            </div>
          </div>

          <p className="text-muted-foreground text-xs mt-3">
            Mautic credentials are securely stored in GCP Secret Manager. Contact your administrator to update these settings.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <h4 className="text-lg font-bold text-foreground mb-4">Quick Actions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <a href="/campaigns">
                <Mail className="h-5 w-5" />
                <span>Create Campaign</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <a href="/customer-segments">
                <Target className="h-5 w-5" />
                <span>Create Segment</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <a href="https://dev-mautic.tesserix.app/s/contacts" target="_blank" rel="noopener noreferrer">
                <Users className="h-5 w-5" />
                <span>View Contacts</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <a href="https://dev-mautic.tesserix.app/s/emails" target="_blank" rel="noopener noreferrer">
                <Zap className="h-5 w-5" />
                <span>Email Templates</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Building2,
  Key,
  Users,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Settings2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate, Permission, Priority } from '@/components/permission-gate';
import { PageLoading } from '@/components/common';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';

interface SSOConfig {
  googleEnabled: boolean;
  googleClientId?: string;
  microsoftEnabled: boolean;
  microsoftTenantId?: string;
  microsoftClientId?: string;
  oktaEnabled: boolean;
  oktaDomain?: string;
  oktaClientId?: string;
  oktaProtocol?: 'oidc' | 'saml';
  scimEnabled: boolean;
  scimEndpoint?: string;
  enforceSSO: boolean;
  allowPasswordAuth: boolean;
  autoProvisionUsers: boolean;
  requireMFA: boolean;
  sessionDurationHours: number;
  maxSessionsPerUser: number;
}

interface SSOStatus {
  googleConfigured: boolean;
  microsoftConfigured: boolean;
  oktaConfigured: boolean;
  scimEnabled: boolean;
  enforceSSO: boolean;
  allowPasswordAuth: boolean;
  providerDetails: ProviderStatus[];
}

interface ProviderStatus {
  provider: string;
  enabled: boolean;
  protocol: string;
  lastSyncAt?: string;
  idpAlias?: string;
  connectionTest?: boolean;
}

type TabType = 'providers' | 'provisioning' | 'security';

export default function EnterpriseSSOPage() {
  const { showSuccess, showError, showInfo } = useDialog();
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;
  const [activeTab, setActiveTab] = useState<TabType>('providers');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [ssoStatus, setSSOStatus] = useState<SSOStatus | null>(null);
  const [ssoConfig, setSSOConfig] = useState<SSOConfig | null>(null);

  // Provider configuration forms
  const [entraConfig, setEntraConfig] = useState({
    enabled: false,
    tenantId: '',
    clientId: '',
    clientSecret: '',
    allowedGroups: [] as string[],
  });

  const [oktaConfig, setOktaConfig] = useState({
    enabled: false,
    domain: '',
    clientId: '',
    clientSecret: '',
    protocol: 'oidc' as 'oidc' | 'saml',
    samlMetadataUrl: '',
    samlEntityId: '',
    allowedGroups: [] as string[],
  });

  const [scimToken, setSCIMToken] = useState<string | null>(null);

  useEffect(() => {
    loadSSOStatus();
  }, [tenantId]);

  const loadSSOStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff/sso/status', {
        headers: {
          'x-jwt-claim-tenant-id': tenantId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSSOStatus(data.data);

        // Also load full config
        const configResponse = await fetch('/api/staff/sso/config', {
          headers: {
            'x-jwt-claim-tenant-id': tenantId || '',
          },
        });

        if (configResponse.ok) {
          const configData = await configResponse.json();
          setSSOConfig(configData.data);

          // Populate form states
          if (configData.data) {
            setEntraConfig({
              enabled: configData.data.microsoftEnabled || false,
              tenantId: configData.data.microsoftTenantId || '',
              clientId: configData.data.microsoftClientId || '',
              clientSecret: '',
              allowedGroups: [],
            });

            setOktaConfig({
              enabled: configData.data.oktaEnabled || false,
              domain: configData.data.oktaDomain || '',
              clientId: configData.data.oktaClientId || '',
              clientSecret: '',
              protocol: configData.data.oktaProtocol || 'oidc',
              samlMetadataUrl: configData.data.oktaSamlMetadataUrl || '',
              samlEntityId: configData.data.oktaSamlEntityId || '',
              allowedGroups: [],
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load SSO status:', error);
      showError('Error', 'Failed to load SSO configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureEntra = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/staff/sso/providers/entra', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-jwt-claim-tenant-id': tenantId || '',
        },
        body: JSON.stringify(entraConfig),
      });

      if (response.ok) {
        showSuccess('Success', 'Microsoft Entra SSO configured successfully');
        loadSSOStatus();
      } else {
        const error = await response.json();
        showError('Error', error.error?.message || 'Failed to configure Entra');
      }
    } catch (error) {
      showError('Error', 'Failed to configure Microsoft Entra SSO');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigureOkta = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/staff/sso/providers/okta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-jwt-claim-tenant-id': tenantId || '',
        },
        body: JSON.stringify(oktaConfig),
      });

      if (response.ok) {
        showSuccess('Success', 'Okta SSO configured successfully');
        loadSSOStatus();
      } else {
        const error = await response.json();
        showError('Error', error.error?.message || 'Failed to configure Okta');
      }
    } catch (error) {
      showError('Error', 'Failed to configure Okta SSO');
    } finally {
      setSaving(false);
    }
  };

  const handleTestProvider = async (provider: string) => {
    try {
      setTesting(provider);
      const response = await fetch(`/api/staff/sso/providers/${provider}/test`, {
        method: 'POST',
        headers: {
          'x-jwt-claim-tenant-id': tenantId || '',
        },
      });

      const data = await response.json();
      if (data.data?.success) {
        showSuccess('Connection Successful', `${provider} identity provider is reachable`);
      } else {
        showError('Connection Failed', data.data?.message || 'Provider is not reachable');
      }
    } catch (error) {
      showError('Error', 'Failed to test provider connection');
    } finally {
      setTesting(null);
    }
  };

  const handleRemoveProvider = async (provider: string) => {
    try {
      const response = await fetch(`/api/staff/sso/providers/${provider}`, {
        method: 'DELETE',
        headers: {
          'x-jwt-claim-tenant-id': tenantId || '',
        },
      });

      if (response.ok) {
        showSuccess('Success', `${provider} SSO provider removed`);
        loadSSOStatus();
      } else {
        const error = await response.json();
        showError('Error', error.error?.message || 'Failed to remove provider');
      }
    } catch (error) {
      showError('Error', 'Failed to remove provider');
    }
  };

  const handleEnableSCIM = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/staff/sso/scim/enable', {
        method: 'POST',
        headers: {
          'x-jwt-claim-tenant-id': tenantId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSCIMToken(data.data?.token);
        showInfo('SCIM Enabled', 'Copy the token now - it will only be shown once!');
        loadSSOStatus();
      } else {
        const error = await response.json();
        showError('Error', error.error?.message || 'Failed to enable SCIM');
      }
    } catch (error) {
      showError('Error', 'Failed to enable SCIM provisioning');
    } finally {
      setSaving(false);
    }
  };

  const handleRotateSCIMToken = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/staff/sso/scim/rotate-token', {
        method: 'POST',
        headers: {
          'x-jwt-claim-tenant-id': tenantId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSCIMToken(data.data?.token);
        showInfo('Token Rotated', 'Update your IdP with the new token. Copy it now!');
      } else {
        const error = await response.json();
        showError('Error', error.error?.message || 'Failed to rotate token');
      }
    } catch (error) {
      showError('Error', 'Failed to rotate SCIM token');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSecuritySettings = async () => {
    if (!ssoConfig) return;

    try {
      setSaving(true);
      const response = await fetch('/api/staff/sso/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-jwt-claim-tenant-id': tenantId || '',
        },
        body: JSON.stringify({
          enforceSSO: ssoConfig.enforceSSO,
          allowPasswordAuth: ssoConfig.allowPasswordAuth,
          requireMFA: ssoConfig.requireMFA,
          sessionDurationHours: ssoConfig.sessionDurationHours,
          maxSessionsPerUser: ssoConfig.maxSessionsPerUser,
        }),
      });

      if (response.ok) {
        showSuccess('Success', 'Security settings updated');
      } else {
        const error = await response.json();
        showError('Error', error.error?.message || 'Failed to update settings');
      }
    } catch (error) {
      showError('Error', 'Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied', `${label} copied to clipboard`);
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading SSO configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.INTEGRATIONS_SSO_VIEW}
      minPriority={Priority.OWNER}
      fallback="styled"
      fallbackTitle="Enterprise SSO Access Required"
      fallbackDescription="Enterprise SSO configuration is restricted to store owners only. Contact your store owner if you need access to these settings."
      loading={<PageLoading fullScreen />}
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Enterprise Single Sign-On"
            description="Connect your corporate identity provider to enable secure staff login"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Integrations', href: '/integrations' },
              { label: 'Enterprise SSO' },
            ]}
          />

          {/* SSO Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                {ssoStatus?.microsoftConfigured || ssoStatus?.oktaConfigured ? (
                  <CheckCircle2 className="h-8 w-8 text-success" />
                ) : (
                  <XCircle className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">SSO Status</p>
                  <p className="text-lg font-semibold">
                    {ssoStatus?.microsoftConfigured || ssoStatus?.oktaConfigured ? 'Active' : 'Not Configured'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Identity Providers</p>
                  <p className="text-lg font-semibold">
                    {(ssoStatus?.providerDetails || []).filter(p => p.enabled).length} Connected
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                {ssoStatus?.scimEnabled ? (
                  <CheckCircle2 className="h-8 w-8 text-success" />
                ) : (
                  <Users className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">SCIM Provisioning</p>
                  <p className="text-lg font-semibold">
                    {ssoStatus?.scimEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Auth Policy</p>
                  <p className="text-lg font-semibold">
                    {ssoStatus?.enforceSSO ? 'SSO Only' : 'Mixed'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="border-b border-border">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('providers')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'providers'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="h-4 w-4 inline mr-2" />
                  Identity Providers
                </button>
                <button
                  onClick={() => setActiveTab('provisioning')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'provisioning'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  User Provisioning
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'security'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Shield className="h-4 w-4 inline mr-2" />
                  Security
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Identity Providers Tab */}
              {activeTab === 'providers' && (
                <div className="space-y-6">
                  {/* Microsoft Entra */}
                  <div className="border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Microsoft Entra ID</h3>
                          <p className="text-sm text-muted-foreground">Azure Active Directory / Entra</p>
                        </div>
                      </div>
                      {ssoStatus?.microsoftConfigured && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success-muted text-success-foreground">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Connected
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Azure AD Tenant ID
                        </label>
                        <Input
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          value={entraConfig.tenantId}
                          onChange={(e) => setEntraConfig({ ...entraConfig, tenantId: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Application (Client) ID
                        </label>
                        <Input
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          value={entraConfig.clientId}
                          onChange={(e) => setEntraConfig({ ...entraConfig, clientId: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Client Secret
                        </label>
                        <div className="relative">
                          <Input
                            type={showSecrets.entra ? 'text' : 'password'}
                            placeholder="Enter client secret"
                            value={entraConfig.clientSecret}
                            onChange={(e) => setEntraConfig({ ...entraConfig, clientSecret: e.target.value })}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                            onClick={() => toggleSecretVisibility('entra')}
                          >
                            {showSecrets.entra ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={handleConfigureEntra}
                        disabled={saving || !entraConfig.tenantId || !entraConfig.clientId || !entraConfig.clientSecret}
                        className="bg-primary hover:bg-primary text-white"
                      >
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Configuration
                      </Button>
                      {ssoStatus?.microsoftConfigured && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleTestProvider('microsoft')}
                            disabled={testing === 'microsoft'}
                          >
                            {testing === 'microsoft' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                            Test Connection
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRemoveProvider('microsoft')}
                            className="text-error hover:bg-error-muted"
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Okta */}
                  <div className="border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Key className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Okta</h3>
                          <p className="text-sm text-muted-foreground">Supports OIDC and SAML 2.0</p>
                        </div>
                      </div>
                      {ssoStatus?.oktaConfigured && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success-muted text-success-foreground">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Connected
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-foreground mb-2">Protocol</label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="oktaProtocol"
                            value="oidc"
                            checked={oktaConfig.protocol === 'oidc'}
                            onChange={() => setOktaConfig({ ...oktaConfig, protocol: 'oidc' })}
                            className="mr-2"
                          />
                          <span className="text-sm">OIDC (Recommended)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="oktaProtocol"
                            value="saml"
                            checked={oktaConfig.protocol === 'saml'}
                            onChange={() => setOktaConfig({ ...oktaConfig, protocol: 'saml' })}
                            className="mr-2"
                          />
                          <span className="text-sm">SAML 2.0</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Okta Domain
                        </label>
                        <Input
                          placeholder="company.okta.com"
                          value={oktaConfig.domain}
                          onChange={(e) => setOktaConfig({ ...oktaConfig, domain: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Client ID
                        </label>
                        <Input
                          placeholder="0oaxxxxxxxxxxxxxxxx"
                          value={oktaConfig.clientId}
                          onChange={(e) => setOktaConfig({ ...oktaConfig, clientId: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Client Secret
                        </label>
                        <div className="relative">
                          <Input
                            type={showSecrets.okta ? 'text' : 'password'}
                            placeholder="Enter client secret"
                            value={oktaConfig.clientSecret}
                            onChange={(e) => setOktaConfig({ ...oktaConfig, clientSecret: e.target.value })}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                            onClick={() => toggleSecretVisibility('okta')}
                          >
                            {showSecrets.okta ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {oktaConfig.protocol === 'saml' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              SAML Metadata URL
                            </label>
                            <Input
                              placeholder="https://company.okta.com/app/.../sso/saml/metadata"
                              value={oktaConfig.samlMetadataUrl}
                              onChange={(e) => setOktaConfig({ ...oktaConfig, samlMetadataUrl: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Entity ID
                            </label>
                            <Input
                              placeholder="https://company.okta.com/..."
                              value={oktaConfig.samlEntityId}
                              onChange={(e) => setOktaConfig({ ...oktaConfig, samlEntityId: e.target.value })}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={handleConfigureOkta}
                        disabled={saving || !oktaConfig.domain || !oktaConfig.clientId || !oktaConfig.clientSecret}
                        className="bg-primary hover:bg-primary text-white"
                      >
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Configuration
                      </Button>
                      {ssoStatus?.oktaConfigured && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleTestProvider('okta')}
                            disabled={testing === 'okta'}
                          >
                            {testing === 'okta' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                            Test Connection
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRemoveProvider('okta')}
                            className="text-error hover:bg-error-muted"
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* User Provisioning Tab */}
              {activeTab === 'provisioning' && (
                <div className="space-y-6">
                  <div className="border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-success-muted rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">SCIM 2.0 Provisioning</h3>
                        <p className="text-sm text-muted-foreground">Automatically sync users from your identity provider</p>
                      </div>
                    </div>

                    {ssoStatus?.scimEnabled ? (
                      <div className="space-y-4">
                        <div className="bg-success-muted border border-success/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-success-foreground mb-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">SCIM Provisioning is Enabled</span>
                          </div>
                          <p className="text-sm text-success">
                            Configure your identity provider to use the endpoint and token below.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            SCIM Endpoint
                          </label>
                          <div className="flex gap-2">
                            <Input
                              readOnly
                              value={ssoConfig?.scimEndpoint || `https://api.tesserix.app/scim/v2/${tenantId}`}
                              className="font-mono text-sm"
                            />
                            <Button
                              variant="outline"
                              onClick={() => copyToClipboard(ssoConfig?.scimEndpoint || `https://api.tesserix.app/scim/v2/${tenantId}`, 'SCIM Endpoint')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {scimToken && (
                          <div className="bg-warning-muted border border-warning/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-warning mb-2">
                              <AlertTriangle className="h-5 w-5" />
                              <span className="font-medium">Save this token now!</span>
                            </div>
                            <p className="text-sm text-warning mb-3">
                              This token will only be shown once. Copy it and configure your IdP.
                            </p>
                            <div className="flex gap-2">
                              <Input
                                readOnly
                                value={scimToken}
                                className="font-mono text-sm"
                              />
                              <Button
                                variant="outline"
                                onClick={() => copyToClipboard(scimToken, 'SCIM Token')}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={handleRotateSCIMToken}
                            disabled={saving}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Rotate Token
                          </Button>
                        </div>

                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium text-foreground mb-3">Provisioning Settings</h4>
                          <div className="space-y-3">
                            <Checkbox
                              checked={ssoConfig?.autoProvisionUsers || false}
                              onChange={(e) => setSSOConfig(prev => prev ? { ...prev, autoProvisionUsers: e.target.checked } : null)}
                              label="Auto-create users"
                              description="Automatically create staff accounts when provisioned via SCIM"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-foreground mb-2">
                          SCIM Provisioning Not Enabled
                        </h4>
                        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                          Enable SCIM 2.0 to automatically sync users from your identity provider.
                          This allows your IdP to create, update, and deactivate staff accounts.
                        </p>
                        <Button
                          onClick={handleEnableSCIM}
                          disabled={saving}
                          className="bg-success hover:bg-success text-white"
                        >
                          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                          Enable SCIM Provisioning
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Authentication Policy</h3>
                        <p className="text-sm text-muted-foreground">Control how staff members authenticate</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                        <input
                          type="radio"
                          name="authPolicy"
                          checked={!ssoConfig?.enforceSSO && ssoConfig?.allowPasswordAuth}
                          onChange={() => setSSOConfig(prev => prev ? { ...prev, enforceSSO: false, allowPasswordAuth: true } : null)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium text-foreground">Allow both SSO and password login</p>
                          <p className="text-sm text-muted-foreground">
                            Recommended during SSO setup. Staff can use either method.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                        <input
                          type="radio"
                          name="authPolicy"
                          checked={ssoConfig?.enforceSSO === true}
                          onChange={() => setSSOConfig(prev => prev ? { ...prev, enforceSSO: true, allowPasswordAuth: false } : null)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium text-foreground">Enforce SSO only</p>
                          <p className="text-sm text-muted-foreground">
                            Disable password login. Staff must use enterprise SSO.
                          </p>
                          {!(ssoStatus?.microsoftConfigured || ssoStatus?.oktaConfigured) && (
                            <p className="text-sm text-warning mt-1">
                              <AlertTriangle className="h-4 w-4 inline mr-1" />
                              Configure at least one SSO provider first.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t mt-6 pt-6">
                      <h4 className="font-medium text-foreground mb-4">Additional Security</h4>
                      <div className="space-y-4">
                        <Checkbox
                          checked={ssoConfig?.requireMFA || false}
                          onChange={(e) => setSSOConfig(prev => prev ? { ...prev, requireMFA: e.target.checked } : null)}
                          label="Require Multi-Factor Authentication"
                          description="Staff must complete MFA before accessing the admin portal"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Session Duration (hours)
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max="72"
                              value={ssoConfig?.sessionDurationHours || 8}
                              onChange={(e) => setSSOConfig(prev => prev ? { ...prev, sessionDurationHours: parseInt(e.target.value) } : null)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">How long before requiring re-authentication</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Max Sessions Per User
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              value={ssoConfig?.maxSessionsPerUser || 5}
                              onChange={(e) => setSSOConfig(prev => prev ? { ...prev, maxSessionsPerUser: parseInt(e.target.value) } : null)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Maximum concurrent sessions allowed</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button
                        onClick={handleUpdateSecuritySettings}
                        disabled={saving}
                        className="bg-primary hover:bg-primary text-white"
                      >
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Security Settings
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExternalLink className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-primary">Need help configuring SSO?</p>
                <p className="text-sm text-primary">
                  Check our documentation for step-by-step guides on configuring Microsoft Entra, Okta, and SCIM provisioning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}

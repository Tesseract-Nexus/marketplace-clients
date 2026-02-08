'use client';

import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Shield, Lock, KeyRound, Users, Globe, Database, AlertTriangle, Gavel, Mail, Scale } from 'lucide-react';

export function LegalPageClient() {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Security & Compliance' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Hero Section */}
      <header className="relative bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 lg:py-16">
          <Breadcrumb items={breadcrumbItems} />

          <div className="mt-8 md:mt-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 mb-6">
              <Shield className="w-6 h-6 text-tenant-primary" />
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
              Security & Compliance
            </h1>

            <p className="mt-6 text-lg md:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
              How we protect your account, your data, and your shopping experience.
            </p>

            <p className="mt-3 text-sm text-stone-500 dark:text-stone-500">
              Last Updated: February 2026
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-12 md:py-16 lg:py-20">

        {/* Introduction */}
        <section className="max-w-4xl mx-auto px-6 mb-16 md:mb-20">
          <p className="text-xl md:text-2xl text-stone-600 dark:text-stone-400 leading-relaxed text-center">
            At mark8ly, we take security seriously. This policy explains how we protect accounts, data, and businesses on our platform.
          </p>
        </section>

        {/* Policy Sections */}
        <div className="max-w-4xl mx-auto px-6 space-y-8">

          {/* Section 1 */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-tenant-primary" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">1. Account Security</h2>
            </div>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Every merchant account is protected by multi-factor authentication (MFA). This is required for all users.
            </p>
            <ul className="text-stone-600 dark:text-stone-400 space-y-2 list-disc pl-5">
              <li><strong className="text-[var(--text-primary)]">MFA Required:</strong> All merchant accounts must have MFA enabled.</li>
              <li><strong className="text-[var(--text-primary)]">Passkey Support:</strong> Passwordless, phishing-resistant login via FIDO2/WebAuthn.</li>
              <li><strong className="text-[var(--text-primary)]">TOTP Authenticator:</strong> Compatible with any authenticator app.</li>
              <li><strong className="text-[var(--text-primary)]">Backup Codes:</strong> Recovery codes provided during MFA setup.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-tenant-primary" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">2. Password Policy</h2>
            </div>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Strong passwords are your first line of defense:
            </p>
            <ul className="text-stone-600 dark:text-stone-400 space-y-2 list-disc pl-5">
              <li>Minimum 10 characters in length</li>
              <li>Mix of uppercase, lowercase, numbers, and symbols</li>
              <li>No common dictionary words or predictable patterns</li>
              <li>Cannot reuse any of your last 5 passwords</li>
              <li>All passwords are hashed using bcrypt — never stored in plaintext</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-tenant-primary" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">3. No Credential Sharing</h2>
            </div>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Accounts are personal. Sharing login credentials is strictly prohibited.
            </p>
            <ul className="text-stone-600 dark:text-stone-400 space-y-2 list-disc pl-5">
              <li>Never share your password, MFA codes, or backup codes</li>
              <li>Staff Management provides secure team access with role-based permissions</li>
              <li>Each team member needs their own account with MFA</li>
              <li>Shared accounts may result in suspension</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-tenant-primary" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">4. Digital Theft Protection</h2>
            </div>
            <ul className="text-stone-600 dark:text-stone-400 space-y-2 list-disc pl-5">
              <li><strong className="text-[var(--text-primary)]">TLS 1.3 Encryption:</strong> All data in transit is encrypted</li>
              <li><strong className="text-[var(--text-primary)]">PCI DSS Compliance:</strong> Payment processing meets Level 1 standards</li>
              <li><strong className="text-[var(--text-primary)]">Rate Limiting:</strong> API and login endpoints are rate-limited</li>
              <li><strong className="text-[var(--text-primary)]">Brute-Force Lockout:</strong> Accounts locked after repeated failed attempts</li>
              <li><strong className="text-[var(--text-primary)]">Session Security:</strong> Sessions expire after inactivity</li>
              <li><strong className="text-[var(--text-primary)]">Suspicious Login Monitoring:</strong> Unusual logins are detected and flagged</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-tenant-primary" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">5. Business Safeguards</h2>
            </div>
            <ul className="text-stone-600 dark:text-stone-400 space-y-2 list-disc pl-5">
              <li><strong className="text-[var(--text-primary)]">Data Backups:</strong> Automated daily backups with point-in-time recovery</li>
              <li><strong className="text-[var(--text-primary)]">Tenant Isolation:</strong> Data is logically isolated — no cross-tenant access</li>
              <li><strong className="text-[var(--text-primary)]">Penetration Testing:</strong> Regular security assessments and penetration tests</li>
              <li><strong className="text-[var(--text-primary)]">Uptime SLA:</strong> 99.9% uptime target for production services</li>
              <li><strong className="text-[var(--text-primary)]">Infrastructure Monitoring:</strong> 24/7 automated monitoring with alerting</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-tenant-primary" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">6. Data Protection</h2>
            </div>
            <ul className="text-stone-600 dark:text-stone-400 space-y-2 list-disc pl-5">
              <li><strong className="text-[var(--text-primary)]">GDPR Compliance:</strong> We follow GDPR principles for data processing, storage, and deletion</li>
              <li><strong className="text-[var(--text-primary)]">Account Closure:</strong> All data permanently deleted within 90 days of closure</li>
              <li><strong className="text-[var(--text-primary)]">Data Minimization:</strong> We only collect data necessary to provide our service</li>
              <li><strong className="text-[var(--text-primary)]">No Selling Data:</strong> We never sell data to third parties</li>
            </ul>
          </div>

          {/* Section 7 */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-tenant-primary" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">7. Your Responsibilities</h2>
            </div>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Security is a shared responsibility:
            </p>
            <ul className="text-stone-600 dark:text-stone-400 space-y-2 list-disc pl-5">
              <li>Keep your devices secure with up-to-date software</li>
              <li>Use a unique, strong password</li>
              <li>Keep MFA enabled at all times</li>
              <li>Review staff permissions regularly</li>
              <li>Monitor for unauthorized changes</li>
              <li>Report suspicious activity immediately</li>
            </ul>
          </div>

          {/* Section 8 */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">8. Incident Response</h2>
            </div>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              If you believe your account has been compromised:
            </p>
            <ol className="text-stone-600 dark:text-stone-400 space-y-2 list-decimal pl-5">
              <li>Change your password from a trusted device</li>
              <li>Revoke all active sessions</li>
              <li>Review recent activity in your audit log</li>
              <li>Contact <a href="mailto:security@mark8ly.app" className="text-tenant-primary hover:underline">security@mark8ly.app</a></li>
              <li>Notify your customers if their data may be affected</li>
            </ol>
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/30">
              <p className="text-stone-700 dark:text-stone-300 text-sm m-0">
                <strong>Breach Notification:</strong> We will notify affected users within 72 hours of a confirmed data breach, in compliance with GDPR requirements.
              </p>
            </div>
          </div>

          {/* Section 9 */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <Gavel className="w-5 h-5 text-tenant-primary" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">9. Liability</h2>
            </div>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              You are responsible for all activity under your account. mark8ly is not liable for unauthorized access resulting from:
            </p>
            <ul className="text-stone-600 dark:text-stone-400 space-y-2 list-disc pl-5">
              <li>Weak or reused passwords</li>
              <li>Shared credentials</li>
              <li>Disabled or bypassed MFA</li>
              <li>Failure to secure your own devices</li>
              <li>Phishing attacks where credentials were voluntarily provided</li>
            </ul>
          </div>

          {/* Section 10 */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-tenant-primary" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">10. Contact</h2>
            </div>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Have questions about security, want to report a vulnerability, or need help?
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-lg">
                <p className="font-semibold text-[var(--text-primary)] text-sm mb-1">Security Team</p>
                <a href="mailto:security@mark8ly.app" className="text-tenant-primary hover:underline text-sm">security@mark8ly.app</a>
              </div>
              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-lg">
                <p className="font-semibold text-[var(--text-primary)] text-sm mb-1">General Support</p>
                <a href="mailto:support@mark8ly.app" className="text-tenant-primary hover:underline text-sm">support@mark8ly.app</a>
              </div>
            </div>
          </div>

        </div>

        {/* Closing */}
        <section className="max-w-4xl mx-auto px-6 mt-12">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8 shadow-sm text-center">
            <p className="text-stone-600 dark:text-stone-400 font-medium">
              By using this platform, you agree to the Security & Compliance policy. This policy is updated as security practices evolve.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Scale, Shield, Lock, KeyRound, Users, Globe, Database, AlertTriangle, Gavel, Mail } from 'lucide-react';

export default function LegalCompliancePage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Legal & Compliance</h1>
            <p className="text-sm text-muted-foreground">Security policies and compliance requirements for your store</p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-muted-foreground">
        Last Updated: February 2026
      </div>

      {/* Introduction */}
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
        <p className="text-sm text-foreground leading-relaxed">
          At mark8ly, we take security seriously. This policy explains how we protect your account, your data, and your business — and what we expect from you in return.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="space-y-6">

        {/* Section 1 */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">1. Account Security</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Every merchant account on mark8ly is protected by multi-factor authentication (MFA). This is not optional — it's required for all users.
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li><strong className="text-foreground">MFA Required:</strong> All merchant accounts must have MFA enabled. You'll set this up during onboarding.</li>
            <li><strong className="text-foreground">Passkey Support:</strong> We support passkeys (FIDO2/WebAuthn) for passwordless, phishing-resistant login.</li>
            <li><strong className="text-foreground">TOTP Authenticator:</strong> You can use any authenticator app (Google Authenticator, Authy, 1Password, etc.) to generate time-based one-time passwords.</li>
            <li><strong className="text-foreground">Backup Codes:</strong> During MFA setup, you'll receive backup codes. Store these securely — they're your recovery lifeline.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">2. Password Policy</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Strong passwords are your first line of defense. All passwords on mark8ly must meet the following requirements:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Minimum 10 characters in length</li>
            <li>Must include a mix of uppercase and lowercase letters, numbers, and symbols</li>
            <li>No common dictionary words or predictable patterns (e.g., "password123")</li>
            <li>Cannot reuse any of your last 5 passwords</li>
            <li>All passwords are hashed using bcrypt before storage — we never store plaintext passwords</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">3. No Credential Sharing</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Your mark8ly account is personal to you. Sharing login credentials is strictly prohibited.
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Never share your password, MFA codes, or backup codes with anyone</li>
            <li>Use <strong className="text-foreground">Staff Management</strong> to grant team members their own access</li>
            <li>Each staff member must have their own account with their own MFA setup</li>
            <li>Shared accounts may result in immediate suspension while we investigate</li>
          </ul>
          <div className="mt-4 p-3 bg-primary/5 rounded-lg">
            <p className="text-sm text-foreground m-0">
              <strong>Need team access?</strong> Use the Staff Management feature to invite team members with role-based permissions. It's free, secure, and the right way to collaborate.
            </p>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">4. Digital Theft Protection</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            We use industry-standard and beyond-standard measures to protect your business from digital threats:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li><strong className="text-foreground">TLS 1.3 Encryption:</strong> All data in transit is encrypted using the latest TLS protocol</li>
            <li><strong className="text-foreground">PCI DSS Compliance:</strong> Payment processing meets PCI DSS Level 1 standards</li>
            <li><strong className="text-foreground">Rate Limiting:</strong> API and login endpoints are rate-limited to prevent abuse</li>
            <li><strong className="text-foreground">Brute-Force Lockout:</strong> Accounts are temporarily locked after repeated failed login attempts</li>
            <li><strong className="text-foreground">Session Security:</strong> Sessions expire after inactivity, and you can view/revoke active sessions</li>
            <li><strong className="text-foreground">Suspicious Login Monitoring:</strong> We detect and flag logins from unusual locations or devices</li>
          </ul>
        </div>

        {/* Section 5 */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">5. Business Safeguards</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Your store runs on infrastructure designed for reliability and security:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li><strong className="text-foreground">Data Backups:</strong> Automated daily backups with point-in-time recovery</li>
            <li><strong className="text-foreground">Tenant Isolation:</strong> Your data is logically isolated from other merchants — no cross-tenant access is possible</li>
            <li><strong className="text-foreground">Penetration Testing:</strong> We conduct regular security assessments and penetration tests</li>
            <li><strong className="text-foreground">Uptime SLA:</strong> We target 99.9% uptime for all production services</li>
            <li><strong className="text-foreground">Infrastructure Monitoring:</strong> 24/7 automated monitoring with alerting for anomalies</li>
          </ul>
        </div>

        {/* Section 6 */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">6. Data Protection</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            We respect your data and your customers' data. Here's how we handle it:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li><strong className="text-foreground">GDPR Compliance:</strong> We follow GDPR principles for data processing, storage, and deletion</li>
            <li><strong className="text-foreground">Account Closure:</strong> Upon account closure, all data is permanently deleted within 90 days</li>
            <li><strong className="text-foreground">Data Minimization:</strong> We only collect and store data necessary to provide our service</li>
            <li><strong className="text-foreground">No Selling Data:</strong> We never sell your data or your customers' data to third parties</li>
          </ul>
        </div>

        {/* Section 7 */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">7. Your Responsibilities</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Security is a shared responsibility. As a mark8ly merchant, you agree to:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Keep your devices secure with up-to-date software and antivirus protection</li>
            <li>Use a unique, strong password that you don't use on any other service</li>
            <li>Keep MFA enabled at all times — do not disable it</li>
            <li>Review staff permissions regularly and remove access when no longer needed</li>
            <li>Monitor your store for unauthorized changes to products, prices, or settings</li>
            <li>Report any suspicious activity to our security team immediately</li>
          </ul>
        </div>

        {/* Section 8 */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">8. Incident Response</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            If you believe your account has been compromised, take these steps immediately:
          </p>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
            <li>Change your password from a trusted device</li>
            <li>Revoke all active sessions from your security settings</li>
            <li>Review recent activity in your audit log</li>
            <li>Contact our security team at <a href="mailto:security@mark8ly.app" className="text-primary hover:underline">security@mark8ly.app</a></li>
            <li>If customer data may be affected, notify your customers as appropriate</li>
          </ol>
          <div className="mt-4 p-3 bg-destructive/5 border border-destructive/10 rounded-lg">
            <p className="text-sm text-foreground m-0">
              <strong>Breach Notification:</strong> In the event of a confirmed data breach, we will notify affected users within 72 hours, in compliance with GDPR requirements.
            </p>
          </div>
        </div>

        {/* Section 9 */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Gavel className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">9. Liability</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            You are responsible for all activity that occurs under your account. This includes actions taken by staff members you've granted access to.
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            mark8ly is not liable for unauthorized access resulting from:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Weak or reused passwords</li>
            <li>Shared credentials</li>
            <li>Disabled or bypassed MFA</li>
            <li>Failure to secure your own devices</li>
            <li>Phishing attacks where you voluntarily provided credentials</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            We provide the tools to keep your account secure. Using them is your responsibility.
          </p>
        </div>

        {/* Section 10 */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Have questions about security, want to report a vulnerability, or need help with your account?
          </p>
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm m-0"><strong className="text-foreground">Security Team:</strong> <a href="mailto:security@mark8ly.app" className="text-primary hover:underline">security@mark8ly.app</a></p>
            <p className="text-sm m-0"><strong className="text-foreground">General Support:</strong> <a href="mailto:support@mark8ly.app" className="text-primary hover:underline">support@mark8ly.app</a></p>
          </div>
        </div>
      </div>

      {/* Closing */}
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 text-center">
        <p className="text-sm text-foreground font-medium m-0">
          By using mark8ly, you agree to follow this Security & Compliance policy. We update this policy as our security practices evolve — we'll notify you of significant changes.
        </p>
      </div>
    </div>
  );
}

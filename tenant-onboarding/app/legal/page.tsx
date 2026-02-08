'use client';

import Header from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function SecurityCompliancePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight mb-4 text-foreground">
            Security & Compliance
          </h1>
          <p className="text-foreground-secondary">
            Last Updated: February 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-lg text-foreground-secondary space-y-8">

            {/* Introduction */}
            <div className="p-6 bg-warm-50 rounded-xl border border-warm-200">
              <p className="text-foreground leading-relaxed m-0">
                At mark8ly, we take security seriously. This policy explains how we protect your account, your data, and your business — and what we expect from you in return. We've written this in plain language so everyone can understand their responsibilities.
              </p>
            </div>

            {/* Section 1 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">1. Account Security</h2>
              <p className="leading-relaxed">
                Every merchant account on mark8ly is protected by multi-factor authentication (MFA). This is not optional — it's required for all users.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>MFA Required:</strong> All merchant accounts must have MFA enabled. You'll set this up during onboarding.</li>
                <li><strong>Passkey Support:</strong> We support passkeys (FIDO2/WebAuthn) for passwordless, phishing-resistant login.</li>
                <li><strong>TOTP Authenticator:</strong> You can use any authenticator app (Google Authenticator, Authy, 1Password, etc.) to generate time-based one-time passwords.</li>
                <li><strong>Backup Codes:</strong> During MFA setup, you'll receive backup codes. Store these securely — they're your recovery lifeline.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">2. Password Policy</h2>
              <p className="leading-relaxed">
                Strong passwords are your first line of defense. All passwords on mark8ly must meet the following requirements:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Minimum 10 characters in length</li>
                <li>Must include a mix of uppercase and lowercase letters, numbers, and symbols</li>
                <li>No common dictionary words or predictable patterns (e.g., "password123")</li>
                <li>Cannot reuse any of your last 5 passwords</li>
                <li>All passwords are hashed using bcrypt before storage — we never store plaintext passwords</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">3. No Credential Sharing</h2>
              <p className="leading-relaxed">
                Your mark8ly account is personal to you. Sharing login credentials is strictly prohibited.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Never share your password, MFA codes, or backup codes with anyone</li>
                <li>Use <strong>Staff Management</strong> to grant team members their own access</li>
                <li>Each staff member must have their own account with their own MFA setup</li>
                <li>Shared accounts may result in immediate suspension while we investigate</li>
              </ul>
              <div className="mt-4 p-4 bg-sage-50 border border-sage-200 rounded-lg">
                <p className="text-sage-700 m-0">
                  <strong>Need team access?</strong> Use the Staff Management feature in your admin panel to invite team members with role-based permissions. It's free, secure, and the right way to collaborate.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">4. Digital Theft Protection</h2>
              <p className="leading-relaxed">
                We use industry-standard and beyond-standard measures to protect your business from digital threats:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>TLS 1.3 Encryption:</strong> All data in transit is encrypted using the latest TLS protocol</li>
                <li><strong>PCI DSS Compliance:</strong> Payment processing meets PCI DSS Level 1 standards</li>
                <li><strong>Rate Limiting:</strong> API and login endpoints are rate-limited to prevent abuse</li>
                <li><strong>Brute-Force Lockout:</strong> Accounts are temporarily locked after repeated failed login attempts</li>
                <li><strong>Session Security:</strong> Sessions expire after inactivity, and you can view/revoke active sessions</li>
                <li><strong>Suspicious Login Monitoring:</strong> We detect and flag logins from unusual locations or devices</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">5. Business Safeguards</h2>
              <p className="leading-relaxed">
                Your store runs on infrastructure designed for reliability and security:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Data Backups:</strong> Automated daily backups with point-in-time recovery</li>
                <li><strong>Tenant Isolation:</strong> Your data is logically isolated from other merchants — no cross-tenant access is possible</li>
                <li><strong>Penetration Testing:</strong> We conduct regular security assessments and penetration tests</li>
                <li><strong>Uptime SLA:</strong> We target 99.9% uptime for all production services</li>
                <li><strong>Infrastructure Monitoring:</strong> 24/7 automated monitoring with alerting for anomalies</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">6. Data Protection</h2>
              <p className="leading-relaxed">
                We respect your data and your customers' data. Here's how we handle it:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>GDPR Compliance:</strong> We follow GDPR principles for data processing, storage, and deletion</li>
                <li><strong>Account Closure:</strong> Upon account closure, all data is permanently deleted within 90 days</li>
                <li><strong>Data Minimization:</strong> We only collect and store data necessary to provide our service</li>
                <li><strong>No Selling Data:</strong> We never sell your data or your customers' data to third parties</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">7. Your Responsibilities</h2>
              <p className="leading-relaxed">
                Security is a shared responsibility. As a mark8ly merchant, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Keep your devices secure with up-to-date software and antivirus protection</li>
                <li>Use a unique, strong password that you don't use on any other service</li>
                <li>Keep MFA enabled at all times — do not disable it</li>
                <li>Review staff permissions regularly and remove access when no longer needed</li>
                <li>Monitor your store for unauthorized changes to products, prices, or settings</li>
                <li>Report any suspicious activity to our security team immediately</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">8. Incident Response</h2>
              <p className="leading-relaxed">
                If you believe your account has been compromised, take these steps immediately:
              </p>
              <ol className="list-decimal pl-6 space-y-2 mt-4">
                <li>Change your password from a trusted device</li>
                <li>Revoke all active sessions from your security settings</li>
                <li>Review recent activity in your audit log</li>
                <li>Contact our security team at <a href="mailto:security@mark8ly.app" className="text-primary hover:underline">security@mark8ly.app</a></li>
                <li>If customer data may be affected, notify your customers as appropriate</li>
              </ol>
              <div className="mt-4 p-4 bg-warm-50 border border-warm-200 rounded-lg">
                <p className="m-0">
                  <strong>Breach Notification:</strong> In the event of a confirmed data breach, we will notify affected users within 72 hours, in compliance with GDPR requirements. We will also notify relevant regulatory authorities as required by law.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">9. Liability</h2>
              <p className="leading-relaxed">
                You are responsible for all activity that occurs under your account. This includes actions taken by staff members you've granted access to.
              </p>
              <p className="leading-relaxed mt-4">
                mark8ly is not liable for unauthorized access resulting from:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Weak or reused passwords</li>
                <li>Shared credentials</li>
                <li>Disabled or bypassed MFA</li>
                <li>Failure to secure your own devices</li>
                <li>Phishing attacks where you voluntarily provided credentials</li>
              </ul>
              <p className="leading-relaxed mt-4">
                We provide the tools to keep your account secure. Using them is your responsibility.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">10. Contact</h2>
              <p className="leading-relaxed">
                Have questions about security, want to report a vulnerability, or need help with your account?
              </p>
              <div className="mt-4 p-4 bg-warm-50 border border-warm-200 rounded-lg">
                <p className="m-0"><strong>Security Team:</strong> <a href="mailto:security@mark8ly.app" className="text-primary hover:underline">security@mark8ly.app</a></p>
                <p className="mt-2 mb-0"><strong>General Support:</strong> <a href="mailto:support@mark8ly.app" className="text-primary hover:underline">support@mark8ly.app</a></p>
              </div>
            </section>

            {/* Closing */}
            <section className="mt-12 p-6 bg-sage-50 rounded-xl border border-sage-200">
              <p className="text-sage-700 font-medium m-0 text-center">
                By using mark8ly, you agree to follow this Security & Compliance policy. We update this policy as our security practices evolve — we'll notify you of significant changes.
              </p>
            </section>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

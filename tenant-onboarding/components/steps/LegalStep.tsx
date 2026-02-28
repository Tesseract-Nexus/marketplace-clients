'use client';

import { Scale, ArrowLeft, ArrowRight } from 'lucide-react';
import { config } from '../../lib/config/app';
import type { LegalStepProps } from './types';

export function LegalStep({
  setCurrentSection,
  legalAccepted,
  setLegalAccepted,
  hasScrolledToBottom,
  setHasScrolledToBottom,
  legalScrollRef,
  markStepCompleted,
  onLegalAccepted,
}: LegalStepProps) {
  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center">
            <Scale className="w-6 h-6 text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-medium text-foreground">Legal & Compliance</h1>
            <p className="text-muted-foreground">Review and accept our security policy before launching</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Scrollable legal content */}
        <div
          ref={legalScrollRef}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
              setHasScrolledToBottom(true);
            }
          }}
          className="max-h-[500px] overflow-y-auto border border-border rounded-xl p-6 bg-background text-sm leading-relaxed text-foreground-secondary space-y-6"
        >
          <div className="p-4 bg-warm-50 rounded-lg border border-warm-200">
            <p className="text-foreground m-0 text-sm">
              At mark8ly, we take security seriously. This policy explains how we protect your account, your data, and your business — and what we expect from you in return.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">1. Account Security</h3>
            <p>Every merchant account on mark8ly is protected by multi-factor authentication (MFA). This is not optional.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>MFA Required:</strong> All merchant accounts must have MFA enabled.</li>
              <li><strong>Passkey Support:</strong> We support passkeys (FIDO2/WebAuthn) for passwordless login.</li>
              <li><strong>TOTP Authenticator:</strong> Use any authenticator app to generate time-based one-time passwords.</li>
              <li><strong>Backup Codes:</strong> Store your backup codes securely — they&apos;re your recovery lifeline.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">2. Password Policy</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Minimum 10 characters</li>
              <li>Mix of uppercase, lowercase, numbers, and symbols</li>
              <li>No common dictionary words or predictable patterns</li>
              <li>Cannot reuse your last 5 passwords</li>
              <li>All passwords are hashed using bcrypt</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">3. No Credential Sharing</h3>
            <p>Your account is personal. Never share your password, MFA codes, or backup codes.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Use Staff Management to grant team members their own access</li>
              <li>Each staff member needs their own account with MFA</li>
              <li>Shared accounts may result in suspension</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">4. Digital Theft Protection</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>TLS 1.3:</strong> All data in transit is encrypted</li>
              <li><strong>PCI DSS:</strong> Payment processing meets Level 1 standards</li>
              <li><strong>Rate Limiting:</strong> API and login endpoints are rate-limited</li>
              <li><strong>Brute-Force Lockout:</strong> Accounts locked after repeated failed attempts</li>
              <li><strong>Session Security:</strong> Sessions expire after inactivity</li>
              <li><strong>Suspicious Login Monitoring:</strong> Unusual logins are flagged</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">5. Business Safeguards</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Data Backups:</strong> Automated daily backups with point-in-time recovery</li>
              <li><strong>Tenant Isolation:</strong> Your data is logically isolated from other merchants</li>
              <li><strong>Penetration Testing:</strong> Regular security assessments</li>
              <li><strong>Uptime SLA:</strong> 99.9% uptime target</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">6. Data Protection</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>GDPR Compliance:</strong> We follow GDPR principles</li>
              <li><strong>Account Closure:</strong> Data deleted within 90 days of closure</li>
              <li><strong>No Selling Data:</strong> We never sell your data to third parties</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">7. Your Responsibilities</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Keep your devices secure with up-to-date software</li>
              <li>Use a unique, strong password</li>
              <li>Keep MFA enabled at all times</li>
              <li>Review staff permissions regularly</li>
              <li>Monitor for unauthorized changes</li>
              <li>Report suspicious activity immediately</li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">8. Incident Response</h3>
            <p>If your account is compromised:</p>
            <ol className="list-decimal pl-5 space-y-1 mt-2">
              <li>Change your password immediately</li>
              <li>Revoke all active sessions</li>
              <li>Review your audit log</li>
              <li>Contact security@mark8ly.app</li>
            </ol>
            <p className="mt-2"><strong>Breach Notification:</strong> We will notify affected users within 72 hours of a confirmed breach.</p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">9. Liability</h3>
            <p>You are responsible for all activity under your account. mark8ly is not liable for unauthorized access resulting from weak passwords, shared credentials, disabled MFA, or failure to secure your devices.</p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-medium text-foreground mb-2">10. Contact</h3>
            <p><strong>Security Team:</strong> security@mark8ly.app</p>
            <p><strong>General Support:</strong> support@mark8ly.app</p>
          </div>
        </div>

        {/* Scroll hint */}
        {!hasScrolledToBottom && (
          <p className="text-xs text-muted-foreground text-center animate-pulse">
            Scroll to the bottom to enable the agreement checkbox
          </p>
        )}

        {/* Agreement checkbox */}
        <label className={`flex items-start gap-3 p-4 rounded-xl border ${legalAccepted ? 'border-sage-300 bg-sage-50' : 'border-border'} transition-colors ${!hasScrolledToBottom ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={legalAccepted}
            onChange={(e) => setLegalAccepted(e.target.checked)}
            disabled={!hasScrolledToBottom}
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary disabled:opacity-50"
          />
          <span className="text-sm text-foreground leading-relaxed">
            I have read and agree to the{' '}
            <a href="/legal" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Security & Compliance Policy</a>,{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</a>, and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>.
          </span>
        </label>
      </div>

      {/* Navigation buttons */}
      <div className="pt-6 flex gap-4">
        <button
          type="button"
          onClick={() => setCurrentSection(config.features.documents.enabled ? 4 : 3)}
          className="flex-1 h-14 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          type="button"
          disabled={!legalAccepted}
          onClick={() => { onLegalAccepted(); markStepCompleted(5); setCurrentSection(6); }}
          className="flex-1 h-14 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Shield,
  Loader2,
  Check,
  Copy,
  KeyRound,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import {
  getTotpStatus,
  initiateTotpSetup,
  confirmTotpSetup,
  disableTotp,
  regenerateBackupCodes,
} from '@/lib/auth/auth-client';

type MFAFlow = 'idle' | 'enable-scan' | 'enable-verify' | 'enable-backup' | 'disable' | 'regenerate';

export function MFASettings() {
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [flow, setFlow] = useState<MFAFlow>('idle');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Enable flow state
  const [setupSession, setSetupSession] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showManualKey, setShowManualKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [acknowledgedBackupWarning, setAcknowledgedBackupWarning] = useState(false);

  // Code input
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load TOTP status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const result = await getTotpStatus();
      if (result.success) {
        setTotpEnabled(result.totp_enabled);
        setBackupCodesRemaining(result.backup_codes_remaining);
      }
    } catch {
      // Silently handle
    }
    setIsLoadingStatus(false);
  };

  const resetCode = () => {
    setCode(['', '', '', '', '', '']);
    setTimeout(() => codeRefs.current[0]?.focus(), 50);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length >= 6) {
      const digits = pastedData.slice(0, 6).split('');
      setCode(digits);
      codeRefs.current[5]?.focus();
    }
  };

  const getCodeString = () => code.join('');

  // Enable TOTP: Step 1 - Initiate
  const handleStartEnable = async () => {
    setError('');
    setIsProcessing(true);
    try {
      const result = await initiateTotpSetup();
      if (result.success && result.setup_session) {
        setSetupSession(result.setup_session);
        setTotpUri(result.totp_uri || '');
        setManualKey(result.manual_entry_key || '');
        setBackupCodes(result.backup_codes || []);
        setFlow('enable-scan');
      } else {
        setError(result.message || 'Failed to start TOTP setup.');
      }
    } catch {
      setError('Failed to start TOTP setup.');
    }
    setIsProcessing(false);
  };

  // Enable TOTP: Step 2 - Verify code
  const handleVerifySetup = async () => {
    const codeStr = getCodeString();
    if (codeStr.length !== 6) return;

    setError('');
    setIsProcessing(true);
    try {
      const result = await confirmTotpSetup(setupSession, codeStr);
      if (result.success) {
        setAcknowledgedBackupWarning(false);
        setFlow('enable-backup');
      } else {
        setError(result.message || 'Invalid code.');
        resetCode();
      }
    } catch {
      setError('Verification failed.');
      resetCode();
    }
    setIsProcessing(false);
  };

  // Enable TOTP: Step 3 - Acknowledge backup codes
  const handleBackupCodesAcknowledged = () => {
    setTotpEnabled(true);
    setBackupCodesRemaining(backupCodes.length);
    setFlow('idle');
    setSetupSession('');
    setTotpUri('');
    setManualKey('');
    setBackupCodes([]);
    setAcknowledgedBackupWarning(false);
    resetCode();
  };

  // Disable TOTP
  const handleDisable = async () => {
    const codeStr = getCodeString();
    if (codeStr.length !== 6) return;

    setError('');
    setIsProcessing(true);
    try {
      const result = await disableTotp(codeStr);
      if (result.success) {
        setTotpEnabled(false);
        setBackupCodesRemaining(0);
        setFlow('idle');
        resetCode();
      } else {
        setError(result.message || 'Invalid code.');
        resetCode();
      }
    } catch {
      setError('Failed to disable TOTP.');
      resetCode();
    }
    setIsProcessing(false);
  };

  // Regenerate backup codes
  const handleRegenerate = async () => {
    const codeStr = getCodeString();
    if (codeStr.length !== 6) return;

    setError('');
    setIsProcessing(true);
    try {
      const result = await regenerateBackupCodes(codeStr);
      if (result.success && result.backup_codes) {
        setBackupCodes(result.backup_codes);
        setBackupCodesRemaining(result.backup_codes.length);
        setAcknowledgedBackupWarning(false);
        setFlow('enable-backup'); // Reuse backup codes display
      } else {
        setError(result.message || 'Invalid code.');
        resetCode();
      }
    } catch {
      setError('Failed to regenerate backup codes.');
      resetCode();
    }
    setIsProcessing(false);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n')).then(() => {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    });
  };

  const handleCancel = () => {
    setFlow('idle');
    setError('');
    resetCode();
    setSetupSession('');
    setTotpUri('');
    setManualKey('');
    setBackupCodes([]);
    setShowManualKey(false);
    setAcknowledgedBackupWarning(false);
  };

  // Code input component (reused across flows)
  const renderCodeInput = () => (
    <div className="flex justify-center gap-2" role="group" aria-label="6-digit authentication code">
      {code.map((digit, index) => (
        <input
          key={index}
          ref={el => { codeRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleCodeChange(index, e.target.value)}
          onKeyDown={e => handleCodeKeyDown(index, e)}
          onPaste={index === 0 ? handleCodePaste : undefined}
          aria-label={`Digit ${index + 1}`}
          className="w-11 h-11 text-center text-lg font-bold rounded-lg border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          disabled={isProcessing}
        />
      ))}
    </div>
  );

  if (isLoadingStatus) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading MFA settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">Secure your account with an authenticator app</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-error bg-error-muted border border-error/30 rounded-lg px-3 py-2 mb-4">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Idle State — Status + Actions */}
      {flow === 'idle' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Authenticator App
                </p>
                <p className="text-xs text-muted-foreground">
                  {totpEnabled
                    ? `Enabled - ${backupCodesRemaining} backup code${backupCodesRemaining !== 1 ? 's' : ''} remaining`
                    : 'Not configured'}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              totpEnabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-muted-foreground/10 text-muted-foreground'
            }`}>
              {totpEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>

          {!totpEnabled ? (
            <Button
              onClick={handleStartEnable}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Smartphone className="h-4 w-4 mr-2" />
              )}
              Enable Authenticator App
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setFlow('regenerate'); resetCode(); }}
                className="flex-1"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Regenerate Backup Codes
              </Button>
              <Button
                variant="outline"
                onClick={() => { setFlow('disable'); resetCode(); }}
                className="flex-1 text-error hover:text-error border-error/30 hover:bg-error-muted"
              >
                <X className="h-4 w-4 mr-2" />
                Disable
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Enable Flow: Step 1 — Scan QR */}
      {flow === 'enable-scan' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            {totpUri && (
              <div className="bg-white rounded-xl p-4 inline-block border border-border mb-4">
                <QRCodeSVG value={totpUri} size={180} level="M" />
              </div>
            )}
            <div>
              <button
                onClick={() => setShowManualKey(!showManualKey)}
                className="text-xs text-primary hover:underline"
              >
                {showManualKey ? 'Hide manual key' : "Can't scan? Enter key manually"}
              </button>
              {showManualKey && manualKey && (
                <div className="mt-2 bg-muted rounded-lg p-3">
                  <code className="text-xs font-mono font-semibold text-foreground break-all">
                    {manualKey}
                  </code>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => { setFlow('enable-verify'); resetCode(); }}
              className="flex-1"
            >
              Next: Verify Code
            </Button>
          </div>
        </div>
      )}

      {/* Enable Flow: Step 2 — Verify Code */}
      {flow === 'enable-verify' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Enter the 6-digit code from your authenticator app to confirm setup.
          </p>
          {renderCodeInput()}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setFlow('enable-scan')} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleVerifySetup}
              disabled={isProcessing || getCodeString().length !== 6}
              className="flex-1"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify & Enable
            </Button>
          </div>
        </div>
      )}

      {/* Enable Flow: Step 3 — Backup Codes / Also used for regenerate */}
      {flow === 'enable-backup' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Save these backup codes in a safe place. Each code can only be used once.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((bcode, i) => (
              <div
                key={i}
                className="font-mono text-sm font-semibold text-foreground bg-muted rounded-lg py-2 px-3 text-center"
              >
                {bcode}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={handleCopyBackupCodes}
            className="w-full"
          >
            {copiedCodes ? (
              <><Check className="h-4 w-4 mr-2" /> Copied!</>
            ) : (
              <><Copy className="h-4 w-4 mr-2" /> Copy All Codes</>
            )}
          </Button>
          <div className="p-4 bg-error/10 border border-error/30 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error font-medium">
                You won&apos;t see these codes again. Save them now or you may lose account access.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledgedBackupWarning}
                onChange={(e) => setAcknowledgedBackupWarning(e.target.checked)}
                className="rounded border-error/50 text-error focus:ring-error h-4 w-4"
              />
              <span className="text-sm text-foreground">
                I have saved these backup codes in a secure location
              </span>
            </label>
          </div>
          <Button
            onClick={handleBackupCodesAcknowledged}
            className="w-full"
            disabled={!acknowledgedBackupWarning}
          >
            Done
          </Button>
        </div>
      )}

      {/* Disable Flow */}
      {flow === 'disable' && (
        <div className="space-y-4">
          <div className="p-3 bg-error-muted border border-error/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-error" />
              <p className="text-sm text-error font-semibold">Disable Two-Factor Authentication?</p>
            </div>
            <p className="text-xs text-error/80">
              Your account will be less secure. Enter your current authenticator code to confirm.
            </p>
          </div>
          {renderCodeInput()}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleDisable}
              disabled={isProcessing || getCodeString().length !== 6}
              className="flex-1 bg-error hover:bg-error/90 text-white"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Disable
            </Button>
          </div>
        </div>
      )}

      {/* Regenerate Flow */}
      {flow === 'regenerate' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Enter your current authenticator code to generate new backup codes.
            This will invalidate all previous backup codes.
          </p>
          {renderCodeInput()}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleRegenerate}
              disabled={isProcessing || getCodeString().length !== 6}
              className="flex-1"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

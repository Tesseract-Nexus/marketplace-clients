import React from 'react';
import { Check, X } from 'lucide-react';
import { calculatePasswordStrength, getPasswordStrengthBarColor, getPasswordStrengthWidth } from '../lib/utils/passwordStrength';

interface PasswordStrengthIndicatorProps {
  password: string;
  show?: boolean;
}

export function PasswordStrengthIndicator({ password, show = true }: PasswordStrengthIndicatorProps) {
  if (!show || !password) return null;

  const result = calculatePasswordStrength(password);
  const barColor = getPasswordStrengthBarColor(result.strength);
  const barWidth = getPasswordStrengthWidth(result.score);

  return (
    <div className="space-y-3 p-4 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)] animate-in slide-in-from-top-2">
      {/* Strength bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--foreground)]">Password Strength</span>
          <span className={`text-sm font-bold ${result.color} capitalize`}>
            {result.strength}
          </span>
        </div>

        <div className="h-2 bg-[var(--surface-tertiary)] rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300 ease-out`}
            style={{ width: barWidth }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-[var(--foreground-secondary)]">Requirements:</p>
        <div className="grid grid-cols-2 gap-1.5">
          <RequirementItem
            met={password.length >= 8}
            text="8+ characters"
          />
          <RequirementItem
            met={/[A-Z]/.test(password)}
            text="Uppercase"
          />
          <RequirementItem
            met={/[a-z]/.test(password)}
            text="Lowercase"
          />
          <RequirementItem
            met={/[0-9]/.test(password)}
            text="Number"
          />
          <RequirementItem
            met={/[^A-Za-z0-9]/.test(password)}
            text="Special char"
          />
          <RequirementItem
            met={password.length >= 12}
            text="12+ chars (bonus)"
          />
        </div>
      </div>
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
        met ? 'bg-sage-500' : 'bg-[var(--surface-tertiary)]'
      }`}>
        {met ? (
          <Check className="w-2.5 h-2.5 text-white" />
        ) : (
          <X className="w-2.5 h-2.5 text-[var(--foreground-tertiary)]" />
        )}
      </div>
      <span className={`text-xs ${
        met ? 'text-[var(--foreground)]' : 'text-[var(--foreground-tertiary)]'
      }`}>
        {text}
      </span>
    </div>
  );
}

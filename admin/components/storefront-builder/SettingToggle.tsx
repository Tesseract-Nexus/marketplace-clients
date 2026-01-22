'use client';

/**
 * SettingToggle Component
 *
 * A beautiful toggle switch for settings with label and optional description.
 * Uses shadcn Switch component with enhanced styling.
 */

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  variant?: 'default' | 'card';
  className?: string;
}

export function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  variant = 'default',
  className,
}: SettingToggleProps) {
  const isCard = variant === 'card';

  return (
    <label
      className={cn(
        'flex items-center justify-between gap-4 cursor-pointer',
        isCard && [
          'p-4 rounded-xl border transition-all duration-200',
          checked
            ? 'border-primary/30 bg-primary/10/50'
            : 'border-border bg-white hover:border-border',
        ],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'block font-medium',
            isCard ? 'text-sm text-foreground' : 'text-sm text-foreground',
            checked && isCard && 'text-primary'
          )}
        >
          {label}
        </span>
        {description && (
          <span
            className={cn(
              'block text-xs mt-0.5',
              checked && isCard ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {description}
          </span>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={cn(
          'shrink-0',
          checked && 'data-[state=checked]:bg-primary'
        )}
      />
    </label>
  );
}

export default SettingToggle;

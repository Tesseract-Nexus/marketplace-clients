'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, onCheckedChange, onChange, ...props }, ref) => {
    const id = React.useId();
    const inputId = props.id || id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    if (label || description) {
      return (
        <label htmlFor={inputId} className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              id={inputId}
              ref={ref}
              className="peer sr-only"
              onChange={handleChange}
              {...props}
            />
            <div
              className={cn(
                'w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center',
                'peer-checked:bg-primary',
                'peer-checked:border-transparent peer-checked:shadow-md peer-checked:shadow-primary/30',
                'peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2',
                'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
                'border-border hover:border-primary/70',
                'group-hover:border-primary/70',
                className
              )}
            >
              <CheckIcon className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
          </div>
          {(label || description) && (
            <div className="flex-1">
              {label && (
                <span className="font-semibold text-foreground block">{label}</span>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          )}
        </label>
      );
    }

    return (
      <div className="relative inline-flex items-center justify-center">
        <input
          type="checkbox"
          id={inputId}
          ref={ref}
          className="peer sr-only"
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            'w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center',
            'peer-checked:bg-primary',
            'peer-checked:border-transparent peer-checked:shadow-md peer-checked:shadow-primary/30',
            'peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2',
            'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
            'border-border hover:border-primary/70 cursor-pointer',
            className
          )}
        >
          <CheckIcon className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };

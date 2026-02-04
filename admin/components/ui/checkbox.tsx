'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

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

    const checkboxStyles = cn(
      'w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center',
      'transition-all duration-150 ease-out',
      'border-muted-foreground/40 hover:border-accent/70',
      'peer-checked:bg-accent peer-checked:border-accent',
      'peer-checked:scale-100 scale-100',
      'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
      'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:hover:border-muted-foreground/40',
      className
    );

    const checkmarkStyles = cn(
      'w-3 h-3 text-accent-foreground',
      'transition-all duration-150 ease-out',
      'opacity-0 scale-0',
      'peer-checked:opacity-100 peer-checked:scale-100'
    );

    if (label || description) {
      return (
        <label htmlFor={inputId} className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              id={inputId}
              ref={ref}
              className="peer sr-only"
              onChange={handleChange}
              {...props}
            />
            <div className={cn(checkboxStyles, 'group-hover:border-accent/70')}>
              <Check className={checkmarkStyles} strokeWidth={3} />
            </div>
          </div>
          {(label || description) && (
            <div className="flex-1">
              {label && (
                <span className="font-medium text-foreground block">{label}</span>
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
        <div className={cn(checkboxStyles, 'cursor-pointer')}>
          <Check className={checkmarkStyles} strokeWidth={3} />
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };

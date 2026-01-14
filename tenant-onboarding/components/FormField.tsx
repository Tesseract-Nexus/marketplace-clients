import React from 'react';
import { Input } from '@workspace/ui';
import { Label } from '@workspace/ui';
import { Check, Loader2, AlertCircle, LucideIcon } from 'lucide-react';
import type { FieldState } from '../lib/hooks/useFieldValidation';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  fieldState?: FieldState;
  icon?: LucideIcon;
  required?: boolean;
}

export function FormField({
  label,
  error,
  fieldState = 'idle',
  icon: Icon,
  required,
  className = '',
  ...props
}: FormFieldProps) {
  const hasError = error || fieldState === 'error';
  const isSuccess = fieldState === 'success';
  const isValidating = fieldState === 'validating';

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="text-[var(--foreground)] font-semibold flex items-center">
        {Icon && <Icon className="w-4 h-4 mr-2" />}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative">
        <Input
          {...props}
          className={`h-14 rounded-xl bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:ring-4 transition-all duration-200 pr-12 ${
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : isSuccess
              ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
              : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20'
          } ${className}`}
        />

        {/* Validation indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          {isValidating && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}
          {isSuccess && (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          {hasError && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 mt-2 text-sm text-red-600 animate-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

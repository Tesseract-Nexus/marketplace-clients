import React from 'react';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { Check, Loader2, AlertCircle, LucideIcon } from 'lucide-react';
import type { FieldState } from '../lib/hooks/useFieldValidation';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  fieldState?: FieldState;
  icon?: LucideIcon;
  required?: boolean;
  hint?: string;
}

export function FormField({
  label,
  error,
  fieldState = 'idle',
  icon: Icon,
  required,
  hint,
  className = '',
  ...props
}: FormFieldProps) {
  const hasError = error || fieldState === 'error';
  const isSuccess = fieldState === 'success';
  const isValidating = fieldState === 'validating';

  return (
    <div className="space-y-2.5">
      {/* Label with icon */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor={props.id}
          className={cn(
            "text-sm font-semibold tracking-tight",
            "flex items-center gap-2",
            "text-foreground/90"
          )}
        >
          {Icon && (
            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-secondary/80">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </span>
          )}
          {label}
          {required && (
            <span className="text-destructive/80 text-xs font-medium">*</span>
          )}
        </Label>
        {hint && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </div>

      {/* Input wrapper with validation indicator */}
      <div className="relative group">
        <Input
          {...props}
          data-success={isSuccess}
          aria-invalid={hasError ? "true" : undefined}
          className={cn(
            // Base styling
            "h-12 rounded-xl pr-12",
            "bg-background",
            "text-foreground placeholder:text-muted-foreground/60",
            // Focus ring
            "focus-visible:ring-2",
            // Conditional border colors
            hasError && [
              "border-destructive/70",
              "focus-visible:border-destructive focus-visible:ring-destructive/20",
            ],
            isSuccess && [
              "border-sage-500/70",
              "focus-visible:border-sage-500 focus-visible:ring-sage-500/20",
            ],
            !hasError && !isSuccess && [
              "border-border/60",
              "hover:border-border",
              "focus-visible:border-ring focus-visible:ring-ring/20",
            ],
            className
          )}
        />

        {/* Validation indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          {isValidating && (
            <div className="flex items-center justify-center w-5 h-5">
              <Loader2 className="w-4 h-4 text-ring animate-spin" />
            </div>
          )}
          {isSuccess && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-sage-500 shadow-sm shadow-sage-500/30">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
          )}
          {hasError && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-destructive/10">
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
          )}
        </div>
      </div>

      {/* Error message with subtle background for visibility */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}

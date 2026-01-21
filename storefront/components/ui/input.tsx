import * as React from "react"
import { Check, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  /** Show success state with checkmark icon */
  isValid?: boolean
  /** Show error state with alert icon */
  isInvalid?: boolean
  /** Helper text shown below input */
  helperText?: string
  /** Error message shown below input (takes precedence over helperText) */
  errorText?: string
}

function Input({
  className,
  type,
  isValid,
  isInvalid,
  helperText,
  errorText,
  id,
  ...props
}: InputProps) {
  const inputId = id || React.useId()
  const helperId = `${inputId}-helper`
  const errorId = `${inputId}-error`
  const showError = isInvalid && errorText
  const showHelper = helperText && !showError

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          id={inputId}
          type={type}
          data-slot="input"
          aria-invalid={isInvalid}
          aria-describedby={showError ? errorId : showHelper ? helperId : undefined}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            // Enhanced transitions
            "transition-all duration-200 ease-out",
            // Tenant-aware focus states
            "focus-visible:border-[var(--tenant-primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--tenant-primary)]/20",
            "hover:border-[var(--tenant-primary)]/50",
            // Error states
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            // Success states
            isValid && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20",
            // Add padding for validation icons
            (isValid || isInvalid) && "pr-10",
            className
          )}
          {...props}
        />
        {/* Validation icons - WCAG compliant (not color-only) */}
        {isValid && !isInvalid && (
          <Check
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600 pointer-events-none"
            aria-hidden="true"
          />
        )}
        {isInvalid && (
          <AlertCircle
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>
      {/* Helper/Error text */}
      {showError && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-destructive">
          {errorText}
        </p>
      )}
      {showHelper && (
        <p id={helperId} className="mt-1.5 text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  )
}

// Floating label input variant
interface FloatingInputProps extends React.ComponentProps<"input"> {
  label: string;
}

function FloatingInput({ className, label, id, ...props }: FloatingInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="relative">
      <input
        id={inputId}
        data-slot="input"
        placeholder=" "
        className={cn(
          "peer h-12 w-full rounded-lg border border-input bg-transparent px-4 pt-5 pb-2 text-base outline-none",
          "transition-all duration-200 ease-out",
          "placeholder-shown:pt-3.5",
          "focus-visible:border-[var(--tenant-primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--tenant-primary)]/20",
          "hover:border-[var(--tenant-primary)]/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className
        )}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
          "transition-all duration-200 ease-out origin-left",
          "peer-focus-visible:top-3 peer-focus-visible:text-xs peer-focus-visible:text-[var(--tenant-primary)] peer-focus-visible:font-medium",
          "peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium",
          "peer-aria-invalid:text-destructive"
        )}
      >
        {label}
      </label>
    </div>
  )
}

export { Input, FloatingInput }

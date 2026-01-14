import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Enhanced transitions
        "transition-all duration-200 ease-out",
        // Tenant-aware focus states
        "focus-visible:border-[var(--tenant-primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--tenant-primary)]/20",
        "hover:border-[var(--tenant-primary)]/50",
        // Error states
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
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
